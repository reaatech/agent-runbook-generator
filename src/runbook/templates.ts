/**
 * Templates - Runbook templates for different scenarios
 */

import { type RunbookSection } from '../types/domain.js';

export interface RunbookTemplate {
  id: string;
  name: string;
  description: string;
  sections: RunbookSection[];
  useCase: 'standard' | 'incident' | 'handoff' | 'postmortem';
}

/**
 * Standard SRE Runbook Template
 */
export const STANDARD_SRE_TEMPLATE: RunbookTemplate = {
  id: 'standard-sre',
  name: 'Standard SRE Runbook',
  description: 'Comprehensive runbook template for production services',
  useCase: 'standard',
  sections: [
    {
      id: 'overview',
      title: 'Service Overview',
      order: 1,
      content: `## Service Description

**Service Name:** {service_name}
**Team:** {team_name}
**Repository:** {repository_url}
**Language:** {language}
**Framework:** {framework}

### Architecture
- Brief description of service architecture
- Key components and their roles
- Data flow diagram

### Dependencies
- Upstream services
- Downstream services
- External dependencies`,
      subsections: [],
    },
    {
      id: 'quick-links',
      title: 'Quick Links',
      order: 2,
      content: `## Quick Links

### Monitoring
- [Grafana Dashboard](#)
- [Prometheus Metrics](#)
- [Alert Manager](#)

### Logs
- [Log Viewer](#)

### Communication
- [Slack Channel](#)
- [PagerDuty](#)`,
      subsections: [],
    },
    {
      id: 'alerts',
      title: 'Alerts',
      order: 3,
      content: `## Alert Definitions

### Critical Alerts
| Alert | Condition | Threshold | Action |
|-------|-----------|-----------|--------|
| Service Down | Health check failing | N/A | Page on-call |
| High Error Rate | Error rate > 5% | 5% | Investigate immediately |

### Warning Alerts
| Alert | Condition | Threshold | Action |
|-------|-----------|-----------|--------|
| High Latency | P99 > 1s | 1s | Monitor and investigate |
| High Memory | Memory > 85% | 85% | Plan scaling |`,
      subsections: [],
    },
    {
      id: 'failure-modes',
      title: 'Failure Modes',
      order: 4,
      content: `## Failure Modes

### Database Connection Failure
**Detection:** Connection pool exhaustion, timeout errors
**Mitigation:** Enable circuit breaker, scale read replicas
**Escalation:** P1 - Database team

### Memory Exhaustion
**Detection:** Memory utilization > 85%, OOM kills
**Mitigation:** Scale horizontally, increase memory limits
**Escalation:** P1 - On-call engineer`,
      subsections: [],
    },
    {
      id: 'rollback',
      title: 'Rollback Procedures',
      order: 5,
      content: `## Rollback Procedures

### Deployment Rollback
1. Assess the situation
2. Notify the team
3. Execute rollback: \`kubectl rollout undo deployment/{service_name}\`
4. Verify rollback success
5. Monitor service health
6. Document the incident`,
      subsections: [],
    },
    {
      id: 'incident-response',
      title: 'Incident Response',
      order: 6,
      content: `## Incident Response

### Severity Definitions
- **P1 (Critical):** Service down, data loss, security breach
- **P2 (High):** Significant degradation, major feature broken
- **P3 (Medium):** Minor degradation, non-critical feature broken
- **P4 (Low):** Cosmetic issues, minor bugs

### Escalation Matrix
| Severity | Response Time | Escalation Path |
|----------|---------------|-----------------|
| P1 | 5 min | On-call → Tech Lead → Engineering Manager |
| P2 | 15 min | On-call → Tech Lead |
| P3 | 1 hour | On-call |
| P4 | Next business day | Development team |`,
      subsections: [],
    },
    {
      id: 'health-checks',
      title: 'Health Checks',
      order: 7,
      content: `## Health Checks

### Liveness Probe
- **Endpoint:** /health
- **Interval:** 30s
- **Timeout:** 5s
- **Success:** HTTP 200

### Readiness Probe
- **Endpoint:** /ready
- **Interval:** 10s
- **Timeout:** 5s
- **Success:** HTTP 200 with all dependencies healthy`,
      subsections: [],
    },
  ],
};

/**
 * Incident Response Template
 */
export const INCIDENT_RESPONSE_TEMPLATE: RunbookTemplate = {
  id: 'incident-response',
  name: 'Incident Response Template',
  description: 'Template focused on incident response procedures',
  useCase: 'incident',
  sections: [
    {
      id: 'incident-overview',
      title: 'Incident Overview',
      order: 1,
      content: `## Incident Overview

**Incident ID:** {incident_id}
**Service:** {service_name}
**Severity:** {severity}
**Started:** {start_time}

### Summary
Brief description of the incident and its impact.

### Impact
- Affected users
- Affected functionality
- Business impact`,
      subsections: [],
    },
    {
      id: 'timeline',
      title: 'Timeline',
      order: 2,
      content: `## Timeline

| Time | Event | Action Taken |
|------|-------|--------------|
| {time} | Incident detected | On-call paged |
| {time} | Investigation started | Checking logs |
| {time} | Root cause identified | Implementing fix |
| {time} | Fix deployed | Monitoring recovery |
| {time} | Incident resolved | Verifying full recovery |`,
      subsections: [],
    },
    {
      id: 'diagnosis',
      title: 'Diagnosis',
      order: 3,
      content: `## Diagnosis

### Symptoms
- What was observed
- Error messages
- Metrics anomalies

### Root Cause
- Underlying cause
- Contributing factors

### Evidence
- Relevant logs
- Metrics graphs
- Traces`,
      subsections: [],
    },
    {
      id: 'resolution',
      title: 'Resolution',
      order: 4,
      content: `## Resolution

### Actions Taken
1. Step 1
2. Step 2
3. Step 3

### Verification
- How recovery was confirmed
- Metrics checked
- Tests run`,
      subsections: [],
    },
  ],
};

