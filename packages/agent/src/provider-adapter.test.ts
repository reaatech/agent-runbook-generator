import { ProviderAdapter, createProviderAdapter } from '@reaatech/agent-runbook-agent';
import type { AgentConfig } from '@reaatech/agent-runbook-agent';
import { describe, expect, it } from 'vitest';

const mockConfig: AgentConfig = {
  provider: 'claude',
  model: 'claude-opus-4-5-20260506',
  temperature: 0.2,
  maxTokens: 2048,
};

describe('ProviderAdapter', () => {
  describe('formatMessages', () => {
    it('returns system and user messages', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const messages = adapter.formatMessages('system prompt', 'user prompt');
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({ role: 'system', content: 'system prompt' });
      expect(messages[1]).toEqual({ role: 'user', content: 'user prompt' });
    });
  });

  describe('formatForClaude', () => {
    it('formats a request with Claude defaults', () => {
      const adapter = new ProviderAdapter({ provider: 'claude' });
      const req = adapter.formatForClaude('sys', 'usr');
      expect(req.model).toBe('claude-opus-4-5-20260506');
      expect(req.messages).toHaveLength(2);
      expect(req.temperature).toBe(0.1);
      expect(req.max_tokens).toBe(4096);
    });

    it('uses config overrides for model and tokens', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const req = adapter.formatForClaude('sys', 'usr');
      expect(req.model).toBe('claude-opus-4-5-20260506');
      expect(req.temperature).toBe(0.2);
      expect(req.max_tokens).toBe(2048);
    });
  });

  describe('formatForOpenAI', () => {
    it('formats a request with OpenAI defaults', () => {
      const adapter = new ProviderAdapter({ provider: 'openai' });
      const req = adapter.formatForOpenAI('sys', 'usr');
      expect(req.model).toBe('gpt-4-turbo');
      expect(req.messages).toHaveLength(2);
    });

    it('uses config model when provided', () => {
      const adapter = new ProviderAdapter({ provider: 'openai', model: 'gpt-4o' });
      const req = adapter.formatForOpenAI('sys', 'usr');
      expect(req.model).toBe('gpt-4o');
    });
  });

  describe('formatForGemini', () => {
    it('formats a request with Gemini defaults', () => {
      const adapter = new ProviderAdapter({ provider: 'gemini' });
      const req = adapter.formatForGemini('sys', 'usr');
      expect(req.model).toBe('gemini-pro');
      expect(req.messages).toHaveLength(2);
    });
  });

  describe('parseResponse', () => {
    it('parses Claude response', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const result = adapter.parseResponse('claude', {
        content: [{ text: 'Hello from Claude' }],
        model: 'claude-opus-4-5-20260506',
        usage: { input_tokens: 10, output_tokens: 5 },
        stop_reason: 'end_turn',
      });
      expect(result.content).toBe('Hello from Claude');
      expect(result.tokensUsed).toBe(15);
      expect(result.model).toBe('claude-opus-4-5-20260506');
      expect(result.finishReason).toBe('end_turn');
    });

    it('parses Claude response with missing fields', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const result = adapter.parseResponse('claude', {});
      expect(result.content).toBe('');
      expect(result.tokensUsed).toBe(0);
    });

    it('parses OpenAI response', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const result = adapter.parseResponse('openai', {
        choices: [{ message: { content: 'Hello from OpenAI' }, finish_reason: 'stop' }],
        model: 'gpt-4-turbo',
        usage: { prompt_tokens: 8, completion_tokens: 4 },
      });
      expect(result.content).toBe('Hello from OpenAI');
      expect(result.tokensUsed).toBe(12);
      expect(result.model).toBe('gpt-4-turbo');
      expect(result.finishReason).toBe('stop');
    });

    it('parses OpenAI response with missing fields', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const result = adapter.parseResponse('openai', {});
      expect(result.content).toBe('');
      expect(result.tokensUsed).toBe(0);
    });

    it('parses Gemini response', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const result = adapter.parseResponse('gemini', {
        candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] }, finishReason: 'stop' }],
        modelVersion: 'gemini-pro',
        usageMetadata: { promptTokenCount: 6, candidatesTokenCount: 3 },
      });
      expect(result.content).toBe('Hello from Gemini');
      expect(result.tokensUsed).toBe(9);
      expect(result.model).toBe('gemini-pro');
      expect(result.finishReason).toBe('stop');
    });

    it('parses Gemini response with missing fields', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const result = adapter.parseResponse('gemini', {});
      expect(result.content).toBe('');
      expect(result.tokensUsed).toBe(0);
    });

    it('parses generic response for unknown provider', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const result = adapter.parseResponse('mock', {
        content: 'mock response',
        model: 'mock-model',
        tokensUsed: 42,
        finishReason: 'stop',
      });
      expect(result.content).toBe('mock response');
      expect(result.tokensUsed).toBe(42);
      expect(result.model).toBe('mock-model');
    });

    it('parses generic response with missing fields', () => {
      const adapter = new ProviderAdapter(mockConfig);
      const result = adapter.parseResponse('unknown', {});
      expect(result.content).toBe('');
      expect(result.tokensUsed).toBe(0);
      expect(result.model).toBe('unknown');
    });
  });

  describe('getFallbackProvider', () => {
    it('returns openai for claude', () => {
      const adapter = new ProviderAdapter({ provider: 'claude' });
      expect(adapter.getFallbackProvider()).toBe('openai');
    });

    it('returns claude for openai', () => {
      const adapter = new ProviderAdapter({ provider: 'openai' });
      expect(adapter.getFallbackProvider()).toBe('claude');
    });

    it('returns openai for gemini', () => {
      const adapter = new ProviderAdapter({ provider: 'gemini' });
      expect(adapter.getFallbackProvider()).toBe('openai');
    });

    it('returns null for mock provider', () => {
      const adapter = new ProviderAdapter({ provider: 'mock' });
      expect(adapter.getFallbackProvider()).toBeNull();
    });
  });

  describe('supportsStreaming', () => {
    it('returns true for claude', () => {
      const adapter = new ProviderAdapter({ provider: 'claude' });
      expect(adapter.supportsStreaming()).toBe(true);
    });

    it('returns true for openai', () => {
      const adapter = new ProviderAdapter({ provider: 'openai' });
      expect(adapter.supportsStreaming()).toBe(true);
    });

    it('returns true for gemini', () => {
      const adapter = new ProviderAdapter({ provider: 'gemini' });
      expect(adapter.supportsStreaming()).toBe(true);
    });

    it('returns false for mock', () => {
      const adapter = new ProviderAdapter({ provider: 'mock' });
      expect(adapter.supportsStreaming()).toBe(false);
    });
  });

  describe('getRateLimits', () => {
    it('returns claude rate limits', () => {
      const adapter = new ProviderAdapter({ provider: 'claude' });
      const limits = adapter.getRateLimits();
      expect(limits.requestsPerMinute).toBe(50);
      expect(limits.tokensPerMinute).toBe(100000);
    });

    it('returns openai rate limits', () => {
      const adapter = new ProviderAdapter({ provider: 'openai' });
      const limits = adapter.getRateLimits();
      expect(limits.requestsPerMinute).toBe(60);
      expect(limits.tokensPerMinute).toBe(150000);
    });

    it('returns gemini rate limits', () => {
      const adapter = new ProviderAdapter({ provider: 'gemini' });
      const limits = adapter.getRateLimits();
      expect(limits.requestsPerMinute).toBe(60);
      expect(limits.tokensPerMinute).toBe(100000);
    });

    it('returns default rate limits for unknown provider', () => {
      const adapter = new ProviderAdapter({ provider: 'mock' });
      const limits = adapter.getRateLimits();
      expect(limits.requestsPerMinute).toBe(30);
      expect(limits.tokensPerMinute).toBe(50000);
    });
  });
});

describe('createProviderAdapter', () => {
  it('creates a ProviderAdapter instance', () => {
    const adapter = createProviderAdapter({ provider: 'claude' });
    expect(adapter).toBeInstanceOf(ProviderAdapter);
  });

  it('passes config through', () => {
    const adapter = createProviderAdapter(mockConfig);
    const limits = adapter.getRateLimits();
    expect(limits.requestsPerMinute).toBe(50);
  });
});
