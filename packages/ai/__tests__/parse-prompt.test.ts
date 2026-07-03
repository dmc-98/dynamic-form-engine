/**
 * TDD test suite for parsePromptToSchema (S1 + S2).
 *
 * Tests were designed contract-first:
 *   S1 — AiProvider adapter: any object with complete() works; the function
 *        builds the prompt, calls the provider, parses the JSON response.
 *   S2 — Governance: every result has requiresUserReview:true; every field
 *        carries metadata.aiGenerated:true and a stable aiPromptHash.
 *
 * All tests use a mock provider — no real LLM calls are made.
 */

import { describe, it, expect, vi } from 'vitest'
import { parsePromptToSchema } from '../src/parse-prompt.js'
import type { AiProvider } from '../src/provider.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a mock provider that returns the given JSON payload. */
function mockProvider(payload: object): AiProvider {
  return { complete: vi.fn().mockResolvedValue(JSON.stringify(payload)) }
}

/** Minimal valid LLM response for a single-step, two-field form. */
const CONTACT_FORM_RESPONSE = {
  title: 'Contact Form',
  description: 'Collect name and email from visitors',
  steps: [{ id: 'main', title: 'Contact', fieldKeys: ['name', 'email'] }],
  fields: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
  ],
}

// ─── Error paths ──────────────────────────────────────────────────────────────

describe('parsePromptToSchema — error paths', () => {
  it('throws on empty string prompt', async () => {
    const provider = mockProvider({})
    await expect(parsePromptToSchema('', { provider })).rejects.toThrow(
      'prompt must be a non-empty string',
    )
    expect(provider.complete).not.toHaveBeenCalled()
  })

  it('throws on whitespace-only prompt', async () => {
    const provider = mockProvider({})
    await expect(parsePromptToSchema('   \n\t  ', { provider })).rejects.toThrow(
      'prompt must be a non-empty string',
    )
    expect(provider.complete).not.toHaveBeenCalled()
  })

  it('throws a descriptive error when the LLM returns plain text (non-JSON)', async () => {
    const provider: AiProvider = {
      complete: vi.fn().mockResolvedValue('Sure! Here is your form schema...'),
    }
    await expect(parsePromptToSchema('A contact form', { provider })).rejects.toThrow(
      'LLM returned non-JSON output',
    )
  })

  it('throws when the LLM returns an empty string', async () => {
    const provider: AiProvider = { complete: vi.fn().mockResolvedValue('') }
    await expect(parsePromptToSchema('A contact form', { provider })).rejects.toThrow()
  })

  it('strips markdown code fences and parses correctly', async () => {
    const fenced = `\`\`\`json\n${JSON.stringify(CONTACT_FORM_RESPONSE)}\n\`\`\``
    const provider: AiProvider = { complete: vi.fn().mockResolvedValue(fenced) }
    const result = await parsePromptToSchema('A contact form', { provider })
    expect(result.title).toBe('Contact Form')
    expect(result.fields).toHaveLength(2)
  })

  it('strips plain code fences (no language tag)', async () => {
    const fenced = `\`\`\`\n${JSON.stringify(CONTACT_FORM_RESPONSE)}\n\`\`\``
    const provider: AiProvider = { complete: vi.fn().mockResolvedValue(fenced) }
    const result = await parsePromptToSchema('A contact form', { provider })
    expect(result.title).toBe('Contact Form')
  })
})

// ─── S1: Provider adapter contract ───────────────────────────────────────────

describe('parsePromptToSchema — S1 provider adapter', () => {
  it('calls provider.complete() exactly once per invocation', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    await parsePromptToSchema('A contact form', { provider })
    expect(provider.complete).toHaveBeenCalledTimes(1)
  })

  it('passes the user prompt text to provider.complete()', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    await parsePromptToSchema('A job application form', { provider })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown]
    expect(promptArg).toContain('A job application form')
  })

  it('injects the system prompt via completionOptions.systemPrompt', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    await parsePromptToSchema('A contact form', { provider })
    const [, optionsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string, { systemPrompt?: string }]
    expect(optionsArg?.systemPrompt).toBeTruthy()
    expect(optionsArg?.systemPrompt).toContain('DFE')
  })

  it('sets temperature to 0 by default (deterministic generation)', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    await parsePromptToSchema('A form', { provider })
    const [, optionsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string, { temperature?: number }]
    expect(optionsArg?.temperature).toBe(0)
  })

  it('forwards caller completionOptions (maxTokens, temperature) to provider', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    await parsePromptToSchema('A form', {
      provider,
      completionOptions: { maxTokens: 512, temperature: 0.2 },
    })
    const [, optionsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string, { maxTokens?: number; temperature?: number }]
    expect(optionsArg?.maxTokens).toBe(512)
    expect(optionsArg?.temperature).toBe(0.2)
  })

  it('appends maxFields constraint to the prompt sent to provider', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    await parsePromptToSchema('A form', { provider, maxFields: 5 })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown]
    expect(promptArg).toContain('maxFields=5')
  })

  it('appends multiStep=true to the prompt when requested', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    await parsePromptToSchema('A form', { provider, multiStep: true })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown]
    expect(promptArg).toContain('multiStep=true')
  })

  it('appends extraInstructions when provided', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    await parsePromptToSchema('A form', {
      provider,
      extraInstructions: 'All labels must be in Spanish.',
    })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown]
    expect(promptArg).toContain('All labels must be in Spanish.')
  })

  it('returns the raw LLM output string for debugging', async () => {
    const raw = JSON.stringify(CONTACT_FORM_RESPONSE)
    const provider: AiProvider = { complete: vi.fn().mockResolvedValue(raw) }
    const result = await parsePromptToSchema('A form', { provider })
    expect(result.rawLlmOutput).toBe(raw)
  })
})

