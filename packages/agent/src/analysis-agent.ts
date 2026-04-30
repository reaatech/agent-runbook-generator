/**
 * Analysis Agent - LLM-powered repository analysis
 */

import { type AnalysisContext, type AnalysisInsight } from '@reaatech/agent-runbook';
import { generatePrompt, getSystemPrompt, type PromptType } from './prompt-templates.js';
import { ProviderAdapter } from './provider-adapter.js';

export interface AgentConfig {
  provider: 'claude' | 'openai' | 'gemini' | 'mock';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason?: string;
  error?: string;
}

export class AnalysisAgent {
  private config: AgentConfig;
  private providerAdapter: ProviderAdapter;

  constructor(config: AgentConfig) {
    this.config = {
      temperature: 0.1,
      maxTokens: 4096,
      ...config,
    };
    this.providerAdapter = new ProviderAdapter(this.config);
  }

  async analyzeRepository(context: AnalysisContext): Promise<AnalysisInsight[]> {
    const prompt = generatePrompt('repository-analysis', {
      serviceName: context.serviceDefinition.name,
      language: context.repositoryAnalysis.language,
      framework: context.repositoryAnalysis.framework,
      serviceType: context.repositoryAnalysis.serviceType,
      dependencies: context.dependencyAnalysis.directDeps.map((d) => ({
        name: d.name,
        version: d.version,
        type: d.category,
      })),
      externalServices: context.externalServices,
    });

    const response = await this.callLLM(getSystemPrompt('repository-analysis'), prompt);
    return this.parseInsights(response.content);
  }

  async identifyFailureModes(context: AnalysisContext): Promise<string[]> {
    const prompt = generatePrompt('failure-mode-identification', {
      serviceName: context.serviceDefinition.name,
      language: context.repositoryAnalysis.language,
      framework: context.repositoryAnalysis.framework,
      dependencies: context.dependencyAnalysis.directDeps.map((d) => ({
        name: d.name,
        version: d.version,
        type: d.category,
      })),
      externalServices: context.externalServices,
      entryPoints: context.repositoryAnalysis.entryPoints.map((ep) => ep.file),
    });

    const response = await this.callLLM(getSystemPrompt('failure-mode-identification'), prompt);
    return this.parseFailureModes(response.content);
  }

  async generateRunbookSection(
    sectionType:
      | 'alerts'
      | 'dashboards'
      | 'failure-modes'
      | 'rollback'
      | 'incident-response'
      | 'health-checks',
    context: AnalysisContext,
  ): Promise<string> {
    const prompt = generatePrompt(`runbook-${sectionType}` as PromptType, {
      serviceName: context.serviceDefinition.name,
      language: context.repositoryAnalysis.language,
      framework: context.repositoryAnalysis.framework,
      serviceType: context.repositoryAnalysis.serviceType,
      dependencies: context.dependencyAnalysis.directDeps.map((d) => ({
        name: d.name,
        version: d.version,
        type: d.category,
      })),
      externalServices: context.externalServices,
    });

    const response = await this.callLLM(
      getSystemPrompt(`runbook-${sectionType}` as PromptType),
      prompt,
    );
    return response.content;
  }

  private resolveApiKey(provider: string): string | undefined {
    if (this.config.apiKey) return this.config.apiKey;
    const envKeys: Record<string, string> = {
      claude: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      gemini: 'GOOGLE_API_KEY',
    };
    return process.env[envKeys[provider] ?? 'LLM_API_KEY'] || process.env.LLM_API_KEY;
  }

  private async callLLM(systemPrompt: string, userPrompt: string): Promise<AgentResponse> {
    const apiKey = this.resolveApiKey(this.config.provider);
    const model = this.config.model || this.getDefaultModel();

    if (this.config.provider === 'mock' || !apiKey) {
      return this.callMock(systemPrompt, userPrompt);
    }

    try {
      switch (this.config.provider) {
        case 'claude':
          return await this.callClaude(systemPrompt, userPrompt, apiKey, model);
        case 'openai':
          return await this.callOpenAI(systemPrompt, userPrompt, apiKey, model);
        case 'gemini':
          return await this.callGemini(systemPrompt, userPrompt, apiKey, model);
        default:
          return this.callMock(systemPrompt, userPrompt);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fallbackProvider = this.providerAdapter.getFallbackProvider();
      if (fallbackProvider && apiKey) {
        try {
          switch (fallbackProvider) {
            case 'claude':
              return await this.callClaude(
                systemPrompt,
                userPrompt,
                apiKey,
                'claude-opus-4-5-20260506',
              );
            case 'openai':
              return await this.callOpenAI(systemPrompt, userPrompt, apiKey, 'gpt-4-turbo');
            case 'gemini':
              return await this.callGemini(systemPrompt, userPrompt, apiKey, 'gemini-2.0-flash');
          }
        } catch {
          return { content: '', tokensUsed: 0, model: 'unknown', error: errorMessage };
        }
      }
      return { content: '', tokensUsed: 0, model: 'unknown', error: errorMessage };
    }
  }

  private getDefaultModel(): string {
    switch (this.config.provider) {
      case 'claude':
        return 'claude-opus-4-5-20260506';
      case 'openai':
        return 'gpt-4-turbo';
      case 'gemini':
        return 'gemini-2.0-flash';
      default:
        return 'mock-model';
    }
  }

  private async callClaude(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ): Promise<AgentResponse> {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model,
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature || 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return this.providerAdapter.parseResponse('claude', response);
  }

  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ): Promise<AgentResponse> {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model,
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature || 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return this.providerAdapter.parseResponse('openai', response);
  }

