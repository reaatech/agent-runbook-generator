import { describe, it, expect } from 'vitest';
import {
  calculateSloThresholds,
  calculateResourceThresholds,
  calculateBurnRateThresholds,
  getDefaultThresholds,
  calculateDynamicThreshold,
} from '../../../src/alerts/threshold-calculator.js';

describe('calculateSloThresholds', () => {
  it('generates error rate threshold from availability SLO', () => {
    const thresholds = calculateSloThresholds({ availability: 99.9, latencyP99: 200 });
    expect(thresholds.length).toBeGreaterThan(0);
    const errRate = thresholds.find(t => t.metric === 'error_rate');
    expect(errRate).toBeDefined();
    expect(errRate!.threshold).toBeCloseTo(0.1, 1);
    expect(errRate!.operator).toBe('gt');
  });

  it('includes latency P99 threshold', () => {
    const thresholds = calculateSloThresholds({ availability: 99.9, latencyP99: 200 });
    const p99 = thresholds.find(t => t.metric === 'latency_p99');
    expect(p99).toBeDefined();
    expect(p99!.threshold).toBe(200);
  });

  it('includes latency P95 threshold when provided', () => {
    const thresholds = calculateSloThresholds({
      availability: 99.9,
      latencyP99: 200,
      latencyP95: 100,
    });
    const p95 = thresholds.find(t => t.metric === 'latency_p95');
    expect(p95).toBeDefined();
    expect(p95!.threshold).toBe(100);
  });

  it('does not include P95 threshold when not provided', () => {
    const thresholds = calculateSloThresholds({ availability: 99.9, latencyP99: 200 });
    expect(thresholds.find(t => t.metric === 'latency_p95')).toBeUndefined();
  });
});

describe('calculateResourceThresholds', () => {
  it('returns standard resource thresholds', () => {
    const thresholds = calculateResourceThresholds();
    expect(thresholds.length).toBe(4);
    const metrics = thresholds.map(t => t.metric);
    expect(metrics).toContain('cpu_utilization');
    expect(metrics).toContain('memory_utilization');
    expect(metrics).toContain('disk_utilization');
    expect(metrics).toContain('connection_pool_utilization');
  });

  it('uses gt operator for all thresholds', () => {
    const thresholds = calculateResourceThresholds();
    expect(thresholds.every(t => t.operator === 'gt')).toBe(true);
  });
});

describe('calculateBurnRateThresholds', () => {
  it('generates fast, slow, and critical burn rate thresholds', () => {
    const thresholds = calculateBurnRateThresholds({ availability: 99.9, latencyP99: 200 });
    expect(thresholds.length).toBe(3);
    const metrics = thresholds.map(t => t.metric);
    expect(metrics).toContain('burn_rate_fast');
    expect(metrics).toContain('burn_rate_slow');
    expect(metrics).toContain('burn_rate_critical');
  });

  it('fast burn threshold is higher than slow burn', () => {
    const thresholds = calculateBurnRateThresholds({ availability: 99.9, latencyP99: 200 });
    const fast = thresholds.find(t => t.metric === 'burn_rate_fast')!;
    const slow = thresholds.find(t => t.metric === 'burn_rate_slow')!;
    expect(fast.threshold).toBeGreaterThan(slow.threshold);
  });
});

describe('getDefaultThresholds', () => {
  it('returns three threshold configs', () => {
    const thresholds = getDefaultThresholds();
    expect(thresholds).toHaveLength(3);
    expect(thresholds.every(t => typeof t.value === 'number')).toBe(true);
    expect(thresholds.every(t => typeof t.color === 'string')).toBe(true);
  });

  it('has green, yellow, red colors', () => {
    const thresholds = getDefaultThresholds();
    const colors = thresholds.map(t => t.color);
    expect(colors).toEqual(['green', 'yellow', 'red']);
  });
});

describe('calculateDynamicThreshold', () => {
  it('returns mean + multiplier * stddev', () => {
    const values = [10, 10, 10, 10];
    const result = calculateDynamicThreshold(values, 3);
    expect(result).toBe(10);
  });

  it('returns higher threshold with variance', () => {
    const values = [0, 20];
    const result = calculateDynamicThreshold(values, 3);
    expect(result).toBeGreaterThan(10);
  });

  it('returns 0 for empty array', () => {
    expect(calculateDynamicThreshold([])).toBe(0);
  });

  it('uses default multiplier of 3', () => {
    const values = [5, 15];
    const withDefault = calculateDynamicThreshold(values);
    const withExplicit = calculateDynamicThreshold(values, 3);
    expect(withDefault).toBe(withExplicit);
  });
});
