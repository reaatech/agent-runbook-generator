/**
 * Serve Command - Start the MCP server
 */

import { Command } from 'commander';
import { createMCPServer } from '@reaatech/agent-runbook-mcp';
import { info, initLogger } from '@reaatech/agent-runbook-observability';
import { initTracing } from '@reaatech/agent-runbook-observability';
import { initMetrics } from '@reaatech/agent-runbook-observability';
import { parseIntOptional } from '@reaatech/agent-runbook';

export function serveCommand(program: Command): void {
  program
    .command('serve')
    .description('Start the MCP server')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .option('--host <host>', 'Host to bind to', '0.0.0.0')
    .option('--otel-endpoint <endpoint>', 'OpenTelemetry collector endpoint')
    .option('--log-level <level>', 'Log level', 'info')
    .action(async (options: Record<string, unknown>) => {
      await executeServe(options);
    });
}

export interface ServeOptions {
  port: number;
  host: string;
  otelEndpoint?: string;
  logLevel: string;
}

async function executeServe(options: Record<string, unknown>): Promise<void> {
  const serveOptions: ServeOptions = {
    port: parseIntOptional(options.port, 3000),
    host: (options.host as string) ?? '0.0.0.0',
    otelEndpoint: options.otelEndpoint as string,
    logLevel: (options.logLevel as string) ?? 'info',
  };

  // Initialize observability
  initLogger({
    level: serveOptions.logLevel,
    service: 'agent-runbook-generator-mcp',
  });

  initTracing({
    serviceName: 'agent-runbook-generator-mcp',
    otlpEndpoint: serveOptions.otelEndpoint,
    enabled: !!serveOptions.otelEndpoint,
  });

  initMetrics({
    serviceName: 'agent-runbook-generator-mcp',
    otlpEndpoint: serveOptions.otelEndpoint,
    enabled: !!serveOptions.otelEndpoint,
  });

  try {
    info('Starting MCP server', {
      port: serveOptions.port,
      host: serveOptions.host,
    });

    const server = await createMCPServer({
      name: 'agent-runbook-generator',
      version: '1.0.0',
    });

    await server.start();
    info('MCP Server started', { transport: 'stdio' });

    /* eslint-disable no-console */
    console.log('MCP server started over stdio transport');
    console.log(
      `Port/host flags are informational only in this release: ${serveOptions.host}:${serveOptions.port}`,
    );
    console.log('Available tools:');
    console.log('  - runbook.analyze.repository');
    console.log('  - runbook.analyze.dependencies');
    console.log('  - runbook.analyze.failure_modes');
    console.log('  - runbook.analyze.alerts');
    console.log('  - runbook.analyze.health_checks');
    console.log('  - runbook.generate.full');
    console.log('  - runbook.generate.alerts');
    console.log('  - runbook.generate.dashboard');
    console.log('  - runbook.generate.rollback');
    console.log('  - runbook.generate.incident_workflow');
    console.log('  - runbook.generate.service_map');
    console.log('  - runbook.generate.health_checks');
    console.log('  - runbook.validate.completeness');
    console.log('  - runbook.validate.accuracy');
    console.log('  - runbook.validate.links');
    console.log('  - runbook.validate.ci');
    /* eslint-enable no-console */

    // Handle shutdown signals
    const shutdown = async () => {
      info('Shutting down MCP server');
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start MCP server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
