import type { FormField, FormStep } from '../types'
import { generateFormFromDescription, buildLlmPrompt, type GeneratedFormConfig } from './form-generator'
import { suggestAdditionalFields, type FieldSuggestion } from './field-suggester'
import { diffFormConfig, summarizeFormConfigDiff } from '../config-diff'
import { suggestConfigRepairs, type RepairResult } from '../config-repair'

// ─── AI Form Builder ─────────────────────────────────────────────────────────
// A provider-agnostic, review-first authoring layer over the existing AI
// helpers. The builder NEVER calls a vendor directly: callers inject a provider
// (any function that turns a prompt into text). When no provider is supplied,
// the builder falls back to the deterministic heuristic generator so it works
// offline and in tests.

/** A pluggable text-completion provider. Bring your own LLM. */
export type AiProvider = (prompt: string) => Promise<string>

export interface AiFormBuilderOptions {
  /** Optional LLM provider. When omitted, deterministic heuristics are used. */
  provider?: AiProvider
  /** Cap on generated fields (passed through to the heuristic generator). */
  maxFields?: number
}

export interface FormConfig {
  fields: FormField[]
  steps?: FormStep[]
  title?: string
  description?: string
}

export interface GenerateResult {
  config: FormConfig
  /** Field suggestions the builder thinks are still worth adding. */
  suggestions: FieldSuggestion[]
  /** Static-analysis findings for the generated config. */
  repair: RepairResult
  /** True when an injected provider produced this config. */
  usedProvider: boolean
}

export interface RefineResult {
  config: FormConfig
  /** Human-readable summary of what changed versus the input config. */
  changes: string
  repair: RepairResult
  usedProvider: boolean
}

export interface AiFormBuilder {
  generate: (description: string) => Promise<GenerateResult>
  refine: (current: FormConfig, instruction: string) => Promise<RefineResult>
}

function toFormConfig(generated: GeneratedFormConfig): FormConfig {
  return {
    fields: generated.fields,
    steps: generated.steps,
    title: generated.title,
    description: generated.description,
  }
}

/** Extract the first balanced `{...}` object substring, ignoring braces inside strings. */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) {
    return null
  }
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }
  return null
}

/**
 * Safely parse a provider's response into a GeneratedFormConfig-shaped object.
 * Tolerates fenced code blocks and surrounding prose. Returns null when the
 * text does not contain usable JSON with a `fields` array.
 */
function parseProviderConfig(text: string): FormConfig | null {
  const candidates: string[] = []
  const trimmed = text.trim()
  candidates.push(trimmed)

  // Content inside the first ``` ... ``` fence (with optional language tag).
  const fence = trimmed.match(/```(?:[a-zA-Z]+)?\s*([\s\S]*?)```/)
  if (fence && fence[1]) {
    candidates.push(fence[1].trim())
  }

  // First balanced JSON object anywhere in the text.
  const obj = extractFirstJsonObject(trimmed)
  if (obj) {
    candidates.push(obj)
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && Array.isArray(parsed.fields)) {
        return parsed as FormConfig
      }
    } catch {
      // try the next candidate
    }
  }
  return null
}

/**
 * Create a provider-agnostic, review-first AI form builder.
 *
 * The builder generates and refines DFE form configurations. It produces normal,
 * inspectable config objects — it never auto-publishes or runs anything. When a
 * provider is supplied it is used (with a safe fallback to heuristics on bad
 * output); when not, deterministic heuristics drive generation so the API works
 * offline and is fully testable.
 *
 * @example
 * ```ts
 * const builder = createAiFormBuilder({ provider: myLlmProvider })
 * const { config } = await builder.generate('A 3-step loan application...')
 * const refined = await builder.refine(config, 'Make the address step optional.')
 * console.log(refined.changes)
 * ```
 */
export function createAiFormBuilder(options: AiFormBuilderOptions = {}): AiFormBuilder {
  const { provider, maxFields } = options

  async function generate(description: string): Promise<GenerateResult> {
    let config: FormConfig | null = null
    let usedProvider = false

    if (provider) {
      const response = await provider(buildLlmPrompt(description))
      const parsed = parseProviderConfig(response)
      if (parsed) {
        config = parsed
        usedProvider = true
      }
    }

    if (!config) {
      // Deterministic fallback — always produces a valid config.
      config = toFormConfig(generateFormFromDescription({ description, maxFields, includeSteps: true }))
    }

    const suggestions = suggestAdditionalFields(config.fields)
    const repair = suggestConfigRepairs({ fields: config.fields, steps: config.steps })

    return { config, suggestions, repair, usedProvider }
  }

  async function refine(current: FormConfig, instruction: string): Promise<RefineResult> {
    let nextConfig: FormConfig = current
    let usedProvider = false

    if (provider) {
      const prompt = [
        'You are refining an existing DFE form configuration.',
        'Current configuration (JSON):',
        JSON.stringify({ fields: current.fields, steps: current.steps ?? [] }),
        '',
        `Instruction: ${instruction}`,
        '',
        'Return the full updated configuration as a JSON object with a "fields" array (and "steps" if multi-step).',
      ].join('\n')
      const response = await provider(prompt)
      const parsed = parseProviderConfig(response)
      if (parsed) {
        nextConfig = parsed
        usedProvider = true
      }
    }

    const diff = diffFormConfig(
      { fields: current.fields, steps: current.steps },
      { fields: nextConfig.fields, steps: nextConfig.steps },
    )
    const repair = suggestConfigRepairs({ fields: nextConfig.fields, steps: nextConfig.steps })

    return {
      config: nextConfig,
      changes: usedProvider ? summarizeFormConfigDiff(diff) : 'No changes (no AI provider configured for refinement).',
      repair,
      usedProvider,
    }
  }

  return { generate, refine }
}
