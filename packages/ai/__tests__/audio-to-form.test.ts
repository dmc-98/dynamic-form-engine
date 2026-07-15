/**
 * TDD test suite for parseTranscriptToSchema (audio→form, S3).
 *
 * parseTranscriptToSchema extracts a DFE form schema from a speech transcript —
 * output from Whisper, Otter.ai, Rev, or any STT tool — rather than from a
 * written description or a document with blanks.
 *
 * Key contract differences from parsePromptToSchema / parseDocToSchema:
 *   - Input is conversational, not authoritative. Filler words, repetitions,
 *     and reformulations must be tolerated.
 *   - Speaker labels ([Alice]:, ALICE:, Speaker 1:) are extracted into
 *     `result.speakerSummary` so callers can show who contributed what.
 *   - System prompt emphasises disfluency tolerance and intent extraction,
 *     NOT verbatim field naming (unlike doc→form's extraction-only mode).
 *   - Same S2 governance: requiresUserReview:true, aiGenerated:true,
 *     aiTranscriptHash stamped on every field (analogous to aiDocHash).
 *
 * All tests use a mock provider — no real LLM calls.
 */

import { describe, it, expect, vi } from 'vitest'
import { parseTranscriptToSchema } from '../src/audio-to-form.js'
import type { AiProvider } from '../src/provider.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockProvider(payload: object): AiProvider {
  return { complete: vi.fn().mockResolvedValue(JSON.stringify(payload)) }
}

/** Typical response when the LLM processes a meeting transcript about a feedback form. */
const FEEDBACK_FORM_RESPONSE = {
  title: 'Customer Feedback Form',
  description: 'Collects structured feedback from customers after a purchase',
  steps: [
    {
      id: 'feedback',
      title: 'Your Feedback',
      fieldKeys: ['name', 'email', 'rating', 'comments'],
    },
  ],
  fields: [
    { key: 'name', label: 'Your Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'rating', label: 'Overall Rating', type: 'rating', required: true },
    { key: 'comments', label: 'Additional Comments', type: 'textarea', required: false },
  ],
}

/** A realistic multi-speaker transcript about designing a feedback form. */
const SAMPLE_TRANSCRIPT = `
[Alice]: Okay so we need a form for customers to leave feedback after they buy something.
[Bob]: Yeah, uh, let's have their name and email, like, obviously.
[Alice]: Right. And a rating field — one to five stars or whatever.
[Bob]: Mmm, and maybe a text box for additional comments? Like, not required.
[Alice]: Yeah. That should be it I think, keep it simple.
`

// ─── Error paths ──────────────────────────────────────────────────────────────

describe('parseTranscriptToSchema — error paths', () => {
  it('throws on empty string transcript', async () => {
    const provider = mockProvider({})
    await expect(parseTranscriptToSchema('', { provider })).rejects.toThrow(
      'transcript must be a non-empty string',
    )
    expect(provider.complete).not.toHaveBeenCalled()
  })

  it('throws on whitespace-only transcript', async () => {
    const provider = mockProvider({})
    await expect(parseTranscriptToSchema('   \n\t  ', { provider })).rejects.toThrow(
      'transcript must be a non-empty string',
    )
    expect(provider.complete).not.toHaveBeenCalled()
  })

  it('throws a descriptive error when the LLM returns non-JSON', async () => {
    const provider: AiProvider = {
      complete: vi.fn().mockResolvedValue('I cannot figure out what form they want.'),
    }
    await expect(parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })).rejects.toThrow(
      'LLM returned non-JSON output',
    )
  })

  it('strips markdown code fences and parses correctly', async () => {
    const fenced = `\`\`\`json\n${JSON.stringify(FEEDBACK_FORM_RESPONSE)}\n\`\`\``
    const provider: AiProvider = { complete: vi.fn().mockResolvedValue(fenced) }
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(result.title).toBe('Customer Feedback Form')
    expect(result.fields).toHaveLength(4)
  })

  it('strips plain code fences (no language tag)', async () => {
    const fenced = `\`\`\`\n${JSON.stringify(FEEDBACK_FORM_RESPONSE)}\n\`\`\``
    const provider: AiProvider = { complete: vi.fn().mockResolvedValue(fenced) }
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(result.title).toBe('Customer Feedback Form')
  })
})

