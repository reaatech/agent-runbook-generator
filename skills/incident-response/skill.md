# Skill: Incident Response

## Capability

Incident response generation — creates incident response workflows, escalation
procedures, communication templates, and post-incident review processes tailored
to the service's architecture and team structure.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.generate.incident_workflow` | `{ service_context, team_config, severity_definitions? }` | `{ workflows, escalation_matrix, communication_templates }` | 30 RPM |

## Usage Examples

### Example: Generate incident response workflow

**Tool call:**
```json
{
  "service_context": {
    "service_name": "my-service",
    "team": "platform-engineering",
    "severity_definitions": {
      "sev1": "Complete service outage",
      "sev2": "Significant degradation",
      "sev3": "Minor impact"
    }
  },
  "team_config": {
    "oncall_schedule": "pagerduty",
    "escalation_policy": "standard",
    "stakeholders": ["engineering", "product", "support"]
  }
}
```

**Expected response:**
```json
{
  "workflows": [
    {
      "severity": "sev1",
      "response_time_minutes": 5,
      "steps": [
        "Page on-call engineer immediately",
        "Create incident channel #inc-<timestamp>",
        "Assign incident commander",
        "Start incident timer",
        "Assess impact and scope",
        "Begin mitigation",
        "Update status page",
        "Notify stakeholders every 15 minutes"
      ]
    }
  ],
  "escalation_matrix": [
    { "level": 1, "contact": "on-call engineer", "timeout_minutes": 15 },
    { "level": 2, "contact": "team lead", "timeout_minutes": 30 },
    { "level": 3, "contact": "engineering manager", "timeout_minutes": 60 }
  ],
  "communication_templates": {
    "status_page_update": "We are currently experiencing issues with {service}. Our team is actively working on resolution. Next update in {interval} minutes.",
    "stakeholder_notification": "Incident {id}: {severity} incident affecting {service}. Current status: {status}. Incident commander: {commander}.",
    "post_incident_announcement": "Incident {id} has been resolved. Post-incident review scheduled for {date}."
  }
}
```

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| `MISSING_TEAM_CONFIG` | No team configuration provided | Use default escalation paths |
| `INVALID_SEVERITY` | Unknown severity level | Map to closest known severity |

## Security Considerations

- **No PII in templates** — Communication templates should not contain personal information
- **Access control** — Incident workflows may reference internal systems
- **Audit logging** — All incident communications should be logged

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_RESPONSE_TIME_SEV1` | `5` | Response time for Sev1 incidents (minutes) |
| `DEFAULT_RESPONSE_TIME_SEV2` | `15` | Response time for Sev2 incidents (minutes) |
| `UPDATE_INTERVAL_MINUTES` | `15` | Status update interval during incident |
| `ESCALATION_LEVELS` | `3` | Number of escalation levels |

## Testing

```typescript
describe('runbook.generate.incident_workflow', () => {
  it('should generate incident workflows for all severities', async () => {
    const result = await generateIncidentWorkflow({
      service_context: { service_name: 'test-service' },
      team_config: { oncall_schedule: 'pagerduty' },
    });

    expect(result.workflows.length).toBeGreaterThanOrEqual(3);
    expect(result.escalation_matrix.length).toBeGreaterThan(0);
  });
});
