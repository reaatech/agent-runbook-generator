# @reaatech/agent-runbook

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Core types, Zod schemas, utilities, and error classes for the Agent Runbook Generator ecosystem. This package is the single source of truth for all domain types used throughout the `@reaatech/agent-runbook-*` monorepo.

## Installation

```bash
npm install @reaatech/agent-runbook
# or
pnpm add @reaatech/agent-runbook
```

## Feature Overview

- **68+ domain types** — `ServiceDefinition`, `Runbook`, `AlertDefinition`, `DashboardConfig`, `FailureMode`, `RollbackProcedure`, `IncidentWorkflow`, `ServiceDependency`, `HealthCheck`, and more
- **70+ Zod schemas** — runtime validation for every domain type, used at API boundaries and in the MCP server
- **25 utility functions** — file I/O, ID generation, markdown helpers, secret redaction, retry with exponential backoff, duration parsing
- **8 error classes** — `AppError`, `ValidationError`, `NotFoundError`, `AnalysisError`, `GenerationError`, `ConfigurationError`, `LLMError` with type guards and user-facing formatters
- **Zero runtime dependencies** beyond `zod` — lightweight and tree-shakeable
- **Dual ESM/CJS output** — works with `import` and `require`

## Quick Start

```typescript
import {
  type AnalysisContext,
  type Runbook,
  AlertSeverity,
  generateId,
  readFile,
  validateInput,
  AnalysisContextSchema,
} from "@reaatech/agent-runbook";

// Generate a unique runbook ID
const id = generateId("rb");

// Validate an analysis context at the boundary
const raw = JSON.parse(incomingJson);
const context = AnalysisContextSchema.parse(raw);

// Read a file with automatic error handling
const content = readFile("./some-file.json");
```

## API Reference

### Domain Types

| Export | Kind | Description |
|--------|------|-------------|
| `ServiceDefinition` | interface | Service metadata — name, team, repository, version |
| `AnalysisContext` | interface | Context passed between analysis and generation phases |
| `Runbook` | interface | Complete runbook with sections, metadata, and cross-references |
| `RunbookSection` | interface | Individual runbook section with content and subsections |
| `RunbookMetadata` | interface | Summary metadata about a generated runbook |
| `GenerationConfig` | interface | Configuration for the generation process |
| `AlertDefinition` | interface | Alert with name, type, severity, expression, annotations |
| `DashboardConfig` | interface | Dashboard with title, platform, panels, variables |
| `DashboardPanel` | interface | Dashboard panel with query, thresholds, legend |
| `FailureMode` | interface | Failure mode with category, severity, detection, mitigation |
| `RollbackProcedure` | interface | Rollback procedure with steps, checks, verification |
| `RollbackStep` | interface | Individual step with commands, timeout, automation |
| `VerificationStep` | interface | Post-rollback verification with success criteria |
| `IncidentWorkflow` | interface | Incident response workflow with severity, triggers, escalation |
| `EscalationPolicy` | interface | Escalation policy with levels, repeat policy |
| `CommunicationTemplate` | interface | Incident communication template with variables |
| `ServiceDependency` | interface | Service dependency with direction, protocol, criticality |
| `ServiceMap` | interface | Service map graph with nodes, edges, critical paths |
| `HealthCheck` | interface | Health check with endpoint, interval, timeout, criteria |

### Enum Types

| Type | Values |
|------|--------|
| `ServiceType` | `web-api`, `worker`, `lambda`, `function`, `unknown` |
| `ProgrammingLanguage` | `typescript`, `javascript`, `python`, `go`, `java`, `ruby`, `rust`, `unknown` |
| `Framework` | `express`, `fastify`, `koa`, `flask`, `django`, `fastapi`, `gin`, `echo`, `chi`, `spring`, `rails`, `none`, `unknown` |
| `DeploymentPlatform` | `kubernetes`, `ecs`, `cloud-run`, `lambda`, `app-engine`, `heroku`, `vm`, `unknown` |
| `MonitoringPlatform` | `prometheus`, `datadog`, `cloudwatch`, `grafana`, `new-relic`, `unknown` |
| `AlertSeverity` | `critical`, `warning`, `info` |
| `FailureCategory` | `dependency`, `resource`, `application`, `network`, `security`, `infrastructure`, `database`, `cache`, `queue`, `external` |
| `FailureSeverity` | `critical`, `high`, `medium`, `low` |
| `ExportFormat` | `markdown`, `html`, `pdf`, `json` |

