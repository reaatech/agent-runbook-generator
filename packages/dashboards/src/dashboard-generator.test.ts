import type { AnalysisContext } from '@reaatech/agent-runbook';
import {
  formatDashboardForCloudWatch,
  formatDashboardForGrafana,
  generateDashboard,
} from '@reaatech/agent-runbook-dashboards';
import { describe, expect, it } from 'vitest';

function makeContext(): AnalysisContext {
  return {
    serviceDefinition: { name: 'test-svc' },
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
  };
}

describe('generateDashboard', () => {
  it('generates a dashboard with panels', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'prometheus',
      serviceName: 'test-svc',
    });
    expect(dash.title).toContain('test-svc');
    expect(dash.panels.length).toBeGreaterThan(0);
    expect(dash.platform).toBe('prometheus');
  });

  it('includes variables', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'prometheus',
      serviceName: 'test-svc',
    });
    expect(dash.variables).toBeDefined();
    expect(dash.variables?.length).toBeGreaterThan(0);
    expect(dash.variables?.some((v) => v.name === 'instance')).toBe(true);
  });

  it('uses default refreshInterval and timeRange', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'prometheus',
      serviceName: 'test-svc',
    });
    expect(dash.refreshInterval).toBe('30s');
    expect(dash.timeRange).toBe('1h');
  });

  it('uses custom refreshInterval and timeRange', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'prometheus',
      serviceName: 'test-svc',
      refreshInterval: '10s',
      timeRange: '6h',
    });
    expect(dash.refreshInterval).toBe('10s');
    expect(dash.timeRange).toBe('6h');
  });

  it('panels have required fields', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'prometheus',
      serviceName: 'test-svc',
    });
    for (const panel of dash.panels) {
      expect(panel.id).toBeDefined();
      expect(panel.title).toBeDefined();
      expect(panel.type).toBeDefined();
      expect(panel.query).toBeDefined();
    }
  });
});

describe('formatDashboardForGrafana', () => {
  it('returns valid JSON', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'prometheus',
      serviceName: 'test-svc',
    });
    const json = formatDashboardForGrafana(dash);
    const parsed = JSON.parse(json);
    expect(parsed.title).toBe(dash.title);
    expect(parsed.panels).toBeDefined();
    expect(parsed.templating).toBeDefined();
  });

  it('includes targets with expr', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'prometheus',
      serviceName: 'test-svc',
    });
    const parsed = JSON.parse(formatDashboardForGrafana(dash));
    expect(parsed.panels[0].targets[0].expr).toBeDefined();
  });
});

describe('formatDashboardForCloudWatch', () => {
  it('returns valid JSON', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'cloudwatch',
      serviceName: 'test-svc',
    });
    const json = formatDashboardForCloudWatch(dash);
    const parsed = JSON.parse(json);
    expect(parsed.widgets).toBeDefined();
    expect(parsed.widgets.length).toBe(dash.panels.length);
  });

  it('widgets have properties with title', () => {
    const dash = generateDashboard(makeContext(), {
      platform: 'cloudwatch',
      serviceName: 'test-svc',
    });
    const parsed = JSON.parse(formatDashboardForCloudWatch(dash));
    for (const w of parsed.widgets) {
      expect(w.properties.title).toBeDefined();
    }
  });
});
