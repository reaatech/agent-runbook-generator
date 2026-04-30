/**
 * Communication Templates - Templates for incident communication
 */

import { type CommunicationTemplate } from '@reaatech/agent-runbook';
import { generateId } from '@reaatech/agent-runbook';

export interface TemplateCategory {
  id: string;
  name: string;
  templates: CommunicationTemplate[];
}

/**
 * Pre-built communication templates
 */
export const COMMUNICATION_TEMPLATES: TemplateCategory[] = [
  {
    id: 'incident-notification',
    name: 'Incident Notification',
    templates: [
      {
        id: generateId('template'),
        name: 'Initial Slack Notification',
        type: 'slack',
        channel: 'slack',
        subject: '[{severity}] Incident detected for {service}',
        body: `:rotating_light: *${'{severity}'.toUpperCase()} Incident Detected*

*Service:* {service}
*Team:* {team}
*Time:* {time}

*Impact:* {impact}
*Status:* Investigation started

*Links:*
• Dashboard: {dashboard_url}
• Logs: {logs_url}
• Runbook: {runbook_url}

Join incident bridge: {bridge_url}`,
        variables: [
          'severity',
          'service',
          'team',
          'time',
          'impact',
          'dashboard_url',
          'logs_url',
          'runbook_url',
          'bridge_url',
        ],
      },
      {
        id: generateId('template'),
        name: 'Email Notification',
        type: 'email',
        channel: 'email',
        subject: '[{severity}] Incident: {service} - {impact}',
        body: `Incident Alert

Service: {service}
Severity: {severity}
Time: {time}

Impact:
{impact}

Current Status:
Investigation has begun. The on-call engineer has been paged.

Next Update:
We will provide an update within {update_interval} minutes.

Links:
- Dashboard: {dashboard_url}
- Runbook: {runbook_url}
- Incident Bridge: {bridge_url}

This is an automated message from the incident response system.`,
        variables: [
          'severity',
          'service',
          'time',
          'impact',
          'update_interval',
          'dashboard_url',
          'runbook_url',
          'bridge_url',
        ],
      },
    ],
  },
  {
    id: 'status-updates',
    name: 'Status Updates',
    templates: [
      {
        id: generateId('template'),
        name: 'Investigation Update',
        type: 'slack',
        channel: 'slack',
        subject: 'Update: {service} incident investigation',
        body: `:mag: *Investigation Update*

*Service:* {service}
*Duration:* {duration}

*Current Status:*
{status}

*What we know:*
{findings}

*What we're doing:*
{actions}

*Next update:* {next_update}`,
        variables: ['service', 'duration', 'status', 'findings', 'actions', 'next_update'],
      },
      {
        id: generateId('template'),
        name: 'Status Page Update',
        type: 'status_page',
        channel: 'status-page',
        subject: 'Service Disruption - {service}',
        body: `We are currently experiencing issues with {service}. Our team has been notified and is actively investigating. We will provide updates as more information becomes available.

Current Impact: {impact}

Estimated Time to Resolution: {etra}

We apologize for any inconvenience.`,
        variables: ['service', 'impact', 'etra'],
      },
    ],
  },
  {
    id: 'resolution',
    name: 'Resolution',
    templates: [
      {
        id: generateId('template'),
        name: 'Resolution Notification',
        type: 'slack',
        channel: 'slack',
        subject: '[RESOLVED] {service} incident',
        body: `:white_check_mark: *Incident Resolved*

*Service:* {service}
*Severity:* {severity}
*Duration:* {duration}
*Root Cause:* {root_cause}

*Resolution:*
{resolution}

*Next Steps:*
• Monitoring for stability
• Post-mortem scheduled for {postmortem_date}
• Follow-up actions will be tracked

Thank you to everyone who helped resolve this incident!`,
        variables: [
          'service',
          'severity',
          'duration',
          'root_cause',
          'resolution',
          'postmortem_date',
        ],
      },
      {
        id: generateId('template'),
        name: 'All Clear Status Page',
        type: 'status_page',
        channel: 'status-page',
        subject: 'Service Restored - {service}',
        body: `The issue with {service} has been resolved. All systems are now operating normally.

Resolution Time: {duration}
Root Cause: {root_cause}

We apologize for any inconvenience caused. A post-mortem will be conducted to prevent future occurrences.`,
        variables: ['service', 'duration', 'root_cause'],
      },
    ],
  },
  {
    id: 'postmortem',
    name: 'Post-Mortem',
    templates: [
      {
        id: generateId('template'),
        name: 'Post-Mortem Announcement',
        type: 'email',
        channel: 'email',
        subject: 'Post-Mortem: {service} incident on {date}',
        body: `Post-Mortem: {service} Incident

Date: {date}
Duration: {duration}
Severity: {severity}

Summary:
{summary}

Impact:
{impact}

Root Cause:
{root_cause}

Action Items:
{action_items}

The full post-mortem document is available at: {postmortem_url}

Please review and provide feedback by {feedback_deadline}.`,
        variables: [
          'service',
          'date',
          'duration',
          'severity',
          'summary',
          'impact',
          'root_cause',
          'action_items',
          'postmortem_url',
          'feedback_deadline',
        ],
      },
    ],
  },
  {
    id: 'handoff',
    name: 'Shift Handoff',
    templates: [
      {
        id: generateId('template'),
        name: 'Shift Handoff Summary',
        type: 'slack',
        channel: 'slack',
        subject: 'Shift handoff - {date}',
        body: `:hand: *Shift Handoff*

*Date:* {date}
*Outgoing:* {outgoing}
*Incoming:* {incoming}

*Active Incidents:*
{active_incidents}

*Items Requiring Attention:*
{pending_items}

*Recent Changes:*
{recent_changes}

*Watch List:*
{watch_list}

Any questions? Reach out to {outgoing} before end of shift.`,
        variables: [
          'date',
          'outgoing',
          'incoming',
          'active_incidents',
          'pending_items',
          'recent_changes',
          'watch_list',
        ],
      },
    ],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(categoryId: string): CommunicationTemplate[] {
  const category = COMMUNICATION_TEMPLATES.find((c) => c.id === categoryId);
  return category?.templates ?? [];
}

/**
 * Get a specific template by name
 */
export function getTemplateByName(name: string): CommunicationTemplate | undefined {
  for (const category of COMMUNICATION_TEMPLATES) {
    const template = category.templates.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (template) return template;
  }
  return undefined;
}

/**
 * Apply variables to a template
 */
export function applyTemplateVariables(
  template: CommunicationTemplate,
  variables: Record<string, string>,
): CommunicationTemplate {
  const applyVars = (text: string) => {
    return text.replace(/{(\w+)}/g, (_match, key: string) => variables[key] ?? _match);
  };

  return {
    ...template,
    subject: template.subject ? applyVars(template.subject) : undefined,
    body: applyVars(template.body),
  };
}

/**
 * Create a custom communication template
 */
export function createTemplate(
  name: string,
  type: CommunicationTemplate['type'],
  subject: string,
  body: string,
): CommunicationTemplate {
  return {
    id: generateId('template'),
    name,
    type,
    channel: type as 'slack' | 'email' | 'pagerduty' | 'status-page',
    subject,
    body,
    variables: [],
  };
}
