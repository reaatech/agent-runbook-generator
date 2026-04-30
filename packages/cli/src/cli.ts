#!/usr/bin/env node
/**
 * CLI - Command-line interface entry point
 */

import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze.command.js';
import { generateCommand } from './commands/generate.command.js';
import { validateCommand } from './commands/validate.command.js';
import { exportCommand } from './commands/export.command.js';
import { serveCommand } from './commands/serve.command.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function main(): void {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

  const program = new Command();

  program
    .name('agent-runbook-generator')
    .description('Generate operator runbooks from service repositories using AI')
    .version(packageJson.version);

  // Register commands
  analyzeCommand(program);
  generateCommand(program);
  validateCommand(program);
  exportCommand(program);
  serveCommand(program);

  program.parse(process.argv);
}

main();
