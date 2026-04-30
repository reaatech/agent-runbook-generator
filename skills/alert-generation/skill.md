# Skill: Alert Generation

## Capability

Alert generation — automatically extracts existing alert definitions from monitoring
configurations and generates new alert definitions based on service patterns, SLO
targets, and best practices. Supports Prometheus, Datadog, CloudWatch, and other
monitoring platforms.

## Package

**[@reaatech/agent-runbook-alerts](../packages/alerts)** — provides `extractAlerts()`, `generateAlerts()`, `calculateSloThresholds()`, and `formatAlertsForPlatform()`.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.analyze.alerts` | `{ path: string, platform?: 'prometheus' \| 'datadog' \| 'cloudwatch', existing_only?: boolean }` | `{ alerts, slo_alerts, resource_alerts }` | 30 RPM |
| `runbook.generate.alerts` | `{ analysis_context, slo_targets?, platform: string }` | `{ alert_definitions, recording_rules, dashboards }` | 30 RPM |

## Usage Examples

### Example 1: Extract existing alerts

**User intent:** "Find all existing alerts in this repository"

**Tool call:**
```json
{
  "path": "/path/to/my-service",
  "platform": "prometheus"
}
```

**Expected response:**
```json
{
  "alerts": [
    {
      "name": "HighErrorRate",
      "expression": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) > 0.05",
      "for": "5m",
      "severity": "critical",
      "annotations": {
        "summary": "High error rate detected",
        "description": "Error rate is above 5% for more than 5 minutes"
      }
    }
  ],
  "slo_alerts": [],
  "resource_alerts": []
}
```

### Example 2: Generate alerts from SLO targets

**Tool call:**
```json
{
  "analysis_context": {
    "service_type": "web-api",
    "language": "typescript",
    "external_services": ["postgresql", "redis"]
  },
  "slo_targets": {
    "availability": 99.9,
    "latency_p99_ms": 500
  },
  "platform": "prometheus"
}
```

**Expected response:**
```json
{
  "alert_definitions": [
    {
      "name": "ServiceSLOAvailability",
      "type": "slo_burn_rate",
      "expression": "(100 - availability_percentage) > (100 - 99.9) * 14.4",
      "for": "5m",
      "severity": "critical",
      "runbook_link": "#slo-availability"
    },
    {
      "name": "ServiceSLOLatency",
      "type": "slo_burn_rate",
      "expression": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 0.5",
      "for": "5m",
      "severity": "warning",
      "runbook_link": "#slo-latency"
    },
    {
      "name": "DatabaseConnectionFailure",
      "type": "resource",
      "expression": "pg_up == 0",
      "for": "1m",
      "severity": "critical",
      "runbook_link": "#database-failure"
    }
  ]
}
```

## Error Handling

### Known failure modes

| Error | Cause | Recovery |
|-------|-------|----------|
| `NO_MONITORING_CONFIG` | No monitoring configuration files found | Generate default alerts based on service type |
| `INVALID_ALERT_SYNTAX` | Malformed alert definition | Skip invalid alerts, continue with valid ones |
| `UNSUPPORTED_PLATFORM` | Unknown monitoring platform | Fall back to generic alert format |
| `MISSING_METRICS` | Required metrics not found in analysis | Generate alerts for available metrics only |

### Recovery strategies

1. **Default alerts** — If no existing alerts found, generate standard alerts
   based on service type (web-api, worker, etc.)

2. **Platform fallback** — If platform-specific parsing fails, use generic
   Prometheus format which can be converted later

3. **Incremental generation** — Generate alerts in order of importance
   (SLO → resource → application)

### Escalation paths

- **Missing critical alerts** → Review service architecture
- **Too many false positives** → Adjust thresholds
- **Alert fatigue** → Consolidate similar alerts

## Security Considerations

### Alert Configuration

- **No secrets in alert definitions** — Never include API keys or credentials
- **Sanitize URLs** — Runbook links should use internal URLs
- **Access control** — Alert definitions should respect least privilege

### PII Handling

- **No PII in alert names** — Don't include user data in alert definitions
- **Sanitize annotations** — Remove any PII from alert descriptions
- **Safe for sharing** — Generated alerts should be safe to commit to version control

## Performance Characteristics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Alert extraction latency | < 5s | Per configuration file |
| Alert generation latency | < 10s | For complete alert set |
| Memory usage | < 100MB | Peak during generation |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_SLO_AVAILABILITY` | `99.9` | Default availability target |
| `DEFAULT_SLO_LATENCY_MS` | `500` | Default p99 latency target |
| `BURN_RATE_FAST` | `14.4` | Fast burn rate multiplier (1h window) |
| `BURN_RATE_SLOW` | `1.0` | Slow burn rate multiplier (30d window) |
| `ALERT_EVALUATION_INTERVAL` | `30s` | Default evaluation interval |

## Testing

### Unit tests

```typescript
describe('runbook.generate.alerts', () => {
  it('should generate SLO burn rate alerts', async () => {
    const result = await generateAlerts({
      analysis_context: {
        service_type: 'web-api',
        has_metrics: true,
      },
      slo_targets: {
        availability: 99.9,
        latency_p99_ms: 500,
      },
      platform: 'prometheus',
    });

    expect(result.alert_definitions).some(a => a.type === 'slo_burn_rate');
    expect(result.alert_definitions.length).toBeGreaterThanOrEqual(2);
  });

  it('should generate resource alerts for dependencies', async () => {
    const result = await generateAlerts({
      analysis_context: {
        service_type: 'web-api',
        external_services: ['postgresql', 'redis'],
      },
      platform: 'prometheus',
    });

    const resourceAlerts = result.alert_definitions.filter(a => a.type === 'resource');
    expect(resourceAlerts.length).toBeGreaterThanOrEqual(2);
  });
});
