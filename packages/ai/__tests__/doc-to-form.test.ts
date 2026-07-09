/**
 * TDD test suite for parseDocToSchema (doc→form, Week 7-8).
 *
 * parseDocToSchema extracts form fields from an EXISTING document —
 * a paper form scan, a markdown template, an intake questionnaire —
 * rather than generating fields from a description.
 *
 * Contract:
 *   - Same S2 governance as parsePromptToSchema: requiresUserReview:true,
 *     aiGenerated:true, aiDocHash on every field.
 *   - result.unmappedSections: doc sections that had no extractable fields.
 *   - System prompt tells LLM to EXTRACT, not invent.
 *   - options.title used as form title hint (falls back to LLM inference).
 *
 * All tests use a mock provider — no real LLM calls.
 */

import { describe, it, expect, vi } from 'vitest'
import { parseDocToSchema } from '../src/doc-to-form.js'
import type { AiProvider } from '../src/provider.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockProvider(payload: object): AiProvider {
  return { complete: vi.fn().mockResolvedValue(JSON.stringify(payload)) }
}

/** Typical LLM response when extracting a simple intake form document. */
const INTAKE_FORM_RESPONSE = {
  title: 'Patient Intake Form',
  description: 'Extracts patient demographic fields from the intake questionnaire',
  steps: [
    {
      id: 'personal',
      title: 'Personal Details',
      fieldKeys: ['firstName', 'lastName', 'dateOfBirth', 'phone'],
    },
    {
      id: 'address',
      title: 'Address',
      fieldKeys: ['streetAddress', 'city', 'state', 'zipCode'],
    },
  ],
  fields: [
    { key: 'firstName', label: 'First Name', type: 'text', required: true },
    { key: 'lastName', label: 'Last Name', type: 'text', required: true },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
    { key: 'phone', label: 'Phone Number', type: 'phone', required: false },
    { key: 'streetAddress', label: 'Street Address', type: 'text', required: false },
    { key: 'city', label: 'City', type: 'text', required: false },
    { key: 'state', label: 'State', type: 'select', required: false, options: [] },
    { key: 'zipCode', label: 'ZIP Code', type: 'text', required: false },
  ],
  unmappedSections: ['Page header: Community Health Clinic — Confidential'],
}

const SAMPLE_DOCUMENT = `
# Patient Intake Form
Community Health Clinic — Confidential

## Personal Details
First Name: ____________  Last Name: ____________
Date of Birth: ____________  Phone: ____________

## Address
Street Address: ____________________________________________
City: ____________  State: ____  ZIP: ____________
`

// ─── Error paths ──────────────────────────────────────────────────────────────

describe('parseDocToSchema — error paths', () => {
  it('throws on empty string document', async () => {
    const provider = mockProvider({})
    await expect(parseDocToSchema('', { provider })).rejects.toThrow(
      'document must be a non-empty string',
    )
    expect(provider.complete).not.toHaveBeenCalled()
  })

  it('throws on whitespace-only document', async () => {
    const provider = mockProvider({})
    await expect(parseDocToSchema('   \n\t  ', { provider })).rejects.toThrow(
      'document must be a non-empty string',
    )
    expect(provider.complete).not.toHaveBeenCalled()
  })

  it('throws a descriptive error when the LLM returns non-JSON', async () => {
    const provider: AiProvider = {
      complete: vi.fn().mockResolvedValue('I cannot extract any form fields from this document.'),
    }
    await expect(parseDocToSchema(SAMPLE_DOCUMENT, { provider })).rejects.toThrow(
      'LLM returned non-JSON output',
    )
  })

  it('strips markdown code fences and parses correctly', async () => {
    const fenced = `\`\`\`json\n${JSON.stringify(INTAKE_FORM_RESPONSE)}\n\`\`\``
    const provider: AiProvider = { complete: vi.fn().mockResolvedValue(fenced) }
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(result.title).toBe('Patient Intake Form')
    expect(result.fields).toHaveLength(8)
  })

  it('strips plain code fences (no language tag)', async () => {
    const fenced = `\`\`\`\n${JSON.stringify(INTAKE_FORM_RESPONSE)}\n\`\`\``
    const provider: AiProvider = { complete: vi.fn().mockResolvedValue(fenced) }
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(result.title).toBe('Patient Intake Form')
  })
})

// ─── S1: Provider adapter contract ───────────────────────────────────────────

describe('parseDocToSchema — S1 provider adapter', () => {
  it('calls provider.complete() exactly once per invocation', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(provider.complete).toHaveBeenCalledTimes(1)
  })

  it('passes the document text to provider.complete()', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ]
    expect(promptArg).toContain('Patient Intake Form')
  })

  it('injects the system prompt via completionOptions.systemPrompt', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    const [, optsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    expect(optsArg).toHaveProperty('systemPrompt')
    expect(typeof optsArg.systemPrompt).toBe('string')
  })

  it('system prompt instructs EXTRACTION, not generation', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    const [, optsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    const systemPrompt = optsArg.systemPrompt as string
    // Must mention extracting / identifying existing fields
    expect(systemPrompt.toLowerCase()).toMatch(/extract|identify/)
  })

  it('uses temperature=0 by default', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    const [, optsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    expect(optsArg.temperature).toBe(0)
  })

  it('forwards completionOptions to the provider', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, {
      provider,
      completionOptions: { maxTokens: 2000 },
    })
    const [, optsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    expect(optsArg.maxTokens).toBe(2000)
  })

  it('includes options.title in the prompt when provided', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, {
      provider,
      title: 'Acme Corp Employee Intake',
    })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ]
    expect(promptArg).toContain('Acme Corp Employee Intake')
  })

  it('includes documentType hint in the prompt when provided', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, {
      provider,
      documentType: 'pdf-extracted',
    })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ]
    expect(promptArg.toLowerCase()).toContain('pdf')
  })
})

