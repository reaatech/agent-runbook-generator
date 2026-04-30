/**
 * Generate Health Checks - MCP tool handler
 */

import type { AnalysisContext, RepositoryAnalysis } from '@reaatech/agent-runbook';
import { scanRepository } from '@reaatech/agent-runbook-analyzer';
import {
  generateHealthChecks,
  generateKubernetesProbeYaml,
  type HealthCheckConfig,
} from '@reaatech/agent-runbook-health-checks';
import { mapDependencies } from '@reaatech/agent-runbook-analyzer';

interface HealthChecksArgs {
  service_context: {
    path?: string;
    repository?: string;
    serviceName?: string;
    port?: number;
    endpoint?: string;
  };
  platform: 'kubernetes' | 'load-balancer' | 'prometheus' | 'datadog';
}

export async function execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { service_context, platform } = args as unknown as HealthChecksArgs;

  const repoPath = service_context?.path || service_context?.repository || '.';
  const serviceName = service_context?.serviceName || 'unknown-service';
  const port = service_context?.port || 8080;
  const endpoint = service_context?.endpoint || '/health';

  const repoAnalysis: RepositoryAnalysis = await scanRepository(repoPath);
  const depAnalysis = mapDependencies(repoPath);

  const context: AnalysisContext = {
    serviceDefinition: {
      name: serviceName,
      repository: repoPath,
    },
    repositoryAnalysis: {
      serviceName: repoAnalysis.serviceName,
      serviceType: repoAnalysis.serviceType,
      language: repoAnalysis.language,
      framework: repoAnalysis.framework,
      structure: repoAnalysis.structure,
      configFiles: repoAnalysis.configFiles,
      entryPoints: repoAnalysis.entryPoints,
      externalServices: repoAnalysis.externalServices,
    },
    dependencyAnalysis: {
      directDeps: depAnalysis.directDeps,
      transitiveDeps: depAnalysis.transitiveDeps,
      dependencyGraph: depAnalysis.dependencyGraph,
      externalServices: depAnalysis.externalServices,
    },
    deploymentPlatform: 'kubernetes',
    monitoringPlatform: 'prometheus',
    externalServices: repoAnalysis.externalServices,
  };

  const config: HealthCheckConfig = {
    platform,
    serviceName,
    port,
    path: endpoint,
  };

  const checks = generateHealthChecks(repoPath, context, config);
  const yamlConfig = generateKubernetesProbeYaml(
    checks,
    serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
  );

  return {
    serviceName,
    platform,
    checks: checks.map((c) => ({
      name: c.name,
      type: c.type,
      endpoint: c.endpoint,
      interval: c.interval,
      timeout: c.timeout,
      successCriteria: c.successCriteria,
    })),
    kubernetesConfig: platform === 'kubernetes' ? yamlConfig : undefined,
    summary: {
      totalChecks: checks.length,
      livenessChecks: checks.filter((c) => c.type === 'liveness').length,
      readinessChecks: checks.filter((c) => c.type === 'readiness').length,
      startupChecks: checks.filter((c) => c.type === 'startup').length,
    },
  };
}
