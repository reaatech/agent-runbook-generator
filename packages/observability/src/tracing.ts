/**
 * Tracing - OpenTelemetry tracing configuration
 */

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';

export interface TracingConfig {
  serviceName: string;
  otlpEndpoint?: string;
  enabled: boolean;
}

let tracerProvider: NodeTracerProvider | null = null;

export function initTracing(config: TracingConfig): void {
  if (!config.enabled) {
    tracerProvider = null;
    return;
  }

  const spanProcessors: unknown[] = [];

  if (config.otlpEndpoint) {
    const otlpExporter = new OTLPTraceExporter({
      url: config.otlpEndpoint,
    });
    spanProcessors.push(new BatchSpanProcessor(otlpExporter));
  }

  if (process.env.NODE_ENV === 'development') {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  tracerProvider = new NodeTracerProvider({ spanProcessors: spanProcessors as never[] });

  tracerProvider.register();
}

/**
 * Get tracer instance
 */
export function getTracer(): ReturnType<typeof trace.getTracer> {
  return trace.getTracer('agent-runbook-generator', '1.0.0');
}

/**
 * Start a span for runbook generation
 */
export function startGenerationSpan(serviceName: string, repoPath: string): Span {
  const tracer = getTracer();
  return tracer.startSpan('runbook.generate', {
    attributes: {
      service_name: serviceName,
      repo_path: repoPath,
    },
  });
}

/**
 * Start a span for repository analysis
 */
export function startAnalysisSpan(
  language: string,
  fileCount: number,
  configFiles: string[],
): Span {
  const tracer = getTracer();
  return tracer.startSpan('repository.scan', {
    attributes: {
      language,
      file_count: fileCount,
      config_files: configFiles,
    },
  });
}

/**
 * Start a span for code analysis
 */
export function startCodeAnalysisSpan(
  entryPoints: string[],
  endpoints: string[],
  externalServices: string[],
): Span {
  const tracer = getTracer();
  return tracer.startSpan('code.analyze', {
    attributes: {
      entry_points: entryPoints,
      endpoints: endpoints,
      external_services: externalServices,
    },
  });
}

/**
 * Start a span for agent analysis
 */
export function startAgentSpan(provider: string, model: string, tokens: number): Span {
  const tracer = getTracer();
  return tracer.startSpan('agent.analyze', {
    attributes: {
      provider,
      model,
      tokens,
    },
  });
}

/**
 * Start a span for section generation
 */
export function startSectionSpan(sectionType: string): Span {
  const tracer = getTracer();
  return tracer.startSpan('section.generate', {
    attributes: {
      section_type: sectionType,
    },
  });
}

/**
 * Start a span for runbook validation
 */
export function startValidationSpan(completenessScore: number, accuracyScore: number): Span {
  const tracer = getTracer();
  return tracer.startSpan('runbook.validate', {
    attributes: {
      completeness_score: completenessScore,
      accuracy_score: accuracyScore,
    },
  });
}

/**
 * End span with success
 */
export function endSpanSuccess(span: Span): void {
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

/**
 * End span with error
 */
export function endSpanError(span: Span, error: Error): void {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  span.recordException(error);
  span.end();
}

/**
 * Shutdown tracing provider
 */
export async function shutdownTracing(): Promise<void> {
  if (tracerProvider) {
    await tracerProvider.shutdown();
    tracerProvider = null;
  }
}
