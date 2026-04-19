# CLAUDE.md — Development Guide

## Project Structure

```
src/
├── index.ts              # Library entry point
├── cli.ts                # CLI entry point
├── types/                # Core domain types
├── analyzer/             # Repository analysis engine
├── alerts/               # Alert definition generation
├── dashboards/           # Dashboard config generation
├── failure-modes/        # Failure mode analysis
├── rollback/             # Rollback procedure generation
├── runbook/              # Runbook assembly and formatting
├── incident/             # Incident response workflows
├── service-map/          # Service dependency mapping
├── health-checks/        # Health check generation
├── agent/                # LLM agent for analysis
├── mcp-server/           # MCP server implementation
├── observability/        # OTel, logging
└── utils/                # Shared utilities

tests/
├── unit/                 # Unit tests
└── integration/          # Integration tests

skills/
└── */skill.md            # Agent skill definitions
```

## Adding New Runbook Sections

1. Create a new generator in `src/<section>/`:
   - `<section>-generator.ts` — Main generation logic
   - `<section>-identifier.ts` — Identification/extraction logic
   - `index.ts` — Barrel export

2. Add section type to `src/types/domain.ts`:
   ```typescript
   export type RunbookSectionType = 
     | 'overview'
     | 'alerts'
     | 'dashboards'
     | 'failure-modes'
     | 'rollback'
     | 'incident-response'
     | 'health-checks'
     | 'service-map'
     | 'your-new-section'; // Add here
   ```

3. Register in `src/runbook/runbook-builder.ts`:
   ```typescript
   case 'your-new-section':
     sections.push(generateYourNewSection(repoPath, context));
     break;
   ```

## Adding New Agent Prompts

1. Add prompt template in `src/agent/prompt-templates.ts`:
   ```typescript
   const YOUR_NEW_TEMPLATE: PromptTemplate = {
     type: 'your-new-prompt',
     systemPrompt: 'You are an expert in...',
     userPrompt: 'Analyze the following...',
   };
   ```

2. Export in `getPromptTemplate()` switch statement.

## Adding New MCP Tools

1. Add tool definition in appropriate file:
   - `src/mcp-server/tools/analyze/index.ts` for analysis tools
   - `src/mcp-server/tools/generate/index.ts` for generation tools
   - `src/mcp-server/tools/validate/index.ts` for validation tools

2. Implement tool handler in `src/mcp-server/mcp-server.ts`

## Testing Patterns

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('MyModule', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toEqual(expected);
  });
});
```

### Integration Tests
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Integration', () => {
  beforeAll(() => {
    // Setup test fixtures
  });

  afterAll(() => {
    // Cleanup
  });

  it('should work end-to-end', async () => {
    const result = await generateRunbook({ path: testPath });
    expect(result).toBeDefined();
  });
});
```

## Key Invariants

1. **Provider-agnostic** — Any LLM provider can be used
2. **No PII in output** — Never include secrets or PII
3. **CI compatibility** — Exit codes suitable for automation
4. **Reproducibility** — Same inputs produce same outputs

## Commands

```bash
npm run dev          # Development mode
npm run build        # Build for production
npm run test         # Run tests
npm run test:ci      # Run tests in CI mode
npm run lint         # Run linter
npm run typecheck    # Type check
npm run format       # Format code
