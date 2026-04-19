/**
 * Core domain types for the agent-runbook-generator
 */

/** Service type detection categories */
export type ServiceType =
  | 'web-api'
  | 'worker'
  | 'lambda'
  | 'function'
  | 'unknown';

/** Programming language detection */
export type ProgrammingLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'java'
  | 'ruby'
  | 'rust'
  | 'unknown';

/** Framework detection */
export type Framework =
  | 'express'
  | 'fastify'
  | 'koa'
  | 'flask'
  | 'django'
  | 'fastapi'
  | 'gin'
  | 'echo'
  | 'chi'
  | 'spring'
  | 'rails'
  | 'none'
  | 'unknown';

/** Deployment platform */
export type DeploymentPlatform =
  | 'kubernetes'
  | 'ecs'
  | 'cloud-run'
  | 'lambda'
  | 'app-engine'
  | 'heroku'
  | 'vm'
  | 'unknown';

/** Monitoring platform */
export type MonitoringPlatform =
  | 'prometheus'
  | 'datadog'
  | 'cloudwatch'
  | 'grafana'
  | 'new-relic'
  | 'unknown';

/** Alert severity levels */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/** Alert type */
export type AlertType =
  | 'slo_burn_rate'
  | 'resource'
  | 'application'
  | 'synthetic';

/** Failure mode category */
export type FailureCategory =
  | 'dependency'
  | 'resource'
  | 'application'
  | 'network'
  | 'security'
  | 'infrastructure'
  | 'database'
  | 'cache'
  | 'queue'
  | 'external';

/** Failure mode severity */
export type FailureSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Analysis depth */
export type AnalysisDepth = 'shallow' | 'medium' | 'deep';

/** Export format */
export type ExportFormat = 'markdown' | 'html' | 'pdf' | 'json';

/**
 * Service definition - metadata about the service being analyzed
 */
export interface ServiceDefinition {
  name: string;
  team?: string;
  repository?: string;
  description?: string;
  version?: string;
}

/**
 * Repository analysis result
 */
export interface RepositoryAnalysis {
  serviceName?: string;
  description?: string;
  serviceType: ServiceType;
  language: ProgrammingLanguage;
  framework: Framework;
  structure: RepositoryStructure;
  configFiles: string[];
  entryPoints: EntryPoint[];
  externalServices: ExternalService[];
}

/**
 * Repository structure information
 */
export interface RepositoryStructure {
  mainDirectories: string[];
  fileCount: number;
  depth: number;
  hasTests: boolean;
  hasDockerfile: boolean;
  hasKubernetesManifests: boolean;
  hasTerraform: boolean;
}

/**
 * Entry point information
 */
export interface EntryPoint {
  file: string;
  type: 'http_server' | 'worker' | 'lambda' | 'cli';
  port?: number;
  handler?: string;
}

/**
 * External service dependency
 */
export interface ExternalService {
  type: 'database' | 'cache' | 'queue' | 'storage' | 'api';
  name: string;
  connectionEnvVar?: string;
}

/**
 * Dependency information
 */
export interface Dependency {
  name: string;
  version?: string;
  purpose: string;
  category: 'framework' | 'database' | 'cache' | 'queue' | 'storage' | 'monitoring' | 'utility';
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysis {
  directDeps: Dependency[];
  transitiveDeps: Dependency[];
  dependencyGraph: DependencyNode[];
  externalServices: ExternalService[];
}

/**
 * Dependency graph node
 */
export interface DependencyNode {
  name: string;
  version?: string;
  dependsOn: string[];
}

/**
 * Alert definition
 */
export interface AlertDefinition {
  name: string;
  type: AlertType;
  severity: AlertSeverity;
  expression: string;
  condition?: string;
  threshold?: string;
  for?: string;
  annotations: AlertAnnotations;
  labels?: Record<string, string>;
  runbookLink?: string;
  escalationPolicy?: string;
  description?: string;
}

/**
 * Alert annotations
 */
export interface AlertAnnotations {
  summary: string;
  description: string;
  dashboardUrl?: string;
  runbookUrl?: string;
}

/**
 * Escalation policy
 */
export interface EscalationPolicy {
  name?: string;
  levels: EscalationLevel[];
  repeatPolicy?: RepeatPolicy;
}

/**
 * Escalation level
 */
export interface EscalationLevel {
  level?: number;
  delayMinutes: number;
  targets: string[];
  notificationChannels: string[];
}

/**
 * Repeat policy for escalation
 */
export interface RepeatPolicy {
  enabled: boolean;
  repeatAfterMinutes: number;
  maxRepeats: number;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  title: string;
  platform: MonitoringPlatform;
  panels: DashboardPanel[];
  refreshInterval?: string;
  timeRange?: string;
  variables?: DashboardVariable[];
}

/**
 * Dashboard panel
 */
export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'stat' | 'table' | 'heatmap' | 'gauge';
  query: string;
  legend?: string;
  thresholds?: ThresholdConfig[];
  unit?: string;
  gridPos?: GridPosition;
}

