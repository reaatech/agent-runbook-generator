/**
 * Failure Identifier - Analyzes code for potential failure points
 */

import { type AnalysisContext, type FailureMode } from '../types/domain.js';
import { listFiles, readFile } from '../utils/index.js';
import * as path from 'path';

export interface FailureAnalysis {
  failureModes: FailureMode[];
  singlePointsOfFailure: string[];
  riskScore: number;
}

/**
 * Identify potential failure modes in a service
 */
export function identifyFailureModes(
  repoPath: string,
  context: AnalysisContext,
): FailureAnalysis {
  const files = listFiles(repoPath, true);
  const failureModes: FailureMode[] = [];
  const singlePointsOfFailure: string[] = [];
  let riskScore = 0;

  // Analyze based on service type and dependencies
  const externalServices = context.externalServices;

  // Database-related failures
  if (externalServices.some(s => s.type === 'database')) {
    failureModes.push({
      id: 'ident-db-connection-failure',
      name: 'Database Connection Failure',
      description: 'Loss of connectivity to the database',
      category: 'database',
      severity: 'critical',
      likelihood: 'medium',
      detection: [
        'Increase in database connection errors',
        'Timeout errors in database queries',
        'Connection pool exhaustion',
      ],
      mitigation: [
        'Enable connection pool retry logic',
        'Use circuit breaker pattern',
        'Implement read replicas for failover',
      ],
      escalation: 'P1 - Database team notification',
      runbookSection: 'database-failure',
    });
    riskScore += 30;
  }

  // Cache-related failures
  if (externalServices.some(s => s.type === 'cache')) {
    failureModes.push({
      id: 'ident-cache-failure',
      name: 'Cache Failure',
      description: 'Cache unavailability or high latency',
      category: 'cache',
      severity: 'high',
      likelihood: 'medium',
      detection: [
        'Increase in cache miss rate',
        'Cache connection timeouts',
        'Increased database load',
      ],
      mitigation: [
        'Fall back to database reads',
        'Enable local cache',
        'Use cache-aside pattern with graceful degradation',
      ],
      escalation: 'P2 - Platform team notification',
      runbookSection: 'cache-failure',
    });
    riskScore += 15;
  }

  // Queue-related failures
  if (externalServices.some(s => s.type === 'queue')) {
    failureModes.push({
      id: 'ident-queue-failure',
      name: 'Message Queue Failure',
      description: 'Queue unavailability or message processing failures',
      category: 'queue',
      severity: 'high',
      likelihood: 'medium',
      detection: [
        'Queue depth increasing',
        'Message processing errors',
        'Consumer lag increasing',
      ],
      mitigation: [
        'Scale up consumers',
        'Enable dead letter queue',
        'Implement message replay capability',
      ],
      escalation: 'P2 - Platform team notification',
      runbookSection: 'queue-failure',
    });
    riskScore += 20;
  }

  // Memory exhaustion
  failureModes.push({
    id: 'ident-memory-exhaustion',
    name: 'Memory Exhaustion',
    description: 'Service running out of memory',
    category: 'application',
    severity: 'critical',
    likelihood: 'medium',
    detection: [
      'Memory utilization above 85%',
      'OOM kills in logs',
      'Increased GC pressure',
    ],
    mitigation: [
      'Scale horizontally',
      'Increase memory limits',
      'Identify and fix memory leaks',
    ],
    escalation: 'P1 - On-call engineer',
    runbookSection: 'memory-exhaustion',
  });
  riskScore += 20;

  // CPU exhaustion
  failureModes.push({
    id: 'ident-cpu-exhaustion',
    name: 'CPU Exhaustion',
    description: 'Service CPU at capacity',
    category: 'application',
    severity: 'high',
    likelihood: 'medium',
    detection: [
      'CPU utilization above 80%',
      'Increased request latency',
      'Thread pool saturation',
    ],
    mitigation: [
      'Scale horizontally',
      'Optimize hot code paths',
      'Enable rate limiting',
    ],
    escalation: 'P2 - On-call engineer',
    runbookSection: 'cpu-exhaustion',
  });
  riskScore += 15;

  // Disk space exhaustion
  failureModes.push({
    id: 'ident-disk-exhaustion',
    name: 'Disk Space Exhaustion',
    description: 'Service running out of disk space',
    category: 'resource',
    severity: 'high',
    likelihood: 'low',
    detection: [
      'Disk utilization above 85%',
      'Write errors in logs',
      'Log rotation failures',
    ],
    mitigation: [
      'Clean up old logs',
      'Increase disk size',
      'Enable log shipping to external storage',
    ],
    escalation: 'P2 - Platform team',
    runbookSection: 'disk-exhaustion',
  });
  riskScore += 15;

  // Network partition
  failureModes.push({
    id: 'ident-network-partition',
    name: 'Network Partition',
    description: 'Network connectivity issues between services',
    category: 'network',
    severity: 'critical',
    likelihood: 'medium',
    detection: [
      'Increased latency to dependencies',
      'Connection timeouts',
      'DNS resolution failures',
    ],
    mitigation: [
      'Enable retry with exponential backoff',
      'Use circuit breakers',
      'Implement fallback responses',
    ],
    escalation: 'P1 - Network team + on-call',
    runbookSection: 'network-partition',
  });
  riskScore += 20;

  // Check for single points of failure
  if (externalServices.filter(s => s.type === 'database').length === 1) {
    singlePointsOfFailure.push('Single database instance');
  }
  if (externalServices.filter(s => s.type === 'cache').length === 1) {
    singlePointsOfFailure.push('Single cache instance');
  }

  // Check code for missing error handling
  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    const relativePath = path.relative(repoPath, file);

    // Check for unhandled async operations
    if (content.includes('.then(') && !content.includes('.catch(')) {
      singlePointsOfFailure.push(`Unhandled promise in ${relativePath}`);
    }

    // Check for missing timeout configurations
    if (content.includes('fetch(') || content.includes('http.get(') || content.includes('http.post(')) {
      if (!content.includes('timeout') && !content.includes('signal')) {
        singlePointsOfFailure.push(`Missing timeout in ${relativePath}`);
      }
    }
  }

  return {
    failureModes,
    singlePointsOfFailure,
    riskScore: Math.min(riskScore, 100),
  };
}

