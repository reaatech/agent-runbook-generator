/**
 * Widget Templates - Pre-built templates for common service patterns
 */

import { type DashboardPanel, type ThresholdConfig } from '@reaatech/agent-runbook';

let panelIdCounter = 0;

function nextPanelId(): string {
  return `panel-${++panelIdCounter}`;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  panels: DashboardPanel[];
  category: 'slo' | 'resource' | 'business' | 'infrastructure';
}

function makeSloBurnRatePanels(): DashboardPanel[] {
  return [
    {
      id: nextPanelId(),
      title: 'Burn Rate (1h)',
      type: 'stat',
      query: 'burn_rate_1h',
      unit: 'x',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 6, color: 'yellow', operator: 'gt' },
        { value: 14.4, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 0, y: 0, w: 6, h: 4 },
    },
    {
      id: nextPanelId(),
      title: 'Burn Rate (3d)',
      type: 'stat',
      query: 'burn_rate_3d',
      unit: 'x',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 2, color: 'yellow', operator: 'gt' },
        { value: 6, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 6, y: 0, w: 6, h: 4 },
    },
  ];
}

function makeResourceUtilizationPanels(): DashboardPanel[] {
  return [
    {
      id: nextPanelId(),
      title: 'CPU Utilization',
      type: 'gauge',
      query: 'cpu_utilization_percent',
      unit: 'percent',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 60, color: 'yellow', operator: 'gt' },
        { value: 80, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 0, y: 0, w: 8, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Memory Utilization',
      type: 'gauge',
      query: 'memory_utilization_percent',
      unit: 'percent',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 70, color: 'yellow', operator: 'gt' },
        { value: 85, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 8, y: 0, w: 8, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Disk Utilization',
      type: 'gauge',
      query: 'disk_utilization_percent',
      unit: 'percent',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 70, color: 'yellow', operator: 'gt' },
        { value: 85, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 16, y: 0, w: 8, h: 6 },
    },
  ];
}

function makeRedMetricsPanels(): DashboardPanel[] {
  return [
    {
      id: nextPanelId(),
      title: 'Request Rate',
      type: 'graph',
      query: 'rate(requests_total[5m])',
      legend: '{{method}} {{path}}',
      unit: 'reqps',
      gridPos: { x: 0, y: 0, w: 12, h: 8 },
    },
    {
      id: nextPanelId(),
      title: 'Error Rate',
      type: 'graph',
      query: 'rate(requests_total{status=~"5.."}[5m]) / rate(requests_total[5m]) * 100',
      legend: 'Error Rate %',
      unit: 'percent',
      gridPos: { x: 12, y: 0, w: 12, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Latency P99',
      type: 'stat',
      query: 'histogram_quantile(0.99, rate(request_duration_seconds_bucket[5m]))',
      unit: 'seconds',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 0.5, color: 'yellow', operator: 'lte' },
        { value: 1, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 12, y: 6, w: 6, h: 4 },
    },
    {
      id: nextPanelId(),
      title: 'Latency P95',
      type: 'stat',
      query: 'histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m]))',
      unit: 'seconds',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 0.3, color: 'yellow', operator: 'lte' },
        { value: 0.5, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 18, y: 6, w: 6, h: 4 },
    },
  ];
}

