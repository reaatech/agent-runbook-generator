/**
 * Metric Identifier - Identifies key metrics from code instrumentation
 */

import { type AnalysisContext } from '@reaatech/agent-runbook';
import { listFiles, readFile } from '@reaatech/agent-runbook';

export interface IdentifiedMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels?: string[];
  unit?: string;
}

/**
 * Identify metrics from repository code
 */
export function identifyMetrics(repoPath: string, context: AnalysisContext): IdentifiedMetric[] {
  const metrics: IdentifiedMetric[] = [];
  const files = listFiles(repoPath, true);

  // Standard RED metrics (Rate, Errors, Duration)
  metrics.push(...getRedMetrics(context.serviceDefinition.name));

  // Standard USE metrics (Utilization, Saturation, Errors)
  metrics.push(...getUseMetrics(context.serviceDefinition.name));

  // SLO metrics
  metrics.push(...getSloMetrics(context.serviceDefinition.name));

  // Language-specific metrics
  const language = context.repositoryAnalysis.language;
  if (language === 'typescript' || language === 'javascript') {
    metrics.push(...getNodejsMetrics());
  } else if (language === 'python') {
    metrics.push(...getPythonMetrics());
  } else if (language === 'go') {
    metrics.push(...getGoMetrics());
  }

  // Check for existing metrics in code
  const existingMetrics = findExistingMetrics(files, repoPath, language);
  for (const metric of existingMetrics) {
    if (!metrics.find((m) => m.name === metric.name)) {
      metrics.push(metric);
    }
  }

  return metrics;
}

/**
 * Get RED metrics (Rate, Errors, Duration)
 */
function getRedMetrics(serviceName: string): IdentifiedMetric[] {
  return [
    {
      name: `${serviceName}_requests_total`,
      type: 'counter',
      description: 'Total number of requests',
      labels: ['method', 'path', 'status'],
    },
    {
      name: `${serviceName}_request_duration_seconds`,
      type: 'histogram',
      description: 'Request duration in seconds',
      labels: ['method', 'path'],
      unit: 'seconds',
    },
    {
      name: `${serviceName}_requests_in_progress`,
      type: 'gauge',
      description: 'Number of requests currently being processed',
      labels: ['method'],
    },
  ];
}

/**
 * Get USE metrics (Utilization, Saturation, Errors)
 */
function getUseMetrics(serviceName: string): IdentifiedMetric[] {
  return [
    {
      name: `${serviceName}_cpu_usage_seconds_total`,
      type: 'counter',
      description: 'CPU usage in seconds',
      unit: 'seconds',
    },
    {
      name: `${serviceName}_memory_usage_bytes`,
      type: 'gauge',
      description: 'Memory usage in bytes',
      unit: 'bytes',
    },
    {
      name: `${serviceName}_disk_usage_bytes`,
      type: 'gauge',
      description: 'Disk usage in bytes',
      unit: 'bytes',
    },
    {
      name: `${serviceName}_connection_pool_active`,
      type: 'gauge',
      description: 'Number of active connections in the pool',
    },
    {
      name: `${serviceName}_queue_length`,
      type: 'gauge',
      description: 'Current queue length',
    },
  ];
}

/**
 * Get SLO metrics
 */
function getSloMetrics(serviceName: string): IdentifiedMetric[] {
  return [
    {
      name: `${serviceName}_slo_availability_total`,
      type: 'counter',
      description: 'Total availability samples for SLO calculation',
      labels: ['success'],
    },
    {
      name: `${serviceName}_errors_total`,
      type: 'counter',
      description: 'Total number of errors',
      labels: ['type'],
    },
  ];
}

/**
 * Get Node.js specific metrics
 */
function getNodejsMetrics(): IdentifiedMetric[] {
  return [
    {
      name: 'nodejs_event_loop_lag_seconds',
      type: 'gauge',
      description: 'Event loop lag in seconds',
      unit: 'seconds',
    },
    {
      name: 'nodejs_heap_size_bytes',
      type: 'gauge',
      description: 'Heap memory size in bytes',
      unit: 'bytes',
    },
    {
      name: 'nodejs_active_handles_total',
      type: 'gauge',
      description: 'Number of active handles',
    },
  ];
}

