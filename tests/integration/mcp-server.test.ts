/**
 * Integration Tests - MCP Server
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RunbookMCPServer } from '../../src/mcp-server/mcp-server.js';
import { scanRepository } from '../../src/analyzer/repository-scanner.js';
import { mapDependencies } from '../../src/analyzer/dependency-mapper.js';
import { identifyFailureModes } from '../../src/failure-modes/failure-identifier.js';
import { extractAlerts } from '../../src/alerts/alert-extractor.js';
import { identifyHealthChecks } from '../../src/health-checks/check-identifier.js';
import { buildRunbook } from '../../src/runbook/runbook-builder.js';
import { generateAlerts } from '../../src/alerts/alert-generator.js';
import { generateDashboard } from '../../src/dashboards/dashboard-generator.js';
import { generateRollbackProcedures } from '../../src/rollback/rollback-generator.js';
import { generateIncidentWorkflows } from '../../src/incident/workflow-generator.js';
import { validateCompleteness } from '../../src/runbook/runbook-builder.js';
import type { AnalysisContext } from '../../src/types/domain.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const testRepoPath = join(process.cwd(), 'tests', 'fixtures', 'mcp-test-repo');

function createTestContext(): AnalysisContext {
  return {
    serviceDefinition: {
      name: 'mcp-test-service',
      repository: testRepoPath,
    },
    repositoryAnalysis: {
      serviceName: 'mcp-test-service',
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
    deploymentPlatform: 'unknown',
    monitoringPlatform: 'unknown',
    externalServices: [],
  };
}

describe('MCP Server Integration', () => {
  let server: RunbookMCPServer;

  beforeAll(async () => {
    mkdirSync(testRepoPath, { recursive: true });
    writeFileSync(
      join(testRepoPath, 'package.json'),
      JSON.stringify({
        name: 'mcp-test-service',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.0',
        },
      }),
    );

    server = new RunbookMCPServer({
      name: 'test-mcp-server',
      version: '1.0.0',
    });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
    rmSync(testRepoPath, { recursive: true, force: true });
  });

  describe('Server Lifecycle', () => {
    it('should start without error', () => {
      expect(server).toBeDefined();
    });

    it('should stop without error', async () => {
      await server.stop();
      expect(true).toBe(true);
    });
  });

  describe('Analysis Tools', () => {
    it('should analyze repository structure', async () => {
      const result = await scanRepository(testRepoPath);
      expect(result).toBeDefined();
      expect(result.serviceName).toBe('mcp-test-service');
      expect(result.configFiles).toBeDefined();
    });

    it('should map dependencies', async () => {
      const result = mapDependencies(testRepoPath);
      expect(result).toBeDefined();
      expect(result.directDeps).toBeDefined();
    });

    it('should identify failure modes', async () => {
      const context = createTestContext();
      const result = identifyFailureModes(testRepoPath, context);
      expect(result).toBeDefined();
      expect(result.failureModes).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

    it('should extract alerts', async () => {
      const result = extractAlerts(testRepoPath);
      expect(result).toBeDefined();
      expect(result.alerts).toBeDefined();
    });

    it('should identify health checks', async () => {
      const context = createTestContext();
      const result = identifyHealthChecks(testRepoPath, context);
      expect(result).toBeDefined();
    });
  });

  describe('Generation Tools', () => {
    it('should generate alerts', async () => {
      const context = createTestContext();
      const alerts = generateAlerts(context, { platform: 'prometheus' });
      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should generate dashboard', async () => {
      const context = createTestContext();
      const dashboard = generateDashboard(context, {
        platform: 'grafana',
        serviceName: 'mcp-test-service',
      });
      expect(dashboard).toBeDefined();
      expect(dashboard.title).toContain('mcp-test-service');
    });

    it('should generate rollback procedures', async () => {
      const context = createTestContext();
      const rollback = generateRollbackProcedures(context, 'kubernetes');
      expect(rollback).toBeDefined();
      expect(rollback.deploymentFailure).toBeDefined();
    });

    it('should generate incident workflows', async () => {
      const context = createTestContext();
      const workflows = generateIncidentWorkflows(context, {
        serviceName: 'mcp-test-service',
        teamName: 'platform',
      });
      expect(workflows).toBeDefined();
      expect(Array.isArray(workflows)).toBe(true);
    });

    it('should build runbook', async () => {
      const context = createTestContext();
      const runbook = buildRunbook(context, { serviceName: 'mcp-test-service' }, {});
      expect(runbook).toBeDefined();
      expect(runbook.title).toContain('mcp-test-service');
    });
  });

  describe('Validation Tools', () => {
    it('should validate runbook completeness', async () => {
      const runbook = {
        title: 'Test Runbook',
        version: '1.0.0',
        serviceName: 'test-service',
        generatedAt: new Date().toISOString(),
        sections: [
          { id: '1', title: 'Service Overview', order: 1, content: '', subsections: [] },
          { id: '2', title: 'Alerts', order: 2, content: '', subsections: [] },
          { id: '3', title: 'Dashboards', order: 3, content: '', subsections: [] },
        ],
        metadata: {},
      };

      const result = validateCompleteness(runbook as unknown as Record<string, unknown>, {
        requiredSections: ['Service Overview', 'Alerts', 'Dashboards'],
      });
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });
  });
});
