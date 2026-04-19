# agent-runbook-generator — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │     CLI     │    │   Library   │    │  MCP Client │                  │
│  │   (npx)     │    │  (import)   │    │  (Agent)    │                  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                  │
│         │                   │                   │                         │
│         └───────────────────┼───────────────────┘                         │
│                             │                                               │
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
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Analysis Engine                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Repository  │  │   Config    │  │    Code     │  │ Dependency  │    │
│  │  Scanner    │  │   Parser    │  │  Analyzer   │  │   Mapper    │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                 │                │                │           │
│         └─────────────────┼────────────────┼────────────────┘           │
│                           ▼                                            │
│                  ┌─────────────────┐                                    │
│                  │     LLM Agent   │                                    │
│                  │  (Analysis &    │                                    │
│                  │   Generation)   │                                    │
│                  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Runbook Generators                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Alerts    │  │  Dashboards │  │  Failure    │  │  Rollback   │    │
│  │  Generator  │  │  Generator  │  │   Modes     │  │  Generator  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                 │                │                │           │
│         └─────────────────┼────────────────┼────────────────┘           │
│                           ▼                                            │
│                  ┌─────────────────┐                                    │
│                  │   Runbook       │                                    │
│                  │   Assembler     │                                    │
│                  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Cross-Cutting Concerns                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │   Observability  │  │  Configuration   │  │    Templates     │       │
│  │  - Tracing (OTel)│  │  - YAML parsing  │  │  - Markdown      │       │
│  │  - Metrics (OTel)│  │  - Env vars      │  │  - HTML          │       │
│  │  - Logging (pino)│  │  - Validation    │  │  - PDF           │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Three-Layer Architecture
- **runbook.analyze.*** — Atomic analysis operations for repository scanning
- **runbook.generate.*** — Orchestrated generation for complete runbooks
- **runbook.validate.*** — CI-style validation gates for runbook quality

### 2. Provider-Agnostic
- Any LLM provider can be used for analysis and generation (Claude, GPT-4, Gemini)
- Unified interface for all providers
- Provider-specific optimizations are encapsulated

### 3. Repository-Agnostic
- Supports any codebase structure (Node.js, Python, Go, Java, etc.)
- Extensible analyzer plugins for language-specific parsing
- Works with local directories or remote repositories

### 4. No PII in Output
- Never include secrets, API keys, or PII in generated runbooks
- Automatic redaction of sensitive information
- Safe for sharing and version control

### 5. CI-Native Design
- Exit codes suitable for automation
- Validation gates for CI/CD pipelines
- Reproducible generation for consistency

---

## Component Deep Dive

### Three-Layer MCP Tool Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│               Layer 1: runbook.analyze.* (Analysis)                  │
│                                                                      │
│  Atomic operations for repository and service analysis               │
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
│  │ Extract/generate│    │ Generate health │                         │
│  │ alert definitions│   │ check definitions│                        │
│  └─────────────────┘    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│             Layer 2: runbook.generate.* (Generation)                 │
│                                                                      │
│  Orchestrated operations for complete runbook generation             │
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
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                Layer 3: runbook.validate.* (CI Gates)                │
│                                                                      │
│  Opinionated validation operations for CI/CD                         │
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

### Repository Analyzer

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
│  Output: AnalysisContext { service_type, config_files, entry_points,│
│                           dependencies, external_services }         │
└─────────────────────────────────────────────────────────────────────┘
```

### Alert Generator

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
│  Output: AlertDefinition[] { name, condition, threshold, severity,  │
│                              escalation, runbook_link }             │
└─────────────────────────────────────────────────────────────────────┘
```

### Failure Mode Analyzer

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
│  Output: FailureMode[] { name, detection, mitigation, escalation,   │
│                          runbook_section }                          │
└─────────────────────────────────────────────────────────────────────┘
```

### LLM Agent for Analysis

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LLM Analysis Agent                            │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │     Analysis    │    │    Prompt       │    │    Provider     │  │
│  │     Agent       │    │   Templates     │    │    Adapter      │  │
│  │                 │    │                 │    │                 │  │
│  │ - LLM-powered   │    │ - Repository    │    │ - Support       │  │
│  │   repository    │    │   analysis      │    │   Claude,       │  │
│  │   analysis      │    │ - Runbook       │    │   GPT-4,        │  │
│  │ - Generate      │    │   generation    │    │   Gemini        │  │
│  │   insights      │    │ - Failure mode  │    │ - Handle        │  │
│  │   from code     │    │   identification│    │   provider-     │  │
│  │ - Suggest       │    │ - Rollback      │    │   specific      │  │
│  │   improvements  │    │   procedure     │    │   formatting    │  │
│  │   based on      │    │   generation    │    │ - Fallback      │  │
│  │   best practices│    │                 │    │   between       │  │
│  │                 │    │                 │    │   providers     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  Output: AnalysisInsights { findings, suggestions, generated_content}
└─────────────────────────────────────────────────────────────────────┘
```