/**
 * On-Call Handoff Template
 */
export const HANDOFF_TEMPLATE: RunbookTemplate = {
  id: 'handoff',
  name: 'On-Call Handoff Template',
  description: 'Template for shift handoff between on-call engineers',
  useCase: 'handoff',
  sections: [
    {
      id: 'shift-summary',
      title: 'Shift Summary',
      order: 1,
      content: `## Shift Summary

**Date:** {date}
**Outgoing:** {outgoing_engineer}
**Incoming:** {incoming_engineer}

### Overall Status
- 🟢 All systems normal
- 🟡 Minor issues being monitored
- 🔴 Active incidents

### Active Incidents
| Incident | Severity | Status | Notes |
|----------|----------|--------|-------|
| {id} | {severity} | {status} | {notes} |`,
      subsections: [],
    },
    {
      id: 'pending-items',
      title: 'Pending Items',
      order: 2,
      content: `## Pending Items

### Requires Attention
- Items that need follow-up
- Upcoming maintenance windows
- Scheduled deployments

### Monitoring Watchlist
- Services to keep an eye on
- Known issues
- Recent changes`,
      subsections: [],
    },
  ],
};

/**
 * Post-Mortem Template
 */
export const POSTMORTEM_TEMPLATE: RunbookTemplate = {
  id: 'postmortem',
  name: 'Post-Mortem Template',
  description: 'Template for post-incident review and learning',
  useCase: 'postmortem',
  sections: [
    {
      id: 'incident-summary',
      title: 'Incident Summary',
      order: 1,
      content: `## Incident Summary

**Incident ID:** {incident_id}
**Date:** {date}
**Duration:** {duration}
**Severity:** {severity}
**Services Affected:** {services}

### Executive Summary
Brief summary suitable for leadership review.`,
      subsections: [],
    },
    {
      id: 'impact',
      title: 'Impact',
      order: 2,
      content: `## Impact

### User Impact
- Number of affected users
- Duration of impact
- Functionality affected

### Business Impact
- Revenue impact (if applicable)
- SLA/SLO impact
- Customer communications sent`,
      subsections: [],
    },
    {
      id: 'root-cause',
      title: 'Root Cause Analysis',
      order: 3,
      content: `## Root Cause Analysis

### Timeline
Detailed timeline of events.

### Root Cause
The underlying cause of the incident.

### Contributing Factors
Factors that made the incident worse or more likely.`,
      subsections: [],
    },
    {
      id: 'action-items',
      title: 'Action Items',
      order: 4,
      content: `## Action Items

| ID | Action | Owner | Due Date | Status |
|----|--------|-------|----------|--------|
| 1 | {action} | {owner} | {date} | {status} |
| 2 | {action} | {owner} | {date} | {status} |

### Immediate Actions (completed during incident)
- Action 1
- Action 2

### Short-term Actions (within 1 week)
- Action 1
- Action 2

### Long-term Actions (within 1 month)
- Action 1
- Action 2`,
      subsections: [],
    },
    {
      id: 'lessons-learned',
      title: 'Lessons Learned',
      order: 5,
      content: `## Lessons Learned

### What went well
- Things that worked during the incident response

### What could be improved
- Areas for improvement in our response

### Where we got lucky
- Things that could have gone wrong but didn't`,
      subsections: [],
    },
  ],
};

/**
 * Get template by ID
 */
export function getTemplateById(id: string): RunbookTemplate | undefined {
  const templates = [
    STANDARD_SRE_TEMPLATE,
    INCIDENT_RESPONSE_TEMPLATE,
    HANDOFF_TEMPLATE,
    POSTMORTEM_TEMPLATE,
  ];
  return templates.find(t => t.id === id);
}

/**
 * Get all templates
 */
export function getAllTemplates(): RunbookTemplate[] {
  return [
    STANDARD_SRE_TEMPLATE,
    INCIDENT_RESPONSE_TEMPLATE,
    HANDOFF_TEMPLATE,
    POSTMORTEM_TEMPLATE,
  ];
}

/**
 * Apply template with variable substitution
 */
export function applyTemplate(template: RunbookTemplate, variables: Record<string, string>): RunbookTemplate {
  const substitutedSections = template.sections.map(section => ({
    ...section,
    content: section.content.replace(/{(\w+)}/g, (match, key) => variables[key] ?? match),
  }));

  return {
    ...template,
    sections: substitutedSections,
  };
}
