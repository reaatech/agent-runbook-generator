/**
 * Rollback Generator - Generates step-by-step rollback procedures
 */

import {
  type AnalysisContext,
  type RollbackProcedure,
  type RollbackStep,
  type DeploymentPlatform,
} from '../types/domain.js';
import { generateId } from '../utils/index.js';

export interface RollbackScenarios {
  deploymentFailure: RollbackProcedure;
  configurationError: RollbackProcedure;
  performanceDegradation: RollbackProcedure;
  dataCorruption: RollbackProcedure;
}

/**
 * Generate rollback procedures for a service
 */
export function generateRollbackProcedures(
  context: AnalysisContext,
  platform: DeploymentPlatform,
): RollbackScenarios {
  const serviceName = context.serviceDefinition.name;

  return {
    deploymentFailure: generateDeploymentFailureRollback(serviceName, platform, context),
    configurationError: generateConfigurationErrorRollback(serviceName, platform),
    performanceDegradation: generatePerformanceDegradationRollback(serviceName, platform),
    dataCorruption: generateDataCorruptionRollback(serviceName, platform),
  };
}

/**
 * Generate rollback procedure for deployment failure
 */
function generateDeploymentFailureRollback(
  serviceName: string,
  platform: DeploymentPlatform,
  _context: AnalysisContext,
): RollbackProcedure {
  const steps: RollbackStep[] = [
    {
      id: generateId('step'),
      order: 1,
      title: 'Assess the situation',
      description: 'Determine the scope and severity of the deployment failure',
      commands: ['Check deployment logs', 'Review error messages', 'Verify health check status'],
      automated: false,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 2,
      title: 'Notify the team',
      description: 'Alert relevant team members about the rollback',
      commands: [
        'Post in #incidents channel',
        'Tag on-call engineer',
        'Update status page if needed',
      ],
      automated: false,
      estimatedDuration: '2m',
    },
    {
      id: generateId('step'),
      order: 3,
      title: 'Execute rollback',
      description: 'Roll back to the previous stable version',
      commands: getRollbackCommands(platform, serviceName),
      automated: true,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 4,
      title: 'Verify rollback success',
      description: 'Confirm the service is healthy after rollback',
      commands: getVerificationCommands(platform, serviceName),
      automated: false,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 5,
      title: 'Monitor service health',
      description: 'Watch metrics and logs for any issues',
      commands: ['Check error rates', 'Monitor latency', 'Review application logs'],
      automated: false,
      estimatedDuration: '15m',
    },
    {
      id: generateId('step'),
      order: 6,
      title: 'Document the incident',
      description: 'Record details for post-mortem analysis',
      commands: ['Create incident ticket', 'Save relevant logs', 'Note timeline of events'],
      automated: false,
      estimatedDuration: '10m',
    },
  ];

  return {
    name: 'Deployment Failure Rollback',
    description: 'Rollback procedure for failed deployments',
    triggerConditions: [
      'Health checks failing after deployment',
      'Error rate spike > 10%',
      'Latency increase > 50%',
      'Deployment timeout',
    ],
    steps,
    estimatedTotalDuration: '42m',
    requiresApproval: false,
    rollbackType: 'deployment',
  };
}

/**
 * Generate rollback procedure for configuration error
 */
