import type { FormField, FormStep, FormValues, FieldKey } from './types'

// ─── Review / Summary ─────────────────────────────────────────────────────────
// Pure helpers that power a review/summary step UI and post-submit redirect.
// The React component is a thin renderer over `buildReviewSummary`; redirect
// handling reads `resolveRedirect`. Keeping this logic in core makes the
// "summary before submit" + "redirect/confirmation" features testable and
// framework-agnostic, open, and fully testable.

const LAYOUT_TYPES = new Set<string>(['SECTION_BREAK', 'FIELD_GROUP'])

export interface ReviewItem {
  key: FieldKey
  label: string
  /** Human-readable value (option labels resolved, arrays joined, empties shown). */
  displayValue: string
  /** True when the field has no answer. */
  empty: boolean
  /** Step the field belongs to (for "edit" navigation), if any. */
  stepId?: string | null
}

export interface ReviewGroup {
  stepId: string | null
  stepTitle: string
  items: ReviewItem[]
}

function optionLabel(field: FormField, value: unknown): string | undefined {
  const cfg = (field.config ?? {}) as { options?: Array<{ label: string; value: unknown }> }
  if (!cfg.options) return undefined
  // Coerce both sides so numeric stored values still match string option values.
  const opt = cfg.options.find(o => String(o.value) === String(value))
  return opt?.label
}

function displayValue(field: FormField, value: unknown): { text: string; empty: boolean } {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return { text: '—', empty: true }
  }
  if (Array.isArray(value)) {
    const labels = value.map(v => optionLabel(field, v) ?? String(v))
    return { text: labels.join(', '), empty: false }
  }
  const label = optionLabel(field, value)
  return { text: label ?? String(value), empty: false }
}

/**
 * Build a grouped, human-readable summary of a form's answers for a review step.
 * Groups by step (in step order) when steps are provided; otherwise a single
 * ungrouped section. Layout fields are excluded; SELECT values resolve to their
 * option labels; arrays join; unanswered optional fields show "—".
 */
export function buildReviewSummary(
  fields: FormField[],
  values: FormValues,
  steps?: FormStep[],
): ReviewGroup[] {
  const real = fields.filter(f => !LAYOUT_TYPES.has(f.type))

  const toItem = (f: FormField): ReviewItem => {
    const { text, empty } = displayValue(f, values[f.key])
    return { key: f.key, label: f.label, displayValue: text, empty, stepId: f.stepId ?? null }
  }

  if (!steps || steps.length === 0) {
    const items = [...real].sort((a, b) => a.order - b.order).map(toItem)
    return [{ stepId: null, stepTitle: '', items }]
  }

  const orderedSteps = [...steps].sort((a, b) => a.order - b.order)
  const stepIds = new Set(orderedSteps.map(s => s.id))
  const groups: ReviewGroup[] = []
  for (const step of orderedSteps) {
    const items = real
      .filter(f => f.stepId === step.id)
      .sort((a, b) => a.order - b.order)
      .map(toItem)
    if (items.length > 0) {
      groups.push({ stepId: step.id, stepTitle: step.title, items })
    }
  }
  // Fields not assigned to any step go into a trailing ungrouped section.
  const orphan = real.filter(f => !f.stepId || !stepIds.has(f.stepId))
  if (orphan.length > 0) {
    groups.push({ stepId: null, stepTitle: '', items: orphan.sort((a, b) => a.order - b.order).map(toItem) })
  }
  return groups
}

/**
 * Resolve the post-submit redirect URL for a submitted step, from its
 * `ReviewConfig.redirectAfterSubmit`. Returns null when none is configured.
 */
export function resolveRedirect(steps: FormStep[], submittedStepId: string): string | null {
  const step = steps.find(s => s.id === submittedStepId)
  return step?.config?.review?.redirectAfterSubmit ?? null
}
