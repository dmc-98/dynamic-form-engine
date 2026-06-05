import { createSignal, createMemo, Accessor } from 'solid-js'
import {
  createFormStepper as coreCreateFormStepper,
  type FormEngine, type FormStep, type FormStepper,
  type StepNodeState,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateFormStepperSignalsOptions {
  /** Step definitions */
  steps: FormStep[]
  /** The form engine instance */
  engine: FormEngine
  /** Initial step index */
  initialIndex?: number
  /**
   * Called after navigation occurs (back or next).
   */
  onNavigate?: (direction: 'back' | 'next', newIndex: number) => void
  /**
   * Called whenever the current step index changes.
   */
  onIndexChange?: (index: number) => void
}

export interface CreateFormStepperSignalsReturn {
  /** The underlying stepper instance */
  stepper: FormStepper
  /** Current step state (accessor) */
  currentStep: Accessor<StepNodeState | null>
  /** Current step index (accessor) */
  currentIndex: Accessor<number>
  /** All visible steps (accessor) */
  visibleSteps: Accessor<StepNodeState[]>
  /** Whether user can go back (accessor) */
  canGoBack: Accessor<boolean>
  /** Whether current step is the last (accessor) */
  isLastStep: Accessor<boolean>
  /** Navigate to next step */
  goNext: () => StepNodeState | null
  /** Navigate to previous step */
  goBack: () => StepNodeState | null
  /** Jump to a specific step index */
  jumpTo: (index: number) => void
  /** Mark a step as complete */
  markComplete: (stepId: string) => void
  /** Progress info (accessor) */
  progress: Accessor<{ current: number; total: number; percent: number }>
}

// ─── Composable ─────────────────────────────────────────────────────────────

/**
 * Solid.js primitive for multi-step form navigation using signals and memos.
 *
 * @example
 * ```tsx
 * import { createFormEngine, createFormStepper } from '@dmc--98/dfe-solid'
 * import { Show } from 'solid-js'
 *
 * export function MultiStepForm(props: { formData: any }) {
 *   const engine = createFormEngine({ fields: props.formData.fields })
 *   const stepper = createFormStepper({
 *     steps: props.formData.steps,
 *     engine: engine.engine,
 *   })
 *
 *   return (
 *     <div>
 *       <h2>{stepper.currentStep()?.step.title}</h2>
 *       <p>
 *         Step {stepper.progress().current} of {stepper.progress().total}
 *       </p>
 *
 *       <Show when={stepper.canGoBack()}>
 *         <button onClick={() => stepper.goBack()}>Back</button>
 *       </Show>
 *
 *       <Show
 *         when={stepper.isLastStep()}
 *         fallback={<button onClick={() => stepper.goNext()}>Next</button>}
 *       >
 *         <button onClick={handleSubmit}>Submit</button>
 *       </Show>
 *     </div>
 *   )
 * }
 * ```
 */
export function createFormStepper(
  options: CreateFormStepperSignalsOptions,
): CreateFormStepperSignalsReturn {
  const { steps, engine, initialIndex, onNavigate, onIndexChange } = options

  const [tick, setTick] = createSignal(0)

  const stepper = coreCreateFormStepper(steps, engine, initialIndex)

  const goNext = (): StepNodeState | null => {
    const result = stepper.goNext()
    const newIndex = stepper.getCurrentIndex()
    setTick(t => t + 1)
    onNavigate?.('next', newIndex)
    onIndexChange?.(newIndex)
    return result
  }

  const goBack = (): StepNodeState | null => {
    const result = stepper.goBack()
    const newIndex = stepper.getCurrentIndex()
    setTick(t => t + 1)
    onNavigate?.('back', newIndex)
    onIndexChange?.(newIndex)
    return result
  }

  const jumpTo = (index: number): void => {
    stepper.jumpTo(index)
    setTick(t => t + 1)
    onIndexChange?.(index)
  }

  const markComplete = (stepId: string): void => {
    stepper.markComplete(stepId)
    setTick(t => t + 1)
  }

  const currentStep = createMemo(() => {
    tick()
    return stepper.getCurrentStep()
  })

  const currentIndex = createMemo(() => {
    tick()
    return stepper.getCurrentIndex()
  })

  const visibleSteps = createMemo(() => {
    tick()
    return stepper.getVisibleSteps()
  })

  const canGoBack = createMemo(() => {
    tick()
    return stepper.canGoBack()
  })

  const isLastStep = createMemo(() => {
    tick()
    return stepper.isLastStep()
  })

  const progress = createMemo(() => {
    tick()
    return stepper.getProgress()
  })

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
