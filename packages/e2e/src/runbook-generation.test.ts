import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateRunbook } from '@reaatech/agent-runbook-cli';
import { scanRepository } from '@reaatech/agent-runbook-analyzer';
import { exportRunbook } from '@reaatech/agent-runbook-runbook';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const testRepoPath = join(process.cwd(), 'tests', 'fixtures', 'sample-repo');

describe('End-to-End Runbook Generation', () => {
  beforeAll(() => {
    mkdirSync(testRepoPath, { recursive: true });
    mkdirSync(join(testRepoPath, 'src'), { recursive: true });

    writeFileSync(
      join(testRepoPath, 'package.json'),
      JSON.stringify({
        name: 'test-service',
        version: '1.0.0',
        description: 'A test service for runbook generation',
        main: 'src/index.js',
        dependencies: {
          express: '^4.18.0',
          pg: '^8.11.0',
          redis: '^4.6.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
        },
      }),
    );

    writeFileSync(
      join(testRepoPath, 'src', 'index.ts'),
      `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api/users', async (req, res) => {
  res.json({ users: [] });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
    );

    writeFileSync(
      join(testRepoPath, 'Dockerfile'),
      `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
`,
    );
  });

  afterAll(() => {
    rmSync(testRepoPath, { recursive: true, force: true });
  });

  describe('Repository Analysis', () => {
    it('should analyze a sample repository', async () => {
      const result = await scanRepository(testRepoPath);

      expect(result).toBeDefined();
      expect(result.language).toBe('typescript');
      expect(result.framework).toBe('express');
      expect(result.serviceType).toBe('web-api');
      expect(result.configFiles).toBeDefined();
    });
  });

  describe('Full Runbook Generation', () => {
    it('should generate a complete runbook', async () => {
      const runbook = await generateRunbook({
        path: testRepoPath,
        provider: 'mock',
      });

      expect(runbook).toBeDefined();
      expect(runbook.title).toContain('test-service');
      expect(runbook.sections.length).toBeGreaterThan(0);
      expect(runbook.metadata).toBeDefined();
    });

    it('should generate runbook with specific sections', async () => {
      const runbook = await generateRunbook({
        path: testRepoPath,
        sections: ['alerts', 'failure-modes'],
        provider: 'mock',
      });

      expect(runbook.sections).toBeDefined();
    });
  });

  describe('Runbook Formatting', () => {
    it('should format runbook to markdown', async () => {
      const runbook = await generateRunbook({
        path: testRepoPath,
        provider: 'mock',
      });

      const markdown = exportRunbook(runbook, 'markdown');
      expect(markdown).toContain('#');
      expect(markdown).toContain('##');
      expect(markdown).toContain('Table of Contents');
    });

    it('should format runbook to HTML', async () => {
      const runbook = await generateRunbook({
        path: testRepoPath,
        provider: 'mock',
      });

      const html = exportRunbook(runbook, 'html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<h2>');
    });

    it('should format runbook to PDF (HTML)', async () => {
      const runbook = await generateRunbook({
        path: testRepoPath,
        provider: 'mock',
      });

      const pdf = exportRunbook(runbook, 'pdf');
      expect(pdf).toContain('<!DOCTYPE html>');
      expect(pdf).toContain('@media print');
    });
  });
});

describe('Large Repository Handling', () => {
  it('should handle repositories with many files', async () => {
    const largeRepoPath = join(process.cwd(), 'tests', 'fixtures', 'large-repo');
    mkdirSync(largeRepoPath, { recursive: true });
    mkdirSync(join(largeRepoPath, 'src'), { recursive: true });

    for (let i = 0; i < 50; i++) {
      writeFileSync(
        join(largeRepoPath, 'src', `module-${i}.ts`),
        `export const module${i} = () => {};`,
      );
    }

    writeFileSync(
      join(largeRepoPath, 'package.json'),
      JSON.stringify({
        name: 'large-service',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.0',
        },
      }),
    );

    const result = await scanRepository(largeRepoPath);
    expect(result).toBeDefined();
    expect(result.structure.fileCount).toBeGreaterThan(50);

    rmSync(largeRepoPath, { recursive: true, force: true });
  });
});
