# Skill: Repository Analysis

## Capability

Repository analysis — the core skill that scans a service repository to understand
its structure, technology stack, configuration, and deployment patterns. This
analysis forms the foundation for all subsequent runbook generation.

## Package

**[@reaatech/agent-runbook-analyzer](../packages/analyzer)** — provides `scanRepository()`, `mapDependencies()`, `parseConfigs()`, and `analyzeCode()`.

## MCP Tools

| Tool | Input Schema | Output | Rate Limit |
|------|-------------|--------|------------|
| `runbook.analyze.repository` | `{ path: string, depth?: number, include_patterns?: string[], exclude_patterns?: string[] }` | `{ service_type, language, framework, structure, config_files, entry_points }` | 30 RPM |
| `runbook.analyze.dependencies` | `{ path: string, include_dev?: boolean }` | `{ direct_deps, transitive_deps, dependency_graph, external_services }` | 30 RPM |

## Usage Examples

### Example 1: Basic repository analysis

**User intent:** "Analyze this Node.js service repository"

**Tool call:**
```json
{
  "path": "/path/to/my-service",
  "depth": 3
}
```

**Expected response:**
```json
{
  "service_type": "web-api",
  "language": "typescript",
  "framework": "express",
  "structure": {
    "entry_point": "src/index.ts",
    "main_directories": ["src/routes", "src/middleware", "src/services"],
    "config_files": ["package.json", ".env.example", "Dockerfile"]
  },
  "entry_points": [
    { "file": "src/index.ts", "type": "http_server", "port": 3000 }
  ]
}
```

### Example 2: Dependency mapping

**Tool call:**
```json
{
  "path": "/path/to/my-service",
  "include_dev": false
}
```

**Expected response:**
```json
{
  "direct_deps": [
    { "name": "express", "version": "^4.18.0", "purpose": "web_framework" },
    { "name": "pg", "version": "^8.11.0", "purpose": "database_driver" },
    { "name": "redis", "version": "^4.6.0", "purpose": "cache_client" }
  ],
  "external_services": [
    { "type": "database", "name": "postgresql", "connection_env": "DATABASE_URL" },
    { "type": "cache", "name": "redis", "connection_env": "REDIS_URL" }
  ]
}
```

## Error Handling

### Known failure modes

| Error | Cause | Recovery |
|-------|-------|----------|
| `REPO_NOT_FOUND` | Path doesn't exist or can't be accessed | Return detailed error with path validation tips |
| `UNSUPPORTED_LANGUAGE` | No analyzer plugin for detected language | Use generic file-based analysis, log warning |
| `PERMISSION_DENIED` | Can't read directory or files | Suggest permission fixes |
| `SYMLINK_CYCLE` | Infinite symlink loop detected | Break cycle, continue with remaining files |
| `LARGE_REPOSITORY` | Too many files to analyze efficiently | Use sampling, analyze key directories only |

### Recovery strategies

1. **Partial analysis** — If full analysis fails, return partial results with
   confidence indicators showing which sections are complete.

2. **Fallback analysis** — If language-specific analysis fails, fall back to
   generic file structure analysis.

3. **Chunked processing** — For large repositories, process in chunks and
   aggregate results.

### Escalation paths

- **Consistent analysis failures** → Review analyzer plugins
- **High false-positive rate** → Tune detection patterns
- **Missing critical files** → Expand file patterns

## Security Considerations

### Repository Access

- **Read-only access** — Never modify source repositories
- **Validate paths** — Prevent directory traversal attacks
- **Respect .gitignore** — Don't analyze ignored files
- **No credential scanning** — Don't log or expose credentials found in code

### PII Handling

- **Never log file contents** — Only log file paths and metadata
- **Redact sensitive paths** — Hash paths containing PII
- **Sanitize output** — Remove any accidentally captured secrets

### Secret Detection

If secrets are detected during analysis:
1. Flag them in the output (don't include the actual secret)
2. Suggest remediation (move to environment variables, use secret manager)
3. Never include secrets in generated runbooks

## Performance Characteristics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Analysis latency (small repo) | < 5s | < 100 files |
| Analysis latency (medium repo) | < 30s | < 1000 files |
| Analysis latency (large repo) | < 120s | < 10000 files |
| Memory usage | < 500MB | Peak during analysis |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILES_ANALYZED` | `10000` | Maximum files to analyze before sampling |
| `ANALYSIS_DEPTH` | `5` | Maximum directory depth to analyze |
| `EXCLUDE_PATTERNS` | `node_modules,.git,dist,build` | Patterns to exclude from analysis |
| `ANALYZER_TIMEOUT_MS` | `60000` | Timeout for analysis operations |

## Testing

### Unit tests

```typescript
describe('runbook.analyze.repository', () => {
  it('should detect Node.js Express service', async () => {
    const result = await analyzeRepository({
      path: 'fixtures/nodejs-express',
      depth: 3,
    });

    expect(result.language).toBe('typescript');
    expect(result.framework).toBe('express');
    expect(result.entry_points).toHaveLength(1);
  });

  it('should detect Python Flask service', async () => {
    const result = await analyzeRepository({
      path: 'fixtures/python-flask',
    });

    expect(result.language).toBe('python');
    expect(result.framework).toBe('flask');
  });

  it('should handle empty repository', async () => {
    const result = await analyzeRepository({
      path: 'fixtures/empty',
    });

    expect(result.service_type).toBe('unknown');
    expect(result.entry_points).toHaveLength(0);
  });
});
```

### Integration tests

```typescript
describe('Repository analysis integration', () => {
  it('should analyze real-world repository structure', async () => {
    const result = await analyzeRepository({
      path: process.env.TEST_REPO_PATH,
      depth: 5,
    });

    // Verify all major components are detected
    expect(result.config_files).toContain('package.json');
    expect(result.entry_points.length).toBeGreaterThan(0);
    expect(result.language).toBeDefined();
  });

  it('should handle large repositories efficiently', async () => {
    const start = Date.now();
    const result = await analyzeRepository({
      path: 'fixtures/large-repo',
      maxFiles: 10000,
    });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(120000); // 2 minute timeout
    expect(result).toBeDefined();
  });
});
