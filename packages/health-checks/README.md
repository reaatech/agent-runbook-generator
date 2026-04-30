# @reaatech/agent-runbook-health-checks

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-health-checks.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-health-checks)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Health check generation for the Agent Runbook Generator. Identifies existing health checks and generates liveness, readiness, and startup probe definitions for Kubernetes and load balancers.

## Installation

```bash
npm install @reaatech/agent-runbook-health-checks
# or
pnpm add @reaatech/agent-runbook-health-checks
```

## Feature Overview

- **Check identification** — finds existing health check endpoints and patterns in the codebase
- **Service-type suggestions** — suggests appropriate health checks based on detected service type
- **Kubernetes probes** — generates liveness, readiness, and startup probe YAML
- **Load balancer configs** — generates target group health check configuration
- **Endpoint generation** — generates health check endpoint implementations in the target language

## Quick Start

```typescript
import { identifyHealthChecks, generateHealthChecks, generateKubernetesProbeYaml } from "@reaatech/agent-runbook-health-checks";

const existing = identifyHealthChecks("/path/to/repo", analysisContext);

const checks = generateHealthChecks("/path/to/repo", analysisContext, {
  platform: "kubernetes",
  serviceName: "my-api",
  port: 3000,
});

console.log(generateKubernetesProbeYaml(checks, "my-container", 3000));
```

## API Reference

### Check Identifier

| Function | Signature |
|----------|-----------|
| `identifyHealthChecks` | `(repoPath: string, context: AnalysisContext) => HealthCheck[]` |
| `suggestHealthChecks` | `(serviceType: string) => HealthCheck[]` |

### Check Generator

| Function | Signature |
|----------|-----------|
| `generateHealthChecks` | `(repoPath: string, context: AnalysisContext, config: HealthCheckConfig) => HealthCheck[]` |
| `generateKubernetesProbeYaml` | `(checks: HealthCheck[], containerName?: string, port?: number) => string` |
| `generateLoadBalancerConfig` | `(checks: HealthCheck[]) => string` |
| `generateHealthCheckEndpoint` | `(checks: HealthCheck[], language: string) => string` |

**`HealthCheckConfig`**: `{ platform: string; serviceName: string; port?: number; path?: string }`

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-failure-modes](https://www.npmjs.com/package/@reaatech/agent-runbook-failure-modes) — Failure mode analysis
- [@reaatech/agent-runbook-rollback](https://www.npmjs.com/package/@reaatech/agent-runbook-rollback) — Rollback verification steps

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
