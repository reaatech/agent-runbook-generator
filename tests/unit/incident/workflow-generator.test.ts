import { describe, it, expect } from 'vitest';
import {
  generateIncidentWorkflows,
  generateEscalationPolicy,
  generateStandardWorkflow,
} from '../../../src/incident/workflow-generator.js';
import type {
  AnalysisContext,
  IncidentWorkflow,
  EscalationPolicy,
} from '../../../src/types/domain.js';

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

const config = {
  serviceName: 'test-service',
  teamName: 'platform',
};

describe('generateIncidentWorkflows', () => {
  it('generates four severity-level workflows', () => {
    const workflows = generateIncidentWorkflows(makeContext(), config);
    expect(workflows.length).toBe(4);
  });

  it('includes P1 critical workflow', () => {
    const workflows = generateIncidentWorkflows(makeContext(), config);
    const p1 = workflows.find((w) => w.name.includes('P1'));
    expect(p1).toBeDefined();
    expect(p1.severity).toBe('critical');
    expect(p1.responseTime).toBe('5 minutes');
  });

  it('includes P2 high severity workflow', () => {
    const workflows = generateIncidentWorkflows(makeContext(), config);
    const p2 = workflows.find((w) => w.name.includes('P2'));
    expect(p2).toBeDefined();
    expect(p2.severity).toBe('high');
    expect(p2.responseTime).toBe('15 minutes');
  });

  it('includes P3 medium severity workflow', () => {
    const workflows = generateIncidentWorkflows(makeContext(), config);
    const p3 = workflows.find((w) => w.name.includes('P3'));
    expect(p3).toBeDefined();
    expect(p3.severity).toBe('medium');
  });

  it('includes P4 low severity workflow', () => {
    const workflows = generateIncidentWorkflows(makeContext(), config);
    const p4 = workflows.find((w) => w.name.includes('P4'));
    expect(p4).toBeDefined();
    expect(p4.severity).toBe('low');
    expect(p4.responseTime).toBe('Next business day');
  });

  it('each workflow has escalation path', () => {
    const workflows = generateIncidentWorkflows(makeContext(), config);
    for (const wf of workflows) {
      expect(Array.isArray(wf.escalationPath)).toBe(true);
      expect(wf.escalationPath.length).toBeGreaterThan(0);
    }
  });

  it('each workflow has communication templates', () => {
    const workflows = generateIncidentWorkflows(makeContext(), config);
    for (const wf of workflows) {
      expect(Array.isArray(wf.communicationTemplates)).toBe(true);
      expect(wf.communicationTemplates.length).toBeGreaterThan(0);
    }
  });

  it('each workflow has actionable steps', () => {
    const workflows = generateIncidentWorkflows(makeContext(), config);
    for (const wf of workflows) {
      expect(Array.isArray(wf.steps)).toBe(true);
      expect(wf.steps.length).toBeGreaterThan(0);
    }
  });
});

describe('generateEscalationPolicy', () => {
  it('returns a policy with three levels', () => {
    const policy = generateEscalationPolicy(config) as EscalationPolicy;
    expect(policy.levels.length).toBe(3);
  });

  it('level 1 has zero delay', () => {
    const policy = generateEscalationPolicy(config) as EscalationPolicy;
    expect(policy.levels[0].delayMinutes).toBe(0);
    expect(policy.levels[0].targets).toContain('on-call-engineer');
  });

  it('level 2 has 10 minute delay', () => {
    const policy = generateEscalationPolicy(config) as EscalationPolicy;
    expect(policy.levels[1].delayMinutes).toBe(10);
  });

  it('level 3 has 20 minute delay', () => {
    const policy = generateEscalationPolicy(config) as EscalationPolicy;
    expect(policy.levels[2].delayMinutes).toBe(20);
  });

  it('includes repeat policy', () => {
    const policy = generateEscalationPolicy(config) as EscalationPolicy;
    expect(policy.repeatPolicy).toBeDefined();
    expect(policy.repeatPolicy.enabled).toBe(true);
    expect(policy.repeatPolicy.repeatAfterMinutes).toBe(30);
    expect(policy.repeatPolicy.maxRepeats).toBe(3);
  });

  it('uses service name in policy name', () => {
    const policy = generateEscalationPolicy(config) as EscalationPolicy;
    expect(policy.name).toContain('test-service');
  });
});

describe('generateStandardWorkflow', () => {
  it('returns a workflow with service name', () => {
    const workflow = generateStandardWorkflow(makeContext(), config) as IncidentWorkflow;
    expect(workflow.name).toContain('test-service');
  });

  it('has medium severity by default', () => {
    const workflow = generateStandardWorkflow(makeContext(), config) as IncidentWorkflow;
    expect(workflow.severity).toBe('medium');
  });

  it('includes escalation path with team name', () => {
    const workflow = generateStandardWorkflow(makeContext(), config) as IncidentWorkflow;
    expect(workflow.escalationPath.length).toBeGreaterThan(0);
    const joined = workflow.escalationPath.join(' ');
    expect(joined).toContain('platform');
  });

  it('has actionable steps', () => {
    const workflow = generateStandardWorkflow(makeContext(), config) as IncidentWorkflow;
    expect(workflow.steps.length).toBeGreaterThan(0);
  });
});
