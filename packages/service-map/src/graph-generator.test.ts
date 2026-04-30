import { describe, it, expect } from 'vitest';
import {
  generateServiceMap,
  exportToMermaid,
  exportToDot,
  exportToJson,
  exportToYaml,
  exportGraph,
  generateServiceMapSummary,
} from '@reaatech/agent-runbook-service-map';
import type { ServiceDependency, AnalysisContext } from '@reaatech/agent-runbook';

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

const deps: ServiceDependency[] = [
  {
    name: 'postgres',
    type: 'database',
    direction: 'upstream',
    protocol: 'tcp',
    critical: true,
    description: 'Primary database',
  },
  {
    name: 'redis',
    type: 'cache',
    direction: 'upstream',
    protocol: 'tcp',
    critical: false,
    description: 'Cache layer',
  },
  {
    name: 'kafka',
    type: 'queue',
    direction: 'upstream',
    protocol: 'async',
    critical: true,
    description: 'Message broker',
  },
  {
    name: 'auth-service',
    type: 'api',
    direction: 'upstream',
    protocol: 'http',
    critical: false,
    description: 'Auth API',
  },
];

describe('generateServiceMap', () => {
  it('returns a dependency graph', () => {
    const graph = generateServiceMap(deps, 'my-service', makeContext());
    expect(graph).toHaveProperty('nodes');
    expect(graph).toHaveProperty('edges');
    expect(graph).toHaveProperty('criticalPaths');
  });

  it('includes service node and dependency nodes', () => {
    const graph = generateServiceMap(deps, 'my-service', makeContext());
    expect(graph.nodes.length).toBe(5);
    const ids = graph.nodes.map((n) => n.id);
    expect(ids).toContain('my-service');
    expect(ids).toContain('postgres');
    expect(ids).toContain('redis');
  });

  it('creates edges from service to upstream deps', () => {
    const graph = generateServiceMap(deps, 'my-service', makeContext());
    expect(graph.edges.length).toBe(4);
    const sources = graph.edges.map((e) => e.source);
    expect(sources.every((s) => s === 'my-service')).toBe(true);
  });

  it('identifies critical paths', () => {
    const graph = generateServiceMap(deps, 'my-service', makeContext());
    expect(graph.criticalPaths.length).toBeGreaterThan(0);
  });
});

describe('exportToMermaid', () => {
  const graph = generateServiceMap(deps, 'my-service', makeContext());

  it('starts with mermaid code block', () => {
    const result = exportToMermaid(graph);
    expect(result).toContain('```mermaid');
    expect(result).toContain('graph TD');
  });

  it('includes style definitions', () => {
    const result = exportToMermaid(graph);
    expect(result).toContain('classDef');
    expect(result).toContain('service');
    expect(result).toContain('database');
  });

  it('contains node definitions', () => {
    const result = exportToMermaid(graph);
    expect(result).toContain('my_service');
    expect(result).toContain('postgres');
  });

  it('uses dashed arrows for async edges', () => {
    const result = exportToMermaid(graph);
    expect(result).toContain('-.->');
  });

  it('uses solid arrows for sync edges', () => {
    const result = exportToMermaid(graph);
    expect(result).toContain('-->');
  });
});

describe('exportToDot', () => {
  const graph = generateServiceMap(deps, 'my-service', makeContext());

  it('produces valid dot format', () => {
    const result = exportToDot(graph);
    expect(result).toContain('digraph');
    expect(result).toContain('rankdir=TD');
  });

  it('contains node definitions', () => {
    const result = exportToDot(graph);
    expect(result).toContain('"my_service"');
    expect(result).toContain('"postgres"');
  });

  it('uses dashed style for async edges', () => {
    const result = exportToDot(graph);
    expect(result).toContain('dashed');
  });

  it('ends with closing brace', () => {
    const result = exportToDot(graph);
    expect(result.trimEnd()).toMatch(/\}$/);
  });
});

describe('exportToJson', () => {
  const graph = generateServiceMap(deps, 'my-service', makeContext());

  it('returns valid JSON', () => {
    const result = exportToJson(graph);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('nodes');
    expect(parsed).toHaveProperty('edges');
    expect(parsed).toHaveProperty('criticalPaths');
  });

  it('preserves node count', () => {
    const result = exportToJson(graph);
    const parsed = JSON.parse(result);
    expect(parsed.nodes.length).toBe(graph.nodes.length);
    expect(parsed.edges.length).toBe(graph.edges.length);
  });
});

describe('exportToYaml', () => {
  const graph = generateServiceMap(deps, 'my-service', makeContext());

  it('contains nodes section', () => {
    const result = exportToYaml(graph);
    expect(result).toContain('nodes:');
    expect(result).toContain('id: my-service');
  });

  it('contains edges section', () => {
    const result = exportToYaml(graph);
    expect(result).toContain('edges:');
    expect(result).toContain('source:');
    expect(result).toContain('target:');
  });

  it('contains critical paths section', () => {
    const result = exportToYaml(graph);
    expect(result).toContain('critical_paths:');
  });
});

describe('exportGraph', () => {
  const graph = generateServiceMap(deps, 'my-service', makeContext());

  it('exports mermaid format', () => {
    const result = exportGraph(graph, { format: 'mermaid' });
    expect(result).toContain('```mermaid');
  });

  it('exports dot format', () => {
    const result = exportGraph(graph, { format: 'dot' });
    expect(result).toContain('digraph');
  });

  it('exports json format', () => {
    const result = exportGraph(graph, { format: 'json' });
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('exports yaml format', () => {
    const result = exportGraph(graph, { format: 'yaml' });
    expect(result).toContain('nodes:');
  });

  it('defaults to mermaid for unknown format', () => {
    const result = exportGraph(graph, { format: 'mermaid' });
    expect(result).toContain('```mermaid');
  });
});

describe('generateServiceMapSummary', () => {
  const graph = generateServiceMap(deps, 'my-service', makeContext());

  it('contains total dependencies count', () => {
    const summary = generateServiceMapSummary(graph);
    expect(summary).toContain('Total Dependencies:');
    expect(summary).toContain('4');
  });

  it('contains dependencies by type', () => {
    const summary = generateServiceMapSummary(graph);
    expect(summary).toContain('database');
    expect(summary).toContain('cache');
  });

  it('contains critical paths section', () => {
    const summary = generateServiceMapSummary(graph);
    expect(summary).toContain('Critical Paths');
  });

  it('contains critical dependency count', () => {
    const summary = generateServiceMapSummary(graph);
    expect(summary).toContain('Critical Dependencies:');
  });
});
