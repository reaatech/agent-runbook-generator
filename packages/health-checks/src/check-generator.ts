/**
 * Check Generator - Generates health check definitions
 */

import type { AnalysisContext, HealthCheck } from '@reaatech/agent-runbook';
import { parseDuration } from '@reaatech/agent-runbook';
import { identifyHealthChecks } from './check-identifier.js';

export interface HealthCheckConfig {
  platform: 'kubernetes' | 'load-balancer' | 'prometheus' | 'datadog';
  serviceName: string;
  port?: number;
  path?: string;
}

/**
 * Generate health check definitions
 */
export function generateHealthChecks(
  repoPath: string,
  context: AnalysisContext,
  config: HealthCheckConfig,
): HealthCheck[] {
  // First identify existing health checks
  const existingChecks = identifyHealthChecks(repoPath, context);

  // Generate platform-specific checks
  const platformChecks = generatePlatformChecks(config, context);

  // Merge and deduplicate
  const allChecks = [...existingChecks];
  for (const check of platformChecks) {
    if (!allChecks.find((c) => c.endpoint === check.endpoint && c.type === check.type)) {
      allChecks.push(check);
    }
  }

  return allChecks;
}

/**
 * Generate platform-specific health checks
 */
function generatePlatformChecks(
  config: HealthCheckConfig,
  _context: AnalysisContext,
): HealthCheck[] {
  switch (config.platform) {
    case 'kubernetes':
      return generateKubernetesChecks(config);
    case 'load-balancer':
      return generateLoadBalancerChecks(config);
    case 'prometheus':
      return generatePrometheusChecks(config);
    case 'datadog':
      return generateDatadogChecks(config);
    default:
      return generateKubernetesChecks(config);
  }
}

/**
 * Generate Kubernetes health check probes
 */
function generateKubernetesChecks(config: HealthCheckConfig): HealthCheck[] {
  const path = config.path ?? '/health';

  return [
    {
      endpoint: path,
      interval: '10s',
      timeout: '5s',
      successCriteria: 'HTTP 200',
      type: 'liveness',
      name: 'Kubernetes liveness probe',
    },
    {
      endpoint: `${path}/ready`,
      interval: '5s',
      timeout: '3s',
      successCriteria: 'HTTP 200',
      type: 'readiness',
      name: 'Kubernetes readiness probe',
    },
    {
      endpoint: `${path}/startup`,
      interval: '10s',
      timeout: '5s',
      successCriteria: 'HTTP 200',
      type: 'startup',
      name: 'Kubernetes startup probe',
    },
  ];
}

/**
 * Generate load balancer health checks
 */
function generateLoadBalancerChecks(config: HealthCheckConfig): HealthCheck[] {
  const path = config.path ?? '/health';
  const port = config.port ?? 8080;

  return [
    {
      endpoint: path,
      interval: '30s',
      timeout: '5s',
      successCriteria: `HTTP 200 on port ${port}`,
      type: 'liveness',
      name: 'Load balancer health check',
    },
  ];
}

/**
 * Generate Prometheus-compatible health checks
 */
function generatePrometheusChecks(_config: HealthCheckConfig): HealthCheck[] {
  return [
    {
      endpoint: '/metrics',
      interval: '15s',
      timeout: '5s',
      successCriteria: 'HTTP 200 with Prometheus metrics',
      type: 'liveness',
      name: 'Prometheus metrics endpoint',
    },
    {
      endpoint: '/health',
      interval: '30s',
      timeout: '5s',
      successCriteria: 'HTTP 200',
      type: 'liveness',
      name: 'Health check for Prometheus blackbox',
    },
  ];
}

/**
 * Generate Datadog-compatible health checks
 */
function generateDatadogChecks(_config: HealthCheckConfig): HealthCheck[] {
  return [
    {
      endpoint: '/health',
      interval: '15s',
      timeout: '5s',
      successCriteria: 'HTTP 200',
      type: 'liveness',
      name: 'Datadog health check',
    },
    {
      endpoint: '/ready',
      interval: '10s',
      timeout: '3s',
      successCriteria: 'HTTP 200',
      type: 'readiness',
      name: 'Datadog readiness check',
    },
  ];
}

/**
 * Generate Kubernetes probe YAML
 */
