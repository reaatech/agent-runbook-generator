# @reaatech/agent-runbook-dashboards

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-dashboards.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-dashboards)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Dashboard configuration generation for the Agent Runbook Generator. Identifies relevant service metrics and generates complete dashboard configurations for Grafana and CloudWatch.

## Installation

```bash
npm install @reaatech/agent-runbook-dashboards
# or
pnpm add @reaatech/agent-runbook-dashboards
```

## Feature Overview

- **Metric identification** — scans code patterns to identify relevant service metrics
- **Service-type suggestions** — suggests appropriate metrics based on detected service type
- **Panel generation** — generates dashboard panels with queries, thresholds, and legends
- **Multi-platform output** — formats dashboards for Grafana JSON and CloudWatch
- **Widget templates** — pre-built widgets for common patterns (latency, error rate, saturation)

## Quick Start

```typescript
import { identifyMetrics, generateDashboard } from "@reaatech/agent-runbook-dashboards";

const metrics = identifyMetrics("/path/to/repo", analysisContext);

const dashboard = generateDashboard(analysisContext, {
  platform: "grafana",
  serviceName: "my-api",
  refreshInterval: "30s",
});
```

## API Reference

### Metric Identifier

| Function | Signature |
|----------|-----------|
| `identifyMetrics` | `(repoPath: string, context: AnalysisContext) => IdentifiedMetric[]` |
| `suggestMetricsForService` | `(serviceType: string, serviceName: string) => IdentifiedMetric[]` |

### Dashboard Generator

| Function | Signature |
|----------|-----------|
| `generateDashboard` | `(context: AnalysisContext, config: DashboardGenerationConfig) => DashboardConfig` |
| `formatDashboardForGrafana` | `(dashboard: DashboardConfig) => string` |
| `formatDashboardForCloudWatch` | `(dashboard: DashboardConfig) => string` |

**`DashboardGenerationConfig`**: `{ platform: string; serviceName: string; refreshInterval?: string; timeRange?: string }`

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-alerts](https://www.npmjs.com/package/@reaatech/agent-runbook-alerts) — Alert generation
- [@reaatech/agent-runbook-cli](https://www.npmjs.com/package/@reaatech/agent-runbook-cli) — CLI and orchestrator

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
