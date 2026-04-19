# Skill: Failure Mode Analysis

## Capability

Failure mode analysis — identifies potential failure points in a service by analyzing
code patterns, dependencies, and architecture. Generates detection strategies,
mitigation steps, and escalation procedures for each identified failure mode.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.analyze.failure_modes` | `{ analysis_context, depth?: 'shallow' \| 'deep' }` | `{ failure_modes, single_points_of_failure, risk_score }` | 30 RPM |

## Usage Examples

### Example 1: Identify failure modes

**Tool call:**
```json
{
  "analysis_context": {
    "service_type": "web-api",
    "language": "typescript",
    "external_services": ["postgresql", "redis"],
    "deployment": "kubernetes"
  },
  "depth": "deep"
}
```

**Expected response:**
```json
{
  "failure_modes": [
    {
      "id": "db-connection-failure",
      "name": "Database Connection Failure",
      "category": "dependency",
      "severity": "critical",
      "likelihood": "medium",
      "detection": {
        "metrics": ["pg_up", "db_connection_errors"],
        "symptoms": ["5xx errors", "slow responses"],
        "alert_expression": "pg_up == 0"
      },
      "mitigation": [
        "Enable connection pooling",
        "Implement circuit breaker",
        "Add retry with exponential backoff"
      ],
      "escalation": "Page on-call engineer immediately"
    },
    {
      "id": "memory-exhaustion",
      "name": "Memory Exhaustion",
      "category": "resource",
      "severity": "high",
      "likelihood": "low",
      "detection": {
        "metrics": ["container_memory_usage_bytes", "node_memory_MemAvailable"],
        "symptoms": ["OOM kills", "slow GC"],
        "alert_expression": "container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9"
      },
      "mitigation": [
        "Set memory limits",
        "Profile memory usage",
        "Add memory leak detection"
      ],
      "escalation": "Page if > 90% for 5 minutes"
    }
  ],
  "single_points_of_failure": [
    {
      "component": "postgresql",
      "impact": "Complete service outage",
      "recommendation": "Add read replicas, implement failover"
    }
  ],
  "risk_score": 7.5
}
```

## Error Handling

### Known failure modes

| Error | Cause | Recovery |
|-------|-------|----------|
| `INSUFFICIENT_CONTEXT` | Not enough information to analyze | Use generic failure modes for service type |
| `ANALYSIS_TIMEOUT` | Analysis taking too long | Return partial results with confidence indicators |
| `UNKNOWN_ARCHITECTURE` | Can't determine service architecture | Use conservative (comprehensive) failure modes |

### Recovery strategies

1. **Generic failure modes** — If specific analysis fails, use standard failure
   modes for the detected service type

2. **Conservative estimates** — When uncertain, assume higher risk and generate
   more comprehensive mitigations

3. **Incremental analysis** — Analyze most critical components first
   (dependencies, resources, then application logic)

## Security Considerations

### Failure Information

- **Don't expose vulnerabilities** — Failure modes should not reveal security
  vulnerabilities that could be exploited
- **Sanitize output** — Remove specific version information that could be used
  for targeted attacks
- **Access control** — Failure mode analysis may reveal sensitive architecture
  details

## Performance Characteristics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Analysis latency | < 15s | For deep analysis |
| Memory usage | < 200MB | Peak during analysis |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `FAILURE_MODE_CATEGORIES` | `dependency,resource,application,network` | Categories to analyze |
| `RISK_THRESHOLD` | `5.0` | Minimum risk score to include in report |
| `MAX_FAILURE_MODES` | `20` | Maximum failure modes to generate |

## Testing

### Unit tests

```typescript
describe('runbook.analyze.failure_modes', () => {
  it('should identify database-related failure modes', async () => {
    const result = await analyzeFailureModes({
      analysis_context: {
        service_type: 'web-api',
        external_services: ['postgresql'],
      },
      depth: 'deep',
    });

    const dbFailures = result.failure_modes.filter(fm =>
      fm.category === 'dependency' && fm.name.includes('Database')
    );
    expect(dbFailures.length).toBeGreaterThan(0);
  });

  it('should identify single points of failure', async () => {
    const result = await analyzeFailureModes({
      analysis_context: {
        service_type: 'web-api',
        external_services: ['postgresql'],
        deployment: 'kubernetes',
      },
      depth: 'deep',
    });

    expect(result.single_points_of_failure.length).toBeGreaterThan(0);
    expect(result.risk_score).toBeGreaterThan(0);
  });
});
