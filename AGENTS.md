---
agent_id: "agent-runbook-generator"
display_name: "Agent Runbook Generator"
version: "0.1.0"
description: "Automated runbook generation for agent incident response"
type: "mcp"
confidence_threshold: 0.9
---

# AGENTS.md — Agent Development Guide

## Project Overview

**agent-runbook-generator** is a pnpm monorepo of 15 packages (14 publishable, 1 private) that provides a CLI tool, library, and MCP server for generating operator runbooks from service repositories. It ingests a service repo and produces a complete runbook with alerts, dashboards, failure modes, rollback steps, incident response workflows, health checks, and service dependency maps.

**Target audience:** SRE teams, platform engineers, and DevOps practitioners who need to create and maintain operator runbooks for production services.

**Repo type:** Public open-source pnpm monorepo, CLI tool, library, and MCP server.

---

## Monorepo Structure

The project follows the same conventions as `a2a-reference-ts`:

```
agent-runbook-generator/
├── packages/                    # 15 workspace packages
│   ├── core/                    # @reaatech/agent-runbook — types, schemas, utilities
│   ├── analyzer/                # @reaatech/agent-runbook-analyzer
│   ├── alerts/                  # @reaatech/agent-runbook-alerts
│   ├── dashboards/              # @reaatech/agent-runbook-dashboards
│   ├── failure-modes/           # @reaatech/agent-runbook-failure-modes
│   ├── health-checks/           # @reaatech/agent-runbook-health-checks
│   ├── incident/                # @reaatech/agent-runbook-incident
│   ├── rollback/                # @reaatech/agent-runbook-rollback
│   ├── runbook/                 # @reaatech/agent-runbook-runbook
│   ├── service-map/             # @reaatech/agent-runbook-service-map
│   ├── agent/                   # @reaatech/agent-runbook-agent
│   ├── mcp/                     # @reaatech/agent-runbook-mcp
│   ├── observability/           # @reaatech/agent-runbook-observability
│   ├── cli/                     # @reaatech/agent-runbook-cli
│   └── e2e/                     # @reaatech/agent-runbook-e2e (private)
├── skills/                      # Agent skill definitions
├── examples/                    # Example runbook output
├── infra/                       # Terraform deployment modules
├── pnpm-workspace.yaml          # Workspace definition
├── turbo.json                   # Build pipeline
├── biome.json                   # Linting & formatting
├── tsconfig.json                # Root TypeScript config
├── tsconfig.typecheck.json      # Typecheck with path aliases
└── .changeset/                  # Version management
```

### Root tooling

| Tool | Purpose |
|------|---------|
| pnpm 10 | Package manager with workspace protocol |
| turbo | Monorepo build orchestrator |
| tsup | Per-package dual ESM/CJS build |
| biome | Linting + formatting |
| changesets | Version management + CHANGELOG generation |
| vitest | Per-package testing |

---

## Architecture Overview

The system follows a three-layer architecture, implemented across multiple packages:

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
├── runbook.generate.service_map — Generate service dependency map
└── runbook.generate.health_checks — Generate health check definitions

Layer 3: runbook.validate.* (CI Gates)
├── runbook.validate.completeness — Check runbook completeness
├── runbook.validate.accuracy — Validate runbook accuracy
├── runbook.validate.links — Verify runbook cross-references
└── runbook.validate.ci — Run CI-style validation gate
```

### Package Dependency Graph

```
@reaatech/agent-runbook (core: types + utils + errors)
    │
    ├──► @reaatech/agent-runbook-observability
    │
    ├──► @reaatech/agent-runbook-analyzer
    │
    ├──► 8 generator packages:
    │       alerts, dashboards, failure-modes, health-checks,
    │       incident, rollback, runbook, service-map
    │
    ├──► @reaatech/agent-runbook-agent ──► @reaatech/agent-runbook-mcp
    │
    └──► @reaatech/agent-runbook-cli (orchestrator + binary)
```

---

## MCP Tool Architecture

### Three-Layer MCP Tools

The MCP server (`@reaatech/agent-runbook-mcp`) exposes tools in three layers, each with different characteristics:

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

The analyzer (`@reaatech/agent-runbook-analyzer`) detects service types based on file patterns:

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
   ├── @reaatech/agent-runbook-analyzer — Detect language and framework
   ├── Map directory structure
   └── Identify key configuration files

2. Parse configurations
   ├── @reaatech/agent-runbook-analyzer — Extract environment variables
   ├── Parse infrastructure-as-code
   └── Identify deployment configuration

3. Analyze code
   ├── @reaatech/agent-runbook-analyzer — Identify entry points
   ├── Extract API endpoints
   └── Detect external service connections

4. Map dependencies
   ├── @reaatech/agent-runbook-analyzer — Parse package manifests
   ├── Identify upstream/downstream services
   └── Generate dependency graph

5. Run LLM agent analysis
   ├── @reaatech/agent-runbook-agent — Generate insights from code patterns
   ├── Identify failure modes
   └── Suggest improvements

6. Generate runbook sections
   ├── @reaatech/agent-runbook-alerts — Alert definitions
   ├── @reaatech/agent-runbook-dashboards — Dashboard configurations
   ├── @reaatech/agent-runbook-failure-modes — Failure modes and mitigations
   ├── @reaatech/agent-runbook-rollback — Rollback procedures
   ├── @reaatech/agent-runbook-incident — Incident response workflows
   └── @reaatech/agent-runbook-health-checks — Health check definitions

7. Assemble runbook
   ├── @reaatech/agent-runbook-runbook — Combine all sections
   ├── Generate table of contents
   ├── Create cross-references
   └── Apply formatting

8. Validate runbook
   ├── @reaatech/agent-runbook-runbook — Check completeness
   ├── Verify accuracy
   └── Validate links

9. Export runbook
   ├── @reaatech/agent-runbook-runbook — Markdown format
   ├── HTML format (optional)
   └── PDF format (optional)
```

