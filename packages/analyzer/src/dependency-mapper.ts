/**
 * Dependency Mapper - Parses package manifests and generates dependency graphs
 */

import {
  type Dependency,
  type DependencyAnalysis,
  type DependencyNode,
  type ExternalService,
} from '@reaatech/agent-runbook';
import { readFile, readJsonFile, listFiles } from '@reaatech/agent-runbook';

// Package categories based on common packages
const PACKAGE_CATEGORIES: Record<string, Dependency['category']> = {
  express: 'framework',
  fastify: 'framework',
  koa: 'framework',
  nestjs: 'framework',
  hapi: 'framework',
  flask: 'framework',
  django: 'framework',
  fastapi: 'framework',
  gin: 'framework',
  echo: 'framework',
  chi: 'framework',
  pg: 'database',
  postgres: 'database',
  postgresql: 'database',
  mysql: 'database',
  mariadb: 'database',
  mongodb: 'database',
  mongoose: 'database',
  sequelize: 'database',
  typeorm: 'database',
  prisma: 'database',
  redis: 'cache',
  ioredis: 'cache',
  memcached: 'cache',
  bull: 'queue',
  bullmq: 'queue',
  celery: 'queue',
  sidekiq: 'queue',
  kafka: 'queue',
  kafkajs: 'queue',
  rabbitmq: 'queue',
  amqplib: 'queue',
  'aws-sdk': 'storage',
  '@aws-sdk': 'storage',
  s3: 'storage',
  '@google-cloud/storage': 'storage',
  azure: 'storage',
  prometheus: 'monitoring',
  datadog: 'monitoring',
  opentelemetry: 'monitoring',
  pino: 'utility',
  winston: 'utility',
  bunyan: 'utility',
  chalk: 'utility',
  lodash: 'utility',
  moment: 'utility',
  dayjs: 'utility',
};

/**
 * Map dependencies for a repository
 */
export function mapDependencies(repoPath: string, includeDev: boolean = false): DependencyAnalysis {
  const files = listFiles(repoPath, true);

  const directDeps: Dependency[] = [];
  const transitiveDeps: Dependency[] = [];
  const externalServices: ExternalService[] = [];
  const dependencyGraph: DependencyNode[] = [];

  // Parse package.json (Node.js)
  const packageJsonPath = files.find((f) => f.endsWith('package.json'));
  if (packageJsonPath) {
    const packageJson = readJsonFile<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      name?: string;
    }>(packageJsonPath);

    if (packageJson) {
      const allDeps: Record<string, string> = {
        ...packageJson.dependencies,
      };

      if (includeDev) {
        Object.assign(allDeps, packageJson.devDependencies);
      }

      for (const [name, version] of Object.entries(allDeps)) {
        const dep: Dependency = {
          name,
          version: version?.replace(/^[\^~>=<]+/, ''),
          purpose: getPackagePurpose(name),
          category: PACKAGE_CATEGORIES[name] || 'utility',
        };
        directDeps.push(dep);

        // Add to graph
        dependencyGraph.push({
          name,
          version: dep.version,
          dependsOn: [],
        });

        // Check if it's an external service
        const service = detectExternalService(name);
        if (service) {
          externalServices.push(service);
        }
      }
    }
  }

  // Parse requirements.txt (Python)
  const requirementsPath = files.find((f) => f.endsWith('requirements.txt'));
  if (requirementsPath) {
    const content = readFile(requirementsPath);
    if (content) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([a-zA-Z0-9_-]+)(?:[=<>!~]+(.+))?$/);
          if (match) {
            const name = match[1]!;
            const version = match[2];
            const dep: Dependency = {
              name: name.toLowerCase(),
              version,
              purpose: getPackagePurpose(name),
              category: PACKAGE_CATEGORIES[name.toLowerCase()] || 'utility',
            };
            directDeps.push(dep);

            const service = detectExternalService(name);
            if (service) {
              externalServices.push(service);
            }
          }
        }
      }
    }
  }

  // Parse go.mod (Go)
  const goModPath = files.find((f) => f.endsWith('go.mod'));
  if (goModPath) {
    const content = readFile(goModPath);
    if (content) {
      const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
      if (requireBlock) {
        const lines = requireBlock[1]!.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('//')) {
            const match = trimmed.match(/^(\S+)\s+(\S+)/);
            if (match) {
              const name = match[1]!;
              const version = match[2]!;
              const depName = name.split('/').pop() || name;
              const dep: Dependency = {
                name: depName,
                version: version.replace(/^v/, ''),
                purpose: getPackagePurpose(depName),
                category: PACKAGE_CATEGORIES[depName] || 'utility',
              };
              directDeps.push(dep);

              const service = detectExternalService(depName);
              if (service) {
                externalServices.push(service);
              }
            }
          }
        }
      }
    }
  }

  // Parse pom.xml (Java)
  const pomXmlPath = files.find((f) => f.endsWith('pom.xml'));
  if (pomXmlPath) {
    const content = readFile(pomXmlPath);
    if (content) {
      const depPattern =
        /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*(?:<version>([^<]+)<\/version>)?/g;
      let match;
      while ((match = depPattern.exec(content)) !== null) {
        const groupId = match[1]!;
        const artifactId = match[2]!;
        const version = match[3];
        const dep: Dependency = {
          name: artifactId,
          version,
          purpose: getPackagePurpose(artifactId),
          category: PACKAGE_CATEGORIES[artifactId] || 'utility',
        };
        directDeps.push(dep);

        dependencyGraph.push({
          name: `${groupId}:${artifactId}`,
          version,
          dependsOn: [],
        });
      }
    }
  }

  // Build dependency graph relationships (simplified)
  for (const node of dependencyGraph) {
    // Find potential dependencies based on common patterns
    for (const other of dependencyGraph) {
      if (node.name !== other.name) {
        // Simple heuristic: if one package is commonly used by another
        if (isDependencyOf(node.name, other.name)) {
          node.dependsOn.push(other.name);
        }
      }
    }
  }

  return {
    directDeps,
    transitiveDeps,
    dependencyGraph,
    externalServices,
  };
}

