/**
 * parseTranscriptToSchema — audio→form substrate (S3).
 *
 * Extracts a DFE form schema from a speech transcript — output from Whisper,
 * Otter.ai, Rev, or any speech-to-text tool — rather than from a written
 * description (parsePromptToSchema) or a structured document (parseDocToSchema).
 *
 * Key differences from the other two substrates:
 *   - Input is CONVERSATIONAL: filler words (um, uh, like), repetitions,
 *     mid-sentence corrections, and multiple speakers are all expected.
 *   - Speaker labels are extracted client-side into `speakerSummary` so
 *     callers can surface who contributed which requirements.
 *   - The LLM is instructed to infer INTENT from spoken language, not to
 *     copy verbatim field labels from the transcript.
 *   - Same S2 governance contract as the other substrates:
 *       requiresUserReview: true, metadata.aiGenerated: true,
 *       metadata.aiTranscriptHash stamped on every extracted field.
 */

import type { FormField, FormStep } from '@dmc--98/dfe-core'
import type { AiProvider, AiCompletionOptions } from './provider.js'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParseTranscriptOptions {
  /** The LLM provider to use. */
  provider: AiProvider
  /**
   * Optional title hint for the resulting form.
   * If provided it is appended to the prompt so the LLM can produce a more
   * descriptive title rather than inferring one from the transcript alone.
   */
  title?: string
  /**
   * Maximum number of fields to extract.
   * Appended to the prompt as a hard cap.
   * @default 20
   */
  maxFields?: number
  /** Forwarded to the provider's complete() call. */
  completionOptions?: AiCompletionOptions
}

