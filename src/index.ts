/**
 * agent-runbook-generator - Library entry point
 *
 * Generate operator runbooks from service repositories using AI
 */

// Re-export explicitly to avoid name collisions from barrel exports
export type {
  ServiceDefinition,
  Runbook,
  RunbookSection,
  AlertDefinition,
  DashboardConfig,
  FailureMode,
  RollbackProcedure,
  IncidentWorkflow,
  ServiceDependency,
  HealthCheck,
  AnalysisContext,
  GenerationConfig,
  RunbookMetadata,
} from './types/domain.js';

export type {
  ServiceType,
  ProgrammingLanguage,
  Framework,
  DeploymentPlatform,
  MonitoringPlatform,
  AlertSeverity,
  FailureCategory,
  FailureSeverity,
  ExportFormat,
} from './types/domain.js';

export type {
  RepositoryAnalysis,
  RepositoryStructure,
  EntryPoint,
  ExternalService,
  Dependency,
  DependencyAnalysis,
  DependencyNode,
} from './types/domain.js';

export type {
  DashboardPanel,
  GridPosition,
  ThresholdConfig,
  DashboardVariable,
} from './types/domain.js';

export type {
  RollbackStep,
  VerificationStep,
  RollbackCheck,
} from './types/domain.js';

export type {
  WorkflowStep,
  EscalationMatrix,
  MatrixLevel,
  CommunicationTemplate,
} from './types/domain.js';

export type {
  HealthCheckItem,
} from './types/domain.js';

export type {
  ServiceMap,
  ServiceNode,
  ServiceEdge,
  CriticalPath,
  AnalysisInsight,
  CompletenessResult,
  AccuracyResult,
  LinkValidationResult,
} from './types/domain.js';

export { generateId } from './utils/index.js';

// Analyzer
export { scanRepository } from './analyzer/repository-scanner.js';
export { mapDependencies } from './analyzer/dependency-mapper.js';
export { parseConfigs } from './analyzer/config-parser.js';
export { analyzeCode } from './analyzer/code-analyzer.js';

// Alert generation
export { extractAlerts } from './alerts/alert-extractor.js';
export { generateAlerts } from './alerts/alert-generator.js';
export { calculateSloThresholds } from './alerts/threshold-calculator.js';

// Dashboard generation
export { identifyMetrics } from './dashboards/metric-identifier.js';
export { generateDashboard } from './dashboards/dashboard-generator.js';

// Failure mode analysis
export { identifyFailureModes } from './failure-modes/failure-identifier.js';
export { getFailureModesByCategory, getAllFailureModes } from './failure-modes/failure-catalog.js';
export { generateMitigations } from './failure-modes/mitigation-generator.js';

// Rollback procedures
export { analyzeDeployment } from './rollback/deployment-analyzer.js';
export { generateRollbackProcedures } from './rollback/rollback-generator.js';
export { generateVerificationSteps } from './rollback/verification-generator.js';

// Runbook assembly
export { buildRunbook, generateTOC, validateCompleteness } from './runbook/runbook-builder.js';
export { exportRunbook, formatAsMarkdown, formatAsHTML, formatAsPDF } from './runbook/formatter.js';
export { getTemplateById, getAllTemplates, applyTemplate } from './runbook/templates.js';
export {
  generateRunbookArtifacts,
  parseRunbookDocument,
  parseMarkdownRunbook,
  validateRunbookAccuracy,
  validateRunbookLinks,
  createCiValidationResult,
} from './runbook/pipeline.js';

// Incident response
export { generateIncidentWorkflows, generateStandardWorkflow, generateEscalationPolicy } from './incident/workflow-generator.js';
export { getTemplatesByCategory, getTemplateByName, applyTemplateVariables, createTemplate } from './incident/communication-templates.js';

// Service mapping
export { analyzeDependencies } from './service-map/dependency-analyzer.js';
export { generateServiceMap, exportGraph, generateServiceMapSummary } from './service-map/graph-generator.js';

// Health checks
export { identifyHealthChecks } from './health-checks/check-identifier.js';
export { generateHealthChecks, generateKubernetesProbeYaml, generateHealthCheckEndpoint } from './health-checks/check-generator.js';

// Agent
export { AnalysisAgent, createAnalysisAgent } from './agent/analysis-agent.js';
export { generatePrompt } from './agent/prompt-templates.js';
export { createProviderAdapter } from './agent/provider-adapter.js';

// MCP Server
export { RunbookMCPServer, createMCPServer } from './mcp-server/mcp-server.js';

// Observability
export { initLogger, getLogger, info, warn, error, debug } from './observability/logger.js';
export { initTracing, startAnalysisSpan, startGenerationSpan, startValidationSpan } from './observability/tracing.js';
export { initMetrics, recordGeneration, recordSectionGenerated, recordAgentCall, recordAnalysisDuration, recordAgentCost, recordCompleteness } from './observability/metrics.js';

import { exportRunbook } from './runbook/formatter.js';
import { generateRunbookArtifacts } from './runbook/pipeline.js';
import type { Runbook } from './types/domain.js';

export interface GenerateRunbookOptions {
  path: string;
  output?: string;
  format?: 'markdown' | 'html';
  sections?: string[];
  provider?: 'claude' | 'openai' | 'gemini' | 'mock';
  model?: string;
}

export async function generateRunbook(
  options: GenerateRunbookOptions,
): Promise<Runbook> {
  const { runbook } = await generateRunbookArtifacts({
    path: options.path,
    sections: options.sections,
  });
  return runbook;
}

export const formatRunbook = exportRunbook;

export const VERSION = '1.0.0';
