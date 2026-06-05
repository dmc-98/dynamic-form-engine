import type { FormField, FormStep, FieldKey } from './types'

// ─── Config Diff ─────────────────────────────────────────────────────────────
// Compare two form configurations and report what changed at the field and step
// level. Powers the Builder's "config diff" view and safe-migration tooling.

export interface FieldChange {
  key: FieldKey
  /** The properties that differ, with before/after values. */
  changes: Record<string, { before: unknown; after: unknown }>
}

export interface FormConfigDiff {
  /** Field keys present in the next config but not the previous one. */
  addedFields: FieldKey[]
  /** Field keys present in the previous config but not the next one. */
  removedFields: FieldKey[]
  /** Fields present in both whose definition changed. */
  changedFields: FieldChange[]
  /** Step ids added / removed between the two configs. */
  addedSteps: string[]
  removedSteps: string[]
  /** True when nothing changed at all. */
  unchanged: boolean
}

export interface FormConfigSnapshot {
  fields: FormField[]
  steps?: FormStep[]
}

// Field properties that are compared for "changed" detection. Structural-only
// fields like `children` are intentionally excluded (handled via flattening).
const COMPARED_FIELD_PROPS: Array<keyof FormField> = [
  'label', 'type', 'required', 'order', 'stepId', 'description',
  'config', 'conditions', 'computed', 'permissions',
]

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'undefined'
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  const keys = Object.keys(value as Record<string, unknown>).sort()
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(',')}}`
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b)
}

function indexByKey(fields: FormField[]): Map<FieldKey, FormField> {
  const map = new Map<FieldKey, FormField>()
  for (const f of fields) {
    map.set(f.key, f)
  }
  return map
}

/**
 * Diff two form configurations.
 *
 * Returns the field keys added/removed, the fields whose definition changed
 * (with per-property before/after), and the step ids added/removed.
 *
 * @example
 * ```ts
 * const diff = diffFormConfig(prev, next)
 * if (!diff.unchanged) console.log(diff.changedFields)
 * ```
 */
export function diffFormConfig(
  previous: FormConfigSnapshot,
  next: FormConfigSnapshot,
): FormConfigDiff {
  const prevFields = indexByKey(previous.fields ?? [])
  const nextFields = indexByKey(next.fields ?? [])

  const addedFields: FieldKey[] = []
  const removedFields: FieldKey[] = []
  const changedFields: FieldChange[] = []

  for (const key of nextFields.keys()) {
    if (!prevFields.has(key)) {
      addedFields.push(key)
    }
  }

  for (const [key, prevField] of prevFields) {
    const nextField = nextFields.get(key)
    if (!nextField) {
      removedFields.push(key)
      continue
    }
    const changes: Record<string, { before: unknown; after: unknown }> = {}
    for (const prop of COMPARED_FIELD_PROPS) {
      if (!valuesEqual(prevField[prop], nextField[prop])) {
        changes[prop] = { before: prevField[prop], after: nextField[prop] }
      }
    }
    if (Object.keys(changes).length > 0) {
      changedFields.push({ key, changes })
    }
  }

  const prevStepIds = new Set((previous.steps ?? []).map(s => s.id))
  const nextStepIds = new Set((next.steps ?? []).map(s => s.id))
  const addedSteps = [...nextStepIds].filter(id => !prevStepIds.has(id))
  const removedSteps = [...prevStepIds].filter(id => !nextStepIds.has(id))

  const unchanged =
    addedFields.length === 0 &&
    removedFields.length === 0 &&
    changedFields.length === 0 &&
    addedSteps.length === 0 &&
    removedSteps.length === 0

  // Keep output deterministic.
  addedFields.sort()
  removedFields.sort()
  changedFields.sort((a, b) => a.key.localeCompare(b.key))
  addedSteps.sort()
  removedSteps.sort()

  return { addedFields, removedFields, changedFields, addedSteps, removedSteps, unchanged }
}

/** Render a diff as a short, human-readable summary (one line per change). */
export function summarizeFormConfigDiff(diff: FormConfigDiff): string {
  if (diff.unchanged) {
    return 'No changes.'
  }
  const lines: string[] = []
  for (const key of diff.addedFields) lines.push(`+ field ${key}`)
  for (const key of diff.removedFields) lines.push(`- field ${key}`)
  for (const change of diff.changedFields) {
    lines.push(`~ field ${change.key} (${Object.keys(change.changes).join(', ')})`)
  }
  for (const id of diff.addedSteps) lines.push(`+ step ${id}`)
  for (const id of diff.removedSteps) lines.push(`- step ${id}`)
  return lines.join('\n')
}
