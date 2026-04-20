/**
 * Threshold Calculator - Calculates alert thresholds based on SLO targets
 */

import { type SLOTargets, type ThresholdConfig } from '../types/domain.js';

export interface ThresholdRecommendation {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  window: string;
  description: string;
}

/**
 * Calculate thresholds based on SLO targets
 */
export function calculateSloThresholds(sloTargets: SLOTargets): ThresholdRecommendation[] {
  const recommendations: ThresholdRecommendation[] = [];
  const availability = sloTargets.availability / 100;
  const errorBudget = 1 - availability;

  // Error rate threshold based on availability SLO
  // For 99.9% availability, error rate should be < 0.1%
  recommendations.push({
    metric: 'error_rate',
    threshold: errorBudget * 100,
    operator: 'gt',
    window: '5m',
    description: `Error rate exceeds ${((1 - availability) * 100).toFixed(2)}% (based on ${sloTargets.availability}% availability SLO)`,
  });

  // Latency P99 threshold
  if (sloTargets.latencyP99) {
    recommendations.push({
      metric: 'latency_p99',
      threshold: sloTargets.latencyP99,
      operator: 'gt',
      window: '5m',
      description: `P99 latency exceeds ${sloTargets.latencyP99}ms`,
    });
  }

  // Latency P95 threshold (typically 80% of P99 target)
  if (sloTargets.latencyP99 && sloTargets.latencyP95) {
    recommendations.push({
      metric: 'latency_p95',
      threshold: sloTargets.latencyP95,
      operator: 'gt',
      window: '5m',
      description: `P95 latency exceeds ${sloTargets.latencyP95}ms`,
    });
  }

  return recommendations;
}

/**
 * Calculate resource saturation thresholds
 */
export function calculateResourceThresholds(): ThresholdRecommendation[] {
  return [
    {
      metric: 'cpu_utilization',
      threshold: 80,
      operator: 'gt',
      window: '10m',
      description: 'CPU utilization exceeds 80%',
    },
    {
      metric: 'memory_utilization',
      threshold: 85,
      operator: 'gt',
      window: '10m',
      description: 'Memory utilization exceeds 85%',
    },
    {
      metric: 'disk_utilization',
      threshold: 85,
      operator: 'gt',
      window: '10m',
      description: 'Disk utilization exceeds 85%',
    },
    {
      metric: 'connection_pool_utilization',
      threshold: 80,
      operator: 'gt',
      window: '5m',
      description: 'Connection pool utilization exceeds 80%',
    },
  ];
}

/**
 * Calculate multi-window burn rate thresholds
 */
export function calculateBurnRateThresholds(sloTargets: SLOTargets): ThresholdRecommendation[] {
  const availability = sloTargets.availability / 100;
  const errorBudget = 1 - availability;
  const recommendations: ThresholdRecommendation[] = [];

  // Fast burn: 14.4x error rate (exhausts 2% budget in 1 hour)
  recommendations.push({
    metric: 'burn_rate_fast',
    threshold: 14.4 * errorBudget,
    operator: 'gt',
    window: '1h',
    description: 'Fast burn rate detected - error rate is 14.4x sustainable rate',
  });

  // Slow burn: 6x error rate (exhausts 10% budget in 3 days)
  recommendations.push({
    metric: 'burn_rate_slow',
    threshold: 6 * errorBudget,
    operator: 'gt',
    window: '3d',
    description: 'Slow burn rate detected - error rate is 6x sustainable rate',
  });

  // Critical burn: 2x error rate (exhausts full budget in 30 days)
  recommendations.push({
    metric: 'burn_rate_critical',
    threshold: 2 * errorBudget,
    operator: 'gt',
    window: '30d',
    description: 'Critical burn rate - will exhaust monthly error budget',
  });

  return recommendations;
}

/**
 * Get default thresholds for common metrics
 */
export function getDefaultThresholds(): ThresholdConfig[] {
  return [
    { value: 0.95, color: 'green', operator: 'gte' },
    { value: 0.99, color: 'yellow', operator: 'gte' },
    { value: 1, color: 'red', operator: 'gt' },
  ];
}

/**
 * Calculate threshold based on historical data patterns
 */
export function calculateDynamicThreshold(values: number[], multiplier: number = 3): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return mean + multiplier * stdDev;
}
