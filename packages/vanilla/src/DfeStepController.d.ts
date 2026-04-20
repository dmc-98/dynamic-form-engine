import { type FormEngine, type FormStep, type FormStepper, type StepNodeState } from '@dmc--98/dfe-core';
export interface DfeStepControllerConfig {
    /** Step definitions */
    steps: FormStep[];
    /** The form engine instance */
    engine: FormEngine;
    /** Initial step index */
    initialIndex?: number;
}
export interface StepNavigateEvent extends Event {
    detail: {
        direction: 'back' | 'next';
        newIndex: number;
        currentStep: StepNodeState | null;
    };
}
export interface StepIndexChangeEvent extends Event {
    detail: {
        index: number;
        currentStep: StepNodeState | null;
    };
}
export interface StepVisibilityChangeEvent extends Event {
    detail: {
        visibleSteps: StepNodeState[];
    };
}
/**
 * Vanilla JavaScript step controller extending EventTarget for multi-step form navigation.
 *
 * Dispatches custom events for navigation:
 * - 'dfe:navigate': Fired when navigating (back/next)
 * - 'dfe:index-change': Fired when step index changes
 * - 'dfe:step-visibility': Reserved for visible step changes
 *
 * @example
 * ```typescript
 * import { DfeFormController, DfeStepController } from '@dmc--98/dfe-vanilla'
 *
 * const formController = new DfeFormController({ fields: myFields })
 * const stepController = new DfeStepController({
 *   steps: mySteps,
 *   engine: formController.getEngine(),
 * })
 *
 * // Listen for navigation
 * stepController.addEventListener('dfe:navigate', (e) => {
 *   const { direction, newIndex } = (e as StepNavigateEvent).detail
 *   console.log(`Navigated ${direction} to step ${newIndex}`)
 * })
 *
 * // Listen for index changes
 * stepController.addEventListener('dfe:index-change', (e) => {
 *   const { index, currentStep } = (e as StepIndexChangeEvent).detail
 *   renderStepHeader(currentStep?.step.title)
 * })
 *
 * // Navigate
 * stepController.goNext()
 * stepController.goBack()
 * stepController.jumpTo(2)
 * ```
 */
export declare class DfeStepController extends EventTarget {
    private stepper;
    constructor(config: DfeStepControllerConfig);
    /**
     * Get the underlying stepper instance.
     */
    getStepper(): FormStepper;
    /**
     * Get the current step.
     */
    getCurrentStep(): StepNodeState | null;
    /**
     * Get the current step index.
     */
    getCurrentIndex(): number;
    /**
     * Get all visible steps.
     */
    getVisibleSteps(): StepNodeState[];
    /**
     * Check if the user can go back.
     */
    canGoBack(): boolean;
    /**
     * Check if the current step is the last.
     */
    isLastStep(): boolean;
    /**
     * Get progress information.
     */
    getProgress(): {
        current: number;
        total: number;
        percent: number;
    };
    /**
     * Navigate to the next step.
     * Dispatches 'dfe:navigate' and 'dfe:index-change' events.
     */
    goNext(): StepNodeState | null;
    /**
     * Navigate to the previous step.
     * Dispatches 'dfe:navigate' and 'dfe:index-change' events.
     */
    goBack(): StepNodeState | null;
    /**
     * Jump to a specific step index.
     * Dispatches 'dfe:index-change' event.
     */
    jumpTo(index: number): void;
    /**
     * Mark a step as complete.
     */
    markComplete(stepId: string): void;
}
declare global {
    interface GlobalEventHandlersEventMap {
        'dfe:navigate': StepNavigateEvent;
        'dfe:index-change': StepIndexChangeEvent;
        'dfe:step-visibility': StepVisibilityChangeEvent;
    }
}