/**
 * Grid position for dashboard panels
 */
export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Threshold configuration
 */
export interface ThresholdConfig {
  value: number;
  color: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
}

/**
 * Dashboard variable
 */
export interface DashboardVariable {
  name: string;
  type: 'query' | 'interval' | 'datasource';
  query?: string;
  default?: string;
}

/**
 * Failure mode
 */
export interface FailureMode {
  id: string;
  name: string;
  description: string;
  category: FailureCategory;
  severity: FailureSeverity;
  likelihood: 'high' | 'medium' | 'low';
  detection: FailureDetection;
  mitigation: string[];
  escalation: string;
  runbookSection?: string;
}

/**
 * Failure detection configuration
 */
export type FailureDetection = string[] | {
  metrics: string[];
  symptoms: string[];
  alertExpression?: string;
};

/**
 * Single point of failure
 */
export interface SinglePointOfFailure {
  component: string;
  impact: string;
  recommendation: string;
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
  score: number; // 0-10
  factors: RiskFactor[];
}

/**
 * Risk factor
 */
export interface RiskFactor {
  name: string;
  score: number;
  description: string;
}

/**
 * Rollback procedure
 */
export interface RollbackProcedure {
  id?: string;
  name: string;
  description: string;
  deploymentType?: DeploymentPlatform;
  rollbackType?: string;
  triggerConditions: string[];
  estimatedTotalDuration: string;
  requiresApproval: boolean;
  preChecks?: RollbackCheck[];
  steps: RollbackStep[];
  verificationSteps?: VerificationStep[];
  rollbackScript?: string;
}

export interface RollbackCheck {
  description: string;
  command?: string;
  expectedResult?: string;
}

export interface RollbackStep {
  id?: string;
  order: number;
  title: string;
  description: string;
  commands: string[];
  command?: string;
  parameters?: Record<string, string>;
  timeout?: number;
  estimatedDuration: string;
  automated?: boolean;
}

/**
 * Verification step
 */
export interface VerificationStep {
  id: string;
  title: string;
  order: number;
  description: string;
  command?: string;
  commands?: string[];
  successCriteria?: string;
  timeout?: number;
  estimatedDuration?: string;
  automated?: boolean;
}

/**
 * Incident workflow
 */
export interface IncidentWorkflow {
  id: string;
  name: string;
  description: string;
  severity: IncidentSeverity;
  responseTime: string;
  triggers: string[];
  escalationPath: string[];
  steps: WorkflowStep[];
  escalationMatrix: EscalationMatrix;
  communicationTemplates: CommunicationTemplate[];
}

/**
 * Incident severity
 */
export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'critical' | 'high' | 'medium' | 'low';

/**
 * Workflow step
 */
export type WorkflowStep = string | {
  order: number;
  action: string;
  description: string;
  assignee?: string;
  timeout?: number;
};

/**
 * Escalation matrix
 */
export interface EscalationMatrix {
  levels: MatrixLevel[];
}

/**
 * Matrix level
 */
export interface MatrixLevel {
  level: number;
  afterMinutes: number;
  contacts: string[];
  channels: string[];
  targets?: string[];
  notificationChannels?: string[];
}

/**
 * Communication template
 */
export interface CommunicationTemplate {
  id: string;
  name: string;
  type?: string;
  channel: 'slack' | 'email' | 'pagerduty' | 'status-page';
  subject?: string;
  body: string;
  variables: string[];
}

/**
 * Health check definition
 */
export interface HealthCheck {
  id?: string;
  name: string;
  type: 'liveness' | 'readiness' | 'startup' | 'deep';
  endpoint: string;
  interval: string;
  timeout: string;
  successCriteria: string;
  checks?: HealthCheckItem[];
}

/**
 * Health check item
 */
export interface HealthCheckItem {
  name: string;
  type: 'http' | 'tcp' | 'grpc' | 'database' | 'cache';
  endpoint?: string;
  expectedStatus?: number;
  timeout?: number;
}

/**
 * Service dependency for mapping
 */
export interface ServiceDependency {
  name: string;
  type: 'database' | 'cache' | 'queue' | 'storage' | 'api' | 'service';
  direction: 'upstream' | 'downstream' | 'peer';
  protocol: 'http' | 'grpc' | 'tcp' | 'async';
  critical: boolean;
  description?: string;
  contract?: string;
}

