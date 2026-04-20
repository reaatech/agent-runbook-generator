import { describe, it, expect } from 'vitest';
import {
  generateMitigations,
  suggestCircuitBreakerConfig,
  suggestRetryConfig,
  suggestTimeoutConfig,
} from '../../../src/failure-modes/mitigation-generator.js';
import type { AnalysisContext, FailureMode } from '../../../src/types/domain.js';

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

function makeFailureMode(name: string): FailureMode {
  return {
    id: 'fm-1',
    name,
    description: `Failure: ${name}`,
    category: 'resource',
    severity: 'high',
    likelihood: 'medium',
    detection: { metrics: [], symptoms: [] },
    mitigation: [],
    escalation: 'P1',
  };
}

describe('generateMitigations', () => {
  it('returns a mitigation plan per failure mode', () => {
    const modes = [
      makeFailureMode('Database Connection Failure'),
      makeFailureMode('Memory Exhaustion'),
    ];
    const plans = generateMitigations(modes, makeContext());
    expect(plans).toHaveLength(2);
    for (const plan of plans) {
      expect(plan.failureMode).toBeDefined();
      expect(plan.immediateActions).toBeDefined();
      expect(plan.shortTermFixes).toBeDefined();
      expect(plan.longTermImprovements).toBeDefined();
    }
  });

  it('generates database-specific mitigations', () => {
    const plans = generateMitigations(
      [makeFailureMode('Database Connection Failure')],
      makeContext(),
    );
    const plan = plans[0];
    expect(plan.immediateActions.length).toBeGreaterThan(0);
    expect(plan.codeChanges.length).toBeGreaterThan(0);
    expect(plan.monitoringChanges.length).toBeGreaterThan(0);
    expect(plan.codeChanges[0].priority).toBe('high');
  });

  it('generates memory-specific mitigations', () => {
    const plans = generateMitigations([makeFailureMode('Memory Exhaustion')], makeContext());
    const plan = plans[0];
    expect(plan.immediateActions.some((a) => a.includes('Restart'))).toBe(true);
    expect(plan.monitoringChanges.length).toBeGreaterThanOrEqual(2);
  });

  it('generates cpu-specific mitigations', () => {
    const plans = generateMitigations([makeFailureMode('CPU Exhaustion')], makeContext());
    const plan = plans[0];
    expect(plan.immediateActions.some((a) => a.includes('rate'))).toBe(true);
  });

  it('generates network partition mitigations with code changes', () => {
    const plans = generateMitigations([makeFailureMode('Network Partition')], makeContext());
    const plan = plans[0];
    expect(plan.codeChanges.length).toBeGreaterThan(0);
    expect(plan.longTermImprovements.some((i) => i.includes('circuit breaker'))).toBe(true);
  });

  it('generates cache mitigations', () => {
    const plans = generateMitigations([makeFailureMode('Cache Failure')], makeContext());
    const plan = plans[0];
    expect(plan.codeChanges.length).toBeGreaterThan(0);
    expect(plan.longTermImprovements.some((i) => i.includes('cache-aside'))).toBe(true);
  });

  it('generates generic mitigations for unknown failure mode', () => {
    const plans = generateMitigations([makeFailureMode('Some Unknown Failure')], makeContext());
    const plan = plans[0];
    expect(plan.immediateActions.length).toBeGreaterThan(0);
    expect(plan.shortTermFixes.length).toBeGreaterThan(0);
  });

  it('returns empty array for empty input', () => {
    expect(generateMitigations([], makeContext())).toEqual([]);
  });
});

describe('suggestCircuitBreakerConfig', () => {
  it('returns threshold, timeout, and resetTimeout', () => {
    const config = suggestCircuitBreakerConfig('my-svc');
    expect(config.threshold).toBe(5);
    expect(config.timeout).toBe(30000);
    expect(config.resetTimeout).toBe(60000);
  });
});

describe('suggestRetryConfig', () => {
  it('returns retry configuration', () => {
    const config = suggestRetryConfig('my-svc');
    expect(config.maxRetries).toBe(3);
    expect(config.baseDelay).toBe(1000);
    expect(config.maxDelay).toBe(30000);
    expect(config.factor).toBe(2);
  });
});

describe('suggestTimeoutConfig', () => {
  it('returns timeout configuration', () => {
    const config = suggestTimeoutConfig('my-svc');
    expect(config.connect).toBe(5000);
    expect(config.request).toBe(30000);
    expect(config.idle).toBe(60000);
  });
});