// ─── S2: Governance ───────────────────────────────────────────────────────────

describe('parseDocToSchema — S2 governance', () => {
  it('result.requiresUserReview is always true', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(result.requiresUserReview).toBe(true)
  })

  it('every field carries metadata.aiGenerated = true', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    for (const field of result.fields) {
      expect((field.metadata as Record<string, unknown>)?.aiGenerated).toBe(true)
    }
  })

  it('every field carries a stable aiDocHash', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    for (const field of result.fields) {
      const meta = field.metadata as Record<string, unknown>
      expect(typeof meta?.aiDocHash).toBe('string')
      expect((meta.aiDocHash as string).length).toBeGreaterThan(0)
    }
  })

  it('same document produces same aiDocHash across calls', async () => {
    const p1 = mockProvider(INTAKE_FORM_RESPONSE)
    const p2 = mockProvider(INTAKE_FORM_RESPONSE)
    const r1 = await parseDocToSchema(SAMPLE_DOCUMENT, { provider: p1 })
    const r2 = await parseDocToSchema(SAMPLE_DOCUMENT, { provider: p2 })
    const hash1 = (r1.fields[0].metadata as Record<string, unknown>).aiDocHash
    const hash2 = (r2.fields[0].metadata as Record<string, unknown>).aiDocHash
    expect(hash1).toBe(hash2)
  })

  it('different documents produce different aiDocHash values', async () => {
    const otherDoc = 'Name: ___ Company: ___ Role: ___'
    const otherResponse = {
      ...INTAKE_FORM_RESPONSE,
      fields: [{ key: 'name', label: 'Name', type: 'text', required: false }],
      steps: [{ id: 'main', title: 'Form', fieldKeys: ['name'] }],
    }
    const p1 = mockProvider(INTAKE_FORM_RESPONSE)
    const p2 = mockProvider(otherResponse)
    const r1 = await parseDocToSchema(SAMPLE_DOCUMENT, { provider: p1 })
    const r2 = await parseDocToSchema(otherDoc, { provider: p2 })
    const hash1 = (r1.fields[0].metadata as Record<string, unknown>).aiDocHash
    const hash2 = (r2.fields[0].metadata as Record<string, unknown>).aiDocHash
    expect(hash1).not.toBe(hash2)
  })

  it('preserves existing metadata fields alongside governance stamps', async () => {
    const responseWithMeta = {
      ...INTAKE_FORM_RESPONSE,
      fields: [
        {
          key: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
          metadata: { sourcePageNumber: 1 },
        },
      ],
      steps: [{ id: 'main', title: 'Form', fieldKeys: ['firstName'] }],
    }
    const provider = mockProvider(responseWithMeta)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    const meta = result.fields[0].metadata as Record<string, unknown>
    expect(meta.aiGenerated).toBe(true)
    expect(meta.sourcePageNumber).toBe(1)
  })
})

// ─── Result shape ─────────────────────────────────────────────────────────────

describe('parseDocToSchema — result shape', () => {
  it('returns title from LLM response', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(result.title).toBe('Patient Intake Form')
  })

  it('returns description from LLM response', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(result.description).toContain('demographic')
  })

  it('returns steps from LLM response', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(result.steps).toHaveLength(2)
    expect(result.steps[0].id).toBe('personal')
  })

  it('returns fields from LLM response', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(result.fields).toHaveLength(8)
    expect(result.fields[0].key).toBe('firstName')
  })

  it('returns rawLlmOutput for debugging', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(typeof result.rawLlmOutput).toBe('string')
    expect(result.rawLlmOutput).toContain('Patient Intake Form')
  })

  it('returns unmappedSections array (may be empty)', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(Array.isArray(result.unmappedSections)).toBe(true)
    expect(result.unmappedSections).toContain('Page header: Community Health Clinic — Confidential')
  })

  it('returns empty unmappedSections array when LLM omits the key', async () => {
    const responseWithoutUnmapped = { ...INTAKE_FORM_RESPONSE }
    delete (responseWithoutUnmapped as Record<string, unknown>).unmappedSections
    const provider = mockProvider(responseWithoutUnmapped)
    const result = await parseDocToSchema(SAMPLE_DOCUMENT, { provider })
    expect(Array.isArray(result.unmappedSections)).toBe(true)
    expect(result.unmappedSections).toHaveLength(0)
  })

  it('auto-creates a single step when LLM omits steps', async () => {
    const noSteps = {
      title: 'Simple Form',
      description: 'A form',
      fields: [{ key: 'name', label: 'Name', type: 'text', required: true }],
    }
    const provider = mockProvider(noSteps)
    const result = await parseDocToSchema('Name: ___', { provider })
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0].fieldKeys).toContain('name')
  })

  it('handles LLM response with empty fields array gracefully', async () => {
    const emptyFields = {
      title: 'No Fields Found',
      description: 'Document had no extractable form fields',
      steps: [],
      fields: [],
      unmappedSections: ['The entire document'],
    }
    const provider = mockProvider(emptyFields)
    const result = await parseDocToSchema('This is a plain article with no form fields.', {
      provider,
    })
    expect(result.fields).toHaveLength(0)
    expect(result.steps).toHaveLength(0)
    expect(result.unmappedSections).toHaveLength(1)
  })

  it('maxFields option is appended to the prompt', async () => {
    const provider = mockProvider(INTAKE_FORM_RESPONSE)
    await parseDocToSchema(SAMPLE_DOCUMENT, { provider, maxFields: 5 })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ]
    expect(promptArg).toContain('5')
  })
})
