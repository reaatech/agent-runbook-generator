/**
 * Runbook Builder - Assembles all sections into complete runbook
 */

import {
  type Runbook,
  type RunbookSection,
  type AnalysisContext,
  type AlertDefinition,
  type FailureMode,
  type RollbackProcedure,
  type IncidentWorkflow,
  type DashboardConfig,
  type HealthCheck,
  type ServiceDependency,
} from '../types/domain.js';
import { generateId } from '../utils/index.js';

export interface RunbookBuildConfig {
  title?: string;
  serviceName: string;
  team?: string;
  repository?: string;
  sections?: string[];
}

/**
 * Build a complete runbook from all generated sections
 */
export function buildRunbook(
  context: AnalysisContext,
  config: RunbookBuildConfig,
  generatedSections: {
    alerts?: AlertDefinition[];
    failureModes?: FailureMode[];
    rollbackProcedures?: RollbackProcedure[];
    incidentWorkflows?: IncidentWorkflow[];
    dashboards?: DashboardConfig[];
    healthChecks?: HealthCheck[];
    dependencies?: ServiceDependency[];
  },
): Runbook {
  const sections: RunbookSection[] = [];
  const requestedSections = new Set(
    (config.sections ?? []).map((section) => normalizeSectionName(section)),
  );
  const includeSection = (sectionName: string): boolean =>
    requestedSections.size === 0 || requestedSections.has(normalizeSectionName(sectionName));

  // Service Overview section
  if (includeSection('Service Overview')) {
    sections.push({
      id: generateId('section'),
      title: 'Service Overview',
      order: sections.length + 1,
      content: generateServiceOverview(context, config),
      subsections: [],
    });
  }

  // Quick Links section
  if (includeSection('Quick Links')) {
    sections.push({
      id: generateId('section'),
      title: 'Quick Links',
      order: sections.length + 1,
      content: generateQuickLinks(context, config),
      subsections: [],
    });
  }

  // Alerts section
  if (includeSection('Alerts') && generatedSections.alerts && generatedSections.alerts.length > 0) {
    sections.push({
      id: generateId('section'),
      title: 'Alerts',
      order: sections.length + 1,
      content: generateAlertsSection(generatedSections.alerts),
      subsections: generateAlertSubsections(generatedSections.alerts),
    });
  }

  // Dashboards section
  if (
    includeSection('Dashboards') &&
    generatedSections.dashboards &&
    generatedSections.dashboards.length > 0
  ) {
    sections.push({
      id: generateId('section'),
      title: 'Dashboards',
      order: sections.length + 1,
      content: generateDashboardsSection(generatedSections.dashboards),
      subsections: [],
    });
  }

  // Failure Modes section
  if (
    includeSection('Failure Modes') &&
    generatedSections.failureModes &&
    generatedSections.failureModes.length > 0
  ) {
    sections.push({
      id: generateId('section'),
      title: 'Failure Modes',
      order: sections.length + 1,
      content: generateFailureModesSection(generatedSections.failureModes),
      subsections: generateFailureModeSubsections(generatedSections.failureModes),
    });
  }

  // Rollback Procedures section
  if (
    includeSection('Rollback Procedures') &&
    generatedSections.rollbackProcedures &&
    generatedSections.rollbackProcedures.length > 0
  ) {
    sections.push({
      id: generateId('section'),
      title: 'Rollback Procedures',
      order: sections.length + 1,
      content: generateRollbackSection(generatedSections.rollbackProcedures),
      subsections: generateRollbackSubsections(generatedSections.rollbackProcedures),
    });
  }

  // Incident Response section
  if (
    includeSection('Incident Response') &&
    generatedSections.incidentWorkflows &&
    generatedSections.incidentWorkflows.length > 0
  ) {
    sections.push({
      id: generateId('section'),
      title: 'Incident Response',
      order: sections.length + 1,
      content: generateIncidentResponseSection(generatedSections.incidentWorkflows),
      subsections: [],
    });
  }

  // Health Checks section
  if (
    includeSection('Health Checks') &&
    generatedSections.healthChecks &&
    generatedSections.healthChecks.length > 0
  ) {
    sections.push({
      id: generateId('section'),
      title: 'Health Checks',
      order: sections.length + 1,
      content: generateHealthChecksSection(generatedSections.healthChecks),
      subsections: [],
    });
  }

  // Service Dependencies section
  if (
    includeSection('Service Dependencies') &&
    generatedSections.dependencies &&
    generatedSections.dependencies.length > 0
  ) {
    sections.push({
      id: generateId('section'),
      title: 'Service Dependencies',
      order: sections.length + 1,
      content: generateDependenciesSection(generatedSections.dependencies),
      subsections: [],
    });
  }

  return {
    id: generateId('runbook'),
    title: config.title ?? `${config.serviceName} Service Runbook`,
    serviceName: config.serviceName,
    team: config.team,
    repository: config.repository,
    sections,
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    metadata: {
      serviceType: context.repositoryAnalysis.serviceType,
      language: context.repositoryAnalysis.language,
      framework: context.repositoryAnalysis.framework,
      deploymentPlatform: context.deploymentPlatform,
      sectionsCount: sections.length,
      alertsCount: generatedSections.alerts?.length ?? 0,
      failureModesCount: generatedSections.failureModes?.length ?? 0,
      rollbackProceduresCount: generatedSections.rollbackProcedures?.length ?? 0,
    },
    crossReferences: [],
  };
}

