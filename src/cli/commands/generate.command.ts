/**
 * Generate Command - Generate a complete runbook
 */

import { Command } from 'commander';
import { formatRunbook } from '../../runbook/formatter.js';
import { info, initLogger } from '../../observability/logger.js';
import { startGenerationSpan, endSpanSuccess, endSpanError } from '../../observability/tracing.js';
import { recordGeneration, recordSectionGenerated } from '../../observability/metrics.js';
import { writeFileSync } from 'fs';
import { generateRunbookArtifacts } from '../../runbook/pipeline.js';

export function generateCommand(program: Command): void {
  program
    .command('generate')
    .description('Generate a complete runbook from a service repository')
    .argument('<path>', 'Path to the repository')
    .option(
      '-o, --output <file>',
      'Output file for the runbook (ignored when --json)',
      'runbook.md',
    )
    .option('--format <format>', 'Output format for file output (markdown, html)', 'markdown')
    .option('--sections <sections>', 'Comma-separated list of sections to generate')
    .option('--provider <provider>', 'LLM provider (claude, openai, gemini, mock)', 'mock')
    .option('--model <model>', 'LLM model to use')
    .option('--json', 'Output runbook as JSON to stdout instead of writing a file', false)
    .action(async (path: string, options: Record<string, unknown>) => {
      await executeGenerate(path, options);
    });
}

export interface GenerateOptions {
  output: string;
  format: 'markdown' | 'html';
  sections?: string[];
  provider: 'claude' | 'openai' | 'gemini' | 'mock';
  model?: string;
  json: boolean;
}

async function executeGenerate(path: string, options: Record<string, unknown>): Promise<void> {
  const generateOptions: GenerateOptions = {
    output: (options.output as string) ?? 'runbook.md',
    format: (options.format as 'markdown' | 'html') ?? 'markdown',
    sections: (options.sections as string)?.split(',').map((s) => s.trim()),
    provider: (options.provider as 'claude' | 'openai' | 'gemini' | 'mock') ?? 'mock',
    model: options.model as string,
    json: (options.json as boolean) ?? false,
  };

  if (generateOptions.json && generateOptions.format === 'markdown') {
    generateOptions.format = 'markdown';
  }

  // Initialize logger
  initLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    service: 'agent-runbook-generator',
    stderr: generateOptions.json,
  });

  const startTime = Date.now();
  const span = startGenerationSpan('unknown', path);

  try {
    info('Starting runbook generation', { path, provider: generateOptions.provider });

    info('Analyzing repository and generating sections...');
    const { analysisContext, runbook } = await generateRunbookArtifacts({
      path,
      sections: generateOptions.sections,
    });

    info('Repository analysis complete', {
      language: analysisContext.repositoryAnalysis.language,
      framework: analysisContext.repositoryAnalysis.framework,
      serviceType: analysisContext.repositoryAnalysis.serviceType,
    });

    // Record metrics
    recordGeneration('success');
    for (const section of runbook.sections) {
      recordSectionGenerated(section.title);
    }

    // Step 5: Format output
    info('Formatting runbook...');
    const formattedContent = formatRunbook(runbook, generateOptions.format);

    // Step 6: Output results
    if (generateOptions.json) {
      process.stdout.write(JSON.stringify(runbook, null, 2) + '\n');
    } else {
      writeFileSync(generateOptions.output, formattedContent);
      info('Runbook generated successfully', {
        output: generateOptions.output,
        sections: runbook.sections.length,
      });
      // eslint-disable-next-line no-console
      console.log(`Runbook generated: ${generateOptions.output}`);
      // eslint-disable-next-line no-console
      console.log(`Sections: ${runbook.sections.map((s) => s.title).join(', ')}`);
    }

    endSpanSuccess(span);
    const duration = Date.now() - startTime;
    info('Runbook generation completed', { duration, sections: runbook.sections.length });
  } catch (error) {
    endSpanError(span, error as Error);
    recordGeneration('failure');
    console.error('Runbook generation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
