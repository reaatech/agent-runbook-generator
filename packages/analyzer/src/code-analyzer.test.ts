import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { analyzeCode } from '@reaatech/agent-runbook-analyzer';

describe('analyzeCode', () => {
  it('returns a CodeAnalysis object with all required fields', () => {
    const result = analyzeCode(process.cwd(), 'typescript', 'express');
    expect(result).toHaveProperty('entryPoints');
    expect(result).toHaveProperty('apiEndpoints');
    expect(result).toHaveProperty('externalConnections');
    expect(result).toHaveProperty('backgroundJobs');
    expect(Array.isArray(result.entryPoints)).toBe(true);
    expect(Array.isArray(result.apiEndpoints)).toBe(true);
    expect(Array.isArray(result.externalConnections)).toBe(true);
    expect(Array.isArray(result.backgroundJobs)).toBe(true);
  });

  it('returns empty arrays for a directory with no matching files', () => {
    const tmpDir = path.join(os.tmpdir(), `code-analyzer-empty-${Date.now()}`);
    fs.mkdirSync(tmpDir);
    const result = analyzeCode(tmpDir, 'typescript', 'express');
    expect(result.entryPoints).toEqual([]);
    expect(result.apiEndpoints).toEqual([]);
    expect(result.externalConnections).toEqual([]);
    expect(result.backgroundJobs).toEqual([]);
    fs.rmdirSync(tmpDir);
  });

  describe('with fixture files', () => {
    let fixtureDir: string;

    beforeAll(() => {
      fixtureDir = path.join(os.tmpdir(), `code-analyzer-fixtures-${Date.now()}`);
      fs.mkdirSync(fixtureDir);

      fs.writeFileSync(
        path.join(fixtureDir, 'server.ts'),
        [
          "import express from 'express';",
          'const app = express();',
          "app.get('/users', (req, res) => {});",
          "app.post('/users', (req, res) => {});",
          "app.delete('/users/:id', (req, res) => {});",
          'app.listen(3000);',
        ].join('\n'),
      );

      fs.writeFileSync(
        path.join(fixtureDir, 'db.ts'),
        [
          "const dbUrl = 'postgresql://localhost:5432/mydb';",
          'const client = connect(dbUrl);',
        ].join('\n'),
      );

      fs.writeFileSync(
        path.join(fixtureDir, 'worker.ts'),
        ['class EmailWorker {', '  process() {}', '}'].join('\n'),
      );

      fs.writeFileSync(
        path.join(fixtureDir, 'jobs.ts'),
        ["queue.queue('send-email');", "scheduler.schedule('daily-cleanup');"].join('\n'),
      );

      fs.writeFileSync(path.join(fixtureDir, 'cache.py'), "redis_url = 'redis://localhost:6379'");
    });

    afterAll(() => {
      fs.rmSync(fixtureDir, { recursive: true });
    });

    it('finds entry points from .listen() calls', () => {
      const result = analyzeCode(fixtureDir, 'typescript', 'express');
      expect(result.entryPoints.length).toBeGreaterThan(0);
      const listenEntry = result.entryPoints.find((e) => e.file.includes('server.ts'));
      expect(listenEntry).toBeDefined();
      expect(listenEntry!.type).toBe('main');
    });

    it('finds API endpoints from Express route definitions', () => {
      const result = analyzeCode(fixtureDir, 'typescript', 'express');
      expect(result.apiEndpoints.length).toBeGreaterThanOrEqual(3);
      const paths = result.apiEndpoints.map((e) => e.path);
      expect(paths).toContain('/users');
    });

    it('detects multiple HTTP methods', () => {
      const result = analyzeCode(fixtureDir, 'typescript', 'express');
      const methods = result.apiEndpoints.map((e) => e.method);
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('DELETE');
    });

    it('finds external database connections', () => {
      const result = analyzeCode(fixtureDir, 'typescript', 'express');
      const dbConn = result.externalConnections.find((c) => c.name === 'postgresql');
      expect(dbConn).toBeDefined();
      expect(dbConn!.type).toBe('database');
    });

    it('finds background queue jobs', () => {
      const result = analyzeCode(fixtureDir, 'typescript', 'express');
      const queueJob = result.backgroundJobs.find((j) => j.name === 'send-email');
      expect(queueJob).toBeDefined();
      expect(queueJob!.type).toBe('queue');
    });

    it('finds scheduled cron jobs', () => {
      const result = analyzeCode(fixtureDir, 'typescript', 'express');
      const cronJob = result.backgroundJobs.find((j) => j.name === 'daily-cleanup');
      expect(cronJob).toBeDefined();
      expect(cronJob!.type).toBe('cron');
    });

    it('finds worker classes', () => {
      const result = analyzeCode(fixtureDir, 'typescript', 'express');
      const worker = result.backgroundJobs.find((j) => j.name === 'EmailWorker');
      expect(worker).toBeDefined();
      expect(worker!.type).toBe('worker');
    });

    it('filters files by language', () => {
      const result = analyzeCode(fixtureDir, 'python', 'flask');
      expect(result.entryPoints).toEqual([]);
    });
  });
});
