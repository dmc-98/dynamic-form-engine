import { ref, computed, shallowRef, onUnmounted } from 'vue'
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
  values: Readonly<FormValues>
  /** Set a field value (triggers condition re-evaluation) */
  setFieldValue: (key: string, value: unknown) => GraphPatch
  /** All currently visible fields */
  visibleFields: Readonly<FormField[]>
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
 * Vue 3 composable that wraps createFormEngine with reactive state.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFormEngine } from '@dmc--98/dfe-vue'
 *
 * const props = defineProps<{ fields: FormField[] }>()
 *
 * const { values, setFieldValue, visibleFields, validate } = useFormEngine({
 *   fields: props.fields,
 * })
 *
 * const handleSubmit = () => {
 *   const { success, errors } = validate()
 *   if (success) {
 *     submitToApi(values)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleSubmit">
 *     <div v-for="field in visibleFields" :key="field.key">
 *       <MyFieldComponent
 *         :field="field"
 *         :value="values[field.key]"
 *         @change="(v) => setFieldValue(field.key, v)"
 *       />
 *     </div>
 *     <button type="submit">Submit</button>
 *   </form>
 * </template>
 * ```
 */
export function useFormEngine(options: UseFormEngineOptions): UseFormEngineReturn {
  const { fields, initialValues, onChange } = options

  // Store engine in a shallow ref to avoid unnecessary reactivity overhead
  const engine = shallowRef<FormEngine>(createFormEngine(fields, initialValues))

  // Tick counter to trigger reactivity on state changes
  const tick = ref(0)

  const setFieldValue = (key: string, value: unknown): GraphPatch => {
    const patch = engine.value.setFieldValue(key, value)
    tick.value++
    onChange?.(key, value, patch)
    return patch
  }

  const reset = (newFields?: FormField[], newValues?: FormValues): void => {
    engine.value = createFormEngine(newFields ?? fields, newValues ?? initialValues)
    tick.value++
  }

  // Computed properties that depend on tick
  const values = computed(() => {
    // Access tick to establish dependency
    tick.value
    return engine.value.getValues()
  })

  const visibleFields = computed(() => {
    // Access tick to establish dependency
    tick.value
    return engine.value.getVisibleFields()
  })

  const getFieldState = (key: string): FieldNodeState | undefined => {
    return engine.value.getFieldState(key)
  }

  const validate = () => {
    tick.value
    return engine.value.validate()
  }

  const validateStep = (stepId: string) => {
    tick.value
    return engine.value.validateStep(stepId)
  }

  const collectSubmissionValues = () => {
    tick.value
    return engine.value.collectSubmissionValues()
  }

  return {
    engine: engine.value,
    values: readonly(values),
    setFieldValue,
    visibleFields: readonly(visibleFields),
    getFieldState,
    validate,
    validateStep,
    collectSubmissionValues,
    reset,
  }
}

// Helper to make computed readonly
function readonly<T>(computed: any): Readonly<T> {
  return computed as any
}
