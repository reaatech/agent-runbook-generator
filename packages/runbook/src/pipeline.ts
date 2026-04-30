import type {
  AccuracyDiscrepancy,
  AccuracyResult,
  AnalysisContext,
  BrokenLinkInfo,
  CompletenessResult,
  LinkInfo,
  LinkValidationResult,
  RollbackProcedure,
  Runbook,
  RunbookSection,
  ServiceDependency,
} from '@reaatech/agent-runbook';
import { generateAlerts } from '@reaatech/agent-runbook-alerts';
import { scanRepository } from '@reaatech/agent-runbook-analyzer';
import { mapDependencies } from '@reaatech/agent-runbook-analyzer';
import { parseConfigs } from '@reaatech/agent-runbook-analyzer';
import { generateDashboard } from '@reaatech/agent-runbook-dashboards';
import { identifyFailureModes } from '@reaatech/agent-runbook-failure-modes';
import { generateHealthChecks } from '@reaatech/agent-runbook-health-checks';
import { generateIncidentWorkflows } from '@reaatech/agent-runbook-incident';
import { generateRollbackProcedures } from '@reaatech/agent-runbook-rollback';

export interface GeneratePipelineOptions {
  path: string;
  sections?: string[];
  serviceName?: string;
  teamName?: string;
}

export interface GeneratedArtifacts {
  analysisContext: AnalysisContext;
  runbook: Runbook;
}

interface MarkdownHeading {
  level: number;
  title: string;
}

export async function generateRunbookArtifacts(
  options: GeneratePipelineOptions,
): Promise<GeneratedArtifacts> {
  const repositoryAnalysis = await scanRepository(options.path);
  const dependencyAnalysis = mapDependencies(options.path);
  const parsedConfig = parseConfigs(options.path);

  const serviceName = options.serviceName || repositoryAnalysis.serviceName || 'unknown-service';
  const teamName = options.teamName || 'platform';

  const analysisContext: AnalysisContext = {
    serviceDefinition: {
      name: serviceName,
      description: repositoryAnalysis.description || '',
      repository: options.path,
      team: teamName,
    },
    repositoryAnalysis,
    dependencyAnalysis,
    deploymentPlatform: parsedConfig.deployment.platform,
    monitoringPlatform: parsedConfig.monitoring.platform,
    externalServices: dependencyAnalysis.externalServices,
  };

  const rollbackScenarios = generateRollbackProcedures(
    analysisContext,
    parsedConfig.deployment.platform,
  );

  const generatedSections = {
    alerts: generateAlerts(analysisContext, { serviceName }),
    dashboards: [generateDashboard(analysisContext, { serviceName, platform: 'grafana' })],
    failureModes: identifyFailureModes(options.path, analysisContext).failureModes,
    rollbackProcedures: Object.values(rollbackScenarios) as RollbackProcedure[],
    incidentWorkflows: generateIncidentWorkflows(analysisContext, {
      serviceName,
      teamName,
    }),
    healthChecks: generateHealthChecks(options.path, analysisContext, {
      serviceName,
      platform: 'kubernetes',
    }),
    dependencies: dependencyAnalysis.externalServices.map(
      (service): ServiceDependency => ({
        name: service.name,
        type: service.type,
        direction: 'downstream' as const,
        protocol: service.type === 'queue' ? ('async' as const) : ('tcp' as const),
        critical: true,
        description: `Referenced via ${service.connectionEnvVar || 'application configuration'}`,
      }),
    ),
  };

  const { buildRunbook } = await import('./runbook-builder.js');
  const runbook = buildRunbook(
    analysisContext,
    {
      serviceName,
      team: teamName,
      repository: options.path,
      sections: options.sections,
    },
    generatedSections,
  );

  return { analysisContext, runbook };
}

export function parseRunbookDocument(raw: string, sourceHint?: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return parseMarkdownRunbook(raw, sourceHint);
  }
}

