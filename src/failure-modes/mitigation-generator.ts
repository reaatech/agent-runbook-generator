/**
 * Mitigation Generator - Generates mitigation strategies for failure modes
 */

import { type FailureMode, type AnalysisContext } from '../types/domain.js';

export interface MitigationPlan {
  failureMode: FailureMode;
  immediateActions: string[];
  shortTermFixes: string[];
  longTermImprovements: string[];
  codeChanges: CodeChange[];
  monitoringChanges: MonitoringChange[];
}

export interface CodeChange {
  file?: string;
  description: string;
  codeSnippet?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MonitoringChange {
  metric: string;
  threshold: number;
  alertSeverity: 'critical' | 'warning';
  description: string;
}

/**
 * Generate mitigation strategies for identified failure modes
 */
export function generateMitigations(
  failureModes: FailureMode[],
  context: AnalysisContext,
): MitigationPlan[] {
  return failureModes.map((mode) => generateMitigationForMode(mode, context));
}

/**
 * Generate mitigation for a specific failure mode
 */
function generateMitigationForMode(
  mode: FailureMode,
  _context: AnalysisContext,
): MitigationPlan {
  const plan: MitigationPlan = {
    failureMode: mode,
    immediateActions: [],
    shortTermFixes: [],
    longTermImprovements: [],
    codeChanges: [],
    monitoringChanges: [],
  };

  // Generate based on failure mode name
  switch (mode.name.toLowerCase()) {
    case 'database connection failure':
      plan.immediateActions = [
        'Check database connectivity',
        'Verify database credentials',
        'Check connection pool status',
      ];
      plan.shortTermFixes = [
        'Increase connection pool size',
        'Enable connection retry logic',
        'Add connection timeout configuration',
      ];
      plan.longTermImprovements = [
        'Implement circuit breaker pattern',
        'Add read replicas for failover',
        'Implement connection pooling with PgBouncer',
      ];
      plan.codeChanges = [
        {
          description: 'Add circuit breaker to database calls',
          codeSnippet: `const circuitBreaker = new CircuitBreaker(db.query, {
  threshold: 5,
  timeout: 30000,
});`,
          priority: 'high',
        },
      ];
      plan.monitoringChanges = [
        {
          metric: 'database_connection_errors',
          threshold: 10,
          alertSeverity: 'critical',
          description: 'Database connection errors per minute',
        },
      ];
      break;

    case 'memory exhaustion':
      plan.immediateActions = [
        'Restart affected instances',
        'Scale horizontally to distribute load',
        'Clear application caches if safe',
      ];
      plan.shortTermFixes = [
        'Increase memory limits',
        'Enable memory profiling',
        'Review recent code changes',
      ];
      plan.longTermImprovements = [
        'Implement memory leak detection',
        'Add memory usage alerts',
        'Optimize data structures and caching',
      ];
      plan.codeChanges = [
        {
          description: 'Add memory usage monitoring',
          codeSnippet: `setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > MAX_MEMORY) {
    logger.warn('Memory usage critical', { usage });
  }
}, 60000);`,
          priority: 'high',
        },
      ];
      plan.monitoringChanges = [
        {
          metric: 'memory_utilization_percent',
          threshold: 85,
          alertSeverity: 'warning',
          description: 'Memory utilization percentage',
        },
        {
          metric: 'memory_utilization_percent',
          threshold: 95,
          alertSeverity: 'critical',
          description: 'Critical memory utilization',
        },
      ];
      break;

    case 'cpu exhaustion':
      plan.immediateActions = [
        'Scale horizontally',
        'Identify and kill runaway processes',
        'Enable rate limiting',
      ];
      plan.shortTermFixes = [
        'Profile CPU usage',
        'Optimize hot code paths',
        'Review algorithm complexity',
      ];
      plan.longTermImprovements = [
        'Implement request queuing',
        'Add auto-scaling based on CPU',
        'Consider async processing for heavy tasks',
      ];
      plan.monitoringChanges = [
        {
          metric: 'cpu_utilization_percent',
          threshold: 80,
          alertSeverity: 'warning',
          description: 'CPU utilization percentage',
        },
      ];
      break;

    case 'network partition':
      plan.immediateActions = [
        'Check network connectivity',
        'Verify DNS resolution',
        'Check firewall rules',
      ];
      plan.shortTermFixes = [
        'Enable retry with exponential backoff',
        'Add timeout configurations',
        'Implement health checks',
      ];
      plan.longTermImprovements = [
        'Implement circuit breaker pattern',
        'Add fallback mechanisms',
        'Consider multi-region deployment',
      ];
      plan.codeChanges = [
        {
          description: 'Add retry with exponential backoff',
          codeSnippet: `async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}`,
          priority: 'high',
        },
      ];
      break;

    case 'cache failure':
      plan.immediateActions = [
        'Check cache connectivity',
        'Verify cache credentials',
        'Check cache memory usage',
      ];
      plan.shortTermFixes = [
        'Enable local cache fallback',
        'Increase cache timeout',
        'Review cache eviction policies',
      ];
      plan.longTermImprovements = [
        'Implement cache-aside pattern',
        'Add cache warming on startup',
        'Consider cache clustering',
      ];
      plan.codeChanges = [
        {
          description: 'Add cache fallback to database',
          codeSnippet: `async function getWithFallback(key) {
  try {
    const cached = await cache.get(key);
    if (cached) return cached;
  } catch (err) {
    logger.warn('Cache miss, falling back to DB', { key });
  }
  return database.get(key);
}`,
          priority: 'medium',
        },
      ];
      break;

    case 'queue overflow':
      plan.immediateActions = [
        'Scale consumers horizontally',
        'Increase consumer processing rate',
        'Check for poison messages',
      ];
      plan.shortTermFixes = [
        'Enable dead letter queue',
        'Add message prioritization',
        'Review consumer batch size',
      ];
      plan.longTermImprovements = [
        'Implement auto-scaling consumers',
        'Add queue depth monitoring',
        'Consider queue partitioning',
      ];
      plan.monitoringChanges = [
        {
          metric: 'queue_depth',
          threshold: 1000,
          alertSeverity: 'warning',
          description: 'Queue depth threshold',
        },
      ];
      break;

    default:
      // Generic mitigation for unknown failure modes
      plan.immediateActions = [
        'Assess the impact and scope',
        'Check relevant logs and metrics',
        'Notify on-call team',
      ];
      plan.shortTermFixes = [
        'Implement appropriate monitoring',
        'Add error handling',
        'Review recent changes',
      ];
      plan.longTermImprovements = [
        'Add comprehensive testing',
        'Implement resilience patterns',
        'Document runbook procedures',
      ];
  }

  return plan;
}

/**
 * Suggest circuit breaker configuration
 */
export function suggestCircuitBreakerConfig(
  _serviceName: string,
): { threshold: number; timeout: number; resetTimeout: number } {
  return {
    threshold: 5, // Number of failures before opening
    timeout: 30000, // Time to wait before allowing a test request
    resetTimeout: 60000, // Time before resetting to half-open
  };
}

/**
 * Suggest retry configuration
 */
export function suggestRetryConfig(
  _serviceName: string,
): { maxRetries: number; baseDelay: number; maxDelay: number; factor: number } {
  return {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    factor: 2, // Exponential backoff
  };
}

/**
 * Suggest timeout configuration
 */
export function suggestTimeoutConfig(
  _serviceName: string,
): { connect: number; request: number; idle: number } {
  return {
    connect: 5000, // 5 seconds
    request: 30000, // 30 seconds
    idle: 60000, // 60 seconds
  };
}
