import { type FormEngine, type FormStep, type FormStepper, type StepNodeState } from '@dmc--98/dfe-core';
export interface UseFormStepperOptions {
    /** Step definitions */
    steps: FormStep[];
    /** The form engine instance (from useFormEngine) */
    engine: FormEngine;
    /** Initial step index */
    initialIndex?: number;
    /**
     * Called after navigation occurs (back or next).
     * Useful for triggering data re-fetch on back navigation.
     */
    onNavigate?: (direction: 'back' | 'next', newIndex: number) => void;
    /**
     * Called whenever the current step index changes.
     * Useful for syncing step index to URL search params.
     */
    onIndexChange?: (index: number) => void;
}
export interface UseFormStepperReturn {
    /** The underlying stepper instance */
    stepper: FormStepper;
    /** Current step state */
    currentStep: StepNodeState | null;
    /** Current step index */
    currentIndex: number;
    /** All visible steps */
    visibleSteps: Readonly<StepNodeState[]>;
    /** Whether user can go back */
    canGoBack: boolean;
    /** Whether current step is the last */
    isLastStep: boolean;
    /** Navigate to next step */
    goNext: () => StepNodeState | null;
    /** Navigate to previous step */
    goBack: () => StepNodeState | null;
    /** Jump to a specific step index */
    jumpTo: (index: number) => void;
    /** Mark a step as complete */
    markComplete: (stepId: string) => void;
    /** Progress info */
    progress: {
        current: number;
        total: number;
        percent: number;
    };
}
/**
 * Vue 3 composable for multi-step form navigation.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFormEngine, useFormStepper } from '@dmc--98/dfe-vue'
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
export declare function useFormStepper(options: UseFormStepperOptions): UseFormStepperReturn;
