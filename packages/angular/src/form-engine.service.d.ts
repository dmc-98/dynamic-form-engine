import { Observable } from 'rxjs';
import { type FormField, type FormValues, type FormEngine, type GraphPatch, type FieldNodeState } from '@dmc--98/dfe-core';
export interface DfeFormEngineServiceConfig {
    /** Form field definitions */
    fields: FormField[];
    /** Pre-existing values to hydrate */
    initialValues?: FormValues;
    /** Callback when any field value changes */
    onChange?: (key: string, value: unknown, patch: GraphPatch) => void;
}
/**
 * Angular injectable service that wraps the form engine with RxJS observables.
 *
 * @example
 * ```typescript
 * import { Component } from '@angular/core'
 * import { DfeFormEngineService } from '@dmc--98/dfe-angular'
 *
 * @Component({
 *   selector: 'app-form',
 *   template: `
 *     <form (ngSubmit)="handleSubmit()">
 *       <div *ngFor="let field of visibleFields$ | async">
 *         <app-field-component
 *           [field]="field"
 *           [value]="(values$ | async)?.[field.key]"
 *           (change)="setFieldValue(field.key, $event)"
 *         />
 *       </div>
 *       <button type="submit">Submit</button>
 *     </form>
 *   `,
 * })
 * export class FormComponent {
 *   values$ = this.engineService.values$
 *   visibleFields$ = this.engineService.visibleFields$
 *
 *   constructor(private engineService: DfeFormEngineService) {}
 *
 *   setFieldValue(key: string, value: unknown) {
 *     this.engineService.setFieldValue(key, value)
 *   }
 *
 *   handleSubmit() {
 *     const result = this.engineService.validate()
 *     if (result.success) {
 *       // submit form
 *     }
 *   }
 * }
 * ```
 */
export declare class DfeFormEngineService {
    private engine;
    private fields;
    private valuesSubject;
    private visibleFieldsSubject;
    /** Observable of current form values */
    values$: Observable<FormValues>;
    /** Observable of currently visible fields */
    visibleFields$: Observable<FormField[]>;
    constructor();
    /**
     * Initialize the service with fields and optional initial values.
     * Must be called before using other methods.
     */
    init(config: DfeFormEngineServiceConfig): void;
    private onChange?;
    /**
     * Set a field value and trigger condition re-evaluation.
     */
    setFieldValue(key: string, value: unknown): GraphPatch;
    /**
     * Get the state of a specific field.
     */
    getFieldState(key: string): FieldNodeState | undefined;
    /**
     * Validate all visible required fields.
     */
    validate(): {
        success: boolean;
        errors: Record<string, string>;
    };
    /**
     * Validate a single step's fields.
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
     * Reset the engine with new fields and values.
     */
    reset(fields?: FormField[], values?: FormValues): void;
    /**
     * Get the underlying engine instance.
     */
    getEngine(): FormEngine;
    /**
     * Get current values (snapshot).
     */
    getValues(): FormValues;
    /**
     * Get currently visible fields (snapshot).
     */
    getVisibleFields(): FormField[];
    private updateStores;
}
