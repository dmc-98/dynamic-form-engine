import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import {
  createFormEngine,
  type FormField, type FormValues, type FormEngine,
  type GraphPatch, type FieldNodeState,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeFormEngineServiceConfig {
  /** Form field definitions */
  fields: FormField[]
  /** Pre-existing values to hydrate */
  initialValues?: FormValues
  /** Callback when any field value changes */
  onChange?: (key: string, value: unknown, patch: GraphPatch) => void
}

// ─── Service ────────────────────────────────────────────────────────────────

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
@Injectable()
export class DfeFormEngineService {
  private engine!: FormEngine
  private fields: FormField[] = []
  private valuesSubject!: BehaviorSubject<FormValues>
  private visibleFieldsSubject!: BehaviorSubject<FormField[]>

  /** Observable of current form values */
  values$!: Observable<FormValues>
  /** Observable of currently visible fields */
  visibleFields$!: Observable<FormField[]>

  constructor() {}

  /**
   * Initialize the service with fields and optional initial values.
   * Must be called before using other methods.
   */
  init(config: DfeFormEngineServiceConfig): void {
    const { fields, initialValues, onChange } = config

    this.fields = fields
    this.engine = createFormEngine(fields, initialValues)
    this.valuesSubject = new BehaviorSubject(this.engine.getValues())
    this.visibleFieldsSubject = new BehaviorSubject(this.engine.getVisibleFields())

    this.values$ = this.valuesSubject.asObservable()
    this.visibleFields$ = this.visibleFieldsSubject.asObservable()

    this.onChange = onChange
  }

  private onChange?: (key: string, value: unknown, patch: GraphPatch) => void

  /**
   * Set a field value and trigger condition re-evaluation.
   */
  setFieldValue(key: string, value: unknown): GraphPatch {
    const patch = this.engine.setFieldValue(key, value)
    this.updateStores()
    this.onChange?.(key, value, patch)
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
   */
  validate(): { success: boolean; errors: Record<string, string> } {
    return this.engine.validate()
  }

  /**
   * Validate a single step's fields.
   */
  validateStep(stepId: string): { success: boolean; errors: Record<string, string> } {
    return this.engine.validateStep(stepId)
  }

  /**
   * Collect values for submission (excludes hidden/layout fields).
   */
  collectSubmissionValues(): FormValues {
    return this.engine.collectSubmissionValues()
  }

  /**
   * Reset the engine with new fields and values.
   */
  reset(fields?: FormField[], values?: FormValues): void {
    this.fields = fields ?? this.fields
    this.engine = createFormEngine(this.fields, values)
    this.updateStores()
  }

  /**
   * Get the underlying engine instance.
   */
  getEngine(): FormEngine {
    return this.engine
  }

  /**
   * Get current values (snapshot).
   */
  getValues(): FormValues {
    return this.engine.getValues()
  }

  /**
   * Get currently visible fields (snapshot).
   */
  getVisibleFields(): FormField[] {
    return this.engine.getVisibleFields()
  }

  private updateStores(): void {
    this.valuesSubject.next(this.engine.getValues())
    this.visibleFieldsSubject.next(this.engine.getVisibleFields())
  }
}
