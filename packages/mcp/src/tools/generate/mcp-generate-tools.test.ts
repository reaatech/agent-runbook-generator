import { describe, expect, it, vi } from 'vitest';
import { execute as executeHealthChecks } from './health_checks.js';
import { execute as executeServiceMap } from './service_map.js';

vi.mock('@reaatech/agent-runbook-analyzer', () => ({
  scanRepository: vi.fn().mockResolvedValue({
    serviceName: 'test-service',
    serviceType: 'web-api',
    language: 'typescript',
    framework: 'express',
    structure: {
      mainDirectories: ['src', 'tests'],
      fileCount: 100,
      depth: 3,
      hasTests: true,
      hasDockerfile: true,
    },
    configFiles: ['package.json', 'tsconfig.json'],
    entryPoints: ['src/index.ts'],
    externalServices: [],
  }),
  mapDependencies: vi.fn().mockReturnValue({
    directDeps: [
      { name: 'express', version: '4.18.0', purpose: 'Web framework', category: 'framework' },
      { name: 'pg', version: '8.11.0', purpose: 'Database driver', category: 'database' },
    ],
    transitiveDeps: [],
    dependencyGraph: [],
    externalServices: [],
  }),
  analyzeDependencies: vi.fn().mockReturnValue({
    directDeps: [],
    transitiveDeps: [],
    externalServices: [],
  }),
}));

vi.mock('@reaatech/agent-runbook-service-map', () => ({
  generateDependencyGraph: vi.fn().mockReturnValue({
    nodes: [
      { id: 'test-service', name: 'test-service', type: 'service', critical: true },
      { id: 'express', name: 'express', type: 'dependency', critical: false },
    ],
    edges: [{ source: 'test-service', target: 'express', type: 'depends-on', critical: false }],
    criticalPaths: [['test-service']],
  }),
}));

vi.mock('@reaatech/agent-runbook-service-map', () => ({
  exportGraph: vi.fn().mockReturnValue('graph-export-content'),
}));

vi.mock('@reaatech/agent-runbook-health-checks', () => ({
  generateHealthChecks: vi.fn().mockReturnValue([
    {
      name: 'liveness-check',
      type: 'liveness' as const,
      endpoint: '/health',
      interval: '30s',
      timeout: '5s',
      successCriteria: 'status == 200',
    },
    {
      name: 'readiness-check',
      type: 'readiness' as const,
      endpoint: '/ready',
      interval: '10s',
      timeout: '3s',
      successCriteria: 'status == 200',
    },
  ]),
  generateKubernetesProbeYaml: vi
    .fn()
    .mockReturnValue('livenessProbe:\n  httpGet:\n    path: /health\n    port: 8080'),
}));

describe('Service Map MCP Tool', () => {
  describe('execute', () => {
    it('should generate service map with default format', async () => {
      const result = (await executeServiceMap({
        analysis_context: { path: '/test/path' },
      })) as Record<string, unknown>;

      expect(result.serviceName).toBe('unknown-service');
      expect(result.format).toBe('mermaid');
      expect(result.graph).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(result.criticalPaths).toBeDefined();
    });

    it('should generate service map with custom format', async () => {
      const result = (await executeServiceMap({
        analysis_context: { path: '/test/path' },
        format: 'json',
      })) as Record<string, unknown>;

      expect(result.format).toBe('json');
    });

    it('should use serviceName from context', async () => {
      const result = (await executeServiceMap({
        analysis_context: { path: '/test/path', serviceName: 'my-custom-service' },
      })) as Record<string, unknown>;

      expect(result.serviceName).toBe('my-custom-service');
    });

    it('should return summary with counts', async () => {
      const result = (await executeServiceMap({
        analysis_context: { path: '/test/path' },
      })) as Record<string, unknown>;

      expect(result.summary).toBeDefined();
      expect((result.summary as Record<string, number>).totalNodes).toBeDefined();
      expect((result.summary as Record<string, number>).totalEdges).toBeDefined();
    });
  });
});

describe('Health Checks MCP Tool', () => {
  describe('execute', () => {
    it('should generate health checks for kubernetes platform', async () => {
      const result = (await executeHealthChecks({
        service_context: { path: '/test/path', serviceName: 'test-service' },
        platform: 'kubernetes',
      })) as Record<string, unknown>;

      expect(result.serviceName).toBe('test-service');
      expect(result.platform).toBe('kubernetes');
      expect(result.checks).toBeDefined();
      expect(Array.isArray(result.checks)).toBe(true);
      expect(result.kubernetesConfig).toBeDefined();
    });

    it('should generate health checks for load-balancer platform', async () => {
      const result = (await executeHealthChecks({
        service_context: { path: '/test/path', serviceName: 'test-service' },
        platform: 'load-balancer',
      })) as Record<string, unknown>;

      expect(result.platform).toBe('load-balancer');
      expect(result.kubernetesConfig).toBeUndefined();
    });

    it('should use custom service context values', async () => {
      const result = (await executeHealthChecks({
        service_context: {
          path: '/test/path',
          serviceName: 'my-service',
          port: 9090,
          endpoint: '/custom-health',
        },
        platform: 'prometheus',
      })) as Record<string, unknown>;

      expect(result.serviceName).toBe('my-service');
    });

    it('should return summary with check counts', async () => {
      const result = (await executeHealthChecks({
        service_context: { path: '/test/path', serviceName: 'test-service' },
        platform: 'kubernetes',
      })) as Record<string, unknown>;

      expect(result.summary).toBeDefined();
      expect((result.summary as Record<string, number>).totalChecks).toBeGreaterThan(0);
      expect((result.summary as Record<string, number>).livenessChecks).toBeGreaterThanOrEqual(0);
      expect((result.summary as Record<string, number>).readinessChecks).toBeGreaterThanOrEqual(0);
    });

    it('should default to unknown-service when serviceName not provided', async () => {
      const result = (await executeHealthChecks({
        service_context: { path: '/test/path' },
        platform: 'datadog',
      })) as Record<string, unknown>;

      expect(result.serviceName).toBe('unknown-service');
    });
  });
});
