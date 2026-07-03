/**
 * parsePromptToSchema — S1 core function.
 *
 * Takes a natural-language description and returns a DFE FormStep[] + FormField[]
 * config ready to pass to createFormEngine(). The LLM is injected via the
 * AiProvider interface so this function works with any model.
 *
 * Governance (S2):
 *   Every field in the result carries `aiGenerated: true` in its metadata.
 *   The caller / UI layer MUST surface a "Review AI-generated fields" step
 *   before treating the config as authoritative. The `requiresUserReview`
 *   flag on the result makes this obligation explicit.
 */

import type { FormField, FormStep } from '@dmc--98/dfe-core'
import type { AiProvider, AiCompletionOptions } from './provider.js'

// ─── Public types ─────────────────────────────────────────────────────────

export interface ParsePromptOptions {
  /** The LLM provider to use. */
  provider: AiProvider
  /**
   * Maximum number of fields to generate.
   * @default 20
   */
  maxFields?: number
  /**
   * Whether to produce a multi-step layout.
   * @default false
   */
  multiStep?: boolean
  /** Extra constraints appended to the system prompt. */
  extraInstructions?: string
  /** Forwarded to the provider's complete() call. */
  completionOptions?: AiCompletionOptions
}

export interface ParsePromptResult {
  /** Form title inferred from the prompt. */
  title: string
  /** Short description of what the form collects. */
  description: string
  /** DFE step configs (single-step forms have one entry). */
  steps: FormStep[]
  /** All field configs, with `metadata.aiGenerated = true` stamped on each. */
  fields: FormField[]
  /**
   * Always true — callers MUST present a review UX before persisting
   * AI-generated schemas. Part of the S2 consent/governance contract.
   */
  requiresUserReview: true
  /** The raw JSON string returned by the LLM, for debugging. */
  rawLlmOutput: string
}

// ─── System prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a DFE (Dynamic Form Engine) schema generator.
Given a natural-language form description, output ONLY valid JSON matching this shape:

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
  ]
}

Rules:
- Use camelCase field keys (e.g. "firstName", "emailAddress").
- Every field key referenced in steps[].fieldKeys must exist in fields[].
- Do NOT include any field that would collect sensitive data (SSN, credit-card numbers, raw passwords) unless the prompt explicitly asks for it and flags it as intentional.
- Default to required:false unless the prompt implies a field is mandatory.
- Return ONLY the JSON object — no markdown, no explanation, no code fences.`

// ─── Implementation ───────────────────────────────────────────────────────

/**
 * Parse a natural-language form description into a DFE field/step config.
 *
 * @example
 * ```ts
 * const result = await parsePromptToSchema(
 *   'A job application form collecting name, email, resume upload, and cover letter',
 *   { provider, maxFields: 10 }
 * )
 * // result.requiresUserReview === true — always show a review step in your UI
 * await saveFormDraft({ ...result, reviewedBy: currentUser.id })
 * ```
 */
export async function parsePromptToSchema(
  prompt: string,
  options: ParsePromptOptions,
): Promise<ParsePromptResult> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('parsePromptToSchema: prompt must be a non-empty string')
  }

  const { provider, maxFields = 20, multiStep = false, extraInstructions, completionOptions } = options

  const userPrompt = [
    prompt.trim(),
    `Constraints: maxFields=${maxFields}, multiStep=${multiStep}.`,
    extraInstructions ?? '',
  ]
    .filter(Boolean)
    .join('\n')

  const raw = await provider.complete(userPrompt, {
    ...completionOptions,
    systemPrompt: SYSTEM_PROMPT,
    temperature: completionOptions?.temperature ?? 0,
  })

  const parsed = parseJsonSafely(raw, prompt)

  // Stamp S2 governance metadata on every field
  const fields: FormField[] = (parsed.fields ?? []).map((f: FormField) => ({
    ...f,
    metadata: {
      ...(f as unknown as Record<string, unknown>).metadata,
      aiGenerated: true,
      aiPromptHash: hashPrompt(prompt),
    },
  }))

  const steps: FormStep[] = parsed.steps?.length
    ? parsed.steps
    : [{ id: 'main', title: parsed.title ?? 'Form', fieldKeys: fields.map((f) => f.key) }]

  return {
    title: String(parsed.title ?? ''),
    description: String(parsed.description ?? ''),
    steps,
    fields,
    requiresUserReview: true,
    rawLlmOutput: raw,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function parseJsonSafely(raw: string, originalPrompt: string): Record<string, unknown> {
  const trimmed = raw.trim()
  // Strip accidental markdown code fences if the model disobeys
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(stripped) as Record<string, unknown>
  } catch {
    throw new Error(
      `parsePromptToSchema: LLM returned non-JSON output.\n` +
        `Prompt (first 120 chars): ${originalPrompt.slice(0, 120)}\n` +
        `Raw output (first 500 chars): ${raw.slice(0, 500)}`,
    )
  }
}

/** Stable 8-char hash of a prompt string for audit tracing. */
function hashPrompt(prompt: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < prompt.length; i++) {
    h ^= prompt.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