function makeQueueHealthPanels(): DashboardPanel[] {
  return [
    {
      id: nextPanelId(),
      title: 'Queue Depth',
      type: 'graph',
      query: 'queue_depth',
      legend: '{{queue}}',
      gridPos: { x: 0, y: 0, w: 12, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Processing Rate',
      type: 'graph',
      query: 'rate(messages_processed_total[5m])',
      legend: '{{queue}}',
      unit: 'ops',
      gridPos: { x: 12, y: 0, w: 12, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Queue Age (max)',
      type: 'stat',
      query: 'max(queue_message_age_seconds)',
      unit: 'seconds',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 300, color: 'yellow', operator: 'lte' },
        { value: 600, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 0, y: 6, w: 6, h: 4 },
    },
  ];
}

function makeDatabaseHealthPanels(): DashboardPanel[] {
  return [
    {
      id: nextPanelId(),
      title: 'Connection Pool',
      type: 'graph',
      query: 'connection_pool_active / connection_pool_max * 100',
      legend: '{{instance}}',
      unit: 'percent',
      gridPos: { x: 0, y: 0, w: 8, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Query Rate',
      type: 'graph',
      query: 'rate(queries_total[5m])',
      legend: '{{query_type}}',
      unit: 'qps',
      gridPos: { x: 8, y: 0, w: 8, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Replication Lag',
      type: 'stat',
      query: 'replication_lag_seconds',
      unit: 'seconds',
      thresholds: [
        { value: 0, color: 'green', operator: 'lte' },
        { value: 10, color: 'yellow', operator: 'lte' },
        { value: 30, color: 'red', operator: 'gt' },
      ],
      gridPos: { x: 16, y: 0, w: 8, h: 6 },
    },
  ];
}

function makeCacheHealthPanels(): DashboardPanel[] {
  return [
    {
      id: nextPanelId(),
      title: 'Hit Rate',
      type: 'gauge',
      query: 'cache_hits_total / (cache_hits_total + cache_misses_total) * 100',
      unit: 'percent',
      thresholds: [
        { value: 0, color: 'red', operator: 'lte' },
        { value: 80, color: 'yellow', operator: 'lte' },
        { value: 95, color: 'green', operator: 'gt' },
      ],
      gridPos: { x: 0, y: 0, w: 8, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Memory Usage',
      type: 'graph',
      query: 'cache_memory_used_bytes / cache_memory_max_bytes * 100',
      legend: '{{instance}}',
      unit: 'percent',
      gridPos: { x: 8, y: 0, w: 8, h: 6 },
    },
    {
      id: nextPanelId(),
      title: 'Eviction Rate',
      type: 'graph',
      query: 'rate(cache_evictions_total[5m])',
      legend: '{{instance}}',
      unit: 'ops',
      gridPos: { x: 16, y: 0, w: 8, h: 6 },
    },
  ];
}

/**
 * Pre-built widget templates for common patterns
 */
export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'slo-burn-rate',
    name: 'SLO Burn Rate',
    description: 'Multi-window SLO burn rate visualization',
    category: 'slo',
    panels: makeSloBurnRatePanels(),
  },
  {
    id: 'resource-utilization',
    name: 'Resource Utilization',
    description: 'CPU, memory, and disk utilization overview',
    category: 'resource',
    panels: makeResourceUtilizationPanels(),
  },
  {
    id: 'red-metrics',
    name: 'RED Metrics',
    description: 'Rate, Errors, Duration - Golden signals',
    category: 'infrastructure',
    panels: makeRedMetricsPanels(),
  },
  {
    id: 'queue-health',
    name: 'Queue Health',
    description: 'Message queue depth and processing rate',
    category: 'infrastructure',
    panels: makeQueueHealthPanels(),
  },
  {
    id: 'database-health',
    name: 'Database Health',
    description: 'Database connections, queries, and replication lag',
    category: 'infrastructure',
    panels: makeDatabaseHealthPanels(),
  },
  {
    id: 'cache-health',
    name: 'Cache Health',
    description: 'Cache hit rate, memory usage, and eviction rate',
    category: 'infrastructure',
    panels: makeCacheHealthPanels(),
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: WidgetTemplate['category']): WidgetTemplate[] {
  return WIDGET_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(id: string): WidgetTemplate | undefined {
  return WIDGET_TEMPLATES.find((t) => t.id === id);
}

/**
 * Create a custom panel with default thresholds
 */
export function createPanel(
  title: string,
  query: string,
  type: DashboardPanel['type'] = 'graph',
  unit?: string,
): DashboardPanel {
  return {
    id: nextPanelId(),
    title,
    type,
    query,
    unit,
    gridPos: { x: 0, y: 0, w: 12, h: 6 },
  };
}

/**
 * Create a stat panel with thresholds
 */
export function createStatPanel(
  title: string,
  query: string,
  thresholds: ThresholdConfig[],
  unit?: string,
): DashboardPanel {
  return {
    id: nextPanelId(),
    title,
    type: 'stat',
    query,
    unit,
    thresholds,
    gridPos: { x: 0, y: 0, w: 6, h: 4 },
  };
}
