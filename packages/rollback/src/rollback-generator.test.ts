import { describe, it, expect } from 'vitest';
import { generateRollbackProcedures } from '@reaatech/agent-runbook-rollback';
import type {
  AnalysisContext,
  RollbackProcedure,
  RollbackStep,
} from '@reaatech/agent-runbook';

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

describe('generateRollbackProcedures', () => {
  it('returns all four rollback scenarios', () => {
    const result = generateRollbackProcedures(makeContext(), 'kubernetes');
    expect(result).toHaveProperty('deploymentFailure');
    expect(result).toHaveProperty('configurationError');
    expect(result).toHaveProperty('performanceDegradation');
    expect(result).toHaveProperty('dataCorruption');
  });

  it('deployment failure has correct structure', () => {
    const result = generateRollbackProcedures(makeContext(), 'kubernetes');
    const df = result.deploymentFailure as RollbackProcedure;
    expect(df.description).toBeDefined();
    expect(Array.isArray(df.triggerConditions)).toBe(true);
    expect(Array.isArray(df.steps)).toBe(true);
    expect(df.steps.length).toBe(6);
    expect(df.estimatedTotalDuration).toBe('42m');
    expect(df.requiresApproval).toBe(false);
  });

  it('deployment failure steps contain kubectl commands for kubernetes', () => {
    const result = generateRollbackProcedures(makeContext(), 'kubernetes');
    const df = result.deploymentFailure as RollbackProcedure;
    const rollbackStep = df.steps.find((s: RollbackStep) => s.order === 3) as RollbackStep;
    expect(rollbackStep.commands).toContain('kubectl rollout undo deployment/test-service');
  });

  it('deployment failure steps contain ECS commands for ecs platform', () => {
    const result = generateRollbackProcedures(makeContext(), 'ecs');
    const df = result.deploymentFailure as RollbackProcedure;
    const rollbackStep = df.steps.find((s: RollbackStep) => s.order === 3) as RollbackStep;
    expect(rollbackStep.commands[0]).toContain('aws ecs update-service');
    expect(rollbackStep.commands[0]).toContain('test-service');
  });

  it('configuration error has correct number of steps', () => {
    const result = generateRollbackProcedures(makeContext(), 'kubernetes');
    const ce = result.configurationError as RollbackProcedure;
    expect(ce.steps.length).toBe(5);
  });

  it('configuration error includes restart step for kubernetes', () => {
    const result = generateRollbackProcedures(makeContext(), 'kubernetes');
    const ce = result.configurationError as RollbackProcedure;
    const restartStep = ce.steps.find((s: RollbackStep) => s.order === 4) as RollbackStep;
    expect(restartStep.commands[0]).toContain('kubectl rollout restart');
  });

  it('performance degradation requires approval', () => {
    const result = generateRollbackProcedures(makeContext(), 'kubernetes');
    const pd = result.performanceDegradation as RollbackProcedure;
    expect(pd.requiresApproval).toBe(true);
  });

  it('performance degradation includes scaling step', () => {
    const result = generateRollbackProcedures(makeContext(), 'kubernetes');
    const pd = result.performanceDegradation as RollbackProcedure;
    const scaleStep = pd.steps.find((s: RollbackStep) => s.order === 2) as RollbackStep;
    expect(scaleStep.commands[0]).toContain('kubectl scale');
  });

  it('data corruption has the most steps', () => {
    const result = generateRollbackProcedures(makeContext(), 'kubernetes');
    const dc = result.dataCorruption as RollbackProcedure;
    expect(dc.steps.length).toBe(7);
    expect(dc.requiresApproval).toBe(true);
  });

  it('works with lambda platform', () => {
    const result = generateRollbackProcedures(makeContext(), 'lambda');
    const df = result.deploymentFailure as RollbackProcedure;
    const rollbackStep = df.steps.find((s: RollbackStep) => s.order === 3) as RollbackStep;
    expect(rollbackStep.commands[0]).toContain('aws lambda');
  });

  it('works with cloud-run platform', () => {
    const result = generateRollbackProcedures(makeContext(), 'cloud-run');
    const df = result.deploymentFailure as RollbackProcedure;
    const rollbackStep = df.steps.find((s: RollbackStep) => s.order === 3) as RollbackStep;
    expect(rollbackStep.commands[0]).toContain('gcloud run');
  });
});
