import { describe, it, expect } from 'vitest';
import { formatAsMarkdown, formatAsHTML, exportRunbook } from '../../src/runbook/formatter.js';
import { generateTOC, validateCompleteness } from '../../src/runbook/runbook-builder.js';
import {
  STANDARD_SRE_TEMPLATE,
  getTemplateById,
  getAllTemplates,
} from '../../src/runbook/templates.js';
import type { Runbook, RunbookSection } from '../../src/types/domain.js';

function makeSection(title: string, content: string, order: number): RunbookSection {
  return {
    id: `section-${order}`,
    title,
    order,
    content,
    subsections: [],
  };
}

function makeRunbook(sections: RunbookSection[]): Runbook {
  return {
    id: 'runbook-test',
    title: 'Test Service Runbook',
    serviceName: 'test-service',
    sections,
    generatedAt: '2026-04-16T00:00:00Z',
    version: '1.0.0',
  };
}

describe('Runbook Formatter', () => {
  describe('formatAsMarkdown', () => {
    it('should format runbook to markdown', () => {
      const runbook = makeRunbook([
        makeSection('Overview', 'Service overview content', 1),
        makeSection('Alerts', 'Alert definitions', 2),
      ]);

      const result = formatAsMarkdown(runbook);
      expect(result).toContain('# Test Service Runbook');
      expect(result).toContain('## Overview');
      expect(result).toContain('Service overview content');
      expect(result).toContain('## Alerts');
    });

    it('should include table of contents', () => {
      const runbook = makeRunbook([
        makeSection('Overview', 'Overview', 1),
        makeSection('Alerts', 'Alerts', 2),
        makeSection('Failure Modes', 'Failures', 3),
      ]);

      const result = formatAsMarkdown(runbook);
      expect(result).toContain('## Table of Contents');
      expect(result).toContain('[Overview]');
      expect(result).toContain('[Alerts]');
      expect(result).toContain('[Failure Modes]');
    });
  });

  describe('formatAsHTML', () => {
    it('should format runbook to HTML', () => {
      const runbook = makeRunbook([makeSection('Overview', 'Service overview', 1)]);

      const result = formatAsHTML(runbook);
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('Test Service Runbook');
      expect(result).toContain('Service overview');
    });
  });

  describe('exportRunbook', () => {
    it('should format to markdown by default', () => {
      const runbook = makeRunbook([makeSection('Overview', 'Content', 1)]);

      const result = exportRunbook(runbook);
      expect(result).toContain('# Test Service Runbook');
    });

    it('should format to HTML when specified', () => {
      const runbook = makeRunbook([makeSection('Overview', 'Content', 1)]);

      const result = exportRunbook(runbook, 'html');
      expect(result).toContain('<!DOCTYPE html>');
    });
  });
});

