import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import {
  createFormStepper,
  type FormEngine, type FormStep, type FormStepper,
  type StepNodeState,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeFormStepperServiceConfig {
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

// ─── Service ────────────────────────────────────────────────────────────────

/**
 * Angular injectable service for multi-step form navigation with RxJS observables.
 *
 * @example
 * ```typescript
 * import { Component } from '@angular/core'
 * import { DfeFormStepperService } from '@dmc--98/dfe-angular'
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
@Injectable()
export class DfeFormStepperService {
  private stepper!: FormStepper
  private currentStepSubject!: BehaviorSubject<StepNodeState | null>
  private currentIndexSubject!: BehaviorSubject<number>
  private visibleStepsSubject!: BehaviorSubject<StepNodeState[]>
  private canGoBackSubject!: BehaviorSubject<boolean>
  private isLastStepSubject!: BehaviorSubject<boolean>
  private progressSubject!: BehaviorSubject<{ current: number; total: number; percent: number }>

  /** Observable of current step */
  currentStep$!: Observable<StepNodeState | null>
  /** Observable of current step index */
  currentIndex$!: Observable<number>
  /** Observable of all visible steps */
  visibleSteps$!: Observable<StepNodeState[]>
  /** Observable of whether user can go back */
  canGoBack$!: Observable<boolean>
  /** Observable of whether current step is the last */
  isLastStep$!: Observable<boolean>
  /** Observable of progress info */
  progress$!: Observable<{ current: number; total: number; percent: number }>

  constructor() {}

  /**
   * Initialize the service with steps and engine.
   * Must be called before using other methods.
   */
  init(config: DfeFormStepperServiceConfig): void {
    const { steps, engine, initialIndex, onNavigate, onIndexChange } = config

    this.stepper = createFormStepper(steps, engine, initialIndex)

    this.currentStepSubject = new BehaviorSubject(this.stepper.getCurrentStep())
    this.currentIndexSubject = new BehaviorSubject(this.stepper.getCurrentIndex())
    this.visibleStepsSubject = new BehaviorSubject(this.stepper.getVisibleSteps())
    this.canGoBackSubject = new BehaviorSubject(this.stepper.canGoBack())
    this.isLastStepSubject = new BehaviorSubject(this.stepper.isLastStep())
    this.progressSubject = new BehaviorSubject(this.stepper.getProgress())

    this.currentStep$ = this.currentStepSubject.asObservable()
    this.currentIndex$ = this.currentIndexSubject.asObservable()
    this.visibleSteps$ = this.visibleStepsSubject.asObservable()
    this.canGoBack$ = this.canGoBackSubject.asObservable()
    this.isLastStep$ = this.isLastStepSubject.asObservable()
    this.progress$ = this.progressSubject.asObservable()

    this.onNavigate = onNavigate
    this.onIndexChange = onIndexChange
  }

  private onNavigate?: (direction: 'back' | 'next', newIndex: number) => void
  private onIndexChange?: (index: number) => void

  /**
   * Navigate to the next step.
   */
  goNext(): StepNodeState | null {
    const result = this.stepper.goNext()
    const newIndex = this.stepper.getCurrentIndex()
    this.updateStores()
    this.onNavigate?.('next', newIndex)
    this.onIndexChange?.(newIndex)
    return result
  }

  /**
   * Navigate to the previous step.
   */
  goBack(): StepNodeState | null {
    const result = this.stepper.goBack()
    const newIndex = this.stepper.getCurrentIndex()
    this.updateStores()
    this.onNavigate?.('back', newIndex)
    this.onIndexChange?.(newIndex)
    return result
  }

  /**
   * Jump to a specific step index.
   */
  jumpTo(index: number): void {
    this.stepper.jumpTo(index)
    this.updateStores()
    this.onIndexChange?.(index)
  }

  /**
   * Mark a step as complete.
   */
  markComplete(stepId: string): void {
    this.stepper.markComplete(stepId)
    this.updateStores()
  }

  /**
   * Get the underlying stepper instance.
   */
  getStepper(): FormStepper {
    return this.stepper
  }

  /**
   * Get current step (snapshot).
   */
  getCurrentStep(): StepNodeState | null {
    return this.stepper.getCurrentStep()
  }

  /**
   * Get current step index (snapshot).
   */
  getCurrentIndex(): number {
    return this.stepper.getCurrentIndex()
  }

  /**
   * Get visible steps (snapshot).
   */
  getVisibleSteps(): StepNodeState[] {
    return this.stepper.getVisibleSteps()
  }

  /**
   * Get progress info (snapshot).
   */
  getProgress(): { current: number; total: number; percent: number } {
    return this.stepper.getProgress()
  }

  /**
   * Check if user can go back (snapshot).
   */
  getCanGoBack(): boolean {
    return this.stepper.canGoBack()
  }

  /**
   * Check if current step is the last (snapshot).
   */
  getIsLastStep(): boolean {
    return this.stepper.isLastStep()
  }

  private updateStores(): void {
    this.currentStepSubject.next(this.stepper.getCurrentStep())
    this.currentIndexSubject.next(this.stepper.getCurrentIndex())
    this.visibleStepsSubject.next(this.stepper.getVisibleSteps())
    this.canGoBackSubject.next(this.stepper.canGoBack())
    this.isLastStepSubject.next(this.stepper.isLastStep())
    this.progressSubject.next(this.stepper.getProgress())
  }
}