### Runbook Assembler

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Runbook Assembler                              │
│                                                                      │
│  Input: AnalysisContext + GeneratedSections                         │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │     Builder     │    │    Formatter    │    │    Templates    │  │
│  │                 │    │                 │    │                 │  │
│  │ - Assemble all  │    │ - Generate      │    │ - Standard SRE  │  │
│  │   sections into │    │   Markdown      │    │   template      │  │
│  │   complete      │    │ - Generate HTML │    │ - Incident      │  │
│  │   runbook       │    │ - Generate PDF  │    │   response      │  │
│  │ - Generate      │    │ - Support       │    │   template      │  │
│  │   table of      │    │   custom        │    │ - On-call       │  │
│  │   contents      │    │   templates     │    │   handoff       │  │
│  │ - Create cross- │    │                 │    │   template      │  │
│  │   references    │    │                 │    │                 │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  Output: Runbook { title, sections, toc, cross_references, format } │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Complete Runbook Generation Flow

```
1. Load repository (local path or clone from URL)
        │
2. Scan repository structure:
   - Detect language and framework
   - Identify key configuration files
   - Map directory structure
        │
3. Parse configurations:
   - Extract environment variables
   - Parse infrastructure-as-code
   - Identify deployment configuration
        │
4. Analyze code:
   - Identify entry points
   - Extract API endpoints
   - Detect external service connections
        │
5. Map dependencies:
   - Parse package manifests
   - Identify upstream/downstream services
   - Generate dependency graph
        │
6. Run LLM agent analysis:
   - Generate insights from code patterns
   - Identify failure modes
   - Suggest improvements
        │
7. Generate runbook sections:
   - Alert definitions
   - Dashboard configurations
   - Failure modes and mitigations
   - Rollback procedures
   - Incident response workflows
   - Health check definitions
        │
8. Assemble runbook:
   - Combine all sections
   - Generate table of contents
   - Create cross-references
   - Apply formatting
        │
9. Validate runbook:
   - Check completeness
   - Verify accuracy
   - Validate links
        │
10. Export runbook:
    - Markdown format
    - HTML format (optional)
    - PDF format (optional)
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
│ - Never include secrets in generated output                         │
│ - Redact sensitive information from analysis                        │
│ - Never log raw repository content                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 3: LLM API                                                     │
│ - All LLM API keys from environment variables                       │
│ - Never log API keys or tokens                                      │
│ - Separate keys per provider for isolation                          │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 4: Output Security                                             │
│ - Validate generated content for sensitive data                     │
│ - Sanitize Markdown/HTML output                                     │
│ - Safe for version control (no secrets)                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Secret Detection

The generator automatically detects and redacts:
- API keys and tokens
- Database connection strings with passwords
- Private keys and certificates
- Personal identifiable information (PII)
- Internal URLs and IP addresses

### Repository Access

- **Local repositories**: Direct file system access with read permissions
- **Remote repositories**: Clone via HTTPS with optional authentication
- **GitHub integration**: Optional OAuth or token-based access
- **Read-only by default**: Never modify source repositories

---

## Observability

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
| `runbook.generate.total` | Counter | `status` | Total generation runs |
| `runbook.analyze.duration_ms` | Histogram | `component` | Analysis duration |
| `runbook.sections.generated` | Counter | `section_type` | Sections generated |
| `runbook.agent.calls` | Counter | `provider`, `status` | LLM agent API calls |
| `runbook.agent.cost` | Histogram | `provider` | Agent cost tracking |
| `runbook.validate.completeness` | Gauge | `service` | Completeness score |

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

### CLI Tool

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLI Tool                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  agent-runbook-generator CLI                  │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                │    │
│  │  │ Analyze   │  │ Generate  │  │ Validate  │                │    │
│  │  │ Command   │  │ Command   │  │ Command   │                │    │
│  │  └───────────┘  └───────────┘  └───────────┘                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Usage:                                                              │
│  - npx agent-runbook-generator analyze <repo-path>                  │
│  - npx agent-runbook-generator generate <repo-path> --output <dir>  │
│  - npx agent-runbook-generator validate <runbook-path>              │
│  - npx agent-runbook-generator serve --port 3000                    │
└─────────────────────────────────────────────────────────────────────┘
```

### MCP Server

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MCP Server                                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              agent-runbook-generator MCP Server               │    │
│  │  ┌───────────────────────────────────────────────────────┐  │    │
│  │  │                  MCP Tools                             │  │    │
│  │  │                                                       │  │    │
│  │  │  runbook.analyze.*     runbook.generate.*    runbook.validate.*
│  │  │  - repository          - full               - completeness    │  │
│  │  │  - dependencies        - alerts             - accuracy        │  │
│  │  │  - failure_modes       - dashboard          - links           │  │
│  │  │  - alerts              - rollback           - ci              │  │
│  │  │  - health_checks       - incident_workflow                     │  │
│  │  │                        - service_map                            │  │
│  │  └───────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Transport: StreamableHTTP on port 3000 (configurable)              │
└─────────────────────────────────────────────────────────────────────┘
```

### Docker

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Cloud Run                                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │               agent-runbook-generator Container               │    │
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
│  Secrets: Secret Manager → mounted as env vars                       │
│  Observability: OTel → Cloud Monitoring / Datadog                    │
│  Storage: GCS for generated runbooks                                │
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

## References

- **AGENTS.md** — Agent development guide
- **DEV_PLAN.md** — Development checklist
- **README.md** — Quick start and overview
- **skills/** — Skill definitions for agent capabilities
- **MCP Specification** — https://modelcontextprotocol.io/