describe('Runbook Builder', () => {
  describe('generateTOC', () => {
    it('should generate TOC for runbook sections', () => {
      const runbook = makeRunbook([
        makeSection('Overview', 'Overview', 1),
        makeSection('Alerts', 'Alerts', 2),
      ]);

      const toc = generateTOC(runbook);
      expect(toc).toContain('Overview');
      expect(toc).toContain('Alerts');
    });

    it('should include subsections in TOC', () => {
      const runbook = makeRunbook([
        {
          ...makeSection('Overview', 'Overview', 1),
          subsections: [
            { id: 'arch', title: 'Architecture', order: 1, content: 'Content', subsections: [] },
            { id: 'deps', title: 'Dependencies', order: 2, content: 'Content', subsections: [] },
          ],
        },
      ]);

      const toc = generateTOC(runbook);
      expect(toc).toContain('Architecture');
      expect(toc).toContain('Dependencies');
    });

    it('should create proper markdown links', () => {
      const runbook = makeRunbook([makeSection('Service Overview', 'Content', 1)]);

      const toc = generateTOC(runbook);
      expect(toc).toContain('# Table of Contents');
      expect(toc).toContain('[Service Overview](#service-overview)');
    });
  });

  describe('validateCompleteness', () => {
    it('should return score 0 for runbook with no sections', () => {
      const result = validateCompleteness({});
      expect(result.score).toBe(0);
      expect(result.missingSections).toContain('Service Overview');
    });

    it('should return score 0 for runbook with empty sections array', () => {
      const result = validateCompleteness({ sections: [] });
      expect(result.score).toBe(0);
      expect(result.missingSections.length).toBe(6);
    });

    it('should give full score for complete runbook with substantial content', () => {
      const runbook = {
        sections: [
          {
            title: 'Service Overview',
            content:
              'This is a comprehensive service overview that exceeds the 100 character minimum requirement for validation purposes.',
          },
          {
            title: 'Alerts',
            content:
              'This section defines all the alert rules and thresholds for monitoring the service, including CPU usage, memory consumption, and error rates that could impact the system.',
          },
          {
            title: 'Dashboards',
            content:
              'This section contains Grafana dashboard configurations for visualizing service metrics, including request rates, latency percentiles, and error distributions that help monitor the service health.',
          },
          {
            title: 'Failure Modes',
            content:
              'This section documents potential failure modes including database connection failures, external API timeouts, and downstream service unavailability scenarios that may affect the service.',
          },
          {
            title: 'Rollback Procedures',
            content:
              'This section provides step-by-step instructions for rolling back deployments, including database migrations, configuration changes, and service restarts that may be necessary during incident response.',
          },
          {
            title: 'Health Checks',
            content:
              'This section defines liveness and readiness probe configurations for Kubernetes deployments, including HTTP endpoints and TCP socket checks that ensure the service remains healthy.',
          },
        ],
      };
      const result = validateCompleteness(runbook);
      expect(result.score).toBe(1);
      expect(result.missingSections.length).toBe(0);
    });

    it('should give partial score for sections with insufficient content', () => {
      const runbook = {
        sections: [
          { title: 'Service Overview', content: 'Short content' },
          { title: 'Alerts', content: 'Alert definitions for the service.' },
          { title: 'Dashboards', content: 'Dashboard configurations.' },
          { title: 'Failure Modes', content: 'Failure mode analysis.' },
          { title: 'Rollback Procedures', content: 'Rollback steps.' },
          { title: 'Health Checks', content: 'Health check definitions.' },
        ],
      };
      const result = validateCompleteness(runbook);
      expect(result.score).toBeLessThan(1);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should use custom required sections when provided', () => {
      const runbook = { sections: [] };
      const result = validateCompleteness(runbook, { requiredSections: ['Custom Section'] });
      expect(result.missingSections).toContain('Custom Section');
    });

    it('should return suggestions for improvement', () => {
      const runbook = { sections: [] };
      const result = validateCompleteness(runbook);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should match section titles case-insensitively', () => {
      const runbook = {
        sections: [
          {
            title: 'SERVICE OVERVIEW',
            content:
              'This is a comprehensive service overview that exceeds the 100 character minimum requirement for validation purposes.',
          },
          {
            title: 'ALERTS',
            content:
              'This section defines all the alert rules and thresholds for monitoring the service, including CPU usage, memory consumption, and error rates.',
          },
          {
            title: 'DASHBOARDS',
            content:
              'This section contains Grafana dashboard configurations for visualizing service metrics.',
          },
          {
            title: 'FAILURE MODES',
            content:
              'This section documents potential failure modes including database connection failures.',
          },
          {
            title: 'ROLLBACK PROCEDURES',
            content:
              'This section provides step-by-step instructions for rolling back deployments.',
          },
          {
            title: 'HEALTH CHECKS',
            content: 'This section defines liveness and readiness probe configurations.',
          },
        ],
      };
      const result = validateCompleteness(runbook);
      expect(result.missingSections.length).toBe(0);
    });
  });
});

describe('Runbook Templates', () => {
  describe('getAllTemplates', () => {
    it('should return available templates', () => {
      const templates = getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplateById', () => {
    it('should return standard template', () => {
      const template = getTemplateById('standard-sre');
      expect(template).toBeDefined();
      expect(template?.name).toContain('SRE');
      expect(template?.sections.length).toBeGreaterThan(0);
    });

    it('should return undefined for unknown id', () => {
      const template = getTemplateById('unknown-template');
      expect(template).toBeUndefined();
    });
  });

  describe('STANDARD_SRE_TEMPLATE', () => {
    it('should have required sections', () => {
      expect(STANDARD_SRE_TEMPLATE.sections.length).toBeGreaterThan(0);
      expect(STANDARD_SRE_TEMPLATE.name).toBeDefined();
    });
  });
});
