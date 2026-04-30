import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  fileExists,
  directoryExists,
  readFile,
  readJsonFile,
  listFiles,
  generateId,
  sanitizeAnchor,
  escapeMarkdown,
  truncate,
  sleep,
  retry,
  looksLikeSecret,
  redactSecrets,
  parseDuration,
  formatDuration,
  simpleHash,
  groupBy,
  flatten,
  unique,
  isPathWithinBase,
  getRelativePath,
  ensureDirectory,
  writeFile,
  writeJsonFile,
} from './utils.js';

describe('fileExists', () => {
  it('returns true for an existing file', () => {
    expect(fileExists(import.meta.url.replace('file://', ''))).toBe(true);
  });

  it('returns false for a non-existent file', () => {
    expect(fileExists('/nonexistent/file/abc.txt')).toBe(false);
  });

  it('returns false for a directory path', () => {
    expect(fileExists(process.cwd())).toBe(false);
  });
});

describe('directoryExists', () => {
  it('returns true for an existing directory', () => {
    expect(directoryExists(process.cwd())).toBe(true);
  });

  it('returns false for a non-existent directory', () => {
    expect(directoryExists('/nonexistent/dir/xyz')).toBe(false);
  });

  it('returns false for a file path', () => {
    expect(directoryExists(import.meta.url.replace('file://', ''))).toBe(false);
  });
});

describe('readFile', () => {
  it('reads an existing file', () => {
    const pkg = readFile(path.join(process.cwd(), 'package.json'));
    expect(pkg).toBeDefined();
    expect(pkg).toContain('"name"');
  });

  it('returns undefined for a non-existent file', () => {
    expect(readFile('/nonexistent/file.txt')).toBeUndefined();
  });
});

describe('readJsonFile', () => {
  it('parses a valid JSON file', () => {
    const result = readJsonFile<Record<string, unknown>>(path.join(process.cwd(), 'package.json'));
    expect(result).toBeDefined();
    expect(result!.name).toBeDefined();
  });

  it('returns undefined for non-existent file', () => {
    expect(readJsonFile('/nope.json')).toBeUndefined();
  });

  it('returns undefined for invalid JSON', () => {
    const tmp = path.join(os.tmpdir(), `test-invalid-${Date.now()}.json`);
    fs.writeFileSync(tmp, 'not json{{{');
    expect(readJsonFile(tmp)).toBeUndefined();
    fs.unlinkSync(tmp);
  });
});

describe('listFiles', () => {
  it('lists files in a directory', () => {
    const files = listFiles(process.cwd());
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.includes('package.json'))).toBe(true);
  });

  it('returns empty array for non-existent directory', () => {
    expect(listFiles('/nonexistent')).toEqual([]);
  });

  it('lists recursively when flag is true', () => {
    const files = listFiles(path.join(process.cwd(), 'src'), true);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.includes(path.sep))).toBe(true);
  });
});

