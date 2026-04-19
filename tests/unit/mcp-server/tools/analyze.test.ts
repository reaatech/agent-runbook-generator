import { describe, it, expect } from 'vitest';
import { registerAnalyzeTools } from '../../../../src/mcp-server/tools/analyze/index.js';

describe('registerAnalyzeTools', () => {
  it('returns an array of 5 tools', () => {
    const tools = registerAnalyzeTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools).toHaveLength(5);
  });

  it('each tool has name, description, and inputSchema', () => {
    const tools = registerAnalyzeTools();
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

  it('registers runbook.analyze.repository tool', () => {
    const tools = registerAnalyzeTools();
    const repoTool = tools.find((t) => t.name === 'runbook.analyze.repository');
    expect(repoTool).toBeDefined();
    expect(repoTool!.inputSchema.required).toContain('path');
    expect(repoTool!.inputSchema.properties).toHaveProperty('path');
    expect(repoTool!.inputSchema.properties).toHaveProperty('depth');
    expect(repoTool!.inputSchema.properties).toHaveProperty('include_patterns');
    expect(repoTool!.inputSchema.properties).toHaveProperty('exclude_patterns');
  });

  it('registers runbook.analyze.dependencies tool', () => {
    const tools = registerAnalyzeTools();
    const depsTool = tools.find((t) => t.name === 'runbook.analyze.dependencies');
    expect(depsTool).toBeDefined();
    expect(depsTool!.inputSchema.required).toContain('path');
    expect(depsTool!.inputSchema.properties).toHaveProperty('path');
    expect(depsTool!.inputSchema.properties).toHaveProperty('include_dev');
  });

  it('registers runbook.analyze.failure_modes tool', () => {
    const tools = registerAnalyzeTools();
    const fmTool = tools.find((t) => t.name === 'runbook.analyze.failure_modes');
    expect(fmTool).toBeDefined();
    expect(fmTool!.inputSchema.required).toContain('analysis_context');
    expect(fmTool!.inputSchema.properties).toHaveProperty('analysis_context');
    expect(fmTool!.inputSchema.properties).toHaveProperty('depth');
  });

  it('registers runbook.analyze.alerts tool', () => {
    const tools = registerAnalyzeTools();
    const alertTool = tools.find((t) => t.name === 'runbook.analyze.alerts');
    expect(alertTool).toBeDefined();
    expect(alertTool!.inputSchema.required).toContain('path');
    expect(alertTool!.inputSchema.properties).toHaveProperty('path');
    expect(alertTool!.inputSchema.properties).toHaveProperty('platform');
  });

  it('registers runbook.analyze.health_checks tool', () => {
    const tools = registerAnalyzeTools();
    const hcTool = tools.find((t) => t.name === 'runbook.analyze.health_checks');
    expect(hcTool).toBeDefined();
    expect(hcTool!.inputSchema.required).toContain('analysis_context');
    expect(hcTool!.inputSchema.properties).toHaveProperty('analysis_context');
  });

  it('all tool names start with runbook.analyze.', () => {
    const tools = registerAnalyzeTools();
    for (const tool of tools) {
      expect(tool.name).toMatch(/^runbook\.analyze\./);
    }
  });
});
