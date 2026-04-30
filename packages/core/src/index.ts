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
} from './domain.js';

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
} from './domain.js';

export type {
  RepositoryAnalysis,
  RepositoryStructure,
  EntryPoint,
  ExternalService,
  Dependency,
  DependencyAnalysis,
  DependencyNode,
} from './domain.js';

export type {
  DashboardPanel,
  GridPosition,
  ThresholdConfig,
  DashboardVariable,
} from './domain.js';

export type { RollbackStep, VerificationStep, RollbackCheck, RollbackCapability } from './domain.js';

export type {
  WorkflowStep,
  EscalationMatrix,
  MatrixLevel,
  CommunicationTemplate,
} from './domain.js';

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
} from './domain.js';

export type { SLOTargets } from './domain.js';

export {
  ServiceDefinitionSchema,
  RepositoryStructureSchema,
  EntryPointSchema,
  ExternalServiceSchema,
  DependencySchema,
  AlertSeveritySchema,
  AlertDefinitionSchema,
  DashboardPanelSchema,
  FailureModeSchema,
  RollbackStepSchema,
  HealthCheckSchema,
  ServiceDependencySchema,
  SLOTargetsSchema,
  ValidationResultSchema,
  AnalysisContextSchema,
} from './schemas.js';

export { generateId } from './utils.js';

export {
  fileExists,
  directoryExists,
  readFile,
  readJsonFile,
  listFiles,
  sanitizeAnchor,
  escapeMarkdown,
  truncate,
  sleep,
  retry,
  looksLikeSecret,
  redactSecrets,
  parseDuration,
  formatDuration,
  simpleHash,
  groupBy,
  flatten,
  unique,
  isPathWithinBase,
  getRelativePath,
  ensureDirectory,
  writeFile,
  writeJsonFile,
} from './utils.js';

export {
  AppError,
  ValidationError,
  NotFoundError,
  AnalysisError,
  GenerationError,
  ConfigurationError,
  LLMError,
  isAppError,
  getErrorMessage,
  getErrorStack,
  formatErrorForUser,
} from './errors.js';

export type { InputValidationResult } from './validation.js';

export { validateInput, parseList, parseIntOptional, parseBool } from './validation.js';
