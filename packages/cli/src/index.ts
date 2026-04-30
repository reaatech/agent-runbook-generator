export type {
  ServiceDefinition,
  Runbook,
  RunbookSection,
  AlertDefinition,
  DashboardConfig,
  FailureMode,
  RollbackProcedure,
  IncidentWorkflow,
  EscalationPolicy,
  ServiceDependency,
  HealthCheck,
  HealthCheckItem,
  AnalysisContext,
  GenerationConfig,
  RunbookMetadata,
} from '@reaatech/agent-runbook';

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
} from '@reaatech/agent-runbook';

export type {
  RepositoryAnalysis,
  RepositoryStructure,
  EntryPoint,
  ExternalService,
  Dependency,
  DependencyAnalysis,
  DependencyNode,
} from '@reaatech/agent-runbook';

export type {
  DashboardPanel,
  GridPosition,
  ThresholdConfig,
  DashboardVariable,
} from '@reaatech/agent-runbook';

export type {
  RollbackStep,
  VerificationStep,
  RollbackCheck,
  RollbackCapability,
} from '@reaatech/agent-runbook';

export type {
  WorkflowStep,
  EscalationMatrix,
  MatrixLevel,
  CommunicationTemplate,
} from '@reaatech/agent-runbook';

export type {
  ServiceMap,
  ServiceNode,
  ServiceEdge,
  CriticalPath,
  AnalysisInsight,
  CompletenessResult,
  AccuracyResult,
  LinkValidationResult,
  BrokenLinkInfo,
  LinkInfo,
  AccuracyDiscrepancy,
} from '@reaatech/agent-runbook';

export type { SLOTargets } from '@reaatech/agent-runbook';

export {
  generateId,
  fileExists,
  directoryExists,
  readFile,
  readJsonFile,
  listFiles,
} from '@reaatech/agent-runbook';

export { scanRepository } from '@reaatech/agent-runbook-analyzer';
export { mapDependencies } from '@reaatech/agent-runbook-analyzer';
export { parseConfigs } from '@reaatech/agent-runbook-analyzer';
export { analyzeCode } from '@reaatech/agent-runbook-analyzer';

export { extractAlerts } from '@reaatech/agent-runbook-alerts';
export { generateAlerts } from '@reaatech/agent-runbook-alerts';
export { calculateSloThresholds } from '@reaatech/agent-runbook-alerts';

export { identifyMetrics } from '@reaatech/agent-runbook-dashboards';
export { generateDashboard } from '@reaatech/agent-runbook-dashboards';

export { identifyFailureModes } from '@reaatech/agent-runbook-failure-modes';
export {
  getFailureModesByCategory,
  getAllFailureModes,
} from '@reaatech/agent-runbook-failure-modes';
export { generateMitigations } from '@reaatech/agent-runbook-failure-modes';

export { analyzeDeployment } from '@reaatech/agent-runbook-rollback';
export { generateRollbackProcedures } from '@reaatech/agent-runbook-rollback';
export { generateVerificationSteps } from '@reaatech/agent-runbook-rollback';

export { buildRunbook, generateTOC, validateCompleteness } from '@reaatech/agent-runbook-runbook';
export {
  exportRunbook,
  formatAsMarkdown,
  formatAsHTML,
  formatAsPDF,
} from '@reaatech/agent-runbook-runbook';
export { getTemplateById, getAllTemplates, applyTemplate } from '@reaatech/agent-runbook-runbook';
export {
  generateRunbookArtifacts,
  parseRunbookDocument,
  parseMarkdownRunbook,
  validateRunbookAccuracy,
  validateRunbookLinks,
  createCiValidationResult,
} from '@reaatech/agent-runbook-runbook';

export {
  generateIncidentWorkflows,
  generateStandardWorkflow,
  generateEscalationPolicy,
} from '@reaatech/agent-runbook-incident';
export {
  getTemplatesByCategory,
  getTemplateByName,
  applyTemplateVariables,
  createTemplate,
} from '@reaatech/agent-runbook-incident';

export { analyzeDependencies } from '@reaatech/agent-runbook-service-map';
export {
  generateServiceMap,
  exportGraph,
  generateServiceMapSummary,
} from '@reaatech/agent-runbook-service-map';

export { identifyHealthChecks } from '@reaatech/agent-runbook-health-checks';
export {
  generateHealthChecks,
  generateKubernetesProbeYaml,
  generateHealthCheckEndpoint,
} from '@reaatech/agent-runbook-health-checks';

export { AnalysisAgent, createAnalysisAgent } from '@reaatech/agent-runbook-agent';
export { generatePrompt } from '@reaatech/agent-runbook-agent';
export { createProviderAdapter } from '@reaatech/agent-runbook-agent';

export { RunbookMCPServer, createMCPServer } from '@reaatech/agent-runbook-mcp';

export {
  initLogger,
  getLogger,
  info,
  warn,
  error,
  debug,
} from '@reaatech/agent-runbook-observability';
export {
  initTracing,
  startAnalysisSpan,
  startGenerationSpan,
  startValidationSpan,
} from '@reaatech/agent-runbook-observability';
export {
  initMetrics,
  recordGeneration,
  recordSectionGenerated,
  recordAgentCall,
  recordAnalysisDuration,
  recordAgentCost,
  recordCompleteness,
} from '@reaatech/agent-runbook-observability';

import type { Runbook } from '@reaatech/agent-runbook';
import { exportRunbook } from '@reaatech/agent-runbook-runbook';
import { generateRunbookArtifacts } from '@reaatech/agent-runbook-runbook';

export interface GenerateRunbookOptions {
  path: string;
  output?: string;
  format?: 'markdown' | 'html';
  sections?: string[];
  provider?: 'claude' | 'openai' | 'gemini' | 'mock';
  model?: string;
}

export async function generateRunbook(options: GenerateRunbookOptions): Promise<Runbook> {
  const { runbook } = await generateRunbookArtifacts({
    path: options.path,
    sections: options.sections,
  });
  return runbook;
}

export const formatRunbook = exportRunbook;

export const VERSION = '1.0.0';
