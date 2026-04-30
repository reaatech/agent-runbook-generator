# agent-runbook-generator — Architecture

## System Overview

The Agent Runbook Generator is a 15-package pnpm monorepo that ingests a service repository and produces a complete operator runbook. It uses a three-layer MCP tool architecture exposed through `@reaatech/agent-runbook-mcp` and orchestrated by `@reaatech/agent-runbook-cli`.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │    CLI      │    │   Library   │    │  MCP Client │                  │
│  │ (agent-     │    │  (import    │    │  (Claude    │                  │
│  │  runbook-   │    │   agent-    │    │   Code,     │                  │
│  │  cli)       │    │   runbook-  │    │   Cursor)   │                  │
│  │             │    │   cli)      │    │             │                  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                  │
│         │                   │                   │                         │
│         └───────────────────┼───────────────────┘                         │
│                             │                                              │
└─────────────────────────────┼─────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Generation Core                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Three-Layer Architecture                     │   │
│  │                                                                   │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │   │
│  │  │runbook.     │───▶│runbook.     │───▶│runbook.     │           │   │
│  │  │analyze.*    │    │generate.*   │    │validate.*   │           │   │
│  │  │  (Analysis) │    │(Generation) │    │  (CI)       │           │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
packages/
├── core/                       @reaatech/agent-runbook
│   └── (types, schemas, utils, errors)
│
├── observability/              @reaatech/agent-runbook-observability
│   └── (logging, tracing, metrics)
│
├── analyzer/                   @reaatech/agent-runbook-analyzer
│   └── (scanner, config parser, code analyzer, dependency mapper)
│
├── alerts/                     @reaatech/agent-runbook-alerts
├── dashboards/                 @reaatech/agent-runbook-dashboards
├── failure-modes/              @reaatech/agent-runbook-failure-modes
├── health-checks/              @reaatech/agent-runbook-health-checks
├── incident/                   @reaatech/agent-runbook-incident
├── rollback/                   @reaatech/agent-runbook-rollback
├── runbook/                    @reaatech/agent-runbook-runbook
├── service-map/                @reaatech/agent-runbook-service-map
│
├── agent/                      @reaatech/agent-runbook-agent
│   └── (LLM analysis, prompt templates, provider adapter)
│
├── mcp/                        @reaatech/agent-runbook-mcp
│   └── (MCP server, tool registry)
│
├── cli/                        @reaatech/agent-runbook-cli
│   └── (CLI commands, orchestrator, facade barrel)
│
└── e2e/                        @reaatech/agent-runbook-e2e (private)
    └── (integration tests)
```

### Dependency Graph

```
@reaatech/agent-runbook (core)
    │
    ├──► @reaatech/agent-runbook-observability
    │
    ├──► @reaatech/agent-runbook-analyzer
    │
    ├──► 8 generator packages:
    │       alerts, dashboards, failure-modes, health-checks,
    │       incident, rollback, runbook, service-map
    │
    ├──► @reaatech/agent-runbook-agent
    │         │
    │         └──► @reaatech/agent-runbook-mcp
    │
    └──► @reaatech/agent-runbook-cli (depends on all)
