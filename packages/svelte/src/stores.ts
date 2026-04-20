import { writable } from 'svelte/store'
import {
  createFormEngine,
  createFormStepper,
  type FormField, type FormValues, type FormEngine,
  type GraphPatch, type FieldNodeState,
  type FormStep, type FormStepper, type StepNodeState,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FormEngineStores {
  /** The underlying engine instance */
  engine: FormEngine
  /** Current form values (writable store) */
  values: ReturnType<typeof writable<FormValues>>
  /** All currently visible fields (writable store) */
  visibleFields: ReturnType<typeof writable<FormField[]>>
  /** Set a field value (triggers condition re-evaluation) */
  setFieldValue: (key: string, value: unknown) => GraphPatch
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

export interface FormStepperStores {
  /** The underlying stepper instance */
  stepper: FormStepper
  /** Current step state (writable store) */
  currentStep: ReturnType<typeof writable<StepNodeState | null>>
  /** Current step index (writable store) */
  currentIndex: ReturnType<typeof writable<number>>
  /** All visible steps (writable store) */
  visibleSteps: ReturnType<typeof writable<StepNodeState[]>>
  /** Whether user can go back (writable store) */
  canGoBack: ReturnType<typeof writable<boolean>>
  /** Whether current step is the last (writable store) */
  isLastStep: ReturnType<typeof writable<boolean>>
  /** Navigate to next step */
  goNext: () => StepNodeState | null
  /** Navigate to previous step */
  goBack: () => StepNodeState | null
  /** Jump to a specific step index */
  jumpTo: (index: number) => void
  /** Mark a step as complete */
  markComplete: (stepId: string) => void
  /** Progress info (writable store) */
  progress: ReturnType<typeof writable<{ current: number; total: number; percent: number }>>
}

// ─── Form Engine Store ──────────────────────────────────────────────────────

/**
 * Creates reactive Svelte stores for form engine state.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createFormEngineStore } from '@dmc--98/dfe-svelte'
 *
 *   export let fields
 *
 *   const { values, visibleFields, setFieldValue, validate } = createFormEngineStore(fields)
 * </script>
 *
 * <form on:submit|preventDefault={() => {
 *   const { success } = validate()
 *   if (success) submitToApi($values)
 * }}>
 *   {#each $visibleFields as field (field.key)}
 *     <MyFieldComponent
 *       {field}
 *       value={$values[field.key]}
 *       onChange={(v) => setFieldValue(field.key, v)}
 *     />
 *   {/each}
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
export function createFormEngineStore(
  fields: FormField[],
  initialValues?: FormValues,
  onChange?: (key: string, value: unknown, patch: GraphPatch) => void,
): FormEngineStores {
  const engine = createFormEngine(fields, initialValues)

  const values = writable(engine.getValues())
  const visibleFields = writable(engine.getVisibleFields())

  const updateStores = () => {
    values.set(engine.getValues())
    visibleFields.set(engine.getVisibleFields())
  }

  const setFieldValue = (key: string, value: unknown): GraphPatch => {
    const patch = engine.setFieldValue(key, value)
    updateStores()
    onChange?.(key, value, patch)
    return patch
  }

  const reset = (newFields?: FormField[], newValues?: FormValues): void => {
    const newEngine = createFormEngine(newFields ?? fields, newValues ?? initialValues)
    Object.assign(engine, newEngine)
    updateStores()
  }

  const getFieldState = (key: string): FieldNodeState | undefined => {
    return engine.getFieldState(key)
  }

  const validate = () => {
    return engine.validate()
  }

  const validateStep = (stepId: string) => {
    return engine.validateStep(stepId)
  }

  const collectSubmissionValues = () => {
    return engine.collectSubmissionValues()
  }

  return {
    engine,
    values,
    visibleFields,
    setFieldValue,
    getFieldState,
    validate,
    validateStep,
    collectSubmissionValues,
    reset,
  }
}

// ─── Form Stepper Store ─────────────────────────────────────────────────────

/**
 * Creates reactive Svelte stores for multi-step form navigation.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createFormEngineStore, createFormStepperStore } from '@dmc--98/dfe-svelte'
 *
 *   export let formData
 *
 *   const engineStores = createFormEngineStore(formData.fields)
 *   const stepperStores = createFormStepperStore(formData.steps, engineStores.engine)
 * </script>
 *
 * <div>
 *   <h2>{$stepperStores.currentStep?.step.title}</h2>
 *   <p>Step {$stepperStores.progress.current} of {$stepperStores.progress.total}</p>
 *
 *   {#if $stepperStores.canGoBack}
 *     <button on:click={stepperStores.goBack}>Back</button>
 *   {/if}
 *
 *   {#if $stepperStores.isLastStep}
 *     <button on:click={handleSubmit}>Submit</button>
 *   {:else}
 *     <button on:click={stepperStores.goNext}>Next</button>
 *   {/if}
 * </div>
 * ```
 */
export function createFormStepperStore(
  steps: FormStep[],
  engine: FormEngine,
  initialIndex?: number,
  onNavigate?: (direction: 'back' | 'next', newIndex: number) => void,
  onIndexChange?: (index: number) => void,
): FormStepperStores {
  const stepper = createFormStepper(steps, engine, initialIndex)

  const currentStep = writable(stepper.getCurrentStep())
  const currentIndex = writable(stepper.getCurrentIndex())
  const visibleSteps = writable(stepper.getVisibleSteps())
  const canGoBack = writable(stepper.canGoBack())
  const isLastStep = writable(stepper.isLastStep())
  const progress = writable(stepper.getProgress())

  const updateStores = () => {
    currentStep.set(stepper.getCurrentStep())
    currentIndex.set(stepper.getCurrentIndex())
    visibleSteps.set(stepper.getVisibleSteps())
    canGoBack.set(stepper.canGoBack())
    isLastStep.set(stepper.isLastStep())
    progress.set(stepper.getProgress())
  }

  const goNext = (): StepNodeState | null => {
    const result = stepper.goNext()
    const newIndex = stepper.getCurrentIndex()
    updateStores()
    onNavigate?.('next', newIndex)
    onIndexChange?.(newIndex)
    return result
  }

  const goBack = (): StepNodeState | null => {
    const result = stepper.goBack()
    const newIndex = stepper.getCurrentIndex()
    updateStores()
    onNavigate?.('back', newIndex)
    onIndexChange?.(newIndex)
    return result
  }

  const jumpTo = (index: number): void => {
    stepper.jumpTo(index)
    updateStores()
    onIndexChange?.(index)
  }

  const markComplete = (stepId: string): void => {
    stepper.markComplete(stepId)
    updateStores()
  }

  return {
    stepper,
    currentStep,
    currentIndex,
    visibleSteps,
    canGoBack,
    isLastStep,
    goNext,
    goBack,
    jumpTo,
    markComplete,
    progress,
  }
}
