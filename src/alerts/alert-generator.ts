/**
 * Alert Generator - Generates alert definitions based on service patterns
 */

import {
  type AlertDefinition,
  type AnalysisContext,
  type SLOTargets,
} from '../types/domain.js';

export interface AlertGenerationConfig {
  sloTargets?: SLOTargets;
  serviceName?: string;
  platform?: 'prometheus' | 'datadog' | 'cloudwatch';
}

/**
 * Generate alert definitions for a service
 */
export function generateAlerts(
  context: AnalysisContext,
  config: AlertGenerationConfig = {},
): AlertDefinition[] {
  const { sloTargets, serviceName, platform = 'prometheus' } = config;
  const alerts: AlertDefinition[] = [];

  const service = serviceName ?? context.serviceDefinition.name;

  // SLO-based alerts
  if (sloTargets) {
    alerts.push(...generateSloAlerts(service, sloTargets, platform));
  }

  // Resource alerts
  alerts.push(...generateResourceAlerts(service, platform));

  // Application alerts
  alerts.push(...generateApplicationAlerts(service, context, platform));

  // Saturation alerts
  alerts.push(...generateSaturationAlerts(service, platform));

  return alerts;
}

/**
 * Generate SLO burn rate alerts
 */
function generateSloAlerts(
  service: string,
  sloTargets: SLOTargets,
  _platform: string,
): AlertDefinition[] {
  const alerts: AlertDefinition[] = [];
  const availability = sloTargets.availability / 100;
  const errorBudget = 1 - availability;

  // Multi-window burn rate alerts for availability SLO
  // Fast burn - 14.4x error rate for 1 hour (consumes 2% error budget)
  alerts.push({
    name: `${service}_slo_availability_fast_burn`,
    type: 'slo_burn_rate',
    severity: 'critical',
    expression: buildBurnRateExpression(service, errorBudget, 14.4, '1h'),
    for: '1h',
    annotations: {
      summary: `${service} is in fast burn for availability SLO`,
      description: `Error rate is ${14.4}x the sustainable rate. At this rate, the monthly error budget will be exhausted in ~2 days.`,
    },
    labels: { severity: 'critical', slo: 'availability', alert_type: 'burn_rate' },
  });

  // Slow burn - 6x error rate for 3 days (consumes 10% error budget)
  alerts.push({
    name: `${service}_slo_availability_slow_burn`,
    type: 'slo_burn_rate',
    severity: 'warning',
    expression: buildBurnRateExpression(service, errorBudget, 6, '3d'),
    for: '30m',
    annotations: {
      summary: `${service} is in slow burn for availability SLO`,
      description: `Error rate is ${6}x the sustainable rate. At this rate, the monthly error budget will be exhausted in ~5 days.`,
    },
    labels: { severity: 'warning', slo: 'availability', alert_type: 'burn_rate' },
  });

  // Latency SLO alert
  if (sloTargets.latencyP99) {
    alerts.push({
      name: `${service}_slo_latency_p99`,
      type: 'slo_burn_rate',
      severity: 'warning',
      expression: `histogram_quantile(0.99, rate(${service}_request_duration_seconds_bucket[5m])) > ${sloTargets.latencyP99 / 1000}`,
      for: '5m',
      annotations: {
        summary: `${service} is violating latency P99 SLO`,
        description: `P99 latency is above ${sloTargets.latencyP99}ms threshold`,
      },
      labels: { severity: 'warning', slo: 'latency', alert_type: 'slo' },
    });
  }

  return alerts;
}

/**
 * Generate resource utilization alerts
 */
function generateResourceAlerts(
  service: string,
  _platform: string,
): AlertDefinition[] {
  return [
    {
      name: `${service}_high_cpu`,
      type: 'resource',
      severity: 'warning',
      expression: `avg(rate(${service}_cpu_usage_seconds_total[5m])) by (instance) > 0.8`,
      for: '10m',
      annotations: {
        summary: `${service} has high CPU usage`,
        description: 'CPU usage is above 80% for more than 10 minutes',
      },
      labels: { severity: 'warning', resource: 'cpu' },
    },
    {
      name: `${service}_high_memory`,
      type: 'resource',
      severity: 'warning',
      expression: `(${service}_memory_usage_bytes / ${service}_memory_limit_bytes) > 0.85`,
      for: '10m',
      annotations: {
        summary: `${service} has high memory usage`,
        description: 'Memory usage is above 85% for more than 10 minutes',
      },
      labels: { severity: 'warning', resource: 'memory' },
    },
    {
      name: `${service}_high_disk`,
      type: 'resource',
      severity: 'warning',
      expression: `(${service}_disk_usage_bytes / ${service}_disk_total_bytes) > 0.85`,
      for: '10m',
      annotations: {
        summary: `${service} has high disk usage`,
        description: 'Disk usage is above 85% for more than 10 minutes',
      },
      labels: { severity: 'warning', resource: 'disk' },
    },
  ];
}

