import { ref, computed, shallowRef } from 'vue'
import {
  createFormStepper,
  type FormEngine, type FormStep, type FormStepper,
  type StepNodeState,
} from '@dmc-98/dfe-core'

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
  visibleSteps: Readonly<StepNodeState[]>
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

// ─── Composable ─────────────────────────────────────────────────────────────

/**
 * Vue 3 composable for multi-step form navigation.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFormEngine, useFormStepper } from '@dmc-98/dfe-vue'
 *
 * const props = defineProps<{ formData: any }>()
 *
 * const engine = useFormEngine({ fields: props.formData.fields })
 * const stepper = useFormStepper({
 *   steps: props.formData.steps,
 *   engine: engine.engine,
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <h2>{{ stepper.currentStep?.step.title }}</h2>
 *     <p>Step {{ stepper.progress.current }} of {{ stepper.progress.total }}</p>
 *
 *     <button v-if="stepper.canGoBack" @click="stepper.goBack">Back</button>
 *     <button v-if="stepper.isLastStep" @click="handleSubmit">Submit</button>
 *     <button v-else @click="stepper.goNext">Next</button>
 *   </div>
 * </template>
 * ```
 */
export function useFormStepper(options: UseFormStepperOptions): UseFormStepperReturn {
  const { steps, engine, initialIndex, onNavigate, onIndexChange } = options

  const stepper = shallowRef<FormStepper>(createFormStepper(steps, engine, initialIndex))
  const tick = ref(0)

  const goNext = (): StepNodeState | null => {
    const result = stepper.value.goNext()
    const newIndex = stepper.value.getCurrentIndex()
    tick.value++
    onNavigate?.('next', newIndex)
    onIndexChange?.(newIndex)
    return result
  }

  const goBack = (): StepNodeState | null => {
    const result = stepper.value.goBack()
    const newIndex = stepper.value.getCurrentIndex()
    tick.value++
    onNavigate?.('back', newIndex)
    onIndexChange?.(newIndex)
    return result
  }

  const jumpTo = (index: number): void => {
    stepper.value.jumpTo(index)
    tick.value++
    onIndexChange?.(index)
  }

  const markComplete = (stepId: string): void => {
    stepper.value.markComplete(stepId)
    tick.value++
  }

  const currentStep = computed(() => {
    tick.value
    return stepper.value.getCurrentStep()
  })

  const visibleSteps = computed(() => {
    tick.value
    return stepper.value.getVisibleSteps()
  })

  const currentIndex = computed(() => {
    tick.value
    return stepper.value.getCurrentIndex()
  })

  const canGoBack = computed(() => {
    tick.value
    return stepper.value.canGoBack()
  })

  const isLastStep = computed(() => {
    tick.value
    return stepper.value.isLastStep()
  })

  const progress = computed(() => {
    tick.value
    return stepper.value.getProgress()
  })

  return {
    stepper: stepper.value,
    currentStep: currentStep as any,
    currentIndex: currentIndex as any,
    visibleSteps: readonly(visibleSteps),
    canGoBack: canGoBack as any,
    isLastStep: isLastStep as any,
    goNext,
    goBack,
    jumpTo,
    markComplete,
    progress: progress as any,
  }
}

// Helper to make computed readonly
function readonly<T>(computed: any): Readonly<T> {
  return computed as any
}
