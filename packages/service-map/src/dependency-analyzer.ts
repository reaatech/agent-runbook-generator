/**
 * Dependency Analyzer - Analyzes service dependencies from code
 */

import { type AnalysisContext, type ServiceDependency } from '@reaatech/agent-runbook';
import { listFiles, readFile } from '@reaatech/agent-runbook';
import * as path from 'path';

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  criticalPaths: CriticalPath[];
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'cache' | 'queue' | 'external';
  critical: boolean;
  description?: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: 'sync' | 'async';
  protocol?: string;
  critical: boolean;
}

export interface CriticalPath {
  name: string;
  description: string;
  services: string[];
  riskLevel: 'high' | 'medium' | 'low';
}

/**
 * Analyze service dependencies
 */
export function analyzeDependencies(
  repoPath: string,
  context: AnalysisContext,
): ServiceDependency[] {
  const dependencies: ServiceDependency[] = [];
  const externalServices = context.externalServices;

  // Add upstream dependencies from external services
  for (const service of externalServices) {
    dependencies.push({
      name: service.name,
      type: service.type,
      direction: 'upstream',
      protocol: 'tcp',
      critical: isCriticalService(service.type),
      description: `${service.type} dependency`,
    });
  }

  // Analyze code for additional dependencies
  const files = listFiles(repoPath, true);
  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    const relativePath = path.relative(repoPath, file);

    // Check for HTTP API calls
    const apiCalls = extractApiCalls(content);
    for (const api of apiCalls) {
      if (!dependencies.find((d) => d.name === api)) {
        dependencies.push({
          name: api,
          type: 'api',
          direction: 'upstream',
          protocol: 'http',
          critical: false,
          description: `External API dependency detected in ${relativePath}`,
        });
      }
    }

    // Check for message queue usage
    const queueCalls = extractQueueCalls(content);
    for (const queue of queueCalls) {
      if (!dependencies.find((d) => d.name === queue)) {
        dependencies.push({
          name: queue,
          type: 'queue',
          direction: 'upstream',
          protocol: 'async',
          critical: true,
          description: `Message queue dependency detected in ${relativePath}`,
        });
      }
    }
  }

  // Add downstream dependencies (services that depend on this service)
  const downstreamServices = extractDownstreamServices(context);
  for (const service of downstreamServices) {
    dependencies.push({
      name: service,
      type: 'service',
      direction: 'downstream',
      protocol: 'http',
      critical: false,
      description: `Downstream service depending on ${context.serviceDefinition.name}`,
    });
  }

  return dependencies;
}

/**
 * Check if a service type is critical
 */
function isCriticalService(type: string): boolean {
  return ['database', 'queue', 'auth'].includes(type);
}

/**
 * Extract API calls from code
 */
