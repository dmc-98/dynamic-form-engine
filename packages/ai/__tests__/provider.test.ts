/**
 * Tests for the built-in provider factory functions (S1 adapter stubs).
 *
 * These factories return lazy-loading AiProvider objects that call the
 * underlying SDK at runtime. We test the structural contract and the
 * error path (SDK not installed) rather than making real network calls.
 */

import { describe, it, expect } from 'vitest'
import { createOpenAiProvider, createAnthropicProvider } from '../src/provider.js'

describe('createOpenAiProvider', () => {
  it('returns an object that satisfies the AiProvider interface', () => {
    const provider = createOpenAiProvider({ apiKey: 'test-key' })
    expect(provider).toHaveProperty('complete')
    expect(typeof provider.complete).toBe('function')
  })

  it('accepts optional model and baseUrl options', () => {
    const provider = createOpenAiProvider({
      apiKey: 'key',
      model: 'gpt-4o',
      baseUrl: 'https://api.example.com/v1',
    })
    expect(provider).toHaveProperty('complete')
  })

  it('complete() rejects when the openai package is not installed', async () => {
    const provider = createOpenAiProvider({ apiKey: 'test-key' })
    // The dynamic import of 'openai' will fail in this test environment
    await expect(provider.complete('hello')).rejects.toThrow()
  })
})

describe('createAnthropicProvider', () => {
  it('returns an object that satisfies the AiProvider interface', () => {
    const provider = createAnthropicProvider({ apiKey: 'test-key' })
    expect(provider).toHaveProperty('complete')
    expect(typeof provider.complete).toBe('function')
  })

  it('accepts optional model option', () => {
    const provider = createAnthropicProvider({
      apiKey: 'key',
      model: 'claude-sonnet-5',
    })
    expect(provider).toHaveProperty('complete')
  })

  it('complete() rejects when the @anthropic-ai/sdk package is not installed', async () => {
    const provider = createAnthropicProvider({ apiKey: 'test-key' })
    await expect(provider.complete('hello')).rejects.toThrow()
  })
})