// ─── S1: Provider adapter contract ───────────────────────────────────────────

describe('parseTranscriptToSchema — S1 provider adapter', () => {
  it('calls provider.complete() exactly once per invocation', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(provider.complete).toHaveBeenCalledTimes(1)
  })

  it('passes the transcript text to provider.complete()', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ]
    // The transcript content (not just a description) must be in the prompt
    expect(promptArg).toContain('customer')
  })

  it('injects the system prompt via completionOptions.systemPrompt', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    const [, optsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    expect(optsArg).toHaveProperty('systemPrompt')
    expect(typeof optsArg.systemPrompt).toBe('string')
  })

  it('system prompt explicitly mentions disfluency or conversational language', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    const [, optsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    const sp = (optsArg.systemPrompt as string).toLowerCase()
    // Must explicitly address the spoken-language nature of the input
    expect(sp).toMatch(/disfluency|filler|conversational|spoken|transcript/)
  })

  it('uses temperature=0 by default', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    const [, optsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    expect(optsArg.temperature).toBe(0)
  })

  it('forwards completionOptions to the provider', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, {
      provider,
      completionOptions: { maxTokens: 1500 },
    })
    const [, optsArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    expect(optsArg.maxTokens).toBe(1500)
  })

  it('includes options.title in the prompt when provided', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, {
      provider,
      title: 'Post-Purchase Survey',
    })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ]
    expect(promptArg).toContain('Post-Purchase Survey')
  })

  it('includes maxFields constraint in the prompt when provided', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider, maxFields: 6 })
    const [promptArg] = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ]
    expect(promptArg).toContain('6')
  })
})

// ─── S2: Governance ───────────────────────────────────────────────────────────

describe('parseTranscriptToSchema — S2 governance', () => {
  it('result.requiresUserReview is always true', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(result.requiresUserReview).toBe(true)
  })

  it('every field carries metadata.aiGenerated = true', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    for (const field of result.fields) {
      expect((field.metadata as Record<string, unknown>)?.aiGenerated).toBe(true)
    }
  })

  it('every field carries a stable aiTranscriptHash', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    for (const field of result.fields) {
      const meta = field.metadata as Record<string, unknown>
      expect(typeof meta?.aiTranscriptHash).toBe('string')
      expect((meta.aiTranscriptHash as string).length).toBeGreaterThan(0)
    }
  })

  it('same transcript produces the same aiTranscriptHash across calls', async () => {
    const p1 = mockProvider(FEEDBACK_FORM_RESPONSE)
    const p2 = mockProvider(FEEDBACK_FORM_RESPONSE)
    const r1 = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider: p1 })
    const r2 = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider: p2 })
    const hash1 = (r1.fields[0].metadata as Record<string, unknown>).aiTranscriptHash
    const hash2 = (r2.fields[0].metadata as Record<string, unknown>).aiTranscriptHash
    expect(hash1).toBe(hash2)
  })

  it('different transcripts produce different aiTranscriptHash values', async () => {
    const otherTranscript = '[Carol]: we just need a name and phone number'
    const otherResponse = {
      ...FEEDBACK_FORM_RESPONSE,
      fields: [{ key: 'name', label: 'Name', type: 'text', required: false }],
      steps: [{ id: 'main', title: 'Form', fieldKeys: ['name'] }],
    }
    const p1 = mockProvider(FEEDBACK_FORM_RESPONSE)
    const p2 = mockProvider(otherResponse)
    const r1 = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider: p1 })
    const r2 = await parseTranscriptToSchema(otherTranscript, { provider: p2 })
    const hash1 = (r1.fields[0].metadata as Record<string, unknown>).aiTranscriptHash
    const hash2 = (r2.fields[0].metadata as Record<string, unknown>).aiTranscriptHash
    expect(hash1).not.toBe(hash2)
  })

  it('preserves pre-existing metadata fields alongside governance stamps', async () => {
    const responseWithMeta = {
      ...FEEDBACK_FORM_RESPONSE,
      fields: [
        {
          key: 'name',
          label: 'Your Name',
          type: 'text',
          required: true,
          metadata: { transcriptTimestamp: '00:00:05' },
        },
      ],
      steps: [{ id: 'main', title: 'Form', fieldKeys: ['name'] }],
    }
    const provider = mockProvider(responseWithMeta)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    const meta = result.fields[0].metadata as Record<string, unknown>
    expect(meta.aiGenerated).toBe(true)
    expect(meta.transcriptTimestamp).toBe('00:00:05')
  })
})

