/**
 * MCP Server - Model Context Protocol server implementation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerAnalyzeTools } from './tools/analyze/index.js';
import { registerGenerateTools } from './tools/generate/index.js';
import { registerValidateTools } from './tools/validate/index.js';
import { scanRepository } from '../analyzer/repository-scanner.js';
import { mapDependencies } from '../analyzer/dependency-mapper.js';
import { identifyFailureModes } from '../failure-modes/failure-identifier.js';
import { extractAlerts } from '../alerts/alert-extractor.js';
import { identifyHealthChecks } from '../health-checks/check-identifier.js';
import { generateAlerts } from '../alerts/alert-generator.js';
import { generateDashboard } from '../dashboards/dashboard-generator.js';
import { generateRollbackProcedures } from '../rollback/rollback-generator.js';
import { generateIncidentWorkflows } from '../incident/workflow-generator.js';
import { generateServiceMap } from '../service-map/graph-generator.js';
import { generateHealthChecks } from '../health-checks/check-generator.js';
import { validateCompleteness } from '../runbook/runbook-builder.js';
import {
  createCiValidationResult,
  generateRunbookArtifacts,
  validateRunbookAccuracy,
  validateRunbookLinks,
} from '../runbook/pipeline.js';
import type {
  AnalysisContext,
  Runbook,
  MonitoringPlatform,
  DeploymentPlatform,
  ServiceDependency,
} from '../types/domain.js';

export interface MCPServerConfig {
  name: string;
  version: string;
  rateLimitAnalyze?: number;
  rateLimitGenerate?: number;
  rateLimitValidate?: number;
  timeoutAnalyze?: number;
  timeoutGenerate?: number;
  timeoutValidate?: number;
}

interface SimpleAnalysisContext {
  path?: string;
  repository?: string;
  serviceName?: string;
  service_type?: string;
}

interface ServiceContext {
  serviceName?: string;
  path?: string;
}

interface DeploymentConfig {
  platform?: string;
}

interface TeamConfig {
  teamName?: string;
}

interface Thresholds {
  completeness_min?: number;
  accuracy_min?: number;
}

interface ToolArgs {
  path?: string;
  repository?: string;
  serviceName?: string;
  analysis_context?: AnalysisContext | SimpleAnalysisContext;
  service_context?: ServiceContext;
  deployment_config?: DeploymentConfig;
  failure_scenarios?: string[];
  platform?: string;
  slo_targets?: { availability?: number; latencyP99?: number };
  team_config?: TeamConfig;
  format?: string;
  runbook?: Runbook;
  required_sections?: string[];
  thresholds?: Thresholds;
  depth?: string;
  include_dev?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  check(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }
}

function getRepoPath(args: ToolArgs): string {
  if (args.path) return args.path;
  if (args.repository) return args.repository;
  if (args.analysis_context && 'path' in args.analysis_context) {
    return args.analysis_context.path || '.';
  }
  if (args.analysis_context && 'repository' in args.analysis_context) {
    return args.analysis_context.repository || '.';
  }
  return '.';
}

function getServiceName(args: ToolArgs): string {
  if (args.serviceName) return args.serviceName;
  if (args.analysis_context && 'serviceName' in args.analysis_context) {
    return args.analysis_context.serviceName || 'unknown-service';
  }
  return 'unknown-service';
}

async function buildAnalysisContext(args: ToolArgs): Promise<AnalysisContext> {
  const repoPath = getRepoPath(args);
  const serviceName = getServiceName(args);

  const repositoryAnalysis = await scanRepository(repoPath);
  const dependencyAnalysis = mapDependencies(repoPath);

  return {
    serviceDefinition: {
      name: serviceName || repositoryAnalysis.serviceName || 'unknown-service',
      description: repositoryAnalysis.description,
      repository: repoPath,
    },
    repositoryAnalysis,
    dependencyAnalysis,
    deploymentPlatform: 'unknown' as DeploymentPlatform,
    monitoringPlatform: 'unknown' as MonitoringPlatform,
    externalServices: repositoryAnalysis.externalServices,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const TOOL_LAYER_MAP: Record<string, 'analyze' | 'generate' | 'validate'> = {
  'runbook.analyze.': 'analyze',
  'runbook.generate.': 'generate',
  'runbook.validate.': 'validate',
};

function getToolLayer(name: string): 'analyze' | 'generate' | 'validate' {
  for (const [prefix, layer] of Object.entries(TOOL_LAYER_MAP)) {
    if (name.startsWith(prefix)) return layer;
  }
  return 'analyze';
}

/**
 * MCP Server for runbook generation tools
 */
