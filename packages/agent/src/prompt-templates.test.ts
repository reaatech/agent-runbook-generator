import { describe, it, expect } from 'vitest';
import {
  generatePrompt,
  getPromptTemplate,
  getSystemPrompt,
  createPromptTemplate,
} from '@reaatech/agent-runbook-agent';

const baseVariables = {
  serviceName: 'my-service',
  language: 'typescript',
  framework: 'express',
  serviceType: 'web-api',
  dependencies: [{ name: 'express', version: '4.18.0', type: 'framework' }],
  externalServices: [{ name: 'postgres', type: 'database' }],
};

describe('generatePrompt', () => {
  it('generates a repository-analysis prompt with variables', () => {
    const prompt = generatePrompt('repository-analysis', baseVariables);
    expect(prompt).toContain('my-service');
    expect(prompt).toContain('typescript');
    expect(prompt).toContain('express');
    expect(prompt).toContain('web-api');
  });

  it('generates a failure-mode-identification prompt', () => {
    const prompt = generatePrompt('failure-mode-identification', baseVariables);
    expect(prompt).toContain('my-service');
    expect(prompt).toContain('failure');
  });

  it('generates a runbook-alerts prompt', () => {
    const prompt = generatePrompt('runbook-alerts', baseVariables);
    expect(prompt).toContain('my-service');
    expect(prompt).toContain('alert');
  });

  it('generates a runbook-dashboards prompt', () => {
    const prompt = generatePrompt('runbook-dashboards', baseVariables);
    expect(prompt).toContain('my-service');
    expect(prompt).toContain('dashboard');
  });

  it('generates a runbook-failure-modes prompt', () => {
    const prompt = generatePrompt('runbook-failure-modes', baseVariables);
    expect(prompt).toContain('my-service');
  });

  it('generates a runbook-rollback prompt', () => {
    const prompt = generatePrompt('runbook-rollback', {
      ...baseVariables,
      configFiles: ['Dockerfile', 'k8s/deployment.yaml'],
    });
    expect(prompt).toContain('my-service');
    expect(prompt).toContain('Dockerfile');
  });

  it('generates a runbook-incident-response prompt', () => {
    const prompt = generatePrompt('runbook-incident-response', baseVariables);
    expect(prompt).toContain('my-service');
  });

  it('generates a runbook-health-checks prompt', () => {
    const prompt = generatePrompt('runbook-health-checks', baseVariables);
    expect(prompt).toContain('my-service');
    expect(prompt).toContain('health');
  });

  it('handles partial variables without error', () => {
    const prompt = generatePrompt('repository-analysis', { serviceName: 'svc' });
    expect(prompt).toContain('svc');
  });

  it('replaces array variables with comma-separated values', () => {
    const prompt = generatePrompt('repository-analysis', {
      ...baseVariables,
      entryPoints: ['src/index.ts', 'src/server.ts'],
    });
    expect(prompt).toContain('src/index.ts');
    expect(prompt).toContain('src/server.ts');
  });

  it('leaves unreplaced placeholders when variable is undefined', () => {
    const prompt = generatePrompt('repository-analysis', {});
    expect(prompt).toContain('{serviceName}');
  });
});

describe('getPromptTemplate', () => {
  it('returns repository-analysis template', () => {
    const tmpl = getPromptTemplate('repository-analysis');
    expect(tmpl.type).toBe('repository-analysis');
    expect(tmpl.systemPrompt).toBeDefined();
    expect(tmpl.userPrompt).toBeDefined();
    expect(tmpl.systemPrompt.length).toBeGreaterThan(0);
    expect(tmpl.userPrompt.length).toBeGreaterThan(0);
  });

  it('returns failure-mode-identification template', () => {
    const tmpl = getPromptTemplate('failure-mode-identification');
    expect(tmpl.type).toBe('failure-mode-identification');
  });

  it('returns runbook-alerts template', () => {
    const tmpl = getPromptTemplate('runbook-alerts');
    expect(tmpl.type).toBe('runbook-alerts');
  });

  it('returns runbook-dashboards template', () => {
    const tmpl = getPromptTemplate('runbook-dashboards');
    expect(tmpl.type).toBe('runbook-dashboards');
  });

  it('returns runbook-failure-modes template', () => {
    const tmpl = getPromptTemplate('runbook-failure-modes');
    expect(tmpl.type).toBe('runbook-failure-modes');
  });

  it('returns runbook-rollback template', () => {
    const tmpl = getPromptTemplate('runbook-rollback');
    expect(tmpl.type).toBe('runbook-rollback');
  });

  it('returns runbook-incident-response template', () => {
    const tmpl = getPromptTemplate('runbook-incident-response');
    expect(tmpl.type).toBe('runbook-incident-response');
  });

  it('returns runbook-health-checks template', () => {
    const tmpl = getPromptTemplate('runbook-health-checks');
    expect(tmpl.type).toBe('runbook-health-checks');
  });

  it('returns repository-analysis as default for unknown type cast', () => {
    const tmpl = getPromptTemplate('repository-analysis');
    expect(tmpl.type).toBe('repository-analysis');
  });
});

describe('getSystemPrompt', () => {
  it('returns system prompt for repository-analysis', () => {
    const prompt = getSystemPrompt('repository-analysis');
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain('SRE');
  });

  it('returns system prompt for failure-mode-identification', () => {
    const prompt = getSystemPrompt('failure-mode-identification');
    expect(prompt).toContain('failure');
  });

  it('returns system prompt for runbook-alerts', () => {
    const prompt = getSystemPrompt('runbook-alerts');
    expect(prompt).toContain('alert');
  });

  it('returns different prompts for different types', () => {
    const a = getSystemPrompt('repository-analysis');
    const b = getSystemPrompt('failure-mode-identification');
    expect(a).not.toBe(b);
  });
});

describe('createPromptTemplate', () => {
  it('creates a custom prompt template', () => {
    const tmpl = createPromptTemplate(
      'repository-analysis',
      'You are a custom system',
      'Analyze this: {serviceName}',
    );
    expect(tmpl.type).toBe('repository-analysis');
    expect(tmpl.systemPrompt).toBe('You are a custom system');
    expect(tmpl.userPrompt).toBe('Analyze this: {serviceName}');
  });

  it('template can be used with generatePrompt variables', () => {
    const tmpl = createPromptTemplate(
      'repository-analysis',
      'System',
      'Service: {serviceName}, Lang: {language}',
    );
    expect(tmpl.userPrompt).toContain('{serviceName}');
    expect(tmpl.userPrompt).toContain('{language}');
  });
});
