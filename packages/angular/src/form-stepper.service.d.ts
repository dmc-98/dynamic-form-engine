import { Observable } from 'rxjs';
import { type FormEngine, type FormStep, type FormStepper, type StepNodeState } from '@dmc-98/dfe-core';
export interface DfeFormStepperServiceConfig {
    /** Step definitions */
    steps: FormStep[];
    /** The form engine instance */
    engine: FormEngine;
    /** Initial step index */
    initialIndex?: number;
    /**
     * Called after navigation occurs (back or next).
     */
    onNavigate?: (direction: 'back' | 'next', newIndex: number) => void;
    /**
     * Called whenever the current step index changes.
     */
    onIndexChange?: (index: number) => void;
}
/**
 * Angular injectable service for multi-step form navigation with RxJS observables.
 *
 * @example
 * ```typescript
 * import { Component } from '@angular/core'
 * import { DfeFormStepperService } from '@dmc-98/dfe-angular'
 *
 * @Component({
 *   selector: 'app-multi-step-form',
 *   template: `
 *     <div>
 *       <h2>{{ (currentStep$ | async)?.step.title }}</h2>
 *       <p>Step {{ (progress$ | async)?.current }} of {{ (progress$ | async)?.total }}</p>
 *
 *       <button *ngIf="(canGoBack$ | async)" (click)="goBack()">Back</button>
 *       <button *ngIf="(isLastStep$ | async); else nextBtn" (click)="handleSubmit()">Submit</button>
 *       <ng-template #nextBtn>
 *         <button (click)="goNext()">Next</button>
 *       </ng-template>
 *     </div>
 *   `,
 * })
 * export class MultiStepFormComponent {
 *   currentStep$ = this.stepperService.currentStep$
 *   visibleSteps$ = this.stepperService.visibleSteps$
 *   canGoBack$ = this.stepperService.canGoBack$
 *   isLastStep$ = this.stepperService.isLastStep$
 *   progress$ = this.stepperService.progress$
 *
 *   constructor(private stepperService: DfeFormStepperService) {}
 *
 *   goNext() {
 *     this.stepperService.goNext()
 *   }
 *
 *   goBack() {
 *     this.stepperService.goBack()
 *   }
 *
 *   handleSubmit() {
 *     // submit form
 *   }
 * }
 * ```
 */
export declare class DfeFormStepperService {
    private stepper;
    private currentStepSubject;
    private currentIndexSubject;
    private visibleStepsSubject;
    private canGoBackSubject;
    private isLastStepSubject;
    private progressSubject;
    /** Observable of current step */
    currentStep$: Observable<StepNodeState | null>;
    /** Observable of current step index */
    currentIndex$: Observable<number>;
    /** Observable of all visible steps */
    visibleSteps$: Observable<StepNodeState[]>;
    /** Observable of whether user can go back */
    canGoBack$: Observable<boolean>;
    /** Observable of whether current step is the last */
    isLastStep$: Observable<boolean>;
    /** Observable of progress info */
    progress$: Observable<{
        current: number;
        total: number;
        percent: number;
    }>;
    constructor();
    /**
     * Initialize the service with steps and engine.
     * Must be called before using other methods.
     */
    init(config: DfeFormStepperServiceConfig): void;
    private onNavigate?;
    private onIndexChange?;
    /**
     * Navigate to the next step.
     */
    goNext(): StepNodeState | null;
    /**
     * Navigate to the previous step.
     */
    goBack(): StepNodeState | null;
    /**
     * Jump to a specific step index.
     */
    jumpTo(index: number): void;
    /**
     * Mark a step as complete.
     */
    markComplete(stepId: string): void;
    /**
     * Get the underlying stepper instance.
     */
    getStepper(): FormStepper;
    /**
     * Get current step (snapshot).
     */
    getCurrentStep(): StepNodeState | null;
    /**
     * Get current step index (snapshot).
     */
    getCurrentIndex(): number;
    /**
     * Get visible steps (snapshot).
     */
    getVisibleSteps(): StepNodeState[];
    /**
     * Get progress info (snapshot).
     */
    getProgress(): {
        current: number;
        total: number;
        percent: number;
    };
    /**
     * Check if user can go back (snapshot).
     */
    getCanGoBack(): boolean;
    /**
     * Check if current step is the last (snapshot).
     */
    getIsLastStep(): boolean;
    private updateStores;
}
