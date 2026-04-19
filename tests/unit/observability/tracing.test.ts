import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSpan = {
  setStatus: vi.fn(),
  end: vi.fn(),
  recordException: vi.fn(),
  setAttribute: vi.fn(),
};

const mockTracer = {
  startSpan: vi.fn(() => mockSpan),
};

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn(() => mockTracer),
  },
  Span: {},
  SpanStatusCode: { OK: 'OK', ERROR: 'ERROR' },
}));

vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: vi.fn(() => ({
    addSpanProcessor: vi.fn(),
    register: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@opentelemetry/sdk-trace-base', () => ({
  BatchSpanProcessor: vi.fn().mockImplementation(() => ({})),
  SimpleSpanProcessor: vi.fn().mockImplementation(() => ({})),
  ConsoleSpanExporter: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: vi.fn().mockImplementation(() => ({})),
}));

import {
  initTracing,
  getTracer,
  startGenerationSpan,
  startAnalysisSpan,
  startCodeAnalysisSpan,
  startAgentSpan,
  startSectionSpan,
  startValidationSpan,
  endSpanSuccess,
  endSpanError,
  shutdownTracing,
} from '../../../src/observability/tracing.js';

describe('initTracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes without error when enabled', () => {
    expect(() => initTracing({ serviceName: 'test', enabled: true })).not.toThrow();
  });

  it('does not throw when disabled', () => {
    expect(() => initTracing({ serviceName: 'test', enabled: false })).not.toThrow();
  });
});

describe('getTracer', () => {
  it('returns a tracer instance', () => {
    const tracer = getTracer();
    expect(tracer).toBeDefined();
    expect(tracer).toHaveProperty('startSpan');
  });
});

describe('startGenerationSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a span with service name and repo path', () => {
    const span = startGenerationSpan('my-service', '/repos/my-service');
    expect(mockTracer.startSpan).toHaveBeenCalledWith('runbook.generate', {
      attributes: {
        service_name: 'my-service',
        repo_path: '/repos/my-service',
      },
    });
    expect(span).toBe(mockSpan);
  });
});

describe('startAnalysisSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a span with language, file count, and config files', () => {
    const span = startAnalysisSpan('typescript', 42, ['package.json', 'tsconfig.json']);
    expect(mockTracer.startSpan).toHaveBeenCalledWith('repository.scan', {
      attributes: {
        language: 'typescript',
        file_count: 42,
        config_files: ['package.json', 'tsconfig.json'],
      },
    });
    expect(span).toBe(mockSpan);
  });
});

describe('startCodeAnalysisSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a span with entry points, endpoints, and external services', () => {
    const span = startCodeAnalysisSpan(
      ['src/index.ts'],
      ['/api/health'],
      ['postgres'],
    );
    expect(mockTracer.startSpan).toHaveBeenCalledWith('code.analyze', {
      attributes: {
        entry_points: ['src/index.ts'],
        endpoints: ['/api/health'],
        external_services: ['postgres'],
      },
    });
    expect(span).toBe(mockSpan);
  });
});

describe('startAgentSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a span with provider, model, and tokens', () => {
    const span = startAgentSpan('claude', 'claude-opus-4-5-20260506', 1000);
    expect(mockTracer.startSpan).toHaveBeenCalledWith('agent.analyze', {
      attributes: {
        provider: 'claude',
        model: 'claude-opus-4-5-20260506',
        tokens: 1000,
      },
    });
    expect(span).toBe(mockSpan);
  });
});

describe('startSectionSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a span with section type', () => {
    const span = startSectionSpan('alerts');
    expect(mockTracer.startSpan).toHaveBeenCalledWith('section.generate', {
      attributes: { section_type: 'alerts' },
    });
    expect(span).toBe(mockSpan);
  });
});

describe('startValidationSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a span with completeness and accuracy scores', () => {
    const span = startValidationSpan(0.85, 0.92);
    expect(mockTracer.startSpan).toHaveBeenCalledWith('runbook.validate', {
      attributes: {
        completeness_score: 0.85,
        accuracy_score: 0.92,
      },
    });
    expect(span).toBe(mockSpan);
  });
});

describe('endSpanSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets OK status and ends the span', () => {
    endSpanSuccess(mockSpan as never);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 'OK' });
    expect(mockSpan.end).toHaveBeenCalled();
  });
});

describe('endSpanError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets ERROR status, records exception, and ends span', () => {
    const err = new Error('test error');
    endSpanError(mockSpan as never, err);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 'ERROR', message: 'test error' });
    expect(mockSpan.recordException).toHaveBeenCalledWith(err);
    expect(mockSpan.end).toHaveBeenCalled();
  });
});

describe('shutdownTracing', () => {
  it('resolves without error', async () => {
    initTracing({ serviceName: 'test', enabled: true });
    await expect(shutdownTracing()).resolves.toBeUndefined();
  });

  it('does not throw when tracing is disabled', async () => {
    initTracing({ serviceName: 'test', enabled: false });
    await expect(shutdownTracing()).resolves.toBeUndefined();
  });
});
