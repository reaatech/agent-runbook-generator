---
agent_id: "agent-runbook-generator"
display_name: "Agent Runbook Generator"
version: "1.0.0"
description: "Automated runbook generation for agent incident response"
type: "mcp"
confidence_threshold: 0.9
---

# AGENTS.md — Agent Development Guide

## Project Overview

**agent-runbook-generator** is a CLI tool and library that ingests a service
repository and generates a draft operator runbook including alerts, dashboards,
failure modes, rollback steps, and incident response workflows. It uses an AI
agent to analyze code, configuration files, and infrastructure definitions to
produce comprehensive, actionable runbooks.

**Target audience:** SRE teams, platform engineers, and DevOps practitioners who
need to create and maintain operator runbooks for production services.

**Repo type:** Public open-source library, CLI tool, and MCP server.

---

## Architecture Overview

The system follows a three-layer architecture:

```
Layer 1: runbook.analyze.* (Atomic Operations)
├── runbook.analyze.repository — Analyze a service repository
├── runbook.analyze.dependencies — Map service dependencies
├── runbook.analyze.failure_modes — Identify failure modes
├── runbook.analyze.alerts — Extract/generate alert definitions
└── runbook.analyze.health_checks — Generate health check definitions

Layer 2: runbook.generate.* (Orchestrated Runs)
├── runbook.generate.full — Generate complete runbook
├── runbook.generate.alerts — Generate alert definitions
├── runbook.generate.dashboard — Generate dashboard configuration
├── runbook.generate.rollback — Generate rollback procedures
├── runbook.generate.incident_workflow — Generate incident response
└── runbook.generate.service_map — Generate service dependency map

Layer 3: runbook.validate.* (CI Gates)
├── runbook.validate.completeness — Check runbook completeness
├── runbook.validate.accuracy — Validate runbook accuracy
├── runbook.validate.links — Verify runbook cross-references
└── runbook.validate.ci — Run CI-style validation gate
```

---

## MCP Tool Architecture

### Three-Layer MCP Tools

The MCP server exposes tools in three layers, each with different characteristics:

| Layer | Prefix | Purpose | Rate Limit | Timeout |
|-------|--------|---------|------------|---------|
| 1 | `runbook.analyze.*` | Atomic analysis operations | 30 RPM | 60s |
| 2 | `runbook.generate.*` | Orchestrated generation | 10 RPM | 300s |
| 3 | `runbook.validate.*` | CI-style validation | 30 RPM | 60s |

### Tool Categories

#### Analysis Tools (Layer 1)

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `runbook.analyze.repository` | Scan repository structure | `{ path, depth?, include_patterns?, exclude_patterns? }` | `{ service_type, language, framework, structure, config_files, entry_points }` |
| `runbook.analyze.dependencies` | Map service dependencies | `{ path, include_dev? }` | `{ direct_deps, transitive_deps, dependency_graph, external_services }` |
| `runbook.analyze.failure_modes` | Identify failure modes | `{ analysis_context, depth? }` | `{ failure_modes, single_points_of_failure, risk_score }` |
| `runbook.analyze.alerts` | Extract alert definitions | `{ path, platform? }` | `{ alerts, slo_alerts, resource_alerts }` |
| `runbook.analyze.health_checks` | Analyze health checks | `{ analysis_context }` | `{ existing_checks, recommended_checks, gaps }` |

#### Generation Tools (Layer 2)

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `runbook.generate.full` | Generate complete runbook | `{ analysis_context, config? }` | `{ runbook, sections, toc }` |
| `runbook.generate.alerts` | Generate alert definitions | `{ analysis_context, slo_targets?, platform }` | `{ alert_definitions, recording_rules }` |
| `runbook.generate.dashboard` | Generate dashboard config | `{ service_context, platform }` | `{ dashboard_config, panels, queries }` |
| `runbook.generate.rollback` | Generate rollback procedures | `{ deployment_config, failure_scenarios? }` | `{ procedures, scripts, verification_steps }` |
| `runbook.generate.incident_workflow` | Generate incident response | `{ service_context, team_config }` | `{ workflows, escalation_matrix, templates }` |
| `runbook.generate.service_map` | Generate dependency graph | `{ analysis_context, format? }` | `{ graph, nodes, edges, critical_paths }` |
| `runbook.generate.health_checks` | Generate health check definitions | `{ service_context, platform }` | `{ health_checks, liveness, readiness, startup }` |

