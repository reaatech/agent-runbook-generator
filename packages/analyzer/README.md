# @reaatech/agent-runbook-analyzer

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-analyzer.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Repository analysis for the Agent Runbook Generator. Scans service repositories to detect language, framework, deployment platform, configuration files, entry points, API endpoints, external service connections, and package dependencies.

## Installation

```bash
npm install @reaatech/agent-runbook-analyzer
# or
pnpm add @reaatech/agent-runbook-analyzer
```

## Feature Overview

- **Language & framework detection** — recognizes Node.js, Python, Go, Java, Ruby, and Rust with framework identification
- **Deployment platform detection** — identifies Kubernetes, ECS, Cloud Run, Lambda, App Engine, and more
- **Configuration parsing** — extracts environment variables, infrastructure configs, and monitoring setup
- **Code analysis** — finds entry points, API routes, background jobs, and external service connections
- **Dependency mapping** — parses package manifests and categorizes dependencies by type
- **Auto-ignores common patterns** — respects `.gitignore` rules during file scanning

## Quick Start

```typescript
import { scanRepository, mapDependencies, parseConfigs, analyzeCode } from "@reaatech/agent-runbook-analyzer";

const analysis = await scanRepository("/path/to/repo");
// { serviceType: "web-api", language: "typescript", framework: "express", ... }

const deps = mapDependencies("/path/to/repo");
// { directDeps: [...], transitiveDeps: [...], externalServices: [...] }

const configs = parseConfigs("/path/to/repo");
// { environmentVariables: [...], infrastructure: {...}, deployment: {...} }

const code = analyzeCode("/path/to/repo", "typescript", "express");
// { entryPoints: [...], apiEndpoints: [...], externalConnections: [...] }
```

## API Reference

### Repository Scanner

| Function | Signature |
|----------|-----------|
| `scanRepository` | `(repoPath: string, options?: ScanOptions) => Promise<RepositoryAnalysis>` |
| `detectDeploymentPlatform` | `(files: string[], repoPath: string) => DeploymentPlatform` |

**`ScanOptions`**: `{ depth?: number; includePatterns?: string[]; excludePatterns?: string[]; maxFiles?: number }`

### Dependency Mapper

| Function | Signature |
|----------|-----------|
| `mapDependencies` | `(repoPath: string, includeDev?: boolean) => DependencyAnalysis` |

### Config Parser

| Function | Signature |
|----------|-----------|
| `parseConfigs` | `(repoPath: string) => ParsedConfig` |

**`ParsedConfig`**: `{ environmentVariables: EnvironmentVariable[]; infrastructure: InfrastructureConfig; deployment: DeploymentConfig; monitoring: MonitoringConfig }`

### Code Analyzer

| Function | Signature |
|----------|-----------|
| `analyzeCode` | `(repoPath: string, language: ProgrammingLanguage, framework: Framework) => CodeAnalysis` |

**`CodeAnalysis`**: `{ entryPoints: CodeEntryPoint[]; apiEndpoints: ApiEndpoint[]; externalConnections: ExternalConnection[]; backgroundJobs: BackgroundJob[] }`

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-service-map](https://www.npmjs.com/package/@reaatech/agent-runbook-service-map) — Service dependency graph generation
- [@reaatech/agent-runbook-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook-runbook) — Runbook assembly pipeline

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
