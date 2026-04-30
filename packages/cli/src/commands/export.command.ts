/**
 * Export Command - Export runbook to different formats
 */

import { Command } from 'commander';
import { formatRunbook, type OutputFormat } from '@reaatech/agent-runbook-runbook';
import type { Runbook } from '@reaatech/agent-runbook';
import { info, initLogger } from '@reaatech/agent-runbook-observability';
import { readFileSync, writeFileSync } from 'fs';
import { extname } from 'path';
import { parseRunbookDocument } from '@reaatech/agent-runbook-runbook';

export function exportCommand(program: Command): void {
  program
    .command('export')
    .description('Export a runbook to different formats')
    .argument('<input>', 'Path to the input runbook file')
    .option('-o, --output <file>', 'Output file path')
    .option('-f, --format <format>', 'Output format (markdown, html, pdf, json)', 'markdown')
    .option('--template <template>', 'Template to use for formatting')
    .option('--include-toc', 'Include table of contents', true)
    .option('--include-cross-refs', 'Include cross-references', true)
    .action(async (input: string, options: Record<string, unknown>) => {
      await executeExport(input, options);
    });
}

export interface ExportOptions {
  output?: string;
  format: 'markdown' | 'html' | 'pdf' | 'json';
  template?: string;
  includeToc: boolean;
  includeCrossRefs: boolean;
}

async function executeExport(input: string, options: Record<string, unknown>): Promise<void> {
  const exportOptions: ExportOptions = {
    output: options.output as string,
    format: (options.format as 'markdown' | 'html' | 'pdf' | 'json') ?? 'markdown',
    template: options.template as string,
    includeToc: (options.includeToc as boolean) ?? true,
    includeCrossRefs: (options.includeCrossRefs as boolean) ?? true,
  };

  // Initialize logger
  initLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    service: 'agent-runbook-generator',
  });

  try {
    info('Starting runbook export', { input, format: exportOptions.format });

    // Read input file
    const inputContent = readFileSync(input, 'utf-8');
    const runbook = parseRunbookDocument(inputContent, input);

    // Determine output path
    if (!exportOptions.output) {
      const inputExt = extname(input);
      const baseName = input.replace(inputExt, '');
      const outputExt = getExtension(exportOptions.format);
      exportOptions.output = `${baseName}.${outputExt}`;
    }

    // Format runbook
    info('Formatting runbook...');
    const formattedContent = formatRunbook(
      runbook as unknown as Runbook,
      exportOptions.format as OutputFormat,
    );

    // Write output file
    writeFileSync(exportOptions.output, formattedContent);

    info('Runbook exported successfully', {
      output: exportOptions.output,
      format: exportOptions.format,
    });

    // eslint-disable-next-line no-console
    console.log(`Runbook exported to: ${exportOptions.output}`);
  } catch (error) {
    console.error('Export failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Get file extension for format
 */
function getExtension(format: string): string {
  switch (format) {
    case 'markdown':
      return 'md';
    case 'html':
      return 'html';
    case 'pdf':
      return 'pdf';
    case 'json':
      return 'json';
    default:
      return 'txt';
  }
}