function generateConfigurationErrorRollback(
  serviceName: string,
  platform: DeploymentPlatform,
): RollbackProcedure {
  const steps: RollbackStep[] = [
    {
      id: generateId('step'),
      order: 1,
      title: 'Identify configuration issue',
      description: 'Determine which configuration change caused the problem',
      commands: [
        'Review recent config changes',
        'Check config validation logs',
        'Compare with previous working config',
      ],
      automated: false,
      estimatedDuration: '10m',
    },
    {
      id: generateId('step'),
      order: 2,
      title: 'Prepare previous configuration',
      description: 'Retrieve the last known good configuration',
      commands: [
        'Get config from version control',
        'Verify config syntax',
        'Prepare config for deployment',
      ],
      automated: false,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 3,
      title: 'Apply previous configuration',
      description: 'Deploy the previous configuration',
      commands: getRollbackCommands(platform, serviceName),
      automated: true,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 4,
      title: 'Restart affected services',
      description: 'Restart services to apply configuration',
      commands: [
        platform === 'kubernetes'
          ? `kubectl rollout restart deployment/${serviceName}`
          : `Restart ${serviceName} service`,
      ],
      automated: true,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 5,
      title: 'Verify configuration applied',
      description: 'Confirm the configuration is correctly applied',
      commands: [
        'Check service logs for config load',
        'Verify service behavior',
        'Run smoke tests',
      ],
      automated: false,
      estimatedDuration: '10m',
    },
  ];

  return {
    name: 'Configuration Error Rollback',
    description: 'Rollback procedure for configuration-related issues',
    triggerConditions: [
      'Service startup failure after config change',
      'Configuration validation errors',
      'Unexpected service behavior',
    ],
    steps,
    estimatedTotalDuration: '35m',
    requiresApproval: false,
    rollbackType: 'configuration',
  };
}

/**
 * Generate rollback procedure for performance degradation
 */
function generatePerformanceDegradationRollback(
  serviceName: string,
  platform: DeploymentPlatform,
): RollbackProcedure {
  const steps: RollbackStep[] = [
    {
      id: generateId('step'),
      order: 1,
      title: 'Confirm performance degradation',
      description: 'Verify that performance has degraded significantly',
      commands: [
        'Check latency metrics (P50, P95, P99)',
        'Review error rates',
        'Check throughput metrics',
        'Compare with baseline',
      ],
      automated: false,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 2,
      title: 'Scale resources temporarily',
      description: 'Add capacity to handle load while investigating',
      commands: [
        platform === 'kubernetes'
          ? `kubectl scale deployment/${serviceName} --replicas=<current + 2>`
          : `Scale ${serviceName} instances`,
      ],
      automated: true,
      estimatedDuration: '3m',
    },
    {
      id: generateId('step'),
      order: 3,
      title: 'Enable feature flags',
      description: 'Disable non-critical features to reduce load',
      commands: [
        'Disable experimental features',
        'Enable caching if available',
        'Reduce logging verbosity',
      ],
      automated: false,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 4,
      title: 'Execute rollback if needed',
      description: 'Roll back to previous version if degradation persists',
      commands: getRollbackCommands(platform, serviceName),
      automated: true,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 5,
      title: 'Monitor recovery',
      description: 'Watch for performance improvement',
      commands: ['Monitor latency metrics', 'Check error rates', 'Verify throughput recovery'],
      automated: false,
      estimatedDuration: '15m',
    },
  ];

  return {
    name: 'Performance Degradation Rollback',
    description: 'Rollback procedure for performance-related issues',
    triggerConditions: [
      'P99 latency > 2x baseline',
      'Error rate > 5%',
      'Throughput drop > 30%',
      'Resource saturation > 80%',
    ],
    steps,
    estimatedTotalDuration: '33m',
    requiresApproval: true,
    rollbackType: 'performance',
  };
}

/**
 * Generate rollback procedure for data corruption
 */