```

---

## Design Principles

### 1. Three-Layer Architecture
- **runbook.analyze.*** — Atomic analysis operations for repository scanning
- **runbook.generate.*** — Orchestrated generation for complete runbooks
- **runbook.validate.*** — CI-style validation gates for runbook quality

### 2. Package-Module Alignment
- Each `src/` module is its own independently publishable package
- Packages depend on `@reaatech/agent-runbook` (core) for types and utilities
- The CLI package (`agent-runbook-cli`) serves as the facade, re-exporting all public APIs

### 3. Provider-Agnostic
- Any LLM provider can be used for analysis and generation (Claude, GPT-4, Gemini)
- Unified interface via `@reaatech/agent-runbook-agent`
- Provider-specific optimizations encapsulated in `ProviderAdapter`

### 4. Repository-Agnostic
- Supports any codebase structure (Node.js, Python, Go, Java, etc.)
- Extensible analyzer via `@reaatech/agent-runbook-analyzer`
- Works with local directories or remote repositories

### 5. No PII in Output
- Never include secrets, API keys, or PII in generated runbooks
- Automatic redaction via `@reaatech/agent-runbook` utilities
- Safe for sharing and version control

### 6. CI-Native Design
- Exit codes suitable for automation
- Validation gates for CI/CD pipelines
- Reproducible generation for consistency

---

## Component Deep Dive

### Three-Layer MCP Tool Architecture

The MCP server (`@reaatech/agent-runbook-mcp`) exposes 16 tools across three layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│               Layer 1: runbook.analyze.* (Analysis)                  │
│                                                                      │
│  Atomic operations backed by @reaatech/agent-runbook-analyzer        │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   repository    │    │  dependencies   │    │  failure_modes  │  │
│  │                 │    │                 │    │                 │  │
│  │ Analyze service │    │ Map service     │    │ Identify        │  │
│  │ repository      │    │ dependencies    │    │ failure modes   │  │
│  │ structure       │    │                 │    │                 │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐                         │
│  │     alerts      │    │  health_checks  │                         │
│  │                 │    │                 │                         │
│  │ Extract alert   │    │ Analyze health  │                         │
│  │ definitions     │    │ checks          │                         │
│  └─────────────────┘    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│             Layer 2: runbook.generate.* (Generation)                 │
│                                                                      │
│  Orchestrated operations across generator packages                   │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │      full       │    │     alerts      │    │    dashboard    │  │
│  │                 │    │                 │    │                 │  │
│  │ Generate        │    │ Generate alert  │    │ Generate        │  │
│  │ complete        │    │ definitions     │    │ dashboard       │  │
│  │ runbook         │    │                 │    │ configurations  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │    rollback     │    │incident_workflow│    │   service_map   │  │
│  │                 │    │                 │    │                 │  │
│  │ Generate        │    │ Generate        │    │ Generate        │  │
│  │ rollback        │    │ incident        │    │ dependency      │  │
│  │ procedures      │    │ response        │    │ graphs          │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │  health_checks  │                                                 │
│  │                 │                                                 │
│  │ Generate health │                                                 │
│  │ check defs      │                                                 │
│  └─────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                Layer 3: runbook.validate.* (CI Gates)                │
│                                                                      │
│  Opinionated validation through @reaatech/agent-runbook-runbook      │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  completeness   │    │     accuracy    │    │      links      │  │
│  │                 │    │                 │    │                 │  │
│  │ Check runbook   │    │ Validate        │    │ Verify          │  │
│  │ has all required│    │ runbook accuracy│    │ cross-references│  │
│  │ sections        │    │ against codebase│    │ and links       │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │       ci        │                                                 │
│  │                 │                                                 │
│  │ Run CI-style    │                                                 │
│  │ validation gate │                                                 │
│  └─────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Repository Analyzer (`@reaatech/agent-runbook-analyzer`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Repository Analyzer                              │
│                                                                      │
│  Input: Repository path (local or remote)                           │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │    Scanner      │    │    Parser       │    │    Analyzer     │  │
│  │                 │    │                 │    │                 │  │
│  │ - Detect        │    │ - Parse YAML/   │    │ - Identify      │  │
│  │   language      │    │   JSON configs  │    │   entry points  │  │
│  │ - Map directory │    │ - Extract env   │    │ - Extract API   │  │
│  │   structure     │    │   variables     │    │   endpoints     │  │
│  │ - Identify key  │    │ - Parse IaC     │    │ - Detect        │  │
│  │   files         │    │   (Terraform,   │    │   external      │  │
│  │                 │    │   CDK, Pulumi)  │    │   services      │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │ Dependency      │                                                 │
│  │ Mapper          │                                                 │
│  │                 │                                                 │
│  │ - Parse package │                                                 │
│  │   manifests     │                                                 │
│  │ - Categorize    │                                                 │
│  │   dependencies  │                                                 │
│  └─────────────────┘                                                 │
│                                                                      │
│  Output: AnalysisContext { service_type, config_files, entry_points, │
│                           dependencies, external_services }         │
└─────────────────────────────────────────────────────────────────────┘
```

