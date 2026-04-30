/**
 * Repository Scanner - Detects service type, language, framework, and structure
 */

import * as path from 'node:path';
import type {
  DeploymentPlatform,
  EntryPoint,
  ExternalService,
  Framework,
  ProgrammingLanguage,
  RepositoryAnalysis,
  RepositoryStructure,
  ServiceType,
} from '@reaatech/agent-runbook';
import { directoryExists, listFiles, readFile, readJsonFile } from '@reaatech/agent-runbook';

// File patterns for language detection
const LANGUAGE_PATTERNS: Record<ProgrammingLanguage, string[]> = {
  typescript: ['*.ts', '*.tsx'],
  javascript: ['*.js', '*.jsx', '*.mjs'],
  python: ['*.py'],
  go: ['*.go'],
  java: ['*.java'],
  ruby: ['*.rb'],
  rust: ['*.rs'],
  unknown: [],
};

// Package files for framework detection
const PACKAGE_FILES: Record<string, string[]> = {
  'package.json': ['express', 'fastify', 'koa', 'nestjs', 'hapi'],
  'requirements.txt': ['flask', 'django', 'fastapi', 'tornado'],
  'pyproject.toml': ['flask', 'django', 'fastapi', 'tornado'],
  'go.mod': ['gin', 'echo', 'chi', 'fiber', 'beego'],
  'pom.xml': ['spring-boot', 'quarkus', 'micronaut'],
  Gemfile: ['rails', 'sinatra', 'hanami'],
  'Cargo.toml': ['actix', 'rocket', 'warp'],
};

// Framework to service type mapping
const FRAMEWORK_SERVICE_TYPE: Record<string, ServiceType> = {
  express: 'web-api',
  fastify: 'web-api',
  koa: 'web-api',
  nestjs: 'web-api',
  hapi: 'web-api',
  flask: 'web-api',
  django: 'web-api',
  fastapi: 'web-api',
  tornado: 'web-api',
  gin: 'web-api',
  echo: 'web-api',
  chi: 'web-api',
  fiber: 'web-api',
  beego: 'web-api',
  spring: 'web-api',
  'spring-boot': 'web-api',
  quarkus: 'web-api',
  micronaut: 'web-api',
  rails: 'web-api',
  sinatra: 'web-api',
  hanami: 'web-api',
  actix: 'web-api',
  rocket: 'web-api',
  warp: 'web-api',
  bull: 'worker',
  bullmq: 'worker',
  celery: 'worker',
  sidekiq: 'worker',
  'sidekiq-cron': 'worker',
};

// Ignore patterns for repository scanning
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.output',
  'vendor',
  '.terraform',
  '*.log',
  '*.tmp',
  '.DS_Store',
  'Thumbs.db',
];

export interface ScanOptions {
  depth?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFiles?: number;
}

/**
 * Scan a repository and return analysis results
 */