function generateDataCorruptionRollback(
  serviceName: string,
  platform: DeploymentPlatform,
): RollbackProcedure {
  const steps: RollbackStep[] = [
    {
      id: generateId('step'),
      order: 1,
      title: 'Stop the bleeding',
      description: 'Immediately stop any processes that may be corrupting data',
      commands: [
        'Pause background jobs',
        'Disable write operations if possible',
        'Enable read-only mode',
      ],
      automated: false,
      estimatedDuration: '2m',
    },
    {
      id: generateId('step'),
      order: 2,
      title: 'Assess data corruption scope',
      description: 'Determine what data has been affected',
      commands: [
        'Check database logs',
        'Review recent data changes',
        'Identify affected tables/collections',
        'Estimate corruption extent',
      ],
      automated: false,
      estimatedDuration: '15m',
    },
    {
      id: generateId('step'),
      order: 3,
      title: 'Create backup of current state',
      description: 'Preserve current state for analysis',
      commands: ['Take database snapshot', 'Export affected data', 'Save application logs'],
      automated: true,
      estimatedDuration: '10m',
    },
    {
      id: generateId('step'),
      order: 4,
      title: 'Restore from backup',
      description: 'Restore data from last known good backup',
      commands: [
        'Identify last good backup',
        'Verify backup integrity',
        'Restore database from backup',
        'Validate restored data',
      ],
      automated: true,
      estimatedDuration: '30m',
    },
    {
      id: generateId('step'),
      order: 5,
      title: 'Rollback application',
      description: 'Deploy previous stable version',
      commands: getRollbackCommands(platform, serviceName),
      automated: true,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 6,
      title: 'Verify data integrity',
      description: 'Confirm data is consistent and correct',
      commands: [
        'Run data validation scripts',
        'Check referential integrity',
        'Verify application functionality',
        'Run smoke tests',
      ],
      automated: false,
      estimatedDuration: '20m',
    },
    {
      id: generateId('step'),
      order: 7,
      title: 'Resume normal operations',
      description: 'Gradually restore full service',
      commands: ['Re-enable write operations', 'Resume background jobs', 'Monitor for issues'],
      automated: false,
      estimatedDuration: '10m',
    },
  ];

  return {
    name: 'Data Corruption Rollback',
    description: 'Rollback procedure for data corruption incidents',
    triggerConditions: [
      'Data validation failures',
      'Unexpected data changes',
      'Database constraint violations',
      'Application data inconsistencies',
    ],
    steps,
    estimatedTotalDuration: '92m',
    requiresApproval: true,
    rollbackType: 'data',
  };
}

/**
 * Get rollback commands for a platform
 */
function getRollbackCommands(platform: DeploymentPlatform, serviceName: string): string[] {
  switch (platform) {
    case 'kubernetes':
      return [
        `kubectl rollout undo deployment/${serviceName}`,
        `kubectl rollout status deployment/${serviceName} --timeout=300s`,
        `kubectl get pods -l app=${serviceName} -w`,
      ];
    case 'ecs':
      return [
        `aws ecs update-service --cluster <cluster> --service ${serviceName} --task-definition <previous-task-def>`,
        `aws ecs describe-services --cluster <cluster> --services ${serviceName}`,
      ];
    case 'cloud-run':
      return [
        `gcloud run services update ${serviceName} --to-revision <previous-revision>`,
        `gcloud run revisions list --service ${serviceName}`,
      ];
    case 'lambda':
      return [
        `aws lambda update-alias --function-name ${serviceName} --name prod --function-version <previous-version>`,
        `aws lambda get-alias --function-name ${serviceName} --name prod`,
      ];
    default:
      return ['Deploy previous version manually'];
  }
}

/**
 * Get verification commands for a platform
 */
function getVerificationCommands(platform: DeploymentPlatform, serviceName: string): string[] {
  switch (platform) {
    case 'kubernetes':
      return [
        `kubectl get pods -l app=${serviceName} --field-selector=status.phase=Running`,
        `kubectl logs -l app=${serviceName} --tail=50`,
        `kubectl exec -l app=${serviceName} -- curl -s localhost:8080/health`,
      ];
    case 'ecs':
      return [
        `aws ecs describe-services --cluster <cluster> --services ${serviceName}`,
        `aws ecs list-tasks --cluster <cluster> --service-name ${serviceName}`,
      ];
    case 'cloud-run':
      return [
        `gcloud run services describe ${serviceName} --format='value(status.conditions)'`,
        `curl -s $(gcloud run services describe ${serviceName} --format='value(status.url)')/health`,
      ];
    case 'lambda':
      return [
        `aws lambda invoke --function-name ${serviceName} response.json`,
        `aws lambda get-function --function-name ${serviceName}`,
      ];
    default:
      return ['Check service health endpoint'];
  }
}
