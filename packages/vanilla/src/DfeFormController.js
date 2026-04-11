"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DfeFormController = void 0;
const dfe_core_1 = require("@dmc-98/dfe-core");
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
class DfeFormController extends EventTarget {
    constructor(config) {
        super();
        const { fields, initialValues } = config;
        this.fields = fields;
        this.engine = (0, dfe_core_1.createFormEngine)(fields, initialValues);
    }
    /**
     * Get the underlying engine instance.
     */
    getEngine() {
        return this.engine;
    }
    /**
     * Get current form values.
     */
    getValues() {
        return this.engine.getValues();
    }
    /**
     * Get currently visible fields.
     */
    getVisibleFields() {
        return this.engine.getVisibleFields();
    }
    /**
     * Get all field definitions.
     */
    getFields() {
        return this.fields;
    }
    /**
     * Set a field value and trigger condition re-evaluation.
     * Dispatches 'dfe:change' and 'dfe:visibility' events.
     */
    setFieldValue(key, value) {
        const patch = this.engine.setFieldValue(key, value);
        // Dispatch change event
        const changeEvent = new CustomEvent('dfe:change', {
            detail: { key, value, patch },
        });
        this.dispatchEvent(changeEvent);
        // Dispatch visibility event (conditions may have changed visibility)
        const visibleFields = this.engine.getVisibleFields();
        const visibilityEvent = new CustomEvent('dfe:visibility', {
            detail: { visibleFields },
        });
        this.dispatchEvent(visibilityEvent);
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
     * Dispatches 'dfe:validation' event.
     */
    validate() {
        const result = this.engine.validate();
        const validationEvent = new CustomEvent('dfe:validation', {
            detail: result,
        });
        this.dispatchEvent(validationEvent);
        return result;
    }
    /**
     * Validate a single step's fields.
     * Dispatches 'dfe:validation' event.
     */
    validateStep(stepId) {
        const result = this.engine.validateStep(stepId);
        const validationEvent = new CustomEvent('dfe:validation', {
            detail: result,
        });
        this.dispatchEvent(validationEvent);
        return result;
    }
    /**
     * Collect values for submission (excludes hidden/layout fields).
     */
    collectSubmissionValues() {
        return this.engine.collectSubmissionValues();
    }
    /**
     * Reset the controller with new fields/values.
     */
    reset(fields, values) {
        this.fields = fields !== null && fields !== void 0 ? fields : this.fields;
        this.engine = (0, dfe_core_1.createFormEngine)(this.fields, values !== null && values !== void 0 ? values : undefined);
        // Dispatch visibility event after reset
        const visibleFields = this.engine.getVisibleFields();
        const visibilityEvent = new CustomEvent('dfe:visibility', {
            detail: { visibleFields },
        });
        this.dispatchEvent(visibilityEvent);
    }
}
exports.DfeFormController = DfeFormController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGZlRm9ybUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZmVGb3JtQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFJNEI7QUFnQzVCLCtFQUErRTtBQUUvRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQ0c7QUFDSCxNQUFhLGlCQUFrQixTQUFRLFdBQVc7SUFJaEQsWUFBWSxNQUErQjtRQUN6QyxLQUFLLEVBQUUsQ0FBQTtRQUNQLE1BQU0sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsTUFBTSxDQUFBO1FBQ3hDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFDdkQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFBO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILGdCQUFnQjtRQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO0lBQ3ZDLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVM7UUFDUCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUE7SUFDcEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILGFBQWEsQ0FBQyxHQUFXLEVBQUUsS0FBYztRQUN2QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFFbkQsd0JBQXdCO1FBQ3hCLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLFlBQVksRUFBRTtZQUNoRCxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtTQUM5QixDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBRS9CLHFFQUFxRTtRQUNyRSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUE7UUFDcEQsTUFBTSxlQUFlLEdBQUcsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLEVBQUU7WUFDeEQsTUFBTSxFQUFFLEVBQUUsYUFBYSxFQUFFO1NBQzFCLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUE7UUFFbkMsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhLENBQUMsR0FBVztRQUN2QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxRQUFRO1FBQ04sTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUNyQyxNQUFNLGVBQWUsR0FBRyxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRTtZQUN4RCxNQUFNLEVBQUUsTUFBTTtTQUNmLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUE7UUFDbkMsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxDQUFDLE1BQWM7UUFDekIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDL0MsTUFBTSxlQUFlLEdBQUcsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLEVBQUU7WUFDeEQsTUFBTSxFQUFFLE1BQU07U0FDZixDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFBO1FBQ25DLE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsdUJBQXVCO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFBO0lBQzlDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxNQUFvQixFQUFFLE1BQW1CO1FBQzdDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxhQUFOLE1BQU0sY0FBTixNQUFNLEdBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQzVCLElBQUksQ0FBQyxNQUFNLEVBQ1gsTUFBTSxhQUFOLE1BQU0sY0FBTixNQUFNLEdBQUksU0FBUyxDQUNwQixDQUFBO1FBRUQsd0NBQXdDO1FBQ3hDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtRQUNwRCxNQUFNLGVBQWUsR0FBRyxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRTtZQUN4RCxNQUFNLEVBQUUsRUFBRSxhQUFhLEVBQUU7U0FDMUIsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQTtJQUNyQyxDQUFDO0NBQ0Y7QUF2SEQsOENBdUhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgY3JlYXRlRm9ybUVuZ2luZSxcbiAgdHlwZSBGb3JtRmllbGQsIHR5cGUgRm9ybVZhbHVlcywgdHlwZSBGb3JtRW5naW5lLFxuICB0eXBlIEdyYXBoUGF0Y2gsIHR5cGUgRmllbGROb2RlU3RhdGUsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5cbi8vIOKUgOKUgOKUgCBUeXBlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGludGVyZmFjZSBEZmVGb3JtQ29udHJvbGxlckNvbmZpZyB7XG4gIC8qKiBGb3JtIGZpZWxkIGRlZmluaXRpb25zICovXG4gIGZpZWxkczogRm9ybUZpZWxkW11cbiAgLyoqIFByZS1leGlzdGluZyB2YWx1ZXMgdG8gaHlkcmF0ZSAqL1xuICBpbml0aWFsVmFsdWVzPzogRm9ybVZhbHVlc1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZvcm1DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgZGV0YWlsOiB7XG4gICAga2V5OiBzdHJpbmdcbiAgICB2YWx1ZTogdW5rbm93blxuICAgIHBhdGNoOiBHcmFwaFBhdGNoXG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBGb3JtVmFsaWRhdGVFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgZGV0YWlsOiB7XG4gICAgc3VjY2VzczogYm9vbGVhblxuICAgIGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRm9ybVZpc2liaWxpdHlDaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgZGV0YWlsOiB7XG4gICAgdmlzaWJsZUZpZWxkczogRm9ybUZpZWxkW11cbiAgfVxufVxuXG4vLyDilIDilIDilIAgQ29udHJvbGxlciDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBWYW5pbGxhIEphdmFTY3JpcHQgZm9ybSBjb250cm9sbGVyIGV4dGVuZGluZyBFdmVudFRhcmdldCBmb3IgcmVhY3RpdmUgdXBkYXRlcy5cbiAqXG4gKiBEaXNwYXRjaGVzIGN1c3RvbSBldmVudHMgZm9yIHN0YXRlIGNoYW5nZXM6XG4gKiAtICdkZmU6Y2hhbmdlJzogRmlyZWQgd2hlbiBhIGZpZWxkIHZhbHVlIGNoYW5nZXNcbiAqIC0gJ2RmZTp2aXNpYmlsaXR5JzogRmlyZWQgd2hlbiB2aXNpYmxlIGZpZWxkcyBjaGFuZ2VcbiAqIC0gJ2RmZTp2YWxpZGF0aW9uJzogRmlyZWQgYWZ0ZXIgdmFsaWRhdGlvblxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQgeyBEZmVGb3JtQ29udHJvbGxlciB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLXZhbmlsbGEnXG4gKlxuICogY29uc3QgY29udHJvbGxlciA9IG5ldyBEZmVGb3JtQ29udHJvbGxlcih7XG4gKiAgIGZpZWxkczogbXlGb3JtRmllbGRzLFxuICogICBpbml0aWFsVmFsdWVzOiB7IG5hbWU6ICcnIH0sXG4gKiB9KVxuICpcbiAqIC8vIExpc3RlbiBmb3IgY2hhbmdlc1xuICogY29udHJvbGxlci5hZGRFdmVudExpc3RlbmVyKCdkZmU6Y2hhbmdlJywgKGUpID0+IHtcbiAqICAgY29uc3QgeyBrZXksIHZhbHVlIH0gPSAoZSBhcyBGb3JtQ2hhbmdlRXZlbnQpLmRldGFpbFxuICogICBjb25zb2xlLmxvZyhgRmllbGQgJHtrZXl9IGNoYW5nZWQgdG86YCwgdmFsdWUpXG4gKiB9KVxuICpcbiAqIC8vIExpc3RlbiBmb3IgdmlzaWJpbGl0eSBjaGFuZ2VzXG4gKiBjb250cm9sbGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2RmZTp2aXNpYmlsaXR5JywgKGUpID0+IHtcbiAqICAgY29uc3QgeyB2aXNpYmxlRmllbGRzIH0gPSAoZSBhcyBGb3JtVmlzaWJpbGl0eUNoYW5nZUV2ZW50KS5kZXRhaWxcbiAqICAgcmVuZGVyRm9ybSh2aXNpYmxlRmllbGRzKVxuICogfSlcbiAqXG4gKiAvLyBTZXQgYSBmaWVsZCB2YWx1ZVxuICogY29udHJvbGxlci5zZXRGaWVsZFZhbHVlKCdlbWFpbCcsICd1c2VyQGV4YW1wbGUuY29tJylcbiAqXG4gKiAvLyBWYWxpZGF0ZVxuICogY29uc3QgcmVzdWx0ID0gY29udHJvbGxlci52YWxpZGF0ZSgpXG4gKiBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAqICAgc3VibWl0KGNvbnRyb2xsZXIuZ2V0VmFsdWVzKCkpXG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIERmZUZvcm1Db250cm9sbGVyIGV4dGVuZHMgRXZlbnRUYXJnZXQge1xuICBwcml2YXRlIGVuZ2luZTogRm9ybUVuZ2luZVxuICBwcml2YXRlIGZpZWxkczogRm9ybUZpZWxkW11cblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IERmZUZvcm1Db250cm9sbGVyQ29uZmlnKSB7XG4gICAgc3VwZXIoKVxuICAgIGNvbnN0IHsgZmllbGRzLCBpbml0aWFsVmFsdWVzIH0gPSBjb25maWdcbiAgICB0aGlzLmZpZWxkcyA9IGZpZWxkc1xuICAgIHRoaXMuZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMsIGluaXRpYWxWYWx1ZXMpXG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB1bmRlcmx5aW5nIGVuZ2luZSBpbnN0YW5jZS5cbiAgICovXG4gIGdldEVuZ2luZSgpOiBGb3JtRW5naW5lIHtcbiAgICByZXR1cm4gdGhpcy5lbmdpbmVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCBmb3JtIHZhbHVlcy5cbiAgICovXG4gIGdldFZhbHVlcygpOiBGb3JtVmFsdWVzIHtcbiAgICByZXR1cm4gdGhpcy5lbmdpbmUuZ2V0VmFsdWVzKClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudGx5IHZpc2libGUgZmllbGRzLlxuICAgKi9cbiAgZ2V0VmlzaWJsZUZpZWxkcygpOiBGb3JtRmllbGRbXSB7XG4gICAgcmV0dXJuIHRoaXMuZW5naW5lLmdldFZpc2libGVGaWVsZHMoKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgZmllbGQgZGVmaW5pdGlvbnMuXG4gICAqL1xuICBnZXRGaWVsZHMoKTogRm9ybUZpZWxkW10ge1xuICAgIHJldHVybiB0aGlzLmZpZWxkc1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIGZpZWxkIHZhbHVlIGFuZCB0cmlnZ2VyIGNvbmRpdGlvbiByZS1ldmFsdWF0aW9uLlxuICAgKiBEaXNwYXRjaGVzICdkZmU6Y2hhbmdlJyBhbmQgJ2RmZTp2aXNpYmlsaXR5JyBldmVudHMuXG4gICAqL1xuICBzZXRGaWVsZFZhbHVlKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IEdyYXBoUGF0Y2gge1xuICAgIGNvbnN0IHBhdGNoID0gdGhpcy5lbmdpbmUuc2V0RmllbGRWYWx1ZShrZXksIHZhbHVlKVxuXG4gICAgLy8gRGlzcGF0Y2ggY2hhbmdlIGV2ZW50XG4gICAgY29uc3QgY2hhbmdlRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2RmZTpjaGFuZ2UnLCB7XG4gICAgICBkZXRhaWw6IHsga2V5LCB2YWx1ZSwgcGF0Y2ggfSxcbiAgICB9KVxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChjaGFuZ2VFdmVudClcblxuICAgIC8vIERpc3BhdGNoIHZpc2liaWxpdHkgZXZlbnQgKGNvbmRpdGlvbnMgbWF5IGhhdmUgY2hhbmdlZCB2aXNpYmlsaXR5KVxuICAgIGNvbnN0IHZpc2libGVGaWVsZHMgPSB0aGlzLmVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKClcbiAgICBjb25zdCB2aXNpYmlsaXR5RXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2RmZTp2aXNpYmlsaXR5Jywge1xuICAgICAgZGV0YWlsOiB7IHZpc2libGVGaWVsZHMgfSxcbiAgICB9KVxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh2aXNpYmlsaXR5RXZlbnQpXG5cbiAgICByZXR1cm4gcGF0Y2hcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHN0YXRlIG9mIGEgc3BlY2lmaWMgZmllbGQuXG4gICAqL1xuICBnZXRGaWVsZFN0YXRlKGtleTogc3RyaW5nKTogRmllbGROb2RlU3RhdGUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmVuZ2luZS5nZXRGaWVsZFN0YXRlKGtleSlcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBhbGwgdmlzaWJsZSByZXF1aXJlZCBmaWVsZHMuXG4gICAqIERpc3BhdGNoZXMgJ2RmZTp2YWxpZGF0aW9uJyBldmVudC5cbiAgICovXG4gIHZhbGlkYXRlKCk6IHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH0ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZW5naW5lLnZhbGlkYXRlKClcbiAgICBjb25zdCB2YWxpZGF0aW9uRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2RmZTp2YWxpZGF0aW9uJywge1xuICAgICAgZGV0YWlsOiByZXN1bHQsXG4gICAgfSlcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQodmFsaWRhdGlvbkV2ZW50KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBhIHNpbmdsZSBzdGVwJ3MgZmllbGRzLlxuICAgKiBEaXNwYXRjaGVzICdkZmU6dmFsaWRhdGlvbicgZXZlbnQuXG4gICAqL1xuICB2YWxpZGF0ZVN0ZXAoc3RlcElkOiBzdHJpbmcpOiB7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB9IHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLmVuZ2luZS52YWxpZGF0ZVN0ZXAoc3RlcElkKVxuICAgIGNvbnN0IHZhbGlkYXRpb25FdmVudCA9IG5ldyBDdXN0b21FdmVudCgnZGZlOnZhbGlkYXRpb24nLCB7XG4gICAgICBkZXRhaWw6IHJlc3VsdCxcbiAgICB9KVxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh2YWxpZGF0aW9uRXZlbnQpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIENvbGxlY3QgdmFsdWVzIGZvciBzdWJtaXNzaW9uIChleGNsdWRlcyBoaWRkZW4vbGF5b3V0IGZpZWxkcykuXG4gICAqL1xuICBjb2xsZWN0U3VibWlzc2lvblZhbHVlcygpOiBGb3JtVmFsdWVzIHtcbiAgICByZXR1cm4gdGhpcy5lbmdpbmUuY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMoKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBjb250cm9sbGVyIHdpdGggbmV3IGZpZWxkcy92YWx1ZXMuXG4gICAqL1xuICByZXNldChmaWVsZHM/OiBGb3JtRmllbGRbXSwgdmFsdWVzPzogRm9ybVZhbHVlcyk6IHZvaWQge1xuICAgIHRoaXMuZmllbGRzID0gZmllbGRzID8/IHRoaXMuZmllbGRzXG4gICAgdGhpcy5lbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKFxuICAgICAgdGhpcy5maWVsZHMsXG4gICAgICB2YWx1ZXMgPz8gdW5kZWZpbmVkLFxuICAgIClcblxuICAgIC8vIERpc3BhdGNoIHZpc2liaWxpdHkgZXZlbnQgYWZ0ZXIgcmVzZXRcbiAgICBjb25zdCB2aXNpYmxlRmllbGRzID0gdGhpcy5lbmdpbmUuZ2V0VmlzaWJsZUZpZWxkcygpXG4gICAgY29uc3QgdmlzaWJpbGl0eUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdkZmU6dmlzaWJpbGl0eScsIHtcbiAgICAgIGRldGFpbDogeyB2aXNpYmxlRmllbGRzIH0sXG4gICAgfSlcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQodmlzaWJpbGl0eUV2ZW50KVxuICB9XG59XG5cbi8vIOKUgOKUgOKUgCBDdXN0b20gRXZlbnQgVHlwZXMgKGZvciBUeXBlU2NyaXB0KSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgR2xvYmFsRXZlbnRIYW5kbGVyc0V2ZW50TWFwIHtcbiAgICAnZGZlOmNoYW5nZSc6IEZvcm1DaGFuZ2VFdmVudFxuICAgICdkZmU6dmlzaWJpbGl0eSc6IEZvcm1WaXNpYmlsaXR5Q2hhbmdlRXZlbnRcbiAgICAnZGZlOnZhbGlkYXRpb24nOiBGb3JtVmFsaWRhdGVFdmVudFxuICB9XG59XG4iXX0=