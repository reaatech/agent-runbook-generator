import { describe, it, expect } from 'vitest';
import {
  identifyMetrics,
  suggestMetricsForService,
} from '@reaatech/agent-runbook-dashboards';
import type { AnalysisContext } from '@reaatech/agent-runbook';

function makeContext(): AnalysisContext {
  return {
    serviceDefinition: { name: 'test-svc' },
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
}

describe('identifyMetrics', () => {
  it('returns metrics array for a project directory', () => {
    const metrics = identifyMetrics(process.cwd(), makeContext());
    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('includes RED metrics', () => {
    const metrics = identifyMetrics(process.cwd(), makeContext());
    const names = metrics.map((m) => m.name);
    expect(names.some((n) => n.includes('requests_total'))).toBe(true);
    expect(names.some((n) => n.includes('request_duration'))).toBe(true);
  });

  it('includes USE metrics', () => {
    const metrics = identifyMetrics(process.cwd(), makeContext());
    const names = metrics.map((m) => m.name);
    expect(names.some((n) => n.includes('cpu_usage'))).toBe(true);
    expect(names.some((n) => n.includes('memory_usage'))).toBe(true);
  });

  it('each metric has required fields', () => {
    const metrics = identifyMetrics(process.cwd(), makeContext());
    for (const m of metrics) {
      expect(m.name).toBeDefined();
      expect(m.type).toBeDefined();
      expect(m.description).toBeDefined();
    }
  });
});

describe('suggestMetricsForService', () => {
  it('suggests RED+USE metrics for web-api', () => {
    const metrics = suggestMetricsForService('web-api', 'my-api');
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics.some((m) => m.name.includes('requests_total'))).toBe(true);
    expect(metrics.some((m) => m.name.includes('cpu_usage'))).toBe(true);
  });

  it('suggests worker metrics for worker type', () => {
    const metrics = suggestMetricsForService('worker', 'my-worker');
    expect(metrics.some((m) => m.name.includes('jobs_processed'))).toBe(true);
    expect(metrics.some((m) => m.name.includes('queue_depth'))).toBe(true);
  });

  it('suggests lambda metrics for lambda type', () => {
    const metrics = suggestMetricsForService('lambda', 'my-fn');
    expect(metrics.some((m) => m.name.includes('invocations_total'))).toBe(true);
    expect(metrics.some((m) => m.name.includes('cold_starts'))).toBe(true);
  });

  it('suggests lambda metrics for function type', () => {
    const metrics = suggestMetricsForService('function', 'my-fn');
    expect(metrics.some((m) => m.name.includes('invocations_total'))).toBe(true);
  });

  it('defaults to RED metrics for unknown type', () => {
    const metrics = suggestMetricsForService('unknown', 'my-svc');
    expect(metrics.some((m) => m.name.includes('requests_total'))).toBe(true);
  });
});