#### Validation Tools (Layer 3)

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `runbook.validate.completeness` | Check runbook completeness | `{ runbook, required_sections? }` | `{ score, missing_sections, suggestions }` |
| `runbook.validate.accuracy` | Validate runbook accuracy | `{ runbook, analysis_context }` | `{ accuracy_score, discrepancies }` |
| `runbook.validate.links` | Verify cross-references | `{ runbook }` | `{ valid_links, broken_links }` |
| `runbook.validate.ci` | CI-style validation gate | `{ runbook, thresholds? }` | `{ passed, failures, warnings }` |

---

## Repository Analysis Patterns

### Service Type Detection

The analyzer detects service types based on file patterns:

| Service Type | Detection Patterns |
|-------------|-------------------|
| Web API (Node.js) | `package.json` + `express`/`fastify`/`koa` dependency |
| Web API (Python) | `requirements.txt`/`pyproject.toml` + `flask`/`django`/`fastapi` |
| Web API (Go) | `go.mod` + `gin`/`echo`/`chi` dependency |
| Worker/Queue | Background job libraries (bull, celery, sidekiq) |
| Lambda/Function | Serverless framework configs, function handlers |
| Unknown | No matching patterns found |

### Configuration File Priority

When analyzing configurations, files are prioritized:

1. **Environment configs** — `.env.production`, `config/production.yaml`
2. **Infrastructure configs** — `Dockerfile`, `docker-compose.yml`, Kubernetes manifests
3. **Application configs** — `config/`, `conf/`, `settings/` directories
4. **Package configs** — `package.json`, `pyproject.toml`, `go.mod`

### Dependency Analysis

Dependencies are categorized:

| Category | Detection |
|----------|-----------|
| Database | `pg`, `mysql`, `mongodb`, `redis` packages |
| Cache | `redis`, `memcached` packages |
| Message Queue | `kafka`, `rabbitmq`, `sqs` packages |
| External API | HTTP client packages + API endpoint patterns |
| Storage | Cloud storage SDKs (S3, GCS, Azure Blob) |

---

## Runbook Generation Workflow

### Complete Generation Flow

```
1. Load & scan repository
   ├── Detect language and framework
   ├── Map directory structure
   └── Identify key configuration files

2. Parse configurations
   ├── Extract environment variables
   ├── Parse infrastructure-as-code
   └── Identify deployment configuration

3. Analyze code
   ├── Identify entry points
   ├── Extract API endpoints
   └── Detect external service connections

4. Map dependencies
   ├── Parse package manifests
   ├── Identify upstream/downstream services
   └── Generate dependency graph

5. Run LLM agent analysis
   ├── Generate insights from code patterns
   ├── Identify failure modes
   └── Suggest improvements

6. Generate runbook sections
   ├── Alert definitions
   ├── Dashboard configurations
   ├── Failure modes and mitigations
   ├── Rollback procedures
   ├── Incident response workflows
   └── Health check definitions

7. Assemble runbook
   ├── Combine all sections
   ├── Generate table of contents
   ├── Create cross-references
   └── Apply formatting

8. Validate runbook
   ├── Check completeness
   ├── Verify accuracy
   └── Validate links

9. Export runbook
   ├── Markdown format
   ├── HTML format (optional)
   └── PDF format (optional)
```

---

## Agent Skills Reference

### Skill: Repository Analysis

**Location:** `skills/repo-analysis/skill.md`

**Capability:** Scans a service repository to understand its structure, technology
stack, configuration, and deployment patterns.

**MCP Tools:**
- `runbook.analyze.repository` — Analyze repository structure
- `runbook.analyze.dependencies` — Map service dependencies

### Skill: Alert Generation

**Location:** `skills/alert-generation/skill.md`

**Capability:** Extracts existing alerts and generates new alert definitions based
on service patterns and SLO targets.

**MCP Tools:**
- `runbook.analyze.alerts` — Extract existing alert definitions
- `runbook.generate.alerts` — Generate new alert definitions

