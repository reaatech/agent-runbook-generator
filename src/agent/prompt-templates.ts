/**
 * Prompt Templates - Templates for LLM prompts
 */

export type PromptType = 
  | 'repository-analysis'
  | 'failure-mode-identification'
  | 'runbook-alerts'
  | 'runbook-dashboards'
  | 'runbook-failure-modes'
  | 'runbook-rollback'
  | 'runbook-incident-response'
  | 'runbook-health-checks';

export interface PromptTemplate {
  type: PromptType;
  systemPrompt: string;
  userPrompt: string;
}

export interface PromptVariables {
  serviceName: string;
  language: string;
  framework: string;
  serviceType: string;
  dependencies: Array<{ name: string; version?: string; type?: string }>;
  externalServices: Array<{ name: string; type: string }>;
  entryPoints?: string[];
  configFiles?: string[];
}

/**
 * Generate prompt for specific task
 */
export function generatePrompt(type: PromptType, variables: Partial<PromptVariables>): string {
  const template = getPromptTemplate(type);
  return applyVariables(template.userPrompt, variables);
}

/**
 * Get prompt template by type
 */
export function getPromptTemplate(type: PromptType): PromptTemplate {
  switch (type) {
    case 'repository-analysis':
      return REPOSITORY_ANALYSIS_TEMPLATE;
    case 'failure-mode-identification':
      return FAILURE_MODE_TEMPLATE;
    case 'runbook-alerts':
      return RUNBOOK_ALERTS_TEMPLATE;
    case 'runbook-dashboards':
      return RUNBOOK_DASHBOARDS_TEMPLATE;
    case 'runbook-failure-modes':
      return RUNBOOK_FAILURE_MODES_TEMPLATE;
    case 'runbook-rollback':
      return RUNBOOK_ROLLBACK_TEMPLATE;
    case 'runbook-incident-response':
      return RUNBOOK_INCIDENT_RESPONSE_TEMPLATE;
    case 'runbook-health-checks':
      return RUNBOOK_HEALTH_CHECKS_TEMPLATE;
    default:
      return REPOSITORY_ANALYSIS_TEMPLATE;
  }
}

/**
 * Apply variables to template string
 */
function applyVariables(template: string, variables: Partial<PromptVariables>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    if (value === undefined) continue;
    
    const placeholder = `{${key}}`;
    if (typeof value === 'string') {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    } else if (Array.isArray(value)) {
      result = result.replace(new RegExp(placeholder, 'g'), value.join(', '));
    }
  }
  
  return result;
}

// ============================================================================
// Prompt Templates
// ============================================================================

const REPOSITORY_ANALYSIS_TEMPLATE: PromptTemplate = {
  type: 'repository-analysis',
  systemPrompt: `You are an expert SRE and software architect analyzing a service repository. 
Provide detailed insights about the service architecture, potential issues, and recommendations.`,
  userPrompt: `Analyze the following service and provide insights:

**Service Name:** {serviceName}
**Language:** {language}
**Framework:** {framework}
**Service Type:** {serviceType}

**Dependencies:**
{dependencies}

**External Services:**
{externalServices}

**Entry Points:**
{entryPoints}

Please provide:
1. Architecture assessment
2. Potential reliability issues
3. Recommendations for improvement
4. Key metrics to monitor`,
};

const FAILURE_MODE_TEMPLATE: PromptTemplate = {
  type: 'failure-mode-identification',
  systemPrompt: `You are an expert in failure mode analysis and reliability engineering.
Identify potential failure modes for the given service and suggest detection and mitigation strategies.`,
  userPrompt: `Identify potential failure modes for the following service:

**Service Name:** {serviceName}
**Language:** {language}
**Framework:** {framework}
**Service Type:** {serviceType}

**Dependencies:**
{dependencies}

**External Services:**
{externalServices}

**Entry Points:**
{entryPoints}

Please identify:
1. Single points of failure
2. Resource exhaustion risks
3. External dependency failures
4. Data consistency issues
5. Network-related failures

For each failure mode, provide:
- Detection strategy
- Mitigation steps
- Escalation criteria`,
};

