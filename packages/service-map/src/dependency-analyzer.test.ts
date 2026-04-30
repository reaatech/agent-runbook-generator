import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { AnalysisContext, ServiceDependency } from '@reaatech/agent-runbook';
import {
  analyzeDependencies,
  generateDependencyGraph,
  generateMermaidDiagram,
} from '@reaatech/agent-runbook-service-map';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

describe('generateDependencyGraph', () => {
  const deps: ServiceDependency[] = [
    { name: 'postgres', type: 'database', direction: 'upstream', protocol: 'tcp', critical: true },
    { name: 'redis', type: 'cache', direction: 'upstream', protocol: 'tcp', critical: false },
    {
      name: 'payment-svc',
      type: 'service',
      direction: 'downstream',
      protocol: 'http',
      critical: false,
    },
  ];

  it('creates a node for the service itself', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const serviceNode = graph.nodes.find((n) => n.id === 'my-app');
    expect(serviceNode).toBeDefined();
    expect(serviceNode?.type).toBe('service');
    expect(serviceNode?.critical).toBe(true);
  });

  it('creates nodes for all dependencies', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    expect(graph.nodes.length).toBe(4);
  });

  it('maps dependency types to node types correctly', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const dbNode = graph.nodes.find((n) => n.id === 'postgres');
    const cacheNode = graph.nodes.find((n) => n.id === 'redis');
    expect(dbNode?.type).toBe('database');
    expect(cacheNode?.type).toBe('cache');
  });

  it('creates upstream edges from service to dep', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const upstreamEdge = graph.edges.find((e) => e.target === 'postgres');
    expect(upstreamEdge).toBeDefined();
    expect(upstreamEdge?.source).toBe('my-app');
    expect(upstreamEdge?.type).toBe('sync');
  });

  it('creates downstream edges from dep to service', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const downstreamEdge = graph.edges.find((e) => e.target === 'my-app');
    expect(downstreamEdge).toBeDefined();
    expect(downstreamEdge?.source).toBe('payment-svc');
  });

  it('uses async edge type for queue dependencies', () => {
    const queueDeps: ServiceDependency[] = [
      { name: 'kafka', type: 'queue', direction: 'upstream', protocol: 'async', critical: true },
    ];
    const graph = generateDependencyGraph(queueDeps, 'my-app');
    expect(graph.edges[0].type).toBe('async');
  });

  it('identifies critical paths for critical database deps', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const dbPath = graph.criticalPaths.find((p) => p.name.includes('postgres'));
    expect(dbPath).toBeDefined();
    expect(dbPath?.riskLevel).toBe('high');
  });

  it('handles empty dependencies', () => {
    const graph = generateDependencyGraph([], 'my-app');
    expect(graph.nodes.length).toBe(1);
    expect(graph.edges.length).toBe(0);
  });
});

describe('generateMermaidDiagram', () => {
  const deps: ServiceDependency[] = [
    { name: 'postgres', type: 'database', direction: 'upstream', protocol: 'tcp', critical: true },
    { name: 'redis', type: 'cache', direction: 'upstream', protocol: 'tcp', critical: false },
  ];

  it('starts with graph TD', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const mermaid = generateMermaidDiagram(graph);
    expect(mermaid.startsWith('graph TD')).toBe(true);
  });

  it('contains node entries', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const mermaid = generateMermaidDiagram(graph);
    expect(mermaid).toContain('my_app');
    expect(mermaid).toContain('postgres');
  });

  it('uses thick arrows for critical edges', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const mermaid = generateMermaidDiagram(graph);
    expect(mermaid).toContain('===>');
  });

  it('uses normal arrows for non-critical edges', () => {
    const graph = generateDependencyGraph(deps, 'my-app');
    const mermaid = generateMermaidDiagram(graph);
    expect(mermaid).toContain('-->');
  });
});

describe('analyzeDependencies', () => {
  let fixtureDir: string;

  beforeAll(() => {
    fixtureDir = path.join(os.tmpdir(), `dep-analyzer-${Date.now()}`);
    fs.mkdirSync(fixtureDir);
    fs.writeFileSync(
      path.join(fixtureDir, 'api.ts'),
      "fetch('https://external-api.example.com/v1/data');",
    );
    fs.writeFileSync(path.join(fixtureDir, 'queue.ts'), "kafka.produce('order-events');");
  });

  afterAll(() => {
    fs.rmSync(fixtureDir, { recursive: true });
  });

  it('returns dependencies from external services', () => {
    const result = analyzeDependencies(
      fixtureDir,
      makeContext({ externalServices: [{ type: 'database', name: 'postgres' }] }),
    );
    const dbDep = result.find((d) => d.name === 'postgres');
    expect(dbDep).toBeDefined();
    expect(dbDep?.direction).toBe('upstream');
    expect(dbDep?.critical).toBe(true);
  });

  it('detects API calls in code', () => {
    const result = analyzeDependencies(fixtureDir, makeContext());
    const apiDep = result.find((d) => d.name.includes('external-api'));
    expect(apiDep).toBeDefined();
    expect(apiDep?.type).toBe('api');
  });

  it('detects queue calls in code', () => {
    const result = analyzeDependencies(fixtureDir, makeContext());
    const queueDep = result.find((d) => d.name.includes('kafka'));
    expect(queueDep).toBeDefined();
    expect(queueDep?.critical).toBe(true);
  });

  it('returns empty array for empty context and no code patterns', () => {
    const emptyDir = path.join(os.tmpdir(), `dep-empty-${Date.now()}`);
    fs.mkdirSync(emptyDir);
    const result = analyzeDependencies(emptyDir, makeContext());
    expect(result).toEqual([]);
    fs.rmdirSync(emptyDir);
  });
});
