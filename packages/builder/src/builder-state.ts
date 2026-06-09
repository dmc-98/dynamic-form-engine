import type { FormField, FormStep, FieldType, FieldKey } from '@dmc--98/dfe-core'

// ─── Builder State Engine ─────────────────────────────────────────────────────
// A headless, framework-agnostic reducer that powers the visual form builder.
// All builder logic lives here so it can be unit-tested without a DOM; the React
// component is a thin view over this state.

export interface DndBuilderState {
  fields: FormField[]
  steps: FormStep[]
  /** id of the currently selected field (for the property editor), or null. */
  selectedFieldId: string | null
}

export type DndBuilderAction =
  | { type: 'ADD_FIELD'; fieldType: FieldType; stepId?: string }
  | { type: 'REMOVE_FIELD'; id: string }
  | { type: 'MOVE_FIELD'; from: number; to: number }
  /** Keyboard-accessible relative move: delta -1 = up, +1 = down. Clamped. */
  | { type: 'MOVE_FIELD_BY'; id: string; delta: number }
  | { type: 'UPDATE_FIELD'; id: string; patch: Partial<FormField> }
  /** Append an option to a selection field; value derived from label, deduped. */
  | { type: 'ADD_OPTION'; id: string; label: string }
  /** Edit one option of a selection field by index. */
  | { type: 'UPDATE_OPTION'; id: string; index: number; patch: Partial<{ label: string; value: string }> }
  /** Remove one option by index. Refused if it would leave zero options. */
  | { type: 'REMOVE_OPTION'; id: string; index: number }
  /** Set/clear validation rules in the field config (undefined clears a rule). */
  | { type: 'SET_VALIDATION'; id: string; validation: Record<string, unknown> }
  | { type: 'SELECT_FIELD'; id: string | null }
  | { type: 'ADD_STEP'; title?: string }
  | { type: 'REMOVE_STEP'; id: string }
  | { type: 'ASSIGN_FIELD_TO_STEP'; id: string; stepId: string | null }
  | { type: 'RESET'; state?: Partial<DndBuilderState> }