  private async callGemini(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ): Promise<AgentResponse> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const client = new GoogleGenerativeAI(apiKey);
    const genModel = client.getGenerativeModel({ model });

    const result = await genModel.generateContent([{ text: systemPrompt }, { text: userPrompt }]);

    return this.providerAdapter.parseResponse('gemini', await result.response);
  }

  private async callMock(_systemPrompt: string, userPrompt: string): Promise<AgentResponse> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (userPrompt.includes('failure')) {
      return {
        content: this.generateMockFailureModes(),
        tokensUsed: 100,
        model: 'mock-model',
        finishReason: 'stop',
      };
    }
    if (userPrompt.includes('runbook')) {
      return {
        content: this.generateMockRunbookSection(),
        tokensUsed: 100,
        model: 'mock-model',
        finishReason: 'stop',
      };
    }
    return {
      content: this.generateMockInsights(),
      tokensUsed: 100,
      model: 'mock-model',
      finishReason: 'stop',
    };
  }

  private generateMockInsights(): string {
    return `## Key Findings

1. **Service Architecture**: Well-structured microservice with clear separation of concerns
2. **Dependencies**: Uses industry-standard libraries and frameworks
3. **Error Handling**: Comprehensive error handling with proper logging
4. **Security**: Follows security best practices

## Recommendations

1. Add circuit breakers for external API calls
2. Implement rate limiting for high-traffic endpoints
3. Add distributed tracing for better observability
4. Consider implementing health check endpoints for all dependencies`;
  }

  private generateMockFailureModes(): string {
    return `## Potential Failure Modes

1. **Database Connection Failure**
   - Detection: Connection pool exhaustion, timeout errors
   - Mitigation: Enable circuit breaker, scale read replicas

2. **Memory Exhaustion**
   - Detection: Memory utilization > 85%, OOM kills
   - Mitigation: Scale horizontally, increase memory limits

3. **External API Failure**
   - Detection: High error rate from external calls
   - Mitigation: Implement fallbacks, use cached data

4. **Queue Overflow**
   - Detection: Queue depth exceeding threshold
   - Mitigation: Scale consumers, implement dead letter queues`;
  }

  private generateMockRunbookSection(): string {
    return `## Service Overview

This service is a critical component of the platform, handling core business logic and data processing.

### Key Components
- API Layer: Handles incoming requests
- Business Logic: Processes data and enforces rules
- Data Access: Manages database interactions
- External Integrations: Connects to third-party services

### Monitoring
- Primary metrics: Request rate, error rate, latency
- Key dashboards: Service health, business metrics
- Alert thresholds: Based on SLO targets`;
  }

  private parseInsights(content: string): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('##')) {
        currentSection = line.replace('##', '').trim();
      } else if (line.startsWith('1.') || line.startsWith('-')) {
        insights.push({
          category: currentSection || 'general',
          finding: line.replace(/^[\d\-\.]+\s*/, '').trim(),
          confidence: 'medium',
        });
      }
    }

    return insights;
  }

  private parseFailureModes(content: string): string[] {
    const modes: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.match(/^\d+\.\s+\*\*/)) {
        const mode = line
          .replace(/^\d+\.\s+\*\*/, '')
          .replace(/\*\*.*/, '')
          .trim();
        modes.push(mode);
      }
    }

    return modes;
  }
}

/**
 * Create analysis agent with default configuration
 */
export function createAnalysisAgent(config?: Partial<AgentConfig>): AnalysisAgent {
  const defaultConfig: AgentConfig = {
    provider: (process.env.LLM_PROVIDER as AgentConfig['provider']) ?? 'mock',
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
    temperature: 0.1,
    maxTokens: 4096,
  };

  return new AnalysisAgent({ ...defaultConfig, ...config });
}
