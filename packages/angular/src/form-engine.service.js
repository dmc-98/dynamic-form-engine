"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DfeFormEngineService = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const dfe_core_1 = require("@dmc--98/dfe-core");
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
let DfeFormEngineService = class DfeFormEngineService {
    constructor() {
        this.fields = [];
    }
    /**
     * Initialize the service with fields and optional initial values.
     * Must be called before using other methods.
     */
    init(config) {
        const { fields, initialValues, onChange } = config;
        this.fields = fields;
        this.engine = (0, dfe_core_1.createFormEngine)(fields, initialValues);
        this.valuesSubject = new rxjs_1.BehaviorSubject(this.engine.getValues());
        this.visibleFieldsSubject = new rxjs_1.BehaviorSubject(this.engine.getVisibleFields());
        this.values$ = this.valuesSubject.asObservable();
        this.visibleFields$ = this.visibleFieldsSubject.asObservable();
        this.onChange = onChange;
    }
    /**
     * Set a field value and trigger condition re-evaluation.
     */
    setFieldValue(key, value) {
        var _a;
        const patch = this.engine.setFieldValue(key, value);
        this.updateStores();
        (_a = this.onChange) === null || _a === void 0 ? void 0 : _a.call(this, key, value, patch);
        return patch;
    }
    /**
     * Get the state of a specific field.
     */
    getFieldState(key) {
        return this.engine.getFieldState(key);
    }
    /**
     * Validate all visible required fields.
     */
    validate() {
        return this.engine.validate();
    }
    /**
     * Validate a single step's fields.
     */
    validateStep(stepId) {
        return this.engine.validateStep(stepId);
    }
    /**
     * Collect values for submission (excludes hidden/layout fields).
     */
    collectSubmissionValues() {
        return this.engine.collectSubmissionValues();
    }
    /**
     * Reset the engine with new fields and values.
     */
    reset(fields, values) {
        this.fields = fields !== null && fields !== void 0 ? fields : this.fields;
        this.engine = (0, dfe_core_1.createFormEngine)(this.fields, values);
        this.updateStores();
    }
    /**
     * Get the underlying engine instance.
     */
    getEngine() {
        return this.engine;
    }
    /**
     * Get current values (snapshot).
     */
    getValues() {
        return this.engine.getValues();
    }
    /**
     * Get currently visible fields (snapshot).
     */
    getVisibleFields() {
        return this.engine.getVisibleFields();
    }
    updateStores() {
        this.valuesSubject.next(this.engine.getValues());
        this.visibleFieldsSubject.next(this.engine.getVisibleFields());
    }
};
exports.DfeFormEngineService = DfeFormEngineService;
exports.DfeFormEngineService = DfeFormEngineService = __decorate([
    (0, core_1.Injectable)()
], DfeFormEngineService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybS1lbmdpbmUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZvcm0tZW5naW5lLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsd0NBQTBDO0FBQzFDLCtCQUFrRDtBQUNsRCxrREFJNEI7QUFhNUIsK0VBQStFO0FBRS9FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlDRztBQUVJLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQW9CO0lBVy9CO1FBVFEsV0FBTSxHQUFnQixFQUFFLENBQUE7SUFTakIsQ0FBQztJQUVoQjs7O09BR0c7SUFDSCxJQUFJLENBQUMsTUFBa0M7UUFDckMsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEdBQUcsTUFBTSxDQUFBO1FBRWxELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUE7UUFDckQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLHNCQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1FBQ2pFLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLHNCQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUE7UUFFL0UsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFBO1FBQ2hELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxDQUFBO1FBRTlELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO0lBQzFCLENBQUM7SUFJRDs7T0FFRztJQUNILGFBQWEsQ0FBQyxHQUFXLEVBQUUsS0FBYzs7UUFDdkMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ25ELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUNuQixNQUFBLElBQUksQ0FBQyxRQUFRLHFEQUFHLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDbEMsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhLENBQUMsR0FBVztRQUN2QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDL0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsWUFBWSxDQUFDLE1BQWM7UUFDekIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUN6QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCx1QkFBdUI7UUFDckIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUE7SUFDOUMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE1BQW9CLEVBQUUsTUFBbUI7UUFDN0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLGFBQU4sTUFBTSxjQUFOLE1BQU0sR0FBSSxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ25ELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtJQUNyQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFBO0lBQ3BCLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVM7UUFDUCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUE7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsZ0JBQWdCO1FBQ2QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUE7SUFDdkMsQ0FBQztJQUVPLFlBQVk7UUFDbEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1FBQ2hELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUE7SUFDaEUsQ0FBQztDQUNGLENBQUE7QUF6R1ksb0RBQW9COytCQUFwQixvQkFBb0I7SUFEaEMsSUFBQSxpQkFBVSxHQUFFO0dBQ0Esb0JBQW9CLENBeUdoQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJ1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0LCBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcydcbmltcG9ydCB7XG4gIGNyZWF0ZUZvcm1FbmdpbmUsXG4gIHR5cGUgRm9ybUZpZWxkLCB0eXBlIEZvcm1WYWx1ZXMsIHR5cGUgRm9ybUVuZ2luZSxcbiAgdHlwZSBHcmFwaFBhdGNoLCB0eXBlIEZpZWxkTm9kZVN0YXRlLFxufSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuXG4vLyDilIDilIDilIAgVHlwZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBpbnRlcmZhY2UgRGZlRm9ybUVuZ2luZVNlcnZpY2VDb25maWcge1xuICAvKiogRm9ybSBmaWVsZCBkZWZpbml0aW9ucyAqL1xuICBmaWVsZHM6IEZvcm1GaWVsZFtdXG4gIC8qKiBQcmUtZXhpc3RpbmcgdmFsdWVzIHRvIGh5ZHJhdGUgKi9cbiAgaW5pdGlhbFZhbHVlcz86IEZvcm1WYWx1ZXNcbiAgLyoqIENhbGxiYWNrIHdoZW4gYW55IGZpZWxkIHZhbHVlIGNoYW5nZXMgKi9cbiAgb25DaGFuZ2U/OiAoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duLCBwYXRjaDogR3JhcGhQYXRjaCkgPT4gdm9pZFxufVxuXG4vLyDilIDilIDilIAgU2VydmljZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBBbmd1bGFyIGluamVjdGFibGUgc2VydmljZSB0aGF0IHdyYXBzIHRoZSBmb3JtIGVuZ2luZSB3aXRoIFJ4SlMgb2JzZXJ2YWJsZXMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnXG4gKiBpbXBvcnQgeyBEZmVGb3JtRW5naW5lU2VydmljZSB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWFuZ3VsYXInXG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnYXBwLWZvcm0nLFxuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxmb3JtIChuZ1N1Ym1pdCk9XCJoYW5kbGVTdWJtaXQoKVwiPlxuICogICAgICAgPGRpdiAqbmdGb3I9XCJsZXQgZmllbGQgb2YgdmlzaWJsZUZpZWxkcyQgfCBhc3luY1wiPlxuICogICAgICAgICA8YXBwLWZpZWxkLWNvbXBvbmVudFxuICogICAgICAgICAgIFtmaWVsZF09XCJmaWVsZFwiXG4gKiAgICAgICAgICAgW3ZhbHVlXT1cIih2YWx1ZXMkIHwgYXN5bmMpPy5bZmllbGQua2V5XVwiXG4gKiAgICAgICAgICAgKGNoYW5nZSk9XCJzZXRGaWVsZFZhbHVlKGZpZWxkLmtleSwgJGV2ZW50KVwiXG4gKiAgICAgICAgIC8+XG4gKiAgICAgICA8L2Rpdj5cbiAqICAgICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPlN1Ym1pdDwvYnV0dG9uPlxuICogICAgIDwvZm9ybT5cbiAqICAgYCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgRm9ybUNvbXBvbmVudCB7XG4gKiAgIHZhbHVlcyQgPSB0aGlzLmVuZ2luZVNlcnZpY2UudmFsdWVzJFxuICogICB2aXNpYmxlRmllbGRzJCA9IHRoaXMuZW5naW5lU2VydmljZS52aXNpYmxlRmllbGRzJFxuICpcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBlbmdpbmVTZXJ2aWNlOiBEZmVGb3JtRW5naW5lU2VydmljZSkge31cbiAqXG4gKiAgIHNldEZpZWxkVmFsdWUoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKSB7XG4gKiAgICAgdGhpcy5lbmdpbmVTZXJ2aWNlLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSlcbiAqICAgfVxuICpcbiAqICAgaGFuZGxlU3VibWl0KCkge1xuICogICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZW5naW5lU2VydmljZS52YWxpZGF0ZSgpXG4gKiAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gKiAgICAgICAvLyBzdWJtaXQgZm9ybVxuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBEZmVGb3JtRW5naW5lU2VydmljZSB7XG4gIHByaXZhdGUgZW5naW5lITogRm9ybUVuZ2luZVxuICBwcml2YXRlIGZpZWxkczogRm9ybUZpZWxkW10gPSBbXVxuICBwcml2YXRlIHZhbHVlc1N1YmplY3QhOiBCZWhhdmlvclN1YmplY3Q8Rm9ybVZhbHVlcz5cbiAgcHJpdmF0ZSB2aXNpYmxlRmllbGRzU3ViamVjdCE6IEJlaGF2aW9yU3ViamVjdDxGb3JtRmllbGRbXT5cblxuICAvKiogT2JzZXJ2YWJsZSBvZiBjdXJyZW50IGZvcm0gdmFsdWVzICovXG4gIHZhbHVlcyQhOiBPYnNlcnZhYmxlPEZvcm1WYWx1ZXM+XG4gIC8qKiBPYnNlcnZhYmxlIG9mIGN1cnJlbnRseSB2aXNpYmxlIGZpZWxkcyAqL1xuICB2aXNpYmxlRmllbGRzJCE6IE9ic2VydmFibGU8Rm9ybUZpZWxkW10+XG5cbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBzZXJ2aWNlIHdpdGggZmllbGRzIGFuZCBvcHRpb25hbCBpbml0aWFsIHZhbHVlcy5cbiAgICogTXVzdCBiZSBjYWxsZWQgYmVmb3JlIHVzaW5nIG90aGVyIG1ldGhvZHMuXG4gICAqL1xuICBpbml0KGNvbmZpZzogRGZlRm9ybUVuZ2luZVNlcnZpY2VDb25maWcpOiB2b2lkIHtcbiAgICBjb25zdCB7IGZpZWxkcywgaW5pdGlhbFZhbHVlcywgb25DaGFuZ2UgfSA9IGNvbmZpZ1xuXG4gICAgdGhpcy5maWVsZHMgPSBmaWVsZHNcbiAgICB0aGlzLmVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzLCBpbml0aWFsVmFsdWVzKVxuICAgIHRoaXMudmFsdWVzU3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3QodGhpcy5lbmdpbmUuZ2V0VmFsdWVzKCkpXG4gICAgdGhpcy52aXNpYmxlRmllbGRzU3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3QodGhpcy5lbmdpbmUuZ2V0VmlzaWJsZUZpZWxkcygpKVxuXG4gICAgdGhpcy52YWx1ZXMkID0gdGhpcy52YWx1ZXNTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpXG4gICAgdGhpcy52aXNpYmxlRmllbGRzJCA9IHRoaXMudmlzaWJsZUZpZWxkc1N1YmplY3QuYXNPYnNlcnZhYmxlKClcblxuICAgIHRoaXMub25DaGFuZ2UgPSBvbkNoYW5nZVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNoYW5nZT86IChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24sIHBhdGNoOiBHcmFwaFBhdGNoKSA9PiB2b2lkXG5cbiAgLyoqXG4gICAqIFNldCBhIGZpZWxkIHZhbHVlIGFuZCB0cmlnZ2VyIGNvbmRpdGlvbiByZS1ldmFsdWF0aW9uLlxuICAgKi9cbiAgc2V0RmllbGRWYWx1ZShrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24pOiBHcmFwaFBhdGNoIHtcbiAgICBjb25zdCBwYXRjaCA9IHRoaXMuZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSlcbiAgICB0aGlzLnVwZGF0ZVN0b3JlcygpXG4gICAgdGhpcy5vbkNoYW5nZT8uKGtleSwgdmFsdWUsIHBhdGNoKVxuICAgIHJldHVybiBwYXRjaFxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgc3RhdGUgb2YgYSBzcGVjaWZpYyBmaWVsZC5cbiAgICovXG4gIGdldEZpZWxkU3RhdGUoa2V5OiBzdHJpbmcpOiBGaWVsZE5vZGVTdGF0ZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZW5naW5lLmdldEZpZWxkU3RhdGUoa2V5KVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGFsbCB2aXNpYmxlIHJlcXVpcmVkIGZpZWxkcy5cbiAgICovXG4gIHZhbGlkYXRlKCk6IHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH0ge1xuICAgIHJldHVybiB0aGlzLmVuZ2luZS52YWxpZGF0ZSgpXG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgYSBzaW5nbGUgc3RlcCdzIGZpZWxkcy5cbiAgICovXG4gIHZhbGlkYXRlU3RlcChzdGVwSWQ6IHN0cmluZyk6IHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH0ge1xuICAgIHJldHVybiB0aGlzLmVuZ2luZS52YWxpZGF0ZVN0ZXAoc3RlcElkKVxuICB9XG5cbiAgLyoqXG4gICAqIENvbGxlY3QgdmFsdWVzIGZvciBzdWJtaXNzaW9uIChleGNsdWRlcyBoaWRkZW4vbGF5b3V0IGZpZWxkcykuXG4gICAqL1xuICBjb2xsZWN0U3VibWlzc2lvblZhbHVlcygpOiBGb3JtVmFsdWVzIHtcbiAgICByZXR1cm4gdGhpcy5lbmdpbmUuY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMoKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBlbmdpbmUgd2l0aCBuZXcgZmllbGRzIGFuZCB2YWx1ZXMuXG4gICAqL1xuICByZXNldChmaWVsZHM/OiBGb3JtRmllbGRbXSwgdmFsdWVzPzogRm9ybVZhbHVlcyk6IHZvaWQge1xuICAgIHRoaXMuZmllbGRzID0gZmllbGRzID8/IHRoaXMuZmllbGRzXG4gICAgdGhpcy5lbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRoaXMuZmllbGRzLCB2YWx1ZXMpXG4gICAgdGhpcy51cGRhdGVTdG9yZXMoKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdW5kZXJseWluZyBlbmdpbmUgaW5zdGFuY2UuXG4gICAqL1xuICBnZXRFbmdpbmUoKTogRm9ybUVuZ2luZSB7XG4gICAgcmV0dXJuIHRoaXMuZW5naW5lXG4gIH1cblxuICAvKipcbiAgICogR2V0IGN1cnJlbnQgdmFsdWVzIChzbmFwc2hvdCkuXG4gICAqL1xuICBnZXRWYWx1ZXMoKTogRm9ybVZhbHVlcyB7XG4gICAgcmV0dXJuIHRoaXMuZW5naW5lLmdldFZhbHVlcygpXG4gIH1cblxuICAvKipcbiAgICogR2V0IGN1cnJlbnRseSB2aXNpYmxlIGZpZWxkcyAoc25hcHNob3QpLlxuICAgKi9cbiAgZ2V0VmlzaWJsZUZpZWxkcygpOiBGb3JtRmllbGRbXSB7XG4gICAgcmV0dXJuIHRoaXMuZW5naW5lLmdldFZpc2libGVGaWVsZHMoKVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVTdG9yZXMoKTogdm9pZCB7XG4gICAgdGhpcy52YWx1ZXNTdWJqZWN0Lm5leHQodGhpcy5lbmdpbmUuZ2V0VmFsdWVzKCkpXG4gICAgdGhpcy52aXNpYmxlRmllbGRzU3ViamVjdC5uZXh0KHRoaXMuZW5naW5lLmdldFZpc2libGVGaWVsZHMoKSlcbiAgfVxufVxuIl19