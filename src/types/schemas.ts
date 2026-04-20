/**
 * Zod schemas for validation
 */

import { z } from 'zod';

export const ServiceTypeSchema = z.enum(['web-api', 'worker', 'lambda', 'function', 'unknown']);

export const ProgrammingLanguageSchema = z.enum([
  'typescript',
  'javascript',
  'python',
  'go',
  'java',
  'ruby',
  'rust',
  'unknown',
]);

export const FrameworkSchema = z.enum([
  'express',
  'fastify',
  'koa',
  'flask',
  'django',
  'fastapi',
  'gin',
  'echo',
  'chi',
  'spring',
  'rails',
  'none',
  'unknown',
]);

export const DeploymentPlatformSchema = z.enum([
  'kubernetes',
  'ecs',
  'cloud-run',
  'lambda',
  'app-engine',
  'heroku',
  'vm',
  'unknown',
]);

export const MonitoringPlatformSchema = z.enum([
  'prometheus',
  'datadog',
  'cloudwatch',
  'grafana',
  'new-relic',
  'unknown',
]);

export const AlertSeveritySchema = z.enum(['critical', 'warning', 'info']);

export const AlertTypeSchema = z.enum(['slo_burn_rate', 'resource', 'application', 'synthetic']);

export const FailureCategorySchema = z.enum([
  'dependency',
  'resource',
  'application',
  'network',
  'security',
  'infrastructure',
  'database',
  'cache',
  'queue',
  'external',
]);

export const FailureSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const AnalysisDepthSchema = z.enum(['shallow', 'medium', 'deep']);

export const ExportFormatSchema = z.enum(['markdown', 'html', 'pdf', 'json']);

export const IncidentSeveritySchema = z.enum([
  'sev1',
  'sev2',
  'sev3',
  'sev4',
  'critical',
  'high',
  'medium',
  'low',
]);

export const ServiceDefinitionSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  team: z.string().optional(),
  repository: z.string().optional(),
  description: z.string().optional(),
  version: z.string().optional(),
});

export const RepositoryStructureSchema = z.object({
  mainDirectories: z.array(z.string()),
  fileCount: z.number().int().min(0),
  depth: z.number().int().min(0),
  hasTests: z.boolean(),
  hasDockerfile: z.boolean(),
  hasKubernetesManifests: z.boolean(),
  hasTerraform: z.boolean(),
});

export const EntryPointSchema = z.object({
  file: z.string(),
  type: z.enum(['http_server', 'worker', 'lambda', 'cli']),
  port: z.number().int().min(1).max(65535).optional(),
  handler: z.string().optional(),
});

export const ExternalServiceSchema = z.object({
  type: z.enum(['database', 'cache', 'queue', 'storage', 'api']),
  name: z.string(),
  connectionEnvVar: z.string().optional(),
});

export const RepositoryAnalysisSchema = z.object({
  serviceName: z.string().optional(),
  description: z.string().optional(),
  serviceType: ServiceTypeSchema,
  language: ProgrammingLanguageSchema,
  framework: FrameworkSchema,
  structure: RepositoryStructureSchema,
  configFiles: z.array(z.string()),
  entryPoints: z.array(EntryPointSchema),
  externalServices: z.array(ExternalServiceSchema),
});

export const DependencySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  purpose: z.string(),
  category: z.enum(['framework', 'database', 'cache', 'queue', 'storage', 'monitoring', 'utility']),
});

export const DependencyNodeSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  dependsOn: z.array(z.string()),
});

export const DependencyAnalysisSchema = z.object({
  directDeps: z.array(DependencySchema),
  transitiveDeps: z.array(DependencySchema),
  dependencyGraph: z.array(DependencyNodeSchema),
  externalServices: z.array(ExternalServiceSchema),
});

export const AlertAnnotationsSchema = z.object({
  summary: z.string(),
  description: z.string(),
  dashboardUrl: z.string().optional(),
  runbookUrl: z.string().optional(),
});

export const EscalationLevelSchema = z.object({
  level: z.number().int().min(1).optional(),
  delayMinutes: z.number().int().min(0),
  targets: z.array(z.string()),
  notificationChannels: z.array(z.string()),
});

export const RepeatPolicySchema = z.object({
  enabled: z.boolean(),
  repeatAfterMinutes: z.number().int().min(1),
  maxRepeats: z.number().int().min(0),
});

export const EscalationPolicySchema = z.object({
  name: z.string().optional(),
  levels: z.array(EscalationLevelSchema),
  repeatPolicy: RepeatPolicySchema.optional(),
});

