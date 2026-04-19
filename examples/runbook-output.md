# Service Runbook: my-service

## Service Overview

| Property | Value |
|----------|-------|
| Service Name | my-service |
| Team | platform-engineering |
| Repository | https://github.com/reaatech/my-service |
| Language | TypeScript |
| Framework | Express |
| Service Type | Web API |
| Generated | 2026-04-16T00:00:00Z |

## Quick Links

- [Dashboard](#dashboards)
- [Alerts](#alerts)
- [Logs](#logs)
- [Metrics](#metrics)
- [Traces](#traces)

## Table of Contents

- [Service Overview](#service-overview)
- [Quick Links](#quick-links)
- [Alerts](#alerts)
- [Dashboards](#dashboards)
- [Failure Modes](#failure-modes)
- [Rollback Procedures](#rollback-procedures)
- [Incident Response](#incident-response)
- [Health Checks](#health-checks)
- [Service Dependencies](#service-dependencies)

## Alerts

### Critical Alerts

| Alert Name | Condition | Severity | Runbook Link |
|------------|-----------|----------|--------------|
| High Error Rate | error_rate > 5% | Critical | [High Error Rate](#failure-modes) |
| Service Down | uptime < 99.9% | Critical | [Service Down](#failure-modes) |
| High Latency | p99_latency > 500ms | Critical | [High Latency](#failure-modes) |

### Warning Alerts

| Alert Name | Condition | Severity | Runbook Link |
|------------|-----------|----------|--------------|
| Memory Usage | memory_usage > 80% | Warning | [Memory Pressure](#failure-modes) |
| CPU Usage | cpu_usage > 70% | Warning | [CPU Pressure](#failure-modes) |
| Disk Usage | disk_usage > 85% | Warning | [Disk Pressure](#failure-modes) |

## Dashboards

### Primary Dashboard

- **Platform**: Grafana
- **URL**: https://grafana.example.com/d/my-service
- **Refresh**: 30s

### SLO Dashboard

- **Availability Target**: 99.9%
- **Latency Target**: p99 < 500ms
- **Error Budget**: Tracked monthly

## Failure Modes

### Database Connection Failure

**Detection:**
- Error rate spikes
- Database connection timeout errors
- Health check failures

**Mitigation:**
1. Check database status
2. Verify connection pool configuration
3. Enable circuit breaker
4. Failover to replica if available

**Escalation:**
- Page on-call engineer
- Escalate to database team if unresolved after 15 minutes

### Memory Exhaustion

**Detection:**
- Memory usage > 80%
- OOM kills
- Slow response times

**Mitigation:**
1. Check for memory leaks
2. Increase memory limits
3. Restart service if needed
4. Scale horizontally

**Escalation:**
- Page on-call engineer
- Escalate to platform team if unresolved

## Rollback Procedures

### Kubernetes Deployment Rollback

**Pre-rollback checks:**
1. Verify current deployment status
2. Check rollout history
3. Notify team of rollback

**Rollback steps:**
```bash
# Rollback to previous revision
kubectl rollout undo deployment/my-service -n production

# Verify rollback
kubectl rollout status deployment/my-service -n production
```

**Verification:**
1. Check deployment status
2. Verify health checks pass
3. Monitor error rates
4. Confirm traffic is flowing

### Configuration Rollback

**Pre-rollback checks:**
1. Identify configuration change
2. Backup current configuration
3. Notify team of rollback

**Rollback steps:**
1. Revert configuration in version control
2. Deploy previous configuration
3. Restart affected services

**Verification:**
1. Verify configuration applied
2. Check service health
3. Monitor for issues

## Incident Response

### Severity Definitions

| Severity | Description | Response Time |
|----------|-------------|---------------|
| SEV1 | Service down, data loss | Immediate |
| SEV2 | Significant degradation | 15 minutes |
| SEV3 | Minor degradation | 1 hour |
| SEV4 | Non-urgent issues | Next business day |

### Escalation Matrix

| Severity | First Responder | Escalation | Final Escalation |
|----------|----------------|------------|------------------|
| SEV1 | On-call engineer | Team lead (15 min) | Engineering director (30 min) |
| SEV2 | On-call engineer | Team lead (30 min) | Engineering manager (1 hour) |
| SEV3 | On-call engineer | Team lead (2 hours) | - |
| SEV4 | Assigned engineer | Team lead (1 day) | - |

### Communication Templates

#### Initial Incident Update

```
[INCIDENT] {title}
Status: {status}
Severity: {severity}
Impact: {impact description}
Started: {start time}
Link: {incident doc link}
```

#### Resolution Update

```
[RESOLVED] {title}
Duration: {duration}
Root Cause: {brief description}
Next Steps: {post-incident actions}
```

## Health Checks

### Liveness Check

- **Endpoint**: `/health`
- **Method**: GET
- **Expected Response**: 200 OK with `{"status": "healthy"}`
- **Timeout**: 5 seconds
- **Interval**: 30 seconds

### Readiness Check

- **Endpoint**: `/ready`
- **Method**: GET
- **Expected Response**: 200 OK with `{"status": "ready"}`
- **Timeout**: 5 seconds
- **Interval**: 10 seconds

### Deep Health Check

- **Endpoint**: `/health/deep`
- **Method**: GET
- **Checks**:
  - Database connectivity
  - Cache connectivity
  - External service connectivity
- **Timeout**: 10 seconds
- **Interval**: 60 seconds

## Service Dependencies

### Upstream Services

| Service | Type | Critical | Description |
|---------|------|----------|-------------|
| auth-service | HTTP | Yes | Authentication and authorization |
| user-db | Database | Yes | User data storage |

### Downstream Services

| Service | Type | Critical | Description |
|---------|------|----------|-------------|
| notification-service | HTTP | No | Email and push notifications |
| analytics-service | HTTP | No | Event tracking and analytics |

### External Dependencies

| Service | Type | Critical | Description |
|---------|------|----------|-------------|
| Redis | Cache | Yes | Session and cache storage |
| S3 | Storage | No | File storage |

## Logs

- **Platform**: Cloud Logging / ELK
- **Query**: `resource.type="cloud_run_revision" resource.labels.service_name="my-service"`
- **Retention**: 30 days

## Metrics

- **Platform**: Cloud Monitoring / Prometheus
- **Key Metrics**:
  - `run.googleapis.com/request_count` - Request rate
  - `run.googleapis.com/request_latencies` - Response latency
  - `run.googleapis.com/memory/utilizations` - Memory usage
  - `run.googleapis.com/cpu/utilizations` - CPU usage

## Traces

- **Platform**: Cloud Trace / Jaeger
- **Sampling**: 10% of requests
- **Retention**: 7 days
