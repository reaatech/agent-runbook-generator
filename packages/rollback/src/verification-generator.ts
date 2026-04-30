/**
 * Verification Generator - Generates post-rollback verification steps
 */

import type {
  AnalysisContext,
  DeploymentPlatform,
  VerificationStep,
} from '@reaatech/agent-runbook';
import { generateId } from '@reaatech/agent-runbook';

export interface VerificationPlan {
  healthChecks: VerificationStep[];
  smokeTests: VerificationStep[];
  dataValidation: VerificationStep[];
  performanceChecks: VerificationStep[];
  successCriteria: string[];
}

/**
 * Generate verification steps after rollback
 */
export function generateVerificationSteps(
  context: AnalysisContext,
  platform: DeploymentPlatform,
): VerificationPlan {
  const serviceName = context.serviceDefinition.name;

  return {
    healthChecks: generateHealthChecks(serviceName, platform),
    smokeTests: generateSmokeTests(serviceName, platform),
    dataValidation: generateDataValidation(serviceName, context),
    performanceChecks: generatePerformanceChecks(serviceName),
    successCriteria: getSuccessCriteria(serviceName),
  };
}

/**
 * Generate health check verification steps
 */
function generateHealthChecks(
  serviceName: string,
  platform: DeploymentPlatform,
): VerificationStep[] {
  return [
    {
      id: generateId('step'),
      order: 1,
      title: 'Verify pod/instance status',
      description: 'Check that all instances are running',
      commands: [
        platform === 'kubernetes'
          ? `kubectl get pods -l app=${serviceName} --field-selector=status.phase=Running`
          : `Check all instances of ${serviceName} are running`,
      ],
      automated: true,
      estimatedDuration: '1m',
    },
    {
      id: generateId('step'),
      order: 2,
      title: 'Verify health endpoint',
      description: 'Check that health endpoint returns 200',
      commands: [
        `curl -s -o /dev/null -w '%{http_code}' http://${serviceName}/health`,
        `curl -s http://${serviceName}/health | jq .`,
      ],
      automated: true,
      estimatedDuration: '1m',
    },
    {
      id: generateId('step'),
      order: 3,
      title: 'Verify readiness probe',
      description: 'Check that service is ready to receive traffic',
      commands: [
        `curl -s http://${serviceName}/ready`,
        'Check readiness probe status in deployment',
      ],
      automated: true,
      estimatedDuration: '1m',
    },
    {
      id: generateId('step'),
      order: 4,
      title: 'Check recent logs',
      description: 'Review logs for any errors or warnings',
      commands: [
        platform === 'kubernetes'
          ? `kubectl logs -l app=${serviceName} --tail=100 --since=5m`
          : `Check ${serviceName} logs for errors in last 5 minutes`,
      ],
      automated: false,
      estimatedDuration: '3m',
    },
  ];
}

/**
 * Generate smoke test verification steps
 */
function generateSmokeTests(
  serviceName: string,
  _platform: DeploymentPlatform,
): VerificationStep[] {
  return [
    {
      id: generateId('step'),
      order: 1,
      title: 'Test basic API connectivity',
      description: 'Verify API endpoints are responding',
      commands: [
        `curl -s http://${serviceName}/api/health`,
        `curl -s http://${serviceName}/api/version`,
      ],
      automated: true,
      estimatedDuration: '2m',
    },
    {
      id: generateId('step'),
      order: 2,
      title: 'Test database connectivity',
      description: 'Verify database connections are working',
      commands: [
        `curl -s http://${serviceName}/api/health/db`,
        'Run a simple database query through the API',
      ],
      automated: true,
      estimatedDuration: '2m',
    },
    {
      id: generateId('step'),
      order: 3,
      title: 'Test cache connectivity',
      description: 'Verify cache connections are working',
      commands: [`curl -s http://${serviceName}/api/health/cache`, 'Test cache get/set operations'],
      automated: true,
      estimatedDuration: '2m',
    },
    {
      id: generateId('step'),
      order: 4,
      title: 'Test critical user flows',
      description: 'Verify key user journeys work correctly',
      commands: [
        'Test user login flow',
        'Test data retrieval',
        'Test data creation',
        'Test data update',
      ],
      automated: false,
      estimatedDuration: '10m',
    },
  ];
}

