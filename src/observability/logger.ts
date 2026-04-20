/**
 * Logger - Structured JSON logging using pino
 */

import { createRequire } from 'module';
import type { Logger as PinoLogger } from 'pino';

const require = createRequire(import.meta.url);
const pino = require('pino');

export interface LoggerConfig {
  level: string;
  service: string;
  runId?: string;
  stderr?: boolean;
}

let logger: PinoLogger | null = null;
let currentRunId: string | null = null;

const SENSITIVE_KEYS = [
  'password',
  'api_key',
  'secret',
  'token',
  'auth',
  'credential',
  'access_key',
  'private_key',
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((s) => lower.includes(s));
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function createPinoLogger(config: LoggerConfig): PinoLogger {
  const options = {
    level: config.level || 'info',
    base: {
      service: config.service,
      run_id: config.runId,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  };

  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  const isDevEnv = process.env.NODE_ENV === 'development';

  if (config.stderr) {
    return pino({ ...options, level: config.level || 'info' }, pino.destination(2));
  }

  if (isDevEnv && !isTestEnv) {
    try {
      return pino({
        ...options,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        },
      });
    } catch {
      return pino(options);
    }
  }

  return pino(options);
}

/**
 * Initialize logger
 */
export async function initLogger(config: LoggerConfig): Promise<void> {
  currentRunId = config.runId ?? generateRunId();
  logger = createPinoLogger({ ...config, runId: currentRunId });
}

/**
 * Get logger instance
 */
export function getLogger(): PinoLogger {
  if (!logger) {
    logger = createPinoLogger({ level: 'info', service: 'agent-runbook-generator' });
  }
  return logger;
}

/**
 * Get current run ID
 */
export function getCurrentRunId(): string | null {
  return currentRunId;
}

/**
 * Generate a unique run ID
 */
function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Set run ID
 */
export function setRunId(runId: string): void {
  currentRunId = runId;
  if (logger) {
    logger = logger.child({ run_id: runId });
  }
}

/**
 * Create child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>): PinoLogger {
  return getLogger().child(redactObject(context));
}

/**
 * Redact sensitive data from an object
 */
export function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  return redactObject(data);
}

/**
 * Log info message
 */
export function info(message: string, meta?: Record<string, unknown>): void {
  getLogger().info(redactObject(meta || {}), message);
}

/**
 * Log warning message
 */
export function warn(message: string, meta?: Record<string, unknown>): void {
  getLogger().warn(redactObject(meta || {}), message);
}

/**
 * Log error message
 */
export function error(message: string, meta?: Record<string, unknown> | Error): void {
  if (meta instanceof Error) {
    getLogger().error(
      {
        err: {
          message: meta.message,
          name: meta.name,
          stack: meta.stack,
        },
      },
      message,
    );
  } else {
    getLogger().error(redactObject(meta || {}), message);
  }
}

/**
 * Log debug message
 */
export function debug(message: string, meta?: Record<string, unknown>): void {
  getLogger().debug(redactObject(meta || {}), message);
}

/**
 * Log trace message
 */
export function trace(message: string, meta?: Record<string, unknown>): void {
  getLogger().trace(redactObject(meta || {}), message);
}