/**
 * Generate application-level alerts
 */
function generateApplicationAlerts(
  service: string,
  context: AnalysisContext,
  _platform: string,
): AlertDefinition[] {
  const alerts: AlertDefinition[] = [];

  // High error rate
  alerts.push({
    name: `${service}_high_error_rate`,
    type: 'application',
    severity: 'critical',
    expression: `(rate(${service}_requests_total{status=~"5.."}[5m]) / rate(${service}_requests_total[5m])) * 100 > 1`,
    for: '5m',
    annotations: {
      summary: `${service} has high error rate`,
      description: 'Error rate is above 1% for more than 5 minutes',
    },
    labels: { severity: 'critical', alert_type: 'error_rate' },
  });

  // High latency P99
  alerts.push({
    name: `${service}_high_latency_p99`,
    type: 'application',
    severity: 'warning',
    expression: `histogram_quantile(0.99, rate(${service}_request_duration_seconds_bucket[5m])) > 1`,
    for: '5m',
    annotations: {
      summary: `${service} has high P99 latency`,
      description: 'P99 latency is above 1 second for more than 5 minutes',
    },
    labels: { severity: 'warning', alert_type: 'latency' },
  });

  // High latency P95
  alerts.push({
    name: `${service}_high_latency_p95`,
    type: 'application',
    severity: 'warning',
    expression: `histogram_quantile(0.95, rate(${service}_request_duration_seconds_bucket[5m])) > 0.5`,
    for: '5m',
    annotations: {
      summary: `${service} has high P95 latency`,
      description: 'P95 latency is above 500ms for more than 5 minutes',
    },
    labels: { severity: 'warning', alert_type: 'latency' },
  });

  // Low throughput (potential traffic drop)
  alerts.push({
    name: `${service}_low_throughput`,
    type: 'application',
    severity: 'warning',
    expression: `rate(${service}_requests_total[5m]) < 10`,
    for: '10m',
    annotations: {
      summary: `${service} has unusually low throughput`,
      description: 'Request rate is below 10 req/s for more than 10 minutes',
    },
    labels: { severity: 'warning', alert_type: 'throughput' },
  });

  // Instance down
  alerts.push({
    name: `${service}_instance_down`,
    type: 'application',
    severity: 'critical',
    expression: `up{job="${service}"} == 0`,
    for: '1m',
    annotations: {
      summary: `${service} instance is down`,
      description: 'An instance of the service is not responding',
    },
    labels: { severity: 'critical', alert_type: 'availability' },
  });

  // Database connection errors
  const hasDatabase = context.externalServices.some(s => s.type === 'database');
  if (hasDatabase) {
    alerts.push({
      name: `${service}_database_errors`,
      type: 'application',
      severity: 'critical',
      expression: `rate(${service}_database_errors_total[5m]) > 0`,
      for: '2m',
      annotations: {
        summary: `${service} has database connection errors`,
        description: 'Database errors detected',
      },
      labels: { severity: 'critical', alert_type: 'database' },
    });
  }

  // Cache errors
  const hasCache = context.externalServices.some(s => s.type === 'cache');
  if (hasCache) {
    alerts.push({
      name: `${service}_cache_errors`,
      type: 'application',
      severity: 'warning',
      expression: `rate(${service}_cache_errors_total[5m]) > 0`,
      for: '2m',
      annotations: {
        summary: `${service} has cache errors`,
        description: 'Cache connection errors detected',
      },
      labels: { severity: 'warning', alert_type: 'cache' },
    });
  }

  return alerts;
}

/**
 * Generate saturation alerts
 */
