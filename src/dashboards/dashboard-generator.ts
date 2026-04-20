/**
 * Dashboard Generator - Generates dashboard configurations for Grafana, Looker, CloudWatch
 */

import {
  type DashboardConfig,
  type DashboardPanel,
  type AnalysisContext,
  type MonitoringPlatform,
} from '../types/domain.js';
import { generateId } from '../utils/index.js';

export interface DashboardGenerationConfig {
  platform: MonitoringPlatform;
  serviceName: string;
  refreshInterval?: string;
  timeRange?: string;
}

/**
 * Generate dashboard configuration for a service
 */
export function generateDashboard(
  _context: AnalysisContext,
  config: DashboardGenerationConfig,
): DashboardConfig {
  const { platform, serviceName, refreshInterval = '30s', timeRange = '1h' } = config;

  const panels: DashboardPanel[] = [
    ...generateRequestPanels(serviceName),
    ...generateLatencyPanels(serviceName),
    ...generateErrorPanels(serviceName),
    ...generateResourcePanels(serviceName),
    ...generateSloPanels(serviceName),
  ];

  return {
    title: `${serviceName} - Service Dashboard`,
    platform,
    panels,
    refreshInterval,
    timeRange,
    variables: [
      {
        name: 'instance',
        type: 'query',
        query: `label_values(${serviceName}_requests_total, instance)`,
        default: 'all',
      },
      {
        name: 'method',
        type: 'query',
        query: `label_values(${serviceName}_requests_total, method)`,
        default: 'all',
      },
    ],
  };
}

/**
 * Generate request rate panels
 */
function generateRequestPanels(serviceName: string): DashboardPanel[] {
  return [
    {
      id: generateId('panel'),
      title: 'Request Rate',
      type: 'graph',
      query: `rate(${serviceName}_requests_total[5m])`,
      legend: '{{method}} {{path}}',
      unit: 'reqps',
      gridPos: { x: 0, y: 0, w: 12, h: 8 },
    },
    {
      id: generateId('panel'),
      title: 'Requests per Second',
      type: 'stat',
      query: `sum(rate(${serviceName}_requests_total[5m]))`,
      unit: 'reqps',
      gridPos: { x: 12, y: 0, w: 6, h: 4 },
    },
    {
      id: generateId('panel'),
      title: 'Requests In Progress',
      type: 'gauge',
      query: `sum(${serviceName}_requests_in_progress)`,
      unit: 'requests',
      thresholds: [
        { value: 0, color: 'green', operator: 'gte' },
        { value: 100, color: 'yellow', operator: 'gte' },
        { value: 500, color: 'red', operator: 'gte' },
      ],
      gridPos: { x: 18, y: 0, w: 6, h: 4 },
    },
  ];
}

/**
 * Generate latency panels
 */
function generateLatencyPanels(serviceName: string): DashboardPanel[] {
  return [
    {
      id: generateId('panel'),
      title: 'Request Latency (Heatmap)',
      type: 'heatmap',
      query: `rate(${serviceName}_request_duration_seconds_bucket[5m])`,
      legend: '{{le}}',
      unit: 'seconds',
      gridPos: { x: 0, y: 8, w: 12, h: 8 },
    },
    {
      id: generateId('panel'),
      title: 'P99 Latency',
      type: 'stat',
      query: `histogram_quantile(0.99, rate(${serviceName}_request_duration_seconds_bucket[5m]))`,
      unit: 'seconds',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 0.5, color: 'yellow', operator: 'lte' },
        { value: 1, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 12, y: 4, w: 6, h: 4 },
    },
    {
      id: generateId('panel'),
      title: 'P95 Latency',
      type: 'stat',
      query: `histogram_quantile(0.95, rate(${serviceName}_request_duration_seconds_bucket[5m]))`,
      unit: 'seconds',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 0.3, color: 'yellow', operator: 'lte' },
        { value: 0.5, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 18, y: 4, w: 6, h: 4 },
    },
  ];
}

/**
 * Generate error rate panels
 */
function generateErrorPanels(serviceName: string): DashboardPanel[] {
  return [
    {
      id: generateId('panel'),
      title: 'Error Rate',
      type: 'graph',
      query: `rate(${serviceName}_requests_total{status=~"5.."}[5m]) / rate(${serviceName}_requests_total[5m]) * 100`,
      legend: 'Error Rate %',
      unit: 'percent',
      gridPos: { x: 0, y: 16, w: 12, h: 6 },
    },
    {
      id: generateId('panel'),
      title: 'Error Rate %',
      type: 'stat',
      query: `rate(${serviceName}_requests_total{status=~"5.."}[5m]) / rate(${serviceName}_requests_total[5m]) * 100`,
      unit: 'percent',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 1, color: 'yellow', operator: 'lte' },
        { value: 5, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 12, y: 8, w: 6, h: 4 },
    },
    {
      id: generateId('panel'),
      title: 'Error Count (5min)',
      type: 'stat',
      query: `sum(increase(${serviceName}_requests_total{status=~"5.."}[5m]))`,
      unit: 'errors',
      gridPos: { x: 18, y: 8, w: 6, h: 4 },
    },
  ];
}