/**
 * Service map graph
 */
export interface ServiceMap {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
  criticalPaths: CriticalPath[];
}

/**
 * Service node
 */
export interface ServiceNode {
  id: string;
  name: string;
  type: ServiceType;
  team?: string;
}

/**
 * Service edge
 */
export interface ServiceEdge {
  source: string;
  target: string;
  protocol: 'http' | 'grpc' | 'tcp' | 'async';
  critical: boolean;
}

/**
 * Analysis insight from LLM
 */
export interface AnalysisInsight {
  category: string;
  finding: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Critical path
 */
export interface CriticalPath {
  name: string;
  nodes: string[];
  latency?: number; // milliseconds
}

/**
 * Rollback capability
 */
export interface RollbackCapability {
  type: string;
  description: string;
  command: string;
  automated: boolean;
}

/**
 * Analysis context - passed between analysis and generation phases
 */

export interface AnalysisContext {
  serviceDefinition: ServiceDefinition;
  repositoryAnalysis: RepositoryAnalysis;
  dependencyAnalysis: DependencyAnalysis;
  deploymentPlatform: DeploymentPlatform;
  monitoringPlatform: MonitoringPlatform;
  externalServices: ExternalService[];
  failureModes?: FailureMode[];
  existingAlerts?: AlertDefinition[];
  healthChecks?: HealthCheck[];
  configParser?: Record<string, unknown>;
}

/**
 * Generation configuration
 */
export interface GenerationConfig {
  provider?: string;
  model?: string;
  sections?: string[];
  sloTargets?: SLOTargets;
  dashboardConfig?: DashboardGenerationConfig;
  outputConfig?: OutputConfig;
}

/**
 * SLO targets
 */
export interface SLOTargets {
  availability: number; // percentage (e.g., 99.9)
  latencyP99: number; // milliseconds
  latencyP95?: number; // milliseconds
  errorRate?: number; // percentage
}

/**
 * Dashboard generation config
 */
export interface DashboardGenerationConfig {
  platform: MonitoringPlatform;
  refreshInterval?: string;
}

/**
 * Output configuration
 */
export interface OutputConfig {
  format: ExportFormat;
  includeToc: boolean;
  includeCrossRefs: boolean;
  outputPath?: string;
}

/**
 * Runbook section
 */
export interface RunbookSection {
  id: string;
  title: string;
  order: number;
  content: string;
  subsections: RunbookSection[];
  crossRefs?: string[];
}

/**
 * Table of contents entry
 */
export interface TocEntry {
  level: number;
  title: string;
  anchor: string;
  children?: TocEntry[];
}

/**
 * Complete runbook
 */
export interface Runbook {
  id: string;
  title: string;
  serviceName: string;
  team?: string;
  repository?: string;
  version: string;
  generatedAt: string;
  sections: RunbookSection[];
  metadata?: RunbookMetadata;
  crossReferences?: CrossReference[];
}

/**
 * Runbook metadata
 */
export interface RunbookMetadata {
  serviceType: ServiceType;
  language: ProgrammingLanguage;
  framework: Framework;
  deploymentPlatform: DeploymentPlatform;
  sectionsCount: number;
  alertsCount: number;
  failureModesCount: number;
  rollbackProceduresCount: number;
  generatedBy?: string;
  generatorVersion?: string;
}

/**
 * Cross reference
 */
export interface CrossReference {
  from: string;
  to: string;
  type: 'alert' | 'failure-mode' | 'rollback' | 'dashboard';
}

/**
 * Validation result
 */
export interface ValidationResult {
  passed: boolean;
  score: number;
  failures: ValidationFailure[];
  warnings: string[];
}

/**
 * Validation failure
 */
export interface ValidationFailure {
  section: string;
  message: string;
  suggestion: string;
}

/**
 * Completeness validation result
 */
export interface CompletenessResult {
  score: number;
  missingSections: string[];
  suggestions: string[];
  sectionScores: Record<string, number>;
}

/**
 * Accuracy validation result
 */
export interface AccuracyResult {
  accuracyScore: number;
  discrepancies: AccuracyDiscrepancy[];
}

/**
 * Accuracy discrepancy
 */
export interface AccuracyDiscrepancy {
  section: string;
  expected: string;
  actual: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Link validation result
 */
export interface LinkValidationResult {
  validLinks: LinkInfo[];
  brokenLinks: BrokenLinkInfo[];
}

/**
 * Link information
 */
export interface LinkInfo {
  from: string;
  to: string;
  type: string;
}

/**
 * Broken link information
 */
export interface BrokenLinkInfo {
  from: string;
  to: string;
  reason: string;
}
