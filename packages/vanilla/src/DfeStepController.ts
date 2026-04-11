import {
  createFormStepper,
  type FormEngine, type FormStep, type FormStepper,
  type StepNodeState,
} from '@dmc-98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeStepControllerConfig {
  /** Step definitions */
  steps: FormStep[]
  /** The form engine instance */
  engine: FormEngine
  /** Initial step index */
  initialIndex?: number
}

export interface StepNavigateEvent extends Event {
  detail: {
    direction: 'back' | 'next'
    newIndex: number
    currentStep: StepNodeState | null
  }
}

export interface StepIndexChangeEvent extends Event {
  detail: {
    index: number
    currentStep: StepNodeState | null
  }
}

export interface StepVisibilityChangeEvent extends Event {
  detail: {
    visibleSteps: StepNodeState[]
  }
}

// ─── Controller ─────────────────────────────────────────────────────────────

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
 * import { DfeFormController, DfeStepController } from '@dmc-98/dfe-vanilla'
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
export class DfeStepController extends EventTarget {
  private stepper: FormStepper

  constructor(config: DfeStepControllerConfig) {
    super()
    const { steps, engine, initialIndex } = config
    this.stepper = createFormStepper(steps, engine, initialIndex)
  }

  /**
   * Get the underlying stepper instance.
   */
  getStepper(): FormStepper {
    return this.stepper
  }

  /**
   * Get the current step.
   */
  getCurrentStep(): StepNodeState | null {
    return this.stepper.getCurrentStep()
  }

  /**
   * Get the current step index.
   */
  getCurrentIndex(): number {
    return this.stepper.getCurrentIndex()
  }

  /**
   * Get all visible steps.
   */
  getVisibleSteps(): StepNodeState[] {
    return this.stepper.getVisibleSteps()
  }

  /**
   * Check if the user can go back.
   */
  canGoBack(): boolean {
    return this.stepper.canGoBack()
  }

  /**
   * Check if the current step is the last.
   */
  isLastStep(): boolean {
    return this.stepper.isLastStep()
  }

  /**
   * Get progress information.
   */
  getProgress(): { current: number; total: number; percent: number } {
    return this.stepper.getProgress()
  }

  /**
   * Navigate to the next step.
   * Dispatches 'dfe:navigate' and 'dfe:index-change' events.
   */
  goNext(): StepNodeState | null {
    const result = this.stepper.goNext()
    const newIndex = this.stepper.getCurrentIndex()
    const currentStep = this.stepper.getCurrentStep()

    const navigateEvent = new CustomEvent('dfe:navigate', {
      detail: { direction: 'next' as const, newIndex, currentStep },
    })
    this.dispatchEvent(navigateEvent)

    const indexChangeEvent = new CustomEvent('dfe:index-change', {
      detail: { index: newIndex, currentStep },
    })
    this.dispatchEvent(indexChangeEvent)

    return result
  }

  /**
   * Navigate to the previous step.
   * Dispatches 'dfe:navigate' and 'dfe:index-change' events.
   */
  goBack(): StepNodeState | null {
    const result = this.stepper.goBack()
    const newIndex = this.stepper.getCurrentIndex()
    const currentStep = this.stepper.getCurrentStep()

    const navigateEvent = new CustomEvent('dfe:navigate', {
      detail: { direction: 'back' as const, newIndex, currentStep },
    })
    this.dispatchEvent(navigateEvent)

    const indexChangeEvent = new CustomEvent('dfe:index-change', {
      detail: { index: newIndex, currentStep },
    })
    this.dispatchEvent(indexChangeEvent)

    return result
  }

  /**
   * Jump to a specific step index.
   * Dispatches 'dfe:index-change' event.
   */
  jumpTo(index: number): void {
    this.stepper.jumpTo(index)
    const currentStep = this.stepper.getCurrentStep()

    const indexChangeEvent = new CustomEvent('dfe:index-change', {
      detail: { index, currentStep },
    })
    this.dispatchEvent(indexChangeEvent)
  }

  /**
   * Mark a step as complete.
   */
  markComplete(stepId: string): void {
    this.stepper.markComplete(stepId)
  }
}

// ─── Custom Event Types (for TypeScript) ────────────────────────────────────

declare global {
  interface GlobalEventHandlersEventMap {
    'dfe:navigate': StepNavigateEvent
    'dfe:index-change': StepIndexChangeEvent
    'dfe:step-visibility': StepVisibilityChangeEvent
  }
}