export async function scanRepository(
  repoPath: string,
  options: ScanOptions = {},
): Promise<RepositoryAnalysis> {
  const {
    depth = 5,
    includePatterns: _includePatterns = [],
    excludePatterns = [],
    maxFiles = 10000,
  } = options;

  // Validate path
  if (!directoryExists(repoPath)) {
    throw new Error(`Repository path does not exist: ${repoPath}`);
  }

  // Setup ignore filter - use dynamic import for CJS module
  let ig: { ignores: (path: string) => boolean; add: (patterns: string[]) => void };
  try {
    const IgModule = await import('ignore');
    const Ig = (
      IgModule as unknown as {
        default: (options?: unknown) => {
          ignores: (path: string) => boolean;
          add: (patterns: string[]) => void;
        };
      }
    ).default;
    ig = Ig();
  } catch {
    // Fallback: create a minimal ignore implementation
    ig = {
      ignores: () => false,
      add: () => {},
    };
  }
  ig.add([...DEFAULT_IGNORE_PATTERNS, ...excludePatterns]);

  // Get all files
  const allFiles = listFiles(repoPath, true);
  const filteredFiles = allFiles
    .filter((f) => {
      const relativePath = path.relative(repoPath, f);
      return !ig.ignores(relativePath);
    })
    .slice(0, maxFiles);

  // Detect language
  const language = detectLanguage(filteredFiles, repoPath);

  // Detect framework
  const framework = detectFramework(filteredFiles, repoPath, language);

  // Detect service type
  const serviceType = detectServiceType(framework, filteredFiles, repoPath);

  // Analyze structure
  const structure = analyzeStructure(filteredFiles, repoPath, depth);

  // Find config files
  const configFiles = findConfigFiles(filteredFiles, repoPath);

  // Find entry points
  const entryPoints = findEntryPoints(filteredFiles, repoPath, language, framework);

  // Detect external services
  const externalServices = detectExternalServices(filteredFiles, repoPath, language);

  const packageJsonPath = filteredFiles.find(
    (f) => f.endsWith('package.json') && !f.includes('node_modules'),
  );
  let serviceName: string | undefined;
  let description: string | undefined;
  if (packageJsonPath) {
    const pkg = readJsonFile<{ name?: string; description?: string }>(packageJsonPath);
    if (pkg) {
      serviceName = pkg.name;
      description = pkg.description;
    }
  }

  return {
    serviceName,
    description,
    serviceType,
    language,
    framework,
    structure,
    configFiles,
    entryPoints,
    externalServices,
  };
}

/**
 * Detect the primary programming language
 */
function detectLanguage(files: string[], _repoPath: string): ProgrammingLanguage {
  const languageCounts: Record<ProgrammingLanguage, number> = {
    typescript: 0,
    javascript: 0,
    python: 0,
    go: 0,
    java: 0,
    ruby: 0,
    rust: 0,
    unknown: 0,
  };

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      if (patterns.some((p) => p.endsWith(ext))) {
        languageCounts[lang as ProgrammingLanguage]++;
        break;
      }
    }
  }

  // Find the language with the most files
  let maxCount = 0;
  let detectedLanguage: ProgrammingLanguage = 'unknown';
  for (const [lang, count] of Object.entries(languageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedLanguage = lang as ProgrammingLanguage;
    }
  }

  return detectedLanguage;
}

/**
 * Detect the framework being used
 */
function detectFramework(
  files: string[],
  _repoPath: string,
  language: ProgrammingLanguage,
): Framework {
  // Check for package files
  for (const [packageFile, frameworks] of Object.entries(PACKAGE_FILES)) {
    const packagePath = files.find((f) => f.endsWith(packageFile));
    if (packagePath) {
      const content = readFile(packagePath);
      if (content) {
        for (const framework of frameworks) {
          if (content.toLowerCase().includes(framework.toLowerCase())) {
            return framework as Framework;
          }
        }
      }
    }
  }

  // Language-specific detection
  switch (language) {
    case 'go': {
      const goMod = files.find((f) => f.endsWith('go.mod'));
      if (goMod) {
        const content = readFile(goMod);
        if (content) {
          if (content.includes('gin')) return 'gin';
          if (content.includes('echo')) return 'echo';
          if (content.includes('chi')) return 'chi';
        }
      }
      break;
    }
    case 'java': {
      const pomXml = files.find((f) => f.endsWith('pom.xml'));
      if (pomXml) {
        const content = readFile(pomXml);
        if (content) {
          if (content.includes('spring-boot')) return 'spring';
        }
      }
      break;
    }
    case 'ruby': {
      const gemfile = files.find((f) => f.endsWith('Gemfile'));
      if (gemfile) {
        const content = readFile(gemfile);
        if (content) {
          if (content.includes("gem 'rails'")) return 'rails';
        }
      }
      break;
    }
  }

  return 'none';
}

/**
 * Detect the service type
 */
