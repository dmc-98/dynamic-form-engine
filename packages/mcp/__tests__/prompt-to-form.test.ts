/**
 * TDD tests for the `prompt_to_form` MCP tool handler.
 *
 * No MCP SDK required — tests exercise the handler function directly.
 * AiProvider is mocked so no real LLM calls are made.
 */

import { describe, it, expect, vi } from 'vitest'
import { handlePromptToForm, PROMPT_TO_FORM_TOOL } from '../src/tools/prompt-to-form.js'
import type { AiProvider } from '@dmc--98/dfe-ai'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal valid LLM response payload. */
function minimalPayload(overrides?: Record<string, unknown>): string {
  return JSON.stringify({
    title: 'Contact Form',
    description: 'Collects name and email.',
    steps: [{ id: 'main', title: 'Contact', fieldKeys: ['name', 'email'] }],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
    ],
    ...overrides,
  })
}

function mockProvider(response: string): AiProvider {
  return { complete: vi.fn().mockResolvedValue(response) }
}

// ─── Tool metadata ────────────────────────────────────────────────────────────

describe('PROMPT_TO_FORM_TOOL metadata', () => {
  it('has the expected name', () => {
    expect(PROMPT_TO_FORM_TOOL.name).toBe('prompt_to_form')
  })

  it('lists prompt as the only required property', () => {
    expect(PROMPT_TO_FORM_TOOL.inputSchema.required).toEqual(['prompt'])
  })

  it('describes optional maxFields, multiStep, extraInstructions', () => {
    const props = Object.keys(PROMPT_TO_FORM_TOOL.inputSchema.properties)
    expect(props).toContain('maxFields')
    expect(props).toContain('multiStep')
    expect(props).toContain('extraInstructions')
  })
})

// ─── Handler — happy path ─────────────────────────────────────────────────────

describe('handlePromptToForm — happy path', () => {
  it('returns a text content block', async () => {
    const provider = mockProvider(minimalPayload())
    const result = await handlePromptToForm({ prompt: 'A contact form' }, provider)
    expect(result.content).toHaveLength(1)
    expect(result.content[0].type).toBe('text')
  })

  it('content is valid JSON', async () => {
    const provider = mockProvider(minimalPayload())
    const result = await handlePromptToForm({ prompt: 'A contact form' }, provider)
    expect(() => JSON.parse(result.content[0].text)).not.toThrow()
  })

  it('result includes requiresUserReview: true', async () => {
    const provider = mockProvider(minimalPayload())
    const result = await handlePromptToForm({ prompt: 'A contact form' }, provider)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.requiresUserReview).toBe(true)
  })

  it('result includes title, description, steps, fields', async () => {
    const provider = mockProvider(minimalPayload())
    const result = await handlePromptToForm({ prompt: 'A contact form' }, provider)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed).toHaveProperty('title')
    expect(parsed).toHaveProperty('description')
    expect(parsed).toHaveProperty('steps')
    expect(parsed).toHaveProperty('fields')
  })

  it('calls provider.complete exactly once', async () => {
    const provider = mockProvider(minimalPayload())
    await handlePromptToForm({ prompt: 'A contact form' }, provider)
    expect(provider.complete).toHaveBeenCalledTimes(1)
  })

  it('includes the prompt text in the provider call', async () => {
    const provider = mockProvider(minimalPayload())
    await handlePromptToForm({ prompt: 'A registration form' }, provider)
    const [calledPrompt] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(calledPrompt).toContain('A registration form')
  })

  it('stamps aiGenerated: true on every field', async () => {
    const provider = mockProvider(minimalPayload())
    const result = await handlePromptToForm({ prompt: 'A form' }, provider)
    const parsed = JSON.parse(result.content[0].text)
    for (const field of parsed.fields) {
      expect(field.metadata?.aiGenerated).toBe(true)
    }
  })

  it('does not set isError', async () => {
    const provider = mockProvider(minimalPayload())
    const result = await handlePromptToForm({ prompt: 'A form' }, provider)
    expect(result.isError).toBeFalsy()
  })
})

// ─── Handler — option forwarding ──────────────────────────────────────────────

describe('handlePromptToForm — option forwarding', () => {
  it('appends maxFields constraint to the prompt', async () => {
    const provider = mockProvider(minimalPayload())
    await handlePromptToForm({ prompt: 'A form', maxFields: 5 }, provider)
    const [calledPrompt] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(calledPrompt).toContain('maxFields=5')
  })

  it('appends multiStep constraint to the prompt', async () => {
    const provider = mockProvider(minimalPayload())
    await handlePromptToForm({ prompt: 'A form', multiStep: true }, provider)
    const [calledPrompt] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(calledPrompt).toContain('multiStep=true')
  })

  it('appends extraInstructions to the prompt', async () => {
    const provider = mockProvider(minimalPayload())
    await handlePromptToForm(
      { prompt: 'A form', extraInstructions: 'All fields in Spanish' },
      provider,
    )
    const [calledPrompt] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(calledPrompt).toContain('All fields in Spanish')
  })
})

// ─── Handler — error paths ────────────────────────────────────────────────────

describe('handlePromptToForm — error paths', () => {
  it('returns isError:true on empty prompt', async () => {
    const provider = mockProvider(minimalPayload())
    const result = await handlePromptToForm({ prompt: '' }, provider)
    expect(result.isError).toBe(true)
  })

  it('returns isError:true when provider throws', async () => {
    const provider: AiProvider = {
      complete: vi.fn().mockRejectedValue(new Error('LLM unavailable')),
    }
    const result = await handlePromptToForm({ prompt: 'A form' }, provider)
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('LLM unavailable')
  })

  it('returns isError:true when LLM returns non-JSON', async () => {
    const provider = mockProvider('Sorry, I cannot help with that.')
    const result = await handlePromptToForm({ prompt: 'A form' }, provider)
    expect(result.isError).toBe(true)
  })
})
