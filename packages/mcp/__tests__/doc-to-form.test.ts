/**
 * TDD tests for the `doc_to_form` MCP tool handler.
 */

import { describe, it, expect, vi } from 'vitest'
import { handleDocToForm, DOC_TO_FORM_TOOL } from '../src/tools/doc-to-form.js'
import type { AiProvider } from '@dmc--98/dfe-ai'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docPayload(overrides?: Record<string, unknown>): string {
  return JSON.stringify({
    title: 'Patient Intake Form',
    description: 'Extracts patient details.',
    steps: [{ id: 'main', title: 'Patient', fieldKeys: ['fullName', 'dob'] }],
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
    ],
    unmappedSections: ['Page header', 'Footer disclaimer'],
    ...overrides,
  })
}

function mockProvider(response: string): AiProvider {
  return { complete: vi.fn().mockResolvedValue(response) }
}

const SAMPLE_DOC = `Patient Intake Form
Full Name: _______________
Date of Birth: ___/___/______
`

// ─── Tool metadata ────────────────────────────────────────────────────────────

describe('DOC_TO_FORM_TOOL metadata', () => {
  it('has the expected name', () => {
    expect(DOC_TO_FORM_TOOL.name).toBe('doc_to_form')
  })

  it('lists documentText as the only required property', () => {
    expect(DOC_TO_FORM_TOOL.inputSchema.required).toEqual(['documentText'])
  })
})

// ─── Handler — happy path ─────────────────────────────────────────────────────

describe('handleDocToForm — happy path', () => {
  it('returns a text content block', async () => {
    const provider = mockProvider(docPayload())
    const result = await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    expect(result.content[0].type).toBe('text')
  })

  it('content is valid JSON', async () => {
    const provider = mockProvider(docPayload())
    const result = await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    expect(() => JSON.parse(result.content[0].text)).not.toThrow()
  })

  it('result includes requiresUserReview: true', async () => {
    const provider = mockProvider(docPayload())
    const result = await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.requiresUserReview).toBe(true)
  })

  it('result includes unmappedSections array', async () => {
    const provider = mockProvider(docPayload())
    const result = await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    const parsed = JSON.parse(result.content[0].text)
    expect(Array.isArray(parsed.unmappedSections)).toBe(true)
  })

  it('calls provider.complete exactly once', async () => {
    const provider = mockProvider(docPayload())
    await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    expect(provider.complete).toHaveBeenCalledTimes(1)
  })

  it('includes the document text in the provider call', async () => {
    const provider = mockProvider(docPayload())
    await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    const [calledPrompt] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(calledPrompt).toContain('Patient Intake Form')
  })

  it('stamps aiGenerated: true on every extracted field', async () => {
    const provider = mockProvider(docPayload())
    const result = await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    const parsed = JSON.parse(result.content[0].text)
    for (const field of parsed.fields) {
      expect(field.metadata?.aiGenerated).toBe(true)
    }
  })

  it('forwards documentType to provider call prompt', async () => {
    const provider = mockProvider(docPayload())
    await handleDocToForm({ documentText: SAMPLE_DOC, documentType: 'markdown' }, provider)
    const [calledPrompt] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(calledPrompt).toContain('markdown')
  })
})

// ─── Handler — error paths ────────────────────────────────────────────────────

describe('handleDocToForm — error paths', () => {
  it('returns isError:true on empty document', async () => {
    const provider = mockProvider(docPayload())
    const result = await handleDocToForm({ documentText: '' }, provider)
    expect(result.isError).toBe(true)
  })

  it('returns isError:true when provider throws', async () => {
    const provider: AiProvider = {
      complete: vi.fn().mockRejectedValue(new Error('Rate limit exceeded')),
    }
    const result = await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Rate limit exceeded')
  })

  it('returns isError:true when LLM returns non-JSON', async () => {
    const provider = mockProvider('I cannot extract fields from this document.')
    const result = await handleDocToForm({ documentText: SAMPLE_DOC }, provider)
    expect(result.isError).toBe(true)
  })
})