/**
 * Get Python specific metrics
 */
function getPythonMetrics(): IdentifiedMetric[] {
  return [
    {
      name: 'python_gc_objects_total',
      type: 'gauge',
      description: 'Number of objects in memory',
    },
    {
      name: 'python_gc_collections_total',
      type: 'counter',
      description: 'Number of garbage collection cycles',
    },
    {
      name: 'python_thread_count',
      type: 'gauge',
      description: 'Number of active threads',
    },
  ];
}

/**
 * Get Go specific metrics
 */
function getGoMetrics(): IdentifiedMetric[] {
  return [
    {
      name: 'go_goroutines',
      type: 'gauge',
      description: 'Number of active goroutines',
    },
    {
      name: 'go_gc_duration_seconds',
      type: 'summary',
      description: 'Garbage collection duration',
      unit: 'seconds',
    },
    {
      name: 'go_memstats_alloc_bytes',
      type: 'gauge',
      description: 'Memory allocated by the application',
      unit: 'bytes',
    },
  ];
}

/**
 * Find existing metrics in code
 */
function findExistingMetrics(
  files: string[],
  _repoPath: string,
  _language: string,
): IdentifiedMetric[] {
  const metrics: IdentifiedMetric[] = [];

  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    // Look for Prometheus metrics definitions
    if (
      content.includes('new Counter') ||
      content.includes('new Histogram') ||
      content.includes('new Gauge')
    ) {
      const counterMatch = content.match(
        /new (Counter|Histogram|Gauge)\(['"]([^'"]+)['"]\s*,\s*{[^}]*description:\s*['"]([^'"]*)['"]/g,
      );
      if (counterMatch) {
        for (const match of counterMatch) {
          const typeMatch = match.match(/new (Counter|Histogram|Gauge)/);
          const nameMatch = match.match(/['"]([^'"]+)['"]/);
          const descMatch = match.match(/description:\s*['"]([^'"]*)['"]/);
          if (typeMatch && nameMatch) {
            metrics.push({
              name: nameMatch[1]!,
              type: typeMatch[1]!.toLowerCase() as IdentifiedMetric['type'],
              description: descMatch?.[1] ?? '',
            });
          }
        }
      }
    }
  }

  return metrics;
}

/**
 * Suggest metrics based on service type
 */
export function suggestMetricsForService(
  serviceType: string,
  serviceName: string,
): IdentifiedMetric[] {
  const metrics: IdentifiedMetric[] = [];

  switch (serviceType) {
    case 'web-api':
      metrics.push(...getRedMetrics(serviceName), ...getUseMetrics(serviceName));
      break;
    case 'worker':
      metrics.push(
        {
          name: `${serviceName}_jobs_processed_total`,
          type: 'counter',
          description: 'Total number of jobs processed',
          labels: ['status', 'job_type'],
        },
        {
          name: `${serviceName}_job_duration_seconds`,
          type: 'histogram',
          description: 'Job processing duration',
          labels: ['job_type'],
          unit: 'seconds',
        },
        {
          name: `${serviceName}_queue_depth`,
          type: 'gauge',
          description: 'Current queue depth',
        },
      );
      break;
    case 'lambda':
    case 'function':
      metrics.push(
        {
          name: `${serviceName}_invocations_total`,
          type: 'counter',
          description: 'Total number of function invocations',
          labels: ['status'],
        },
        {
          name: `${serviceName}_duration_seconds`,
          type: 'histogram',
          description: 'Function execution duration',
          unit: 'seconds',
        },
        {
          name: `${serviceName}_cold_starts_total`,
          type: 'counter',
          description: 'Number of cold starts',
        },
      );
      break;
    default:
      metrics.push(...getRedMetrics(serviceName));
  }

  return metrics;
}