export function parseMarkdownRunbook(
  markdown: string,
  sourceHint?: string,
): Record<string, unknown> {
  const lines = markdown.split('\n');
  const headings: MarkdownHeading[] = [];
  const topLevelSections: RunbookSection[] = [];
  let title = 'Service Runbook';
  let repository = sourceHint;
  let serviceName: string | undefined;
  let currentSection: RunbookSection | null = null;
  let currentSubsection: RunbookSection | null = null;
  let buffer: string[] = [];

  const flushBuffer = (): void => {
    const content = buffer.join('\n').trim();
    if (currentSubsection) {
      currentSubsection.content = content;
    } else if (currentSection) {
      currentSection.content = content;
    }
    buffer = [];
  };

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (!match) {
      const repositoryMatch = line.match(/^\*\*Repository:\*\*\s+(.+)$/);
      if (repositoryMatch) {
        repository = repositoryMatch[1]?.trim();
      }

      const serviceMatch = line.match(/^\*\*Service:\*\*\s+(.+)$/);
      if (serviceMatch) {
        serviceName = serviceMatch[1]?.trim();
      }

      buffer.push(line);
      continue;
    }

    flushBuffer();

    const level = match[1]?.length;
    const headingTitle = match[2]?.trim();
    headings.push({ level, title: headingTitle });

    if (level === 1) {
      title = headingTitle;
      currentSection = null;
      currentSubsection = null;
      continue;
    }

    if (level === 2) {
      currentSection = {
        id: `section-${topLevelSections.length + 1}`,
        title: headingTitle,
        order: topLevelSections.length + 1,
        content: '',
        subsections: [],
      };
      topLevelSections.push(currentSection);
      currentSubsection = null;
      continue;
    }

    if (level === 3 && currentSection) {
      currentSubsection = {
        id: `${currentSection.id}-sub-${currentSection.subsections.length + 1}`,
        title: headingTitle,
        order: currentSection.subsections.length + 1,
        content: '',
        subsections: [],
      };
      currentSection.subsections.push(currentSubsection);
    }
  }

  flushBuffer();

  return {
    title,
    repository,
    serviceName,
    format: 'markdown',
    content: markdown,
    sections: topLevelSections,
    headings,
  };
}

export function validateRunbookAccuracy(
  runbook: Record<string, unknown>,
  analysisContext: AnalysisContext,
): AccuracyResult {
  const discrepancies: AccuracyDiscrepancy[] = [];
  const sectionTitles = getRunbookSectionTitles(runbook);
  const text = getRunbookText(runbook).toLowerCase();
  const expectedServiceName = analysisContext.serviceDefinition.name.toLowerCase();

  if (!text.includes(expectedServiceName)) {
    discrepancies.push({
      section: 'Service Overview',
      expected: analysisContext.serviceDefinition.name,
      actual: 'Service name not referenced in runbook body',
      severity: 'high',
    });
  }

  for (const expectedSection of getExpectedSectionTitles()) {
    if (
      !sectionTitles.some((title) => title.toLowerCase().includes(expectedSection.toLowerCase()))
    ) {
      discrepancies.push({
        section: expectedSection,
        expected: `${expectedSection} section present`,
        actual: 'Section missing',
        severity: expectedSection === 'Service Overview' ? 'high' : 'medium',
      });
    }
  }

  if (
    analysisContext.repositoryAnalysis.framework !== 'unknown' &&
    !text.includes(analysisContext.repositoryAnalysis.framework.toLowerCase())
  ) {
    discrepancies.push({
      section: 'Service Overview',
      expected: analysisContext.repositoryAnalysis.framework,
      actual: 'Framework not mentioned',
      severity: 'low',
    });
  }

  const score = Math.max(0, 1 - discrepancies.length / 8);
  return {
    accuracyScore: Number(score.toFixed(2)),
    discrepancies,
  };
}

