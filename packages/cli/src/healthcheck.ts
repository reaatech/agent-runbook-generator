const VERSION = '1.0.0';

const timeout = Number.parseInt(process.env.HEALTHCHECK_TIMEOUT ?? '5000', 10);

const timer = setTimeout(() => {
  process.stderr.write('Health check timed out\n');
  process.exit(1);
}, timeout);

try {
  process.stdout.write(`agent-runbook-generator v${VERSION} - healthy\n`);
  clearTimeout(timer);
  process.exit(0);
} catch {
  clearTimeout(timer);
  process.stderr.write('Health check failed\n');
  process.exit(1);
}