/**
 * Generate data validation verification steps
 */
function generateDataValidation(
  _serviceName: string,
  context: AnalysisContext,
): VerificationStep[] {
  const hasDatabase = context.externalServices.some((s) => s.type === 'database');

  if (!hasDatabase) {
    return [];
  }

  return [
    {
      id: generateId('step'),
      order: 1,
      title: 'Verify data consistency',
      description: 'Check that data is consistent across replicas',
      commands: [
        'Run data consistency checks',
        'Compare row counts across replicas',
        'Verify foreign key relationships',
      ],
      automated: true,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 2,
      title: 'Check recent data changes',
      description: 'Verify recent data modifications are correct',
      commands: [
        'Query recently modified records',
        'Verify data integrity constraints',
        'Check for any data anomalies',
      ],
      automated: false,
      estimatedDuration: '5m',
    },
    {
      id: generateId('step'),
      order: 3,
      title: 'Verify backup status',
      description: 'Confirm backups are up to date',
      commands: [
        'Check last backup timestamp',
        'Verify backup completion status',
        'Test backup restore if needed',
      ],
      automated: false,
      estimatedDuration: '3m',
    },
  ];
}

/**
 * Generate performance verification steps
 */
function generatePerformanceChecks(serviceName: string): VerificationStep[] {
  return [
    {
      id: generateId('step'),
      order: 1,
      title: 'Check error rate',
      description: 'Verify error rate is within acceptable limits',
      commands: [
        `Query error rate for ${serviceName}`,
        'Compare with baseline error rate',
        'Check for any error spikes',
      ],
      automated: true,
      estimatedDuration: '2m',
    },
    {
      id: generateId('step'),
      order: 2,
      title: 'Check latency metrics',
      description: 'Verify latency is within acceptable limits',
      commands: [
        `Query P50, P95, P99 latency for ${serviceName}`,
        'Compare with baseline latency',
        'Check for latency spikes',
      ],
      automated: true,
      estimatedDuration: '2m',
    },
    {
      id: generateId('step'),
      order: 3,
      title: 'Check throughput',
      description: 'Verify request throughput is normal',
      commands: [
        `Query requests per second for ${serviceName}`,
        'Compare with baseline throughput',
        'Check for unusual patterns',
      ],
      automated: true,
      estimatedDuration: '2m',
    },
    {
      id: generateId('step'),
      order: 4,
      title: 'Check resource utilization',
      description: 'Verify CPU, memory, and disk are within limits',
      commands: [
        `Check CPU utilization for ${serviceName}`,
        `Check memory utilization for ${serviceName}`,
        `Check disk usage for ${serviceName}`,
      ],
      automated: true,
      estimatedDuration: '2m',
    },
  ];
}

/**
 * Get success criteria for rollback verification
 */
function getSuccessCriteria(_serviceName: string): string[] {
  return [
    'All pods/instances are in Running state',
    'Health endpoint returns HTTP 200',
    'Error rate is below 1%',
    'P99 latency is below 1 second',
    'No errors in recent logs',
    'Database connectivity is stable',
    'Cache connectivity is stable',
    'All smoke tests pass',
    'Resource utilization is within normal range',
    'No alerts are firing',
  ];
}

/**
 * Generate a verification checklist
 */
export function generateVerificationChecklist(
  context: AnalysisContext,
  platform: DeploymentPlatform,
): string[] {
  const plan = generateVerificationSteps(context, platform);
  const checklist: string[] = [];

  for (const step of plan.healthChecks) {
    checklist.push(`[ ] ${step.title}`);
  }
  for (const step of plan.smokeTests) {
    checklist.push(`[ ] ${step.title}`);
  }
  for (const step of plan.dataValidation) {
    checklist.push(`[ ] ${step.title}`);
  }
  for (const step of plan.performanceChecks) {
    checklist.push(`[ ] ${step.title}`);
  }

  checklist.push('\n## Success Criteria');
  for (const criterion of plan.successCriteria) {
    checklist.push(`[ ] ${criterion}`);
  }

  return checklist;
}
