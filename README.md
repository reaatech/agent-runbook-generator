# agent-runbook-generator

Generate operator runbooks from service repositories using AI.

## Quick Start

```bash
# Install
npm install -g agent-runbook-generator

# Generate a runbook
agent-runbook-generator generate /path/to/service --output runbook.md

# Validate a runbook
agent-runbook-generator validate runbook.md --ci
```

## Features

- **Automated Analysis**: Scans your repository to understand language, framework, and architecture
- **AI-Powered Generation**: Uses LLMs to generate comprehensive runbook content
- **Multi-Format Export**: Export to Markdown, HTML, PDF-style HTML, or JSON
- **MCP Server**: Expose tools via Model Context Protocol for AI agents
- **CI/CD Integration**: Validate runbooks in your pipeline

## Three-Layer Architecture

### Layer 1: Analysis Tools (`runbook.analyze.*`)
- `runbook.analyze.repository` — Analyze repository structure
- `runbook.analyze.dependencies` — Map service dependencies
- `runbook.analyze.failure_modes` — Identify failure modes
- `runbook.analyze.alerts` — Extract alert definitions
- `runbook.analyze.health_checks` — Analyze health checks

### Layer 2: Generation Tools (`runbook.generate.*`)
- `runbook.generate.full` — Generate complete runbook
- `runbook.generate.alerts` — Generate alert definitions
- `runbook.generate.dashboard` — Generate dashboard configs
- `runbook.generate.rollback` — Generate rollback procedures
- `runbook.generate.incident_workflow` — Generate incident response
- `runbook.generate.service_map` — Generate dependency graphs
- `runbook.generate.health_checks` — Generate health check definitions

### Layer 3: Validation Tools (`runbook.validate.*`)
- `runbook.validate.completeness` — Check runbook completeness
- `runbook.validate.accuracy` — Validate accuracy against codebase
- `runbook.validate.links` — Verify cross-references
- `runbook.validate.ci` — CI-style validation gate

## CLI Commands

```bash
# Analyze a repository
agent-runbook-generator analyze <path> [options]

# Generate a runbook
agent-runbook-generator generate <path> [options]

# Validate a runbook
agent-runbook-generator validate <path> [options]

# Export to different formats
agent-runbook-generator export <input> [options]

# Start MCP server
agent-runbook-generator serve [options]
```

## Configuration

Create a `runbook-config.yaml` file:

```yaml
service:
  name: my-service
  team: platform-engineering
  repository: https://github.com/reaatech/my-service

generation:
  provider: claude
  sections:
    - alerts
    - dashboards
    - failure-modes
    - rollback
    - incident-response
    - health-checks
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | LLM provider (claude, openai, gemini, mock) |
| `LLM_API_KEY` | API key for LLM provider |
| `LLM_MODEL` | Specific model to use |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint |

## MCP Server

Start the MCP server:

```bash
agent-runbook-generator serve
```

The MCP server communicates via the Model Context Protocol over stdio.
`--host` and `--port` are accepted for forward compatibility, but this release
uses stdio transport only.

> **Note:** All 16 MCP tools are available. Generation and validation tools perform
> real repository/runbook analysis, and the validation layer now checks
> completeness, accuracy against repository context, and broken links.

## CI/CD Integration

```yaml
# .github/workflows/runbook.yml
name: Runbook Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx agent-runbook-generator generate . --output runbook.md
      - run: npx agent-runbook-generator validate runbook.md --ci
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error |
| 2 | Warning |
| 3 | Validation failed (CI gate) |

## License

MIT
