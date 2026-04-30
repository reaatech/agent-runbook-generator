# @reaatech/agent-runbook-cli

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-cli.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

CLI and orchestrator for the Agent Runbook Generator. The primary entry point for generating operator runbooks from service repositories using AI analysis, plus a convenience barrel that re-exports all public APIs from the `@reaatech/agent-runbook-*` ecosystem.

## Installation

```bash
npm install -g @reaatech/agent-runbook-cli
# or
pnpm add @reaatech/agent-runbook-cli
```

## Feature Overview

- **5 CLI commands** — `analyze`, `generate`, `validate`, `export`, `serve`
- **Multi-provider LLM support** — Claude, OpenAI, Gemini, or mock (no-API) mode
- **Multi-format output** — Markdown, HTML
- **MCP server mode** — `serve` command starts the MCP server for AI agent integration
- **Convenience barrel** — re-exports all public APIs from the 13 other `@reaatech/agent-runbook-*` packages
- **CI integration** — validation gate with configurable thresholds for CI/CD pipelines

## CLI Usage

### Analyze

```bash
agent-runbook-generator analyze /path/to/repo
agent-runbook-generator analyze /path/to/repo --json --depth 5
```

Scans a repository and outputs analysis in human-readable or JSON format.

### Generate

```bash
agent-runbook-generator generate /path/to/repo --output runbook.md
agent-runbook-generator generate /path/to/repo --output runbook.md --provider claude --model claude-opus-4-5
agent-runbook-generator generate /path/to/repo --output runbook.md --provider mock
```

Generates a complete operator runbook with configurable sections and provider.

### Validate

```bash
agent-runbook-generator validate runbook.md
agent-runbook-generator validate runbook.md --ci --completeness-threshold 0.8
```

Validates a runbook for completeness, accuracy, and cross-references. `--ci` flag enables JSON output with exit codes for pipeline use.

### Export

```bash
agent-runbook-generator export runbook.md --format html --output runbook.html
```

Converts a runbook between formats (Markdown, HTML, PDF).

### Serve

```bash
agent-runbook-generator serve --port 3000
```

Starts the MCP server for integration with AI coding agents.

## Programmatic API

```typescript
import { generateRunbook } from "@reaatech/agent-runbook-cli";

const runbook = await generateRunbook({
  path: "/path/to/repo",
  output: "runbook.md",
  format: "markdown",
  provider: "claude",
  model: "claude-opus-4-5-20260506",
  sections: ["alerts", "dashboards", "failure-modes", "rollback", "incident-response"],
});
```

This package re-exports all public APIs from the following packages as a convenience: `@reaatech/agent-runbook` (core types + utils), `@reaatech/agent-runbook-analyzer`, `@reaatech/agent-runbook-alerts`, `@reaatech/agent-runbook-dashboards`, `@reaatech/agent-runbook-failure-modes`, `@reaatech/agent-runbook-health-checks`, `@reaatech/agent-runbook-incident`, `@reaatech/agent-runbook-rollback`, `@reaatech/agent-runbook-runbook`, `@reaatech/agent-runbook-service-map`, `@reaatech/agent-runbook-agent`, `@reaatech/agent-runbook-mcp`, `@reaatech/agent-runbook-observability`.

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-mcp](https://www.npmjs.com/package/@reaatech/agent-runbook-mcp) — MCP server (used by `serve` command)
- [@reaatech/agent-runbook-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook-runbook) — Runbook assembly pipeline

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
