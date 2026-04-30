import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { AnalysisContext, HealthCheck } from '@reaatech/agent-runbook';
import {
  generateHealthCheckEndpoint,
  generateHealthChecks,
  generateKubernetesProbeYaml,
  generateLoadBalancerConfig,
} from '@reaatech/agent-runbook-health-checks';
import { describe, expect, it } from 'vitest';

function makeContext(overrides: Partial<AnalysisContext> = {}): AnalysisContext {
  return {
    serviceDefinition: { name: 'test-service' },
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
    ...overrides,
  };
}

const k8sChecks: HealthCheck[] = [
  {
    type: 'liveness',
    endpoint: '/health',
    interval: '10s',
    timeout: '5s',
    name: 'liveness',
    successCriteria: 'HTTP 200',
  },
  {
    type: 'readiness',
    endpoint: '/health/ready',
    interval: '5s',
    timeout: '3s',
    name: 'readiness',
    successCriteria: 'HTTP 200',
  },
  {
    type: 'startup',
    endpoint: '/health/startup',
    interval: '10s',
    timeout: '5s',
    name: 'startup',
    successCriteria: 'HTTP 200',
  },
];

describe('generateKubernetesProbeYaml', () => {
  it('generates yaml with all three probes', () => {
    const yaml = generateKubernetesProbeYaml(k8sChecks);
    expect(yaml).toContain('livenessProbe:');
    expect(yaml).toContain('readinessProbe:');
    expect(yaml).toContain('startupProbe:');
    expect(yaml).toContain('path: /health');
    expect(yaml).toContain('path: /health/ready');
    expect(yaml).toContain('path: /health/startup');
  });

  it('uses default container name', () => {
    const yaml = generateKubernetesProbeYaml(k8sChecks);
    expect(yaml).toContain('name: app');
  });

  it('uses custom container name', () => {
    const yaml = generateKubernetesProbeYaml(k8sChecks, 'my-container');
    expect(yaml).toContain('name: my-container');
  });

  it('generates only liveness when only liveness provided', () => {
    const onlyLiveness = [k8sChecks[0]];
    const yaml = generateKubernetesProbeYaml(onlyLiveness);
    expect(yaml).toContain('livenessProbe:');
    expect(yaml).not.toContain('readinessProbe:');
    expect(yaml).not.toContain('startupProbe:');
  });

  it('parses interval and timeout correctly', () => {
    const yaml = generateKubernetesProbeYaml(k8sChecks);
    expect(yaml).toContain('periodSeconds: 10');
    expect(yaml).toContain('timeoutSeconds: 5');
  });
});

describe('generateLoadBalancerConfig', () => {
  it('generates health check config', () => {
    const config = generateLoadBalancerConfig(k8sChecks);
    expect(config).toContain('health_check');
    expect(config).toContain('path');
    expect(config).toContain('/health');
    expect(config).toContain('interval');
    expect(config).toContain('timeout');
  });

  it('returns empty string when no liveness check', () => {
    const noLiveness = k8sChecks.filter((c) => c.type !== 'liveness');
    const config = generateLoadBalancerConfig(noLiveness);
    expect(config).toBe('');
  });
});

describe('generateHealthCheckEndpoint', () => {
  it('generates TypeScript endpoint code', () => {
    const code = generateHealthCheckEndpoint(k8sChecks, 'typescript');
    expect(code).toContain('express');
    expect(code).toContain('healthCheck');
    expect(code).toContain('200');
    expect(code).toContain('503');
  });

  it('generates Python endpoint code', () => {
    const code = generateHealthCheckEndpoint(k8sChecks, 'python');
    expect(code).toContain('FastAPI');
    expect(code).toContain('async def health_check');
    expect(code).toContain('/health');
  });

  it('generates Go endpoint code', () => {
    const code = generateHealthCheckEndpoint(k8sChecks, 'go');
    expect(code).toContain('net/http');
    expect(code).toContain('func HealthCheck');
    expect(code).toContain('HealthStatus');
  });

  it('generates generic endpoint for unknown language', () => {
    const code = generateHealthCheckEndpoint(k8sChecks, 'ruby');
    expect(code).toContain('Health Check Endpoint');
    expect(code).toContain('/health');
  });
});

describe('generateHealthChecks', () => {
  it('returns health checks for kubernetes platform', () => {
    const tmpDir = path.join(os.tmpdir(), `hc-gen-${Date.now()}`);
    fs.mkdirSync(tmpDir);
    const checks = generateHealthChecks(tmpDir, makeContext(), {
      platform: 'kubernetes',
      serviceName: 'test-service',
    });
    expect(checks.length).toBeGreaterThan(0);
    const types = checks.map((c) => c.type);
    expect(types).toContain('liveness');
    expect(types).toContain('readiness');
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns health checks for load-balancer platform', () => {
    const tmpDir = path.join(os.tmpdir(), `hc-gen-lb-${Date.now()}`);
    fs.mkdirSync(tmpDir);
    const checks = generateHealthChecks(tmpDir, makeContext(), {
      platform: 'load-balancer',
      serviceName: 'test-service',
    });
    expect(checks.length).toBeGreaterThan(0);
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('adds database deep check when database dependency exists', () => {
    const tmpDir = path.join(os.tmpdir(), `hc-gen-db-${Date.now()}`);
    fs.mkdirSync(tmpDir);
    const checks = generateHealthChecks(
      tmpDir,
      makeContext({ externalServices: [{ type: 'database', name: 'postgres' }] }),
      { platform: 'kubernetes', serviceName: 'test-service' },
    );
    const dbCheck = checks.find((c) => c.endpoint === '/health/database');
    expect(dbCheck).toBeDefined();
    expect(dbCheck?.type).toBe('deep');
    fs.rmSync(tmpDir, { recursive: true });
  });
});