describe('generateId', () => {
  it('generates an id without prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });

  it('generates an id with prefix', () => {
    const id = generateId('test');
    expect(id).toMatch(/^test-/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('sanitizeAnchor', () => {
  it('lowercases and replaces non-alphanumeric with dashes', () => {
    expect(sanitizeAnchor('Hello World!')).toBe('hello-world');
  });

  it('strips leading and trailing dashes', () => {
    expect(sanitizeAnchor('--foo--')).toBe('foo');
  });

  it('handles empty string', () => {
    expect(sanitizeAnchor('')).toBe('');
  });
});

describe('escapeMarkdown', () => {
  it('escapes backticks', () => {
    expect(escapeMarkdown('use `code`')).toBe('use \\`code\\`');
  });

  it('escapes asterisks', () => {
    expect(escapeMarkdown('bold **text**')).toBe('bold \\*\\*text\\*\\*');
  });

  it('returns unchanged string when no special chars', () => {
    expect(escapeMarkdown('hello world')).toBe('hello world');
  });
});

describe('truncate', () => {
  it('returns the string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('sleep', () => {
  it('resolves after the specified delay', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe('retry', () => {
  it('returns the result on first attempt', async () => {
    const result = await retry(() => Promise.resolve('ok'), 3, 10);
    expect(result).toBe('ok');
  });

  it('retries on failure and eventually succeeds', async () => {
    let attempts = 0;
    const result = await retry(
      () => {
        attempts++;
        if (attempts < 3) return Promise.reject(new Error('fail'));
        return Promise.resolve('done');
      },
      3,
      10,
    );
    expect(result).toBe('done');
    expect(attempts).toBe(3);
  });

  it('throws after exhausting all attempts', async () => {
    await expect(retry(() => Promise.reject(new Error('nope')), 2, 10)).rejects.toThrow('nope');
  });
});

describe('looksLikeSecret', () => {
  it('detects api_key', () => {
    expect(looksLikeSecret('api_key')).toBe(true);
  });

  it('detects password', () => {
    expect(looksLikeSecret('password')).toBe(true);
  });

  it('detects token', () => {
    expect(looksLikeSecret('token')).toBe(true);
  });

  it('does not flag normal names', () => {
    expect(looksLikeSecret('username')).toBe(false);
    expect(looksLikeSecret('port')).toBe(false);
  });
});

describe('redactSecrets', () => {
  it('redacts password values', () => {
    expect(redactSecrets('password=secret123')).toContain('[REDACTED]');
  });

  it('redacts api_key values', () => {
    expect(redactSecrets('api_key: abcdefgh')).toContain('[REDACTED]');
  });

  it('leaves long alphanumeric strings that are not secret keys unchanged', () => {
    expect(redactSecrets('key=abcdefghijklmnopqrstuvwxyz123456')).toBe(
      'key=abcdefghijklmnopqrstuvwxyz123456',
    );
  });

  it('leaves normal text unchanged', () => {
    expect(redactSecrets('hello world')).toBe('hello world');
  });
});

describe('parseDuration', () => {
  it('parses seconds', () => {
    expect(parseDuration('30s')).toBe(30);
  });

  it('parses minutes', () => {
    expect(parseDuration('5m')).toBe(300);
  });

  it('parses hours', () => {
    expect(parseDuration('2h')).toBe(7200);
  });

  it('parses days', () => {
    expect(parseDuration('1d')).toBe(86400);
  });

  it('parses milliseconds', () => {
    expect(parseDuration('500ms')).toBe(0.5);
  });

  it('defaults to seconds when no unit', () => {
    expect(parseDuration('10')).toBe(10);
  });

  it('returns 0 for invalid input', () => {
    expect(parseDuration('abc')).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(30)).toBe('30s');
  });

  it('formats minutes', () => {
    expect(formatDuration(120)).toBe('2m');
  });

  it('formats hours', () => {
    expect(formatDuration(7200)).toBe('2h');
  });

  it('formats days', () => {
    expect(formatDuration(86400)).toBe('1d');
  });
});

describe('simpleHash', () => {
  it('returns a number', () => {
    expect(typeof simpleHash('test')).toBe('number');
  });

  it('returns consistent hashes', () => {
    expect(simpleHash('hello')).toBe(simpleHash('hello'));
  });

  it('returns different hashes for different strings', () => {
    expect(simpleHash('hello')).not.toBe(simpleHash('world'));
  });
});

describe('groupBy', () => {
  it('groups items by key', () => {
    const items = [
      { type: 'a', val: 1 },
      { type: 'b', val: 2 },
      { type: 'a', val: 3 },
    ];
    const result = groupBy(items, (i) => i.type);
    expect(result.a).toHaveLength(2);
    expect(result.b).toHaveLength(1);
  });

  it('returns empty object for empty array', () => {
    expect(groupBy([], () => 'x' as never)).toEqual({});
  });
});

describe('flatten', () => {
  it('flattens nested arrays', () => {
    expect(flatten([[1, 2], [3], [4, 5]])).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles empty arrays', () => {
    expect(flatten([[], []])).toEqual([]);
  });
});

describe('unique', () => {
  it('removes duplicates', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('handles strings', () => {
    expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });
});

describe('isPathWithinBase', () => {
  it('returns true for a subdirectory', () => {
    expect(isPathWithinBase('/foo/bar/baz', '/foo/bar')).toBe(true);
  });

  it('returns true for the base path itself', () => {
    expect(isPathWithinBase('/foo/bar', '/foo/bar')).toBe(true);
  });

  it('returns false for a sibling path', () => {
    expect(isPathWithinBase('/foo/baz', '/foo/bar')).toBe(false);
  });
});

describe('getRelativePath', () => {
  it('computes relative path', () => {
    const result = getRelativePath('/foo/bar', '/foo/bar/baz/qux');
    expect(result).toBe(path.join('baz', 'qux'));
  });
});

describe('ensureDirectory', () => {
  it('creates a directory if it does not exist', () => {
    const tmp = path.join(os.tmpdir(), `test-ensure-${Date.now()}`);
    ensureDirectory(tmp);
    expect(fs.statSync(tmp).isDirectory()).toBe(true);
    fs.rmdirSync(tmp);
  });

  it('does not throw for existing directory', () => {
    expect(() => ensureDirectory(os.tmpdir())).not.toThrow();
  });
});

describe('writeFile', () => {
  it('writes content to a file creating parent dirs', () => {
    const tmp = path.join(os.tmpdir(), `test-write-${Date.now()}`, 'file.txt');
    writeFile(tmp, 'hello');
    expect(fs.readFileSync(tmp, 'utf-8')).toBe('hello');
    fs.rmSync(path.dirname(tmp), { recursive: true });
  });
});

describe('writeJsonFile', () => {
  it('writes JSON to a file', () => {
    const tmp = path.join(os.tmpdir(), `test-json-${Date.now()}`, 'data.json');
    writeJsonFile(tmp, { a: 1 });
    const content = JSON.parse(fs.readFileSync(tmp, 'utf-8'));
    expect(content.a).toBe(1);
    fs.rmSync(path.dirname(tmp), { recursive: true });
  });
});
