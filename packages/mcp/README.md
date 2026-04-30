# @reaatech/agent-runbook-mcp

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-mcp.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

MCP (Model Context Protocol) server for the Agent Runbook Generator. Exposes runbook analysis, generation, and validation capabilities as MCP tools consumable by AI coding agents like Claude Code, Cursor, and other MCP-compatible clients.

## Installation

```bash
npm install @reaatech/agent-runbook-mcp @modelcontextprotocol/sdk
# or
pnpm add @reaatech/agent-runbook-mcp @modelcontextprotocol/sdk
```

## Feature Overview

- **16 MCP tools** across 3 layers — analyze (5), generate (7), validate (4)
- **Stdio transport** — connects via standard I/O for seamless agent integration
- **Rate limiting** — configurable per-layer rate limits (30 RPM analyze/validate, 10 RPM generate)
- **Timeouts** — configurable per-layer timeouts (60s analyze/validate, 300s generate)
- **Tool registry** — each layer self-registers its tools with schema validation

## Quick Start

### As a Library

```typescript
import { RunbookMCPServer, createMCPServer } from "@reaatech/agent-runbook-mcp";

const server = await createMCPServer({
  name: "agent-runbook-generator",
  version: "1.0.0",
  rateLimitGenerate: 10,
  timeoutGenerate: 300000,
});

await server.start();
// Server now listens on stdio — ready for MCP clients
```

### As a CLI

```bash
npx agent-runbook-generator serve --port 3000
```

## API Reference

### Server

| Export | Kind | Description |
|--------|------|-------------|
| `RunbookMCPServer` | class | MCP server with tool registration and stdio transport |
| `createMCPServer` | function | `(config?: Partial<MCPServerConfig>) => Promise<RunbookMCPServer>` |

**`MCPServerConfig`**: `{ name: string; version: string; rateLimitAnalyze?: number; rateLimitGenerate?: number; rateLimitValidate?: number; timeoutAnalyze?: number; timeoutGenerate?: number; timeoutValidate?: number }`

### MCP Tools

#### Layer 1 — Analyze (5 tools)

| Tool Name | Description |
|-----------|-------------|
| `runbook.analyze.repository` | Scan repository structure, detect language, framework, entry points |
| `runbook.analyze.dependencies` | Map package dependencies and external services |
| `runbook.analyze.failure_modes` | Identify potential failure points and single points of failure |
| `runbook.analyze.alerts` | Extract existing alert definitions from monitoring configs |
| `runbook.analyze.health_checks` | Analyze existing health checks and identify gaps |

#### Layer 2 — Generate (7 tools)

| Tool Name | Description |
|-----------|-------------|
| `runbook.generate.full` | Generate a complete operator runbook with all sections |
| `runbook.generate.alerts` | Generate alert definitions with SLO and resource thresholds |
| `runbook.generate.dashboard` | Generate dashboard configuration for Grafana or CloudWatch |
| `runbook.generate.rollback` | Generate rollback procedures with verification steps |
| `runbook.generate.incident_workflow` | Generate incident response workflows and escalation matrices |
| `runbook.generate.service_map` | Generate service dependency graph with critical paths |
| `runbook.generate.health_checks` | Generate health check definitions with Kubernetes probes |

#### Layer 3 — Validate (4 tools)

| Tool Name | Description |
|-----------|-------------|
| `runbook.validate.completeness` | Check runbook for required sections and content |
| `runbook.validate.accuracy` | Validate runbook accuracy against the repository |
| `runbook.validate.links` | Verify all cross-references and links in the runbook |
| `runbook.validate.ci` | Run a CI-style validation gate with configurable thresholds |

### Tool Registration

| Function | Returns | Description |
|----------|---------|-------------|
| `registerAnalyzeTools` | `Tool[]` | Registers all 5 Layer 1 analysis tools |
| `registerGenerateTools` | `Tool[]` | Registers all 7 Layer 2 generation tools |
| `registerValidateTools` | `Tool[]` | Registers all 4 Layer 3 validation tools |

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-agent](https://www.npmjs.com/package/@reaatech/agent-runbook-agent) — AI agent for LLM-powered analysis
- [@reaatech/agent-runbook-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook-runbook) — Runbook assembly pipeline
- [@reaatech/agent-runbook-cli](https://www.npmjs.com/package/@reaatech/agent-runbook-cli) — CLI and orchestrator

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
