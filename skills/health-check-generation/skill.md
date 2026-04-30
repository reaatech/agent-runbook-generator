# Skill: Health Check Generation

## Capability

Health check generation — analyzes service architecture to identify appropriate health
check endpoints and generates health check definitions for Kubernetes probes, load
balancers, and monitoring systems. Includes liveness, readiness, and deep health checks.

## Package

**[@reaatech/agent-runbook-health-checks](../packages/health-checks)** — provides `identifyHealthChecks()`, `generateHealthChecks()`, `generateKubernetesProbeYaml()`, and `generateHealthCheckEndpoint()`.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.analyze.health_checks` | `{ analysis_context }` | `{ existing_checks, recommended_checks, gaps }` | 30 RPM |
| `runbook.generate.health_checks` | `{ service_context, platform: string }` | `{ liveness, readiness, startup, deep_checks }` | 30 RPM |

## Usage Examples

### Example: Generate health checks for Kubernetes

**Tool call:**
```json
{
  "service_context": {
    "service_name": "my-service",
    "service_type": "web-api",
    "language": "typescript",
    "external_services": ["postgresql", "redis"],
    "port": 3000
  },
  "platform": "kubernetes"
}
```

**Expected response:**
```json
{
  "liveness": {
    "http_get": {
      "path": "/health/live",
      "port": 3000
    },
    "initial_delay_seconds": 15,
    "period_seconds": 10,
    "timeout_seconds": 5,
    "failure_threshold": 3
  },
  "readiness": {
    "http_get": {
      "path": "/health/ready",
      "port": 3000
    },
    "initial_delay_seconds": 5,
    "period_seconds": 5,
    "timeout_seconds": 3,
    "failure_threshold": 3
  },
  "startup": {
    "http_get": {
      "path": "/health/startup",
      "port": 3000
    },
    "initial_delay_seconds": 0,
    "period_seconds": 5,
    "failure_threshold": 30
  },
  "deep_checks": [
    {
      "name": "database-connectivity",
      "endpoint": "/health/deep/database",
      "description": "Verify database connection and query execution",
      "critical": true
    },
    {
      "name": "cache-connectivity",
      "endpoint": "/health/deep/cache",
      "description": "Verify Redis connection and operations",
      "critical": false
    }
  ],
  "implementation": {
    "express": "app.get('/health/live', (req, res) => res.status(200).json({ status: 'ok' }));",
    "description": "Add health check endpoints to your Express application"
  }
}
```

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| `UNSUPPORTED_PLATFORM` | Unknown deployment platform | Generate generic HTTP health checks |
| `NO_PORT_DETECTED` | Service port not identified | Use default port 8080 |
| `COMPLEX_ARCHITECTURE` | Can't determine health check requirements | Generate comprehensive checks |

## Security Considerations

- **No sensitive data in responses** — Health check responses should not expose internal details
- **Rate limiting** — Health check endpoints should be rate limited
- **Authentication** — Deep health checks may require internal authentication
- **Information disclosure** — Don't expose version numbers or internal architecture

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_PORT` | `8080` | Default service port |
| `LIVENESS_DELAY_S` | `15` | Initial delay for liveness probe |
| `READINESS_DELAY_S` | `5` | Initial delay for readiness probe |
| `HEALTH_PATH_PREFIX` | `/health` | Base path for health endpoints |

## Testing

```typescript
describe('runbook.generate.health_checks', () => {
  it('should generate Kubernetes health probes', async () => {
    const result = await generateHealthChecks({
      service_context: {
        service_name: 'test-service',
        service_type: 'web-api',
        port: 3000,
      },
      platform: 'kubernetes',
    });

    expect(result.liveness).toBeDefined();
    expect(result.readiness).toBeDefined();
    expect(result.startup).toBeDefined();
  });

  it('should generate deep health checks for dependencies', async () => {
    const result = await generateHealthChecks({
      service_context: {
        service_name: 'test-service',
        service_type: 'web-api',
        external_services: ['postgresql', 'redis'],
      },
      platform: 'kubernetes',
    });

    expect(result.deep_checks.length).toBeGreaterThanOrEqual(2);
    expect(result.deep_checks.some(c => c.name.includes('database'))).toBe(true);
  });

  it('should provide implementation code', async () => {
    const result = await generateHealthChecks({
      service_context: {
        service_name: 'test-service',
        service_type: 'web-api',
        language: 'typescript',
      },
      platform: 'kubernetes',
    });

    expect(result.implementation).toBeDefined();
    expect(result.implementation.express).toBeDefined();
  });
});
