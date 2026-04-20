import { describe, it, expect } from 'vitest';
import {
  generateVerificationSteps,
  generateVerificationChecklist,
} from '../../../src/rollback/verification-generator.js';
import type { AnalysisContext, VerificationStep } from '../../../src/types/domain.js';

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

describe('generateVerificationSteps', () => {
  it('returns all verification categories', () => {
    const result = generateVerificationSteps(makeContext(), 'kubernetes');
    expect(result).toHaveProperty('healthChecks');
    expect(result).toHaveProperty('smokeTests');
    expect(result).toHaveProperty('dataValidation');
    expect(result).toHaveProperty('performanceChecks');
    expect(result).toHaveProperty('successCriteria');
  });

  it('generates health check steps', () => {
    const result = generateVerificationSteps(makeContext(), 'kubernetes');
    expect(result.healthChecks.length).toBe(4);
    const checks = result.healthChecks as VerificationStep[];
    expect(checks[0].title).toBeDefined();
    expect(checks[0].commands).toBeDefined();
  });

  it('generates smoke test steps', () => {
    const result = generateVerificationSteps(makeContext(), 'kubernetes');
    expect(result.smokeTests.length).toBe(4);
  });

  it('generates performance check steps', () => {
    const result = generateVerificationSteps(makeContext(), 'kubernetes');
    expect(result.performanceChecks.length).toBe(4);
  });

  it('returns empty data validation when no database dependency', () => {
    const result = generateVerificationSteps(makeContext(), 'kubernetes');
    expect(result.dataValidation).toEqual([]);
  });

  it('generates data validation steps when database exists', () => {
    const result = generateVerificationSteps(
      makeContext({
        externalServices: [{ type: 'database', name: 'postgres' }],
      }),
      'kubernetes',
    );
    expect(result.dataValidation.length).toBe(3);
  });

  it('includes success criteria', () => {
    const result = generateVerificationSteps(makeContext(), 'kubernetes');
    expect(result.successCriteria.length).toBeGreaterThan(0);
    expect(result.successCriteria).toContain('All pods/instances are in Running state');
  });

  it('uses service name in commands', () => {
    const result = generateVerificationSteps(makeContext(), 'kubernetes');
    const checks = result.healthChecks as VerificationStep[];
    const allCommands = checks.flatMap((c: VerificationStep) => c.commands ?? []);
    const hasServiceName = allCommands.some((cmd: string) => cmd.includes('test-service'));
    expect(hasServiceName).toBe(true);
  });
});

describe('generateVerificationChecklist', () => {
  it('returns an array of strings', () => {
    const result = generateVerificationChecklist(makeContext(), 'kubernetes');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('each item starts with checkbox marker', () => {
    const result = generateVerificationChecklist(makeContext(), 'kubernetes');
    const checklistItems = result.filter((r) => r.startsWith('[ ]'));
    expect(checklistItems.length).toBeGreaterThan(0);
  });

  it('includes success criteria section', () => {
    const result = generateVerificationChecklist(makeContext(), 'kubernetes');
    expect(result).toContain('\n## Success Criteria');
  });

  it('includes data validation items when database present', () => {
    const result = generateVerificationChecklist(
      makeContext({ externalServices: [{ type: 'database', name: 'postgres' }] }),
      'kubernetes',
    );
    const joined = result.join('\n');
    expect(joined).toContain('Verify data consistency');
  });
});
