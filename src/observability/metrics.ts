/**
 * Metrics - OpenTelemetry metrics configuration
 */

import { metrics, Counter, Histogram } from '@opentelemetry/api';

export interface MetricsConfig {
  serviceName: string;
  otlpEndpoint?: string;
  enabled: boolean;
}

let metricsInitialized = false;

let generationCounter: Counter;
let sectionCounter: Counter;
let agentCallCounter: Counter;
let analysisDurationHistogram: Histogram;
let agentCostCounter: Counter;

let completenessScore = 0;
let completenessService = '';

function ensureInitialized(): void {
  if (metricsInitialized) return;

  const meter = metrics.getMeter('agent-runbook-generator', '1.0.0');

  generationCounter = meter.createCounter('runbook_generation_total', {
    description: 'Total number of runbook generations',
  });

  sectionCounter = meter.createCounter('runbook_section_generated_total', {
    description: 'Total number of runbook sections generated',
  });

  agentCallCounter = meter.createCounter('agent_api_calls_total', {
    description: 'Total number of agent API calls',
  });

  analysisDurationHistogram = meter.createHistogram('analysis_duration_ms', {
    description: 'Analysis duration in milliseconds',
    unit: 'ms',
  });

  agentCostCounter = meter.createCounter('agent_cost_total', {
    description: 'Total agent API cost',
  });

  metricsInitialized = true;
}

/**
 * Initialize metrics
 */
export function initMetrics(_config: MetricsConfig): void {
  ensureInitialized();
}

/**
 * Record runbook generation
 */
export function recordGeneration(status: 'success' | 'failure' | 'warning'): void {
  ensureInitialized();
  generationCounter.add(1, { status });
}

/**
 * Record section generation
 */
export function recordSectionGenerated(sectionType: string): void {
  ensureInitialized();
  sectionCounter.add(1, { section_type: sectionType });
}

/**
 * Record agent API call
 */
export function recordAgentCall(provider: string, status: 'success' | 'failure'): void {
  ensureInitialized();
  agentCallCounter.add(1, { provider, status });
}

/**
 * Record analysis duration
 */
export function recordAnalysisDuration(component: string, durationMs: number): void {
  ensureInitialized();
  analysisDurationHistogram.record(durationMs, { component });
}

/**
 * Record agent cost
 */
export function recordAgentCost(provider: string, cost: number): void {
  ensureInitialized();
  agentCostCounter.add(cost, { provider });
}

/**
 * Record completeness score
 */
export function recordCompleteness(service: string, score: number): void {
  completenessScore = score;
  completenessService = service;
}

/**
 * Get current completeness score (for debugging)
 */
export function getCompletenessScore(): { score: number; service: string } {
  return { score: completenessScore, service: completenessService };
}

/**
 * Shutdown metrics
 */
export async function shutdownMetrics(): Promise<void> {
  metricsInitialized = false;
}
