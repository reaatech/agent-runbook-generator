import {
  COMMUNICATION_TEMPLATES,
  applyTemplateVariables,
  createTemplate,
  getTemplateByName,
  getTemplatesByCategory,
} from '@reaatech/agent-runbook-incident';
import { describe, expect, it } from 'vitest';

describe('COMMUNICATION_TEMPLATES', () => {
  it('has five categories', () => {
    expect(COMMUNICATION_TEMPLATES.length).toBe(5);
  });

  it('each category has id, name, and templates', () => {
    for (const cat of COMMUNICATION_TEMPLATES) {
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(Array.isArray(cat.templates)).toBe(true);
      expect(cat.templates.length).toBeGreaterThan(0);
    }
  });

  it('has expected category ids', () => {
    const ids = COMMUNICATION_TEMPLATES.map((c) => c.id);
    expect(ids).toContain('incident-notification');
    expect(ids).toContain('status-updates');
    expect(ids).toContain('resolution');
    expect(ids).toContain('postmortem');
    expect(ids).toContain('handoff');
  });

  it('each template has required fields', () => {
    for (const cat of COMMUNICATION_TEMPLATES) {
      for (const t of cat.templates) {
        expect(t.id).toBeDefined();
        expect(t.name).toBeDefined();
        expect(t.body).toBeDefined();
      }
    }
  });
});

describe('getTemplatesByCategory', () => {
  it('returns templates for incident-notification category', () => {
    const templates = getTemplatesByCategory('incident-notification');
    expect(templates.length).toBe(2);
  });

  it('returns templates for resolution category', () => {
    const templates = getTemplatesByCategory('resolution');
    expect(templates.length).toBe(2);
  });

  it('returns templates for postmortem category', () => {
    const templates = getTemplatesByCategory('postmortem');
    expect(templates.length).toBe(1);
  });

  it('returns empty array for unknown category', () => {
    const templates = getTemplatesByCategory('nonexistent');
    expect(templates).toEqual([]);
  });
});

describe('getTemplateByName', () => {
  it('finds Initial Slack Notification', () => {
    const t = getTemplateByName('Initial Slack Notification');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Initial Slack Notification');
  });

  it('finds Status Page Update', () => {
    const t = getTemplateByName('Status Page Update');
    expect(t).toBeDefined();
  });

  it('is case-insensitive', () => {
    const t = getTemplateByName('initial slack notification');
    expect(t).toBeDefined();
  });

  it('returns undefined for nonexistent template', () => {
    const t = getTemplateByName('Nonexistent Template');
    expect(t).toBeUndefined();
  });
});

describe('applyTemplateVariables', () => {
  it('replaces {service} in subject and body', () => {
    // biome-ignore lint/style/noNonNullAssertion: suppressed for existing code
    const template = getTemplateByName('Initial Slack Notification')!;
    const result = applyTemplateVariables(template, {
      service: 'my-api',
      severity: 'critical',
    });
    expect(result.subject).toContain('my-api');
    expect(result.body).toContain('my-api');
  });

  it('replaces multiple variables', () => {
    // biome-ignore lint/style/noNonNullAssertion: suppressed for existing code
    const template = getTemplateByName('Initial Slack Notification')!;
    const result = applyTemplateVariables(template, {
      service: 'payment-svc',
      severity: 'high',
      team: 'billing',
      time: '2025-01-01T00:00:00Z',
      impact: '503 errors',
      dashboard_url: 'https://grafana.example.com',
      logs_url: 'https://logs.example.com',
      runbook_url: 'https://wiki.example.com',
      bridge_url: 'https://zoom.us/j/123',
    });
    expect(result.body).toContain('payment-svc');
    expect(result.body).toContain('billing');
    expect(result.body).toContain('503 errors');
  });

  it('leaves unmatched variables as-is', () => {
    // biome-ignore lint/style/noNonNullAssertion: suppressed for existing code
    const template = getTemplateByName('Initial Slack Notification')!;
    const result = applyTemplateVariables(template, {});
    expect(result.body).toContain('{service}');
    expect(result.body).toContain('{team}');
  });

  it('does not modify original template', () => {
    // biome-ignore lint/style/noNonNullAssertion: suppressed for existing code
    const template = getTemplateByName('Initial Slack Notification')!;
    const originalBody = template.body;
    applyTemplateVariables(template, { service: 'my-svc' });
    expect(template.body).toBe(originalBody);
  });
});

describe('createTemplate', () => {
  it('creates a template with given properties', () => {
    const t = createTemplate('My Template', 'slack', 'Test Subject', 'Test Body');
    expect(t.name).toBe('My Template');
    expect(t.type).toBe('slack');
    expect(t.subject).toBe('Test Subject');
    expect(t.body).toBe('Test Body');
  });

  it('generates a unique id', () => {
    const t1 = createTemplate('A', 'email', 'S', 'B');
    const t2 = createTemplate('B', 'email', 'S', 'B');
    expect(t1.id).toBeDefined();
    expect(t2.id).toBeDefined();
    expect(t1.id).not.toBe(t2.id);
  });
});
