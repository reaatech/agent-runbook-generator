/**
 * Validate Command - Validate a runbook
 */

import { Command } from 'commander';
import { validateCompleteness } from '../../runbook/runbook-builder.js';
import { info, initLogger } from '../../observability/logger.js';
import { startValidationSpan, endSpanSuccess, endSpanError } from '../../observability/tracing.js';
import { readFileSync } from 'fs';
import {
  parseRunbookDocument,
  validateRunbookAccuracy,
} from '../../runbook/pipeline.js';
import { scanRepository } from '../../analyzer/repository-scanner.js';
import { mapDependencies } from '../../analyzer/dependency-mapper.js';
import { parseConfigs } from '../../analyzer/config-parser.js';
import type { AnalysisContext } from '../../types/domain.js';

export function validateCommand(program: Command): void {
  program
    .command('validate')
    .description('Validate a runbook for completeness and accuracy')
    .argument('<path>', 'Path to the runbook file')
    .option('--ci', 'Run in CI mode with exit codes', false)
    .option('--completeness-threshold <number>', 'Minimum completeness score', '0.8')
    .option('--accuracy-threshold <number>', 'Minimum accuracy score', '0.7')
    .option('--required-sections <sections>', 'Comma-separated list of required sections')
    .option('--json', 'Output results as JSON', false)
    .action(async (path: string, options: Record<string, unknown>) => {
      await executeValidate(path, options);
    });
}

export interface ValidateOptions {
  ci: boolean;
  completenessThreshold: number;
  accuracyThreshold: number;
  requiredSections?: string[];
  json: boolean;
}

async function executeValidate(path: string, options: Record<string, unknown>): Promise<void> {
  const validateOptions: ValidateOptions = {
    ci: (options.ci as boolean) ?? false,
    completenessThreshold: parseFloat(options.completenessThreshold as string) || 0.8,
    accuracyThreshold: parseFloat(options.accuracyThreshold as string) || 0.7,
    requiredSections: (options.requiredSections as string)?.split(',').map((s) => s.trim()),
    json: (options.json as boolean) ?? false,
  };

  // Initialize logger
  initLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    service: 'agent-runbook-generator',
    stderr: validateOptions.json,
  });

  const span = startValidationSpan(0, 0);

  try {
    info('Starting runbook validation', { path });

    // Read runbook file
    const runbookContent = readFileSync(path, 'utf-8');
    const runbook = parseRunbookDocument(runbookContent, path);

    // Validate completeness
    info('Validating completeness...');
    const completenessResult = validateCompleteness(runbook, {
      requiredSections: validateOptions.requiredSections,
    });

    const warnings: string[] = [];
    let accuracyResult: {
      accuracyScore: number;
      discrepancies: Array<{ section: string; expected: string; actual: string }>;
    };
    if (typeof runbook.repository === 'string' && runbook.repository.length > 0) {
      info('Validating accuracy...');
      const repoAnalysis = await scanRepository(runbook.repository);
      const depAnalysis = mapDependencies(runbook.repository);
      const parsedCfg = parseConfigs(runbook.repository);

      const analysisContext: AnalysisContext = {
        serviceDefinition: {
          name: (runbook.serviceName as string) ?? repoAnalysis.serviceName ?? 'unknown',
          description: repoAnalysis.description,
        },
        repositoryAnalysis: repoAnalysis,
        dependencyAnalysis: depAnalysis,
        deploymentPlatform: parsedCfg.deployment.platform,
        monitoringPlatform: parsedCfg.monitoring.platform,
        externalServices: depAnalysis.externalServices,
      };
      accuracyResult = validateRunbookAccuracy(runbook, analysisContext);
    } else {
      accuracyResult = {
        accuracyScore: 1,
        discrepancies: [],
      };
      warnings.push(
        'Accuracy validation skipped because the runbook does not include a repository path.',
      );
    }

    info('Completeness validation complete', {
      score: completenessResult.score,
      missingSections: completenessResult.missingSections.length,
    });

    // Check thresholds
    const passed =
      completenessResult.score >= validateOptions.completenessThreshold &&
      accuracyResult.accuracyScore >= validateOptions.accuracyThreshold;

    if (completenessResult.missingSections.length > 0) {
      warnings.push(`Missing sections: ${completenessResult.missingSections.join(', ')}`);
    }
    if (accuracyResult.discrepancies.length > 0) {
      warnings.push(
        ...accuracyResult.discrepancies.map(
          (discrepancy) =>
            `${discrepancy.section}: expected ${discrepancy.expected}, got ${discrepancy.actual}`,
        ),
      );
    }

    // Output results
    const results = {
      passed,
      completeness: completenessResult,
      accuracy: accuracyResult,
      warnings,
      thresholds: {
        completeness: validateOptions.completenessThreshold,
        accuracy: validateOptions.accuracyThreshold,
      },
    };

    if (validateOptions.json) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(results, null, 2));
    } else {
      // eslint-disable-next-line no-console
      console.log('\n=== Runbook Validation Results ===\n');
      // eslint-disable-next-line no-console
      console.log(`Completeness Score: ${(completenessResult.score * 100).toFixed(1)}%`);
      // eslint-disable-next-line no-console
      console.log(`Threshold: ${(validateOptions.completenessThreshold * 100).toFixed(1)}%`);
      // eslint-disable-next-line no-console
      console.log(`Accuracy Score: ${(accuracyResult.accuracyScore * 100).toFixed(1)}%`);
      // eslint-disable-next-line no-console
      console.log(`Accuracy Threshold: ${(validateOptions.accuracyThreshold * 100).toFixed(1)}%`);
      // eslint-disable-next-line no-console
      console.log(`Status: ${passed ? 'PASSED' : 'FAILED'}`);

      if (warnings.length > 0) {
        // eslint-disable-next-line no-console
        console.log('\nWarnings:');
        warnings.forEach((w) => {
          // eslint-disable-next-line no-console
          console.log(`  - ${w}`);
        });
      }

      if (completenessResult.suggestions.length > 0) {
        // eslint-disable-next-line no-console
        console.log('\nSuggestions:');
        completenessResult.suggestions.forEach((s) => {
          // eslint-disable-next-line no-console
          console.log(`  - ${s}`);
        });
      }
    }

    if (passed) {
      endSpanSuccess(span);
      info('Runbook validation passed');

      if (validateOptions.ci) {
        process.exit(0);
      }
    } else {
      endSpanError(span, new Error('Validation failed'));
      info('Runbook validation failed');

      if (validateOptions.ci) {
        process.exit(3); // Fail exit code for CI
      }
    }
  } catch (error) {
    endSpanError(span, error as Error);
    console.error('Validation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