function detectServiceType(framework: Framework, files: string[], _repoPath: string): ServiceType {
  // Check framework mapping
  if (framework && FRAMEWORK_SERVICE_TYPE[framework]) {
    return FRAMEWORK_SERVICE_TYPE[framework];
  }

  // Check for worker patterns
  const workerPatterns = ['worker', 'queue', 'job', 'task', 'background'];
  const hasWorkerPatterns = files.some((f) =>
    workerPatterns.some((p) => f.toLowerCase().includes(p)),
  );
  if (hasWorkerPatterns) {
    return 'worker';
  }

  // Check for lambda/serverless
  const serverlessConfig = files.find(
    (f) => f.endsWith('serverless.yml') || f.endsWith('serverless.yaml'),
  );
  if (serverlessConfig) {
    return 'lambda';
  }

  // Check for function patterns
  const hasFunctionPatterns = files.some((f) => f.toLowerCase().includes('function'));
  if (hasFunctionPatterns) {
    return 'function';
  }

  // Default to web-api if there are HTTP-related files
  const hasHttpFiles = files.some((f) =>
    ['route', 'handler', 'controller', 'endpoint'].some((p) => f.toLowerCase().includes(p)),
  );
  if (hasHttpFiles) {
    return 'web-api';
  }

  return 'unknown';
}

/**
 * Analyze repository structure
 */
function analyzeStructure(
  files: string[],
  repoPath: string,
  maxDepth: number,
): RepositoryStructure {
  const directories = new Set<string>();
  let maxFoundDepth = 0;

  for (const file of files) {
    const relativePath = path.relative(repoPath, file);
    const parts = relativePath.split(path.sep);
    const depth = parts.length - 1;

    if (depth > maxFoundDepth) {
      maxFoundDepth = depth;
    }

    // Track main directories (first level)
    if (parts.length > 1) {
      // biome-ignore lint/style/noNonNullAssertion: suppressed for existing code
      directories.add(parts[0]!);
    }
  }

  const hasTests = files.some(
    (f) => f.toLowerCase().includes('test') || f.toLowerCase().includes('spec'),
  );
  const hasDockerfile = files.some((f) => f.endsWith('Dockerfile'));
  const hasKubernetesManifests = files.some(
    (f) =>
      (f.endsWith('.yaml') || f.endsWith('.yml')) &&
      (f.includes('k8s') || f.includes('kubernetes') || f.includes('deployment')),
  );
  const hasTerraform = files.some((f) => f.endsWith('.tf'));

  return {
    mainDirectories: [...directories].slice(0, 10),
    fileCount: files.length,
    depth: Math.min(maxFoundDepth, maxDepth),
    hasTests,
    hasDockerfile,
    hasKubernetesManifests,
    hasTerraform,
  };
}

/**
 * Find configuration files
 */
function findConfigFiles(files: string[], repoPath: string): string[] {
  const configPatterns = [
    'package.json',
    'pyproject.toml',
    'go.mod',
    'pom.xml',
    'Gemfile',
    'Cargo.toml',
    'requirements.txt',
    '.env.example',
    '.env.sample',
    'config.yaml',
    'config.yml',
    'config.json',
    'application.yaml',
    'application.yml',
    'application.properties',
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    'serverless.yml',
    'serverless.yaml',
    'terraform.tf',
    'main.tf',
  ];

  const configFiles: string[] = [];
  for (const file of files) {
    const basename = path.basename(file);
    if (configPatterns.includes(basename)) {
      configFiles.push(path.relative(repoPath, file));
    }
  }

  return configFiles;
}

/**
 * Find entry points
 */
