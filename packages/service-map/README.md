# @reaatech/agent-runbook-service-map

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-service-map.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-service-map)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Service dependency mapping for the Agent Runbook Generator. Analyzes inter-service dependencies and generates dependency graphs with critical path analysis, exportable to Mermaid, DOT, JSON, and YAML.

## Installation

```bash
npm install @reaatech/agent-runbook-service-map
# or
pnpm add @reaatech/agent-runbook-service-map
```

## Feature Overview

- **Dependency analysis** — identifies upstream, downstream, and external service dependencies
- **Graph generation** — builds directed graphs with nodes, edges, and protocol annotations
- **Critical path analysis** — identifies the most critical service chains by risk level
- **Multi-format export** — Mermaid (Markdown), DOT (Graphviz), JSON, and YAML outputs
- **Visual summaries** — human-readable service map summaries for runbook inclusion

## Quick Start

```typescript
import { analyzeDependencies, generateServiceMap, exportGraph } from "@reaatech/agent-runbook-service-map";

const deps = analyzeDependencies("/path/to/repo", analysisContext);

const map = generateServiceMap(deps, "my-service", analysisContext);

console.log(exportGraph(map, { format: "mermaid" }));
console.log(exportGraph(map, { format: "dot" }));
```

## API Reference

### Dependency Analyzer

| Function | Signature |
|----------|-----------|
| `analyzeDependencies` | `(repoPath: string, context: AnalysisContext) => ServiceDependency[]` |
| `generateDependencyGraph` | `(dependencies: ServiceDependency[], serviceName: string) => DependencyGraph` |
| `generateMermaidDiagram` | `(graph: DependencyGraph) => string` |

### Graph Generator

| Function | Signature |
|----------|-----------|
| `generateServiceMap` | `(dependencies: ServiceDependency[], serviceName: string, context: AnalysisContext) => DependencyGraph` |
| `exportToMermaid` | `(graph: DependencyGraph) => string` |
| `exportToDot` | `(graph: DependencyGraph) => string` |
| `exportToJson` | `(graph: DependencyGraph) => string` |
| `exportToYaml` | `(graph: DependencyGraph) => string` |
| `exportGraph` | `(graph: DependencyGraph, options: GraphExportOptions) => string` |
| `generateServiceMapSummary` | `(graph: DependencyGraph) => string` |

**`GraphExportOptions`**: `{ format: "mermaid" | "dot" | "json" | "yaml"; includeMetadata?: boolean }`

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-analyzer](https://www.npmjs.com/package/@reaatech/agent-runbook-analyzer) — Repository analysis
- [@reaatech/agent-runbook-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook-runbook) — Runbook assembly pipeline

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
