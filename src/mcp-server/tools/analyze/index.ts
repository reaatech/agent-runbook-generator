/**
 * Analysis Tools - Layer 1 MCP tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function registerAnalyzeTools(): Tool[] {
  return [
    {
      name: 'runbook.analyze.repository',
      description: 'Analyze a service repository structure, language, framework, and configuration',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the repository' },
          depth: { type: 'number', description: 'Analysis depth (default: 3)', default: 3 },
          include_patterns: { type: 'array', items: { type: 'string' }, description: 'File patterns to include' },
          exclude_patterns: { type: 'array', items: { type: 'string' }, description: 'File patterns to exclude' },
        },
        required: ['path'],
      },
    },
    {
      name: 'runbook.analyze.dependencies',
      description: 'Map service dependencies including direct, transitive, and external services',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the repository' },
          include_dev: { type: 'boolean', description: 'Include dev dependencies', default: false },
        },
        required: ['path'],
      },
    },
    {
      name: 'runbook.analyze.failure_modes',
      description: 'Identify potential failure modes and single points of failure',
      inputSchema: {
        type: 'object',
        properties: {
          analysis_context: { type: 'object', description: 'Analysis context from previous analysis' },
          depth: { type: 'string', enum: ['shallow', 'medium', 'deep'], description: 'Analysis depth', default: 'medium' },
        },
        required: ['analysis_context'],
      },
    },
    {
      name: 'runbook.analyze.alerts',
      description: 'Extract existing alert definitions and suggest new alerts',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the repository' },
          platform: { type: 'string', enum: ['prometheus', 'datadog', 'cloudwatch', 'any'], description: 'Monitoring platform', default: 'any' },
        },
        required: ['path'],
      },
    },
    {
      name: 'runbook.analyze.health_checks',
      description: 'Analyze existing health checks and identify gaps',
      inputSchema: {
        type: 'object',
        properties: {
          analysis_context: { type: 'object', description: 'Analysis context from repository scan' },
        },
        required: ['analysis_context'],
      },
    },
  ];
}
