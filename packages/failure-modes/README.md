# @reaatech/agent-runbook-failure-modes

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-failure-modes.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-failure-modes)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Failure mode analysis for the Agent Runbook Generator. Identifies potential failure points from code patterns, categorizes them by type and severity, and generates actionable mitigation strategies.

## Installation

```bash
npm install @reaatech/agent-runbook-failure-modes
# or
pnpm add @reaatech/agent-runbook-failure-modes
```

## Feature Overview

- **Failure identification** — detects single points of failure, resource bottlenecks, and dependency risks
- **10 failure categories** — dependency, resource, application, network, security, infrastructure, database, cache, queue, external
- **Built-in failure catalog** — pre-cataloged common failure modes with detection and mitigation strategies
- **Risk scoring** — 0–10 score with contributing factors for prioritization
- **Mitigation generation** — circuit breaker configs, retry policies, timeout settings, monitoring changes
- **Code-level suggestions** — identifies specific files and patterns that need hardening

## Quick Start

```typescript
import { identifyFailureModes, generateMitigations, getAllFailureModes } from "@reaatech/agent-runbook-failure-modes";

const analysis = identifyFailureModes("/path/to/repo", analysisContext);
// { failureModes: [...], singlePointsOfFailure: [...], riskScore: 6.5 }

const plans = generateMitigations(analysis.failureModes, analysisContext);
// [{ failureMode: {...}, immediateActions: [...], codeChanges: [...] }]

const catalog = getAllFailureModes();
```

## API Reference

### Failure Identifier

| Function | Signature |
|----------|-----------|
| `identifyFailureModes` | `(repoPath: string, context: AnalysisContext) => FailureAnalysis` |
| `getCommonFailureModes` | `(serviceType: string) => FailureMode[]` |

### Failure Catalog

| Function | Signature |
|----------|-----------|
| `getFailureModesByCategory` | `(category: string) => FailureMode[]` |
| `getAllFailureModes` | `() => FailureMode[]` |
| `findFailureMode` | `(name: string) => FailureMode \| undefined` |
| `getDetectionStrategies` | `(failureMode: FailureMode) => string[]` |
| `getMitigationStrategies` | `(failureMode: FailureMode) => string[]` |

### Mitigation Generator

| Function | Signature |
|----------|-----------|
| `generateMitigations` | `(failureModes: FailureMode[], context: AnalysisContext) => MitigationPlan[]` |
| `suggestCircuitBreakerConfig` | `(serviceName: string) => { threshold: number; timeout: number; resetTimeout: number }` |
| `suggestRetryConfig` | `(serviceName: string) => { maxRetries: number; baseDelay: number; maxDelay: number; factor: number }` |
| `suggestTimeoutConfig` | `(serviceName: string) => { connect: number; request: number; idle: number }` |

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-health-checks](https://www.npmjs.com/package/@reaatech/agent-runbook-health-checks) — Health check generation
- [@reaatech/agent-runbook-rollback](https://www.npmjs.com/package/@reaatech/agent-runbook-rollback) — Rollback procedures

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
