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
    visibleSteps: StepNodeState[];
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
export declare function useFormStepper(options: UseFormStepperOptions): UseFormStepperReturn;
