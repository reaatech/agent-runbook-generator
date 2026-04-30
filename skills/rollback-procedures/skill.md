# Skill: Rollback Procedures

## Capability

Rollback procedure generation — analyzes deployment configurations and generates
step-by-step rollback procedures for various failure scenarios. Supports Kubernetes,
ECS, Cloud Run, and other deployment platforms.

## Package

**[@reaatech/agent-runbook-rollback](../packages/rollback)** — provides `analyzeDeployment()`, `generateRollbackProcedures()`, and `generateVerificationSteps()`.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.generate.rollback` | `{ deployment_config, failure_scenarios? }` | `{ procedures, scripts, verification_steps }` | 30 RPM |

## Usage Examples

### Example 1: Analyze rollback capabilities

**Tool call:**
```json
{
  "analysis_context": {
    "service_type": "web-api",
    "deployment": "kubernetes",
    "ci_cd": "github-actions"
  }
}
```

**Expected response:**
```json
{
  "deployment_type": "kubernetes",
  "rollback_capabilities": [
    "kubectl rollout undo",
    "Helm rollback",
    "GitOps revert"
  ],
  "current_config": {
    "replicas": 3,
    "strategy": "RollingUpdate",
    "max_surge": "25%",
    "max_unavailable": "25%"
  }
}
```

### Example 2: Generate rollback procedures

**Tool call:**
```json
{
  "deployment_config": {
    "platform": "kubernetes",
    "namespace": "production",
    "deployment": "my-service",
    "replicas": 3
  },
  "failure_scenarios": ["failed_deployment", "config_error", "performance_regression"]
}
```

**Expected response:**
```json
{
  "procedures": [
    {
      "scenario": "failed_deployment",
      "steps": [
        {
          "step": 1,
          "action": "Verify deployment failure",
          "command": "kubectl rollout status deployment/my-service -n production",
          "expected": "deployment rolled back"
        },
        {
          "step": 2,
          "action": "Execute rollback",
          "command": "kubectl rollout undo deployment/my-service -n production",
          "expected": "deployment.apps/my-service rolled back"
        },
        {
          "step": 3,
          "action": "Verify rollback success",
          "command": "kubectl get pods -n production -l app=my-service",
          "expected": "All pods in Running state"
        }
      ],
      "pre_rollback_checks": [
        "Confirm current version is failing",
        "Check previous revision is available",
        "Notify team of rollback"
      ],
      "post_rollback_verification": [
        "Health checks passing",
        "Error rate returned to baseline",
        "Latency returned to normal"
      ]
    }
  ],
  "scripts": [
    {
      "name": "rollback.sh",
      "content": "#!/bin/bash\nkubectl rollout undo deployment/my-service -n production\nkubectl rollout status deployment/my-service -n production"
    }
  ],
  "verification_steps": [
    "Check deployment status: kubectl get deployment my-service -n production",
    "Verify pod health: kubectl get pods -n production -l app=my-service",
    "Check application logs: kubectl logs -n production -l app=my-service --tail=50"
  ]
}
```

## Error Handling

### Known failure modes

| Error | Cause | Recovery |
|-------|-------|----------|
| `UNSUPPORTED_PLATFORM` | Unknown deployment platform | Generate generic rollback procedure |
| `NO_PREVIOUS_VERSION` | No previous deployment to rollback to | Suggest forward fix instead |
| `INCOMPLETE_CONFIG` | Missing deployment configuration | Use defaults, flag for review |

### Recovery strategies

1. **Generic procedures** — If platform-specific analysis fails, generate
   generic rollback steps that work for most platforms

2. **Forward fix fallback** — If rollback is not possible, generate forward
   fix procedures instead

3. **Manual intervention** — For complex scenarios, generate manual intervention
   steps with clear decision points

## Security Considerations

### Rollback Security

- **Validate commands** — All generated commands should be validated for safety
- **No hardcoded credentials** — Never include credentials in rollback scripts
- **Audit logging** — Rollback operations should be logged for audit purposes

### Access Control

- **RBAC requirements** — Document required permissions for rollback
- **Approval workflows** — Include approval steps for production rollbacks
- **Blast radius** — Consider impact of rollback on dependent services

## Performance Characteristics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Analysis latency | < 5s | Per deployment config |
| Procedure generation | < 10s | For complete procedure set |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_NAMESPACE` | `default` | Kubernetes namespace for commands |
| `ROLLBACK_TIMEOUT_S` | `300` | Timeout for rollback operations |
| `VERIFICATION_INTERVAL_S` | `10` | Interval between verification checks |

## Testing

### Unit tests

```typescript
describe('runbook.generate.rollback', () => {
  it('should generate Kubernetes rollback procedure', async () => {
    const result = await generateRollback({
      deployment_config: {
        platform: 'kubernetes',
        namespace: 'production',
        deployment: 'my-service',
        replicas: 3,
      },
    });

    expect(result.procedures.length).toBeGreaterThan(0);
    expect(result.procedures[0].steps.length).toBeGreaterThanOrEqual(3);
    expect(result.scripts.length).toBeGreaterThan(0);
  });

  it('should include pre-rollback checks', async () => {
    const result = await generateRollback({
      deployment_config: {
        platform: 'kubernetes',
        namespace: 'production',
        deployment: 'my-service',
      },
    });

    expect(result.procedures[0].pre_rollback_checks.length).toBeGreaterThan(0);
    expect(result.procedures[0].post_rollback_verification.length).toBeGreaterThan(0);
  });
});