export interface ParseTranscriptResult {
  /** Form title inferred from the transcript (or options.title if provided). */
  title: string
  /** Short description of what the form will collect. */
  description: string
  /** DFE step configs (one per logical group of requirements in the transcript). */
  steps: FormStep[]
  /** Extracted field configs with S2 governance stamps on each. */
  fields: FormField[]
  /**
   * Always true — callers MUST surface a review UX before persisting
   * AI-extracted schemas. Part of the S2 consent/governance contract.
   */
  requiresUserReview: true
  /**
   * Unique speaker names/labels detected in the transcript, in order of
   * first appearance. Supports formats:
   *   [Name]:    — bracketed name (Whisper, Otter default)
   *   NAME:      — all-caps label (some STT tools)
   *   Speaker N: — numbered speaker (diarised output)
   *
   * Empty when the transcript has no speaker labels.
   */
  speakerSummary: string[]
  /** The raw JSON string returned by the LLM, for debugging. */
  rawLlmOutput: string
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a DFE (Dynamic Form Engine) schema extractor specialised in spoken transcripts.

You will receive the text of a speech transcript — output from a speech-to-text tool like
Whisper or Otter. The transcript may contain:
  - Filler words and disfluency (um, uh, like, you know, I mean)
  - Speaker labels such as [Alice]:, ALICE:, or Speaker 1:
  - Repetitions, mid-sentence corrections, and off-topic tangents
  - Timestamps or other STT artefacts

Your job is to infer the INTENT of what the speakers want the form to collect, extract the
form fields they describe, and output a DFE schema. Ignore filler words. Do NOT invent fields
that the speakers did not discuss. For conversational field descriptions, choose clean, concise
labels (e.g. "we need their email" → label "Email Address", type "email").

Output ONLY valid JSON matching this shape:

{
  "title": "string — infer from what speakers say the form is for",
  "description": "string — one sentence describing the form's purpose",
  "steps": [
    {
      "id": "string (kebab-case)",
      "title": "string",
      "fieldKeys": ["string", ...]
    }
  ],
  "fields": [
    {
      "key": "string (camelCase, derived from the field's intent)",
      "label": "string (clean, professional label for the field)",
      "type": "text|email|number|select|radio|checkbox|date|textarea|file|phone|url|rating",
      "required": boolean (true if speakers said it's mandatory, false otherwise),
      "placeholder": "string (omit unless speakers described sample input)",
      "helpText": "string (omit unless speakers added guidance about the field)",
      "options": [{"value": "string", "label": "string"}] (only for select/radio/checkbox with explicitly listed choices)
    }
  ]
}

Rules:
- Transcript disfluency tolerance: ignore "uh", "um", "like", "you know", "I mean", repetitions.
- Speaker labels in [Name]:, NAME:, Speaker N: format are metadata — do not include them in field labels.
- Use camelCase field keys (e.g. "name", "emailAddress", "overallRating").
- Every field key in steps[].fieldKeys must also appear in fields[].
- Default required to false unless the transcript explicitly says a field is mandatory.
- Prefer a single step unless speakers clearly discuss distinct sections or pages.
- Return ONLY the JSON object — no markdown, no explanation, no code fences.`

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Extract a DFE form schema from a speech transcript.
 *
 * @example
 * ```ts
 * import { parseTranscriptToSchema, createOpenAiProvider } from '@dmc--98/dfe-ai'
 * import { readFileSync } from 'fs'
 *
 * const provider = createOpenAiProvider({ apiKey: process.env.OPENAI_API_KEY! })
 * const transcript = readFileSync('design-meeting.txt', 'utf8')
 * const schema = await parseTranscriptToSchema(transcript, {
 *   provider,
 *   title: 'Customer Feedback Form',
 * })
 * // schema.requiresUserReview === true — always show review UI
 * // schema.speakerSummary — ['Alice', 'Bob'] who contributed
 * ```
 */
export async function parseTranscriptToSchema(
  transcript: string,
  options: ParseTranscriptOptions,
): Promise<ParseTranscriptResult> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('parseTranscriptToSchema: transcript must be a non-empty string')
  }

  const { provider, title, maxFields = 20, completionOptions } = options

  const speakers = extractSpeakers(transcript)
  const transcriptHash = hashTranscript(transcript)

  const userPrompt = buildUserPrompt(transcript, { title, maxFields })

  const raw = await provider.complete(userPrompt, {
    ...completionOptions,
    systemPrompt: SYSTEM_PROMPT,
    temperature: completionOptions?.temperature ?? 0,
  })

  const parsed = parseJsonSafely(raw)

  // Stamp S2 governance metadata on every extracted field
  const fields: FormField[] = (parsed.fields ?? []).map((f: FormField) => ({
    ...f,
    metadata: {
      ...(f as unknown as Record<string, unknown>).metadata,
      aiGenerated: true,
      aiTranscriptHash: transcriptHash,
    },
  }))

  const steps: FormStep[] = parsed.steps?.length
    ? parsed.steps
    : fields.length > 0
      ? [{ id: 'main', title: parsed.title ?? 'Form', fieldKeys: fields.map((f) => f.key) }]
      : []

  return {
    title: String(parsed.title ?? ''),
    description: String(parsed.description ?? ''),
    steps,
    fields,
    requiresUserReview: true,
    speakerSummary: speakers,
    rawLlmOutput: raw,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(
  transcript: string,
  opts: { title?: string; maxFields: number },
): string {
  const parts: string[] = []
  if (opts.title) {
    parts.push(`Form title hint: ${opts.title}`)
  }
  parts.push(`Constraint: extract at most ${opts.maxFields} fields.`)
  parts.push('')
  parts.push('--- TRANSCRIPT START ---')
  parts.push(transcript.trim())
  parts.push('--- TRANSCRIPT END ---')
  return parts.join('\n')
}

function parseJsonSafely(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(stripped) as Record<string, unknown>
  } catch {
    throw new Error(
      `parseTranscriptToSchema: LLM returned non-JSON output.\n` +
        `Raw output (first 500 chars): ${raw.slice(0, 500)}`,
    )
  }
}

/**
 * Extract unique speaker labels from a transcript in order of first appearance.
 * Supports three formats:
 *   [Name]:    — bracketed name (Whisper, Otter)
 *   NAME:      — all-caps token immediately followed by colon (some STT tools)
 *   Speaker N: — numbered speaker (diarised output from various tools)
 */
function extractSpeakers(transcript: string): string[] {
  const seen = new Set<string>()
  const speakers: string[] = []

  // Pattern 1: [Name]: — any word characters inside brackets followed by colon
  const bracketPattern = /\[([^\]]+)\]:/g
  let match: RegExpExecArray | null
  while ((match = bracketPattern.exec(transcript)) !== null) {
    const speaker = match[1].trim()
    if (!seen.has(speaker)) {
      seen.add(speaker)
      speakers.push(speaker)
    }
  }

  // Pattern 2: "Speaker N:" — diarised label (case-insensitive)
  const speakerNPattern = /\b(Speaker\s+\d+):/gi
  while ((match = speakerNPattern.exec(transcript)) !== null) {
    const speaker = match[1].trim()
    if (!seen.has(speaker)) {
      seen.add(speaker)
      speakers.push(speaker)
    }
  }

  // Pattern 3: ALL_CAPS: at the start of a line (e.g. ALICE:, BOB:)
  // Must be ≥2 chars, only letters/underscores (avoids matching single-letter
  // abbreviations or timestamps like "1:00"), at line start or after newline.
  const allCapsPattern = /(?:^|\n)([A-Z][A-Z_]{1,30}):/g
  while ((match = allCapsPattern.exec(transcript)) !== null) {
    const speaker = match[1].trim()
    // Skip if already captured (bracket format takes precedence)
    if (!seen.has(speaker)) {
      seen.add(speaker)
      speakers.push(speaker)
    }
  }

  return speakers
}

/**
 * Stable 8-char FNV-1a hash of the transcript text for audit tracing.
 * Same algorithm as hashDoc() in doc-to-form.ts.
 */
function hashTranscript(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