/**
 * Generate resource utilization panels
 */
function generateResourcePanels(serviceName: string): DashboardPanel[] {
  return [
    {
      id: generateId('panel'),
      title: 'CPU Usage',
      type: 'graph',
      query: `avg(rate(${serviceName}_cpu_usage_seconds_total[5m])) by (instance) * 100`,
      legend: '{{instance}}',
      unit: 'percent',
      gridPos: { x: 0, y: 22, w: 8, h: 6 },
    },
    {
      id: generateId('panel'),
      title: 'Memory Usage',
      type: 'graph',
      query: `(${serviceName}_memory_usage_bytes / ${serviceName}_memory_limit_bytes) * 100`,
      legend: '{{instance}}',
      unit: 'percent',
      gridPos: { x: 8, y: 22, w: 8, h: 6 },
    },
    {
      id: generateId('panel'),
      title: 'Connection Pool',
      type: 'graph',
      query: `${serviceName}_connection_pool_active / ${serviceName}_connection_pool_max * 100`,
      legend: '{{instance}}',
      unit: 'percent',
      gridPos: { x: 16, y: 22, w: 8, h: 6 },
    },
  ];
}

/**
 * Generate SLO panels
 */
function generateSloPanels(serviceName: string): DashboardPanel[] {
  return [
    {
      id: generateId('panel'),
      title: 'SLO Availability',
      type: 'gauge',
      query: `1 - (rate(${serviceName}_errors_total[30d]) / rate(${serviceName}_requests_total[30d]))`,
      unit: 'percentunit',
      thresholds: [
        { value: 0, color: 'red', operator: 'lte' },
        { value: 0.99, color: 'yellow', operator: 'gte' },
        { value: 0.999, color: 'green', operator: 'gte' },
      ],
      gridPos: { x: 0, y: 28, w: 8, h: 6 },
    },
    {
      id: generateId('panel'),
      title: 'Error Budget Remaining',
      type: 'stat',
      query: `(1 - (rate(${serviceName}_errors_total[30d]) / rate(${serviceName}_requests_total[30d]))) / 0.001 - 1`,
      unit: 'percentunit',
      thresholds: [
        { value: 0, color: 'red', operator: 'lte' },
        { value: 0.5, color: 'yellow', operator: 'gte' },
        { value: 0.8, color: 'green', operator: 'gte' },
      ],
      gridPos: { x: 8, y: 28, w: 8, h: 6 },
    },
    {
      id: generateId('panel'),
      title: 'Burn Rate',
      type: 'stat',
      query: `(rate(${serviceName}_errors_total[1h]) / rate(${serviceName}_requests_total[1h])) / 0.001`,
      unit: 'x',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 6, color: 'yellow', operator: 'gt' },
        { value: 14.4, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 16, y: 28, w: 8, h: 6 },
    },
  ];
}

/**
 * Format dashboard for Grafana
 */
export function formatDashboardForGrafana(dashboard: DashboardConfig): string {
  const grafanaDashboard = {
    title: dashboard.title,
    refresh: dashboard.refreshInterval,
    time: { from: `now-${dashboard.timeRange}`, to: 'now' },
    panels: dashboard.panels.map((panel) => ({
      id: panel.id,
      title: panel.title,
      type: panel.type,
      gridPos: panel.gridPos,
      targets: [
        {
          expr: panel.query,
          legendFormat: panel.legend,
        },
      ],
      fieldConfig: {
        defaults: {
          unit: panel.unit,
          thresholds: panel.thresholds
            ? {
                mode: 'absolute',
                steps: panel.thresholds.map((t) => ({ value: t.value, color: t.color })),
              }
            : undefined,
        },
      },
    })),
    templating: {
      list: dashboard.variables?.map((v) => ({
        name: v.name,
        type: v.type,
        query: v.query,
        current: { text: v.default, value: v.default },
      })),
    },
  };

  return JSON.stringify(grafanaDashboard, null, 2);
}

/**
 * Format dashboard for CloudWatch
 */
export function formatDashboardForCloudWatch(dashboard: DashboardConfig): string {
  const cloudwatchDashboard = {
    widgets: dashboard.panels.map((panel) => ({
      type: panel.type === 'graph' ? 'metric' : 'text',
      width: panel.gridPos?.w ?? 6,
      height: panel.gridPos?.h ?? 6,
      x: panel.gridPos?.x ?? 0,
      y: panel.gridPos?.y ?? 0,
      properties: {
        title: panel.title,
        metrics: [[{ expression: panel.query }]],
        region: 'us-east-1',
        stat: 'Average',
        period: 300,
      },
    })),
  };

  return JSON.stringify(cloudwatchDashboard, null, 2);
}
