# @reaatech/agent-runbook-rollback

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-rollback.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-rollback)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Rollback procedure generation for the Agent Runbook Generator. Analyzes deployment configurations and generates step-by-step rollback procedures with pre-checks, commands, and verification steps.

## Installation

```bash
npm install @reaatech/agent-runbook-rollback
# or
pnpm add @reaatech/agent-runbook-rollback
```

## Feature Overview

- **Deployment analysis** — identifies deployment platform, strategy, replicas, and rollback capabilities
- **Platform-specific commands** — generates correct rollback commands for Kubernetes, ECS, Cloud Run, and more
- **Four rollback scenarios** — deployment failure, config error, performance degradation, data corruption
- **Pre-check validation** — environment state checks before initiating rollback
- **Verification plans** — health checks, smoke tests, data validation, and performance checks post-rollback
- **Automated scripts** — generates fully automated rollback scripts with error handling

## Quick Start

```typescript
import { analyzeDeployment, generateRollbackProcedures, generateVerificationSteps } from "@reaatech/agent-runbook-rollback";

const deployment = analyzeDeployment("/path/to/repo", analysisContext);

const procedures = generateRollbackProcedures(analysisContext, "kubernetes");
// { deploymentFailure: {...}, configurationError: {...}, ... }

const verification = generateVerificationSteps(analysisContext, "kubernetes");
```

## API Reference

### Deployment Analyzer

| Function | Signature |
|----------|-----------|
| `analyzeDeployment` | `(repoPath: string, context: AnalysisContext) => DeploymentAnalysis` |
| `getRollbackCommands` | `(platform: DeploymentPlatform, serviceName: string) => string[]` |

### Rollback Generator

| Function | Signature |
|----------|-----------|
| `generateRollbackProcedures` | `(context: AnalysisContext, platform: DeploymentPlatform) => RollbackScenarios` |

**`RollbackScenarios`**: `{ deploymentFailure: RollbackProcedure; configurationError: RollbackProcedure; performanceDegradation: RollbackProcedure; dataCorruption: RollbackProcedure }`

### Verification Generator

| Function | Signature |
|----------|-----------|
| `generateVerificationSteps` | `(context: AnalysisContext, platform: DeploymentPlatform) => VerificationPlan` |
| `generateVerificationChecklist` | `(context: AnalysisContext, platform: DeploymentPlatform) => string[]` |

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-incident](https://www.npmjs.com/package/@reaatech/agent-runbook-incident) — Incident response
- [@reaatech/agent-runbook-health-checks](https://www.npmjs.com/package/@reaatech/agent-runbook-health-checks) — Health check generation

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
