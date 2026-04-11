import { type FormField, type FormValues, type FormEngine, type GraphPatch, type FieldNodeState } from '@dmc-98/dfe-core';
export interface DfeFormControllerConfig {
    /** Form field definitions */
    fields: FormField[];
    /** Pre-existing values to hydrate */
    initialValues?: FormValues;
}
export interface FormChangeEvent extends Event {
    detail: {
        key: string;
        value: unknown;
        patch: GraphPatch;
    };
}
export interface FormValidateEvent extends Event {
    detail: {
        success: boolean;
        errors: Record<string, string>;
    };
}
export interface FormVisibilityChangeEvent extends Event {
    detail: {
        visibleFields: FormField[];
    };
}
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
 * import { DfeFormController } from '@dmc-98/dfe-vanilla'
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
export declare class DfeFormController extends EventTarget {
    private engine;
    private fields;
    constructor(config: DfeFormControllerConfig);
    /**
     * Get the underlying engine instance.
     */
    getEngine(): FormEngine;
    /**
     * Get current form values.
     */
    getValues(): FormValues;
    /**
     * Get currently visible fields.
     */
    getVisibleFields(): FormField[];
    /**
     * Get all field definitions.
     */
    getFields(): FormField[];
    /**
     * Set a field value and trigger condition re-evaluation.
     * Dispatches 'dfe:change' and 'dfe:visibility' events.
     */
    setFieldValue(key: string, value: unknown): GraphPatch;
    /**
     * Get the state of a specific field.
     */
    getFieldState(key: string): FieldNodeState | undefined;
    /**
     * Validate all visible required fields.
     * Dispatches 'dfe:validation' event.
     */
    validate(): {
        success: boolean;
        errors: Record<string, string>;
    };
    /**
     * Validate a single step's fields.
     * Dispatches 'dfe:validation' event.
     */
    validateStep(stepId: string): {
        success: boolean;
        errors: Record<string, string>;
    };
    /**
     * Collect values for submission (excludes hidden/layout fields).
     */
    collectSubmissionValues(): FormValues;
    /**
     * Reset the controller with new fields/values.
     */
    reset(fields?: FormField[], values?: FormValues): void;
}
declare global {
    interface GlobalEventHandlersEventMap {
        'dfe:change': FormChangeEvent;
        'dfe:visibility': FormVisibilityChangeEvent;
        'dfe:validation': FormValidateEvent;
    }
}