---

## Agent Skills Reference

### Skill: Repository Analysis

**Package:** `@reaatech/agent-runbook-analyzer`

**Location:** `skills/repo-analysis/skill.md`

**Capability:** Scans a service repository to understand its structure, technology stack, configuration, and deployment patterns.

**MCP Tools:**
- `runbook.analyze.repository` — Analyze repository structure
- `runbook.analyze.dependencies` — Map service dependencies

### Skill: Alert Generation

**Package:** `@reaatech/agent-runbook-alerts`

**Location:** `skills/alert-generation/skill.md`

**Capability:** Extracts existing alerts and generates new alert definitions based on service patterns and SLO targets.

**MCP Tools:**
- `runbook.analyze.alerts` — Extract existing alert definitions
- `runbook.generate.alerts` — Generate new alert definitions

### Skill: Dashboard Generation

**Package:** `@reaatech/agent-runbook-dashboards`

**Location:** `skills/dashboard-generation/skill.md`

**Capability:** Creates dashboard configurations for Grafana and CloudWatch.

**MCP Tools:**
- `runbook.generate.dashboard` — Generate dashboard configuration

### Skill: Failure Mode Analysis

**Package:** `@reaatech/agent-runbook-failure-modes`

**Location:** `skills/failure-mode-analysis/skill.md`

**Capability:** Identifies potential failure points and generates detection and mitigation strategies.

**MCP Tools:**
- `runbook.analyze.failure_modes` — Identify failure modes

### Skill: Rollback Procedures

**Package:** `@reaatech/agent-runbook-rollback`

**Location:** `skills/rollback-procedures/skill.md`

**Capability:** Generates step-by-step rollback procedures for deployment failures.

**MCP Tools:**
- `runbook.generate.rollback` — Generate rollback procedures

### Skill: Runbook Assembly

**Package:** `@reaatech/agent-runbook-runbook`

**Location:** `skills/runbook-assembly/skill.md`

**Capability:** Combines all sections into a complete runbook with formatting and cross-references.

**MCP Tools:**
- `runbook.generate.full` — Generate complete runbook
- `runbook.validate.completeness` — Validate runbook completeness

### Skill: Incident Response

**Package:** `@reaatech/agent-runbook-incident`

**Location:** `skills/incident-response/skill.md`

**Capability:** Generates incident response workflows and communication templates.

**MCP Tools:**
- `runbook.generate.incident_workflow` — Generate incident response procedures

### Skill: Service Mapping

**Package:** `@reaatech/agent-runbook-service-map`

**Location:** `skills/service-mapping/skill.md`

**Capability:** Maps service dependencies and generates dependency graphs.

**MCP Tools:**
- `runbook.analyze.dependencies` — Analyze service dependencies
- `runbook.generate.service_map` — Generate dependency graph

### Skill: Health Check Generation

**Package:** `@reaatech/agent-runbook-health-checks`

**Location:** `skills/health-check-generation/skill.md`

**Capability:** Generates health check definitions for Kubernetes and load balancers.

**MCP Tools:**
- `runbook.analyze.health_checks` — Analyze existing health checks
- `runbook.generate.health_checks` — Generate health check definitions

---

## CI Integration

### GitHub Actions Integration

The CI workflow uses pnpm + turbo:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    needs: [build, code-quality]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

### Release workflow

The release is managed by changesets via `.github/workflows/release.yml`.

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — runbook generated and validated |
| 1 | Error — generation failed |
| 2 | Warning — runbook generated but validation warnings |
| 3 | Fail — runbook validation failed (CI gate) |

---

## Development Commands

```bash
pnpm build          # Build all 15 packages (turbo)
pnpm test           # Run all tests (turbo)
pnpm lint           # Lint all files (biome)
pnpm format         # Format all files (biome)
pnpm typecheck      # Type-check with path aliases
pnpm clean          # Clean dist + node_modules
pnpm changeset      # Create a changeset for versioning
```

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
- **README.md** — Quick start and overview
- **skills/** — Skill definitions for agent capabilities
- **MCP Specification** — https://modelcontextprotocol.io/
