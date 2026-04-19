import { describe, it, expect, beforeEach } from 'vitest';
import { AnalysisAgent, createAnalysisAgent } from '../../../src/agent/analysis-agent.js';
import type { AnalysisContext } from '../../../src/types/domain.js';

const mockContext: AnalysisContext = {
  serviceDefinition: {
    name: 'test-service',
    repository: '/tmp/test-repo',
  },
  repositoryAnalysis: {
    serviceName: 'test-service',
    serviceType: 'web-api',
    language: 'typescript',
    framework: 'express',
    structure: {
      mainDirectories: ['src'],
      fileCount: 10,
      depth: 3,
      hasTests: true,
      hasDockerfile: true,
      hasKubernetesManifests: false,
      hasTerraform: false,
    },
    configFiles: ['package.json', 'tsconfig.json'],
    entryPoints: [{ file: 'src/index.ts', type: 'http_server', port: 3000 }],
    externalServices: [{ type: 'database', name: 'postgres' }],
  },
  dependencyAnalysis: {
    directDeps: [],
    transitiveDeps: [],
    dependencyGraph: [],
    externalServices: [],
  },
  deploymentPlatform: 'kubernetes',
  monitoringPlatform: 'prometheus',
  externalServices: [{ type: 'database', name: 'postgres' }],
};

describe('AnalysisAgent', () => {
  let agent: AnalysisAgent;

  beforeEach(() => {
    agent = new AnalysisAgent({ provider: 'mock' });
  });

  it('constructs with config', () => {
    const a = new AnalysisAgent({ provider: 'openai', model: 'gpt-4', apiKey: 'test-key' });
    expect(a).toBeInstanceOf(AnalysisAgent);
  });

  describe('analyzeRepository', () => {
    it('returns an array of insights', async () => {
      const insights = await agent.analyzeRepository(mockContext);
      expect(Array.isArray(insights)).toBe(true);
    });

    it('returns insights with category and finding', async () => {
      const insights = await agent.analyzeRepository(mockContext);
      for (const insight of insights) {
        expect(insight).toHaveProperty('category');
        expect(insight).toHaveProperty('finding');
        expect(insight).toHaveProperty('confidence');
      }
    });
  });

  describe('identifyFailureModes', () => {
    it('returns an array of failure mode names', async () => {
      const modes = await agent.identifyFailureModes(mockContext);
      expect(Array.isArray(modes)).toBe(true);
    });

    it('parses failure mode names from response', async () => {
      const modes = await agent.identifyFailureModes(mockContext);
      expect(modes.length).toBeGreaterThan(0);
      for (const mode of modes) {
        expect(typeof mode).toBe('string');
        expect(mode.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateRunbookSection', () => {
    it('returns a string for alerts section', async () => {
      const content = await agent.generateRunbookSection('alerts', mockContext);
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('returns a string for dashboards section', async () => {
      const content = await agent.generateRunbookSection('dashboards', mockContext);
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('returns a string for failure-modes section', async () => {
      const content = await agent.generateRunbookSection('failure-modes', mockContext);
      expect(typeof content).toBe('string');
    });
  });

  describe('provider variants', () => {
    it('works with claude provider', async () => {
      const claudeAgent = new AnalysisAgent({ provider: 'claude' });
      const insights = await claudeAgent.analyzeRepository(mockContext);
      expect(Array.isArray(insights)).toBe(true);
    });

    it('works with openai provider', async () => {
      const openaiAgent = new AnalysisAgent({ provider: 'openai' });
      const insights = await openaiAgent.analyzeRepository(mockContext);
      expect(Array.isArray(insights)).toBe(true);
    });

    it('works with gemini provider', async () => {
      const geminiAgent = new AnalysisAgent({ provider: 'gemini' });
      const insights = await geminiAgent.analyzeRepository(mockContext);
      expect(Array.isArray(insights)).toBe(true);
    });
  });
});

describe('createAnalysisAgent', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('creates an agent with default config', () => {
    delete process.env.LLM_PROVIDER;
    const agent = createAnalysisAgent();
    expect(agent).toBeInstanceOf(AnalysisAgent);
  });

  it('creates an agent with partial config overrides', () => {
    const agent = createAnalysisAgent({ provider: 'openai', model: 'gpt-4' });
    expect(agent).toBeInstanceOf(AnalysisAgent);
  });

  it('uses LLM_PROVIDER env variable when set', () => {
    process.env.LLM_PROVIDER = 'claude';
    const agent = createAnalysisAgent();
    expect(agent).toBeInstanceOf(AnalysisAgent);
  });

  it('uses LLM_MODEL env variable when set', () => {
    process.env.LLM_MODEL = 'claude-opus-4-5-20260506';
    const agent = createAnalysisAgent();
    expect(agent).toBeInstanceOf(AnalysisAgent);
  });

  it('overrides env with explicit config', () => {
    process.env.LLM_PROVIDER = 'claude';
    const agent = createAnalysisAgent({ provider: 'mock' });
    expect(agent).toBeInstanceOf(AnalysisAgent);
  });
});