### Alert Generator (`@reaatech/agent-runbook-alerts`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Alert Generator                                │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │    Extractor    │    │   Generator     │    │   Threshold     │  │
│  │                 │    │                 │    │   Calculator    │  │
│  │ - Extract       │    │ - Generate new  │    │ - Calculate     │  │
│  │   existing      │    │   alerts based  │    │   thresholds    │  │
│  │   alerts from   │    │   on service    │    │   from SLO      │  │
│  │   configs       │    │   patterns      │    │ - Multi-window  │  │
│  │ - Parse         │    │ - Suggest       │    │   burn rate     │  │
│  │   Prometheus,   │    │   escalation    │    │   alerts        │  │
│  │   Datadog,      │    │   policies      │    │ - Saturation    │  │
│  │   CloudWatch    │    │ - Link alerts   │    │   alerts        │  │
│  │   rules         │    │   to runbook    │    │                 │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  Output: AlertDefinition[] { name, condition, threshold, severity,   │
│                              escalation, runbook_link }              │
└─────────────────────────────────────────────────────────────────────┘
```

### Failure Mode Analyzer (`@reaatech/agent-runbook-failure-modes`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Failure Mode Analyzer                            │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │    Identifier   │    │     Catalog     │    │   Mitigation    │  │
│  │                 │    │                 │    │   Generator     │  │
│  │ - Analyze code  │    │ - Common        │    │ - Generate      │  │
│  │   for failure   │    │   failure       │    │   mitigation    │  │
│  │   points        │    │   modes         │    │   steps         │  │
│  │ - Identify      │    │ - Map to        │    │ - Suggest       │  │
│  │   single points │    │   service       │    │   circuit       │  │
│  │   of failure    │    │   patterns      │    │   breakers      │  │
│  │ - Detect        │    │ - Detection     │    │ - Recommend     │  │
│  │   missing error │    │   strategies    │    │   fallbacks     │  │
│  │   handling      │    │                 │    │                 │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  Output: FailureMode[] { name, detection, mitigation, escalation,    │
│                          runbook_section }                           │
└─────────────────────────────────────────────────────────────────────┘
```

### LLM Agent (`@reaatech/agent-runbook-agent`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LLM Analysis Agent                            │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │    Analysis     │    │    Prompt       │    │    Provider     │  │
│  │    Agent        │    │   Templates     │    │    Adapter      │  │
│  │                 │    │                 │    │                 │  │
│  │ - LLM-powered   │    │ - Repository    │    │ - Support       │  │
│  │   repository    │    │   analysis      │    │   Claude,       │  │
│  │   analysis      │    │ - Runbook       │    │   GPT-4,        │  │
│  │ - Generate      │    │   generation    │    │   Gemini        │  │
│  │   insights      │    │ - Failure mode  │    │ - Handle        │  │
│  │   from code     │    │   identification│    │   provider-     │  │
│  │ - Suggest       │    │ - Rollback      │    │   specific      │  │
│  │   improvements  │    │   procedure     │    │   formatting    │  │
│  │                 │    │   generation    │    │ - Fallback      │  │
│  │                 │    │                 │    │   between       │  │
│  │                 │    │                 │    │   providers     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  Output: AnalysisInsights { findings, suggestions, generated_content }│
└─────────────────────────────────────────────────────────────────────┘
```

### Runbook Assembler (`@reaatech/agent-runbook-runbook`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Runbook Assembler                              │
│                                                                      │
│  Input: AnalysisContext + GeneratedSections                         │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │     Builder     │    │    Formatter    │    │    Templates    │  │
│  │                 │    │                 │    │                 │  │
│  │ - Assemble all  │    │ - Generate      │    │ - SRE template  │  │
│  │   sections into │    │   Markdown      │    │ - Incident      │  │
│  │   complete      │    │ - Generate HTML │    │   response      │  │
│  │   runbook       │    │ - Generate PDF  │    │ - On-call       │  │
│  │ - Generate      │    │ - Support       │    │   handoff       │  │
│  │   table of      │    │   custom        │    │                 │  │
│  │   contents      │    │   templates     │    │                 │  │
│  │ - Create cross- │    │                 │    │                 │  │
│  │   references    │    │                 │    │                 │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │    Pipeline     │                                                 │
│  │                 │                                                 │
│  │ - Orchestrate   │                                                 │
│  │   end-to-end    │                                                 │
│  │   generation    │                                                 │
│  │   flow          │                                                 │
│  └─────────────────┘                                                 │
│                                                                      │
│  Output: Runbook { title, sections, toc, cross_references, format }  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Complete Runbook Generation Flow

```
1. Load repository (local path or clone from URL)
        │
        ▼
