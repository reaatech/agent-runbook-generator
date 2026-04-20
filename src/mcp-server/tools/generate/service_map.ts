/**
 * Generate Service Map - MCP tool handler
 */

import type { ServiceDependency } from '../../../types/domain.js';
import { mapDependencies } from '../../../analyzer/dependency-mapper.js';
import { scanRepository } from '../../../analyzer/repository-scanner.js';
import { generateDependencyGraph } from '../../../service-map/dependency-analyzer.js';
import { exportGraph } from '../../../service-map/graph-generator.js';

interface ServiceMapArgs {
  analysis_context: {
    path?: string;
    repository?: string;
    serviceName?: string;
  };
  format?: 'mermaid' | 'dot' | 'json' | 'yaml';
}

export async function execute(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { analysis_context, format = 'mermaid' } = args as unknown as ServiceMapArgs;

  const repoPath = analysis_context?.path || analysis_context?.repository || '.';
  const serviceName = analysis_context?.serviceName || 'unknown-service';

  await scanRepository(repoPath);
  const depAnalysis = mapDependencies(repoPath);

  const dependencies: ServiceDependency[] = depAnalysis.externalServices.map((es) => ({
    name: es.name,
    type: es.type,
    direction: 'downstream' as const,
    protocol: 'tcp' as const,
    critical: true,
    description: `External service via ${es.connectionEnvVar || 'environment variable'}`,
  }));

  const graph = generateDependencyGraph(dependencies, serviceName);

  const exportOptions = { format: format as 'mermaid' | 'dot' | 'json' | 'yaml' };
  const exportedGraph = exportGraph(graph, exportOptions);

  return {
    serviceName,
    format,
    graph: exportedGraph,
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      critical: n.critical,
    })),
    edges: graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      type: e.type,
      critical: e.critical,
    })),
    criticalPaths: graph.criticalPaths,
    summary: {
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
      criticalPaths: graph.criticalPaths.length,
    },
  };
}
