/**
 * Alert Extractor - Extracts existing alert definitions from configs
 */

import YAML from 'yaml';
import { type AlertDefinition } from '../types/domain.js';
import { readFile, listFiles } from '../utils/index.js';

export interface ExtractedAlerts {
  alerts: AlertDefinition[];
  sloAlerts: AlertDefinition[];
  resourceAlerts: AlertDefinition[];
}

/**
 * Extract alert definitions from repository configuration files
 */
export function extractAlerts(repoPath: string): ExtractedAlerts {
  const files = listFiles(repoPath, true);
  const alerts: AlertDefinition[] = [];
  const sloAlerts: AlertDefinition[] = [];
  const resourceAlerts: AlertDefinition[] = [];

  // Find Prometheus alerting rules
  const prometheusFiles = files.filter(
    (f) =>
      (f.endsWith('.yaml') || f.endsWith('.yml')) &&
      (f.includes('prometheus') || f.includes('alerts') || f.includes('rules')),
  );

  for (const file of prometheusFiles) {
    const content = readFile(file);
    if (!content) continue;

    try {
      const parsed = YAML.parse(content);
      if (parsed?.groups) {
        for (const group of parsed.groups) {
          if (group.rules) {
            for (const rule of group.rules) {
              if (rule.alert) {
                const alert = parsePrometheusAlert(rule, group.name, file, repoPath);
                alerts.push(alert);

                if (rule.labels?.severity === 'critical' || rule.labels?.severity === 'warning') {
                  if (rule.expr?.includes('slo') || rule.expr?.includes('error_budget')) {
                    sloAlerts.push(alert);
                  } else if (
                    rule.expr?.includes('cpu') ||
                    rule.expr?.includes('memory') ||
                    rule.expr?.includes('disk')
                  ) {
                    resourceAlerts.push(alert);
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Skip invalid YAML
    }
  }

  // Find Datadog monitors
  const datadogFiles = files.filter((f) => f.toLowerCase().includes('datadog'));
  for (const file of datadogFiles) {
    const content = readFile(file);
    if (!content) continue;

    try {
      const parsed = YAML.parse(content);
      if (parsed?.monitors) {
        for (const monitor of parsed.monitors) {
          if (monitor.name && monitor.query) {
            alerts.push(parseDatadogMonitor(monitor, file, repoPath));
          }
        }
      }
    } catch {
      // Skip invalid YAML
    }
  }

  return { alerts, sloAlerts, resourceAlerts };
}

/**
 * Parse a Prometheus alerting rule
 */
function parsePrometheusAlert(
  rule: Record<string, unknown>,
  _groupName: string,
  _file: string,
  _repoPath: string,
): AlertDefinition {
  const annotations = (rule.annotations as Record<string, unknown>) ?? {};
  const labels = (rule.labels as Record<string, unknown>) ?? {};

  return {
    name: String(rule.alert ?? 'unknown'),
    type: 'application',
    severity: (labels.severity as string) === 'critical' ? 'critical' : 'warning',
    expression: String(rule.expr ?? ''),
    for: rule.for ? String(rule.for) : undefined,
    annotations: {
      summary: String(annotations.summary ?? rule.alert ?? ''),
      description: String(annotations.description ?? ''),
      dashboardUrl: annotations.dashboard ? String(annotations.dashboard) : undefined,
      runbookUrl: annotations.runbook ? String(annotations.runbook) : undefined,
    },
    labels: labels as Record<string, string>,
  };
}

/**
 * Parse a Datadog monitor definition
 */
function parseDatadogMonitor(
  monitor: Record<string, unknown>,
  _file: string,
  _repoPath: string,
): AlertDefinition {
  const options = (monitor.options as Record<string, unknown>) ?? {};
  const thresholds = (options.thresholds as Record<string, unknown>) ?? {};

  return {
    name: String(monitor.name ?? 'unknown'),
    type: 'application',
    severity: thresholds.critical ? 'critical' : 'warning',
    expression: String(monitor.query ?? ''),
    annotations: {
      summary: String(monitor.message ?? ''),
      description: '',
    },
    labels: {
      source: 'datadog',
    },
  };
}

/**
 * Generate default alerts based on service patterns
 */
export function generateDefaultAlerts(
  serviceName: string,
  hasDatabase: boolean,
  hasCache: boolean,
  hasQueue: boolean,
): AlertDefinition[] {
  const alerts: AlertDefinition[] = [];

  // High error rate alert
  alerts.push({
    name: `${serviceName}_high_error_rate`,
    type: 'application',
    severity: 'critical',
    expression: `rate(${serviceName}_requests_total{status=~"5.."}[5m]) / rate(${serviceName}_requests_total[5m]) > 0.05`,
    for: '5m',
    annotations: {
      summary: `${serviceName} has high error rate`,
      description: `Error rate is above 5% for more than 5 minutes`,
    },
    labels: { severity: 'critical', team: 'platform' },
  });

  // High latency alert
  alerts.push({
    name: `${serviceName}_high_latency`,
    type: 'application',
    severity: 'warning',
    expression: `histogram_quantile(0.95, rate(${serviceName}_request_duration_seconds_bucket[5m])) > 0.5`,
    for: '5m',
    annotations: {
      summary: `${serviceName} has high latency`,
      description: `P95 latency is above 500ms for more than 5 minutes`,
    },
    labels: { severity: 'warning', team: 'platform' },
  });

  // Database connection alert
  if (hasDatabase) {
    alerts.push({
      name: `${serviceName}_database_connection_error`,
      type: 'application',
      severity: 'critical',
      expression: `increase(${serviceName}_database_connection_errors_total[5m]) > 0`,
      for: '2m',
      annotations: {
        summary: `${serviceName} has database connection errors`,
        description: `Database connection failures detected`,
      },
      labels: { severity: 'critical', team: 'platform' },
    });
  }

  // Cache connection alert
  if (hasCache) {
    alerts.push({
      name: `${serviceName}_cache_connection_error`,
      type: 'application',
      severity: 'warning',
      expression: `increase(${serviceName}_cache_connection_errors_total[5m]) > 0`,
      for: '2m',
      annotations: {
        summary: `${serviceName} has cache connection errors`,
        description: `Cache connection failures detected`,
      },
      labels: { severity: 'warning', team: 'platform' },
    });
  }

  // Queue backlog alert
  if (hasQueue) {
    alerts.push({
      name: `${serviceName}_queue_backlog_high`,
      type: 'application',
      severity: 'warning',
      expression: `${serviceName}_queue_depth > 1000`,
      for: '10m',
      annotations: {
        summary: `${serviceName} has high queue backlog`,
        description: `Queue depth is above 1000 for more than 10 minutes`,
      },
      labels: { severity: 'warning', team: 'platform' },
    });
  }

  return alerts;
}
