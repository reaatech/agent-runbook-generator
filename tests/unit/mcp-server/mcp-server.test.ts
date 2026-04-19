import { describe, it, expect, vi } from 'vitest';
import { RunbookMCPServer } from '../../../src/mcp-server/mcp-server.js';

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  const handlers: Record<string, (...args: unknown[]) => unknown> = {};
  return {
    Server: vi.fn().mockImplementation(() => ({
      setRequestHandler: vi.fn((schema, handler) => {
        handlers[schema?.name ?? 'unknown'] = handler;
      }),
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      _handlers: handlers,
    })),
  };
});

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: { name: 'CallToolRequest' },
  ListToolsRequestSchema: { name: 'ListToolsRequest' },
}));

describe('RunbookMCPServer', () => {
  it('constructs with config', () => {
    const server = new RunbookMCPServer({
      name: 'test-server',
      version: '1.0.0',
    });
    expect(server).toBeInstanceOf(RunbookMCPServer);
  });

  it('constructs with port config', () => {
    const server = new RunbookMCPServer({
      name: 'test-server',
      version: '2.0.0',
      port: 8080,
    });
    expect(server).toBeInstanceOf(RunbookMCPServer);
  });

  describe('start', () => {
    it('starts without error', async () => {
      const server = new RunbookMCPServer({
        name: 'test-server',
        version: '1.0.0',
      });
      await expect(server.start()).resolves.toBeUndefined();
    });
  });

  describe('stop', () => {
    it('stops without error', async () => {
      const server = new RunbookMCPServer({
        name: 'test-server',
        version: '1.0.0',
      });
      await expect(server.stop()).resolves.toBeUndefined();
    });
  });

  describe('tool registration', () => {
    it('registers analysis tools', async () => {
      const { registerAnalyzeTools } = await import('../../../src/mcp-server/tools/analyze/index.js');
      const tools = registerAnalyzeTools();
      expect(tools.length).toBe(5);
      const names = tools.map((t) => t.name);
      expect(names).toContain('runbook.analyze.repository');
      expect(names).toContain('runbook.analyze.dependencies');
      expect(names).toContain('runbook.analyze.failure_modes');
      expect(names).toContain('runbook.analyze.alerts');
      expect(names).toContain('runbook.analyze.health_checks');
    });

    it('registers generation tools', async () => {
      const { registerGenerateTools } = await import('../../../src/mcp-server/tools/generate/index.js');
      const tools = registerGenerateTools();
      expect(tools.length).toBe(7);
      const names = tools.map((t) => t.name);
      expect(names).toContain('runbook.generate.full');
      expect(names).toContain('runbook.generate.alerts');
      expect(names).toContain('runbook.generate.dashboard');
      expect(names).toContain('runbook.generate.rollback');
      expect(names).toContain('runbook.generate.incident_workflow');
      expect(names).toContain('runbook.generate.service_map');
      expect(names).toContain('runbook.generate.health_checks');
    });

    it('registers validation tools', async () => {
      const { registerValidateTools } = await import('../../../src/mcp-server/tools/validate/index.js');
      const tools = registerValidateTools();
      expect(tools.length).toBe(4);
      const names = tools.map((t) => t.name);
      expect(names).toContain('runbook.validate.completeness');
      expect(names).toContain('runbook.validate.accuracy');
      expect(names).toContain('runbook.validate.links');
      expect(names).toContain('runbook.validate.ci');
    });
  });
});

describe('createMCPServer', () => {
  it('is exported and creates a server', async () => {
    const { createMCPServer } = await import('../../../src/mcp-server/mcp-server.js');
    const server = await createMCPServer({ name: 'test', version: '0.0.1' });
    expect(server).toBeInstanceOf(RunbookMCPServer);
    await server.stop();
  });

  it('uses default config when none provided', async () => {
    const { createMCPServer } = await import('../../../src/mcp-server/mcp-server.js');
    const server = await createMCPServer();
    expect(server).toBeInstanceOf(RunbookMCPServer);
    await server.stop();
  });
});
