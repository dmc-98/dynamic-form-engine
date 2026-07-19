/**
 * TDD tests for the `transcript_to_form` MCP tool handler.
 */

import { describe, it, expect, vi } from 'vitest'
import { handleTranscriptToForm, TRANSCRIPT_TO_FORM_TOOL } from '../src/tools/transcript-to-form.js'
import type { AiProvider } from '@dmc--98/dfe-ai'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function transcriptPayload(overrides?: Record<string, unknown>): string {
  return JSON.stringify({
    title: 'Onboarding Questionnaire',
    description: 'Extracted from onboarding meeting transcript.',
    steps: [{ id: 'main', title: 'Onboarding', fieldKeys: ['company', 'teamSize'] }],
    fields: [
      { key: 'company', label: 'Company Name', type: 'text', required: true },
      { key: 'teamSize', label: 'Team Size', type: 'number', required: false },
    ],
    speakerSummary: ['Alice', 'Bob'],
    ...overrides,
  })
}

function mockProvider(response: string): AiProvider {
  return { complete: vi.fn().mockResolvedValue(response) }
}

const SAMPLE_TRANSCRIPT = `[Alice]: So we need to collect the company name and uh, team size.
[Bob]: Right, and also the main use case, I think.
[Alice]: Yeah, definitely add that.`

// ─── Tool metadata ────────────────────────────────────────────────────────────

describe('TRANSCRIPT_TO_FORM_TOOL metadata', () => {
  it('has the expected name', () => {
    expect(TRANSCRIPT_TO_FORM_TOOL.name).toBe('transcript_to_form')
  })

  it('lists transcriptText as the only required property', () => {
    expect(TRANSCRIPT_TO_FORM_TOOL.inputSchema.required).toEqual(['transcriptText'])
  })
})

// ─── Handler — happy path ─────────────────────────────────────────────────────

describe('handleTranscriptToForm — happy path', () => {
  it('returns a text content block', async () => {
    const provider = mockProvider(transcriptPayload())
    const result = await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    expect(result.content[0].type).toBe('text')
  })

  it('content is valid JSON', async () => {
    const provider = mockProvider(transcriptPayload())
    const result = await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    expect(() => JSON.parse(result.content[0].text)).not.toThrow()
  })

  it('result includes requiresUserReview: true', async () => {
    const provider = mockProvider(transcriptPayload())
    const result = await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.requiresUserReview).toBe(true)
  })

  it('result includes speakerSummary array', async () => {
    const provider = mockProvider(transcriptPayload())
    const result = await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    const parsed = JSON.parse(result.content[0].text)
    expect(Array.isArray(parsed.speakerSummary)).toBe(true)
  })

  it('calls provider.complete exactly once', async () => {
    const provider = mockProvider(transcriptPayload())
    await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    expect(provider.complete).toHaveBeenCalledTimes(1)
  })

  it('includes transcript text in the provider call', async () => {
    const provider = mockProvider(transcriptPayload())
    await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    const [calledPrompt] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(calledPrompt).toContain('company name')
  })

  it('stamps aiGenerated: true on every extracted field', async () => {
    const provider = mockProvider(transcriptPayload())
    const result = await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    const parsed = JSON.parse(result.content[0].text)
    for (const field of parsed.fields) {
      expect(field.metadata?.aiGenerated).toBe(true)
    }
  })

  it('forwards maxFields to the provider call', async () => {
    const provider = mockProvider(transcriptPayload())
    await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT, maxFields: 7 }, provider)
    const [calledPrompt] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(calledPrompt).toContain('7')
  })
})

// ─── Handler — error paths ────────────────────────────────────────────────────

describe('handleTranscriptToForm — error paths', () => {
  it('returns isError:true on empty transcript', async () => {
    const provider = mockProvider(transcriptPayload())
    const result = await handleTranscriptToForm({ transcriptText: '' }, provider)
    expect(result.isError).toBe(true)
  })

  it('returns isError:true when provider throws', async () => {
    const provider: AiProvider = {
      complete: vi.fn().mockRejectedValue(new Error('Provider timeout')),
    }
    const result = await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Provider timeout')
  })

  it('returns isError:true when LLM returns non-JSON', async () => {
    const provider = mockProvider('Unable to process transcript.')
    const result = await handleTranscriptToForm({ transcriptText: SAMPLE_TRANSCRIPT }, provider)
    expect(result.isError).toBe(true)
  })
})
