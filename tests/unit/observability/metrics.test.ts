import { describe, it, expect, beforeEach } from 'vitest';
import {
  initMetrics,
  recordGeneration,
  recordSectionGenerated,
  recordAgentCall,
  recordAnalysisDuration,
  recordAgentCost,
  recordCompleteness,
  getCompletenessScore,
  shutdownMetrics,
} from '../../../src/observability/metrics.js';

describe('initMetrics', () => {
  it('initializes when enabled (stub - no-op)', () => {
    initMetrics({ serviceName: 'test', enabled: true });
  });

  it('does not throw when disabled', () => {
    initMetrics({ serviceName: 'test', enabled: false });
  });

  it('accepts otlpEndpoint without error', () => {
    initMetrics({
      serviceName: 'test',
      enabled: true,
      otlpEndpoint: 'http://localhost:4318/v1/metrics',
    });
  });
});

describe('recording functions', () => {
  beforeEach(() => {
    initMetrics({ serviceName: 'test', enabled: true });
  });

  it('recordGeneration does not throw', () => {
    expect(() => recordGeneration('success')).not.toThrow();
    expect(() => recordGeneration('failure')).not.toThrow();
    expect(() => recordGeneration('warning')).not.toThrow();
  });

  it('recordSectionGenerated does not throw', () => {
    expect(() => recordSectionGenerated('alerts')).not.toThrow();
  });

  it('recordAgentCall does not throw', () => {
    expect(() => recordAgentCall('claude', 'success')).not.toThrow();
    expect(() => recordAgentCall('openai', 'failure')).not.toThrow();
  });

  it('recordAnalysisDuration does not throw', () => {
    expect(() => recordAnalysisDuration('scanner', 500)).not.toThrow();
  });

  it('recordAgentCost does not throw', () => {
    expect(() => recordAgentCost('openai', 0.05)).not.toThrow();
  });

  it('recordCompleteness stores value', () => {
    recordCompleteness('my-service', 0.95);
    expect(getCompletenessScore()).toEqual({ score: 0.95, service: 'my-service' });
  });

  it('recordCompleteness overwrites previous value', () => {
    recordCompleteness('service-a', 0.5);
    recordCompleteness('service-b', 0.8);
    expect(getCompletenessScore()).toEqual({ score: 0.8, service: 'service-b' });
  });
});

describe('shutdownMetrics', () => {
  it('resolves without error when enabled', async () => {
    initMetrics({ serviceName: 'test', enabled: true });
    await expect(shutdownMetrics()).resolves.toBeUndefined();
  });

  it('resolves without error when disabled', async () => {
    initMetrics({ serviceName: 'test', enabled: false });
    await expect(shutdownMetrics()).resolves.toBeUndefined();
  });
});

describe('recording functions when metrics disabled', () => {
  beforeEach(() => {
    initMetrics({ serviceName: 'test', enabled: false });
  });

  it('recordGeneration does not throw', () => {
    expect(() => recordGeneration('success')).not.toThrow();
  });

  it('recordSectionGenerated does not throw', () => {
    expect(() => recordSectionGenerated('alerts')).not.toThrow();
  });

  it('recordAgentCall does not throw', () => {
    expect(() => recordAgentCall('mock', 'success')).not.toThrow();
  });

  it('recordAnalysisDuration does not throw', () => {
    expect(() => recordAnalysisDuration('x', 100)).not.toThrow();
  });

  it('recordAgentCost does not throw', () => {
    expect(() => recordAgentCost('mock', 0.01)).not.toThrow();
  });

  it('recordCompleteness does not throw', () => {
    expect(() => recordCompleteness('svc', 0.5)).not.toThrow();
  });
});
