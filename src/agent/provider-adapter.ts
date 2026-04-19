/**
 * Provider Adapter - Handles provider-specific formatting and fallbacks
 */

import { type AgentResponse, type AgentConfig } from './analysis-agent.js';

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderRequest {
  model: string;
  messages: ProviderMessage[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * Provider Adapter for handling different LLM providers
 */
export class ProviderAdapter {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Format messages for specific provider
   */
  formatMessages(
    systemPrompt: string,
    userPrompt: string,
  ): ProviderMessage[] {
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  /**
   * Format request for Claude API
   */
  formatForClaude(
    systemPrompt: string,
    userPrompt: string,
  ): ProviderRequest {
    return {
      model: this.config.model ?? 'claude-opus-4-5-20260506',
      messages: this.formatMessages(systemPrompt, userPrompt),
      temperature: this.config.temperature ?? 0.1,
      max_tokens: this.config.maxTokens ?? 4096,
    };
  }

  /**
   * Format request for OpenAI API
   */
  formatForOpenAI(
    systemPrompt: string,
    userPrompt: string,
  ): ProviderRequest {
    return {
      model: this.config.model ?? 'gpt-4-turbo',
      messages: this.formatMessages(systemPrompt, userPrompt),
      temperature: this.config.temperature ?? 0.1,
      max_tokens: this.config.maxTokens ?? 4096,
    };
  }

  /**
   * Format request for Gemini API
   */
  formatForGemini(
    systemPrompt: string,
    userPrompt: string,
  ): ProviderRequest {
    // Gemini uses a different format
    return {
      model: this.config.model ?? 'gemini-pro',
      messages: this.formatMessages(systemPrompt, userPrompt),
      temperature: this.config.temperature ?? 0.1,
      max_tokens: this.config.maxTokens ?? 4096,
    };
  }

  /**
   * Parse response from provider
   */
  parseResponse(provider: string, rawResponse: unknown): AgentResponse {
    switch (provider) {
      case 'claude':
        return this.parseClaudeResponse(rawResponse);
      case 'openai':
        return this.parseOpenAIResponse(rawResponse);
      case 'gemini':
        return this.parseGeminiResponse(rawResponse);
      default:
        return this.parseGenericResponse(rawResponse);
    }
  }

  /**
   * Parse Claude API response
   */
  private parseClaudeResponse(rawResponse: unknown): AgentResponse {
    const response = rawResponse as {
      content?: Array<{ text?: string }>;
      model?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
      stop_reason?: string | null;
    };

    return {
      content: response.content?.[0]?.text ?? '',
      tokensUsed: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
      model: response.model ?? 'claude-opus-4-5-20260506',
      finishReason: response.stop_reason ?? undefined,
    } as AgentResponse;
  }

  /**
   * Parse OpenAI API response
   */
  private parseOpenAIResponse(rawResponse: unknown): AgentResponse {
    const response = rawResponse as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string | null }>;
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      content: response.choices?.[0]?.message?.content ?? '',
      tokensUsed: (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0),
      model: response.model ?? 'gpt-4-turbo',
      finishReason: response.choices?.[0]?.finish_reason ?? undefined,
    } as AgentResponse;
  }

  /**
   * Parse Gemini API response
   */
  private parseGeminiResponse(rawResponse: unknown): AgentResponse {
    const response = rawResponse as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string | null }>;
      modelVersion?: string;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    return {
      content: response.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      tokensUsed: (response.usageMetadata?.promptTokenCount ?? 0) + (response.usageMetadata?.candidatesTokenCount ?? 0),
      model: response.modelVersion ?? 'gemini-pro',
      finishReason: response.candidates?.[0]?.finishReason ?? undefined,
    } as AgentResponse;
  }

  /**
   * Parse generic response format
   */
  private parseGenericResponse(rawResponse: unknown): AgentResponse {
    const response = rawResponse as {
      content?: string;
      model?: string;
      tokensUsed?: number;
      finishReason?: string | null;
    };

    return {
      content: response.content ?? '',
      tokensUsed: response.tokensUsed ?? 0,
      model: response.model ?? 'unknown',
      finishReason: response.finishReason ?? undefined,
    } as AgentResponse;
  }

  /**
   * Get fallback provider
   */
  getFallbackProvider(): string | null {
    switch (this.config.provider) {
      case 'claude':
        return 'openai';
      case 'openai':
        return 'claude';
      case 'gemini':
        return 'openai';
      default:
        return null;
    }
  }

  /**
   * Check if provider supports streaming
   */
  supportsStreaming(): boolean {
    return ['claude', 'openai', 'gemini'].includes(this.config.provider);
  }

  /**
   * Get provider-specific rate limits
   */
  getRateLimits(): { requestsPerMinute: number; tokensPerMinute: number } {
    switch (this.config.provider) {
      case 'claude':
        return { requestsPerMinute: 50, tokensPerMinute: 100000 };
      case 'openai':
        return { requestsPerMinute: 60, tokensPerMinute: 150000 };
      case 'gemini':
        return { requestsPerMinute: 60, tokensPerMinute: 100000 };
      default:
        return { requestsPerMinute: 30, tokensPerMinute: 50000 };
    }
  }
}

/**
 * Create provider adapter
 */
export function createProviderAdapter(config: AgentConfig): ProviderAdapter {
  return new ProviderAdapter(config);
}
