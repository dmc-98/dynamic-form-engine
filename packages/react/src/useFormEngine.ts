import { useState, useCallback, useMemo, useRef } from 'react'
import {
  createFormEngine,
  type FormField, type FormValues, type FormEngine,
  type GraphPatch, type FieldNodeState,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseFormEngineOptions {
  /** Form field definitions */
  fields: FormField[]
  /** Pre-existing values to hydrate */
  initialValues?: FormValues
  /** Callback when any field value changes */
  onChange?: (key: string, value: unknown, patch: GraphPatch) => void
}

export interface UseFormEngineReturn {
  /** The underlying engine instance */
  engine: FormEngine
  /** Current form values (reactive) */
  values: FormValues
  /** Set a field value (triggers condition re-evaluation) */
  setFieldValue: (key: string, value: unknown) => GraphPatch
  /** All currently visible fields */
  visibleFields: FormField[]
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

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * React hook that wraps createFormEngine with reactive state.
 *
 * @example
 * ```tsx
 * import { useFormEngine } from '@dmc--98/dfe-react'
 *
 * function MyForm({ fields, initialData }) {
 *   const { values, setFieldValue, visibleFields, validate } = useFormEngine({
 *     fields,
 *     initialValues: initialData,
 *   })
 *
 *   return (
 *     <form onSubmit={() => {
 *       const { success, errors } = validate()
 *       if (success) submitToApi(values)
 *     }}>
 *       {visibleFields.map(field => (
 *         <MyFieldComponent
 *           key={field.key}
 *           field={field}
 *           value={values[field.key]}
 *           onChange={(v) => setFieldValue(field.key, v)}
 *         />
 *       ))}
 *     </form>
 *   )
 * }
 * ```
 */
export function useFormEngine(options: UseFormEngineOptions): UseFormEngineReturn {
  const { fields, initialValues, onChange } = options

  // Use ref to hold engine to avoid re-creating on every render
  const engineRef = useRef<FormEngine>(createFormEngine(fields, initialValues))

  // Reactive state trigger — increment to force re-render
  const [tick, setTick] = useState(0)

  const setFieldValue = useCallback((key: string, value: unknown): GraphPatch => {
    const patch = engineRef.current.setFieldValue(key, value)
    setTick(t => t + 1)
    onChange?.(key, value, patch)
    return patch
  }, [onChange])

  const reset = useCallback((newFields?: FormField[], newValues?: FormValues) => {
    engineRef.current = createFormEngine(newFields ?? fields, newValues ?? initialValues)
    setTick(t => t + 1)
  }, [fields, initialValues])

  // Memoize derived values based on tick
  const values = useMemo(
    () => engineRef.current.getValues(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  )

  const visibleFields = useMemo(
    () => engineRef.current.getVisibleFields(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  )

  return {
    engine: engineRef.current,
    values,
    setFieldValue,
    visibleFields,
    getFieldState: useCallback(
      (key: string) => engineRef.current.getFieldState(key),
      [],
    ),
    validate: useCallback(
      () => engineRef.current.validate(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [tick],
    ),
    validateStep: useCallback(
      (stepId: string) => engineRef.current.validateStep(stepId),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [tick],
    ),
    collectSubmissionValues: useCallback(
      () => engineRef.current.collectSubmissionValues(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [tick],
    ),
    reset,
  }
}
