import { describe, expect, it } from 'vitest';
import {
  AlertDefinitionSchema,
  AlertSeveritySchema,
  AnalysisContextSchema,
  DashboardPanelSchema,
  DependencySchema,
  EntryPointSchema,
  ExternalServiceSchema,
  FailureModeSchema,
  HealthCheckSchema,
  RepositoryStructureSchema,
  RollbackStepSchema,
  SLOTargetsSchema,
  ServiceDefinitionSchema,
  ServiceDependencySchema,
  ValidationResultSchema,
} from './schemas.js';

describe('ServiceDefinitionSchema', () => {
  it('accepts valid service definition', () => {
    const result = ServiceDefinitionSchema.safeParse({ name: 'my-service' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = ServiceDefinitionSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = ServiceDefinitionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = ServiceDefinitionSchema.safeParse({
      name: 'svc',
      team: 'platform',
      repository: 'https://github.com/org/repo',
      description: 'A service',
      version: '1.0.0',
    });
    expect(result.success).toBe(true);
  });
});

describe('RepositoryStructureSchema', () => {
  it('accepts valid structure', () => {
    const result = RepositoryStructureSchema.safeParse({
      mainDirectories: ['src', 'tests'],
      fileCount: 10,
      depth: 3,
      hasTests: true,
      hasDockerfile: false,
      hasKubernetesManifests: false,
      hasTerraform: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative file count', () => {
    const result = RepositoryStructureSchema.safeParse({
      mainDirectories: [],
      fileCount: -1,
      depth: 0,
      hasTests: false,
      hasDockerfile: false,
      hasKubernetesManifests: false,
      hasTerraform: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = RepositoryStructureSchema.safeParse({ mainDirectories: [] });
    expect(result.success).toBe(false);
  });
});

describe('EntryPointSchema', () => {
  it('accepts valid entry point', () => {
    const result = EntryPointSchema.safeParse({ file: 'src/index.ts', type: 'http_server' });
    expect(result.success).toBe(true);
  });

  it('accepts optional port and handler', () => {
    const result = EntryPointSchema.safeParse({
      file: 'src/index.ts',
      type: 'http_server',
      port: 3000,
      handler: 'handler',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = EntryPointSchema.safeParse({ file: 'src/index.ts', type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects port out of range', () => {
    const result = EntryPointSchema.safeParse({
      file: 'src/index.ts',
      type: 'http_server',
      port: 99999,
    });
    expect(result.success).toBe(false);
  });
});

describe('ExternalServiceSchema', () => {
  it('accepts valid external service', () => {
    const result = ExternalServiceSchema.safeParse({ type: 'database', name: 'postgres' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = ExternalServiceSchema.safeParse({ type: 'mqtt', name: 'broker' });
    expect(result.success).toBe(false);
  });

  it('accepts optional connectionEnvVar', () => {
    const result = ExternalServiceSchema.safeParse({
      type: 'cache',
      name: 'redis',
      connectionEnvVar: 'REDIS_URL',
    });
    expect(result.success).toBe(true);
  });
});

describe('DependencySchema', () => {
  it('accepts valid dependency', () => {
    const result = DependencySchema.safeParse({
      name: 'express',
      version: '4.18.0',
      purpose: 'Web framework',
      category: 'framework',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = DependencySchema.safeParse({
      name: 'pkg',
      purpose: 'something',
      category: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('AlertSeveritySchema', () => {
  it('accepts critical', () => {
    expect(AlertSeveritySchema.safeParse('critical').success).toBe(true);
  });

  it('accepts warning', () => {
    expect(AlertSeveritySchema.safeParse('warning').success).toBe(true);
  });

  it('accepts info', () => {
    expect(AlertSeveritySchema.safeParse('info').success).toBe(true);
  });

  it('rejects invalid severity', () => {
    expect(AlertSeveritySchema.safeParse('urgent').success).toBe(false);
  });
});

describe('AlertDefinitionSchema', () => {
  const validAlert = {
    name: 'HighErrorRate',
    type: 'application',
    severity: 'critical',
    expression: 'rate(errors[5m]) > 0.1',
    annotations: {
      summary: 'High error rate',
      description: 'Error rate exceeds 10%',
    },
  };

  it('accepts valid alert definition', () => {
    const result = AlertDefinitionSchema.safeParse(validAlert);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = AlertDefinitionSchema.safeParse({ ...validAlert, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing expression', () => {
    const result = AlertDefinitionSchema.safeParse({ ...validAlert, expression: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = AlertDefinitionSchema.safeParse({ ...validAlert, type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts optional labels', () => {
    const result = AlertDefinitionSchema.safeParse({
      ...validAlert,
      labels: { team: 'platform' },
    });
    expect(result.success).toBe(true);
  });
});

describe('DashboardPanelSchema', () => {
  it('accepts valid panel', () => {
    const result = DashboardPanelSchema.safeParse({
      id: 'panel-1',
      title: 'Error Rate',
      type: 'graph',
      query: 'rate(errors[5m])',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = DashboardPanelSchema.safeParse({
      id: 'panel-1',
      title: 'Test',
      type: 'pie',
      query: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional thresholds', () => {
    const result = DashboardPanelSchema.safeParse({
      id: 'panel-1',
      title: 'Latency',
      type: 'graph',
      query: 'latency',
      thresholds: [{ value: 0.5, color: 'red', operator: 'gt' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('FailureModeSchema', () => {
  it('accepts valid failure mode', () => {
    const result = FailureModeSchema.safeParse({
      id: 'fm-1',
      name: 'Database Down',
      description: 'Database becomes unavailable',
      category: 'dependency',
      severity: 'critical',
      likelihood: 'high',
      detection: {
        metrics: ['db_connections_active'],
        symptoms: ['Connection refused'],
      },
      mitigation: ['Enable connection pooling', 'Failover to replica'],
      escalation: 'Contact DBA team',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing id', () => {
    const result = FailureModeSchema.safeParse({
      id: '',
      name: 'Test',
      category: 'dependency',
      severity: 'high',
      likelihood: 'low',
      detection: { metrics: [], symptoms: [] },
      mitigation: [],
      escalation: 'Team',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity', () => {
    const result = FailureModeSchema.safeParse({
      id: 'fm-1',
      name: 'Test',
      category: 'dependency',
      severity: 'extreme',
      likelihood: 'low',
      detection: { metrics: [], symptoms: [] },
      mitigation: [],
      escalation: 'Team',
    });
    expect(result.success).toBe(false);
  });
});

describe('RollbackStepSchema', () => {
  it('accepts valid rollback step', () => {
    const result = RollbackStepSchema.safeParse({
      order: 1,
      title: 'Deploy previous version',
      description: 'Deploy previous version',
      commands: ['kubectl rollout undo'],
      estimatedDuration: '5m',
    });
    expect(result.success).toBe(true);
  });

  it('rejects order less than 1', () => {
    const result = RollbackStepSchema.safeParse({
      order: 0,
      description: 'step',
      title: 'step',
      commands: [],
      estimatedDuration: '1m',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = RollbackStepSchema.safeParse({
      order: 1,
      title: 'Rollback',
      description: 'Rollback',
      commands: ['kubectl rollout undo'],
      estimatedDuration: '5m',
      command: 'kubectl rollout undo',
      parameters: { namespace: 'prod' },
      timeout: 300,
    });
    expect(result.success).toBe(true);
  });
});

describe('HealthCheckSchema', () => {
  it('accepts valid health check', () => {
    const result = HealthCheckSchema.safeParse({
      id: 'hc-1',
      name: 'Liveness',
      type: 'liveness',
      endpoint: '/health',
      interval: '30s',
      timeout: '5s',
      successCriteria: '200 OK',
      checks: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = HealthCheckSchema.safeParse({
      id: 'hc-1',
      name: 'Test',
      type: 'custom',
      endpoint: '/health',
      interval: '30s',
      timeout: '5s',
      successCriteria: '200 OK',
      checks: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = HealthCheckSchema.safeParse({
      name: 'Test',
      type: 'liveness',
      endpoint: '/health',
      interval: '30s',
      timeout: '5s',
      successCriteria: '200 OK',
      checks: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('ServiceDependencySchema', () => {
  it('accepts valid dependency', () => {
    const result = ServiceDependencySchema.safeParse({
      name: 'auth-service',
      type: 'database',
      direction: 'upstream',
      protocol: 'http',
      critical: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = ServiceDependencySchema.safeParse({
      name: 'svc',
      type: 'internal',
      protocol: 'http',
      critical: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid protocol', () => {
    const result = ServiceDependencySchema.safeParse({
      name: 'svc',
      type: 'upstream',
      protocol: 'websocket',
      critical: false,
    });
    expect(result.success).toBe(false);
  });
});

describe('SLOTargetsSchema', () => {
  it('accepts valid SLO targets', () => {
    const result = SLOTargetsSchema.safeParse({
      availability: 99.9,
      latencyP99: 200,
    });
    expect(result.success).toBe(true);
  });

  it('rejects availability over 100', () => {
    const result = SLOTargetsSchema.safeParse({
      availability: 101,
      latencyP99: 200,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative availability', () => {
    const result = SLOTargetsSchema.safeParse({
      availability: -1,
      latencyP99: 200,
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = SLOTargetsSchema.safeParse({
      availability: 99.9,
      latencyP99: 200,
      latencyP95: 100,
      errorRate: 0.1,
    });
    expect(result.success).toBe(true);
  });
});

describe('ValidationResultSchema', () => {
  it('accepts valid result', () => {
    const result = ValidationResultSchema.safeParse({
      passed: true,
      score: 0.95,
      failures: [],
      warnings: ['Minor issue'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects score above 1', () => {
    const result = ValidationResultSchema.safeParse({
      passed: true,
      score: 1.5,
      failures: [],
      warnings: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects wrong type for passed', () => {
    const result = ValidationResultSchema.safeParse({
      passed: 'yes',
      score: 0.9,
      failures: [],
      warnings: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('AnalysisContextSchema', () => {
  const validContext = {
    serviceDefinition: { name: 'my-service' },
    repositoryAnalysis: {
      serviceType: 'web-api',
      language: 'typescript',
      framework: 'express',
      structure: {
        mainDirectories: [],
        fileCount: 0,
        depth: 0,
        hasTests: false,
        hasDockerfile: false,
        hasKubernetesManifests: false,
        hasTerraform: false,
      },
      configFiles: [],
      entryPoints: [],
      externalServices: [],
    },
    dependencyAnalysis: {
      directDeps: [],
      transitiveDeps: [],
      dependencyGraph: [],
      externalServices: [],
    },
    deploymentPlatform: 'kubernetes',
    monitoringPlatform: 'prometheus',
    externalServices: [],
  };

  it('accepts valid analysis context', () => {
    const result = AnalysisContextSchema.safeParse(validContext);
    expect(result.success).toBe(true);
  });

  it('rejects missing serviceDefinition', () => {
    const result = AnalysisContextSchema.safeParse({
      ...validContext,
      serviceDefinition: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional failureModes', () => {
    const result = AnalysisContextSchema.safeParse({
      ...validContext,
      failureModes: [],
    });
    expect(result.success).toBe(true);
  });
});
