/**
 * parseDocToSchema — doc→form substrate (Week 7-8 DFE deliverable).
 *
 * Extracts form fields from an EXISTING document — a paper-form scan,
 * a markdown template, an intake questionnaire, a PDF with blanks — rather
 * than generating fields from a natural-language description.
 *
 * Key difference from parsePromptToSchema:
 *   - The document IS the form; the LLM must EXTRACT what's already there.
 *   - Sections with no extractable fields land in `unmappedSections` for
 *     the caller to surface or discard in their review UI.
 *   - Same S2 governance contract: requiresUserReview:true, aiGenerated:true,
 *     aiDocHash stamped on every field.
 */

import type { FormField, FormStep } from '@dmc--98/dfe-core'
import type { AiProvider, AiCompletionOptions } from './provider.js'

// ─── Public types ─────────────────────────────────────────────────────────────

export type DocumentType = 'plain-text' | 'markdown' | 'html-stripped' | 'pdf-extracted'

export interface ParseDocOptions {
  /** The LLM provider to use. */
  provider: AiProvider
  /**
   * Original filename or title of the document.
   * If provided, it is appended to the prompt as a title hint so the LLM
   * can produce a more descriptive form title.
   */
  title?: string
  /**
   * Hint about the document's origin format.
   * Included in the prompt so the LLM can adjust its parsing strategy
   * (e.g. PDF-extracted text often has stray line-breaks).
   * @default 'plain-text'
   */
  documentType?: DocumentType
  /**
   * Maximum number of fields to extract.
   * Appended to the prompt as a hard cap.
   * @default 30
   */
  maxFields?: number
  /** Forwarded to the provider's complete() call. */
  completionOptions?: AiCompletionOptions
}

export interface ParseDocResult {
  /** Form title inferred from the document (or options.title if provided). */
  title: string
  /** Short description of what the form collects. */
  description: string
  /** DFE step configs (one per logical section in the document). */
  steps: FormStep[]
  /** Extracted field configs, with S2 governance stamps on each. */
  fields: FormField[]
  /**
   * Always true — callers MUST surface a review UX before persisting
   * AI-extracted schemas. Part of the S2 consent/governance contract.
   */
  requiresUserReview: true
  /**
   * Document sections (headers, paragraphs, page labels) that contained
   * no extractable form fields. Useful for surfacing "we skipped this part"
   * in a review UI.
   */
  unmappedSections: string[]
  /** The raw JSON string returned by the LLM, for debugging. */
  rawLlmOutput: string
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a DFE (Dynamic Form Engine) schema extractor.
Given the text of a form document, extract and identify the existing form fields.
Do NOT invent fields that aren't in the document. Do NOT add fields the document doesn't ask for.

Output ONLY valid JSON matching this shape:

{
  "title": "string — infer from document heading or document type",
  "description": "string — one sentence describing what the form collects",
  "steps": [
    {
      "id": "string (kebab-case, derived from section heading)",
      "title": "string (section heading from the document)",
      "fieldKeys": ["string", ...]
    }
  ],
  "fields": [
    {
      "key": "string (camelCase, derived from field label)",
      "label": "string (exact label text from the document)",
      "type": "text|email|number|select|radio|checkbox|date|textarea|file|phone|url|rating",
      "required": boolean (true if the document marks it required, false otherwise),
      "placeholder": "string (omit if not present in document)",
      "helpText": "string (omit if not present in document)",
      "options": [{"value": "string", "label": "string"}] (only for select/radio/checkbox with listed options)
    }
  ],
  "unmappedSections": ["string"] — sections of the document with no extractable fields (headers, instructions, disclaimers, page numbers, etc.)
}

Extraction rules:
- A blank line (___), a box ([ ]), or a colon-followed-by-space are all field indicators.
- Use camelCase keys derived from the label (e.g. "First Name" -> "firstName").
- If a section has only instructions with no blanks, add its heading to unmappedSections.
- For select/radio: include options only if they are explicitly listed in the document.
- Default required to false unless the document explicitly marks mandatory fields (*, required, etc.).
- Return ONLY the JSON object — no markdown, no explanation, no code fences.`

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Extract a DFE form schema from an existing document's text.
 *
 * @example
 * \`\`\`ts
 * import { parseDocToSchema, createOpenAiProvider } from '@dmc--98/dfe-ai'
 * import { readFileSync } from 'fs'
 *
 * const provider = createOpenAiProvider({ apiKey: process.env.OPENAI_API_KEY! })
 * const text = readFileSync('intake-form.txt', 'utf8')
 * const schema = await parseDocToSchema(text, {
 *   provider,
 *   title: 'Patient Intake Form',
 *   documentType: 'plain-text',
 * })
 * // schema.requiresUserReview === true — always show review UI
 * // schema.unmappedSections — show the user what was skipped
 * \`\`\`
 */
export async function parseDocToSchema(
  documentText: string,
  options: ParseDocOptions,
): Promise<ParseDocResult> {
  if (!documentText || documentText.trim().length === 0) {
    throw new Error('parseDocToSchema: document must be a non-empty string')
  }

  const {
    provider,
    title,
    documentType = 'plain-text',
    maxFields = 30,
    completionOptions,
  } = options

  const userPrompt = buildUserPrompt(documentText, { title, documentType, maxFields })

  const raw = await provider.complete(userPrompt, {
    ...completionOptions,
    systemPrompt: SYSTEM_PROMPT,
    temperature: completionOptions?.temperature ?? 0,
  })

  const parsed = parseJsonSafely(raw)
  const docHash = hashDoc(documentText)

  // Stamp S2 governance metadata on every extracted field
  const fields: FormField[] = (parsed.fields ?? []).map((f: FormField) => ({
    ...f,
    metadata: {
      ...(f as unknown as Record<string, unknown>).metadata,
      aiGenerated: true,
      aiDocHash: docHash,
    },
  }))

  const steps: FormStep[] = parsed.steps?.length
    ? parsed.steps
    : fields.length > 0
      ? [{ id: 'main', title: parsed.title ?? 'Form', fieldKeys: fields.map((f) => f.key) }]
      : []

  const unmappedSections: string[] = Array.isArray(parsed.unmappedSections)
    ? (parsed.unmappedSections as string[]).filter((s) => typeof s === 'string')
    : []

  return {
    title: String(parsed.title ?? ''),
    description: String(parsed.description ?? ''),
    steps,
    fields,
    requiresUserReview: true,
    unmappedSections,
    rawLlmOutput: raw,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(
  documentText: string,
  opts: { title?: string; documentType: DocumentType; maxFields: number },
): string {
  const parts: string[] = []
  if (opts.title) {
    parts.push(`Document title: ${opts.title}`)
  }
  parts.push(`Document type: ${opts.documentType}`)
  parts.push(`Constraint: extract at most ${opts.maxFields} fields.`)
  parts.push('')
  parts.push('--- DOCUMENT START ---')
  parts.push(documentText.trim())
  parts.push('--- DOCUMENT END ---')
  return parts.join('\n')
}

function parseJsonSafely(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(stripped) as Record<string, unknown>
  } catch {
    throw new Error(
      `parseDocToSchema: LLM returned non-JSON output.\n` +
        `Raw output (first 500 chars): ${raw.slice(0, 500)}`,
    )
  }
}

/**
 * Stable 8-char FNV-1a hash of the document text for audit tracing.
 * Same algorithm as hashPrompt() in parse-prompt.ts.
 */
function hashDoc(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
