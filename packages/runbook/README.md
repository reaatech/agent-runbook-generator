# @reaatech/agent-runbook-runbook

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-runbook.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-runbook)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Runbook assembly, formatting, and orchestration pipeline for the Agent Runbook Generator. Combines all analysis results into a complete operator runbook with table of contents, cross-references, and multiple output formats.

## Installation

```bash
npm install @reaatech/agent-runbook-runbook
# or
pnpm add @reaatech/agent-runbook-runbook
```

## Feature Overview

- **Runbook assembly** — combines alerts, dashboards, failure modes, rollback procedures, incident workflows, health checks, and service maps into a single structured runbook
- **Pipeline orchestration** — end-to-end generation pipeline from repository scan through LLM analysis to formatted output
- **Table of contents** — auto-generated TOC with anchor links for all sections and subsections
- **Templating** — pre-built runbook section templates with configurable content and ordering
- **Multi-format export** — Markdown, HTML, and PDF output with consistent formatting
- **Validation** — completeness, accuracy, and cross-reference validation with CI-grade scoring

## Quick Start

```typescript
import {
  buildRunbook,
  generateRunbookArtifacts,
  exportRunbook,
  validateCompleteness,
} from "@reaatech/agent-runbook-runbook";

const { runbook, sections } = await generateRunbookArtifacts({
  path: "/path/to/repo",
  sections: ["alerts", "dashboards", "failure-modes", "rollback", "incident-response", "health-checks", "service-map"],
});

const markdown = exportRunbook(runbook, "markdown");

const result = validateCompleteness(runbook);
// { score: 0.92, missingSections: [], suggestions: [...] }
```

## API Reference

### Runbook Builder

| Function | Signature |
|----------|-----------|
| `buildRunbook` | `(analysisContext: AnalysisContext) => Runbook` |
| `generateTOC` | `(sections: RunbookSection[]) => TocEntry[]` |
| `validateCompleteness` | `(runbook: Runbook) => CompletenessResult` |

### Formatter

| Function | Signature |
|----------|-----------|
| `exportRunbook` | `(runbook: Runbook, format: ExportFormat) => string` |
| `formatAsMarkdown` | `(runbook: Runbook) => string` |
| `formatAsHTML` | `(runbook: Runbook) => string` |
| `formatAsPDF` | `(runbook: Runbook) => string` |

### Templates

| Function | Signature |
|----------|-----------|
| `getTemplateById` | `(id: string) => RunbookSectionTemplate \| undefined` |
| `getAllTemplates` | `() => RunbookSectionTemplate[]` |
| `applyTemplate` | `(template: RunbookSectionTemplate, context: AnalysisContext) => RunbookSection` |

### Pipeline

| Function | Signature |
|----------|-----------|
| `generateRunbookArtifacts` | `(options: PipelineOptions) => Promise<{ runbook: Runbook; sections: string[] }>` |
| `parseRunbookDocument` | `(content: string, format: ExportFormat) => Runbook` |
| `parseMarkdownRunbook` | `(content: string) => Runbook` |
| `validateRunbookAccuracy` | `(runbook: Runbook, context: AnalysisContext) => AccuracyResult` |
| `validateRunbookLinks` | `(runbook: Runbook) => LinkValidationResult` |
| `createCiValidationResult` | `(runbook: Runbook, thresholds: ValidationThresholds) => ValidationResult` |

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-analyzer](https://www.npmjs.com/package/@reaatech/agent-runbook-analyzer) — Repository analysis
- [@reaatech/agent-runbook-agent](https://www.npmjs.com/package/@reaatech/agent-runbook-agent) — AI agent for LLM-powered analysis
- [@reaatech/agent-runbook-cli](https://www.npmjs.com/package/@reaatech/agent-runbook-cli) — CLI and orchestrator

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