function findEntryPoints(
  files: string[],
  repoPath: string,
  language: ProgrammingLanguage,
  _framework: Framework,
): EntryPoint[] {
  const entryPoints: EntryPoint[] = [];

  // Node.js entry points
  if (language === 'typescript' || language === 'javascript') {
    const commonEntryPoints = [
      'src/index.ts',
      'src/index.js',
      'index.ts',
      'index.js',
      'src/main.ts',
      'src/main.js',
      'app.ts',
      'app.js',
      'server.ts',
      'server.js',
    ];

    for (const entry of commonEntryPoints) {
      if (files.some((f) => f.endsWith(entry))) {
        entryPoints.push({
          file: entry,
          type: 'http_server',
        });
      }
    }

    // Check package.json for main/bin
    const packageJsonPath = files.find((f) => f.endsWith('package.json'));
    if (packageJsonPath) {
      const packageJson = readJsonFile<{
        main?: string;
        bin?: string | Record<string, string>;
        scripts?: Record<string, string>;
      }>(packageJsonPath);
      if (packageJson) {
        if (packageJson.main) {
          entryPoints.push({
            file: packageJson.main,
            type: 'http_server',
          });
        }
        if (packageJson.bin) {
          if (typeof packageJson.bin === 'string') {
            entryPoints.push({
              file: packageJson.bin,
              type: 'cli',
            });
          } else {
            for (const [, filePath] of Object.entries(packageJson.bin)) {
              entryPoints.push({
                file: filePath,
                type: 'cli',
              });
            }
          }
        }
      }
    }
  }

  // Python entry points
  if (language === 'python') {
    const commonEntryPoints = [
      'main.py',
      'app.py',
      'wsgi.py',
      'asgi.py',
      'manage.py',
      'src/main.py',
      'src/app.py',
    ];

    for (const entry of commonEntryPoints) {
      if (files.some((f) => f.endsWith(entry))) {
        const type: EntryPoint['type'] = entry === 'manage.py' ? 'cli' : 'http_server';
        entryPoints.push({ file: entry, type });
      }
    }
  }

  // Go entry points
  if (language === 'go') {
    const mainGo = files.find((f) => f.endsWith('main.go'));
    if (mainGo) {
      entryPoints.push({
        file: path.relative(repoPath, mainGo),
        type: 'http_server',
      });
    }
  }

  // Java entry points
  if (language === 'java') {
    const applicationClass = files.find((f) => f.endsWith('Application.java'));
    if (applicationClass) {
      entryPoints.push({
        file: path.relative(repoPath, applicationClass),
        type: 'http_server',
      });
    }
  }

  // If no entry points found, use heuristics
  if (entryPoints.length === 0) {
    // Look for files with common entry point names
    const possibleEntries = files.filter((f) => {
      const basename = path.basename(f).toLowerCase();
      return ['main', 'index', 'app', 'server'].includes(basename.replace(/\.[^.]+$/, ''));
    });

    for (const entry of possibleEntries.slice(0, 3)) {
      entryPoints.push({
        file: path.relative(repoPath, entry),
        type: 'http_server',
      });
    }
  }

  return entryPoints;
}

/**
 * Detect external services from configuration
 */