export function validateRunbookLinks(runbook: Record<string, unknown>): LinkValidationResult {
  const markdown = getRunbookText(runbook);
  const headings = extractHeadingAnchors(markdown, runbook);
  const validLinks: LinkInfo[] = [];
  const brokenLinks: BrokenLinkInfo[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: suppressed for existing code
  while ((match = linkRegex.exec(markdown)) !== null) {
    // biome-ignore lint/style/noNonNullAssertion: suppressed for existing code
    const label = match[1]!;
    // biome-ignore lint/style/noNonNullAssertion: suppressed for existing code
    const target = match[2]!;

    if (target.startsWith('http://') || target.startsWith('https://')) {
      validLinks.push({ from: label, to: target, type: 'external' });
      continue;
    }

    if (target.startsWith('#')) {
      if (headings.has(target.slice(1))) {
        validLinks.push({ from: label, to: target, type: 'internal-anchor' });
      } else {
        brokenLinks.push({
          from: label,
          to: target,
          reason: 'Missing target heading',
        });
      }
      continue;
    }

    if (target.startsWith('/')) {
      validLinks.push({ from: label, to: target, type: 'absolute-path' });
      continue;
    }

    brokenLinks.push({
      from: label,
      to: target,
      reason: 'Unsupported or unresolved link target',
    });
  }

  return { validLinks, brokenLinks };
}

export function createCiValidationResult(
  runbook: Record<string, unknown>,
  completeness: CompletenessResult,
  accuracy: AccuracyResult,
  thresholds?: { completeness_min?: number; accuracy_min?: number },
): {
  passed: boolean;
  failures: string[];
  warnings: string[];
  completeness_score: number;
  accuracy_score: number;
} {
  const completenessThreshold = thresholds?.completeness_min ?? 0.8;
  const accuracyThreshold = thresholds?.accuracy_min ?? 0.7;
  const failures: string[] = [];

  if (completeness.score < completenessThreshold) {
    failures.push(
      `Completeness score ${completeness.score} below threshold ${completenessThreshold}`,
    );
  }

  if (accuracy.accuracyScore < accuracyThreshold) {
    failures.push(`Accuracy score ${accuracy.accuracyScore} below threshold ${accuracyThreshold}`);
  }

  const linkValidation = validateRunbookLinks(runbook);
  if (linkValidation.brokenLinks.length > 0) {
    failures.push(`${linkValidation.brokenLinks.length} broken links detected`);
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings: [
      ...completeness.suggestions,
      ...accuracy.discrepancies.map(
        (discrepancy) =>
          `${discrepancy.section}: expected ${discrepancy.expected}, got ${discrepancy.actual}`,
      ),
    ],
    completeness_score: completeness.score,
    accuracy_score: accuracy.accuracyScore,
  };
}

function getRunbookSectionTitles(runbook: Record<string, unknown>): string[] {
  if (!Array.isArray(runbook.sections)) {
    return [];
  }

  return runbook.sections
    .map((section) => (section as Record<string, unknown>).title)
    .filter((title): title is string => typeof title === 'string');
}

function getRunbookText(runbook: Record<string, unknown>): string {
  if (typeof runbook.content === 'string' && runbook.content.length > 0) {
    return runbook.content;
  }

  if (!Array.isArray(runbook.sections)) {
    return JSON.stringify(runbook);
  }

  return runbook.sections
    .map((section) => {
      const value = section as Record<string, unknown>;
      const subsections = Array.isArray(value.subsections)
        ? value.subsections
            .map((subsection) => (subsection as Record<string, unknown>).content)
            .filter((content): content is string => typeof content === 'string')
            .join('\n')
        : '';
      return `${value.title || ''}\n${value.content || ''}\n${subsections}`;
    })
    .join('\n');
}

function extractHeadingAnchors(markdown: string, runbook: Record<string, unknown>): Set<string> {
  const anchors = new Set<string>();

  for (const line of markdown.split('\n')) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (match) {
      // biome-ignore lint/style/noNonNullAssertion: suppressed for existing code
      anchors.add(toAnchor(match[1]!));
    }
  }

  if (Array.isArray(runbook.sections)) {
    for (const title of getRunbookSectionTitles(runbook)) {
      anchors.add(toAnchor(title));
    }
  }

  return anchors;
}

function toAnchor(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function getExpectedSectionTitles(): string[] {
  return [
    'Service Overview',
    'Quick Links',
    'Alerts',
    'Dashboards',
    'Failure Modes',
    'Rollback Procedures',
    'Incident Response',
    'Health Checks',
  ];
}
