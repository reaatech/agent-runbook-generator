import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  identifyHealthChecks,
  suggestHealthChecks,
} from '@reaatech/agent-runbook-health-checks';
import type { AnalysisContext } from '@reaatech/agent-runbook';

function makeContext(overrides: Partial<AnalysisContext> = {}): AnalysisContext {
  return {
    serviceDefinition: { name: 'test-service' },
    repositoryAnalysis: {
      serviceType: 'web-api',
      language: 'typescript',
      framework: 'express',
      structure: {
        mainDirectories: [],
        fileCount: 0,
        depth: 0,
        hasTests: false,
        hasDockerfile: false,
        hasKubernetesManifests: false,
        hasTerraform: false,
      },
      configFiles: [],
      entryPoints: [],
      externalServices: [],
    },
    dependencyAnalysis: {
      directDeps: [],
      transitiveDeps: [],
      dependencyGraph: [],
      externalServices: [],
    },
    deploymentPlatform: 'kubernetes',
    monitoringPlatform: 'prometheus',
    externalServices: [],
    ...overrides,
  };
}

describe('identifyHealthChecks', () => {
  let fixtureDir: string;

  beforeAll(() => {
    fixtureDir = path.join(os.tmpdir(), `check-ident-${Date.now()}`);
    fs.mkdirSync(fixtureDir);
    fs.writeFileSync(
      path.join(fixtureDir, 'server.ts'),
      "app.get('/health', (req, res) => res.json({ status: 'ok' }));",
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'ready.ts'),
      "app.get('/ready', (req, res) => res.json({ ready: true }));",
    );
  });

  afterAll(() => {
    fs.rmSync(fixtureDir, { recursive: true });
  });

  it('finds health check endpoints from Express routes', () => {
    const checks = identifyHealthChecks(fixtureDir, makeContext());
    const healthCheck = checks.find((c) => c.endpoint === '/health');
    expect(healthCheck).toBeDefined();
    expect(healthCheck!.type).toBe('liveness');
  });

  it('finds readiness endpoints', () => {
    const checks = identifyHealthChecks(fixtureDir, makeContext());
    const readyCheck = checks.find((c) => c.endpoint === '/ready');
    expect(readyCheck).toBeDefined();
    expect(readyCheck!.type).toBe('readiness');
  });

  it('adds recommended deep check', () => {
    const checks = identifyHealthChecks(fixtureDir, makeContext());
    const deep = checks.find((c) => c.endpoint === '/health/deep');
    expect(deep).toBeDefined();
    expect(deep!.type).toBe('deep');
  });

  it('adds database check when database is a dependency', () => {
    const checks = identifyHealthChecks(
      fixtureDir,
      makeContext({ externalServices: [{ type: 'database', name: 'postgres' }] }),
    );
    const dbCheck = checks.find((c) => c.endpoint === '/health/database');
    expect(dbCheck).toBeDefined();
  });

  it('adds cache check when cache is a dependency', () => {
    const checks = identifyHealthChecks(
      fixtureDir,
      makeContext({ externalServices: [{ type: 'cache', name: 'redis' }] }),
    );
    const cacheCheck = checks.find((c) => c.endpoint === '/health/cache');
    expect(cacheCheck).toBeDefined();
  });

  it('does not add database check without database dependency', () => {
    const checks = identifyHealthChecks(fixtureDir, makeContext());
    const dbCheck = checks.find((c) => c.endpoint === '/health/database');
    expect(dbCheck).toBeUndefined();
  });
});

describe('suggestHealthChecks', () => {
  it('suggests liveness and readiness for all service types', () => {
    const checks = suggestHealthChecks('generic');
    const types = checks.map((c) => c.type);
    expect(types).toContain('liveness');
    expect(types).toContain('readiness');
    expect(checks.length).toBeGreaterThanOrEqual(2);
  });

  it('suggests deep check for api services', () => {
    const checks = suggestHealthChecks('api');
    const endpoints = checks.map((c) => c.endpoint);
    expect(endpoints).toContain('/health/deep');
  });

  it('suggests deep check for web services', () => {
    const checks = suggestHealthChecks('web-api');
    const endpoints = checks.map((c) => c.endpoint);
    expect(endpoints).toContain('/health/deep');
  });

  it('suggests queue check for worker services', () => {
    const checks = suggestHealthChecks('worker');
    const endpoints = checks.map((c) => c.endpoint);
    expect(endpoints).toContain('/health/queue');
  });

  it('suggests queue check for queue services', () => {
    const checks = suggestHealthChecks('queue-processor');
    const endpoints = checks.map((c) => c.endpoint);
    expect(endpoints).toContain('/health/queue');
  });
});
