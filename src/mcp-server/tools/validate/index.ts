/**
 * Validation Tools - Layer 3 MCP tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function registerValidateTools(): Tool[] {
  return [
    {
      name: 'runbook.validate.completeness',
      description: 'Check runbook completeness and identify missing sections',
      inputSchema: {
        type: 'object',
        properties: {
          runbook: { type: 'object', description: 'The runbook to validate' },
          required_sections: { type: 'array', items: { type: 'string' }, description: 'List of required sections' },
        },
        required: ['runbook'],
      },
    },
    {
      name: 'runbook.validate.accuracy',
      description: 'Validate runbook accuracy against the actual codebase',
      inputSchema: {
        type: 'object',
        properties: {
          runbook: { type: 'object', description: 'The runbook to validate' },
          analysis_context: { type: 'object', description: 'Current analysis context for comparison' },
        },
        required: ['runbook', 'analysis_context'],
      },
    },
    {
      name: 'runbook.validate.links',
      description: 'Verify runbook cross-references and internal links',
      inputSchema: {
        type: 'object',
        properties: {
          runbook: { type: 'object', description: 'The runbook to validate' },
        },
        required: ['runbook'],
      },
    },
    {
      name: 'runbook.validate.ci',
      description: 'Run CI-style validation gate with configurable thresholds',
      inputSchema: {
        type: 'object',
        properties: {
          runbook: { type: 'object', description: 'The runbook to validate' },
          analysis_context: { type: 'object', description: 'Current analysis context for accuracy validation' },
          thresholds: {
            type: 'object',
            properties: {
              completeness_min: { type: 'number', description: 'Minimum completeness score', default: 0.8 },
              accuracy_min: { type: 'number', description: 'Minimum accuracy score', default: 0.7 },
            },
          },
        },
        required: ['runbook'],
      },
    },
  ];
}
