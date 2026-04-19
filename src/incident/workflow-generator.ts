/**
 * Workflow Generator - Generates incident response workflows
 */

import {
  type AnalysisContext,
  type IncidentWorkflow,
  type EscalationPolicy,
  type CommunicationTemplate,
  type EscalationMatrix,
} from '../types/domain.js';
import { generateId } from '../utils/index.js';

export interface WorkflowConfig {
  serviceName: string;
  teamName: string;
  severityLevels?: string[];
  escalationContacts?: string[];
}

function createEscalationMatrix(): EscalationMatrix {
  return {
    levels: [
      {
        level: 1,
        afterMinutes: 0,
        contacts: ['on-call-engineer'],
        channels: ['pagerduty', 'slack'],
      },
      {
        level: 2,
        afterMinutes: 5,
        contacts: ['tech-lead'],
        channels: ['slack', 'sms'],
      },
      {
        level: 3,
        afterMinutes: 10,
        contacts: ['engineering-manager'],
        channels: ['slack', 'phone'],
      },
      {
        level: 4,
        afterMinutes: 30,
        contacts: ['vp-engineering'],
        channels: ['phone'],
      },
    ],
  };
}

/**
 * Generate incident response workflows
 */
export function generateIncidentWorkflows(
  _context: AnalysisContext,
  config: WorkflowConfig,
): IncidentWorkflow[] {
  const workflows: IncidentWorkflow[] = [];

  // P1 - Critical
  workflows.push({
    id: generateId('workflow'),
    name: 'P1 Critical Incident Response',
    description: 'Response procedure for critical incidents affecting service availability',
    severity: 'critical',
    responseTime: '5 minutes',
    triggers: ['pagerduty_alert', 'monitoring_threshold', 'manual_escalation'],
    escalationPath: [
      'On-call engineer (immediate page)',
      'Tech lead (if no response in 5 min)',
      'Engineering manager (if no response in 10 min)',
      'VP Engineering (if no resolution in 30 min)',
    ],
    escalationMatrix: createEscalationMatrix(),
    communicationTemplates: generateCommunicationTemplates(config, 'critical'),
    steps: [
      'Acknowledge the alert in PagerDuty',
      'Join the incident bridge call',
      'Assess the impact and scope',
      'Assign roles (Incident Commander, Communications, Tech Lead)',
      'Begin troubleshooting using runbook',
      'Implement fix or workaround',
      'Verify resolution',
      'Document timeline and actions',
      'Conduct post-incident review',
    ],
  });

  // P2 - High
  workflows.push({
    id: generateId('workflow'),
    name: 'P2 High Severity Incident Response',
    description: 'Response procedure for significant service degradation',
    severity: 'high',
    responseTime: '15 minutes',
    triggers: ['pagerduty_alert', 'monitoring_threshold', 'customer_report'],
    escalationPath: [
      'On-call engineer (Slack + SMS)',
      'Tech lead (if no resolution in 30 min)',
      'Engineering manager (if no resolution in 1 hour)',
    ],
    escalationMatrix: createEscalationMatrix(),
    communicationTemplates: generateCommunicationTemplates(config, 'high'),
    steps: [
      'Acknowledge the alert',
      'Assess the impact',
      'Check relevant dashboards and logs',
      'Follow runbook procedures',
      'Escalate if needed',
      'Document actions taken',
      'Update status page if customer-facing',
    ],
  });

  // P3 - Medium
  workflows.push({
    id: generateId('workflow'),
    name: 'P3 Medium Severity Incident Response',
    description: 'Response procedure for minor service issues',
    severity: 'medium',
    responseTime: '1 hour',
    triggers: ['slack_notification', 'monitoring_warning', 'ticket_escalation'],
    escalationPath: [
      'On-call engineer (Slack notification)',
      'Development team (during business hours)',
    ],
    escalationMatrix: createEscalationMatrix(),
    communicationTemplates: generateCommunicationTemplates(config, 'medium'),
    steps: [
      'Review the alert during normal hours',
      'Investigate root cause',
      'Plan and schedule fix',
      'Deploy fix following standard process',
      'Monitor for resolution',
    ],
  });

  // P4 - Low
  workflows.push({
    id: generateId('workflow'),
    name: 'P4 Low Severity Incident Response',
    description: 'Response procedure for minor issues and bugs',
    severity: 'low',
    responseTime: 'Next business day',
    triggers: ['ticket_creation', 'monitoring_info'],
    escalationPath: [
      'Development team (ticket assignment)',
    ],
    escalationMatrix: createEscalationMatrix(),
    communicationTemplates: generateCommunicationTemplates(config, 'low'),
    steps: [
      'Create ticket for tracking',
      'Prioritize in sprint planning',
      'Implement fix',
      'Deploy following standard process',
    ],
  });

  return workflows;
}

