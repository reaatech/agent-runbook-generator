import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { join } from 'path';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';

describe('CLI Integration Tests', () => {
  const testDir = mkdtempSync(join(tmpdir(), 'runbook-cli-test-'));
  const testRepoPath = join(testDir, 'test-repo');
  const cliPath = join(process.cwd(), 'dist', 'cli.js');

  beforeAll(() => {
    mkdirSync(testRepoPath, { recursive: true });
    mkdirSync(join(testRepoPath, 'src'), { recursive: true });

    writeFileSync(
      join(testRepoPath, 'package.json'),
      JSON.stringify({
        name: 'test-service',
        version: '1.0.0',
        description: 'A test service for CLI testing',
        main: 'src/index.js',
        dependencies: {
          express: '^4.18.0',
          pg: '^8.11.0',
        },
      }),
    );

    writeFileSync(
      join(testRepoPath, 'src', 'index.js'),
      `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/health', (req, res) => res.status(200).json({ status: 'healthy' }));
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
    );

    writeFileSync(
      join(testRepoPath, 'Dockerfile'),
      `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]`,
    );
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('analyze command', () => {
    it('should analyze a repository and output JSON', async () => {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'analyze', testRepoPath, '--json'], {
            cwd: process.cwd(),
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
      expect(parsed).toHaveProperty('repository');
      expect(parsed.repository).toHaveProperty('language');
      expect(parsed).toHaveProperty('dependencies');
    });

    it('should respect --depth option', async () => {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn(
            'node',
            [cliPath, 'analyze', testRepoPath, '--depth', '5', '--json'],
            {
              cwd: process.cwd(),
            },
          );

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);
    });

    it('should handle missing repository path', async () => {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'analyze', '/nonexistent/path', '--json'], {
            cwd: process.cwd(),
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('generate command', () => {
    it('should generate a runbook and write to file', async () => {
      const outputPath = join(testDir, 'generated-runbook.md');

      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn(
            'node',
            [cliPath, 'generate', testRepoPath, '-o', outputPath, '--provider', 'mock'],
            { cwd: process.cwd() },
          );

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Runbook generated:');

      const { existsSync, readFileSync } = await import('fs');
      expect(existsSync(outputPath)).toBe(true);
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('#');
    });

    it('should output JSON with --json flag', async () => {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn(
            'node',
            [cliPath, 'generate', testRepoPath, '--json', '--provider', 'mock'],
            { cwd: process.cwd() },
          );

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);

      const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
      expect(parsed).toHaveProperty('title');
      expect(parsed).toHaveProperty('sections');
    });

    it('should accept --format option', async () => {
      const outputPath = join(testDir, 'generated-runbook.html');

      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn(
            'node',
            [
              cliPath,
              'generate',
              testRepoPath,
              '-o',
              outputPath,
              '--format',
              'html',
              '--provider',
              'mock',
            ],
            { cwd: process.cwd() },
          );

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);

      const { readFileSync } = await import('fs');
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
    });

    it('should generate markdown that validates successfully in CI mode', async () => {
      const outputPath = join(testDir, 'validated-runbook.md');

      const generateResult = await new Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
      }>((resolve) => {
        const child = spawn(
          'node',
          [cliPath, 'generate', testRepoPath, '-o', outputPath, '--provider', 'mock'],
          { cwd: process.cwd() },
        );

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          resolve({ stdout, stderr, exitCode: code ?? 0 });
        });
      });

      expect(generateResult.exitCode).toBe(0);

      const validateResult = await new Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
      }>((resolve) => {
        const child = spawn('node', [cliPath, 'validate', outputPath, '--ci'], {
          cwd: process.cwd(),
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          resolve({ stdout, stderr, exitCode: code ?? 0 });
        });
      });

      expect(validateResult.exitCode).toBe(0);
      expect(validateResult.stdout).toContain('PASSED');
    });
  });

  describe('validate command', () => {
    it('should validate a runbook and exit with code 0 for valid runbook', async () => {
      const runbookPath = join(testDir, 'valid-runbook.json');
      writeFileSync(
        runbookPath,
        JSON.stringify({
          title: 'Test Runbook',
          sections: [
            {
              title: 'Service Overview',
              content:
                'This is a test service overview with substantial content that is longer than 100 characters to pass validation.',
            },
            {
              title: 'Alerts',
              content:
                'This section defines all the alert rules and thresholds for monitoring the service, including CPU usage, memory consumption, and error rates.',
            },
            {
              title: 'Dashboards',
              content:
                'This section contains Grafana dashboard configurations for visualizing service metrics, including request rates, latency percentiles, and error distributions.',
            },
            {
              title: 'Failure Modes',
              content:
                'This section documents potential failure modes including database connection failures, external API timeouts, and downstream service unavailability scenarios.',
            },
            {
              title: 'Rollback Procedures',
              content:
                'This section provides step-by-step instructions for rolling back deployments, including database migrations, configuration changes, and service restarts.',
            },
            {
              title: 'Health Checks',
              content:
                'This section defines liveness and readiness probe configurations for Kubernetes deployments, including HTTP endpoints and TCP socket checks.',
            },
          ],
        }),
      );

      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'validate', runbookPath, '--ci'], {
            cwd: process.cwd(),
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('PASSED');
    });

    it('should exit with code 3 for invalid runbook in CI mode', async () => {
      const runbookPath = join(testDir, 'invalid-runbook.json');
      writeFileSync(
        runbookPath,
        JSON.stringify({
          title: 'Incomplete Runbook',
          sections: [{ title: 'Service Overview', content: 'Overview' }],
        }),
      );

      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'validate', runbookPath, '--ci'], {
            cwd: process.cwd(),
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(3);
      expect(result.stdout).toContain('FAILED');
    });

    it('should output JSON with --json flag', async () => {
      const runbookPath = join(testDir, 'valid-runbook.json');
      writeFileSync(
        runbookPath,
        JSON.stringify({
          title: 'Test Runbook',
          sections: [
            {
              title: 'Service Overview',
              content: 'This is a test service overview with substantial content.',
            },
            { title: 'Alerts', content: 'Alert definitions.' },
            { title: 'Dashboards', content: 'Dashboard configurations.' },
            { title: 'Failure Modes', content: 'Failure mode analysis.' },
            { title: 'Rollback Procedures', content: 'Rollback steps.' },
            { title: 'Health Checks', content: 'Health check definitions.' },
          ],
        }),
      );

      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'validate', runbookPath, '--json'], {
            cwd: process.cwd(),
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);

      const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
      expect(parsed).toHaveProperty('passed');
      expect(parsed).toHaveProperty('completeness');
    });

    it('should handle missing runbook file', async () => {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'validate', '/nonexistent/runbook.json'], {
            cwd: process.cwd(),
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(1);
    });
  });

  describe('serve command', () => {
    it('should start MCP server and list available tools', async () => {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'serve', '--port', '39999'], {
            cwd: process.cwd(),
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          setTimeout(() => {
            child.kill('SIGTERM');
          }, 2000);

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.stdout).toContain('MCP server started');
      expect(result.stdout).toContain('runbook.analyze.repository');
      expect(result.stdout).toContain('runbook.generate.service_map');
      expect(result.stdout).toContain('runbook.generate.health_checks');
    });
  });

  describe('--help flag', () => {
    it('should display help for analyze command', async () => {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'analyze', '--help']);

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('analyze');
      expect(result.stdout).toContain('--depth');
      expect(result.stdout).toContain('--json');
    });

    it('should display help for generate command', async () => {
      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
        (resolve) => {
          const child = spawn('node', [cliPath, 'generate', '--help']);

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code ?? 0 });
          });
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('generate');
      expect(result.stdout).toContain('--output');
      expect(result.stdout).toContain('--format');
    });
  });
});
