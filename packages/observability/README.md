# @reaatech/agent-runbook-observability

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-observability.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-observability)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Observability layer for the Agent Runbook Generator. Provides structured logging via Pino, distributed tracing via OpenTelemetry, and Prometheus-compatible metrics for generation tracking, agent cost monitoring, and runbook quality measurement.

## Installation

```bash
npm install @reaatech/agent-runbook-observability
# or
pnpm add @reaatech/agent-runbook-observability
```

## Feature Overview

- **Structured logging** — Pino-based logger with child loggers, run IDs, and sensitive data redaction
- **Distributed tracing** — OpenTelemetry spans for repository analysis, agent calls, section generation, and validation
- **Generation metrics** — runbook generation count, section generation count, agent API call tracking
- **Cost tracking** — LLM cost recording with provider attribution for budget monitoring
- **Quality metrics** — runbook completeness scoring with per-service tracking
- **OTLP export** — metrics and traces exported to any OpenTelemetry Collector endpoint

## Quick Start

```typescript
import {
  initLogger,
  initTracing,
  initMetrics,
  info,
  startGenerationSpan,
  endSpanSuccess,
  recordGeneration,
} from "@reaatech/agent-runbook-observability";

await initLogger({ level: "info", service: "agent-runbook-generator" });
initTracing({ serviceName: "agent-runbook-generator", otlpEndpoint: "http://localhost:4318", enabled: true });
initMetrics({ serviceName: "agent-runbook-generator", enabled: true });

const span = startGenerationSpan("runner", "/path/to/repo");
// ... generate runbook ...
endSpanSuccess(span);
recordGeneration("success");
```

## API Reference

### Logger

| Function | Signature |
|----------|-----------|
| `initLogger` | `(config: LoggerConfig) => Promise<void>` |
| `getLogger` | `() => Logger` |
| `getCurrentRunId` | `() => string \| null` |
| `setRunId` | `(runId: string) => void` |
| `createChildLogger` | `(context: Record<string, unknown>) => Logger` |
| `redactSensitiveData` | `(data: Record<string, unknown>) => Record<string, unknown>` |
| `info` | `(message: string, meta?: Record<string, unknown>) => void` |
| `warn` | `(message: string, meta?: Record<string, unknown>) => void` |
| `error` | `(message: string, meta?: Record<string, unknown> \| Error) => void` |
| `debug` | `(message: string, meta?: Record<string, unknown>) => void` |

**`LoggerConfig`**: `{ level: string; service: string; runId?: string; stderr?: boolean }`

### Tracing

| Function | Signature |
|----------|-----------|
| `initTracing` | `(config: TracingConfig) => void` |
| `getTracer` | `() => Tracer` |
| `startGenerationSpan` | `(serviceName: string, repoPath: string) => Span` |
| `startAnalysisSpan` | `(language: string, fileCount: number, configFiles: string[]) => Span` |
| `startCodeAnalysisSpan` | `(entryPoints: string[], endpoints: string[], externalServices: string[]) => Span` |
| `startAgentSpan` | `(provider: string, model: string, tokens: number) => Span` |
| `startSectionSpan` | `(sectionType: string) => Span` |
| `startValidationSpan` | `(completenessScore: number, accuracyScore: number) => Span` |
| `endSpanSuccess` | `(span: Span) => void` |
| `endSpanError` | `(span: Span, error: Error) => void` |
| `shutdownTracing` | `() => Promise<void>` |

**`TracingConfig`**: `{ serviceName: string; otlpEndpoint?: string; enabled: boolean }`

### Metrics

| Function | Signature |
|----------|-----------|
| `initMetrics` | `(config: MetricsConfig) => void` |
| `recordGeneration` | `(status: 'success' \| 'failure' \| 'warning') => void` |
| `recordSectionGenerated` | `(sectionType: string) => void` |
| `recordAgentCall` | `(provider: string, status: 'success' \| 'failure') => void` |
| `recordAnalysisDuration` | `(component: string, durationMs: number) => void` |
| `recordAgentCost` | `(provider: string, cost: number) => void` |
| `recordCompleteness` | `(service: string, score: number) => void` |
| `shutdownMetrics` | `() => Promise<void>` |

**`MetricsConfig`**: `{ serviceName: string; otlpEndpoint?: string; enabled: boolean }`

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-agent](https://www.npmjs.com/package/@reaatech/agent-runbook-agent) — AI agent (uses observability for LLM cost tracking)

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