function generateSaturationAlerts(
  service: string,
  _platform: string,
): AlertDefinition[] {
  return [
    {
      name: `${service}_connection_pool_saturation`,
      type: 'resource',
      severity: 'warning',
      expression: `${service}_connection_pool_active / ${service}_connection_pool_max > 0.8`,
      for: '5m',
      annotations: {
        summary: `${service} connection pool is near saturation`,
        description: 'Connection pool utilization is above 80%',
      },
      labels: { severity: 'warning', resource: 'connections' },
    },
    {
      name: `${service}_queue_saturation`,
      type: 'resource',
      severity: 'warning',
      expression: `${service}_queue_length > 1000`,
      for: '10m',
      annotations: {
        summary: `${service} queue is saturating`,
        description: 'Queue length is above 1000 items',
      },
      labels: { severity: 'warning', resource: 'queue' },
    },
    {
      name: `${service}_thread_pool_saturation`,
      type: 'resource',
      severity: 'warning',
      expression: `${service}_thread_pool_active / ${service}_thread_pool_max > 0.8`,
      for: '5m',
      annotations: {
        summary: `${service} thread pool is near saturation`,
        description: 'Thread pool utilization is above 80%',
      },
      labels: { severity: 'warning', resource: 'threads' },
    },
  ];
}

/**
 * Build a burn rate expression for SLO alerts
 */
function buildBurnRateExpression(
  service: string,
  errorBudget: number,
  multiplier: number,
  window: string,
): string {
  // Burn rate = (error rate) / (error budget)
  // Alert when burn rate > multiplier
  return `rate(${service}_errors_total[${window}]) / rate(${service}_requests_total[${window}]) > ${multiplier} * ${errorBudget}`;
}

/**
 * Format alerts for a specific platform
 */
export function formatAlertsForPlatform(
  alerts: AlertDefinition[],
  platform: 'prometheus' | 'datadog' | 'cloudwatch',
): string {
  switch (platform) {
    case 'prometheus':
      return formatPrometheusAlerts(alerts);
    case 'datadog':
      return formatDatadogAlerts(alerts);
    case 'cloudwatch':
      return formatCloudWatchAlerts(alerts);
    default:
      return formatPrometheusAlerts(alerts);
  }
}

/**
 * Format alerts as Prometheus rules
 */
function formatPrometheusAlerts(alerts: AlertDefinition[]): string {
  let output = 'groups:\n';
  output += '  - name: service_alerts\n';
  output += '    rules:\n';

  for (const alert of alerts) {
    output += `    - alert: ${alert.name}\n`;
    output += `      expr: ${alert.expression}\n`;
    if (alert.for) {
      output += `      for: ${alert.for}\n`;
    }
    output += '      labels:\n';
    if (alert.labels) {
      for (const [key, value] of Object.entries(alert.labels)) {
        output += `        ${key}: ${value}\n`;
      }
    }
    output += '      annotations:\n';
    output += `        summary: ${alert.annotations.summary}\n`;
    output += `        description: ${alert.annotations.description}\n`;
    if (alert.annotations.runbookUrl) {
      output += `        runbook: ${alert.annotations.runbookUrl}\n`;
    }
  }

  return output;
}

/**
 * Format alerts as Datadog monitors
 */
function formatDatadogAlerts(alerts: AlertDefinition[]): string {
  let output = 'monitors:\n';

  for (const alert of alerts) {
    output += `  - name: ${alert.name}\n`;
    output += `    type: metric alert\n`;
    output += `    query: ${alert.expression}\n`;
    output += '    options:\n';
    output += `      notify_no_data: true\n`;
    output += `      no_data_timeframe: 10\n`;
    output += `      message: "${alert.annotations.summary}\\n\\n${alert.annotations.description}"\n`;
    if (alert.for) {
      output += `      notify_audit: true\n`;
    }
  }

  return output;
}

/**
 * Format alerts as CloudWatch alarms
 */
function formatCloudWatchAlerts(alerts: AlertDefinition[]): string {
  const alarms = alerts.map(alert => ({
    AlarmName: alert.name,
    AlarmDescription: alert.annotations.description,
    MetricName: alert.name.replace(/_/g, '_'),
    Namespace: 'ServiceMetrics',
    Statistic: 'Average',
    Period: 300,
    EvaluationPeriods: 1,
    Threshold: 1,
    ComparisonOperator: 'GreaterThanThreshold',
    AlarmActions: ['<YOUR_SNS_ALARM_TOPIC_ARN>'],
  }));

  return JSON.stringify({ Alarm: alarms }, null, 2);
}