export const AlertDefinitionSchema = z.object({
  name: z.string().min(1, 'Alert name is required'),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  expression: z.string().min(1, 'Alert expression is required'),
  condition: z.string().optional(),
  threshold: z.string().optional(),
  for: z.string().optional(),
  annotations: AlertAnnotationsSchema,
  labels: z.record(z.string()).optional(),
  runbookLink: z.string().optional(),
  escalationPolicy: z.string().optional(),
  description: z.string().optional(),
});

export const GridPositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  w: z.number().int(),
  h: z.number().int(),
});

export const ThresholdConfigSchema = z.object({
  value: z.number(),
  color: z.string(),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
});

export const DashboardPanelSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['graph', 'stat', 'table', 'heatmap', 'gauge']),
  query: z.string(),
  legend: z.string().optional(),
  thresholds: z.array(ThresholdConfigSchema).optional(),
  unit: z.string().optional(),
  gridPos: GridPositionSchema.optional(),
});

export const DashboardVariableSchema = z.object({
  name: z.string(),
  type: z.enum(['query', 'interval', 'datasource']),
  query: z.string().optional(),
  default: z.string().optional(),
});

export const DashboardConfigSchema = z.object({
  title: z.string().min(1, 'Dashboard title is required'),
  platform: MonitoringPlatformSchema,
  panels: z.array(DashboardPanelSchema),
  refreshInterval: z.string().optional(),
  timeRange: z.string().optional(),
  variables: z.array(DashboardVariableSchema).optional(),
});

export const FailureDetectionSchema = z.union([
  z.array(z.string()),
  z.object({
    metrics: z.array(z.string()),
    symptoms: z.array(z.string()),
    alertExpression: z.string().optional(),
  }),
]);

export const FailureModeSchema = z.object({
  id: z.string().min(1, 'Failure mode ID is required'),
  name: z.string().min(1, 'Failure mode name is required'),
  description: z.string(),
  category: FailureCategorySchema,
  severity: FailureSeveritySchema,
  likelihood: z.enum(['high', 'medium', 'low']),
  detection: FailureDetectionSchema,
  mitigation: z.array(z.string()),
  escalation: z.string(),
  runbookSection: z.string().optional(),
});

export const SinglePointOfFailureSchema = z.object({
  component: z.string(),
  impact: z.string(),
  recommendation: z.string(),
});

export const RiskFactorSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(10),
  description: z.string(),
});

export const RiskAssessmentSchema = z.object({
  score: z.number().min(0).max(10),
  factors: z.array(RiskFactorSchema),
});

export const RollbackCheckSchema = z.object({
  description: z.string(),
  command: z.string().optional(),
  expectedResult: z.string().optional(),
});

export const RollbackStepSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(1),
  title: z.string(),
  description: z.string(),
  commands: z.array(z.string()),
  command: z.string().optional(),
  parameters: z.record(z.string()).optional(),
  timeout: z.number().int().min(1).optional(),
  estimatedDuration: z.string(),
  automated: z.boolean().optional(),
});

export const VerificationStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int().min(1),
  description: z.string(),
  command: z.string().optional(),
  commands: z.array(z.string()).optional(),
  successCriteria: z.string().optional(),
  timeout: z.number().int().min(1).optional(),
  estimatedDuration: z.string().optional(),
  automated: z.boolean().optional(),
});

export const RollbackProcedureSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Rollback procedure name is required'),
  description: z.string(),
  deploymentType: DeploymentPlatformSchema.optional(),
  rollbackType: z.string().optional(),
  triggerConditions: z.array(z.string()),
  estimatedTotalDuration: z.string(),
  requiresApproval: z.boolean(),
  preChecks: z.array(RollbackCheckSchema).optional(),
  steps: z.array(RollbackStepSchema),
  verificationSteps: z.array(VerificationStepSchema).optional(),
  rollbackScript: z.string().optional(),
});

export const WorkflowStepSchema = z.union([
  z.string(),
  z.object({
    order: z.number().int().min(1),
    action: z.string(),
    description: z.string(),
    assignee: z.string().optional(),
    timeout: z.number().int().min(1).optional(),
  }),
]);

export const MatrixLevelSchema = z.object({
  level: z.number().int().min(1),
  afterMinutes: z.number().int().min(0),
  contacts: z.array(z.string()),
  channels: z.array(z.string()),
  targets: z.array(z.string()).optional(),
  notificationChannels: z.array(z.string()).optional(),
});

export const EscalationMatrixSchema = z.object({
  levels: z.array(MatrixLevelSchema),
});