export function generateKubernetesProbeYaml(
  checks: HealthCheck[],
  containerName = 'app',
  port = 8080,
): string {
  const liveness = checks.find((c) => c.type === 'liveness');
  const readiness = checks.find((c) => c.type === 'readiness');
  const startup = checks.find((c) => c.type === 'startup');

  let yaml = `containers:\n  - name: ${containerName}\n`;

  if (liveness) {
    yaml += '    livenessProbe:\n';
    yaml += '      httpGet:\n';
    yaml += `        path: ${liveness.endpoint}\n`;
    yaml += `        port: ${port}\n`;
    yaml += '      initialDelaySeconds: 15\n';
    yaml += `      periodSeconds: ${Math.round(parseDuration(liveness.interval))}\n`;
    yaml += `      timeoutSeconds: ${Math.round(parseDuration(liveness.timeout))}\n`;
    yaml += '      successThreshold: 1\n';
    yaml += '      failureThreshold: 3\n';
  }

  if (readiness) {
    yaml += '    readinessProbe:\n';
    yaml += '      httpGet:\n';
    yaml += `        path: ${readiness.endpoint}\n`;
    yaml += `        port: ${port}\n`;
    yaml += '      initialDelaySeconds: 5\n';
    yaml += `      periodSeconds: ${Math.round(parseDuration(readiness.interval))}\n`;
    yaml += `      timeoutSeconds: ${Math.round(parseDuration(readiness.timeout))}\n`;
    yaml += '      successThreshold: 1\n';
    yaml += '      failureThreshold: 3\n';
  }

  if (startup) {
    yaml += '    startupProbe:\n';
    yaml += '      httpGet:\n';
    yaml += `        path: ${startup.endpoint}\n`;
    yaml += `        port: ${port}\n`;
    yaml += '      initialDelaySeconds: 0\n';
    yaml += `      periodSeconds: ${Math.round(parseDuration(startup.interval))}\n`;
    yaml += `      timeoutSeconds: ${Math.round(parseDuration(startup.timeout))}\n`;
    yaml += '      successThreshold: 1\n';
    yaml += '      failureThreshold: 30\n';
  }

  return yaml;
}

/**
 * Generate load balancer health check configuration
 */
export function generateLoadBalancerConfig(checks: HealthCheck[]): string {
  const check = checks.find((c) => c.type === 'liveness');
  if (!check) return '';

  return `health_check {
  path     = "${check.endpoint}"
  port     = 8080
  interval = ${Math.round(parseDuration(check.interval))}
  timeout  = ${Math.round(parseDuration(check.timeout))}
  
  healthy_threshold   = 2
  unhealthy_threshold = 3
}`;
}

/**
 * Generate health check endpoint implementation
 */
export function generateHealthCheckEndpoint(checks: HealthCheck[], language: string): string {
  switch (language) {
    case 'typescript':
      return generateTypeScriptEndpoint(checks);
    case 'python':
      return generatePythonEndpoint(checks);
    case 'go':
      return generateGoEndpoint(checks);
    default:
      return generateGenericEndpoint(checks);
  }
}

function generateTypeScriptEndpoint(_checks: HealthCheck[]): string {
  return `import { Request, Response } from 'express';

export const healthCheck = async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Add your health checks here
    // await checkDatabase();
    // await checkCache();
    // await checkExternalServices();
    
    res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    res.status(503).json(health);
  }
};

export const readinessCheck = async (req: Request, res: Response) => {
  // Add readiness-specific checks
  res.status(200).json({ status: 'ready' });
};`;
}

function generatePythonEndpoint(_checks: HealthCheck[]): string {
  return `from fastapi import FastAPI
from datetime import datetime

app = FastAPI()

@app.get("/health")
async def health_check():
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    try:
        # Add your health checks here
        # await check_database()
        # await check_cache()
        # await check_external_services()
        
        return health
    except Exception as e:
        health["status"] = "unhealthy"
        return health

@app.get("/ready")
async def readiness_check():
    # Add readiness-specific checks
    return {"status": "ready"}`;
}

function generateGoEndpoint(_checks: HealthCheck[]): string {
  return `package main

import (
	"encoding/json"
	"net/http"
	"time"
)

type HealthStatus struct {
	Status    string            \`json:"status"\`
	Timestamp string            \`json:"timestamp"\`
	Checks    map[string]bool   \`json:"checks"\`
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	health := HealthStatus{
		Status:    "healthy",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Checks:    make(map[string]bool),
	}

	// Add your health checks here
	// health.Checks["database"] = checkDatabase()
	// health.Checks["cache"] = checkCache()

	if health.Status != "healthy" {
		w.WriteHeader(http.StatusServiceUnavailable)
	}

	json.NewEncoder(w).Encode(health)
}

func ReadinessCheck(w http.ResponseWriter, r *http.Request) {
	// Add readiness-specific checks
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
}`;
}

function generateGenericEndpoint(_checks: HealthCheck[]): string {
  return `# Health Check Endpoint
# Implement based on your framework

# Endpoint: /health
# Method: GET
# Response: { "status": "healthy", "timestamp": "..." }
# Status Codes:
#   200 - Healthy
#   503 - Unhealthy

# Implementation should:
# 1. Check all critical dependencies
# 2. Return aggregate health status
# 3. Include timestamp
# 4. Be lightweight and fast`;
}
