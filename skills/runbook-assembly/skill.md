# Skill: Runbook Assembly

## Capability

Runbook assembly — combines all generated sections (alerts, dashboards, failure modes,
rollback procedures, etc.) into a complete, well-structured operator runbook. Handles
formatting, table of contents generation, cross-referencing, and export to multiple
formats (Markdown, HTML, PDF).

## Package

**[@reaatech/agent-runbook-runbook](../packages/runbook)** — provides `buildRunbook()`, `exportRunbook()`, `generateRunbookArtifacts()`, `validateCompleteness()`, and CI validation utilities.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.generate.full` | `{ analysis_context, config? }` | `{ runbook, sections, toc }` | 10 RPM |
| `runbook.validate.completeness` | `{ runbook, required_sections? }` | `{ score, missing_sections, suggestions }` | 30 RPM |

## Usage Examples

### Example 1: Generate complete runbook

**Tool call:**
```json
{
  "analysis_context": {
    "service_name": "my-service",
    "team": "platform-engineering",
    "repository": "https://github.com/reaatech/my-service",
    "service_type": "web-api",
    "language": "typescript",
    "external_services": ["postgresql", "redis"],
    "deployment": "kubernetes"
  },
  "config": {
    "slo_targets": {
      "availability": 99.9,
      "latency_p99_ms": 500
    },
    "sections": ["alerts", "dashboards", "failure-modes", "rollback", "incident-response"]
  }
}
```

**Expected response:**
```json
{
  "runbook": {
    "title": "Service Runbook: my-service",
    "version": "1.0.0",
    "generated_at": "2026-04-15T23:00:00Z",
    "sections": [
      {
        "id": "overview",
        "title": "Service Overview",
        "content": "# Service Overview\n\n..."
      },
      {
        "id": "alerts",
        "title": "Alerts",
        "content": "# Alerts\n\n## Critical Alerts\n\n..."
      }
    ],
    "metadata": {
      "service_name": "my-service",
      "team": "platform-engineering",
      "sections_count": 7
    }
  },
  "toc": [
    { "level": 1, "title": "Service Overview", "anchor": "#service-overview" },
    { "level": 2, "title": "Service Description", "anchor": "#service-description" },
    { "level": 2, "title": "Quick Links", "anchor": "#quick-links" },
    { "level": 1, "title": "Alerts", "anchor": "#alerts" },
    { "level": 2, "title": "Critical Alerts", "anchor": "#critical-alerts" }
  ],
  "sections": {
    "alerts": { "count": 5, "critical": 2, "warning": 3 },
    "failure_modes": { "count": 8, "critical": 3 },
    "rollback": { "procedures": 3 }
  }
}
```

### Example 2: Validate runbook completeness

**Tool call:**
```json
{
  "runbook": { /* runbook object */ },
  "required_sections": ["alerts", "dashboards", "failure-modes", "rollback"]
}
```

**Expected response:**
```json
{
  "score": 0.85,
  "missing_sections": ["health-checks"],
  "suggestions": [
    "Add health check definitions for Kubernetes probes",
    "Include SLO burn rate alerts",
    "Add post-incident review template"
  ],
  "section_scores": {
    "alerts": 0.9,
    "dashboards": 0.8,
    "failure-modes": 0.85,
    "rollback": 0.95
  }
}
```

## Error Handling

### Known failure modes

| Error | Cause | Recovery |
|-------|-------|----------|
| `MISSING_SECTIONS` | Required sections not generated | Generate placeholder sections with TODO markers |
| `INVALID_FORMAT` | Unsupported export format | Fall back to Markdown |
| `TEMPLATE_NOT_FOUND` | Custom template not found | Use default template |
| `CROSS_REF_ERROR` | Invalid cross-reference | Skip invalid references, log warning |

### Recovery strategies

1. **Partial assembly** — If some sections fail to generate, assemble available
   sections and mark missing ones as TODO

2. **Template fallback** — If custom template fails, use standard SRE template

3. **Graceful degradation** — Export in simplest format (Markdown) if complex
   formats fail

## Security Considerations

### Content Security

- **Sanitize output** — Remove any accidentally captured secrets
- **Validate links** — Ensure cross-references don't point to external resources
- **Safe for version control** — Generated runbooks should be safe to commit

### Access Control

- **Template access** — Custom templates may contain sensitive information
- **Export permissions** — PDF/HTML export may require additional permissions

## Performance Characteristics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Assembly latency | < 5s | For complete runbook |
| Export latency (Markdown) | < 1s | Per runbook |
| Export latency (HTML) | < 3s | Per runbook |
| Export latency (PDF) | < 10s | Per runbook |
| Memory usage | < 100MB | Peak during assembly |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_TEMPLATE` | `sre-standard` | Default runbook template |
| `INCLUDE_TOC` | `true` | Include table of contents |
| `INCLUDE_CROSS_REFS` | `true` | Include cross-references |
| `MAX_SECTIONS` | `20` | Maximum sections to include |
| `COMPLETENESS_THRESHOLD` | `0.8` | Minimum completeness score |

## Testing

### Unit tests

```typescript
describe('runbook.generate.full', () => {
  it('should generate complete runbook', async () => {
    const result = await generateFullRunbook({
      analysis_context: {
        service_name: 'test-service',
        service_type: 'web-api',
        language: 'typescript',
      },
      config: {
        sections: ['alerts', 'failure-modes'],
      },
    });

    expect(result.runbook.sections.length).toBeGreaterThan(0);
    expect(result.toc.length).toBeGreaterThan(0);
    expect(result.runbook.title).toContain('test-service');
  });

  it('should include all requested sections', async () => {
    const result = await generateFullRunbook({
      analysis_context: {
        service_name: 'test-service',
        service_type: 'web-api',
      },
      config: {
        sections: ['alerts', 'dashboards', 'rollback'],
      },
    });

    const sectionIds = result.runbook.sections.map(s => s.id);
    expect(sectionIds).toContain('alerts');
    expect(sectionIds).toContain('dashboards');
    expect(sectionIds).toContain('rollback');
  });
});

describe('runbook.validate.completeness', () => {
  it('should calculate completeness score', async () => {
    const result = await validateCompleteness({
      runbook: createTestRunbook(),
      required_sections: ['alerts', 'rollback'],
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should identify missing sections', async () => {
    const result = await validateCompleteness({
      runbook: createTestRunbook(['alerts']),
      required_sections: ['alerts', 'rollback', 'dashboards'],
    });

    expect(result.missing_sections).toContain('rollback');
    expect(result.missing_sections).toContain('dashboards');
  });
});
