import { extractAlerts, generateDefaultAlerts } from '@reaatech/agent-runbook-alerts';
import { describe, expect, it } from 'vitest';

describe('extractAlerts', () => {
  it('returns structured result with alerts, sloAlerts, resourceAlerts', () => {
    const result = extractAlerts(process.cwd());
    expect(result).toHaveProperty('alerts');
    expect(result).toHaveProperty('sloAlerts');
    expect(result).toHaveProperty('resourceAlerts');
    expect(Array.isArray(result.alerts)).toBe(true);
    expect(Array.isArray(result.sloAlerts)).toBe(true);
    expect(Array.isArray(result.resourceAlerts)).toBe(true);
  });

  it('returns empty arrays for a directory with no alert configs', () => {
    const result = extractAlerts('/tmp');
    expect(result.alerts).toEqual([]);
    expect(result.sloAlerts).toEqual([]);
    expect(result.resourceAlerts).toEqual([]);
  });
});

describe('generateDefaultAlerts', () => {
  it('generates base alerts with no flags', () => {
    const alerts = generateDefaultAlerts('my-svc', false, false, false);
    expect(alerts.length).toBeGreaterThanOrEqual(2);
    expect(alerts.every((a) => a.name.startsWith('my-svc'))).toBe(true);
  });

  it('includes database alert when hasDatabase is true', () => {
    const alerts = generateDefaultAlerts('my-svc', true, false, false);
    expect(alerts.some((a) => a.name.includes('database'))).toBe(true);
  });

  it('includes cache alert when hasCache is true', () => {
    const alerts = generateDefaultAlerts('my-svc', false, true, false);
    expect(alerts.some((a) => a.name.includes('cache'))).toBe(true);
  });

  it('includes queue alert when hasQueue is true', () => {
    const alerts = generateDefaultAlerts('my-svc', false, false, true);
    expect(alerts.some((a) => a.name.includes('queue'))).toBe(true);
  });

  it('includes all extras when all flags true', () => {
    const alerts = generateDefaultAlerts('my-svc', true, true, true);
    expect(alerts.some((a) => a.name.includes('database'))).toBe(true);
    expect(alerts.some((a) => a.name.includes('cache'))).toBe(true);
    expect(alerts.some((a) => a.name.includes('queue'))).toBe(true);
  });
});
