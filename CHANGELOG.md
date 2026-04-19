# CHANGELOG.md

## [1.0.0] - 2026-04-16

### Added
- Initial release of agent-runbook-generator
- Three-layer MCP tool architecture (analyze, generate, validate)
- CLI tool with commands: analyze, generate, validate, export, serve
- Repository analyzer for TypeScript, Python, Go, and more
- Alert generator with SLO-based threshold calculation
- Dashboard generator for Grafana, CloudWatch, and Looker
- Failure mode analyzer with mitigation strategies
- Rollback procedure generator for Kubernetes, ECS, Cloud Run
- Incident response workflow generator
- Service dependency mapper with Mermaid diagram support
- Health check generator for Kubernetes probes
- LLM agent integration with Claude, GPT-4, and Gemini support
- MCP server with StreamableHTTP transport
- OpenTelemetry observability (tracing, metrics, logging)
- CI/CD workflows for GitHub Actions
- Docker containerization
- Comprehensive test suite with vitest
- Documentation: README.md, CLAUDE.md, AGENTS.md, ARCHITECTURE.md, WALKTHROUGH.md, CONTRIBUTING.md

### Architecture
- Three-layer architecture:
  - Layer 1: runbook.analyze.* (Atomic Operations)
  - Layer 2: runbook.generate.* (Orchestrated Runs)
  - Layer 3: runbook.validate.* (CI Gates)
- Provider-agnostic LLM integration
- Repository-agnostic analysis engine
- CI-native design with proper exit codes
- No PII in output guarantee

### MCP Tools
- **Analysis Tools (Layer 1):**
  - runbook.analyze.repository
  - runbook.analyze.dependencies
  - runbook.analyze.failure_modes
  - runbook.analyze.alerts
  - runbook.analyze.health_checks
- **Generation Tools (Layer 2):**
  - runbook.generate.full
  - runbook.generate.alerts
  - runbook.generate.dashboard
  - runbook.generate.rollback
  - runbook.generate.incident_workflow
  - runbook.generate.service_map
  - runbook.generate.health_checks
- **Validation Tools (Layer 3):**
  - runbook.validate.completeness
  - runbook.validate.accuracy
  - runbook.validate.links
  - runbook.validate.ci

### Technical Details
- TypeScript with strict mode
- ESM modules with NodeNext resolution
- Vitest for testing with 80% coverage threshold
- ESLint flat config with typescript-eslint
- Prettier for code formatting
- Husky + lint-staged for pre-commit hooks
- OpenTelemetry for observability
- Pino for structured JSON logging
