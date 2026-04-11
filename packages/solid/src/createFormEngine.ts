import { createSignal, createMemo, Accessor } from 'solid-js'
import {
  createFormEngine as coreCreateFormEngine,
  type FormField, type FormValues, type FormEngine,
  type GraphPatch, type FieldNodeState,
} from '@dmc-98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateFormEngineSignalsOptions {
  /** Form field definitions */
  fields: FormField[]
  /** Pre-existing values to hydrate */
  initialValues?: FormValues
  /** Callback when any field value changes */
  onChange?: (key: string, value: unknown, patch: GraphPatch) => void
}

export interface CreateFormEngineSignalsReturn {
  /** The underlying engine instance */
  engine: FormEngine
  /** Current form values (accessor) */
  values: Accessor<FormValues>
  /** Set a field value (triggers condition re-evaluation) */
  setFieldValue: (key: string, value: unknown) => GraphPatch
  /** All currently visible fields (accessor) */
  visibleFields: Accessor<FormField[]>
  /** Get the state of a specific field */
  getFieldState: (key: string) => FieldNodeState | undefined
  /** Validate all visible required fields */
  validate: () => { success: boolean; errors: Record<string, string> }
  /** Validate a single step's fields */
  validateStep: (stepId: string) => { success: boolean; errors: Record<string, string> }
  /** Collect values for submission (excludes hidden/layout) */
  collectSubmissionValues: () => FormValues
  /** Reset the engine with new fields/values */
  reset: (fields?: FormField[], values?: FormValues) => void
}

// ─── Composable ─────────────────────────────────────────────────────────────

/**
 * Solid.js primitive for reactive form engine state using signals and memos.
 *
 * @example
 * ```tsx
 * import { createFormEngine } from '@dmc-98/dfe-solid'
 * import { For } from 'solid-js'
 *
 * export function MyForm(props: { fields: FormField[] }) {
 *   const {
 *     values,
 *     setFieldValue,
 *     visibleFields,
 *     validate,
 *   } = createFormEngine({
 *     fields: props.fields,
 *   })
 *
 *   const handleSubmit = () => {
 *     const { success, errors } = validate()
 *     if (success) {
 *       submitToApi(values())
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
 *       <For each={visibleFields()}>
 *         {(field) => (
 *           <MyFieldComponent
 *             field={field}
 *             value={values()[field.key]}
 *             onChange={(v) => setFieldValue(field.key, v)}
 *           />
 *         )}
 *       </For>
 *       <button type="submit">Submit</button>
 *     </form>
 *   )
 * }
 * ```
 */
export function createFormEngine(
  options: CreateFormEngineSignalsOptions,
): CreateFormEngineSignalsReturn {
  const { fields, initialValues, onChange } = options

  // Create a signal to track updates
  const [tick, setTick] = createSignal(0)

  // Create the engine once
  const engine = coreCreateFormEngine(fields, initialValues)

  const setFieldValue = (key: string, value: unknown): GraphPatch => {
    const patch = engine.setFieldValue(key, value)
    setTick(t => t + 1)
    onChange?.(key, value, patch)
    return patch
  }

  const reset = (newFields?: FormField[], newValues?: FormValues): void => {
    const newEngine = coreCreateFormEngine(newFields ?? fields, newValues ?? initialValues)
    Object.assign(engine, newEngine)
    setTick(t => t + 1)
  }

  // Create memos that depend on tick
  const values = createMemo(() => {
    tick()
    return engine.getValues()
  })

  const visibleFields = createMemo(() => {
    tick()
    return engine.getVisibleFields()
  })

  const getFieldState = (key: string): FieldNodeState | undefined => {
    return engine.getFieldState(key)
  }

  const validate = () => {
    tick()
    return engine.validate()
  }

  const validateStep = (stepId: string) => {
    tick()
    return engine.validateStep(stepId)
  }

  const collectSubmissionValues = () => {
    tick()
    return engine.collectSubmissionValues()
  }

  return {
    engine,
    values,
    setFieldValue,
    visibleFields,
    getFieldState,
    validate,
    validateStep,
    collectSubmissionValues,
    reset,
  }
}