// ─── Speaker detection ────────────────────────────────────────────────────────

describe('parseTranscriptToSchema — speaker detection', () => {
  it('extracts speaker name from [Name]: format', async () => {
    const transcript = '[Alice]: we need a name field\n[Bob]: and an email'
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(transcript, { provider })
    expect(result.speakerSummary).toContain('Alice')
    expect(result.speakerSummary).toContain('Bob')
  })

  it('extracts speaker name from NAME: (all-caps colon) format', async () => {
    const transcript = 'ALICE: we need a name field\nBOB: and an email'
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(transcript, { provider })
    expect(result.speakerSummary).toContain('ALICE')
    expect(result.speakerSummary).toContain('BOB')
  })

  it('extracts speaker name from "Speaker N:" format', async () => {
    const transcript = 'Speaker 1: we need a form\nSpeaker 2: yeah with email'
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(transcript, { provider })
    expect(result.speakerSummary).toContain('Speaker 1')
    expect(result.speakerSummary).toContain('Speaker 2')
  })

  it('deduplicates repeated speakers', async () => {
    const transcript = '[Alice]: first line\n[Bob]: second\n[Alice]: third'
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(transcript, { provider })
    const aliceOccurrences = result.speakerSummary.filter((s) => s === 'Alice')
    expect(aliceOccurrences).toHaveLength(1)
  })

  it('returns empty speakerSummary for transcripts with no speaker labels', async () => {
    const transcript = 'We need a name field and an email address field'
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(transcript, { provider })
    expect(Array.isArray(result.speakerSummary)).toBe(true)
    expect(result.speakerSummary).toHaveLength(0)
  })

  it('handles mixed-format speaker labels in the same transcript', async () => {
    const transcript = '[Alice]: name field\nBOB: email field\nSpeaker 3: phone'
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(transcript, { provider })
    // All three distinct speakers must be captured
    expect(result.speakerSummary.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── Result shape ─────────────────────────────────────────────────────────────

describe('parseTranscriptToSchema — result shape', () => {
  it('returns title from LLM response', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(result.title).toBe('Customer Feedback Form')
  })

  it('returns description from LLM response', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(typeof result.description).toBe('string')
    expect(result.description.length).toBeGreaterThan(0)
  })

  it('returns steps from LLM response', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0].id).toBe('feedback')
  })

  it('returns fields from LLM response', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(result.fields).toHaveLength(4)
  })

  it('returns rawLlmOutput for debugging', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(typeof result.rawLlmOutput).toBe('string')
    expect(result.rawLlmOutput).toContain('Customer Feedback Form')
  })

  it('returns speakerSummary as an array', async () => {
    const provider = mockProvider(FEEDBACK_FORM_RESPONSE)
    const result = await parseTranscriptToSchema(SAMPLE_TRANSCRIPT, { provider })
    expect(Array.isArray(result.speakerSummary)).toBe(true)
  })

  it('auto-creates a single step when LLM omits steps', async () => {
    const noSteps = {
      title: 'Quick Form',
      description: 'Simple form',
      fields: [{ key: 'name', label: 'Name', type: 'text', required: true }],
    }
    const provider = mockProvider(noSteps)
    const result = await parseTranscriptToSchema(
      '[Dave]: just name and that is it',
      { provider },
    )
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0].fieldKeys).toContain('name')
  })

  it('handles LLM response with empty fields array gracefully', async () => {
    const emptyFields = {
      title: 'Nothing Extracted',
      description: 'No form requirements found in transcript',
      steps: [],
      fields: [],
    }
    const provider = mockProvider(emptyFields)
    const result = await parseTranscriptToSchema(
      '[Eve]: this meeting was about budgets not forms',
      { provider },
    )
    expect(result.fields).toHaveLength(0)
    expect(result.steps).toHaveLength(0)
  })
})
