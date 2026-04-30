# @reaatech/agent-runbook-alerts

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-alerts.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-alerts)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Alert extraction and generation for the Agent Runbook Generator. Extracts existing alert definitions from monitoring configs and generates new SLO-based, resource, and application alerts for Prometheus, Datadog, and CloudWatch.

## Installation

```bash
npm install @reaatech/agent-runbook-alerts
# or
pnpm add @reaatech/agent-runbook-alerts
```

## Feature Overview

- **Alert extraction** — finds existing alert rules in Prometheus, Datadog, and CloudWatch configs
- **SLO-based alerts** — generates burn rate alerts from availability and latency targets
- **Resource alerts** — CPU, memory, and disk saturation alerts with dynamic thresholds
- **Application alerts** — error rate, request rate, and dependency failure alerts
- **Multi-platform formatting** — output compatible with Prometheus, Datadog, and CloudWatch
- **Default alerts** — sensible defaults for services with common dependency patterns

## Quick Start

```typescript
import { extractAlerts, generateAlerts, calculateSloThresholds } from "@reaatech/agent-runbook-alerts";

const existing = extractAlerts("/path/to/repo");

const alerts = generateAlerts(analysisContext, {
  sloTargets: { availability: 99.9, latencyP99: 500 },
  platform: "prometheus",
});

const thresholds = calculateSloThresholds({
  availability: 99.9,
  latencyP99: 500,
});
```

## API Reference

### Alert Extractor

| Function | Signature |
|----------|-----------|
| `extractAlerts` | `(repoPath: string) => ExtractedAlerts` |
| `generateDefaultAlerts` | `(serviceName: string, hasDatabase: boolean, hasCache: boolean, hasQueue: boolean) => AlertDefinition[]` |

### Alert Generator

| Function | Signature |
|----------|-----------|
| `generateAlerts` | `(context: AnalysisContext, config?: AlertGenerationConfig) => AlertDefinition[]` |
| `formatAlertsForPlatform` | `(alerts: AlertDefinition[], platform: 'prometheus' \| 'datadog' \| 'cloudwatch') => string` |

### Threshold Calculator

| Function | Signature |
|----------|-----------|
| `calculateSloThresholds` | `(sloTargets: SLOTargets) => ThresholdRecommendation[]` |
| `calculateResourceThresholds` | `() => ThresholdRecommendation[]` |
| `calculateBurnRateThresholds` | `(sloTargets: SLOTargets) => ThresholdRecommendation[]` |
| `getDefaultThresholds` | `() => ThresholdConfig[]` |
| `calculateDynamicThreshold` | `(values: number[], multiplier?: number) => number` |

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-dashboards](https://www.npmjs.com/package/@reaatech/agent-runbook-dashboards) — Dashboard generation
- [@reaatech/agent-runbook-cli](https://www.npmjs.com/package/@reaatech/agent-runbook-cli) — CLI and orchestrator

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