let counter = 0
/** Deterministic-ish unique id generator for builder-created entities. */
function uid(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}`
}

const DEFAULT_LABELS: Partial<Record<FieldType, string>> = {
  SHORT_TEXT: 'Text',
  LONG_TEXT: 'Paragraph',
  NUMBER: 'Number',
  EMAIL: 'Email',
  PHONE: 'Phone',
  DATE: 'Date',
  SELECT: 'Dropdown',
  MULTI_SELECT: 'Multi-select',
  RADIO: 'Choice',
  CHECKBOX: 'Checkbox',
  FILE_UPLOAD: 'File upload',
  RATING: 'Rating',
}

const SELECTION_TYPES = new Set<FieldType>(['SELECT', 'MULTI_SELECT', 'RADIO'])

/** Config keys that SET_VALIDATION may write — keeps it from corrupting structural config. */
const VALIDATION_KEYS = new Set<string>([
  'minLength', 'maxLength', 'pattern', 'min', 'max', 'format',
  'maxSizeMB', 'allowedMimeTypes', 'maxFiles', 'minLabel', 'maxLabel', 'step',
])

/** Generate a unique field key from a label, disambiguating against existing keys. */
export function deriveFieldKey(label: string, existing: Set<FieldKey>): FieldKey {
  const base = label
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'field'
  let key = base
  let n = 1
  while (existing.has(key)) {
    n += 1
    key = `${base}_${n}`
  }
  return key
}

/** Create a new field of the given type with sensible defaults. */
export function makeField(fieldType: FieldType, existingKeys: Set<FieldKey>, order: number, stepId?: string): FormField {
  const label = DEFAULT_LABELS[fieldType] ?? 'Field'
  const key = deriveFieldKey(label, existingKeys)
  const field: FormField = {
    id: uid('field'),
    versionId: 'v1',
    key,
    label,
    type: fieldType,
    required: false,
    order,
    config: SELECTION_TYPES.has(fieldType)
      ? { mode: 'static', options: [{ label: 'Option 1', value: 'option_1' }] }
      : {},
  }
  if (stepId) {
    field.stepId = stepId
  }
  return field
}

/** Create an empty builder state. */
export function createBuilderState(initial: Partial<DndBuilderState> = {}): DndBuilderState {
  return {
    fields: initial.fields ?? [],
    steps: initial.steps ?? [],
    selectedFieldId: initial.selectedFieldId ?? null,
  }
}

/** Re-number field.order to match array position (keeps order stable & gap-free). */
function renumber(fields: FormField[]): FormField[] {
  return fields.map((f, i) => (f.order === i + 1 ? f : { ...f, order: i + 1 }))
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (from < 0 || from >= arr.length || to < 0 || to >= arr.length || from === to) {
    return arr
  }
  const copy = arr.slice()
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

/** The builder reducer. Pure: never mutates the input state. */
export function builderReducer(state: DndBuilderState, action: DndBuilderAction): DndBuilderState {
  switch (action.type) {
    case 'ADD_FIELD': {
      const existingKeys = new Set(state.fields.map(f => f.key))
      const field = makeField(action.fieldType, existingKeys, state.fields.length + 1, action.stepId)
      return { ...state, fields: renumber([...state.fields, field]), selectedFieldId: field.id }
    }

    case 'REMOVE_FIELD': {
      const fields = renumber(state.fields.filter(f => f.id !== action.id))
      return {
        ...state,
        fields,
        selectedFieldId: state.selectedFieldId === action.id ? null : state.selectedFieldId,
      }
    }

    case 'MOVE_FIELD': {
      return { ...state, fields: renumber(move(state.fields, action.from, action.to)) }
    }

    case 'MOVE_FIELD_BY': {
      const from = state.fields.findIndex(f => f.id === action.id)
      if (from === -1) return state
      const to = Math.max(0, Math.min(state.fields.length - 1, from + action.delta))
      if (to === from) return state
      return { ...state, fields: renumber(move(state.fields, from, to)) }
    }

    case 'ADD_OPTION': {
      const fields = state.fields.map((f): FormField => {
        if (f.id !== action.id || !SELECTION_TYPES.has(f.type)) return f
        const cfg = f.config as { options?: Array<{ label: string; value: string }> }
        const options = cfg.options ?? []
        const existing = new Set(options.map(o => o.value))
        const value = deriveFieldKey(action.label, existing as Set<FieldKey>)
        const config = { ...cfg, options: [...options, { label: action.label, value }] } as FormField['config']
        return { ...f, config }
      })
      return { ...state, fields }
    }

    case 'UPDATE_OPTION': {
      const fields = state.fields.map((f): FormField => {
        if (f.id !== action.id || !SELECTION_TYPES.has(f.type)) return f
        const cfg = f.config as { options?: Array<{ label: string; value: string }> }
        const options = cfg.options ?? []
        if (action.index < 0 || action.index >= options.length) return f
        const next = options.slice()
        next[action.index] = { ...next[action.index], ...action.patch }
        const config = { ...cfg, options: next } as FormField['config']
        return { ...f, config }
      })
      return { ...state, fields }
    }

    case 'REMOVE_OPTION': {
      const fields = state.fields.map((f): FormField => {
        if (f.id !== action.id || !SELECTION_TYPES.has(f.type)) return f
        const cfg = f.config as { options?: Array<{ label: string; value: string }> }
        const options = cfg.options ?? []
        // Selection fields must keep at least one option.
        if (options.length <= 1 || action.index < 0 || action.index >= options.length) return f
        const config = { ...cfg, options: options.filter((_, i) => i !== action.index) } as FormField['config']
        return { ...f, config }
      })
      return { ...state, fields }
    }

    case 'SET_VALIDATION': {
      const fields = state.fields.map((f): FormField => {
        if (f.id !== action.id) return f
        const cfg = { ...(f.config as Record<string, unknown>) }
        for (const [rule, value] of Object.entries(action.validation)) {
          // Only known validation keys may be written, so this action can't
          // corrupt structural config (e.g. `options`, `mode`).
          if (!VALIDATION_KEYS.has(rule)) continue
          if (value === undefined) {
            delete cfg[rule]
          } else {
            cfg[rule] = value
          }
        }
        return { ...f, config: cfg as FormField['config'] }
      })
      return { ...state, fields }
    }

    case 'UPDATE_FIELD': {
      const fields = state.fields.map(f => {
        if (f.id !== action.id) return f
        const merged = { ...f, ...action.patch }
        // Keep id/key edits sane: never allow blank key.
        if (action.patch.key !== undefined && !String(action.patch.key).trim()) {
          merged.key = f.key
        }
        return merged
      })
      return { ...state, fields }
    }

    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.id }

    case 'ADD_STEP': {
      const step: FormStep = {
        id: uid('step'),
        versionId: 'v1',
        title: action.title ?? `Step ${state.steps.length + 1}`,
        order: state.steps.length + 1,
      }
      return { ...state, steps: [...state.steps, step] }
    }

    case 'REMOVE_STEP': {
      const steps = state.steps
        .filter(s => s.id !== action.id)
        .map((s, i) => ({ ...s, order: i + 1 }))
      // Detach fields that pointed at the removed step.
      const fields = state.fields.map(f => (f.stepId === action.id ? { ...f, stepId: null } : f))
      return { ...state, steps, fields }
    }

    case 'ASSIGN_FIELD_TO_STEP': {
      const fields = state.fields.map(f => (f.id === action.id ? { ...f, stepId: action.stepId } : f))
      return { ...state, fields }
    }

    case 'RESET':
      return createBuilderState(action.state)

    default:
      return state
  }
}

export interface BuilderFormConfig {
  fields: FormField[]
  steps: FormStep[]
}

/** Emit a clean DFE form configuration from the current builder state. */
export function toFormConfig(state: DndBuilderState): BuilderFormConfig {
  return {
    fields: renumber(state.fields),
    steps: state.steps.map((s, i) => ({ ...s, order: i + 1 })),
  }
}
