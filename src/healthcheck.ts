/**
 * Health check script for Docker container
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const timeout = parseInt(process.env.HEALTHCHECK_TIMEOUT ?? '5000', 10);

const timer = setTimeout(() => {
  console.error('Health check timed out');
  process.exit(1);
}, timeout);

try {
  process.stdout.write(`agent-runbook-generator v${pkg.version} - healthy\n`);
  clearTimeout(timer);
  process.exit(0);
} catch {
  clearTimeout(timer);
  console.error('Health check failed');
  process.exit(1);
}