2. @reaatech/agent-runbook-analyzer:
   - scanRepository() — Detect language, framework, structure
   - parseConfigs() — Extract env vars, IaC, deployment config
   - analyzeCode() — Identify entry points, endpoints, connections
   - mapDependencies() — Parse manifests, categorize dependencies
        │
        ▼
3. @reaatech/agent-runbook-agent:
   - analyzeRepository() — LLM-powered insight generation
   - identifyFailureModes() — Pattern-based failure detection
        │
        ▼
4. Generator packages (in parallel):
   - @reaatech/agent-runbook-alerts — generateAlerts()
   - @reaatech/agent-runbook-dashboards — generateDashboard()
   - @reaatech/agent-runbook-failure-modes — generateMitigations()
   - @reaatech/agent-runbook-rollback — generateRollbackProcedures()
   - @reaatech/agent-runbook-incident — generateIncidentWorkflows()
   - @reaatech/agent-runbook-health-checks — generateHealthChecks()
   - @reaatech/agent-runbook-service-map — generateServiceMap()
        │
        ▼
5. @reaatech/agent-runbook-runbook:
   - buildRunbook() — Assemble all sections
   - generateTOC() — Create table of contents
   - exportRunbook() — Format as Markdown/HTML/PDF
        │
        ▼
6. Validation (@reaatech/agent-runbook-runbook):
   - validateCompleteness() — Required sections present
   - validateRunbookAccuracy() — Content matches repository
   - validateRunbookLinks() — Cross-references are valid
        │
        ▼
7. Export:
   - Markdown (.md)
   - HTML (.html)
   - PDF (.pdf)
```

---

## Security Model

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1: Repository Access                                           │
│ - Validate repository URLs                                          │
│ - Use read-only access where possible                               │
│ - Never commit generated runbooks without review                    │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 2: Data Handling                                               │
│ - @reaatech/agent-runbook utilities: redactSecrets(), looksLikeSecret()
│ - Never include secrets in generated output                         │
│ - Never log raw repository content                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 3: LLM API (@reaatech/agent-runbook-agent)                     │
│ - All LLM API keys from environment variables                       │
│ - Never log API keys or tokens                                      │
│ - Separate keys per provider for isolation                          │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 4: Output Security (@reaatech/agent-runbook-runbook)           │
│ - Validate generated content for sensitive data                     │
│ - Sanitize Markdown/HTML output                                     │
│ - Safe for version control (no secrets)                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Repository Access

- **Local repositories**: Direct file system access with read permissions
- **Read-only by default**: Never modifies source repositories
- **Path validation**: Prevents directory traversal (`isPathWithinBase`)

---

## Observability (`@reaatech/agent-runbook-observability`)

### Tracing

Every runbook generation generates OpenTelemetry spans:

| Span | Attributes |
|------|------------|
| `runbook.generate` | service_name, repo_path, sections |
| `repository.scan` | language, file_count, config_files |
| `code.analyze` | entry_points, endpoints, external_services |
| `agent.analyze` | provider, model, tokens |
| `section.generate` | section_type, duration_ms |
| `runbook.validate` | completeness_score, accuracy_score |

### Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `runbook_generation_total` | Counter | `status` | Total generation runs |
| `runbook_section_generated_total` | Counter | `section_type` | Sections generated |
| `agent_api_calls_total` | Counter | `provider`, `status` | LLM agent API calls |
| `analysis_duration_ms` | Histogram | `component` | Analysis duration |
| `agent_cost_total` | Counter | `provider` | Agent cost tracking |
| `runbook_completeness_score` | Gauge | `service` | Completeness score |

### Logging

All logs are structured JSON with standard fields:

```json
{
  "timestamp": "2026-04-15T23:00:00Z",
  "service": "agent-runbook-generator",
  "run_id": "run-123",
  "level": "info",
  "message": "Runbook generation completed",
  "service_name": "my-service",
  "sections_generated": 7,
  "duration_ms": 45000,
  "agent_cost": 0.0234
}
```

---

## Deployment Architecture

### CLI Tool (`@reaatech/agent-runbook-cli`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLI Tool                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              agent-runbook-generator CLI                      │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│    │
│  │  │ Analyze   │  │ Generate  │  │ Validate  │  │ Export    ││    │
│  │  │ Command   │  │ Command   │  │ Command   │  │ Command   ││    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘│    │
│  │  ┌───────────┐                                              │    │
│  │  │ Serve     │                                              │    │
│  │  │ Command   │                                              │    │
│  │  └───────────┘                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Usage:                                                              │
│  - agent-runbook-generator analyze <repo-path>                      │
│  - agent-runbook-generator generate <repo-path> --output <file>     │
│  - agent-runbook-generator validate <runbook-path> --ci             │
│  - agent-runbook-generator export <runbook-path> --format html       │
│  - agent-runbook-generator serve --port 3000                        │
└─────────────────────────────────────────────────────────────────────┘
```