export class RunbookMCPServer {
  private server: Server;
  private config: MCPServerConfig;
  private rateLimiters: Map<string, RateLimiter>;
  private timeouts: Map<string, number>;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.rateLimiters = new Map([
      ['analyze', new RateLimiter(config.rateLimitAnalyze ?? 30, 60_000)],
      ['generate', new RateLimiter(config.rateLimitGenerate ?? 10, 60_000)],
      ['validate', new RateLimiter(config.rateLimitValidate ?? 30, 60_000)],
    ]);

    this.timeouts = new Map([
      ['analyze', config.timeoutAnalyze ?? 60_000],
      ['generate', config.timeoutGenerate ?? 300_000],
      ['validate', config.timeoutValidate ?? 60_000],
    ]);

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [
        ...registerAnalyzeTools(),
        ...registerGenerateTools(),
        ...registerValidateTools(),
      ];
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const layer = getToolLayer(name);

      const limiter = this.rateLimiters.get(layer);
      if (limiter && !limiter.check(name)) {
        return this.errorResponse(`Rate limit exceeded for ${name}. Please retry later.`);
      }

      const timeout = this.timeouts.get(layer) ?? 60_000;

      try {
        const resultPromise = (async () => {
          if (name.startsWith('runbook.analyze.')) {
            return await this.handleAnalyzeTool(name, args as ToolArgs);
          } else if (name.startsWith('runbook.generate.')) {
            return await this.handleGenerateTool(name, args as ToolArgs);
          } else if (name.startsWith('runbook.validate.')) {
            return await this.handleValidateTool(name, args as ToolArgs);
          }
          throw new Error(`Unknown tool: ${name}`);
        })();

        return await withTimeout(resultPromise, timeout);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error(`[MCP Server] Tool error in ${name}:`, {
          error: errorMessage,
          stack: errorStack,
          toolName: name,
        });

        return this.errorResponse(errorMessage);
      }
    });
  }

  private async handleAnalyzeTool(name: string, args: ToolArgs) {
    switch (name) {
      case 'runbook.analyze.repository': {
        const repoPath = getRepoPath(args);
        const result = await scanRepository(repoPath, {
          depth: args.depth ? parseInt(args.depth, 10) : undefined,
        });
        return this.successResponse(result);
      }

      case 'runbook.analyze.dependencies': {
        const repoPath = getRepoPath(args);
        const result = mapDependencies(repoPath);
        return this.successResponse(result);
      }

      case 'runbook.analyze.failure_modes': {
        const repoPath = getRepoPath(args);
        const context = await buildAnalysisContext(args);
        const result = identifyFailureModes(repoPath, context);
        return this.successResponse(result);
      }

      case 'runbook.analyze.alerts': {
        const repoPath = getRepoPath(args);
        const result = extractAlerts(repoPath);
        return this.successResponse(result);
      }

      case 'runbook.analyze.health_checks': {
        const context = await buildAnalysisContext(args);
        const repoPath = getRepoPath(args);
        const result = identifyHealthChecks(repoPath, context);
        return this.successResponse(result);
      }

      default:
        throw new Error(`Unknown analysis tool: ${name}`);
    }
  }

  private async handleGenerateTool(name: string, args: ToolArgs) {
    switch (name) {
      case 'runbook.generate.full': {
        const runbookPath = getRepoPath(args);
        const serviceName = getServiceName(args);
        const { runbook } = await generateRunbookArtifacts({
          path: runbookPath,
          serviceName,
        });
        return this.successResponse({ runbook, sections: runbook.sections.length });
      }

      case 'runbook.generate.alerts': {
        const context = await buildAnalysisContext(args);
        const serviceName = getServiceName(args);
        const sloTargets = args.slo_targets;
        const alerts = generateAlerts(context, {
          sloTargets:
            sloTargets?.availability !== undefined
              ? (sloTargets as { availability: number; latencyP99: number })
              : undefined,
          serviceName,
          platform: args.platform as 'prometheus' | 'datadog' | 'cloudwatch' | undefined,
        });
        return this.successResponse({ alert_definitions: alerts });
      }

      case 'runbook.generate.dashboard': {
        const context = await buildAnalysisContext(args);
        const serviceName = getServiceName(args);
        const platform = (args.platform as MonitoringPlatform) || 'grafana';
        const result = generateDashboard(context, { platform, serviceName });
        return this.successResponse(result);
      }

      case 'runbook.generate.rollback': {
        const context = await buildAnalysisContext(args);
        const platform = (args.deployment_config?.platform as DeploymentPlatform) || 'unknown';
        const result = Object.values(generateRollbackProcedures(context, platform));
        return this.successResponse(result);
      }

      case 'runbook.generate.incident_workflow': {
        const context = await buildAnalysisContext(args);
        const serviceName = getServiceName(args);
        const teamName = args.team_config?.teamName || 'platform';
        const result = generateIncidentWorkflows(context, { serviceName, teamName });
        return this.successResponse(result);
      }

      case 'runbook.generate.service_map': {
        const context = await buildAnalysisContext(args);
        const serviceName = getServiceName(args);
        const deps = mapDependencies(getRepoPath(args));
        const dependencies: ServiceDependency[] = deps.externalServices.map((es) => ({
          name: es.name,
          type: es.type,
          direction: 'downstream' as const,
          protocol: 'tcp' as const,
          critical: true,
          description: `External service via ${es.connectionEnvVar || 'environment variable'}`,
        }));
        const result = generateServiceMap(dependencies, serviceName, context);
        return this.successResponse(result);
      }

      case 'runbook.generate.health_checks': {
        const context = await buildAnalysisContext(args);
        const serviceName = getServiceName(args);
        const platform = args.platform || 'kubernetes';
        const repoPath = getRepoPath(args);
        const result = generateHealthChecks(repoPath, context, {
          platform: platform as 'kubernetes' | 'load-balancer' | 'prometheus' | 'datadog',
          serviceName,
        });
        return this.successResponse({ checks: result, platform });
      }

      default:
        throw new Error(`Unknown generation tool: ${name}`);
    }
  }

  private async handleValidateTool(name: string, args: ToolArgs) {
    switch (name) {
      case 'runbook.validate.completeness': {
        const runbook = args.runbook as unknown as Record<string, unknown>;
        if (!runbook) {
          throw new Error('runbook is required');
        }
        const result = validateCompleteness(runbook, { requiredSections: args.required_sections });
        return this.successResponse(result);
      }

      case 'runbook.validate.accuracy': {
        const runbook = args.runbook as unknown as Record<string, unknown>;
        if (!runbook) {
          throw new Error('runbook is required');
        }
        if (!args.analysis_context) {
          throw new Error('analysis_context is required');
        }
        const context = await buildAnalysisContext(args);
        const result = validateRunbookAccuracy(runbook, context);
        return this.successResponse({
          accuracy_score: result.accuracyScore,
          discrepancies: result.discrepancies,
        });
      }

      case 'runbook.validate.links': {
        const runbook = args.runbook as unknown as Record<string, unknown>;
        if (!runbook) {
          throw new Error('runbook is required');
        }
        const result = validateRunbookLinks(runbook);
        return this.successResponse({
          valid_links: result.validLinks,
          broken_links: result.brokenLinks,
        });
      }

      case 'runbook.validate.ci': {
        const runbook = args.runbook as unknown as Record<string, unknown>;
        if (!runbook) {
          throw new Error('runbook is required');
        }
        const completenessResult = validateCompleteness(runbook, {
          requiredSections: args.required_sections,
        });
        const context = args.analysis_context ? await buildAnalysisContext(args) : null;
        const accuracyResult = context
          ? validateRunbookAccuracy(runbook, context)
          : { accuracyScore: 1, discrepancies: [] };
        const result = createCiValidationResult(
          runbook,
          completenessResult,
          accuracyResult,
          args.thresholds,
        );
        return this.successResponse(result);
      }

      default:
        throw new Error(`Unknown validation tool: ${name}`);
    }
  }

  private successResponse(result: unknown) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private errorResponse(errorMessage: string) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true as const,
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`MCP Server ${this.config.name} v${this.config.version} started`);
  }

  async stop(): Promise<void> {
    await this.server.close();
    console.error('MCP Server stopped');
  }
}

export async function createMCPServer(
  config?: Partial<MCPServerConfig>,
): Promise<RunbookMCPServer> {
  const serverConfig: MCPServerConfig = {
    name: 'agent-runbook-generator',
    version: '1.0.0',
    ...config,
  };

  const server = new RunbookMCPServer(serverConfig);
  await server.start();
  return server;
}