function extractApiCalls(content: string): string[] {
  const apis: string[] = [];

  // Match fetch calls
  const fetchMatches = content.matchAll(/fetch\(['"`]https?:\/\/([^'"]+)['"`]/g);
  for (const match of fetchMatches) {
    if (match[1]) {
      const host = match[1].split('/')[0];
      if (host && !apis.includes(host)) {
        apis.push(host);
      }
    }
  }

  // Match axios calls
  const axiosMatches = content.matchAll(
    /axios\.(get|post|put|delete|patch)\(['"`]https?:\/\/([^'"]+)['"`]/g,
  );
  for (const match of axiosMatches) {
    if (match[2]) {
      const host = match[2].split('/')[0];
      if (host && !apis.includes(host)) {
        apis.push(host);
      }
    }
  }

  return apis;
}

/**
 * Extract message queue calls from code
 */
function extractQueueCalls(content: string): string[] {
  const queues: string[] = [];

  // Match Kafka topics
  const kafkaMatches = content.matchAll(/kafka\.(produce|consume)\(['"`]([^'"]+)['"`]/g);
  for (const match of kafkaMatches) {
    if (match[2] && !queues.includes(match[2])) {
      queues.push(`kafka:${match[2]}`);
    }
  }

  // Match SQS queues
  const sqsMatches = content.matchAll(/sqs\.(sendMessage|receiveMessage)\(['"`]([^'"]+)['"`]/g);
  for (const match of sqsMatches) {
    if (match[2] && !queues.includes(match[2])) {
      queues.push(`sqs:${match[2]}`);
    }
  }

  // Match Redis pub/sub
  const redisMatches = content.matchAll(/redis\.(publish|subscribe)\(['"`]([^'"]+)['"`]/g);
  for (const match of redisMatches) {
    if (match[2] && !queues.includes(match[2])) {
      queues.push(`redis:${match[2]}`);
    }
  }

  return queues;
}

/**
 * Extract downstream services from context
 */
function extractDownstreamServices(context: AnalysisContext): string[] {
  const services: string[] = [];

  if (context.repositoryAnalysis.configFiles) {
    for (const configFile of context.repositoryAnalysis.configFiles) {
      if (
        configFile.includes('nginx') ||
        configFile.includes('ingress') ||
        configFile.includes('route')
      ) {
        services.push('api-gateway');
      }
    }
  }

  for (const ep of context.repositoryAnalysis.entryPoints) {
    if (ep.type === 'http_server') {
      services.push('frontend-client');
      services.push('mobile-client');
      break;
    }
  }

  return [...new Set(services)];
}

/**
 * Generate dependency graph
 */
export function generateDependencyGraph(
  dependencies: ServiceDependency[],
  serviceName: string,
): DependencyGraph {
  const nodes: DependencyNode[] = [
    {
      id: serviceName,
      name: serviceName,
      type: 'service',
      critical: true,
      description: 'Primary service',
    },
  ];

  const edges: DependencyEdge[] = [];

  for (const dep of dependencies) {
    nodes.push({
      id: dep.name,
      name: dep.name,
      type: mapDependencyType(dep.type),
      critical: dep.critical,
      description: dep.description,
    });

    edges.push({
      source: dep.direction === 'upstream' ? serviceName : dep.name,
      target: dep.direction === 'upstream' ? dep.name : serviceName,
      type: dep.type === 'queue' ? 'async' : 'sync',
      critical: dep.critical,
    });
  }

  // Identify critical paths
  const criticalPaths = identifyCriticalPaths(nodes, edges, serviceName);

  return { nodes, edges, criticalPaths };
}

/**
 * Map dependency type to node type
 */
function mapDependencyType(type: string): DependencyNode['type'] {
  switch (type) {
    case 'database':
      return 'database';
    case 'cache':
      return 'cache';
    case 'queue':
      return 'queue';
    case 'api':
    case 'external':
      return 'external';
    default:
      return 'service';
  }
}

/**
 * Identify critical paths in the dependency graph
 */
function identifyCriticalPaths(
  nodes: DependencyNode[],
  _edges: DependencyEdge[],
  serviceName: string,
): CriticalPath[] {
  const paths: CriticalPath[] = [];

  // Find paths through critical dependencies
  const criticalDeps = nodes.filter((n) => n.critical && n.id !== serviceName);

  for (const dep of criticalDeps) {
    paths.push({
      name: `${serviceName} → ${dep.name}`,
      description: `Critical path through ${dep.type} dependency`,
      services: [serviceName, dep.name],
      riskLevel: dep.type === 'database' ? 'high' : 'medium',
    });
  }

  return paths;
}

/**
 * Generate Mermaid diagram from dependency graph
 */
export function generateMermaidDiagram(graph: DependencyGraph): string {
  let mermaid = 'graph TD\n';

  // Add nodes
  for (const node of graph.nodes) {
    const shape = getNodeShape(node.type);
    mermaid += `    ${node.id.replace(/[^a-zA-Z0-9]/g, '_')}["${node.name}"]${shape}\n`;
  }

  // Add edges
  for (const edge of graph.edges) {
    const source = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
    const target = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
    const style = edge.critical ? '===>' : '-->';
    mermaid += `    ${source}${style}${target}\n`;
  }

  return mermaid;
}

/**
 * Get node shape based on type
 */
function getNodeShape(type: DependencyNode['type']): string {
  switch (type) {
    case 'database':
      return '[("")]';
    case 'cache':
      return '[( )]';
    case 'queue':
      return '>]';
    case 'external':
      return '{{}}';
    default:
      return '';
  }
}