### Utilities

| Function | Signature |
|----------|-----------|
| `generateId` | `(prefix?: string) => string` |
| `fileExists` | `(filePath: string) => boolean` |
| `directoryExists` | `(dirPath: string) => boolean` |
| `readFile` | `(filePath: string) => string \| undefined` |
| `readJsonFile` | `<T>(filePath: string) => T \| undefined` |
| `listFiles` | `(dirPath: string, recursive?: boolean) => string[]` |
| `writeFile` | `(filePath: string, content: string) => void` |
| `writeJsonFile` | `<T>(filePath: string, data: T) => void` |
| `ensureDirectory` | `(dirPath: string) => void` |
| `sanitizeAnchor` | `(text: string) => string` |
| `escapeMarkdown` | `(text: string) => string` |
| `truncate` | `(str: string, maxLength: number) => string` |
| `sleep` | `(ms: number) => Promise<void>` |
| `retry` | `<T>(fn: () => Promise<T>, maxAttempts?: number, baseDelay?: number) => Promise<T>` |
| `looksLikeSecret` | `(value: string) => boolean` |
| `redactSecrets` | `(text: string) => string` |
| `parseDuration` | `(duration: string) => number` |
| `formatDuration` | `(seconds: number) => string` |
| `simpleHash` | `(str: string) => number` |
| `groupBy` | `<T, K>(items: T[], keyFn: (item: T) => K) => Record<K, T[]>` |
| `flatten` | `<T>(arrays: T[][]) => T[]` |
| `unique` | `<T>(arr: T[]) => T[]` |
| `isPathWithinBase` | `(targetPath: string, basePath: string) => boolean` |
| `getRelativePath` | `(from: string, to: string) => string` |

### Validation

| Function | Signature |
|----------|-----------|
| `validateInput` | `<T>(schema: ZodSchema<T>, data: unknown) => InputValidationResult<T>` |
| `parseList` | `(value: unknown, separator?: string) => string[]` |
| `parseIntOptional` | `(value: unknown, defaultValue: number) => number` |
| `parseBool` | `(value: unknown, defaultValue?: boolean) => boolean` |

### Error Classes

| Class | Error Code | HTTP Status |
|-------|-----------|-------------|
| `AppError` | (custom) | 500 |
| `ValidationError` | `VALIDATION_ERROR` | 400 |
| `NotFoundError` | `NOT_FOUND` | 404 |
| `AnalysisError` | `ANALYSIS_ERROR` | 500 |
| `GenerationError` | `GENERATION_ERROR` | 500 |
| `ConfigurationError` | `CONFIGURATION_ERROR` | 500 |
| `LLMError` | `LLM_ERROR` | 500 |

Helper functions: `isAppError`, `getErrorMessage`, `getErrorStack`, `formatErrorForUser`.

## Related Packages

- [@reaatech/agent-runbook-analyzer](https://www.npmjs.com/package/@reaatech/agent-runbook-analyzer) — Repository scanning and analysis
- [@reaatech/agent-runbook-alerts](https://www.npmjs.com/package/@reaatech/agent-runbook-alerts) — Alert extraction and generation
- [@reaatech/agent-runbook-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook-runbook) — Runbook assembly pipeline
- [@reaatech/agent-runbook-cli](https://www.npmjs.com/package/@reaatech/agent-runbook-cli) — CLI and orchestrator

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
