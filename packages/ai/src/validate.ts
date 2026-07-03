/**
 * Validation spine (S1+S2) — normalizes raw AI output into proper DFE
 * FormField / FormStep objects and validates the structure.
 *
 * The LLM uses simplified lowercase type aliases; DFE core uses uppercase
 * FieldType values with a required config object. This module bridges the gap.
 *
 * Workflow:
 *   1. parsePromptToSchema() → raw AI fields (loose shape, lowercase types)
 *   2. validateAiOutput()    → check structure, surface problems to users
 *   3. normalizeAiFields()   → produce proper FormField[] ready for:
 *      - generateZodSchema() from @dmc--98/dfe-core   (runtime validation)
 *      - createFormEngine()  from @dmc--98/dfe-core   (form engine)
 *      - createFormVersion() for persistence
 *
 * @module validate
 */

import type { FormField, FormStep } from '@dmc--98/dfe-core'

// ─── Type alias map ───────────────────────────────────────────────────────────

/**
 * Maps the simplified type aliases used in AI prompts to the canonical DFE
 * FieldType values stored in the database.
 */
export const AI_TYPE_TO_DFE_TYPE: Record<string, string> = {
  text: 'SHORT_TEXT',
  textarea: 'LONG_TEXT',
  email: 'EMAIL',
  phone: 'PHONE',
  number: 'NUMBER',
  url: 'URL',
  date: 'DATE',
  select: 'SELECT',
  radio: 'RADIO',
  checkbox: 'CHECKBOX',
  file: 'FILE_UPLOAD',
  rating: 'RATING',
  // Pass-through for callers who use canonical values directly
  SHORT_TEXT: 'SHORT_TEXT',
  LONG_TEXT: 'LONG_TEXT',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  NUMBER: 'NUMBER',
  URL: 'URL',
  DATE: 'DATE',
  SELECT: 'SELECT',
  RADIO: 'RADIO',
  CHECKBOX: 'CHECKBOX',
  FILE_UPLOAD: 'FILE_UPLOAD',
  RATING: 'RATING',
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationIssue {
  /** Path to the problem, e.g. "fields[2].type" */
  path: string
  /** Human-readable description of the problem */
  message: string
  /** "error" blocks use; "warning" is advisory */
  severity: 'error' | 'warning'
}

export interface AiOutputValidationResult {
  ok: boolean
  issues: ValidationIssue[]
}

/** The raw shape returned by the LLM (before normalization). */
export interface RawAiField {
  key?: unknown
  label?: unknown
  type?: unknown
  required?: unknown
  placeholder?: unknown
  helpText?: unknown
  options?: unknown
  metadata?: unknown
}

export interface RawAiOutput {
  title?: unknown
  description?: unknown
  steps?: unknown
  fields?: unknown
}

const KNOWN_AI_TYPES = new Set(Object.keys(AI_TYPE_TO_DFE_TYPE))

/**
 * Validate the raw JSON object returned by the LLM.
 *
 * Returns an `ok` flag and a list of issues. Errors block use;
 * warnings are advisory and the output can still be normalized.
 *
 * @example
 * ```ts
 * const { rawLlmOutput } = await parsePromptToSchema(prompt, { provider })
 * const raw = JSON.parse(rawLlmOutput)
 * const { ok, issues } = validateAiOutput(raw)
 * if (!ok) showErrorsToUser(issues.filter(i => i.severity === 'error'))
 * ```
 */
export function validateAiOutput(raw: RawAiOutput): AiOutputValidationResult {
  const issues: ValidationIssue[] = []

  // Top-level shape
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      issues: [{ path: '', message: 'Output must be a JSON object', severity: 'error' }],
    }
  }

  if (!raw.title || typeof raw.title !== 'string') {
    issues.push({ path: 'title', message: 'Missing or non-string title', severity: 'warning' })
  }

  // Fields array
  if (!Array.isArray(raw.fields)) {
    issues.push({ path: 'fields', message: 'fields must be an array', severity: 'error' })
    return { ok: false, issues }
  }

  const seenKeys = new Set<string>()

  for (let i = 0; i < raw.fields.length; i++) {
    const f = raw.fields[i] as RawAiField
    const prefix = `fields[${i}]`

    if (typeof f !== 'object' || f === null) {
      issues.push({ path: prefix, message: 'Field must be an object', severity: 'error' })
      continue
    }

    // key
    if (!f.key || typeof f.key !== 'string') {
      issues.push({ path: `${prefix}.key`, message: 'Field key is missing or not a string', severity: 'error' })
    } else {
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key)) {
        issues.push({
          path: `${prefix}.key`,
          message: `Key "${f.key}" must start with a letter and contain only letters, digits, and underscores`,
          severity: 'error',
        })
      }
      if (seenKeys.has(f.key)) {
        issues.push({ path: `${prefix}.key`, message: `Duplicate field key: "${f.key}"`, severity: 'error' })
      }
      seenKeys.add(String(f.key))
    }

    // label
    if (!f.label || typeof f.label !== 'string') {
      issues.push({ path: `${prefix}.label`, message: 'Field label is missing or not a string', severity: 'warning' })
    }

    // type
    if (!f.type || typeof f.type !== 'string') {
      issues.push({ path: `${prefix}.type`, message: 'Field type is missing or not a string', severity: 'error' })
    } else if (!KNOWN_AI_TYPES.has(f.type)) {
      issues.push({
        path: `${prefix}.type`,
        message: `Unknown field type "${f.type}". Known types: ${[...new Set(Object.keys(AI_TYPE_TO_DFE_TYPE).filter(k => k === k.toLowerCase()))].join(', ')}`,
        severity: 'error',
      })
    }

    // options required for select/radio/checkbox
    if (
      typeof f.type === 'string' &&
      ['select', 'radio', 'SELECT', 'RADIO'].includes(f.type) &&
      (!Array.isArray(f.options) || (f.options as unknown[]).length === 0)
    ) {
      issues.push({
        path: `${prefix}.options`,
        message: `Field type "${f.type}" should have a non-empty options array`,
        severity: 'warning',
      })
    }
  }

  // Step references
  if (Array.isArray(raw.steps)) {
    const fieldKeys = new Set(
      (raw.fields as RawAiField[])
        .filter((f) => typeof f.key === 'string')
        .map((f) => f.key as string),
    )

    for (let s = 0; s < raw.steps.length; s++) {
      const step = raw.steps[s] as Record<string, unknown>
      const prefix = `steps[${s}]`
      if (!step.id || typeof step.id !== 'string') {
        issues.push({ path: `${prefix}.id`, message: 'Step id is missing', severity: 'error' })
      }
      if (Array.isArray(step.fieldKeys)) {
        for (const key of step.fieldKeys as unknown[]) {
          if (typeof key === 'string' && !fieldKeys.has(key)) {
            issues.push({
              path: `${prefix}.fieldKeys`,
              message: `Step references unknown field key "${key}"`,
              severity: 'error',
            })
          }
        }
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error')
  return { ok: !hasErrors, issues }
}

// ─── Normalization ────────────────────────────────────────────────────────────

export interface NormalizeOptions {
  /**
   * Seed for generating deterministic UUIDs (use the form slug or prompt hash).
   * When omitted, random UUIDs are generated.
   */
  idPrefix?: string
  /**
   * versionId to stamp on all fields and steps.
   * @default 'ai-draft-v1'
   */
  versionId?: string
}

/**
 * Normalize AI-generated field specs into proper DFE `FormField` objects.
 *
 * Fills in required database fields (id, versionId, order, config) and
 * maps lowercase AI type aliases to canonical DFE FieldType values.
 *
 * The returned fields are ready to pass to:
 * - `generateZodSchema(fields)` from @dmc--98/dfe-core
 * - `createFormEngine({ fields, steps })` from @dmc--98/dfe-core
 *
 * @example
 * ```ts
 * const parsed = await parsePromptToSchema(prompt, { provider })
 * const { ok, issues } = validateAiOutput(JSON.parse(parsed.rawLlmOutput))
 * if (!ok) throw new Error(issues.map(i => i.message).join('; '))
 * const { fields, steps } = normalizeAiOutput(parsed)
 * const schema = generateZodSchema(fields)
 * ```
 */
export function normalizeAiOutput(
  parsed: { title: string; description: string; steps: unknown[]; fields: unknown[] },
  options: NormalizeOptions = {},
): { fields: FormField[]; steps: FormStep[] } {
  const { versionId = 'ai-draft-v1', idPrefix = 'ai' } = options

  const fields: FormField[] = (parsed.fields as RawAiField[]).map((f, index) => {
    const rawType = String(f.type ?? 'text')
    const dfeType = AI_TYPE_TO_DFE_TYPE[rawType] ?? 'SHORT_TEXT'

    // Build a minimal FieldConfig appropriate for the type
    const config = buildMinimalConfig(dfeType, f)

    return {
      id: `${idPrefix}-field-${String(f.key ?? index)}`,
      versionId,
      key: String(f.key ?? `field_${index}`),
      label: String(f.label ?? ''),
      description: f.helpText ? String(f.helpText) : undefined,
      type: dfeType as FormField['type'],
      required: Boolean(f.required),
      order: index,
      config,
      // Preserve AI governance metadata
      ...(f.metadata !== undefined ? { metadata: f.metadata } : {}),
    } as FormField
  })

  // Map step fieldKeys to the normalized order
  const steps: FormStep[] = (parsed.steps as Array<Record<string, unknown>>).map(
    (s, index) => ({
      id: String(s.id ?? `${idPrefix}-step-${index}`),
      versionId,
      title: String(s.title ?? ''),
      order: index,
      fields: [],
    }),
  )

  return { fields, steps }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildMinimalConfig(dfeType: string, raw: RawAiField): Record<string, unknown> {
  switch (dfeType) {
    case 'SHORT_TEXT':
    case 'LONG_TEXT':
      return {
        placeholder: raw.placeholder ? String(raw.placeholder) : undefined,
      }
    case 'NUMBER':
      return { format: 'decimal' }
    case 'SELECT':
    case 'RADIO':
      return {
        mode: 'static',
        options: Array.isArray(raw.options)
          ? (raw.options as Array<Record<string, unknown>>).map((o) => ({
              value: String(o.value ?? ''),
              label: String(o.label ?? o.value ?? ''),
            }))
          : [],
      }
    case 'CHECKBOX':
      return {}
    case 'MULTI_SELECT':
      return {
        mode: 'static',
        options: [],
      }
    case 'FILE_UPLOAD':
      return { maxSizeMB: 10, maxFiles: 1 }
    case 'RATING':
      return { max: 5 }
    case 'EMAIL':
    case 'PHONE':
    case 'URL':
    case 'DATE':
    case 'HIDDEN':
    default:
      return {}
  }
}