// ─── S2: Governance / consent metadata ───────────────────────────────────────

describe('parsePromptToSchema — S2 governance', () => {
  it('always returns requiresUserReview: true', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    const result = await parsePromptToSchema('A contact form', { provider })
    expect(result.requiresUserReview).toBe(true)
  })

  it('stamps metadata.aiGenerated: true on every returned field', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    const result = await parsePromptToSchema('A contact form', { provider })
    for (const field of result.fields) {
      expect((field as unknown as Record<string, Record<string, unknown>>).metadata?.aiGenerated).toBe(true)
    }
  })

  it('stamps metadata.aiPromptHash on every returned field', async () => {
    const provider = mockProvider(CONTACT_FORM_RESPONSE)
    const result = await parsePromptToSchema('A contact form', { provider })
    for (const field of result.fields) {
      const meta = (field as unknown as Record<string, Record<string, unknown>>).metadata
      expect(typeof meta?.aiPromptHash).toBe('string')
      expect((meta?.aiPromptHash as string).length).toBeGreaterThan(0)
    }
  })

  it('produces the same aiPromptHash for identical prompts', async () => {
    const prompt = 'A registration form with name and email'
    const r1 = await parsePromptToSchema(prompt, { provider: mockProvider(CONTACT_FORM_RESPONSE) })
    const r2 = await parsePromptToSchema(prompt, { provider: mockProvider(CONTACT_FORM_RESPONSE) })
    const hash1 = (r1.fields[0] as unknown as Record<string, Record<string, unknown>>).metadata?.aiPromptHash
    const hash2 = (r2.fields[0] as unknown as Record<string, Record<string, unknown>>).metadata?.aiPromptHash
    expect(hash1).toBe(hash2)
  })

  it('produces different aiPromptHash values for different prompts', async () => {
    const r1 = await parsePromptToSchema('A login form', { provider: mockProvider(CONTACT_FORM_RESPONSE) })
    const r2 = await parsePromptToSchema('A checkout form', { provider: mockProvider(CONTACT_FORM_RESPONSE) })
    const hash1 = (r1.fields[0] as unknown as Record<string, Record<string, unknown>>).metadata?.aiPromptHash
    const hash2 = (r2.fields[0] as unknown as Record<string, Record<string, unknown>>).metadata?.aiPromptHash
    expect(hash1).not.toBe(hash2)
  })

  it('preserves existing metadata from LLM output when stamping governance fields', async () => {
    const responseWithMeta = {
      ...CONTACT_FORM_RESPONSE,
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: false, metadata: { source: 'user' } },
      ],
    }
    const provider = mockProvider(responseWithMeta)
    const result = await parsePromptToSchema('A form', { provider })
    const meta = (result.fields[0] as unknown as Record<string, Record<string, unknown>>).metadata
    // Existing metadata preserved
    expect(meta?.source).toBe('user')
    // Governance stamps added
    expect(meta?.aiGenerated).toBe(true)
    expect(meta?.aiPromptHash).toBeTruthy()
  })
})

// ─── Shape / structure ────────────────────────────────────────────────────────

describe('parsePromptToSchema — result shape', () => {
  it('returns title from LLM response', async () => {
    const result = await parsePromptToSchema('A form', { provider: mockProvider(CONTACT_FORM_RESPONSE) })
    expect(result.title).toBe('Contact Form')
  })

  it('returns description from LLM response', async () => {
    const result = await parsePromptToSchema('A form', { provider: mockProvider(CONTACT_FORM_RESPONSE) })
    expect(result.description).toBe('Collect name and email from visitors')
  })

  it('returns steps from LLM when provided', async () => {
    const result = await parsePromptToSchema('A form', { provider: mockProvider(CONTACT_FORM_RESPONSE) })
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0].id).toBe('main')
    expect(result.steps[0].title).toBe('Contact')
  })

  it('auto-creates a single "main" step when LLM returns no steps array', async () => {
    const noSteps = { title: 'Login', description: '', fields: CONTACT_FORM_RESPONSE.fields }
    const result = await parsePromptToSchema('A form', { provider: mockProvider(noSteps) })
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0].id).toBe('main')
  })

  it('auto-created step references all field keys', async () => {
    const noSteps = {
      title: 'Form',
      description: '',
      fields: [
        { key: 'firstName', label: 'First Name', type: 'text', required: true },
        { key: 'lastName', label: 'Last Name', type: 'text', required: true },
      ],
    }
    const result = await parsePromptToSchema('A form', { provider: mockProvider(noSteps) })
    const autoStep = result.steps[0]
    // The auto step's fieldKeys should contain all field keys
    expect(autoStep.fieldKeys).toContain('firstName')
    expect(autoStep.fieldKeys).toContain('lastName')
  })

  it('returns an empty fields array when LLM provides no fields', async () => {
    const empty = { title: 'Empty', description: '', fields: [] }
    const result = await parsePromptToSchema('A form', { provider: mockProvider(empty) })
    expect(result.fields).toEqual([])
  })

  it('handles LLM response missing both title and description gracefully', async () => {
    const minimal = { fields: [{ key: 'q', label: 'Q', type: 'text', required: false }] }
    const result = await parsePromptToSchema('A form', { provider: mockProvider(minimal) })
    expect(typeof result.title).toBe('string')
    expect(typeof result.description).toBe('string')
  })
})
