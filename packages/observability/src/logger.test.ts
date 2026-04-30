import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createChildLogger,
  debug,
  error,
  getCurrentRunId,
  getLogger,
  info,
  initLogger,
  redactSensitiveData,
  setRunId,
  trace,
  warn,
} from '@reaatech/agent-runbook-observability';

describe('initLogger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes logger with config', async () => {
    await initLogger({ level: 'debug', service: 'test-service' });
    const logger = getLogger();
    expect(logger).toBeDefined();
  });

  it('initializes with runId', async () => {
    await initLogger({ level: 'info', service: 'test-service', runId: 'run-123' });
    expect(getCurrentRunId()).toBe('run-123');
  });

  it('generates a runId when not provided', async () => {
    await initLogger({ level: 'info', service: 'test-service' });
    const runId = getCurrentRunId();
    expect(runId).toMatch(/^run-/);
  });
});

describe('getLogger', () => {
  it('returns a logger instance', () => {
    const logger = getLogger();
    expect(logger).toBeDefined();
  });

  it('auto-initializes if not yet initialized', () => {
    const logger = getLogger();
    expect(logger).toBeDefined();
  });
});

describe('logging functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('info logs without throwing', async () => {
    await initLogger({ level: 'debug', service: 'test-service' });
    expect(() => info('test info message', { key: 'value' })).not.toThrow();
  });

  it('info logs message without data', async () => {
    await initLogger({ level: 'debug', service: 'test-service' });
    expect(() => info('test info message')).not.toThrow();
  });

  it('warn logs without throwing', async () => {
    await initLogger({ level: 'debug', service: 'test-service' });
    expect(() => warn('test warning', { code: 'WARN001' })).not.toThrow();
  });

  it('error logs without throwing', async () => {
    await initLogger({ level: 'debug', service: 'test-service' });
    expect(() => error('test error', { code: 'ERR001' })).not.toThrow();
  });

  it('error logs Error object', async () => {
    await initLogger({ level: 'debug', service: 'test-service' });
    const err = new Error('something broke');
    expect(() => error('test error', err)).not.toThrow();
  });

  it('debug logs without throwing', async () => {
    await initLogger({ level: 'debug', service: 'test-service' });
    expect(() => debug('debug message', { detail: 'x' })).not.toThrow();
  });

  it('trace logs without throwing', async () => {
    await initLogger({ level: 'debug', service: 'test-service' });
    expect(() => trace('trace message', { step: 1 })).not.toThrow();
  });
});

describe('createChildLogger', () => {
  it('creates a child logger', async () => {
    await initLogger({ level: 'info', service: 'test-service' });
    const child = createChildLogger({ module: 'analyzer' });
    expect(child).toBeDefined();
  });
});

describe('setRunId', () => {
  it('sets the run id', async () => {
    await initLogger({ level: 'info', service: 'test-service' });
    setRunId('run-custom-456');
    expect(getCurrentRunId()).toBe('run-custom-456');
  });

  it('returns the updated run id', async () => {
    await initLogger({ level: 'info', service: 'test-service' });
    setRunId('run-new');
    expect(getCurrentRunId()).toBe('run-new');
  });
});

describe('redactSensitiveData', () => {
  it('redacts password field', () => {
    const result = redactSensitiveData({ password: 'secret123', username: 'admin' });
    expect(result.password).toBe('[REDACTED]');
    expect(result.username).toBe('admin');
  });

  it('redacts api_key field', () => {
    const result = redactSensitiveData({ api_key: 'sk-abc', name: 'svc' });
    expect(result.api_key).toBe('[REDACTED]');
    expect(result.name).toBe('svc');
  });

  it('redacts secret field', () => {
    const result = redactSensitiveData({ secret: 'my-secret' });
    expect(result.secret).toBe('[REDACTED]');
  });

  it('redacts token field', () => {
    const result = redactSensitiveData({ token: 'jwt-token' });
    expect(result.token).toBe('[REDACTED]');
  });

  it('redacts auth field', () => {
    const result = redactSensitiveData({ auth: 'Bearer xyz' });
    expect(result.auth).toBe('[REDACTED]');
  });

  it('does not modify non-sensitive fields', () => {
    const data = { port: 3000, host: 'localhost', timeout: 5000 };
    const result = redactSensitiveData(data);
    expect(result).toEqual(data);
  });

  it('handles empty object', () => {
    const result = redactSensitiveData({});
    expect(result).toEqual({});
  });

  it('does not mutate original object', () => {
    const original = { password: 'secret', name: 'test' };
    const result = redactSensitiveData(original);
    expect(original.password).toBe('secret');
    expect(result.password).toBe('[REDACTED]');
  });

  it('redacts when key contains a sensitive substring', () => {
    const result = redactSensitiveData({ MY_password: 'abc' });
    expect(result.MY_password).toBe('[REDACTED]');
  });
});
