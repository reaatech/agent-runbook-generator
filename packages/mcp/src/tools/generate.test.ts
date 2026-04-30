import { registerGenerateTools } from '@reaatech/agent-runbook-mcp';
import { describe, expect, it } from 'vitest';

describe('registerGenerateTools', () => {
  it('returns an array of 7 tools', () => {
    const tools = registerGenerateTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools).toHaveLength(7);
  });

  it('each tool has name, description, and inputSchema', () => {
    const tools = registerGenerateTools();
    for (const tool of tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
      expect(tool.inputSchema).toHaveProperty('properties');
    }
  });

  it('registers runbook.generate.full tool', () => {
    const tools = registerGenerateTools();
    const fullTool = tools.find((t) => t.name === 'runbook.generate.full');
    expect(fullTool).toBeDefined();
    expect(fullTool?.inputSchema.required).toContain('analysis_context');
    expect(fullTool?.inputSchema.properties).toHaveProperty('analysis_context');
    expect(fullTool?.inputSchema.properties).toHaveProperty('config');
  });

  it('registers runbook.generate.alerts tool', () => {
    const tools = registerGenerateTools();
    const alertTool = tools.find((t) => t.name === 'runbook.generate.alerts');
    expect(alertTool).toBeDefined();
    expect(alertTool?.inputSchema.required).toContain('analysis_context');
    expect(alertTool?.inputSchema.required).toContain('platform');
    expect(alertTool?.inputSchema.properties).toHaveProperty('slo_targets');
  });

  it('registers runbook.generate.dashboard tool', () => {
    const tools = registerGenerateTools();
    const dashTool = tools.find((t) => t.name === 'runbook.generate.dashboard');
    expect(dashTool).toBeDefined();
    expect(dashTool?.inputSchema.required).toContain('service_context');
    expect(dashTool?.inputSchema.required).toContain('platform');
  });

  it('registers runbook.generate.rollback tool', () => {
    const tools = registerGenerateTools();
    const rbTool = tools.find((t) => t.name === 'runbook.generate.rollback');
    expect(rbTool).toBeDefined();
    expect(rbTool?.inputSchema.required).toContain('deployment_config');
    expect(rbTool?.inputSchema.properties).toHaveProperty('failure_scenarios');
  });

  it('registers runbook.generate.incident_workflow tool', () => {
    const tools = registerGenerateTools();
    const iwTool = tools.find((t) => t.name === 'runbook.generate.incident_workflow');
    expect(iwTool).toBeDefined();
    expect(iwTool?.inputSchema.required).toContain('service_context');
    expect(iwTool?.inputSchema.properties).toHaveProperty('team_config');
  });

  it('registers runbook.generate.service_map tool', () => {
    const tools = registerGenerateTools();
    const smTool = tools.find((t) => t.name === 'runbook.generate.service_map');
    expect(smTool).toBeDefined();
    expect(smTool?.inputSchema.required).toContain('analysis_context');
    expect(smTool?.inputSchema.properties).toHaveProperty('format');
  });

  it('registers runbook.generate.health_checks tool', () => {
    const tools = registerGenerateTools();
    const hcTool = tools.find((t) => t.name === 'runbook.generate.health_checks');
    expect(hcTool).toBeDefined();
    expect(hcTool?.inputSchema.required).toContain('service_context');
    expect(hcTool?.inputSchema.required).toContain('platform');
  });

  it('all tool names start with runbook.generate.', () => {
    const tools = registerGenerateTools();
    for (const tool of tools) {
      expect(tool.name).toMatch(/^runbook\.generate\./);
    }
  });
});
