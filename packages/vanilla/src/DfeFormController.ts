import {
  createFormEngine,
  type FormField, type FormValues, type FormEngine,
  type GraphPatch, type FieldNodeState,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeFormControllerConfig {
  /** Form field definitions */
  fields: FormField[]
  /** Pre-existing values to hydrate */
  initialValues?: FormValues
}

export interface FormChangeEvent extends Event {
  detail: {
    key: string
    value: unknown
    patch: GraphPatch
  }
}

export interface FormValidateEvent extends Event {
  detail: {
    success: boolean
    errors: Record<string, string>
  }
}

export interface FormVisibilityChangeEvent extends Event {
  detail: {
    visibleFields: FormField[]
  }
}

// ─── Controller ─────────────────────────────────────────────────────────────

/**
 * Vanilla JavaScript form controller extending EventTarget for reactive updates.
 *
 * Dispatches custom events for state changes:
 * - 'dfe:change': Fired when a field value changes
 * - 'dfe:visibility': Fired when visible fields change
 * - 'dfe:validation': Fired after validation
 *
 * @example
 * ```typescript
 * import { DfeFormController } from '@dmc--98/dfe-vanilla'
 *
 * const controller = new DfeFormController({
 *   fields: myFormFields,
 *   initialValues: { name: '' },
 * })
 *
 * // Listen for changes
 * controller.addEventListener('dfe:change', (e) => {
 *   const { key, value } = (e as FormChangeEvent).detail
 *   console.log(`Field ${key} changed to:`, value)
 * })
 *
 * // Listen for visibility changes
 * controller.addEventListener('dfe:visibility', (e) => {
 *   const { visibleFields } = (e as FormVisibilityChangeEvent).detail
 *   renderForm(visibleFields)
 * })
 *
 * // Set a field value
 * controller.setFieldValue('email', 'user@example.com')
 *
 * // Validate
 * const result = controller.validate()
 * if (result.success) {
 *   submit(controller.getValues())
 * }
 * ```
 */
export class DfeFormController extends EventTarget {
  private engine: FormEngine
  private fields: FormField[]

  constructor(config: DfeFormControllerConfig) {
    super()
    const { fields, initialValues } = config
    this.fields = fields
    this.engine = createFormEngine(fields, initialValues)
  }

  /**
   * Get the underlying engine instance.
   */
  getEngine(): FormEngine {
    return this.engine
  }

  /**
   * Get current form values.
   */
  getValues(): FormValues {
    return this.engine.getValues()
  }

  /**
   * Get currently visible fields.
   */
  getVisibleFields(): FormField[] {
    return this.engine.getVisibleFields()
  }

  /**
   * Get all field definitions.
   */
  getFields(): FormField[] {
    return this.fields
  }

  /**
   * Set a field value and trigger condition re-evaluation.
   * Dispatches 'dfe:change' and 'dfe:visibility' events.
   */
  setFieldValue(key: string, value: unknown): GraphPatch {
    const patch = this.engine.setFieldValue(key, value)

    // Dispatch change event
    const changeEvent = new CustomEvent('dfe:change', {
      detail: { key, value, patch },
    })
    this.dispatchEvent(changeEvent)

    // Dispatch visibility event (conditions may have changed visibility)
    const visibleFields = this.engine.getVisibleFields()
    const visibilityEvent = new CustomEvent('dfe:visibility', {
      detail: { visibleFields },
    })
    this.dispatchEvent(visibilityEvent)

    return patch
  }

  /**
   * Get the state of a specific field.
   */
  getFieldState(key: string): FieldNodeState | undefined {
    return this.engine.getFieldState(key)
  }

  /**
   * Validate all visible required fields.
   * Dispatches 'dfe:validation' event.
   */
  validate(): { success: boolean; errors: Record<string, string> } {
    const result = this.engine.validate()
    const validationEvent = new CustomEvent('dfe:validation', {
      detail: result,
    })
    this.dispatchEvent(validationEvent)
    return result
  }

  /**
   * Validate a single step's fields.
   * Dispatches 'dfe:validation' event.
   */
  validateStep(stepId: string): { success: boolean; errors: Record<string, string> } {
    const result = this.engine.validateStep(stepId)
    const validationEvent = new CustomEvent('dfe:validation', {
      detail: result,
    })
    this.dispatchEvent(validationEvent)
    return result
  }

  /**
   * Collect values for submission (excludes hidden/layout fields).
   */
  collectSubmissionValues(): FormValues {
    return this.engine.collectSubmissionValues()
  }

  /**
   * Reset the controller with new fields/values.
   */
  reset(fields?: FormField[], values?: FormValues): void {
    this.fields = fields ?? this.fields
    this.engine = createFormEngine(
      this.fields,
      values ?? undefined,
    )

    // Dispatch visibility event after reset
    const visibleFields = this.engine.getVisibleFields()
    const visibilityEvent = new CustomEvent('dfe:visibility', {
      detail: { visibleFields },
    })
    this.dispatchEvent(visibilityEvent)
  }
}

// ─── Custom Event Types (for TypeScript) ────────────────────────────────────

declare global {
  interface GlobalEventHandlersEventMap {
    'dfe:change': FormChangeEvent
    'dfe:visibility': FormVisibilityChangeEvent
    'dfe:validation': FormValidateEvent
  }
}
