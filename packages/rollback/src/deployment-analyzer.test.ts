import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  analyzeDeployment,
  getRollbackCommands,
} from '@reaatech/agent-runbook-rollback';
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

describe('getRollbackCommands', () => {
  it('returns kubectl commands for kubernetes', () => {
    const cmds = getRollbackCommands('kubernetes', 'my-app');
    expect(cmds).toContain('kubectl rollout undo deployment/my-app');
    expect(cmds).toContain('kubectl rollout status deployment/my-app');
    expect(cmds.length).toBe(3);
  });

  it('returns aws ecs commands for ecs', () => {
    const cmds = getRollbackCommands('ecs', 'my-app');
    expect(cmds[0]).toContain('aws ecs update-service');
    expect(cmds[0]).toContain('my-app');
  });

  it('returns gcloud commands for cloud-run', () => {
    const cmds = getRollbackCommands('cloud-run', 'my-app');
    expect(cmds[0]).toContain('gcloud run services update');
    expect(cmds[0]).toContain('my-app');
  });

  it('returns aws lambda commands for lambda', () => {
    const cmds = getRollbackCommands('lambda', 'my-app');
    expect(cmds[0]).toContain('aws lambda update-alias');
    expect(cmds[0]).toContain('my-app');
  });

  it('returns manual rollback for unknown platform', () => {
    const cmds = getRollbackCommands('unknown', 'my-app');
    expect(cmds[0]).toContain('Manual rollback');
  });
});

describe('analyzeDeployment', () => {
  let fixtureDir: string;

  beforeAll(() => {
    fixtureDir = path.join(os.tmpdir(), `deploy-analyzer-${Date.now()}`);
    fs.mkdirSync(fixtureDir);
    fs.writeFileSync(
      path.join(fixtureDir, 'k8s-deployment.yaml'),
      [
        'apiVersion: apps/v1',
        'kind: Deployment',
        'spec:',
        '  replicas: 3',
        '  strategy:',
        '    type: RollingUpdate',
        '  template:',
        '    spec:',
        '      containers:',
        '        - livenessProbe:',
        '            httpGet:',
        "              path: '/healthz'",
      ].join('\n'),
    );
    fs.writeFileSync(path.join(fixtureDir, 'deploy.sh'), '#!/bin/bash\necho deploy');
    fs.writeFileSync(path.join(fixtureDir, 'rollback.sh'), '#!/bin/bash\necho rollback');
  });

  afterAll(() => {
    fs.rmSync(fixtureDir, { recursive: true });
  });

  it('analyzes kubernetes deployment', () => {
    const result = analyzeDeployment(
      fixtureDir,
      makeContext({
        configParser: { deployment: { platform: 'kubernetes' } },
      }),
    );
    expect(result.platform).toBe('kubernetes');
    expect(result.deploymentConfig.replicas).toBe(3);
    expect(result.deploymentConfig.strategy).toBe('rolling');
    expect(result.deploymentConfig.healthCheckPath).toBe('/healthz');
  });

  it('returns capabilities for kubernetes platform', () => {
    const result = analyzeDeployment(
      fixtureDir,
      makeContext({
        configParser: { deployment: { platform: 'kubernetes' } },
      }),
    );
    expect(result.capabilities.length).toBeGreaterThanOrEqual(3);
    const types = result.capabilities.map((c) => c.type);
    expect(types).toContain('kubectl-rollback');
    expect(types).toContain('kubectl-scale');
  });

  it('returns capabilities for ecs platform', () => {
    const result = analyzeDeployment(
      fixtureDir,
      makeContext({
        configParser: { deployment: { platform: 'ecs' } },
      }),
    );
    expect(result.capabilities.length).toBeGreaterThanOrEqual(2);
    const types = result.capabilities.map((c) => c.type);
    expect(types).toContain('ecs-rollback');
  });

  it('finds rollback scripts in directory', () => {
    const result = analyzeDeployment(fixtureDir, makeContext({ deploymentPlatform: 'kubernetes' }));
    expect(result.rollbackScripts.length).toBeGreaterThanOrEqual(2);
    const names = result.rollbackScripts.join(',');
    expect(names).toContain('rollback.sh');
    expect(names).toContain('deploy.sh');
  });

  it('defaults to unknown platform', () => {
    const result = analyzeDeployment(fixtureDir, makeContext());
    expect(result.platform).toBe('unknown');
    expect(result.capabilities.length).toBeGreaterThanOrEqual(1);
    expect(result.capabilities[0].type).toBe('manual-rollback');
  });
});
