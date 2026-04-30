/**
 * Graph Generator - Generates service dependency graphs
 */

import type { AnalysisContext, ServiceDependency } from '@reaatech/agent-runbook';
import { type DependencyGraph, generateDependencyGraph } from './dependency-analyzer.js';

export interface GraphExportOptions {
  format: 'mermaid' | 'dot' | 'json' | 'yaml';
  includeMetadata?: boolean;
}

/**
 * Generate service dependency graph
 */
export function generateServiceMap(
  dependencies: ServiceDependency[],
  serviceName: string,
  _context: AnalysisContext,
): DependencyGraph {
  return generateDependencyGraph(dependencies, serviceName);
}

/**
 * Export graph to Mermaid format
 */
export function exportToMermaid(graph: DependencyGraph): string {
  let output = '```mermaid\ngraph TD\n\n';

  // Style definitions
  output += '    classDef service fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n';
  output += '    classDef database fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px\n';
  output += '    classDef cache fill:#fff3e0,stroke:#e65100,stroke-width:2px\n';
  output += '    classDef queue fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px\n';
  output += '    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px\n';
  output += '    classDef critical stroke:#ff0000,stroke-width:3px\n\n';

  // Nodes
  for (const node of graph.nodes) {
    const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    const shape = getNodeShape(node.type);
    const classes: string[] = [node.type];
    if (node.critical) classes.push('critical');
    output += `    ${nodeId}${shape}:::${classes.join(',')}\n`;
  }

  output += '\n';

  // Edges
  for (const edge of graph.edges) {
    const source = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
    const target = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
    const arrow = edge.type === 'async' ? '-.->' : '-->';
    output += `    ${source}${arrow}${target}\n`;
  }

  output += '\n```';
  return output;
}

/**
 * Export graph to DOT format (Graphviz)
 */
export function exportToDot(graph: DependencyGraph): string {
  let output = 'digraph ServiceDependencies {\n';
  output += '    rankdir=TD;\n';
  output += '    node [shape=box, style=filled];\n\n';

  // Nodes
  for (const node of graph.nodes) {
    const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    const color = getNodeColor(node.type);
    const shape = getNodeShapeDot(node.type);
    const penwidth = node.critical ? '3' : '1';
    const colorBorder = node.critical ? '#ff0000' : '#000000';
    output += `    "${nodeId}" [label="${node.name}", fillcolor="${color}", shape=${shape}, penwidth=${penwidth}, color="${colorBorder}"];\n`;
  }

  output += '\n';

  // Edges
  for (const edge of graph.edges) {
    const source = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
    const target = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
    const style = edge.type === 'async' ? 'dashed' : 'solid';
    const penwidth = edge.critical ? '3' : '1';
    output += `    "${source}" -> "${target}" [style=${style}, penwidth=${penwidth}];\n`;
  }

  output += '\n}';
  return output;
}

/**
 * Export graph to JSON format
 */
export function exportToJson(graph: DependencyGraph): string {
  return JSON.stringify(graph, null, 2);
}

/**
 * Escape a string value for safe YAML output
 */
function escapeYamlString(value: string): string {
  if (
    value.includes('"') ||
    value.includes(':') ||
    value.includes('#') ||
    value.includes("'") ||
    value.includes('\n') ||
    value.includes('{') ||
    value.includes('}') ||
    value.includes('[') ||
    value.includes(']')
  ) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

/**
 * Export graph to YAML format
 */
export function exportToYaml(graph: DependencyGraph): string {
  let output = 'nodes:\n';
  for (const node of graph.nodes) {
    output += `  - id: ${escapeYamlString(node.id)}\n`;
    output += `    name: ${escapeYamlString(node.name)}\n`;
    output += `    type: ${escapeYamlString(node.type)}\n`;
    output += `    critical: ${node.critical}\n`;
    if (node.description) output += `    description: ${escapeYamlString(node.description)}\n`;
  }

  output += '\nedges:\n';
  for (const edge of graph.edges) {
    output += `  - source: ${escapeYamlString(edge.source)}\n`;
    output += `    target: ${escapeYamlString(edge.target)}\n`;
    output += `    type: ${escapeYamlString(edge.type)}\n`;
    output += `    critical: ${edge.critical}\n`;
    if (edge.protocol) output += `    protocol: ${escapeYamlString(edge.protocol)}\n`;
  }

  output += '\ncritical_paths:\n';
  for (const path of graph.criticalPaths) {
    output += `  - name: ${escapeYamlString(path.name)}\n`;
    output += `    description: ${escapeYamlString(path.description)}\n`;
    output += '    services:\n';
    for (const service of path.services) {
      output += `      - ${escapeYamlString(service)}\n`;
    }
    output += `    risk_level: ${escapeYamlString(path.riskLevel)}\n`;
  }

  return output;
}

/**
 * Export graph in specified format
 */
export function exportGraph(graph: DependencyGraph, options: GraphExportOptions): string {
  switch (options.format) {
    case 'mermaid':
      return exportToMermaid(graph);
    case 'dot':
      return exportToDot(graph);
    case 'json':
      return exportToJson(graph);
    case 'yaml':
      return exportToYaml(graph);
    default:
      return exportToMermaid(graph);
  }
}

/**
 * Get node shape for Mermaid
 */
function getNodeShape(type: string): string {
  switch (type) {
    case 'database':
      return '[("")]';
    case 'cache':
      return '[( )]';
    case 'queue':
      return '>]';
    case 'external':
      return '{{}}';
    default:
      return '[]';
  }
}

/**
 * Get node shape for DOT
 */
function getNodeShapeDot(type: string): string {
  switch (type) {
    case 'database':
      return 'cylinder';
    case 'cache':
      return 'ellipse';
    case 'queue':
      return 'parallelogram';
    case 'external':
      return 'hexagon';
    default:
      return 'box';
  }
}

/**
 * Get node color for DOT
 */
function getNodeColor(type: string): string {
  switch (type) {
    case 'database':
      return '#e8f5e9';
    case 'cache':
      return '#fff3e0';
    case 'queue':
      return '#f3e5f5';
    case 'external':
      return '#ffebee';
    default:
      return '#e1f5fe';
  }
}

/**
 * Generate a visual summary of the service map
 */
export function generateServiceMapSummary(graph: DependencyGraph): string {
  const summary: string[] = [];

  summary.push('## Service Dependency Summary\n');

  summary.push(`**Total Dependencies:** ${graph.nodes.length - 1}`);
  summary.push(
    `**Critical Dependencies:** ${graph.nodes.filter((n) => n.critical && n.type !== 'service').length}`,
  );
  summary.push(`**Critical Paths:** ${graph.criticalPaths.length}\n`);

  summary.push('### Dependencies by Type\n');
  const typeCounts: Record<string, number> = {};
  for (const node of graph.nodes) {
    if (node.type !== 'service') {
      typeCounts[node.type] = (typeCounts[node.type] ?? 0) + 1;
    }
  }
  for (const [type, count] of Object.entries(typeCounts)) {
    summary.push(`- **${type}:** ${count}`);
  }

  summary.push('\n### Critical Paths\n');
  for (const path of graph.criticalPaths) {
    summary.push(`- **${path.name}** (${path.riskLevel} risk): ${path.description}`);
  }

  return summary.join('\n');
}
