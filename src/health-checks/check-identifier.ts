/**
 * Check Identifier - Identifies health check endpoints from code
 */

import { type AnalysisContext, type HealthCheck } from '../types/domain.js';
import { listFiles, readFile } from '../utils/index.js';
import * as path from 'path';

export interface HealthCheckCandidate {
  endpoint: string;
  type: 'liveness' | 'readiness' | 'startup' | 'deep';
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

/**
 * Identify existing health checks in the codebase
 */
export function identifyHealthChecks(
  repoPath: string,
  context: AnalysisContext,
): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const candidates: HealthCheckCandidate[] = [];

  // Scan for health check endpoints
  const files = listFiles(repoPath, true);
  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    const relativePath = path.relative(repoPath, file);

    // Check for common health check patterns
    const patterns = extractHealthCheckPatterns(content);
    for (const pattern of patterns) {
      candidates.push({
        ...pattern,
        source: relativePath,
      });
    }
  }

  // Convert candidates to health checks
  for (const candidate of candidates) {
    checks.push(createHealthCheckFromCandidate(candidate, context));
  }

  // Add recommended checks based on dependencies
  const recommendedChecks = generateRecommendedChecks(context);
  for (const check of recommendedChecks) {
    if (!checks.find(c => c.endpoint === check.endpoint)) {
      checks.push(check);
    }
  }

  return checks;
}

/**
 * Extract health check patterns from code
 */
function extractHealthCheckPatterns(content: string): Omit<HealthCheckCandidate, 'source'>[] {
  const patterns: Omit<HealthCheckCandidate, 'source'>[] = [];

  // Match Express.js health check routes
  const expressMatches = content.matchAll(/app\.get\(['"`]\/(health|ready|live|startup)['"`]/g);
  for (const match of expressMatches) {
    const endpoint = match[1]!;
    patterns.push({
      endpoint: `/${endpoint}`,
      type: mapEndpointToType(endpoint),
      confidence: 'high',
    });
  }

  // Match FastAPI/Flask health check routes
  const pythonMatches = content.matchAll(/@(app|router)\.get\(['"`]\/(health|ready|live|startup)['"`]/g);
  for (const match of pythonMatches) {
    const endpoint = match[2]!;
    patterns.push({
      endpoint: `/${endpoint}`,
      type: mapEndpointToType(endpoint),
      confidence: 'high',
    });
  }

  // Match Spring Boot actuator endpoints
  const springMatches = content.matchAll(/@(GetMapping|RequestMapping)\(['"`]\/(health|ready|live)['"`]/g);
  for (const match of springMatches) {
    const endpoint = match[2]!;
    patterns.push({
      endpoint: `/actuator/${endpoint}`,
      type: mapEndpointToType(endpoint),
      confidence: 'high',
    });
  }

  // Match Go HTTP handlers
  const goMatches = content.matchAll(/http\.HandleFunc\(['"`]\/(health|ready|live|startup)['"`]/g);
  for (const match of goMatches) {
    const endpoint = match[1]!;
    patterns.push({
      endpoint: `/${endpoint}`,
      type: mapEndpointToType(endpoint),
      confidence: 'high',
    });
  }

  return patterns;
}

/**
 * Map endpoint name to health check type
 */
function mapEndpointToType(endpoint: string): HealthCheckCandidate['type'] {
  switch (endpoint) {
    case 'health':
      return 'liveness';
    case 'ready':
      return 'readiness';
    case 'live':
      return 'liveness';
    case 'startup':
      return 'startup';
    default:
      return 'liveness';
  }
}

/**
 * Create health check from candidate
 */
function createHealthCheckFromCandidate(
  candidate: HealthCheckCandidate,
  _context: AnalysisContext,
): HealthCheck {
  return {
    endpoint: candidate.endpoint,
    interval: getDefaultInterval(candidate.type),
    timeout: getDefaultTimeout(candidate.type),
    successCriteria: getDefaultSuccessCriteria(candidate.type),
    type: candidate.type,
    name: `${candidate.type} check (${candidate.endpoint})`,
  };
}

/**
 * Generate recommended health checks based on service dependencies
 */
function generateRecommendedChecks(context: AnalysisContext): HealthCheck[] {
  const checks: HealthCheck[] = [];

  // Deep health check that verifies all dependencies
  checks.push({
    endpoint: '/health/deep',
    interval: '60s',
    timeout: '10s',
    successCriteria: 'HTTP 200 with all dependencies healthy',
    type: 'deep',
    name: 'Deep health check',
  });

  // Database health check if database dependency exists
  const hasDatabase = context.externalServices.some(s => s.type === 'database');
  if (hasDatabase) {
    checks.push({
      endpoint: '/health/database',
      interval: '30s',
      timeout: '5s',
      successCriteria: 'HTTP 200 with database connection healthy',
      type: 'deep',
      name: 'Database health check',
    });
  }

  // Cache health check if cache dependency exists
  const hasCache = context.externalServices.some(s => s.type === 'cache');
  if (hasCache) {
    checks.push({
      endpoint: '/health/cache',
      interval: '30s',
      timeout: '5s',
      successCriteria: 'HTTP 200 with cache connection healthy',
      type: 'deep',
      name: 'Cache health check',
    });
  }

  return checks;
}

/**
 * Get default interval for health check type
 */
function getDefaultInterval(type: HealthCheckCandidate['type']): string {
  switch (type) {
    case 'liveness':
      return '30s';
    case 'readiness':
      return '10s';
    case 'startup':
      return '5s';
    case 'deep':
      return '60s';
    default:
      return '30s';
  }
}

/**
 * Get default timeout for health check type
 */
function getDefaultTimeout(type: HealthCheckCandidate['type']): string {
  switch (type) {
    case 'liveness':
      return '5s';
    case 'readiness':
      return '3s';
    case 'startup':
      return '1s';
    case 'deep':
      return '10s';
    default:
      return '5s';
  }
}

/**
 * Get default success criteria for health check type
 */
function getDefaultSuccessCriteria(type: HealthCheckCandidate['type']): string {
  switch (type) {
    case 'liveness':
      return 'HTTP 200';
    case 'readiness':
      return 'HTTP 200 with all dependencies healthy';
    case 'startup':
      return 'HTTP 200 after initialization';
    case 'deep':
      return 'HTTP 200 with all checks passing';
    default:
      return 'HTTP 200';
  }
}

/**
 * Suggest health checks based on service type
 */
export function suggestHealthChecks(serviceType: string): HealthCheck[] {
  const checks: HealthCheck[] = [];

  // Standard checks for all services
  checks.push(
    {
      endpoint: '/health',
      interval: '30s',
      timeout: '5s',
      successCriteria: 'HTTP 200',
      type: 'liveness',
      name: 'Liveness probe',
    },
    {
      endpoint: '/ready',
      interval: '10s',
      timeout: '3s',
      successCriteria: 'HTTP 200',
      type: 'readiness',
      name: 'Readiness probe',
    },
  );

  // Additional checks based on service type
  if (serviceType.includes('api') || serviceType.includes('web')) {
    checks.push({
      endpoint: '/health/deep',
      interval: '60s',
      timeout: '10s',
      successCriteria: 'HTTP 200 with all dependencies healthy',
      type: 'deep',
      name: 'Deep health check',
    });
  }

  if (serviceType.includes('worker') || serviceType.includes('queue')) {
    checks.push({
      endpoint: '/health/queue',
      interval: '30s',
      timeout: '5s',
      successCriteria: 'HTTP 200 with queue connection healthy',
      type: 'deep',
      name: 'Queue health check',
    });
  }

  return checks;
}
