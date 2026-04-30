/**
 * Config Parser - Parses YAML/JSON configs, IaC, Dockerfiles
 */

import * as path from 'path';
import YAML from 'yaml';
import { type DeploymentPlatform, type MonitoringPlatform } from '@reaatech/agent-runbook';
import { readFile, listFiles } from '@reaatech/agent-runbook';

export interface ParsedConfig {
  environmentVariables: EnvironmentVariable[];
  infrastructure: InfrastructureConfig;
  deployment: DeploymentConfig;
  monitoring: MonitoringConfig;
}

export interface EnvironmentVariable {
  name: string;
  value?: string;
  isSecret: boolean;
  source: string;
}

export interface InfrastructureConfig {
  type: 'terraform' | 'pulumi' | 'cdk' | 'none';
  files: string[];
  resources: ResourceInfo[];
}

export interface ResourceInfo {
  type: string;
  name: string;
  provider: string;
}

export interface DeploymentConfig {
  platform: DeploymentPlatform;
  containerized: boolean;
  dockerfile?: string;
  kubernetesManifests: string[];
}

export interface MonitoringConfig {
  platform: MonitoringPlatform;
  hasPrometheus: boolean;
  hasDatadog: boolean;
  hasCloudWatch: boolean;
  alertingRules: string[];
}

/**
 * Parse all configuration files in a repository
 */
export function parseConfigs(repoPath: string): ParsedConfig {
  const files = listFiles(repoPath, true);

  return {
    environmentVariables: extractEnvironmentVariables(repoPath, files),
    infrastructure: parseInfrastructureConfig(repoPath, files),
    deployment: parseDeploymentConfig(repoPath, files),
    monitoring: parseMonitoringConfig(repoPath, files),
  };
}

/**
 * Extract environment variables from config files
 */
function extractEnvironmentVariables(repoPath: string, files: string[]): EnvironmentVariable[] {
  const envVars: EnvironmentVariable[] = [];
  const secretPatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /api_key/i,
    /apikey/i,
    /connection/i,
  ];

  // Parse .env files
  const envFiles = files.filter(
    (f) => f.endsWith('.env') || f.endsWith('.env.example') || f.endsWith('.env.sample'),
  );

  for (const envFile of envFiles) {
    const content = readFile(envFile);
    if (content) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
          if (match) {
            const name = match[1]!;
            const value = match[2]?.replace(/^["']|["']$/g, '');
            const isSecret = secretPatterns.some((p) => p.test(name));
            envVars.push({
              name,
              value: isSecret ? undefined : value,
              isSecret,
              source: path.relative(repoPath, envFile),
            });
          }
        }
      }
    }
  }

  return envVars;
}

/**
 * Parse infrastructure-as-code configurations
 */
function parseInfrastructureConfig(repoPath: string, files: string[]): InfrastructureConfig {
  const terraformFiles = files.filter((f) => f.endsWith('.tf'));
  const pulumiFiles = files.filter((f) => f.endsWith('Pulumi.yaml') || f.includes('pulumi'));
  const cdkFiles = files.filter((f) => f.endsWith('cdk.json') || f.includes('cdk'));

  const resources: ResourceInfo[] = [];

  // Parse Terraform files
  for (const tfFile of terraformFiles) {
    const content = readFile(tfFile);
    if (content) {
      // Extract resource blocks
      const resourceMatches = content.matchAll(/resource\s+"([^"]+)"\s+"([^"]+)"/g);
      for (const match of resourceMatches) {
        resources.push({
          type: match[1]!,
          name: match[2]!,
          provider: match[1]!.split('_')[0] ?? 'unknown',
        });
      }
    }
  }

  // Determine type
  let type: InfrastructureConfig['type'] = 'none';
  const infraFiles: string[] = [];

  if (terraformFiles.length > 0) {
    type = 'terraform';
    infraFiles.push(...terraformFiles.map((f) => path.relative(repoPath, f)));
  } else if (pulumiFiles.length > 0) {
    type = 'pulumi';
    infraFiles.push(...pulumiFiles.map((f) => path.relative(repoPath, f)));
  } else if (cdkFiles.length > 0) {
    type = 'cdk';
    infraFiles.push(...cdkFiles.map((f) => path.relative(repoPath, f)));
  }

  return {
    type,
    files: infraFiles,
    resources,
  };
}

/**
 * Parse deployment configuration
 */
function parseDeploymentConfig(repoPath: string, files: string[]): DeploymentConfig {
  const dockerfiles = files.filter((f) => f.endsWith('Dockerfile'));
  const k8sManifests = files.filter(
    (f) =>
      (f.endsWith('.yaml') || f.endsWith('.yml')) &&
      (f.includes('k8s') || f.includes('kubernetes') || f.includes('deployment')),
  );

  // Detect platform
  let platform: DeploymentPlatform = 'unknown';

  if (k8sManifests.length > 0) {
    platform = 'kubernetes';
  } else if (files.some((f) => f.includes('task-definition'))) {
    platform = 'ecs';
  } else if (files.some((f) => f.endsWith('cloudbuild.yaml'))) {
    platform = 'cloud-run';
  } else if (files.some((f) => f.endsWith('serverless.yml'))) {
    platform = 'lambda';
  } else if (files.some((f) => f.endsWith('app.yaml'))) {
    platform = 'app-engine';
  } else if (files.some((f) => f.endsWith('Procfile'))) {
    platform = 'heroku';
  }

  return {
    platform,
    containerized: dockerfiles.length > 0,
    dockerfile: dockerfiles.length > 0 ? path.relative(repoPath, dockerfiles[0]!) : undefined,
    kubernetesManifests: k8sManifests.map((f) => path.relative(repoPath, f)),
  };
}

/**
 * Parse monitoring configuration
 */
function parseMonitoringConfig(_repoPath: string, files: string[]): MonitoringConfig {
  const prometheusRules = files.filter(
    (f) =>
      (f.endsWith('.yaml') || f.endsWith('.yml')) &&
      (f.includes('prometheus') || f.includes('alerts') || f.includes('rules')),
  );
  const datadogFiles = files.filter((f) => f.toLowerCase().includes('datadog'));
  const cloudwatchFiles = files.filter((f) => f.toLowerCase().includes('cloudwatch'));

  let platform: MonitoringPlatform = 'unknown';
  if (prometheusRules.length > 0) {
    platform = 'prometheus';
  } else if (datadogFiles.length > 0) {
    platform = 'datadog';
  } else if (cloudwatchFiles.length > 0) {
    platform = 'cloudwatch';
  }

  const alertingRules: string[] = [];
  for (const ruleFile of prometheusRules) {
    const content = readFile(ruleFile);
    if (content) {
      try {
        const parsed = YAML.parse(content);
        if (parsed?.groups) {
          for (const group of parsed.groups) {
            if (group.rules) {
              for (const rule of group.rules) {
                if (rule.alert) {
                  alertingRules.push(rule.alert);
                }
              }
            }
          }
        }
      } catch {
        // Skip invalid YAML
      }
    }
  }

  return {
    platform,
    hasPrometheus: prometheusRules.length > 0,
    hasDatadog: datadogFiles.length > 0,
    hasCloudWatch: cloudwatchFiles.length > 0,
    alertingRules,
  };
}
