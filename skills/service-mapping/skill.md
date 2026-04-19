# Skill: Service Mapping

## Capability

Service dependency mapping — analyzes code, configuration, and network traffic to
identify and map service dependencies. Generates dependency graphs, API contracts,
and impact analysis for failure scenarios.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.analyze.dependencies` | `{ path: string, include_external?: boolean }` | `{ upstream, downstream, external_services, dependency_graph }` | 30 RPM |
| `runbook.generate.service_map` | `{ analysis_context, format?: 'mermaid' \| 'dot' \| 'json' }` | `{ graph, nodes, edges, critical_paths }` | 30 RPM |

## Usage Examples

### Example: Generate service dependency map

**Tool call:**
```json
{
  "analysis_context": {
    "service_name": "my-service",
    "repository": "/path/to/repo"
  },
  "format": "mermaid"
}
```

**Expected response:**
```json
{
  "graph": "graph TD\n    A[my-service] --> B[postgresql]\n    A --> C[redis]\n    A --> D[auth-service]\n    D --> E[identity-provider]",
  "nodes": [
    { "id": "my-service", "type": "service", "criticality": "high" },
    { "id": "postgresql", "type": "database", "criticality": "critical" },
    { "id": "redis", "type": "cache", "criticality": "medium" },
    { "id": "auth-service", "type": "service", "criticality": "high" }
  ],
  "edges": [
    { "source": "my-service", "target": "postgresql", "type": "sync", "protocol": "tcp" },
    { "source": "my-service", "target": "redis", "type": "sync", "protocol": "tcp" },
    { "source": "my-service", "target": "auth-service", "type": "sync", "protocol": "http" }
  ],
  "critical_paths": [
    {
      "path": ["my-service", "postgresql"],
      "impact": "Complete service outage if database fails",
      "mitigation": "Add connection pooling, implement circuit breaker"
    }
  ]
}
```

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| `CANNOT_PARSE_DEPENDENCIES` | No dependency files found | Use runtime analysis if available |
| `CIRCULAR_DEPENDENCY` | Circular dependency detected | Flag for review, continue analysis |

## Security Considerations

- **Internal URLs** — Don't expose internal service URLs in public runbooks
- **API contracts** — Sanitize API endpoint details that could reveal vulnerabilities
- **Access patterns** — Don't expose authentication details in dependency maps

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `INCLUDE_DEV_DEPS` | `false` | Include development dependencies |
| `MAX_DEPTH` | `5` | Maximum dependency depth to analyze |
| `CRITICAL_THRESHOLD` | `3` | Hop count for critical path detection |

## Testing

```typescript
describe('runbook.generate.service_map', () => {
  it('should generate dependency graph', async () => {
    const result = await generateServiceMap({
      analysis_context: {
        service_name: 'test-service',
        external_services: ['postgresql', 'redis'],
      },
      format: 'mermaid',
    });

    expect(result.graph).toBeDefined();
    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.edges.length).toBeGreaterThan(0);
  });
});
