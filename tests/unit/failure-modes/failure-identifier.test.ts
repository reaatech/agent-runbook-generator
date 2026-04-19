import { describe, it, expect } from 'vitest';
import {
  identifyFailureModes,
  getCommonFailureModes,
} from '../../../src/failure-modes/failure-identifier.js';
import type { AnalysisContext } from '../../../src/types/domain.js';

function makeContext(overrides: Partial<AnalysisContext> = {}): AnalysisContext {
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
    ...overrides,
  };
}

describe('identifyFailureModes', () => {
  it('returns failure analysis with required fields', () => {
    const result = identifyFailureModes(process.cwd(), makeContext());
    expect(result).toHaveProperty('failureModes');
    expect(result).toHaveProperty('singlePointsOfFailure');
    expect(result).toHaveProperty('riskScore');
    expect(Array.isArray(result.failureModes)).toBe(true);
    expect(typeof result.riskScore).toBe('number');
  });

  it('always includes resource failure modes', () => {
    const result = identifyFailureModes(process.cwd(), makeContext());
    const names = result.failureModes.map(f => f.name);
    expect(names).toContain('Memory Exhaustion');
    expect(names).toContain('CPU Exhaustion');
    expect(names).toContain('Disk Space Exhaustion');
    expect(names).toContain('Network Partition');
  });

  it('includes database failure when external database present', () => {
    const result = identifyFailureModes(process.cwd(), makeContext({
      externalServices: [{ type: 'database', name: 'postgres' }],
    }));
    const names = result.failureModes.map(f => f.name);
    expect(names).toContain('Database Connection Failure');
  });

  it('includes cache failure when external cache present', () => {
    const result = identifyFailureModes(process.cwd(), makeContext({
      externalServices: [{ type: 'cache', name: 'redis' }],
    }));
    const names = result.failureModes.map(f => f.name);
    expect(names).toContain('Cache Failure');
  });

  it('includes queue failure when external queue present', () => {
    const result = identifyFailureModes(process.cwd(), makeContext({
      externalServices: [{ type: 'queue', name: 'kafka' }],
    }));
    const names = result.failureModes.map(f => f.name);
    expect(names).toContain('Message Queue Failure');
  });

  it('caps riskScore at 100', () => {
    const result = identifyFailureModes(process.cwd(), makeContext({
      externalServices: [
        { type: 'database', name: 'pg' },
        { type: 'cache', name: 'redis' },
        { type: 'queue', name: 'kafka' },
      ],
    }));
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  it('each failure mode has name, description, detection, mitigation, escalation', () => {
    const result = identifyFailureModes(process.cwd(), makeContext());
    for (const fm of result.failureModes) {
      expect(fm.name).toBeDefined();
      expect(fm.description).toBeDefined();
      expect(Array.isArray(fm.detection)).toBe(true);
      expect(Array.isArray(fm.mitigation)).toBe(true);
      expect(fm.escalation).toBeDefined();
    }
  });
});

describe('getCommonFailureModes', () => {
  it('returns web-api failure modes', () => {
    const modes = getCommonFailureModes('web-api');
    expect(modes.length).toBeGreaterThan(0);
    const names = modes.map(m => m.name);
    expect(names).toContain('API Rate Limit Exceeded');
    expect(names).toContain('Request Timeout');
  });

  it('returns worker failure modes', () => {
    const modes = getCommonFailureModes('worker');
    expect(modes.length).toBeGreaterThan(0);
    expect(modes.some(m => m.name.includes('Job'))).toBe(true);
  });

  it('returns lambda failure modes', () => {
    const modes = getCommonFailureModes('lambda');
    expect(modes.length).toBeGreaterThan(0);
    const names = modes.map(m => m.name);
    expect(names).toContain('Function Timeout');
    expect(names).toContain('Cold Start Latency');
  });

  it('returns function failure modes (same as lambda)', () => {
    const modes = getCommonFailureModes('function');
    expect(modes.some(m => m.name === 'Function Timeout')).toBe(true);
  });

  it('returns empty for unknown type', () => {
    const modes = getCommonFailureModes('unknown');
    expect(modes).toEqual([]);
  });
});
