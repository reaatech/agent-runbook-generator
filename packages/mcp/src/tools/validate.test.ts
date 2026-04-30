import { registerValidateTools } from '@reaatech/agent-runbook-mcp';
import { describe, expect, it } from 'vitest';

describe('registerValidateTools', () => {
  it('returns an array of 4 tools', () => {
    const tools = registerValidateTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools).toHaveLength(4);
  });

  it('each tool has name, description, and inputSchema', () => {
    const tools = registerValidateTools();
    for (const tool of tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
      expect(tool.inputSchema).toHaveProperty('properties');
      expect(tool.inputSchema).toHaveProperty('required');
    }
  });

  it('registers runbook.validate.completeness tool', () => {
    const tools = registerValidateTools();
    const compTool = tools.find((t) => t.name === 'runbook.validate.completeness');
    expect(compTool).toBeDefined();
    expect(compTool?.inputSchema.required).toContain('runbook');
    expect(compTool?.inputSchema.properties).toHaveProperty('runbook');
    expect(compTool?.inputSchema.properties).toHaveProperty('required_sections');
  });

  it('registers runbook.validate.accuracy tool', () => {
    const tools = registerValidateTools();
    const accTool = tools.find((t) => t.name === 'runbook.validate.accuracy');
    expect(accTool).toBeDefined();
    expect(accTool?.inputSchema.required).toContain('runbook');
    expect(accTool?.inputSchema.required).toContain('analysis_context');
    expect(accTool?.inputSchema.properties).toHaveProperty('runbook');
    expect(accTool?.inputSchema.properties).toHaveProperty('analysis_context');
  });

  it('registers runbook.validate.links tool', () => {
    const tools = registerValidateTools();
    const linksTool = tools.find((t) => t.name === 'runbook.validate.links');
    expect(linksTool).toBeDefined();
    expect(linksTool?.inputSchema.required).toContain('runbook');
    expect(linksTool?.inputSchema.properties).toHaveProperty('runbook');
  });

  it('registers runbook.validate.ci tool', () => {
    const tools = registerValidateTools();
    const ciTool = tools.find((t) => t.name === 'runbook.validate.ci');
    expect(ciTool).toBeDefined();
    expect(ciTool?.inputSchema.required).toContain('runbook');
    expect(ciTool?.inputSchema.properties).toHaveProperty('runbook');
    expect(ciTool?.inputSchema.properties).toHaveProperty('thresholds');
  });

  it('ci tool has threshold properties', () => {
    const tools = registerValidateTools();
    const ciTool = tools.find((t) => t.name === 'runbook.validate.ci');
    const thresholds = ciTool?.inputSchema.properties?.thresholds as Record<string, unknown>;
    expect(thresholds).toHaveProperty('properties');
    const threshProps = thresholds.properties as Record<string, unknown>;
    expect(threshProps).toHaveProperty('completeness_min');
    expect(threshProps).toHaveProperty('accuracy_min');
  });

  it('all tool names start with runbook.validate.', () => {
    const tools = registerValidateTools();
    for (const tool of tools) {
      expect(tool.name).toMatch(/^runbook\.validate\./);
    }
  });
});