/**
 * Get the purpose of a package based on its name
 */
function getPackagePurpose(name: string): string {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes('express') ||
    lowerName.includes('fastify') ||
    lowerName.includes('flask') ||
    lowerName.includes('django') ||
    lowerName.includes('gin')
  ) {
    return 'Web framework';
  }
  if (
    lowerName.includes('pg') ||
    lowerName.includes('mysql') ||
    lowerName.includes('mongo') ||
    lowerName.includes('sequelize')
  ) {
    return 'Database driver/ORM';
  }
  if (lowerName.includes('redis') || lowerName.includes('cache')) {
    return 'Caching client';
  }
  if (
    lowerName.includes('kafka') ||
    lowerName.includes('queue') ||
    lowerName.includes('bull') ||
    lowerName.includes('celery')
  ) {
    return 'Message queue client';
  }
  if (
    lowerName.includes('prometheus') ||
    lowerName.includes('metrics') ||
    lowerName.includes('telemetry')
  ) {
    return 'Monitoring/observability';
  }
  if (lowerName.includes('pino') || lowerName.includes('winston') || lowerName.includes('log')) {
    return 'Logging';
  }
  if (lowerName.includes('aws') || lowerName.includes('gcp') || lowerName.includes('azure')) {
    return 'Cloud provider SDK';
  }
  if (
    lowerName.includes('test') ||
    lowerName.includes('spec') ||
    lowerName.includes('jest') ||
    lowerName.includes('mocha') ||
    lowerName.includes('pytest')
  ) {
    return 'Testing framework';
  }
  if (
    lowerName.includes('jwt') ||
    lowerName.includes('auth') ||
    lowerName.includes('passport') ||
    lowerName.includes('bcrypt')
  ) {
    return 'Authentication/security';
  }
  if (
    lowerName.includes('cors') ||
    lowerName.includes('helmet') ||
    lowerName.includes('compression')
  ) {
    return 'Middleware';
  }
  if (lowerName.includes('dotenv') || lowerName.includes('config')) {
    return 'Configuration';
  }
  if (
    lowerName.includes('zod') ||
    lowerName.includes('joi') ||
    lowerName.includes('yup') ||
    lowerName.includes('validator')
  ) {
    return 'Validation';
  }

  return 'Utility library';
}

/**
 * Detect if a package name represents an external service
 */
function detectExternalService(name: string): ExternalService | null {
  const lowerName = name.toLowerCase();

  const serviceMappings: Record<string, { type: ExternalService['type']; name: string }> = {
    pg: { type: 'database', name: 'postgresql' },
    postgres: { type: 'database', name: 'postgresql' },
    postgresql: { type: 'database', name: 'postgresql' },
    mysql: { type: 'database', name: 'mysql' },
    mysql2: { type: 'database', name: 'mysql' },
    mariadb: { type: 'database', name: 'mariadb' },
    mongodb: { type: 'database', name: 'mongodb' },
    mongoose: { type: 'database', name: 'mongodb' },
    redis: { type: 'cache', name: 'redis' },
    ioredis: { type: 'cache', name: 'redis' },
    memcached: { type: 'cache', name: 'memcached' },
    kafka: { type: 'queue', name: 'kafka' },
    kafkajs: { type: 'queue', name: 'kafka' },
    'node-rdkafka': { type: 'queue', name: 'kafka' },
    rabbitmq: { type: 'queue', name: 'rabbitmq' },
    amqplib: { type: 'queue', name: 'rabbitmq' },
    bull: { type: 'queue', name: 'bull' },
    bullmq: { type: 'queue', name: 'bull' },
    'aws-sdk': { type: 'storage', name: 'aws-s3' },
    '@aws-sdk/client-s3': { type: 'storage', name: 'aws-s3' },
    s3: { type: 'storage', name: 'aws-s3' },
    elasticsearch: { type: 'database', name: 'elasticsearch' },
    '@elastic/elasticsearch': { type: 'database', name: 'elasticsearch' },
  };

  const service = serviceMappings[lowerName];
  if (service) {
    return {
      ...service,
      connectionEnvVar: `${service.name.toUpperCase().replace(/-/g, '_')}_URL`,
    };
  }

  return null;
}

/**
 * Check if one package is commonly a dependency of another
 */
function isDependencyOf(pkg: string, parent: string): boolean {
  // Common dependency relationships
  const relationships: Record<string, string[]> = {
    express: ['body-parser', 'cors', 'helmet', 'morgan'],
    react: ['react-dom', 'prop-types'],
    next: ['react', 'react-dom'],
    nestjs: ['@nestjs/common', '@nestjs/core', 'rxjs'],
    flask: ['jinja2', 'werkzeug', 'click'],
    django: ['pytz', 'sqlparse'],
    fastapi: ['pydantic', 'starlette', 'uvicorn'],
  };

  const deps = relationships[parent];
  return deps ? deps.includes(pkg) : false;
}

export { mapDependencies as analyzeDependencies };
