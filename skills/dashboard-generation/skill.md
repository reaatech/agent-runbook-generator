# Skill: Dashboard Generation

## Capability

Dashboard generation — automatically creates dashboard configurations for monitoring
systems like Grafana, Looker, and CloudWatch. Identifies key metrics from service
code and generates panels for latency, error rate, throughput, and resource utilization.

## Package

**[@reaatech/agent-runbook-dashboards](../packages/dashboards)** — provides `identifyMetrics()`, `generateDashboard()`, `formatDashboardForGrafana()`, and `formatDashboardForCloudWatch()`.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.generate.dashboard` | `{ service_context, platform: 'grafana' \| 'cloudwatch' \| 'looker', format?: string }` | `{ dashboard_config, panels, queries }` | 30 RPM |

## Usage Examples

### Example: Generate Grafana dashboard

**Tool call:**
```json
{
  "service_context": {
    "service_name": "my-service",
    "service_type": "web-api",
    "language": "typescript",
    "external_services": ["postgresql", "redis"],
    "metrics_available": ["http_requests_total", "http_request_duration_seconds", "process_cpu_seconds_total"]
  },
  "platform": "grafana"
}
```

**Expected response:**
```json
{
  "dashboard_config": {
    "title": "my-service Dashboard",
    "description": "Operational dashboard for my-service",
    "refresh": "30s",
    "time_range": "1h",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "gridPos": { "x": 0, "y": 0, "w": 8, "h": 8 },
        "targets": [
          {
            "expr": "rate(http_requests_total{service=\"my-service\"}[5m])",
            "legendFormat": "requests/s"
          }
        ]
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "gridPos": { "x": 8, "y": 0, "w": 8, "h": 8 },
        "targets": [
          {
            "expr": "rate(http_requests_total{service=\"my-service\",status=~\"5..\"}[5m]) / rate(http_requests_total{service=\"my-service\"}[5m]) * 100",
            "legendFormat": "error %"
          }
        ]
      },
      {
        "id": 3,
        "title": "Latency (p50, p90, p99)",
        "type": "graph",
        "gridPos": { "x": 16, "y": 0, "w": 8, "h": 8 },
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{service=\"my-service\"}[5m]))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.90, rate(http_request_duration_seconds_bucket{service=\"my-service\"}[5m]))",
            "legendFormat": "p90"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service=\"my-service\"}[5m]))",
            "legendFormat": "p99"
          }
        ]
      }
    ]
  },
  "panels": [
    { "type": "request_rate", "metric": "http_requests_total" },
    { "type": "error_rate", "metric": "http_requests_total" },
    { "type": "latency", "metric": "http_request_duration_seconds" }
  ],
  "queries": [
    "rate(http_requests_total{service=\"my-service\"}[5m])",
    "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service=\"my-service\"}[5m]))"
  ]
}
```

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| `NO_METRICS_AVAILABLE` | No metrics found in service | Generate placeholder dashboard |
| `UNSUPPORTED_PLATFORM` | Unknown dashboard platform | Fall back to generic JSON format |
| `INVALID_METRIC_NAME` | Metric name format invalid | Skip invalid metrics, continue |

## Security Considerations

- **No credentials in dashboard configs** — Never include API keys or passwords
- **Sanitize queries** — Ensure PromQL/SQL queries don't expose sensitive data
- **Access control** — Dashboard configs should respect RBAC

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_REFRESH_INTERVAL` | `30s` | Dashboard refresh interval |
| `DEFAULT_TIME_RANGE` | `1h` | Default time range |
| `LATENCY_HISTOGRAMS` | `0.50,0.90,0.95,0.99` | Latency percentiles to display |

## Testing

```typescript
describe('runbook.generate.dashboard', () => {
  it('should generate Grafana dashboard with standard panels', async () => {
    const result = await generateDashboard({
      service_context: {
        service_name: 'test-service',
        service_type: 'web-api',
        metrics_available: ['http_requests_total', 'http_request_duration_seconds'],
      },
      platform: 'grafana',
    });

    expect(result.dashboard_config.panels.length).toBeGreaterThanOrEqual(3);
    expect(result.dashboard_config.title).toContain('test-service');
  });

  it('should include SLO burn rate panel when SLO targets provided', async () => {
    const result = await generateDashboard({
      service_context: {
        service_name: 'test-service',
        service_type: 'web-api',
        slo_targets: { availability: 99.9 },
      },
      platform: 'grafana',
    });

    const burnRatePanel = result.dashboard_config.panels.find(p =>
      p.title.toLowerCase().includes('burn')
    );
    expect(burnRatePanel).toBeDefined();
  });
});
