export type {
  AccuracyDiscrepancy,
  AccuracyResult,
  AlertDefinition,
  AlertSeverity,
  AnalysisContext,
  AnalysisInsight,
  BrokenLinkInfo,
  CommunicationTemplate,
  CompletenessResult,
  CriticalPath,
  DashboardConfig,
  DashboardPanel,
  DashboardVariable,
  Dependency,
  DependencyAnalysis,
  DependencyNode,
  DeploymentPlatform,
  EntryPoint,
  EscalationMatrix,
  EscalationPolicy,
  ExportFormat,
  ExternalService,
  FailureCategory,
  FailureMode,
  FailureSeverity,
  Framework,
  GenerationConfig,
  GridPosition,
  HealthCheck,
  HealthCheckItem,
  IncidentWorkflow,
  LinkInfo,
  LinkValidationResult,
  MatrixLevel,
  MonitoringPlatform,
  ProgrammingLanguage,
  RepositoryAnalysis,
  RepositoryStructure,
  RollbackCapability,
  RollbackCheck,
  RollbackProcedure,
  RollbackStep,
  Runbook,
  RunbookMetadata,
  RunbookSection,
  ServiceDefinition,
  ServiceDependency,
  ServiceEdge,
  ServiceMap,
  ServiceNode,
  ServiceType,
  SLOTargets,
  ThresholdConfig,
  VerificationStep,
  WorkflowStep,
} from '@reaatech/agent-runbook';

export {
  directoryExists,
  fileExists,
  generateId,
  listFiles,
  readFile,
  readJsonFile,
} from '@reaatech/agent-runbook';
export {
  AnalysisAgent,
  createAnalysisAgent,
  createProviderAdapter,
  generatePrompt,
} from '@reaatech/agent-runbook-agent';
export {
  calculateSloThresholds,
  extractAlerts,
  generateAlerts,
} from '@reaatech/agent-runbook-alerts';
export {
  analyzeCode,
  mapDependencies,
  parseConfigs,
  scanRepository,
} from '@reaatech/agent-runbook-analyzer';
export { generateDashboard, identifyMetrics } from '@reaatech/agent-runbook-dashboards';
export {
  generateMitigations,
  getAllFailureModes,
  getFailureModesByCategory,
  identifyFailureModes,
} from '@reaatech/agent-runbook-failure-modes';
export {
  generateHealthCheckEndpoint,
  generateHealthChecks,
  generateKubernetesProbeYaml,
  identifyHealthChecks,
} from '@reaatech/agent-runbook-health-checks';
export {
  applyTemplateVariables,
  createTemplate,
  generateEscalationPolicy,
  generateIncidentWorkflows,
  generateStandardWorkflow,
  getTemplateByName,
  getTemplatesByCategory,
} from '@reaatech/agent-runbook-incident';
export { createMCPServer, RunbookMCPServer } from '@reaatech/agent-runbook-mcp';
export {
  debug,
  error,
  getLogger,
  info,
  initLogger,
  initMetrics,
  initTracing,
  recordAgentCall,
  recordAgentCost,
  recordAnalysisDuration,
  recordCompleteness,
  recordGeneration,
  recordSectionGenerated,
  startAnalysisSpan,
  startGenerationSpan,
  startValidationSpan,
  warn,
} from '@reaatech/agent-runbook-observability';
export {
  analyzeDeployment,
  generateRollbackProcedures,
  generateVerificationSteps,
} from '@reaatech/agent-runbook-rollback';
export {
  applyTemplate,
  buildRunbook,
  createCiValidationResult,
  exportRunbook,
  formatAsHTML,
  formatAsMarkdown,
  formatAsPDF,
  generateRunbookArtifacts,
  generateTOC,
  getAllTemplates,
  getTemplateById,
  parseMarkdownRunbook,
  parseRunbookDocument,
  validateCompleteness,
  validateRunbookAccuracy,
  validateRunbookLinks,
} from '@reaatech/agent-runbook-runbook';
export {
  analyzeDependencies,
  exportGraph,
  generateServiceMap,
  generateServiceMapSummary,
} from '@reaatech/agent-runbook-service-map';

import type { Runbook } from '@reaatech/agent-runbook';
import { exportRunbook, generateRunbookArtifacts } from '@reaatech/agent-runbook-runbook';

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
