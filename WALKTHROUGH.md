# WALKTHROUGH.md — End-to-End Walkthrough

## Complete Workflow: Install → Analyze → Generate → Export

### Step 1: Install

```bash
# Clone or navigate to a project
cd agent-runbook-generator

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 2: Analyze a Repository

```bash
# Analyze any service repository
npx agent-runbook-generator analyze /path/to/your/service

# Example output:
# Service Type: web-api
# Language: typescript
# Framework: express
# Dependencies: express, pg, redis
```

### Step 3: Generate a Runbook

```bash
# Generate a complete runbook
npx agent-runbook-generator generate /path/to/your/service --output runbook.md

# With specific sections
npx agent-runbook-generator generate /path/to/your/service \
  --output runbook.md \
  --sections alerts,failure-modes,rollback

# With JSON output
npx agent-runbook-generator generate /path/to/your/service --json > runbook.json
```

### Step 4: Validate the Runbook

```bash
# Validate completeness
npx agent-runbook-generator validate runbook.md

# In CI mode (exits with code 3 on failure)
npx agent-runbook-generator validate runbook.md --ci

# With custom thresholds
npx agent-runbook-generator validate runbook.md \
  --completeness-threshold 0.9 \
  --ci
```

### Step 5: Export to Different Formats

```bash
# Export to HTML
npx agent-runbook-generator export runbook.md --format html --output runbook.html

# Export to PDF (requires additional dependencies)
npx agent-runbook-generator export runbook.md --format pdf --output runbook.pdf

# Export to JSON
npx agent-runbook-generator export runbook.md --format json --output runbook.json
```

### Step 6: Start MCP Server

```bash
# Start the MCP server
npx agent-runbook-generator serve --port 3000

# With OpenTelemetry
npx agent-runbook-generator serve \
  --port 3000 \
  --otel-endpoint http://localhost:4318
```

## Using as a Library

```typescript
import { generateRunbook, formatRunbook } from 'agent-runbook-generator';

async function main() {
  // Generate runbook
  const runbook = await generateRunbook({
    path: '/path/to/service',
    provider: 'mock',
    sections: ['alerts', 'failure-modes', 'rollback'],
  });

  // Format to markdown
  const markdown = formatRunbook(runbook, 'markdown');
  console.log(markdown);

  // Format to JSON
  const json = formatRunbook(runbook, 'json');
  console.log(json);
}

main();
```

## CI/CD Integration

```yaml
# .github/workflows/runbook.yml
name: Runbook Validation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate runbook
        run: npx agent-runbook-generator generate . --output runbook.md

      - name: Validate runbook
        run: npx agent-runbook-generator validate runbook.md --ci
```

## Docker Usage

```bash
# Build Docker image
docker build -t agent-runbook-generator .

# Run with volume mount
docker run -v /path/to/repos:/repos agent-runbook-generator \
  generate /repos/my-service --output /repos/runbook.md

# Run MCP server
docker run -p 3000:3000 agent-runbook-generator serve
```

## Environment Configuration

```bash
# .env file
LLM_PROVIDER=claude
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-opus-4-5-20260506
LOG_LEVEL=info
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