function generateServiceOverview(context: AnalysisContext, config: RunbookBuildConfig): string {
  const repo = context.repositoryAnalysis;
  return `## Service Description

**Service Name:** ${config.serviceName}
**Team:** ${config.team ?? 'Not specified'}
**Repository:** ${config.repository ?? 'Not specified'}
**Language:** ${repo.language ?? 'Unknown'}
**Framework:** ${repo.framework ?? 'Unknown'}
**Service Type:** ${repo.serviceType ?? 'Unknown'}

### Deployment Information

- **Platform:** ${context.deploymentPlatform ?? 'Unknown'}
- **Environment:** Production

### Key Files

${repo.configFiles.map((f) => `- \`${f}\``).join('\n')}

### Entry Points

${repo.entryPoints.map((e) => `- \`${e.file}\``).join('\n')}`;
}

function generateQuickLinks(_context: AnalysisContext, config: RunbookBuildConfig): string {
  return `## Quick Links

### Monitoring
- [Grafana Dashboard](https://grafana.example.com/d/${config.serviceName})
- [Prometheus Metrics](https://prometheus.example.com/graph?g0.expr=${config.serviceName}_requests_total)
- [Alert Manager](https://alertmanager.example.com)

### Logs
- [Kibana/Cloud Logging](https://logs.example.com/app/discover#/?_a=(columns:!(_source),query:(query_string:(query:'service:${config.serviceName}'))))

### Tracing
- [Jaeger/Cloud Trace](https://tracing.example.com/search?service=${config.serviceName})

### Repository
- [Source Code](${config.repository ?? '#'})
- [CI/CD Pipeline](${config.repository ?? '#'}/actions)

### Communication
- [Slack #${config.team ?? config.serviceName}](https://slack.example.com/channels/${config.team ?? config.serviceName})
- [PagerDuty](https://pagerduty.example.com/services/${config.serviceName})`;
}

function generateAlertsSection(alerts: AlertDefinition[]): string {
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');
  const infoAlerts = alerts.filter((a) => a.severity === 'info');

  let content = '## Alert Definitions\n\n';

  if (criticalAlerts.length > 0) {
    content += '### Critical Alerts\n\n';
    content += '| Alert | Condition | Threshold | Escalation |\n';
    content += '|-------|-----------|-----------|------------|\n';
    criticalAlerts.forEach((a) => {
      content += `| ${a.name} | ${a.condition} | ${a.threshold} | ${a.escalationPolicy} |\n`;
    });
    content += '\n';
  }

  if (warningAlerts.length > 0) {
    content += '### Warning Alerts\n\n';
    content += '| Alert | Condition | Threshold | Escalation |\n';
    content += '|-------|-----------|-----------|------------|\n';
    warningAlerts.forEach((a) => {
      content += `| ${a.name} | ${a.condition} | ${a.threshold} | ${a.escalationPolicy} |\n`;
    });
    content += '\n';
  }

  if (infoAlerts.length > 0) {
    content += '### Info Alerts\n\n';
    content += '| Alert | Condition | Threshold |\n';
    content += '|-------|-----------|-----------|\n';
    infoAlerts.forEach((a) => {
      content += `| ${a.name} | ${a.condition} | ${a.threshold} |\n`;
    });
    content += '\n';
  }

  return content;
}

function generateAlertSubsections(alerts: AlertDefinition[]): RunbookSection[] {
  return alerts.map((alert) => ({
    id: generateId('subsection'),
    title: alert.name,
    order: 0,
    content: `### ${alert.name}\n\n**Description:** ${alert.description}\n\n**Condition:** ${alert.condition}\n\n**Threshold:** ${alert.threshold}\n\n**Severity:** ${alert.severity}\n\n**Escalation:** ${alert.escalationPolicy}\n\n**Runbook:** ${alert.runbookLink ?? 'N/A'}`,
    subsections: [],
  }));
}

function generateDashboardsSection(dashboards: DashboardConfig[]): string {
  let content = '## Dashboard Configurations\n\n';

  dashboards.forEach((d) => {
    content += `### ${d.title}\n\n`;
    content += `- **Platform:** ${d.platform}\n`;
    content += `- **Refresh Interval:** ${d.refreshInterval}\n`;
    content += `- **Time Range:** ${d.timeRange}\n`;
    content += `- **Panels:** ${d.panels.length}\n\n`;

    if (d.panels.length > 0) {
      content += '| Panel | Type | Query |\n';
      content += '|-------|------|-------|\n';
      d.panels.forEach((p) => {
        content += `| ${p.title} | ${p.type} | \`${p.query}\` |\n`;
      });
      content += '\n';
    }
  });

  return content;
}

function getDetectionStrings(detection: FailureMode['detection']): string[] {
  if (Array.isArray(detection)) return detection;
  return detection.symptoms;
}

function generateFailureModesSection(failureModes: FailureMode[]): string {
  let content = '## Failure Modes\n\n';

  failureModes.forEach((fm) => {
    content += `### ${fm.name}\n\n`;
    content += `**Description:** ${fm.description}\n\n`;
    content += `**Detection:**\n${getDetectionStrings(fm.detection)
      .map((d) => `- ${d}`)
      .join('\n')}\n\n`;
    content += `**Mitigation:**\n${fm.mitigation.map((m) => `- ${m}`).join('\n')}\n\n`;
    content += `**Escalation:** ${fm.escalation}\n\n`;
    content += `**Runbook Section:** ${fm.runbookSection}\n\n`;
  });

  return content;
}

function generateFailureModeSubsections(failureModes: FailureMode[]): RunbookSection[] {
  return failureModes.map((fm) => ({
    id: generateId('subsection'),
    title: fm.name,
    order: 0,
    content: `### ${fm.name}\n\n**Description:** ${fm.description}\n\n**Detection:**\n${getDetectionStrings(
      fm.detection,
    )
      .map((d) => `- ${d}`)
      .join(
        '\n',
      )}\n\n**Mitigation:**\n${fm.mitigation.map((m) => `- ${m}`).join('\n')}\n\n**Escalation:** ${fm.escalation}`,
    subsections: [],
  }));
}

function generateRollbackSection(procedures: RollbackProcedure[]): string {
  let content = '## Rollback Procedures\n\n';

  procedures.forEach((proc) => {
    content += `### ${proc.name}\n\n`;
    content += `**Description:** ${proc.description}\n\n`;
    content += `**Trigger Conditions:**\n${proc.triggerConditions.map((t) => `- ${t}`).join('\n')}\n\n`;
    content += `**Estimated Duration:** ${proc.estimatedTotalDuration}\n\n`;
    content += `**Requires Approval:** ${proc.requiresApproval ? 'Yes' : 'No'}\n\n`;
    content += `**Steps:**\n\n`;

    proc.steps.forEach((step) => {
      content += `${step.order}. **${step.title}**\n`;
      content += `   ${step.description}\n`;
      if (step.commands.length > 0) {
        content += `   \`\`\`\n   ${step.commands.join('\n   ')}\n   \`\`\`\n`;
      }
      content += `   *Estimated: ${step.estimatedDuration}*\n\n`;
    });
  });

  return content;
}

function generateRollbackSubsections(procedures: RollbackProcedure[]): RunbookSection[] {
  return procedures.map((proc) => ({
    id: generateId('subsection'),
    title: proc.name,
    order: 0,
    content: `### ${proc.name}\n\n${generateRollbackSection([proc])}`,
    subsections: [],
  }));
}

function generateIncidentResponseSection(workflows: IncidentWorkflow[]): string {
  let content = '## Incident Response\n\n';

  workflows.forEach((wf) => {
    content += `### ${wf.name}\n\n`;
    content += `**Description:** ${wf.description}\n\n`;
    content += `**Severity:** ${wf.severity}\n\n`;
    content += `**Response Time:** ${wf.responseTime}\n\n`;
    content += `**Escalation Path:**\n${wf.escalationPath.map((e) => `- ${e}`).join('\n')}\n\n`;
  });

  return content;
}

function generateHealthChecksSection(checks: HealthCheck[]): string {
  let content = '## Health Checks\n\n';

  checks.forEach((check) => {
    content += `### ${check.name}\n\n`;
    content += `**Type:** ${check.type}\n\n`;
    content += `**Endpoint:** ${check.endpoint}\n\n`;
    content += `**Interval:** ${check.interval}\n\n`;
    content += `**Timeout:** ${check.timeout}\n\n`;
    content += `**Success Criteria:** ${check.successCriteria}\n\n`;
  });

  return content;
}

function generateDependenciesSection(deps: ServiceDependency[]): string {
  const upstream = deps.filter((d) => d.direction === 'upstream');
  const downstream = deps.filter((d) => d.direction === 'downstream');

  let content = '## Service Dependencies\n\n';

  if (upstream.length > 0) {
    content += '### Upstream Dependencies\n\n';
    content += '| Service | Type | Critical | Description |\n';
    content += '|---------|------|----------|-------------|\n';
    upstream.forEach((d) => {
      content += `| ${d.name} | ${d.type} | ${d.critical ? 'Yes' : 'No'} | ${d.description ?? '-'} |\n`;
    });
    content += '\n';
  }

  if (downstream.length > 0) {
    content += '### Downstream Dependencies\n\n';
    content += '| Service | Type | Description |\n';
    content += '|---------|------|-------------|\n';
    downstream.forEach((d) => {
      content += `| ${d.name} | ${d.type} | ${d.description ?? '-'} |\n`;
    });
    content += '\n';
  }

  return content;
}

/**
 * Generate table of contents
 */
export function generateTOC(runbook: Runbook): string {
  let toc = '# Table of Contents\n\n';

  runbook.sections.forEach((section) => {
    toc += `${section.order}. [${section.title}](#${section.title.toLowerCase().replace(/\s+/g, '-')})\n`;

    section.subsections.forEach((sub) => {
      toc += `   - [${sub.title}](#${sub.title.toLowerCase().replace(/\s+/g, '-')})\n`;
    });
  });

  return toc;
}

export interface ValidateCompletenessOptions {
  requiredSections?: string[];
}

export function validateCompleteness(
  runbook: Record<string, unknown>,
  options: ValidateCompletenessOptions = {},
): CompletenessResult {
  const requiredSections = options.requiredSections ?? [
    'Service Overview',
    'Alerts',
    'Dashboards',
    'Failure Modes',
    'Rollback Procedures',
    'Health Checks',
  ];

  const sectionScores: Record<string, number> = {};
  let totalScore = 0;
  const missingSections: string[] = [];

  if (!runbook.sections || !Array.isArray(runbook.sections)) {
    return {
      score: 0,
      missingSections: requiredSections,
      suggestions: ['Runbook has no sections - runbook may be malformed'],
      sectionScores: {},
    };
  }

  const sectionTitles = runbook.sections.map((s: Record<string, unknown>) => s.title as string);

  for (const required of requiredSections) {
    const found = sectionTitles.find((title) =>
      title?.toLowerCase().includes(required.toLowerCase()),
    );

    if (found) {
      const section = runbook.sections.find((s: Record<string, unknown>) => s.title === found);
      const content = getSectionValidationContent(section as Record<string, unknown> | undefined);
      const hasContent = content.length > 100;
      sectionScores[required] = hasContent ? 1.0 : 0.5;
      totalScore += sectionScores[required];
    } else {
      sectionScores[required] = 0;
      missingSections.push(required);
      totalScore += 0;
    }
  }

  const score = requiredSections.length > 0 ? totalScore / requiredSections.length : 0;

  const suggestions: string[] = [];
  if (missingSections.length > 0) {
    suggestions.push(`Add sections for: ${missingSections.join(', ')}`);
  }
  if (score < 0.8) {
    suggestions.push('Consider adding more detailed content to existing sections');
  }

  return {
    score,
    missingSections,
    suggestions,
    sectionScores,
  };
}

export { buildRunbook as generateFullRunbook };

import type { CompletenessResult } from '../types/domain.js';

function normalizeSectionName(sectionName: string): string {
  return sectionName
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')
    .trim();
}

function getSectionValidationContent(section?: Record<string, unknown>): string {
  if (!section) return '';

  const contentParts: string[] = [];
  if (typeof section.content === 'string') {
    contentParts.push(section.content);
  }

  if (Array.isArray(section.subsections)) {
    for (const subsection of section.subsections) {
      const value = subsection as Record<string, unknown>;
      if (typeof value.content === 'string') {
        contentParts.push(value.content);
      }
    }
  }

  return contentParts.join('\n').trim();
}