function detectExternalServices(
  files: string[],
  _repoPath: string,
  _language: ProgrammingLanguage,
): ExternalService[] {
  const services: ExternalService[] = [];
  const servicePatterns: Record<string, { type: ExternalService['type']; name: string }[]> = {
    postgresql: [{ type: 'database', name: 'postgresql' }],
    postgres: [{ type: 'database', name: 'postgresql' }],
    mysql: [{ type: 'database', name: 'mysql' }],
    mongodb: [{ type: 'database', name: 'mongodb' }],
    redis: [{ type: 'cache', name: 'redis' }],
    memcached: [{ type: 'cache', name: 'memcached' }],
    elasticsearch: [{ type: 'database', name: 'elasticsearch' }],
    kafka: [{ type: 'queue', name: 'kafka' }],
    rabbitmq: [{ type: 'queue', name: 'rabbitmq' }],
    sqs: [{ type: 'queue', name: 'sqs' }],
    s3: [{ type: 'storage', name: 's3' }],
    gcs: [{ type: 'storage', name: 'gcs' }],
    'azure-blob': [{ type: 'storage', name: 'azure-blob' }],
  };

  // Check package files for service dependencies
  const packageJsonPath = files.find((f) => f.endsWith('package.json'));
  if (packageJsonPath) {
    const packageJson = readJsonFile<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(packageJsonPath);
    if (packageJson) {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      for (const [depName] of Object.entries(allDeps)) {
        const lowerName = depName.toLowerCase();
        for (const [pattern, serviceInfo] of Object.entries(servicePatterns)) {
          if (lowerName.includes(pattern)) {
            const info = serviceInfo[0];
            if (info) {
              services.push({
                ...info,
                connectionEnvVar: `${pattern.toUpperCase()}_URL`,
              });
            }
          }
        }
      }
    }
  }

  // Check requirements.txt for Python
  const requirementsPath = files.find((f) => f.endsWith('requirements.txt'));
  if (requirementsPath) {
    const content = readFile(requirementsPath);
    if (content) {
      for (const [pattern, serviceInfo] of Object.entries(servicePatterns)) {
        if (content.toLowerCase().includes(pattern)) {
          const info = serviceInfo[0];
          if (info) {
            services.push({
              ...info,
              connectionEnvVar: `${pattern.toUpperCase()}_URL`,
            });
          }
        }
      }
    }
  }

  // Check go.mod for Go
  const goModPath = files.find((f) => f.endsWith('go.mod'));
  if (goModPath) {
    const content = readFile(goModPath);
    if (content) {
      for (const [pattern, serviceInfo] of Object.entries(servicePatterns)) {
        if (content.toLowerCase().includes(pattern)) {
          const info = serviceInfo[0];
          if (info) {
            services.push({
              ...info,
              connectionEnvVar: `${pattern.toUpperCase()}_URL`,
            });
          }
        }
      }
    }
  }

  // Deduplicate services
  const uniqueServices = services.filter(
    (service, index, self) => index === self.findIndex((s) => s.name === service.name),
  );

  return uniqueServices;
}

/**
 * Detect deployment platform from repository files
 */
export function detectDeploymentPlatform(files: string[], _repoPath: string): DeploymentPlatform {
  // Check for Kubernetes manifests
  const k8sFiles = files.filter(
    (f) =>
      (f.endsWith('.yaml') || f.endsWith('.yml')) &&
      (f.includes('k8s') || f.includes('kubernetes') || f.includes('deployment')),
  );
  if (k8sFiles.length > 0) {
    // Check if it's GKE or EKS specific
    return 'kubernetes';
  }

  // Check for ECS task definitions
  const ecsFiles = files.filter(
    (f) =>
      (f.endsWith('.json') || f.endsWith('.yaml')) && f.toLowerCase().includes('task-definition'),
  );
  if (ecsFiles.length > 0) {
    return 'ecs';
  }

  // Check for Cloud Run
  const cloudbuildFile = files.find((f) => f.endsWith('cloudbuild.yaml'));
  if (cloudbuildFile) {
    return 'cloud-run';
  }

  // Check for Lambda/Serverless
  const serverlessFile = files.find(
    (f) => f.endsWith('serverless.yml') || f.endsWith('serverless.yaml'),
  );
  if (serverlessFile) {
    return 'lambda';
  }

  // Check for App Engine
  const appYaml = files.find((f) => f.endsWith('app.yaml'));
  if (appYaml) {
    return 'app-engine';
  }

  // Check for Heroku
  const procfile = files.find((f) => f.endsWith('Procfile'));
  if (procfile) {
    return 'heroku';
  }

  // Check for Terraform with VM/Compute Engine
  const terraformFiles = files.filter((f) => f.endsWith('.tf'));
  if (terraformFiles.length > 0) {
    // Could be any platform, but default to VM if we find compute instances
    for (const tfFile of terraformFiles) {
      const content = readFile(tfFile);
      if (content) {
        if (content.includes('google_compute_instance')) return 'vm';
        if (content.includes('aws_instance')) return 'vm';
        if (content.includes('azurerm_virtual_machine')) return 'vm';
      }
    }
  }

  return 'unknown';
}
