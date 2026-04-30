/**
 * Analyze Command - Analyze a service repository
 */

import { Command } from 'commander';
import { scanRepository } from '@reaatech/agent-runbook-analyzer';
import { analyzeDependencies } from '@reaatech/agent-runbook-analyzer';
import { info, initLogger } from '@reaatech/agent-runbook-observability';
import { startAnalysisSpan, endSpanSuccess, endSpanError } from '@reaatech/agent-runbook-observability';
import { parseIntOptional } from '@reaatech/agent-runbook';

export function analyzeCommand(program: Command): void {
  program
    .command('analyze')
    .description('Analyze a service repository')
    .argument('<path>', 'Path to the repository')
    .option('-d, --depth <number>', 'Analysis depth', '3')
    .option('--include <patterns>', 'Include file patterns (comma-separated)')
    .option('--exclude <patterns>', 'Exclude file patterns (comma-separated)')
    .option('--include-dev', 'Include dev dependencies', false)
    .option('-o, --output <file>', 'Output file for analysis results')
    .option('--json', 'Output results as JSON', false)
    .action(async (path: string, options: Record<string, unknown>) => {
      await executeAnalyze(path, options);
    });
}

export interface AnalyzeOptions {
  depth: number;
  include?: string[];
  exclude?: string[];
  includeDev: boolean;
  output?: string;
  json: boolean;
}

async function executeAnalyze(path: string, options: Record<string, unknown>): Promise<void> {
  const analyzeOptions: AnalyzeOptions = {
    depth: parseIntOptional(options.depth, 3),
    include: (options.include as string)?.split(',').map((p) => p.trim()),
    exclude: (options.exclude as string)?.split(',').map((p) => p.trim()),
    includeDev: (options.includeDev as boolean) ?? false,
    output: options.output as string,
    json: (options.json as boolean) ?? false,
  };

  initLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    service: 'agent-runbook-generator',
    stderr: analyzeOptions.json,
  });

  const startTime = Date.now();
  const span = startAnalysisSpan('unknown', 0, []);

  try {
    info('Starting repository analysis', { path });

    const repositoryAnalysis = await scanRepository(path, {
      depth: analyzeOptions.depth,
      includePatterns: analyzeOptions.include,
      excludePatterns: analyzeOptions.exclude,
    });

    info('Repository analysis complete', {
      language: repositoryAnalysis.language,
      framework: repositoryAnalysis.framework,
      serviceType: repositoryAnalysis.serviceType,
      fileCount: repositoryAnalysis.structure.fileCount,
    });

    const dependencies = analyzeDependencies(path);

    info('Dependency analysis complete', {
      directDeps: dependencies.directDeps.length,
      transitiveDeps: dependencies.transitiveDeps.length,
    });

    const results = {
      repository: repositoryAnalysis,
      dependencies,
      timestamp: new Date().toISOString(),
    };

    if (analyzeOptions.json || !analyzeOptions.output) {
      process.stdout.write(JSON.stringify(results, null, 2) + '\n');
    }

    if (analyzeOptions.output) {
      info('Analysis results saved', { output: analyzeOptions.output });
    }

    endSpanSuccess(span);
    const duration = Date.now() - startTime;
    info('Analysis completed', { duration });
  } catch (error) {
    endSpanError(span, error as Error);
    console.error('Analysis failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
