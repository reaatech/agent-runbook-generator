# agent-runbook-generator

[![CI](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

> Automated runbook generation for agent incident response. CLI tool, library, and MCP server that ingests a service repository and produces a complete operator runbook — alerts, dashboards, failure modes, rollback steps, incident response workflows, health checks, and service dependency maps.

This monorepo provides the canonical A2A reference types, server framework, client SDK, and MCP bridge, plus supporting infrastructure for AI-powered DevOps and SRE workflows.

## Features

- **Repository analysis** — Scans service repos to detect language, framework, deployment platform, entry points, and dependencies
- **Alert generation** — Extracts existing alerts and generates SLO-based, resource, and application alerts for Prometheus, Datadog, and CloudWatch
- **Dashboard generation** — Creates complete Grafana and CloudWatch dashboard configurations with auto-identified metrics
- **Failure mode analysis** — Identifies potential failure points, single points of failure, and generates mitigation strategies
- **Rollback procedures** — Generates step-by-step rollback procedures with pre-checks and verification steps
- **Incident response** — Generates SEV1-SEV4 workflows with escalation matrices and communication templates
- **Health checks** — Generates Kubernetes liveness, readiness, and startup probes with load balancer configs
- **Service dependency mapping** — Builds dependency graphs with critical path analysis, exportable to Mermaid, DOT, JSON, and YAML
- **AI agent integration** — Multi-provider LLM support (Claude, OpenAI, Gemini) for intelligent code analysis
- **MCP server** — 16 MCP tools across 3 layers consumable by Claude Code, Cursor, and other MCP clients
- **Observability** — Structured logging (Pino), distributed tracing (OpenTelemetry), and Prometheus-compatible metrics

## Installation

### Using the packages

Packages are published under the `@reaatech` scope and can be installed individually:

```bash
# Core types, schemas, and utilities
pnpm add @reaatech/agent-runbook

# Repository analysis (scanner, config parser, code analyzer, dependency mapper)
pnpm add @reaatech/agent-runbook-analyzer

# Alert extraction and generation
pnpm add @reaatech/agent-runbook-alerts

# Dashboard configuration generation
pnpm add @reaatech/agent-runbook-dashboards

# Failure mode analysis and mitigation generation
pnpm add @reaatech/agent-runbook-failure-modes

# Health check generation (Kubernetes probes, load balancer configs)
pnpm add @reaatech/agent-runbook-health-checks

# Incident response workflows and communication templates
pnpm add @reaatech/agent-runbook-incident

# Rollback procedure generation with verification steps
pnpm add @reaatech/agent-runbook-rollback

# Runbook assembly, formatting, and orchestration pipeline
pnpm add @reaatech/agent-runbook-runbook

# Service dependency mapping and graph generation
pnpm add @reaatech/agent-runbook-service-map

# AI agent layer (LLM provider abstraction, prompt templates)
pnpm add @reaatech/agent-runbook-agent

# MCP server (Model Context Protocol tool registry)
pnpm add @reaatech/agent-runbook-mcp @modelcontextprotocol/sdk

# Observability (logging, tracing, metrics)
pnpm add @reaatech/agent-runbook-observability

# CLI and orchestrator (includes all of the above)
pnpm add -g @reaatech/agent-runbook-cli
```

### Contributing

```bash
git clone https://github.com/reaatech/agent-runbook-generator.git
cd agent-runbook-generator

pnpm install
pnpm build
pnpm test
pnpm lint
```

## Quick Start

Generate a runbook for any service repository:

```bash
# Use the mock provider (no API key needed)
agent-runbook-generator generate . --output runbook.md --provider mock

# Use Claude for intelligent analysis
agent-runbook-generator generate . --output runbook.md --provider claude --model claude-opus-4-5

# Analyze a repository
agent-runbook-generator analyze . --json

# Validate a generated runbook
agent-runbook-generator validate runbook.md --ci

# Start the MCP server for agent integration
agent-runbook-generator serve --port 3000
```

Programmatic usage:

```typescript
import { generateRunbook } from "@reaatech/agent-runbook-cli";

const runbook = await generateRunbook({
  path: "/path/to/service-repo",
  output: "runbook.md",
  format: "markdown",
  provider: "claude",
  model: "claude-opus-4-5-20260506",
});
```

## Packages

| Package | Description |
| ------- | ----------- |
| [`@reaatech/agent-runbook`](./packages/core) | Core types, Zod schemas, and utilities |
| [`@reaatech/agent-runbook-analyzer`](./packages/analyzer) | Repository scanning and code analysis |
| [`@reaatech/agent-runbook-alerts`](./packages/alerts) | Alert extraction and generation |
| [`@reaatech/agent-runbook-dashboards`](./packages/dashboards) | Dashboard configuration generation |
| [`@reaatech/agent-runbook-failure-modes`](./packages/failure-modes) | Failure mode analysis |
| [`@reaatech/agent-runbook-health-checks`](./packages/health-checks) | Health check generation |
| [`@reaatech/agent-runbook-incident`](./packages/incident) | Incident response workflows |
| [`@reaatech/agent-runbook-rollback`](./packages/rollback) | Rollback procedure generation |
| [`@reaatech/agent-runbook-runbook`](./packages/runbook) | Runbook assembly, formatting, and pipeline |
| [`@reaatech/agent-runbook-service-map`](./packages/service-map) | Service dependency mapping |
| [`@reaatech/agent-runbook-agent`](./packages/agent) | AI agent layer (LLM provider abstraction) |
| [`@reaatech/agent-runbook-mcp`](./packages/mcp) | MCP server (16 tools across 3 layers) |
| [`@reaatech/agent-runbook-observability`](./packages/observability) | Logging, tracing, and metrics |
| [`@reaatech/agent-runbook-cli`](./packages/cli) | CLI and orchestrator |

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System design, three-layer architecture, data flows
- [`AGENTS.md`](./AGENTS.md) — Coding conventions and agent development guide
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Contribution workflow and release process
- [`skills/`](./skills/) — Agent skill definitions for specialized tasks
- [`examples/`](./examples/) — Example runbook output and configuration files

## License

[MIT](LICENSE)
