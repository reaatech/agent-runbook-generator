# @reaatech/agent-runbook-incident

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-incident.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-incident)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

Incident response workflows and communication templates for the Agent Runbook Generator. Generates SEV1–SEV4 incident response procedures with escalation matrices and ready-to-use communication templates.

## Installation

```bash
npm install @reaatech/agent-runbook-incident
# or
pnpm add @reaatech/agent-runbook-incident
```

## Feature Overview

- **SEV1–SEV4 workflows** — severity-based incident response procedures with response times and triggers
- **Escalation policies** — configurable escalation matrices with contact info, channels, and repeat policies
- **Pre-built templates** — 20+ communication templates across 5 categories (notification, update, resolution, postmortem, handoff)
- **Template variables** — dynamic substitution for service name, severity, incident ID, and timestamps
- **Custom templates** — programmatic creation of new communication templates

## Quick Start

```typescript
import { generateIncidentWorkflows, generateEscalationPolicy, getTemplatesByCategory } from "@reaatech/agent-runbook-incident";

const workflows = generateIncidentWorkflows(analysisContext, {
  serviceName: "my-api",
  teamName: "platform-engineering",
  escalationContacts: ["oncall@example.com", "manager@example.com"],
});

const policy = generateEscalationPolicy({
  serviceName: "my-api",
  teamName: "platform-engineering",
});

const templates = getTemplatesByCategory("incident-notification");
```

## API Reference

### Workflow Generator

| Function | Signature |
|----------|-----------|
| `generateIncidentWorkflows` | `(context: AnalysisContext, config: WorkflowConfig) => IncidentWorkflow[]` |
| `generateEscalationPolicy` | `(config: WorkflowConfig) => EscalationPolicy` |
| `generateStandardWorkflow` | `(context: AnalysisContext, config: WorkflowConfig) => IncidentWorkflow` |

**`WorkflowConfig`**: `{ serviceName: string; teamName: string; severityLevels?: string[]; escalationContacts?: string[] }`

### Communication Templates

| Function | Signature |
|----------|-----------|
| `getTemplatesByCategory` | `(categoryId: string) => CommunicationTemplate[]` |
| `getTemplateByName` | `(name: string) => CommunicationTemplate \| undefined` |
| `applyTemplateVariables` | `(template: CommunicationTemplate, variables: Record<string, string>) => CommunicationTemplate` |
| `createTemplate` | `(name: string, type: CommunicationTemplate['type'], subject: string, body: string) => CommunicationTemplate` |

Template categories: `incident-notification`, `status-updates`, `resolution`, `postmortem`, `handoff`.

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-rollback](https://www.npmjs.com/package/@reaatech/agent-runbook-rollback) — Rollback procedures
- [@reaatech/agent-runbook-cli](https://www.npmjs.com/package/@reaatech/agent-runbook-cli) — CLI and orchestrator

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
