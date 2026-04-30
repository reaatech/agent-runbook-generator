/**
 * Code Analyzer - Identifies entry points, API endpoints, external services
 */

import * as path from 'path';
import { type ProgrammingLanguage, type Framework } from '@reaatech/agent-runbook';
import { readFile, listFiles } from '@reaatech/agent-runbook';

export interface CodeAnalysis {
  entryPoints: CodeEntryPoint[];
  apiEndpoints: ApiEndpoint[];
  externalConnections: ExternalConnection[];
  backgroundJobs: BackgroundJob[];
}

export interface CodeEntryPoint {
  file: string;
  type: 'main' | 'handler' | 'controller' | 'route';
  line?: number;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  path: string;
  handler: string;
  file: string;
  line?: number;
}

export interface ExternalConnection {
  type: 'database' | 'cache' | 'queue' | 'http' | 'grpc';
  name: string;
  connectionMethod: string;
  file: string;
}

export interface BackgroundJob {
  name: string;
  type: 'queue' | 'cron' | 'worker';
  schedule?: string;
  handler: string;
  file: string;
}

/**
 * Analyze code files for entry points, endpoints, and connections
 */
export function analyzeCode(
  repoPath: string,
  language: ProgrammingLanguage,
  framework: Framework,
): CodeAnalysis {
  const files = listFiles(repoPath, true);
  const sourceFiles = files.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    switch (language) {
      case 'typescript':
      case 'javascript':
        return ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx';
      case 'python':
        return ext === '.py';
      case 'go':
        return ext === '.go';
      case 'java':
        return ext === '.java';
      case 'ruby':
        return ext === '.rb';
      default:
        return false;
    }
  });

  return {
    entryPoints: findCodeEntryPoints(sourceFiles, repoPath, language),
    apiEndpoints: findApiEndpoints(sourceFiles, repoPath, language, framework),
    externalConnections: findExternalConnections(sourceFiles, repoPath, language),
    backgroundJobs: findBackgroundJobs(sourceFiles, repoPath, language),
  };
}

/**
 * Find code entry points
 */
function findCodeEntryPoints(
  files: string[],
  repoPath: string,
  language: ProgrammingLanguage,
): CodeEntryPoint[] {
  const entryPoints: CodeEntryPoint[] = [];

  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    const relativePath = path.relative(repoPath, file);

    // Look for main functions
    if (language === 'go' && content.includes('func main()')) {
      const lines = content.split('\n');
      const lineNum = lines.findIndex((l) => l.includes('func main()')) + 1;
      entryPoints.push({
        file: relativePath,
        type: 'main',
        line: lineNum,
      });
    }

    // Look for Java main methods
    if (language === 'java' && content.includes('public static void main')) {
      const lines = content.split('\n');
      const lineNum = lines.findIndex((l) => l.includes('public static void main')) + 1;
      entryPoints.push({
        file: relativePath,
        type: 'main',
        line: lineNum,
      });
    }

    // Look for Python main blocks
    if (language === 'python' && content.includes('if __name__')) {
      const lines = content.split('\n');
      const lineNum = lines.findIndex((l) => l.includes('if __name__')) + 1;
      entryPoints.push({
        file: relativePath,
        type: 'main',
        line: lineNum,
      });
    }

    // Look for Express app.listen or server.listen
    if ((language === 'typescript' || language === 'javascript') && content.includes('.listen(')) {
      const lines = content.split('\n');
      const lineNum = lines.findIndex((l) => l.includes('.listen(')) + 1;
      entryPoints.push({
        file: relativePath,
        type: 'main',
        line: lineNum,
      });
    }
  }

  return entryPoints;
}

/**
 * Find API endpoints from route definitions
 */
