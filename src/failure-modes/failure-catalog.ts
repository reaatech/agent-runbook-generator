/**
 * Failure Catalog - Maintains catalog of common failure modes
 */

import { type FailureMode } from '../types/domain.js';

/**
 * Catalog of common failure modes organized by category
 */
export const FAILURE_CATALOG: Record<string, FailureMode[]> = {
  infrastructure: [
    {
      id: 'infra-server-crash',
      name: 'Server Crash',
      description: 'Server instance becomes unresponsive or crashes',
      category: 'infrastructure',
      severity: 'critical',
      likelihood: 'low',
      detection: ['Health check failures', 'Instance unreachable', 'No heartbeat signals'],
      mitigation: [
        'Auto-restart the service',
        'Failover to standby instance',
        'Scale up new instances',
      ],
      escalation: 'P1 - On-call engineer',
      runbookSection: 'server-crash',
    },
    {
      id: 'infra-network-partition',
      name: 'Network Partition',
      description: 'Network connectivity issues between services or regions',
      category: 'infrastructure',
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
    },
    {
      id: 'infra-dns-failure',
      name: 'DNS Failure',
      description: 'DNS resolution failures affecting service discovery',
      category: 'infrastructure',
      severity: 'high',
      likelihood: 'low',
      detection: ['DNS lookup timeouts', 'NXDOMAIN errors', 'Service discovery failures'],
      mitigation: ['Use IP-based fallbacks', 'Enable DNS caching', 'Switch to backup DNS servers'],
      escalation: 'P2 - Infrastructure team',
      runbookSection: 'dns-failure',
    },
  ],
  database: [
    {
      id: 'db-connection-exhaustion',
      name: 'Database Connection Exhaustion',
      description: 'All database connections are in use',
      category: 'database',
      severity: 'critical',
      likelihood: 'medium',
      detection: ['Connection pool at 100%', 'Connection timeout errors', 'Slow query performance'],
      mitigation: [
        'Increase connection pool size',
        'Kill long-running queries',
        'Scale database read replicas',
      ],
      escalation: 'P1 - Database team',
      runbookSection: 'db-connection-exhaustion',
    },
    {
      id: 'db-replication-lag',
      name: 'Database Replication Lag',
      description: 'Read replicas falling behind primary',
      category: 'database',
      severity: 'high',
      likelihood: 'medium',
      detection: [
        'Replication lag > threshold',
        'Stale data on read replicas',
        'Replica sync errors',
      ],
      mitigation: [
        'Route reads to primary temporarily',
        'Scale replica resources',
        'Optimize write patterns',
      ],
      escalation: 'P2 - Database team',
      runbookSection: 'db-replication-lag',
    },
    {
      id: 'db-deadlock',
      name: 'Database Deadlock',
      description: 'Transactions blocking each other',
      category: 'database',
      severity: 'high',
      likelihood: 'medium',
      detection: ['Deadlock errors in logs', 'Transaction timeouts', 'Application retry storms'],
      mitigation: [
        'Kill blocking transactions',
        'Review and optimize transaction order',
        'Implement retry logic with backoff',
      ],
      escalation: 'P2 - Database team + dev team',
      runbookSection: 'db-deadlock',
    },
  ],
  cache: [
    {
      id: 'cache-stampede',
      name: 'Cache Stampede',
      description: 'Many requests hitting backend when cache expires',
      category: 'cache',
      severity: 'medium',
      likelihood: 'high',
      detection: [
        'Sudden spike in backend load',
        'Cache miss rate spike',
        'Latency increase on cache expiration',
      ],
      mitigation: [
        'Implement cache-aside with locking',
        'Use probabilistic early expiration',
        'Add jitter to cache TTLs',
      ],
      escalation: 'P2 - Development team',
      runbookSection: 'cache-stampede',
    },
    {
      id: 'cache-eviction-storm',
      name: 'Cache Eviction Storm',
      description: 'High eviction rate causing cache misses',
      category: 'cache',
      severity: 'medium',
      likelihood: 'medium',
      detection: [
        'Eviction rate above threshold',
        'Cache hit rate dropping',
        'Memory pressure on cache nodes',
      ],
      mitigation: [
        'Increase cache size',
        'Review cache eviction policy',
        'Optimize cache key patterns',
      ],
      escalation: 'P3 - Platform team',
      runbookSection: 'cache-eviction',
    },
  ],
  queue: [
    {
      id: 'queue-overflow',
      name: 'Queue Overflow',
      description: 'Queue depth exceeding capacity',
      category: 'queue',
      severity: 'high',
      likelihood: 'medium',
      detection: ['Queue depth above threshold', 'Message age increasing', 'Consumer lag growing'],
      mitigation: [
        'Scale consumers horizontally',
        'Increase consumer processing rate',
        'Enable message prioritization',
      ],
      escalation: 'P2 - Platform team',
      runbookSection: 'queue-overflow',
    },
    {
      id: 'queue-poison-message',
      name: 'Poison Message',
      description: 'Malformed message causing consumer failures',
      category: 'queue',
      severity: 'high',
      likelihood: 'low',
      detection: [
        'Repeated processing failures',
        'Consumer crash loops',
        'Dead letter queue growth',
      ],
      mitigation: [
        'Move message to DLQ',
        'Implement message validation',
        'Add circuit breaker to consumer',
      ],
      escalation: 'P2 - Development team',
      runbookSection: 'poison-message',
    },
  ],
  application: [
    {
      id: 'app-memory-leak',
      name: 'Memory Leak',
      description: 'Gradual memory consumption leading to OOM',
      category: 'application',
      severity: 'critical',
      likelihood: 'medium',
      detection: ['Steadily increasing memory usage', 'Increasing GC frequency', 'OOM kills'],
      mitigation: [
        'Restart affected instances',
        'Capture heap dump for analysis',
        'Roll back recent deployments',
      ],
      escalation: 'P1 - Development team',
      runbookSection: 'memory-leak',
    },
    {
      id: 'app-thread-exhaustion',
      name: 'Thread Pool Exhaustion',
      description: 'All threads blocked or in use',
      category: 'application',
      severity: 'high',
      likelihood: 'medium',
      detection: [
        'Thread pool utilization at 100%',
        'Request queue growing',
        'Increased response latency',
      ],
      mitigation: [
        'Increase thread pool size',
        'Identify and fix blocking calls',
        'Enable request timeout',
      ],
      escalation: 'P2 - Development team',
      runbookSection: 'thread-exhaustion',
    },
    {
      id: 'app-config-error',
      name: 'Configuration Error',
      description: 'Invalid configuration causing service failure',
      category: 'application',
      severity: 'high',
      likelihood: 'medium',
      detection: [
        'Startup failures',
        'Configuration validation errors',
        'Service behaving unexpectedly',
      ],
      mitigation: [
        'Roll back configuration changes',
        'Use configuration validation',
        'Enable configuration hot-reload',
      ],
      escalation: 'P2 - Development team',
      runbookSection: 'config-error',
    },
  ],
  external: [
    {
      id: 'external-api-failure',
      name: 'Third-Party API Failure',
      description: 'External API becoming unavailable or slow',
      category: 'external',
      severity: 'high',
      likelihood: 'medium',
      detection: ['Increased error rate from API calls', 'Timeout errors', 'Rate limit responses'],
      mitigation: [
        'Enable circuit breaker',
        'Use cached/fallback data',
        'Implement request queuing',
      ],
      escalation: 'P2 - Development team',
      runbookSection: 'third-party-failure',
    },
    {
      id: 'external-cloud-outage',
      name: 'Cloud Provider Outage',
      description: 'Cloud provider service disruption',
      category: 'external',
      severity: 'critical',
      likelihood: 'low',
      detection: [
        'Multiple services affected',
        'Cloud provider status page',
        'Regional connectivity issues',
      ],
      mitigation: [
        'Failover to another region',
        'Enable disaster recovery mode',
        'Use multi-cloud fallback if available',
      ],
      escalation: 'P1 - Infrastructure + leadership',
      runbookSection: 'cloud-outage',
    },
  ],
};

/**
 * Get failure modes by category
 */
export function getFailureModesByCategory(category: string): FailureMode[] {
  return FAILURE_CATALOG[category] ?? [];
}

/**
 * Get all failure modes from the catalog
 */
export function getAllFailureModes(): FailureMode[] {
  return Object.values(FAILURE_CATALOG).flat();
}

/**
 * Find failure modes by name
 */
export function findFailureMode(name: string): FailureMode | undefined {
  return getAllFailureModes().find((mode) => mode.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get detection strategies for a failure mode
 */
export function getDetectionStrategies(failureMode: FailureMode): string[] {
  if (Array.isArray(failureMode.detection)) {
    return failureMode.detection;
  }
  return failureMode.detection.symptoms;
}

/**
 * Get mitigation strategies for a failure mode
 */
export function getMitigationStrategies(failureMode: FailureMode): string[] {
  return failureMode.mitigation;
}