### Skill: Dashboard Generation

**Location:** `skills/dashboard-generation/skill.md`

**Capability:** Creates dashboard configurations for Grafana, Looker, and CloudWatch.

**MCP Tools:**
- `runbook.generate.dashboard` — Generate dashboard configuration

### Skill: Failure Mode Analysis

**Location:** `skills/failure-mode-analysis/skill.md`

**Capability:** Identifies potential failure points and generates detection and
mitigation strategies.

**MCP Tools:**
- `runbook.analyze.failure_modes` — Identify failure modes

### Skill: Rollback Procedures

**Location:** `skills/rollback-procedures/skill.md`

**Capability:** Generates step-by-step rollback procedures for deployment failures.

**MCP Tools:**
- `runbook.generate.rollback` — Generate rollback procedures

### Skill: Runbook Assembly

**Location:** `skills/runbook-assembly/skill.md`

**Capability:** Combines all sections into a complete runbook with formatting and
cross-references.

**MCP Tools:**
- `runbook.generate.full` — Generate complete runbook
- `runbook.validate.completeness` — Validate runbook completeness

### Skill: Incident Response

**Location:** `skills/incident-response/skill.md`

**Capability:** Generates incident response workflows and communication templates.

**MCP Tools:**
- `runbook.generate.incident_workflow` — Generate incident response procedures

### Skill: Service Mapping

**Location:** `skills/service-mapping/skill.md`

**Capability:** Maps service dependencies and generates dependency graphs.

**MCP Tools:**
- `runbook.analyze.dependencies` — Analyze service dependencies
- `runbook.generate.service_map` — Generate dependency graph

### Skill: Health Check Generation

**Location:** `skills/health-check-generation/skill.md`

**Capability:** Generates health check definitions for Kubernetes and load balancers.

**MCP Tools:**
- `runbook.analyze.health_checks` — Analyze existing health checks
- `runbook.generate.health_checks` — Generate health check definitions

---

## CI Integration

### GitHub Actions Integration

The runbook generator can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/runbook.yml
name: Runbook Validation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate-runbook:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate runbook
        run: npx agent-runbook-generator generate . --output runbook.md

      - name: Validate runbook
        run: npx agent-runbook-generator validate runbook.md --ci

      - name: Upload runbook artifact
        uses: actions/upload-artifact@v4
        with:
          name: runbook
          path: runbook.md
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — runbook generated and validated |
| 1 | Error — generation failed |
| 2 | Warning — runbook generated but validation warnings |
| 3 | Fail — runbook validation failed (CI gate) |

---

## Security Considerations

### Secret Detection

The generator automatically detects and redacts:
- API keys and tokens
- Database connection strings with passwords
- Private keys and certificates
- Personal identifiable information (PII)
- Internal URLs and IP addresses

### Repository Access

- **Read-only access** — Never modifies source repositories
- **Path validation** — Prevents directory traversal attacks
- **Respects .gitignore** — Doesn't analyze ignored files
- **No credential logging** — Never logs or exposes credentials

### Output Security

- **Sanitized content** — All output is safe for version control
- **No PII in runbooks** — Personal information is redacted
- **Safe cross-references** — Links are validated before inclusion

---

## Production Readiness Checklist

### Before Deploying to Production

- [ ] All LLM API keys configured via environment variables
- [ ] Observability configured (OTel endpoints, log aggregation)
- [ ] Rate limits configured for MCP server
- [ ] Secret scanning enabled in CI/CD
- [ ] Runbook validation gate added to CI pipeline
- [ ] Backup strategy for generated runbooks
- [ ] Access control configured for MCP server
- [ ] Alert thresholds tuned for your services

### Ongoing Maintenance

- [ ] Review generated runbooks for accuracy
- [ ] Update service configurations when architecture changes
- [ ] Monitor generator performance and costs
- [ ] Review and update prompt templates periodically
- [ ] Validate runbooks after major service changes

---

## References

- **ARCHITECTURE.md** — System design deep dive
- **DEV_PLAN.md** — Development checklist
- **README.md** — Quick start and overview
- **skills/** — Skill definitions for agent capabilities
- **MCP Specification** — https://modelcontextprotocol.io/