export const CommunicationTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: z.string().optional(),
  channel: z.enum(['slack', 'email', 'pagerduty', 'status-page']),
  subject: z.string().optional(),
  body: z.string(),
  variables: z.array(z.string()),
});

export const IncidentWorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string(),
  severity: IncidentSeveritySchema,
  responseTime: z.string(),
  triggers: z.array(z.string()),
  escalationPath: z.array(z.string()),
  steps: z.array(WorkflowStepSchema),
  escalationMatrix: EscalationMatrixSchema,
  communicationTemplates: z.array(CommunicationTemplateSchema),
});

export const HealthCheckItemSchema = z.object({
  name: z.string(),
  type: z.enum(['http', 'tcp', 'grpc', 'database', 'cache']),
  endpoint: z.string().optional(),
  expectedStatus: z.number().int().optional(),
  timeout: z.number().int().min(1).optional(),
});

export const HealthCheckSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Health check name is required'),
  type: z.enum(['liveness', 'readiness', 'startup', 'deep']),
  endpoint: z.string(),
  interval: z.string(),
  timeout: z.string(),
  successCriteria: z.string(),
  checks: z.array(HealthCheckItemSchema).optional(),
});

export const ServiceDependencySchema = z.object({
  name: z.string(),
  type: z.string(),
  direction: z.enum(['upstream', 'downstream', 'peer']),
  protocol: z.enum(['http', 'grpc', 'tcp', 'async']),
  critical: z.boolean(),
  description: z.string().optional(),
  contract: z.string().optional(),
});

export const ServiceNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ServiceTypeSchema,
  team: z.string().optional(),
});

export const ServiceEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  protocol: z.enum(['http', 'grpc', 'tcp', 'async']),
  critical: z.boolean(),
});

export const CriticalPathSchema = z.object({
  name: z.string(),
  nodes: z.array(z.string()),
  latency: z.number().int().min(0).optional(),
});

export const ServiceMapSchema = z.object({
  nodes: z.array(ServiceNodeSchema),
  edges: z.array(ServiceEdgeSchema),
  criticalPaths: z.array(CriticalPathSchema),
});

export const AnalysisContextSchema = z.object({
  serviceDefinition: ServiceDefinitionSchema,
  repositoryAnalysis: RepositoryAnalysisSchema,
  dependencyAnalysis: DependencyAnalysisSchema,
  deploymentPlatform: DeploymentPlatformSchema,
  monitoringPlatform: MonitoringPlatformSchema,
  externalServices: z.array(ExternalServiceSchema),
  failureModes: z.array(FailureModeSchema).optional(),
  existingAlerts: z.array(AlertDefinitionSchema).optional(),
  healthChecks: z.array(HealthCheckSchema).optional(),
});

export const SLOTargetsSchema = z.object({
  availability: z.number().min(0).max(100),
  latencyP99: z.number().int().min(1),
  latencyP95: z.number().int().min(1).optional(),
  errorRate: z.number().min(0).max(100).optional(),
});

export const DashboardGenerationConfigSchema = z.object({
  platform: MonitoringPlatformSchema,
  refreshInterval: z.string().optional(),
});

export const OutputConfigSchema = z.object({
  format: ExportFormatSchema,
  includeToc: z.boolean(),
  includeCrossRefs: z.boolean(),
  outputPath: z.string().optional(),
});

export const GenerationConfigSchema = z.object({
  provider: z.string().optional(),
  model: z.string().optional(),
  sections: z.array(z.string()).optional(),
  sloTargets: SLOTargetsSchema.optional(),
  dashboardConfig: DashboardGenerationConfigSchema.optional(),
  outputConfig: OutputConfigSchema.optional(),
});

export const TocEntrySchema: z.ZodType<{
  level: number;
  title: string;
  anchor: string;
  children?: { level: number; title: string; anchor: string; children?: unknown[] }[];
}> = z.object({
  level: z.number().int().min(1),
  title: z.string(),
  anchor: z.string(),
  children: z.array(z.lazy(() => TocEntrySchema)).optional(),
});

export const RunbookSectionSchema: z.ZodType<{
  id: string;
  title: string;
  order: number;
  content: string;
  subsections: {
    id: string;
    title: string;
    order: number;
    content: string;
    subsections: unknown[];
    crossRefs?: string[];
  }[];
  crossRefs?: string[];
}> = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int().min(1),
  content: z.string(),
  subsections: z.array(z.lazy(() => RunbookSectionSchema)),
  crossRefs: z.array(z.string()).optional(),
});

export const CrossReferenceSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(['alert', 'failure-mode', 'rollback', 'dashboard']),
});

