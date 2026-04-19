import { describe, it, expect } from 'vitest';
import {
  generateAlerts,
  formatAlertsForPlatform,
} from '../../../src/alerts/alert-generator.js';
import type { AnalysisContext } from '../../../src/types/domain.js';

function makeContext(overrides: Partial<AnalysisContext> = {}): AnalysisContext {
  return {
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
    ...overrides,
  };
}

describe('generateAlerts', () => {
  it('generates alerts with no sloTargets', () => {
    const alerts = generateAlerts(makeContext(), {});
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every(a => a.name)).toBe(true);
  });

  it('includes SLO alerts when sloTargets provided', () => {
    const alerts = generateAlerts(
      makeContext(),
      { sloTargets: { availability: 99.9, latencyP99: 200 } },
    );
    const sloAlerts = alerts.filter(a => a.type === 'slo_burn_rate');
    expect(sloAlerts.length).toBeGreaterThan(0);
    expect(sloAlerts.some(a => a.name.includes('availability'))).toBe(true);
    expect(sloAlerts.some(a => a.name.includes('latency'))).toBe(true);
  });

  it('includes database alerts when has database', () => {
    const alerts = generateAlerts(
      makeContext({
        externalServices: [{ type: 'database', name: 'postgres' }],
      }),
      {},
    );
    expect(alerts.some(a => a.name.includes('database'))).toBe(true);
  });

  it('includes cache alerts when has cache', () => {
    const alerts = generateAlerts(
      makeContext({
        externalServices: [{ type: 'cache', name: 'redis' }],
      }),
      {},
    );
    expect(alerts.some(a => a.name.includes('cache'))).toBe(true);
  });

  it('uses serviceName from config when provided', () => {
    const alerts = generateAlerts(makeContext(), { serviceName: 'custom-svc' });
    expect(alerts.every(a => a.name.startsWith('custom-svc'))).toBe(true);
  });

  it('generates resource alerts', () => {
    const alerts = generateAlerts(makeContext(), {});
    const resource = alerts.filter(a => a.type === 'resource');
    expect(resource.length).toBeGreaterThan(0);
  });
});

describe('formatAlertsForPlatform', () => {
  const alerts = generateAlerts(makeContext(), {});

  it('formats for prometheus as YAML-like string', () => {
    const result = formatAlertsForPlatform(alerts, 'prometheus');
    expect(result).toContain('groups:');
    expect(result).toContain('rules:');
    expect(result).toContain('alert:');
  });

  it('formats for datadog as YAML-like string', () => {
    const result = formatAlertsForPlatform(alerts, 'datadog');
    expect(result).toContain('monitors:');
    expect(result).toContain('name:');
    expect(result).toContain('query:');
  });

  it('formats for cloudwatch as valid JSON', () => {
    const result = formatAlertsForPlatform(alerts, 'cloudwatch');
    const parsed = JSON.parse(result);
    expect(parsed.Alarm).toBeDefined();
    expect(parsed.Alarm.length).toBe(alerts.length);
    expect(parsed.Alarm[0].AlarmName).toBeDefined();
  });
});
