/**
 * Deployment Analyzer - Identifies deployment mechanism and rollback capabilities
 */

import {
  type AnalysisContext,
  type DeploymentPlatform,
  type RollbackCapability,
} from '../types/domain.js';
import { listFiles, readFile } from '../utils/index.js';
import * as path from 'path';

export interface DeploymentAnalysis {
  platform: DeploymentPlatform;
  capabilities: RollbackCapability[];
  deploymentConfig: DeploymentConfig;
  rollbackScripts: string[];
}

export interface DeploymentConfig {
  replicas: number;
  strategy: string;
  healthCheckPath: string;
  environment: string;
}

/**
 * Analyze deployment configuration
 */
export function analyzeDeployment(repoPath: string, context: AnalysisContext): DeploymentAnalysis {
  const files = listFiles(repoPath, true);
  const configParser = context.configParser as Record<string, { platform?: string }> | undefined;
  const platform = (configParser?.deployment?.platform ?? 'unknown') as DeploymentPlatform;
  const capabilities: RollbackCapability[] = [];
  const rollbackScripts: string[] = [];

  const deploymentConfig: DeploymentConfig = {
    replicas: 1,
    strategy: 'rolling',
    healthCheckPath: '/health',
    environment: 'production',
  };

  // Analyze based on platform
  switch (platform) {
    case 'kubernetes':
      const k8sManifests = files.filter(
        (f) =>
          (f.endsWith('.yaml') || f.endsWith('.yml')) &&
          (f.includes('deployment') || f.includes('k8s') || f.includes('kubernetes')),
      );

      for (const manifest of k8sManifests) {
        const content = readFile(manifest);
        if (content) {
          // Extract replicas
          const replicasMatch = content.match(/replicas:\s*(\d+)/);
          if (replicasMatch) {
            deploymentConfig.replicas = parseInt(replicasMatch[1]!, 10);
          }

          // Extract strategy
          if (content.includes('strategy:')) {
            if (content.includes('RollingUpdate')) {
              deploymentConfig.strategy = 'rolling';
            } else if (content.includes('Recreate')) {
              deploymentConfig.strategy = 'recreate';
            } else if (content.includes('BlueGreen')) {
              deploymentConfig.strategy = 'blue-green';
            } else if (content.includes('Canary')) {
              deploymentConfig.strategy = 'canary';
            }
          }

          // Extract health check
          const healthCheckMatch = content.match(/path:\s*['"]([^'"]+)['"]/);
          if (healthCheckMatch) {
            deploymentConfig.healthCheckPath = healthCheckMatch[1]!;
          }
        }
      }

      capabilities.push(
        {
          type: 'kubectl-rollback',
          description: 'Rollback to previous ReplicaSet',
          command: `kubectl rollout undo deployment/${context.serviceDefinition.name}`,
          automated: true,
        },
        {
          type: 'kubectl-scale',
          description: 'Scale deployment up or down',
          command: `kubectl scale deployment/${context.serviceDefinition.name} --replicas=<count>`,
          automated: true,
        },
        {
          type: 'kubectl-delete-pod',
          description: 'Delete specific pods to force recreation',
          command: `kubectl delete pod <pod-name> --force --grace-period=0`,
          automated: false,
        },
      );
      break;

    case 'ecs':
      capabilities.push(
        {
          type: 'ecs-rollback',
          description: 'Rollback ECS service to previous task definition',
          command: `aws ecs update-service --cluster <cluster> --service ${context.serviceDefinition.name} --task-definition <previous-task-def>`,
          automated: true,
        },
        {
          type: 'ecs-scale',
          description: 'Scale ECS service',
          command: `aws ecs update-service --cluster <cluster> --service ${context.serviceDefinition.name} --desired-count <count>`,
          automated: true,
        },
      );
      break;

    case 'cloud-run':
      capabilities.push(
        {
          type: 'cloud-run-rollback',
          description: 'Rollback Cloud Run to previous revision',
          command: `gcloud run services update ${context.serviceDefinition.name} --to-revision <previous-revision>`,
          automated: true,
        },
        {
          type: 'cloud-run-traffic',
          description: 'Shift traffic to previous revision',
          command: `gcloud run services update-traffic ${context.serviceDefinition.name} --to-revisions <revision>=100`,
          automated: true,
        },
      );
      break;

    case 'lambda':
      capabilities.push(
        {
          type: 'lambda-alias',
          description: 'Update Lambda alias to previous version',
          command: `aws lambda update-alias --function-name ${context.serviceDefinition.name} --name prod --function-version <previous-version>`,
          automated: true,
        },
        {
          type: 'lambda-routing',
          description: 'Route traffic to previous Lambda version',
          command: `aws lambda update-function-code --function-name ${context.serviceDefinition.name} --publish`,
          automated: true,
        },
      );
      break;

    default:
      capabilities.push({
        type: 'manual-rollback',
        description: 'Manual rollback required',
        command: 'Deploy previous version manually',
        automated: false,
      });
  }

  // Check for deployment scripts
  const deployScripts = files.filter(
    (f) =>
      f.endsWith('deploy.sh') ||
      f.endsWith('rollback.sh') ||
      f.endsWith('release.sh') ||
      f.includes('deploy') ||
      f.includes('rollback'),
  );

  for (const script of deployScripts) {
    rollbackScripts.push(path.relative(repoPath, script));
  }

  return {
    platform,
    capabilities,
    deploymentConfig,
    rollbackScripts,
  };
}

/**
 * Get rollback commands for a specific platform
 */
export function getRollbackCommands(platform: DeploymentPlatform, serviceName: string): string[] {
  const commands: string[] = [];

  switch (platform) {
    case 'kubernetes':
      commands.push(
        `kubectl rollout undo deployment/${serviceName}`,
        `kubectl rollout status deployment/${serviceName}`,
        `kubectl get pods -l app=${serviceName}`,
      );
      break;
    case 'ecs':
      commands.push(
        `aws ecs update-service --cluster <cluster> --service ${serviceName} --task-definition <previous>`,
        `aws ecs describe-services --cluster <cluster> --services ${serviceName}`,
      );
      break;
    case 'cloud-run':
      commands.push(
        `gcloud run services update ${serviceName} --to-revision <previous>`,
        `gcloud run revisions list --service ${serviceName}`,
      );
      break;
    case 'lambda':
      commands.push(
        `aws lambda update-alias --function-name ${serviceName} --name prod --function-version <previous>`,
        `aws lambda list-versions-by-function --function-name ${serviceName}`,
      );
      break;
    default:
      commands.push('Manual rollback required - no automated commands available');
  }

  return commands;
}