const RUNBOOK_ALERTS_TEMPLATE: PromptTemplate = {
  type: 'runbook-alerts',
  systemPrompt: `You are an expert in monitoring and alerting. Generate comprehensive alert definitions for the service.`,
  userPrompt: `Generate alert definitions for the following service:

**Service Name:** {serviceName}
**Language:** {language}
**Framework:** {framework}
**Service Type:** {serviceType}

**Dependencies:**
{dependencies}

**External Services:**
{externalServices}

Please generate:
1. Critical alerts (page immediately)
2. Warning alerts (investigate soon)
3. Info alerts (track trends)

For each alert, specify:
- Alert name and description
- Condition and threshold
- Severity level
- Escalation policy
- Runbook link`,
};

const RUNBOOK_DASHBOARDS_TEMPLATE: PromptTemplate = {
  type: 'runbook-dashboards',
  systemPrompt: `You are an expert in observability and dashboard design. Create dashboard configurations for the service.`,
  userPrompt: `Design dashboards for the following service:

**Service Name:** {serviceName}
**Language:** {language}
**Framework:** {framework}
**Service Type:** {serviceType}

**Dependencies:**
{dependencies}

Please create:
1. Primary service dashboard
2. SLO/SLI dashboard
3. Resource utilization dashboard
4. Business metrics dashboard

For each dashboard, specify:
- Dashboard name and purpose
- Panel configurations
- Queries and visualizations
- Refresh intervals`,
};

const RUNBOOK_FAILURE_MODES_TEMPLATE: PromptTemplate = {
  type: 'runbook-failure-modes',
  systemPrompt: `You are an expert in incident response and failure analysis. Document failure modes and their mitigations.`,
  userPrompt: `Document failure modes for the following service:

**Service Name:** {serviceName}
**Language:** {language}
**Framework:** {framework}
**Service Type:** {serviceType}

**Dependencies:**
{dependencies}

**External Services:**
{externalServices}

For each failure mode, document:
1. Description and impact
2. Detection methods
3. Step-by-step mitigation
4. Escalation path
5. Prevention measures`,
};

const RUNBOOK_ROLLBACK_TEMPLATE: PromptTemplate = {
  type: 'runbook-rollback',
  systemPrompt: `You are an expert in deployment and rollback procedures. Create detailed rollback instructions.`,
  userPrompt: `Create rollback procedures for the following service:

**Service Name:** {serviceName}
**Language:** {language}
**Framework:** {framework}
**Service Type:** {serviceType}

**Configuration Files:**
{configFiles}

Please create:
1. Deployment rollback procedure
2. Configuration rollback procedure
3. Database migration rollback (if applicable)
4. Verification steps after rollback

For each procedure, include:
- Trigger conditions
- Step-by-step instructions
- Commands to execute
- Verification steps
- Estimated duration`,
};

const RUNBOOK_INCIDENT_RESPONSE_TEMPLATE: PromptTemplate = {
  type: 'runbook-incident-response',
  systemPrompt: `You are an expert in incident management and response. Create incident response procedures.`,
  userPrompt: `Create incident response procedures for the following service:

**Service Name:** {serviceName}
**Language:** {language}
**Framework:** {framework}
**Service Type:** {serviceType}

**Dependencies:**
{dependencies}

Please create:
1. Severity definitions
2. Escalation matrix
3. Communication templates
4. Response workflows for common scenarios

Include:
- Response time targets
- Roles and responsibilities
- Communication channels
- Post-incident procedures`,
};

const RUNBOOK_HEALTH_CHECKS_TEMPLATE: PromptTemplate = {
  type: 'runbook-health-checks',
  systemPrompt: `You are an expert in service health and reliability. Define health check strategies.`,
  userPrompt: `Define health checks for the following service:

**Service Name:** {serviceName}
**Language:** {language}
**Framework:** {framework}
**Service Type:** {serviceType}

**Dependencies:**
{dependencies}

**External Services:**
{externalServices}

Please define:
1. Liveness probes
2. Readiness probes
3. Startup probes
4. Deep health checks

For each check, specify:
- Endpoint and method
- Interval and timeout
- Success criteria
- Dependencies checked`,
};

/**
 * Get system prompt for a given template type
 */
export function getSystemPrompt(type: PromptType): string {
  return getPromptTemplate(type).systemPrompt;
}

/**
 * Create a custom prompt template
 */
export function createPromptTemplate(
  type: PromptType,
  systemPrompt: string,
  userPrompt: string,
): PromptTemplate {
  return { type, systemPrompt, userPrompt };
}