export const RunbookMetadataSchema = z.object({
  serviceType: ServiceTypeSchema,
  language: ProgrammingLanguageSchema,
  framework: FrameworkSchema,
  deploymentPlatform: DeploymentPlatformSchema,
  sectionsCount: z.number().int().min(0),
  alertsCount: z.number().int().min(0),
  failureModesCount: z.number().int().min(0),
  rollbackProceduresCount: z.number().int().min(0),
  generatedBy: z.string().optional(),
  generatorVersion: z.string().optional(),
});

export const RunbookSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Runbook title is required'),
  serviceName: z.string(),
  team: z.string().optional(),
  repository: z.string().optional(),
  version: z.string(),
  generatedAt: z.string(),
  sections: z.array(RunbookSectionSchema),
  metadata: RunbookMetadataSchema.optional(),
  crossReferences: z.array(CrossReferenceSchema).optional(),
});

export const ValidationFailureSchema = z.object({
  section: z.string(),
  message: z.string(),
  suggestion: z.string(),
});

export const ValidationResultSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  failures: z.array(ValidationFailureSchema),
  warnings: z.array(z.string()),
});

export const CompletenessResultSchema = z.object({
  score: z.number().min(0).max(1),
  missingSections: z.array(z.string()),
  suggestions: z.array(z.string()),
  sectionScores: z.record(z.number().min(0).max(1)),
});

export const AccuracyDiscrepancySchema = z.object({
  section: z.string(),
  expected: z.string(),
  actual: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
});

export const AccuracyResultSchema = z.object({
  accuracyScore: z.number().min(0).max(1),
  discrepancies: z.array(AccuracyDiscrepancySchema),
});

export const LinkInfoSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string(),
});

export const BrokenLinkInfoSchema = z.object({
  from: z.string(),
  to: z.string(),
  reason: z.string(),
});

export const LinkValidationResultSchema = z.object({
  validLinks: z.array(LinkInfoSchema),
  brokenLinks: z.array(BrokenLinkInfoSchema),
});

export const ScanRepositoryInputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  depth: z.number().int().min(1).max(10).optional().default(5),
  includePatterns: z.array(z.string()).optional(),
  excludePatterns: z.array(z.string()).optional(),
  maxFiles: z.number().int().min(1).max(50000).optional(),
});

export const MapDependenciesInputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  includeDev: z.boolean().optional().default(false),
});

export const GenerateAlertsInputSchema = z.object({
  analysis_context: z.object({
    serviceDefinition: ServiceDefinitionSchema,
    repositoryAnalysis: RepositoryAnalysisSchema,
    dependencyAnalysis: DependencyAnalysisSchema,
    deploymentPlatform: DeploymentPlatformSchema,
    monitoringPlatform: MonitoringPlatformSchema,
    externalServices: z.array(ExternalServiceSchema),
  }),
  slo_targets: SLOTargetsSchema.optional(),
  platform: MonitoringPlatformSchema.optional().default('prometheus'),
});

export const GenerateDashboardInputSchema = z.object({
  service_context: z.object({
    serviceDefinition: ServiceDefinitionSchema,
    repositoryAnalysis: RepositoryAnalysisSchema,
  }),
  platform: MonitoringPlatformSchema,
});

export const GenerateRollbackInputSchema = z.object({
  deployment_config: z
    .object({
      platform: DeploymentPlatformSchema,
    })
    .optional(),
  failure_scenarios: z.array(z.string()).optional(),
});

export const GenerateIncidentWorkflowInputSchema = z.object({
  service_context: z.object({
    serviceDefinition: ServiceDefinitionSchema,
  }),
  team_config: z
    .object({
      teamName: z.string().optional(),
    })
    .optional(),
});

export const ValidateCompletenessInputSchema = z.object({
  runbook: z.record(z.unknown()),
  required_sections: z.array(z.string()).optional(),
});

export const ValidateAccuracyInputSchema = z.object({
  runbook: z.record(z.unknown()),
  analysis_context: z
    .object({
      serviceDefinition: ServiceDefinitionSchema,
      repositoryAnalysis: RepositoryAnalysisSchema,
    })
    .optional(),
});

export const ValidateLinksInputSchema = z.object({
  runbook: z.record(z.unknown()),
});

export const ValidateCIInputSchema = z.object({
  runbook: z.record(z.unknown()),
  thresholds: z
    .object({
      completeness_min: z.number().min(0).max(1).optional().default(0.8),
      accuracy_min: z.number().min(0).max(1).optional().default(0.7),
    })
    .optional(),
});
