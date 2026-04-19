/**
 * Generation Tools - Layer 2 MCP tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function registerGenerateTools(): Tool[] {
  return [
    {
      name: 'runbook.generate.full',
      description: 'Generate a complete runbook with all sections',
      inputSchema: {
        type: 'object',
        properties: {
          analysis_context: { type: 'object', description: 'Analysis context from repository analysis' },
          config: { type: 'object', description: 'Generation configuration' },
        },
        required: ['analysis_context'],
      },
    },
    {
      name: 'runbook.generate.alerts',
      description: 'Generate alert definitions based on service patterns and SLO targets',
      inputSchema: {
        type: 'object',
        properties: {
          analysis_context: { type: 'object', description: 'Analysis context' },
          slo_targets: { type: 'object', description: 'SLO targets for alert thresholds' },
          platform: { type: 'string', enum: ['prometheus', 'datadog', 'cloudwatch'], description: 'Target monitoring platform' },
        },
        required: ['analysis_context', 'platform'],
      },
    },
    {
      name: 'runbook.generate.dashboard',
      description: 'Generate dashboard configuration for Grafana, Looker, or CloudWatch',
      inputSchema: {
        type: 'object',
        properties: {
          service_context: { type: 'object', description: 'Service analysis context' },
          platform: { type: 'string', enum: ['grafana', 'looker', 'cloudwatch'], description: 'Target dashboard platform' },
        },
        required: ['service_context', 'platform'],
      },
    },
    {
      name: 'runbook.generate.rollback',
      description: 'Generate rollback procedures for deployment failures',
      inputSchema: {
        type: 'object',
        properties: {
          deployment_config: { type: 'object', description: 'Deployment configuration' },
          failure_scenarios: { type: 'array', items: { type: 'string' }, description: 'Specific failure scenarios to handle' },
        },
        required: ['deployment_config'],
      },
    },
    {
      name: 'runbook.generate.incident_workflow',
      description: 'Generate incident response workflows and communication templates',
      inputSchema: {
        type: 'object',
        properties: {
          service_context: { type: 'object', description: 'Service analysis context' },
          team_config: { type: 'object', description: 'Team configuration for escalation' },
        },
        required: ['service_context'],
      },
    },
    {
      name: 'runbook.generate.service_map',
      description: 'Generate service dependency graph',
      inputSchema: {
        type: 'object',
        properties: {
          analysis_context: { type: 'object', description: 'Analysis context' },
          format: { type: 'string', enum: ['mermaid', 'dot', 'json', 'yaml'], description: 'Output format', default: 'mermaid' },
        },
        required: ['analysis_context'],
      },
    },
    {
      name: 'runbook.generate.health_checks',
      description: 'Generate health check definitions for Kubernetes and load balancers',
      inputSchema: {
        type: 'object',
        properties: {
          service_context: { type: 'object', description: 'Service analysis context' },
          platform: { type: 'string', enum: ['kubernetes', 'load-balancer', 'prometheus', 'datadog'], description: 'Target platform' },
        },
        required: ['service_context', 'platform'],
      },
    },
  ];
}