function findApiEndpoints(
  files: string[],
  repoPath: string,
  _language: ProgrammingLanguage,
  framework: Framework,
): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];

  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    const relativePath = path.relative(repoPath, file);

    // Express/Fastify/Koa routes
    if (['express', 'fastify', 'koa'].includes(framework)) {
      const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
      for (const method of httpMethods) {
        const pattern = new RegExp(`\\.${method}\\(['"\`]([^'"\`]+)['"\`]`, 'g');
        let match;
        while ((match = pattern.exec(content)) !== null) {
          endpoints.push({
            method: method.toUpperCase() as ApiEndpoint['method'],
            path: match[1]!,
            handler: '',
            file: relativePath,
          });
        }
      }
    }

    // Flask routes
    if (['flask', 'django', 'fastapi'].includes(framework)) {
      const routePattern =
        /@(?:app|router)\.(?:get|post|put|patch|delete)\(['"\`]([^'"\`]+)['"\`]\)/g;
      let match;
      while ((match = routePattern.exec(content)) !== null) {
        const methodMatch = match[0].match(/@(?:app|router)\.(\w+)/);
        endpoints.push({
          method: (methodMatch?.[1]?.toUpperCase() ?? 'GET') as ApiEndpoint['method'],
          path: match[1]!,
          handler: '',
          file: relativePath,
        });
      }
    }

    // Go Gin/Echo routes
    if (['gin', 'echo', 'chi'].includes(framework)) {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      for (const method of methods) {
        const pattern = new RegExp(`\\.${method.toLowerCase()}\\(['"\`]([^'"\`]+)['"\`]`, 'g');
        let match;
        while ((match = pattern.exec(content)) !== null) {
          endpoints.push({
            method: method as ApiEndpoint['method'],
            path: match[1]!,
            handler: '',
            file: relativePath,
          });
        }
      }
    }
  }

  return endpoints;
}

/**
 * Find external service connections
 */
function findExternalConnections(
  files: string[],
  repoPath: string,
  _language: ProgrammingLanguage,
): ExternalConnection[] {
  const connections: ExternalConnection[] = [];
  const connectionPatterns: Record<
    string,
    { type: ExternalConnection['type']; pattern: RegExp }[]
  > = {
    postgresql: [{ type: 'database', pattern: /postgres(?:ql)?:\/\//i }],
    mysql: [{ type: 'database', pattern: /mysql:\/\//i }],
    mongodb: [{ type: 'database', pattern: /mongodb:\/\//i }],
    redis: [{ type: 'cache', pattern: /redis:\/\//i }],
    memcached: [{ type: 'cache', pattern: /memcached:\/\//i }],
    kafka: [{ type: 'queue', pattern: /kafka:\/\//i }],
    rabbitmq: [{ type: 'queue', pattern: /amqp:\/\//i }],
    elasticsearch: [{ type: 'database', pattern: /elasticsearch:\/\//i }],
  };

  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    const relativePath = path.relative(repoPath, file);

    for (const [name, patterns] of Object.entries(connectionPatterns)) {
      for (const { type, pattern } of patterns) {
        if (pattern.test(content)) {
          connections.push({
            type,
            name,
            connectionMethod: 'connection_string',
            file: relativePath,
          });
        }
      }
    }
  }

  // Deduplicate
  return connections.filter(
    (conn, index, self) =>
      index === self.findIndex((c) => c.name === conn.name && c.file === conn.file),
  );
}

/**
 * Find background jobs and workers
 */
function findBackgroundJobs(
  files: string[],
  repoPath: string,
  _language: ProgrammingLanguage,
): BackgroundJob[] {
  const jobs: BackgroundJob[] = [];

  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;

    const relativePath = path.relative(repoPath, file);

    // Look for queue job definitions
    if (content.includes('.queue(') || content.includes('.enqueue(')) {
      const queuePattern = /\.(?:queue|enqueue)\(['"\`]([^'"\`]+)['"\`]/g;
      let match;
      while ((match = queuePattern.exec(content)) !== null) {
        jobs.push({
          name: match[1]!,
          type: 'queue',
          handler: match[1]!,
          file: relativePath,
        });
      }
    }

    // Look for cron/scheduled jobs
    if (content.includes('.schedule(') || content.includes('.cron(')) {
      const cronPattern = /\.(?:schedule|cron)\(['"\`]([^'"\`]+)['"\`]/g;
      let match;
      while ((match = cronPattern.exec(content)) !== null) {
        jobs.push({
          name: match[1]!,
          type: 'cron',
          schedule: match[1],
          handler: match[1]!,
          file: relativePath,
        });
      }
    }

    // Look for worker patterns
    if (content.includes('worker') || content.includes('Worker')) {
      const workerPattern = /(?:class|function|const)\s+(\w*Worker\w*)/g;
      let match;
      while ((match = workerPattern.exec(content)) !== null) {
        jobs.push({
          name: match[1]!,
          type: 'worker',
          handler: match[1]!,
          file: relativePath,
        });
      }
    }
  }

  return jobs;
}
