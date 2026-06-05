import { useState, useCallback, useMemo, useRef } from 'react'
import {
  createFormStepper,
  type FormEngine, type FormStep, type FormStepper,
  type StepNodeState,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseFormStepperOptions {
  /** Step definitions */
  steps: FormStep[]
  /** The form engine instance (from useFormEngine) */
  engine: FormEngine
  /** Initial step index */
  initialIndex?: number
  /**
   * Called after navigation occurs (back or next).
   * Useful for triggering data re-fetch on back navigation.
   */
  onNavigate?: (direction: 'back' | 'next', newIndex: number) => void
  /**
   * Called whenever the current step index changes.
   * Useful for syncing step index to URL search params.
   */
  onIndexChange?: (index: number) => void
}

export interface UseFormStepperReturn {
  /** The underlying stepper instance */
  stepper: FormStepper
  /** Current step state */
  currentStep: StepNodeState | null
  /** Current step index */
  currentIndex: number
  /** All visible steps */
  visibleSteps: StepNodeState[]
  /** Whether user can go back */
  canGoBack: boolean
  /** Whether current step is the last */
  isLastStep: boolean
  /** Navigate to next step */
  goNext: () => StepNodeState | null
  /** Navigate to previous step */
  goBack: () => StepNodeState | null
  /** Jump to a specific step index */
  jumpTo: (index: number) => void
  /** Mark a step as complete */
  markComplete: (stepId: string) => void
  /** Progress info */
  progress: { current: number; total: number; percent: number }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * React hook for multi-step form navigation.
 *
 * @example
 * ```tsx
 * import { useFormEngine, useFormStepper } from '@dmc--98/dfe-react'
 *
 * function MultiStepForm({ formData }) {
 *   const engine = useFormEngine({ fields: formData.fields })
 *   const stepper = useFormStepper({
 *     steps: formData.steps,
 *     engine: engine.engine,
 *   })
 *
 *   return (
 *     <div>
 *       <h2>{stepper.currentStep?.step.title}</h2>
 *       <p>Step {stepper.progress.current} of {stepper.progress.total}</p>
 *
 *       {stepper.canGoBack && <button onClick={stepper.goBack}>Back</button>}
 *
 *       {stepper.isLastStep
 *         ? <button onClick={handleSubmit}>Submit</button>
 *         : <button onClick={stepper.goNext}>Next</button>
 *       }
 *     </div>
 *   )
 * }
 * ```
 */
export function useFormStepper(options: UseFormStepperOptions): UseFormStepperReturn {
  const { steps, engine, initialIndex, onNavigate, onIndexChange } = options

  const stepperRef = useRef<FormStepper>(createFormStepper(steps, engine, initialIndex))
  const [tick, setTick] = useState(0)

  const goNext = useCallback((): StepNodeState | null => {
    const result = stepperRef.current.goNext()
    const newIndex = stepperRef.current.getCurrentIndex()
    setTick(t => t + 1)
    onNavigate?.('next', newIndex)
    onIndexChange?.(newIndex)
    return result
  }, [onNavigate, onIndexChange])

  const goBack = useCallback((): StepNodeState | null => {
    const result = stepperRef.current.goBack()
    const newIndex = stepperRef.current.getCurrentIndex()
    setTick(t => t + 1)
    onNavigate?.('back', newIndex)
    onIndexChange?.(newIndex)
    return result
  }, [onNavigate, onIndexChange])

  const jumpTo = useCallback((index: number): void => {
    stepperRef.current.jumpTo(index)
    setTick(t => t + 1)
    onIndexChange?.(index)
  }, [onIndexChange])

  const markComplete = useCallback((stepId: string): void => {
    stepperRef.current.markComplete(stepId)
    setTick(t => t + 1)
  }, [])

  const currentStep = useMemo(
    () => stepperRef.current.getCurrentStep(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  )

  const visibleSteps = useMemo(
    () => stepperRef.current.getVisibleSteps(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  )

  return {
    stepper: stepperRef.current,
    currentStep,
    currentIndex: stepperRef.current.getCurrentIndex(),
    visibleSteps,
    canGoBack: stepperRef.current.canGoBack(),
    isLastStep: stepperRef.current.isLastStep(),
    goNext,
    goBack,
    jumpTo,
    markComplete,
    progress: stepperRef.current.getProgress(),
  }
}
