/**
 * parseDocToSchema — doc→form (Week 7-8).
 *
 * Extracts form fields from an EXISTING document — a paper form scan
 * (already OCR'd to text), a markdown template, an intake questionnaire —
 * rather than generating fields from a natural-language description
 * (see parsePromptToSchema for the generative counterpart).
 *
 * Governance (S2):
 *   Same contract as parsePromptToSchema. Every field carries
 *   `metadata.aiGenerated: true` + a stable `aiDocHash`, and the result
 *   carries `requiresUserReview: true`. Callers MUST surface a review step
 *   before persisting the extracted schema — this function never asserts
 *   the extraction is correct, only that it is a starting draft.
 */

import type { FormField, FormStep } from '@dmc--98/dfe-core'
import type { AiProvider, AiCompletionOptions } from './provider.js'

// ─── Public types ─────────────────────────────────────────────────────────

export interface ParseDocOptions {
  /** The LLM provider to use. */
  provider: AiProvider
  /** Form title hint. Falls back to LLM inference when omitted. */
  title?: string
  /** Hint about the document's origin, e.g. "pdf-extracted", "markdown", "ocr-scan". */
  documentType?: string
  /**
   * Maximum number of fields to extract.
   * @default 40
   */
  maxFields?: number
  /** Extra constraints appended to the system prompt. */
  extraInstructions?: string
  /** Forwarded to the provider's complete() call. */
  completionOptions?: AiCompletionOptions
}

export interface ParseDocResult {
  /** Form title — from options.title, LLM inference, or empty string. */
  title: string
  /** Short description of what the form collects. */
  description: string
  /** DFE step configs (single-step forms have one entry). */
  steps: FormStep[]
  /** All field configs, with `metadata.aiGenerated = true` stamped on each. */
  fields: FormField[]
  /** Document sections the LLM could not map to an extractable field. */
  unmappedSections: string[]
  /**
   * Always true — callers MUST present a review UX before persisting
   * AI-extracted schemas. Part of the S2 consent/governance contract.
   */
  requiresUserReview: true
  /** The raw text returned by the LLM, for debugging. */
  rawLlmOutput: string
}

// ─── System prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a DFE (Dynamic Form Engine) document-to-schema extractor.
Given the text of an EXISTING document (a paper form scan, a markdown template, an intake
questionnaire), your job is to EXTRACT and IDENTIFY the fields that document already asks
for. Do NOT invent fields the document does not contain. Output ONLY valid JSON matching
this shape:

{
  "title": "string",
  "description": "string",
  "steps": [
    {
      "id": "string (kebab-case)",
      "title": "string",
      "fieldKeys": ["string", ...]
    }
  ],
  "fields": [
    {
      "key": "string (camelCase)",
      "label": "string",
      "type": "text|email|number|select|radio|checkbox|date|textarea|file|phone|url|rating",
      "required": boolean,
      "placeholder": "string or omit",
      "helpText": "string or omit",
      "options": [{"value": "string", "label": "string"}] (only for select/radio/checkbox)
    }
  ],
  "unmappedSections": ["string, ..."]
}

Rules:
- Use camelCase field keys derived from the document's own labels (e.g. "firstName" for "First Name:").
- Every field key referenced in steps[].fieldKeys must exist in fields[].
- unmappedSections lists any document sections (headers, disclaimers, instructions) that
  contain no extractable field — never drop this information silently.
- Do NOT include any field that would collect sensitive data (SSN, credit-card numbers, raw
  passwords) unless the document explicitly asks for it and flags it as intentional.
- Return ONLY the JSON object — no markdown, no explanation, no code fences.`

// ─── Implementation ───────────────────────────────────────────────────────

/**
 * Extract a DFE field/step config from the text of an existing document.
 *
 * @example
 * ```ts
 * const result = await parseDocToSchema(ocrText, { provider, documentType: 'ocr-scan' })
 * // result.requiresUserReview === true — always show a review step in your UI
 * // result.unmappedSections — surface these so nothing silently disappears
 * await saveFormDraft({ ...result, reviewedBy: currentUser.id })
 * ```
 */
export async function parseDocToSchema(
  document: string,
  options: ParseDocOptions,
): Promise<ParseDocResult> {
  if (!document || document.trim().length === 0) {
    throw new Error('parseDocToSchema: document must be a non-empty string')
  }

  const { provider, title, documentType, maxFields = 40, extraInstructions, completionOptions } = options

  const userPrompt = [
    title ? `Title hint: ${title}` : '',
    documentType ? `Document type: ${documentType}` : '',
    `Constraints: maxFields=${maxFields}.`,
    extraInstructions ?? '',
    '--- DOCUMENT START ---',
    document.trim(),
    '--- DOCUMENT END ---',
  ]
    .filter(Boolean)
    .join('\n')

  const raw = await provider.complete(userPrompt, {
    ...completionOptions,
    systemPrompt: SYSTEM_PROMPT,
    temperature: completionOptions?.temperature ?? 0,
  })

  const parsed = parseJsonSafely(raw, document)

  // Stamp S2 governance metadata on every field
  const fields: FormField[] = (parsed.fields ?? []).map((f: FormField) => ({
    ...f,
    metadata: {
      ...(f as unknown as Record<string, unknown>).metadata,
      aiGenerated: true,
      aiDocHash: hashDoc(document),
    },
  }))

  const steps: FormStep[] = parsed.steps !== undefined
    ? parsed.steps
    : [{ id: 'main', title: parsed.title ?? title ?? 'Form', fieldKeys: fields.map((f) => f.key) }]

  return {
    title: String(parsed.title ?? title ?? ''),
    description: String(parsed.description ?? ''),
    steps,
    fields,
    unmappedSections: Array.isArray(parsed.unmappedSections) ? (parsed.unmappedSections as string[]) : [],
    requiresUserReview: true,
    rawLlmOutput: raw,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function parseJsonSafely(raw: string, originalDocument: string): {
  title?: string
  description?: string
  steps?: FormStep[]
  fields?: FormField[]
  unmappedSections?: string[]
} {
  const trimmed = raw.trim()
  // Strip accidental markdown code fences if the model disobeys
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(stripped) as {
      title?: string
      description?: string
      steps?: FormStep[]
      fields?: FormField[]
      unmappedSections?: string[]
    }
  } catch {
    throw new Error(
      `parseDocToSchema: LLM returned non-JSON output.\n` +
        `Document (first 120 chars): ${originalDocument.slice(0, 120)}\n` +
        `Raw output (first 500 chars): ${raw.slice(0, 500)}`,
    )
  }
}

/** Stable 8-char hash of a document string for audit tracing. */
function hashDoc(document: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < document.length; i++) {
    h ^= document.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