/**
 * Generate communication templates for incident response
 */
function generateCommunicationTemplates(
  config: WorkflowConfig,
  severity: string,
): CommunicationTemplate[] {
  const templates: CommunicationTemplate[] = [];

  // Initial notification
  templates.push({
    id: generateId('template'),
    name: 'Initial Incident Notification',
    type: 'slack',
    channel: 'slack',
    subject: `[${severity.toUpperCase()}] Incident detected for ${config.serviceName}`,
    body: `:rotating_light: *${severity.toUpperCase()} Incident Detected*

*Service:* ${config.serviceName}
*Team:* ${config.teamName}
*Time:* ${new Date().toISOString()}

*Impact:* Investigating...
*Status:* Investigation started

Join bridge: [link]
Runbook: [link]`,
    variables: ['service', 'team', 'time', 'impact'],
  });

  // Status page update
  templates.push({
    id: generateId('template'),
    body: `We are currently investigating issues with ${config.serviceName}. Our team has been notified and is working on a resolution. We will provide updates as more information becomes available.`,
    name: 'Status Page Update',
    subject: `Service Disruption - ${config.serviceName}`,
    type: 'status_page',
    channel: 'status-page',
    variables: ['service'],
  });

  // Resolution notification
  templates.push({
    id: generateId('template'),
    name: 'Incident Resolution Notification',
    type: 'slack',
    channel: 'slack',
    subject: `[RESOLVED] ${severity.toUpperCase()} Incident for ${config.serviceName}`,
    body: `:white_check_mark: *Incident Resolved*

*Service:* ${config.serviceName}
*Severity:* ${severity.toUpperCase()}
*Duration:* [duration]
*Root Cause:* [to be filled]

Service has been restored. A post-mortem will be conducted.`,
    variables: ['service', 'severity'],
  });

  return templates;
}

/**
 * Generate escalation policy
 */
export function generateEscalationPolicy(
  config: WorkflowConfig,
): EscalationPolicy {
  return {
    name: `${config.serviceName} Escalation Policy`,
    levels: [
      {
        delayMinutes: 0,
        targets: ['on-call-engineer'],
        notificationChannels: ['pagerduty', 'slack', 'sms'],
      },
      {
        delayMinutes: 10,
        targets: ['tech-lead'],
        notificationChannels: ['pagerduty', 'slack', 'sms'],
      },
      {
        delayMinutes: 20,
        targets: ['engineering-manager'],
        notificationChannels: ['pagerduty', 'slack', 'phone'],
      },
    ],
    repeatPolicy: {
      enabled: true,
      repeatAfterMinutes: 30,
      maxRepeats: 3,
    },
  };
}

/**
 * Generate standard incident response workflow
 */
export function generateStandardWorkflow(
  _context: AnalysisContext,
  config: WorkflowConfig,
): IncidentWorkflow {
  return {
    id: generateId('workflow'),
    name: `${config.serviceName} Incident Response`,
    description: `Standard incident response workflow for ${config.serviceName}`,
    severity: 'medium',
    responseTime: '15 minutes',
    triggers: ['alert', 'manual_review'],
    escalationPath: [
      `On-call engineer for ${config.teamName}`,
      `${config.teamName} tech lead`,
      'Engineering leadership',
    ],
    escalationMatrix: createEscalationMatrix(),
    communicationTemplates: generateCommunicationTemplates(config, 'medium'),
    steps: [
      'Acknowledge the alert',
      'Assess impact on users',
      'Check service dashboards',
      'Review recent deployments',
      'Check dependency health',
      'Follow runbook procedures',
      'Escalate if needed',
      'Document actions',
      'Verify resolution',
    ],
  };
}