import { describe, it, expect } from 'vitest';
import { scanRepository, detectDeploymentPlatform } from '@reaatech/agent-runbook-analyzer';
import { mapDependencies } from '@reaatech/agent-runbook-analyzer';
import { parseConfigs } from '@reaatech/agent-runbook-analyzer';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Repository Scanner', () => {
  describe('scanRepository', () => {
    it('should scan a valid repository path', async () => {
      const result = await scanRepository(process.cwd());
      expect(result).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.framework).toBeDefined();
    });

    it('should throw for non-existent paths', async () => {
      await expect(scanRepository('/nonexistent/path/12345')).rejects.toThrow(
        'Repository path does not exist',
      );
    });
  });

  describe('detectDeploymentPlatform', () => {
    it('should detect Kubernetes from manifests', () => {
      const files = ['k8s/deployment.yaml', 'k8s/service.yaml', 'package.json'];
      const platform = detectDeploymentPlatform(files, process.cwd());
      expect(platform).toBe('kubernetes');
    });

    it('should detect Lambda from serverless config', () => {
      const files = ['serverless.yml', 'handler.js'];
      const platform = detectDeploymentPlatform(files, process.cwd());
      expect(platform).toBe('lambda');
    });

    it('should return unknown when no platform detected', () => {
      const files = ['package.json', 'src/index.ts'];
      const platform = detectDeploymentPlatform(files, process.cwd());
      expect(platform).toBe('unknown');
    });
  });
});

describe('Dependency Mapper', () => {
  describe('mapDependencies', () => {
    it('should map dependencies for a Node.js project', () => {
      const result = mapDependencies(process.cwd());
      expect(result).toBeDefined();
      expect(result.directDeps).toBeDefined();
      expect(result.externalServices).toBeDefined();
    });

    it('should return empty results for non-project directory', () => {
      const emptyDir = mkdtempSync(join(tmpdir(), 'runbook-empty-deps-'));
      try {
        const result = mapDependencies(emptyDir);
        expect(result).toBeDefined();
        expect(result.directDeps).toHaveLength(0);
      } finally {
        rmSync(emptyDir, { recursive: true, force: true });
      }
    });
  });
});

describe('Config Parser', () => {
  describe('parseConfigs', () => {
    it('should parse configs from a valid project', () => {
      const result = parseConfigs(process.cwd());
      expect(result).toBeDefined();
      expect(result.environmentVariables).toBeDefined();
    });

    it('should return empty config for non-project directory', () => {
      const emptyDir = mkdtempSync(join(tmpdir(), 'runbook-empty-config-'));
      try {
        const result = parseConfigs(emptyDir);
        expect(result).toBeDefined();
        expect(result.environmentVariables).toHaveLength(0);
      } finally {
        rmSync(emptyDir, { recursive: true, force: true });
      }
    });
  });
});
