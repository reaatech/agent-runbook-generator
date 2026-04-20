/**
 * Shared utilities
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 */
export function directoryExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read a file and return its contents
 */
export function readFile(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return undefined;
  }
}

/**
 * Read a file as JSON
 */
export function readJsonFile<T>(filePath: string): T | undefined {
  const content = readFile(filePath);
  if (!content) return undefined;
  try {
    return JSON.parse(content) as T;
  } catch {
    return undefined;
  }
}

/**
 * List files in a directory
 */
export function listFiles(dirPath: string, recursive = false): string[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && recursive) {
        files.push(...listFiles(fullPath, recursive));
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  } catch {
    return [];
  }
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Sanitize a string for use as an anchor/link
 */
export function sanitizeAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Escape special characters for Markdown
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!|])/g, '\\$1');
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  const attempts = Math.max(1, maxAttempts);
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < attempts - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error('Retry failed with no error captured');
}

/**
 * Check if a string looks like a secret
 */
export function looksLikeSecret(value: string): boolean {
  const secretPatterns = [
    /api[_-]?key/i,
    /password/i,
    /secret/i,
    /token/i,
    /private[_-]?key/i,
    /access[_-]?key/i,
    /connection[_-]?string/i,
    /^(sk|pk|api|key|secret|token|pwd|pass)[_-]/i,
  ];

  return secretPatterns.some((pattern) => pattern.test(value));
}

/**
 * Redact potential secrets from a string
 */
export function redactSecrets(text: string): string {
  const secretKeys = [
    'password',
    'secret',
    'token',
    'api_key',
    'apikey',
    'api-key',
    'access_key',
    'accesskey',
    'access-key',
    'private_key',
    'privatekey',
    'private-key',
    'connection_string',
    'connectionstring',
  ];

  let sanitized = text;
  for (const key of secretKeys) {
    const pattern = new RegExp(`(${key}\\s*[=:]\\s*)([^\\s,;}"']+|[A-Za-z0-9+/=]+)`, 'gi');
    sanitized = sanitized.replace(pattern, '$1[REDACTED]');
  }

  return sanitized;
}

/**
 * Parse a duration string (e.g., "5m", "1h30m") into seconds
 */
export function parseDuration(duration: string): number {
  if (!duration || typeof duration !== 'string') return 0;

  const pattern = /(\d+)(ms|s|m|h|d)/g;
  let total = 0;
  let match: RegExpExecArray | null;
  let hasMatch = false;

  while ((match = pattern.exec(duration)) !== null) {
    hasMatch = true;
    const value = parseInt(match[1]!, 10);
    const unit = match[2];

    switch (unit) {
      case 'ms':
        total += value / 1000;
        break;
      case 's':
        total += value;
        break;
      case 'm':
        total += value * 60;
        break;
      case 'h':
        total += value * 3600;
        break;
      case 'd':
        total += value * 86400;
        break;
    }
  }

  if (!hasMatch) {
    const simpleMatch = duration.match(/^(\d+)$/);
    if (simpleMatch) return parseInt(simpleMatch[1]!, 10);
  }

  return total;
}

/**
 * Format seconds as a duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/**
 * Calculate a simple hash of a string
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Group items by a key
 */
export function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key]!.push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * Flatten a nested array
 */
export function flatten<T>(arrays: T[][]): T[] {
  return arrays.reduce((acc, arr) => acc.concat(arr), []);
}

/**
 * Remove duplicates from an array
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Check if a path is within a base directory (prevent directory traversal)
 */
export function isPathWithinBase(targetPath: string, basePath: string): boolean {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(basePath);
  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}

/**
 * Get the relative path from one path to another
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to);
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDirectory(dirPath: string): void {
  if (!directoryExists(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write content to a file
 */
export function writeFile(filePath: string, content: string): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Write JSON to a file
 */
export function writeJsonFile<T>(filePath: string, data: T): void {
  writeFile(filePath, JSON.stringify(data, null, 2));
}
