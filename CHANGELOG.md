# CHANGELOG.md

## [1.0.0] - 2026-04-26

### Fixed (pre-release)
- Fixed Docker healthcheck to not require package.json at runtime (inlined VERSION)
- Fixed LLM API key resolution to check provider-specific env vars (ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY) before falling back to LLM_API_KEY
- Separated MCPServer creation from transport start (createMCPServer no longer auto-starts)
- Replaced console.error in MCP server start/stop with structured logger
- Fixed Kubernetes probe YAML generator to accept configurable port instead of hardcoded 8080
- Implemented extractDownstreamServices to detect API gateway and client dependencies
- Replaced module-level completeness tracking with OTel ObservableGauge
- Stopped merging devDependencies into production dependency analysis (respects includeDev param)
- Removed duplicate parseInterval function; uses shared parseDuration from utils
- Clarified --format/--json behavior in CLI generate command
- Optimized validate command to use lightweight analysis instead of full generation pipeline
- Integrated ProviderAdapter into AnalysisAgent for response parsing and fallback logic
- Fixed Mermaid node shapes in dependency-analyzer
- Aligned MCP tools depth default with ScanRepositoryInputSchema (5 not 3)
- Added subpath exports for all modules in package.json

### Changed
- Upgraded ESLint from 8.57.1 to 9.x

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
