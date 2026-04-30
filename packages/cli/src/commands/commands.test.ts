import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@reaatech/agent-runbook-analyzer', () => ({
  analyzeRepository: vi.fn(() => ({
    serviceName: 'mock-service',
    language: 'typescript',
    framework: 'express',
    serviceType: 'web-api',
    fileCount: 10,
    configFiles: ['package.json'],
    entryPoints: [],
    externalServices: [],
    structure: {
      mainDirectories: ['src'],
      fileCount: 10,
      depth: 3,
      hasTests: true,
      hasDockerfile: false,
      hasKubernetesManifests: false,
      hasTerraform: false,
    },
  })),
  analyzeDependencies: vi.fn(() => ({
    directDeps: [],
    transitiveDeps: [],
    dependencyGraph: [],
    externalServices: [],
  })),
}));

vi.mock('@reaatech/agent-runbook-runbook', () => ({
  generateFullRunbook: vi.fn(() => ({
    id: 'rb-1',
    title: 'Test Runbook',
    sections: [{ type: 'overview', content: 'test' }],
  })),
  formatRunbook: vi.fn(() => '# Runbook\n\ntest content'),
  validateCompleteness: vi.fn(() => ({
    score: 0.9,
    missingSections: [],
    suggestions: [],
    sectionScores: {},
  })),
}));

vi.mock('@reaatech/agent-runbook-observability', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  initLogger: vi.fn(),
  startAnalysisSpan: vi.fn(() => ({ setStatus: vi.fn(), end: vi.fn() })),
  startGenerationSpan: vi.fn(() => ({ setStatus: vi.fn(), end: vi.fn() })),
  startValidationSpan: vi.fn(() => ({ setStatus: vi.fn(), end: vi.fn() })),
  endSpanSuccess: vi.fn(),
  endSpanError: vi.fn(),
  recordGeneration: vi.fn(),
  recordSectionGenerated: vi.fn(),
}));

vi.mock('@reaatech/agent-runbook-mcp', () => ({
  createMCPServer: vi.fn(() =>
    Promise.resolve({
      stop: vi.fn().mockResolvedValue(undefined),
    }),
  ),
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn(() => '{"content": "test"}'),
  writeFileSync: vi.fn(),
}));

describe('analyzeCommand', () => {
  it('registers the analyze command on a Commander program', async () => {
    const { analyzeCommand } = await import('./analyze.command.js');
    const program = new Command();
    analyzeCommand(program);
    const cmds = program.commands.map((c) => c.name());
    expect(cmds).toContain('analyze');
  });

  it('registers analyze command with correct options', async () => {
    const { analyzeCommand } = await import('./analyze.command.js');
    const program = new Command();
    analyzeCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'analyze');
    expect(cmd).toBeDefined();
    expect(cmd?.options.map((o) => o.long)).toContain('--depth');
    expect(cmd?.options.map((o) => o.long)).toContain('--output');
    expect(cmd?.options.map((o) => o.long)).toContain('--json');
  });
});

describe('generateCommand', () => {
  it('registers the generate command on a Commander program', async () => {
    const { generateCommand } = await import('./generate.command.js');
    const program = new Command();
    generateCommand(program);
    const cmds = program.commands.map((c) => c.name());
    expect(cmds).toContain('generate');
  });

  it('registers generate command with correct options', async () => {
    const { generateCommand } = await import('./generate.command.js');
    const program = new Command();
    generateCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'generate');
    expect(cmd).toBeDefined();
    expect(cmd?.options.map((o) => o.long)).toContain('--output');
    expect(cmd?.options.map((o) => o.long)).toContain('--format');
    expect(cmd?.options.map((o) => o.long)).toContain('--provider');
  });
});

describe('validateCommand', () => {
  it('registers the validate command on a Commander program', async () => {
    const { validateCommand } = await import('./validate.command.js');
    const program = new Command();
    validateCommand(program);
    const cmds = program.commands.map((c) => c.name());
    expect(cmds).toContain('validate');
  });

  it('registers validate command with correct options', async () => {
    const { validateCommand } = await import('./validate.command.js');
    const program = new Command();
    validateCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'validate');
    expect(cmd).toBeDefined();
    expect(cmd?.options.map((o) => o.long)).toContain('--ci');
    expect(cmd?.options.map((o) => o.long)).toContain('--completeness-threshold');
    expect(cmd?.options.map((o) => o.long)).toContain('--accuracy-threshold');
    expect(cmd?.options.map((o) => o.long)).toContain('--json');
  });
});

describe('exportCommand', () => {
  it('registers the export command on a Commander program', async () => {
    const { exportCommand } = await import('./export.command.js');
    const program = new Command();
    exportCommand(program);
    const cmds = program.commands.map((c) => c.name());
    expect(cmds).toContain('export');
  });

  it('registers export command with correct options', async () => {
    const { exportCommand } = await import('./export.command.js');
    const program = new Command();
    exportCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'export');
    expect(cmd).toBeDefined();
    expect(cmd?.options.map((o) => o.long)).toContain('--output');
    expect(cmd?.options.map((o) => o.long)).toContain('--format');
    expect(cmd?.options.map((o) => o.long)).toContain('--include-toc');
  });
});

describe('serveCommand', () => {
  it('registers the serve command on a Commander program', async () => {
    const { serveCommand } = await import('./serve.command.js');
    const program = new Command();
    serveCommand(program);
    const cmds = program.commands.map((c) => c.name());
    expect(cmds).toContain('serve');
  });

  it('registers serve command with correct options', async () => {
    const { serveCommand } = await import('./serve.command.js');
    const program = new Command();
    serveCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'serve');
    expect(cmd).toBeDefined();
    expect(cmd?.options.map((o) => o.long)).toContain('--port');
    expect(cmd?.options.map((o) => o.long)).toContain('--host');
    expect(cmd?.options.map((o) => o.long)).toContain('--otel-endpoint');
    expect(cmd?.options.map((o) => o.long)).toContain('--log-level');
  });
});