/**
 * Get common failure modes for a service type
 */
export function getCommonFailureModes(serviceType: string): FailureMode[] {
  const modes: FailureMode[] = [];

  switch (serviceType) {
    case 'web-api':
      modes.push(
        {
          id: 'common-api-rate-limit',
          name: 'API Rate Limit Exceeded',
          description: 'Service hitting rate limits on upstream APIs',
          category: 'application',
          severity: 'medium',
          likelihood: 'medium',
          detection: ['429 responses from upstream', 'Rate limit headers'],
          mitigation: ['Implement request queuing', 'Use exponential backoff'],
          escalation: 'P3 - Development team',
          runbookSection: 'rate-limit',
        },
        {
          id: 'common-request-timeout',
          name: 'Request Timeout',
          description: 'Requests timing out before completion',
          category: 'application',
          severity: 'high',
          likelihood: 'medium',
          detection: ['504 Gateway Timeout', 'Client timeout errors'],
          mitigation: ['Increase timeout', 'Optimize slow queries', 'Add caching'],
          escalation: 'P2 - On-call engineer',
          runbookSection: 'request-timeout',
        },
      );
      break;
    case 'worker':
      modes.push(
        {
          id: 'common-job-failure',
          name: 'Job Processing Failure',
          description: 'Background jobs failing to process',
          category: 'application',
          severity: 'high',
          likelihood: 'medium',
          detection: ['Job retry count increasing', 'Dead letter queue growth'],
          mitigation: ['Fix job handler bugs', 'Increase job timeout'],
          escalation: 'P2 - Development team',
          runbookSection: 'job-failure',
        },
      );
      break;
    case 'lambda':
    case 'function':
      modes.push(
        {
          id: 'common-function-timeout',
          name: 'Function Timeout',
          description: 'Serverless function exceeding timeout limit',
          category: 'application',
          severity: 'high',
          likelihood: 'medium',
          detection: ['Timeout errors in logs', 'Incomplete executions'],
          mitigation: ['Increase timeout limit', 'Optimize function code'],
          escalation: 'P2 - Development team',
          runbookSection: 'function-timeout',
        },
        {
          id: 'common-cold-start',
          name: 'Cold Start Latency',
          description: 'High latency due to function cold starts',
          category: 'application',
          severity: 'low',
          likelihood: 'high',
          detection: ['High P99 latency', 'Duration spikes'],
          mitigation: ['Enable provisioned concurrency', 'Optimize package size'],
          escalation: 'P3 - Development team',
          runbookSection: 'cold-start',
        },
      );
      break;
  }

  return modes;
}