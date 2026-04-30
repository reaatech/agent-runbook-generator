# @reaatech/agent-runbook-agent

[![npm version](https://img.shields.io/npm/v/@reaatech/agent-runbook-agent.svg)](https://www.npmjs.com/package/@reaatech/agent-runbook-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/agent-runbook-generator/ci.yml?branch=main&label=CI)](https://github.com/reaatech/agent-runbook-generator/actions/workflows/ci.yml)

AI agent layer for the Agent Runbook Generator. Provides LLM provider abstraction for Anthropic Claude, OpenAI, and Google Gemini, plus configurable prompt templates for automated code analysis and runbook generation.

## Installation

```bash
npm install @reaatech/agent-runbook-agent
# or
pnpm add @reaatech/agent-runbook-agent
```

## Feature Overview

- **Multi-provider support** — Anthropic Claude, OpenAI (GPT), and Google Gemini with unified interface
- **Provider adapter** — automatic model formatting and response parsing per provider
- **Configurable prompts** — pre-built templates for 8 analysis and generation tasks
- **Custom prompts** — programmatic creation of custom prompt templates
- **Cost and performance** — supports temperature, max_tokens, and rate limit configuration
- **Dynamic SDK loading** — provider SDKs loaded on demand to minimize bundle size

## Quick Start

```typescript
import { createAnalysisAgent, generatePrompt } from "@reaatech/agent-runbook-agent";

const agent = createAnalysisAgent({
  provider: "claude",
  model: "claude-opus-4-5",
  apiKey: process.env.ANTHROPIC_API_KEY,
  temperature: 0.3,
});

const insights = await agent.analyzeRepository(analysisContext);
const failureModes = await agent.identifyFailureModes(analysisContext);
const section = await agent.generateRunbookSection("alerts", analysisContext);
```

## API Reference

### Analysis Agent

| Export | Kind | Description |
|--------|------|-------------|
| `AnalysisAgent` | class | LLM-powered repository analysis. Creates an agent for analyzing code patterns, identifying failure modes, and generating runbook sections. |
| `createAnalysisAgent` | function | `(config?: Partial<AgentConfig>) => AnalysisAgent` — factory with sensible defaults |

**`AgentConfig`**: `{ provider: string; model?: string; apiKey?: string; baseUrl?: string; temperature?: number; maxTokens?: number }`

#### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `analyzeRepository(context)` | `Promise<AnalysisInsight[]>` | Analyze repository patterns for insights |
| `identifyFailureModes(context)` | `Promise<string[]>` | Identify potential failure modes |
| `generateRunbookSection(sectionType, context)` | `Promise<string>` | Generate a runbook section |

### Provider Adapter

| Export | Kind | Description |
|--------|------|-------------|
| `ProviderAdapter` | class | Handles prompt formatting and response parsing for each LLM provider |
| `createProviderAdapter` | function | `(config: AgentConfig) => ProviderAdapter` — factory |

#### Instance Methods

| Method | Description |
|--------|-------------|
| `formatMessages(system, user)` | Format messages for the target provider |
| `formatForClaude(system, user)` | Anthropic-specific message formatting |
| `formatForOpenAI(system, user)` | OpenAI-specific message formatting |
| `formatForGemini(system, user)` | Gemini-specific message formatting |
| `parseResponse(provider, raw)` | Parse raw provider response into `AgentResponse` |
| `getFallbackProvider()` | Get fallback provider if primary fails |
| `supportsStreaming()` | Check if provider supports streaming |
| `getRateLimits()` | Get provider rate limits |

### Prompt Templates

| Function | Signature |
|----------|-----------|
| `generatePrompt` | `(type: PromptType, variables: Partial<PromptVariables>) => string` |
| `getPromptTemplate` | `(type: PromptType) => PromptTemplate` |
| `getSystemPrompt` | `(type: PromptType) => string` |
| `createPromptTemplate` | `(type: PromptType, systemPrompt: string, userPrompt: string) => PromptTemplate` |

**Prompt types**: `repository-analysis`, `failure-mode-identification`, `runbook-alerts`, `runbook-dashboards`, `runbook-failure-modes`, `runbook-rollback`, `runbook-incident-response`, `runbook-health-checks`.

## Related Packages

- [@reaatech/agent-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook) — Core types and utilities
- [@reaatech/agent-runbook-observability](https://www.npmjs.com/package/@reaatech/agent-runbook-observability) — Logging, tracing, metrics
- [@reaatech/agent-runbook-runbook](https://www.npmjs.com/package/@reaatech/agent-runbook-runbook) — Runbook assembly pipeline

## License

[MIT](https://github.com/reaatech/agent-runbook-generator/blob/main/LICENSE)