### MCP Server (`@reaatech/agent-runbook-mcp`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MCP Server                                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              agent-runbook-generator MCP Server               │    │
│  │  ┌───────────────────────────────────────────────────────┐  │    │
│  │  │                  MCP Tools (16)                         │  │    │
│  │  │                                                       │  │    │
│  │  │  runbook.analyze.*     runbook.generate.*    runbook.validate.*
│  │  │  - repository          - full               - completeness    │  │
│  │  │  - dependencies        - alerts             - accuracy        │  │
│  │  │  - failure_modes       - dashboard          - links           │  │
│  │  │  - alerts              - rollback           - ci              │  │
│  │  │  - health_checks       - incident_workflow                     │  │
│  │  │                        - service_map                            │  │
│  │  │                        - health_checks                          │  │
│  │  └───────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Transport: Stdio (default), configurable                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Docker

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Container Deployment                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │            agent-runbook-generator Container                  │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                │    │
│  │  │ App       │  │ OTel      │  │ Secrets   │                │    │
│  │  │ Container │  │ Sidecar   │  │ Mounted   │                │    │
│  │  └───────────┘  └───────────┘  └───────────┘                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Config:                                                             │
│  - Min instances: 0 (scale to zero)                                 │
│  - Max instances: 5 (configurable)                                  │
│  - Memory: 1GB, CPU: 1 vCPU                                         │
│  - Timeout: 300s (for large repos)                                  │
│                                                                      │
│  CMD: node packages/cli/dist/cli.js serve --port 3000               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Repository not found | Git clone error, path not found | Return detailed error, suggest fixes |
| Unsupported language | No analyzer plugin found | Use generic analysis, log warning |
| LLM API error | Non-2xx response | Retry with backoff, use fallback provider |
| Timeout | Request exceeds timeout | Return partial results, log warning |
| Invalid configuration | Schema validation error | Return validation errors, suggest fixes |
| Memory exhaustion | OOM error | Process repository in chunks |
| Rate limit exceeded | API rate limit response | Exponential backoff, queue requests |

---

## Toolchain

| Tool | Purpose |
|------|---------|
| pnpm 10 | Package manager with workspace protocol |
| turbo | Monorepo build orchestrator |
| tsup | Per-package dual ESM/CJS build |
| biome | Linting + formatting |
| changesets | Version management + CHANGELOG generation |
| vitest | Per-package testing |

### Development Commands

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

## References

- **AGENTS.md** — Agent development guide and conventions
- **README.md** — Quick start and package overview
- **skills/** — Skill definitions for agent capabilities
- **MCP Specification** — https://modelcontextprotocol.io/
