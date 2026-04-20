"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DfeStepController = void 0;
const dfe_core_1 = require("@dmc--98/dfe-core");
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
class DfeStepController extends EventTarget {
    constructor(config) {
        super();
        const { steps, engine, initialIndex } = config;
        this.stepper = (0, dfe_core_1.createFormStepper)(steps, engine, initialIndex);
    }
    /**
     * Get the underlying stepper instance.
     */
    getStepper() {
        return this.stepper;
    }
    /**
     * Get the current step.
     */
    getCurrentStep() {
        return this.stepper.getCurrentStep();
    }
    /**
     * Get the current step index.
     */
    getCurrentIndex() {
        return this.stepper.getCurrentIndex();
    }
    /**
     * Get all visible steps.
     */
    getVisibleSteps() {
        return this.stepper.getVisibleSteps();
    }
    /**
     * Check if the user can go back.
     */
    canGoBack() {
        return this.stepper.canGoBack();
    }
    /**
     * Check if the current step is the last.
     */
    isLastStep() {
        return this.stepper.isLastStep();
    }
    /**
     * Get progress information.
     */
    getProgress() {
        return this.stepper.getProgress();
    }
    /**
     * Navigate to the next step.
     * Dispatches 'dfe:navigate' and 'dfe:index-change' events.
     */
    goNext() {
        const result = this.stepper.goNext();
        const newIndex = this.stepper.getCurrentIndex();
        const currentStep = this.stepper.getCurrentStep();
        const navigateEvent = new CustomEvent('dfe:navigate', {
            detail: { direction: 'next', newIndex, currentStep },
        });
        this.dispatchEvent(navigateEvent);
        const indexChangeEvent = new CustomEvent('dfe:index-change', {
            detail: { index: newIndex, currentStep },
        });
        this.dispatchEvent(indexChangeEvent);
        return result;
    }
    /**
     * Navigate to the previous step.
     * Dispatches 'dfe:navigate' and 'dfe:index-change' events.
     */
    goBack() {
        const result = this.stepper.goBack();
        const newIndex = this.stepper.getCurrentIndex();
        const currentStep = this.stepper.getCurrentStep();
        const navigateEvent = new CustomEvent('dfe:navigate', {
            detail: { direction: 'back', newIndex, currentStep },
        });
        this.dispatchEvent(navigateEvent);
        const indexChangeEvent = new CustomEvent('dfe:index-change', {
            detail: { index: newIndex, currentStep },
        });
        this.dispatchEvent(indexChangeEvent);
        return result;
    }
    /**
     * Jump to a specific step index.
     * Dispatches 'dfe:index-change' event.
     */
    jumpTo(index) {
        this.stepper.jumpTo(index);
        const currentStep = this.stepper.getCurrentStep();
        const indexChangeEvent = new CustomEvent('dfe:index-change', {
            detail: { index, currentStep },
        });
        this.dispatchEvent(indexChangeEvent);
    }
    /**
     * Mark a step as complete.
     */
    markComplete(stepId) {
        this.stepper.markComplete(stepId);
    }
}
exports.DfeStepController = DfeStepController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGZlU3RlcENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZmVTdGVwQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFJNEI7QUFrQzVCLCtFQUErRTtBQUUvRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQ0c7QUFDSCxNQUFhLGlCQUFrQixTQUFRLFdBQVc7SUFHaEQsWUFBWSxNQUErQjtRQUN6QyxLQUFLLEVBQUUsQ0FBQTtRQUNQLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHLE1BQU0sQ0FBQTtRQUM5QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsNEJBQWlCLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQTtJQUMvRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxVQUFVO1FBQ1IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFBO0lBQ3JCLENBQUM7SUFFRDs7T0FFRztJQUNILGNBQWM7UUFDWixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUE7SUFDdEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsZUFBZTtRQUNiLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQTtJQUN2QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxlQUFlO1FBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBQ3ZDLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVM7UUFDUCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUE7SUFDakMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsVUFBVTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUNsQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQ25DLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNO1FBQ0osTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFBO1FBQy9DLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUE7UUFFakQsTUFBTSxhQUFhLEdBQUcsSUFBSSxXQUFXLENBQUMsY0FBYyxFQUFFO1lBQ3BELE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFlLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtTQUM5RCxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1FBRWpDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxXQUFXLENBQUMsa0JBQWtCLEVBQUU7WUFDM0QsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUU7U0FDekMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBRXBDLE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU07UUFDSixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFBO1FBQ3BDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUE7UUFDL0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQTtRQUVqRCxNQUFNLGFBQWEsR0FBRyxJQUFJLFdBQVcsQ0FBQyxjQUFjLEVBQUU7WUFDcEQsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQWUsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO1NBQzlELENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUE7UUFFakMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRTtZQUMzRCxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtTQUN6QyxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUE7UUFFcEMsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTSxDQUFDLEtBQWE7UUFDbEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDMUIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQTtRQUVqRCxNQUFNLGdCQUFnQixHQUFHLElBQUksV0FBVyxDQUFDLGtCQUFrQixFQUFFO1lBQzNELE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7U0FDL0IsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO0lBQ3RDLENBQUM7SUFFRDs7T0FFRztJQUNILFlBQVksQ0FBQyxNQUFjO1FBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ25DLENBQUM7Q0FDRjtBQTFIRCw4Q0EwSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBjcmVhdGVGb3JtU3RlcHBlcixcbiAgdHlwZSBGb3JtRW5naW5lLCB0eXBlIEZvcm1TdGVwLCB0eXBlIEZvcm1TdGVwcGVyLFxuICB0eXBlIFN0ZXBOb2RlU3RhdGUsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5cbi8vIOKUgOKUgOKUgCBUeXBlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGludGVyZmFjZSBEZmVTdGVwQ29udHJvbGxlckNvbmZpZyB7XG4gIC8qKiBTdGVwIGRlZmluaXRpb25zICovXG4gIHN0ZXBzOiBGb3JtU3RlcFtdXG4gIC8qKiBUaGUgZm9ybSBlbmdpbmUgaW5zdGFuY2UgKi9cbiAgZW5naW5lOiBGb3JtRW5naW5lXG4gIC8qKiBJbml0aWFsIHN0ZXAgaW5kZXggKi9cbiAgaW5pdGlhbEluZGV4PzogbnVtYmVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RlcE5hdmlnYXRlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG4gIGRldGFpbDoge1xuICAgIGRpcmVjdGlvbjogJ2JhY2snIHwgJ25leHQnXG4gICAgbmV3SW5kZXg6IG51bWJlclxuICAgIGN1cnJlbnRTdGVwOiBTdGVwTm9kZVN0YXRlIHwgbnVsbFxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RlcEluZGV4Q2hhbmdlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG4gIGRldGFpbDoge1xuICAgIGluZGV4OiBudW1iZXJcbiAgICBjdXJyZW50U3RlcDogU3RlcE5vZGVTdGF0ZSB8IG51bGxcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0ZXBWaXNpYmlsaXR5Q2hhbmdlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG4gIGRldGFpbDoge1xuICAgIHZpc2libGVTdGVwczogU3RlcE5vZGVTdGF0ZVtdXG4gIH1cbn1cblxuLy8g4pSA4pSA4pSAIENvbnRyb2xsZXIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbi8qKlxuICogVmFuaWxsYSBKYXZhU2NyaXB0IHN0ZXAgY29udHJvbGxlciBleHRlbmRpbmcgRXZlbnRUYXJnZXQgZm9yIG11bHRpLXN0ZXAgZm9ybSBuYXZpZ2F0aW9uLlxuICpcbiAqIERpc3BhdGNoZXMgY3VzdG9tIGV2ZW50cyBmb3IgbmF2aWdhdGlvbjpcbiAqIC0gJ2RmZTpuYXZpZ2F0ZSc6IEZpcmVkIHdoZW4gbmF2aWdhdGluZyAoYmFjay9uZXh0KVxuICogLSAnZGZlOmluZGV4LWNoYW5nZSc6IEZpcmVkIHdoZW4gc3RlcCBpbmRleCBjaGFuZ2VzXG4gKiAtICdkZmU6c3RlcC12aXNpYmlsaXR5JzogUmVzZXJ2ZWQgZm9yIHZpc2libGUgc3RlcCBjaGFuZ2VzXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IERmZUZvcm1Db250cm9sbGVyLCBEZmVTdGVwQ29udHJvbGxlciB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLXZhbmlsbGEnXG4gKlxuICogY29uc3QgZm9ybUNvbnRyb2xsZXIgPSBuZXcgRGZlRm9ybUNvbnRyb2xsZXIoeyBmaWVsZHM6IG15RmllbGRzIH0pXG4gKiBjb25zdCBzdGVwQ29udHJvbGxlciA9IG5ldyBEZmVTdGVwQ29udHJvbGxlcih7XG4gKiAgIHN0ZXBzOiBteVN0ZXBzLFxuICogICBlbmdpbmU6IGZvcm1Db250cm9sbGVyLmdldEVuZ2luZSgpLFxuICogfSlcbiAqXG4gKiAvLyBMaXN0ZW4gZm9yIG5hdmlnYXRpb25cbiAqIHN0ZXBDb250cm9sbGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2RmZTpuYXZpZ2F0ZScsIChlKSA9PiB7XG4gKiAgIGNvbnN0IHsgZGlyZWN0aW9uLCBuZXdJbmRleCB9ID0gKGUgYXMgU3RlcE5hdmlnYXRlRXZlbnQpLmRldGFpbFxuICogICBjb25zb2xlLmxvZyhgTmF2aWdhdGVkICR7ZGlyZWN0aW9ufSB0byBzdGVwICR7bmV3SW5kZXh9YClcbiAqIH0pXG4gKlxuICogLy8gTGlzdGVuIGZvciBpbmRleCBjaGFuZ2VzXG4gKiBzdGVwQ29udHJvbGxlci5hZGRFdmVudExpc3RlbmVyKCdkZmU6aW5kZXgtY2hhbmdlJywgKGUpID0+IHtcbiAqICAgY29uc3QgeyBpbmRleCwgY3VycmVudFN0ZXAgfSA9IChlIGFzIFN0ZXBJbmRleENoYW5nZUV2ZW50KS5kZXRhaWxcbiAqICAgcmVuZGVyU3RlcEhlYWRlcihjdXJyZW50U3RlcD8uc3RlcC50aXRsZSlcbiAqIH0pXG4gKlxuICogLy8gTmF2aWdhdGVcbiAqIHN0ZXBDb250cm9sbGVyLmdvTmV4dCgpXG4gKiBzdGVwQ29udHJvbGxlci5nb0JhY2soKVxuICogc3RlcENvbnRyb2xsZXIuanVtcFRvKDIpXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIERmZVN0ZXBDb250cm9sbGVyIGV4dGVuZHMgRXZlbnRUYXJnZXQge1xuICBwcml2YXRlIHN0ZXBwZXI6IEZvcm1TdGVwcGVyXG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBEZmVTdGVwQ29udHJvbGxlckNvbmZpZykge1xuICAgIHN1cGVyKClcbiAgICBjb25zdCB7IHN0ZXBzLCBlbmdpbmUsIGluaXRpYWxJbmRleCB9ID0gY29uZmlnXG4gICAgdGhpcy5zdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSwgaW5pdGlhbEluZGV4KVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdW5kZXJseWluZyBzdGVwcGVyIGluc3RhbmNlLlxuICAgKi9cbiAgZ2V0U3RlcHBlcigpOiBGb3JtU3RlcHBlciB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcHBlclxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCBzdGVwLlxuICAgKi9cbiAgZ2V0Q3VycmVudFN0ZXAoKTogU3RlcE5vZGVTdGF0ZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXAoKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCBzdGVwIGluZGV4LlxuICAgKi9cbiAgZ2V0Q3VycmVudEluZGV4KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcHBlci5nZXRDdXJyZW50SW5kZXgoKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgdmlzaWJsZSBzdGVwcy5cbiAgICovXG4gIGdldFZpc2libGVTdGVwcygpOiBTdGVwTm9kZVN0YXRlW10ge1xuICAgIHJldHVybiB0aGlzLnN0ZXBwZXIuZ2V0VmlzaWJsZVN0ZXBzKClcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgdXNlciBjYW4gZ28gYmFjay5cbiAgICovXG4gIGNhbkdvQmFjaygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGVwcGVyLmNhbkdvQmFjaygpXG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgc3RlcCBpcyB0aGUgbGFzdC5cbiAgICovXG4gIGlzTGFzdFN0ZXAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcHBlci5pc0xhc3RTdGVwKClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcHJvZ3Jlc3MgaW5mb3JtYXRpb24uXG4gICAqL1xuICBnZXRQcm9ncmVzcygpOiB7IGN1cnJlbnQ6IG51bWJlcjsgdG90YWw6IG51bWJlcjsgcGVyY2VudDogbnVtYmVyIH0ge1xuICAgIHJldHVybiB0aGlzLnN0ZXBwZXIuZ2V0UHJvZ3Jlc3MoKVxuICB9XG5cbiAgLyoqXG4gICAqIE5hdmlnYXRlIHRvIHRoZSBuZXh0IHN0ZXAuXG4gICAqIERpc3BhdGNoZXMgJ2RmZTpuYXZpZ2F0ZScgYW5kICdkZmU6aW5kZXgtY2hhbmdlJyBldmVudHMuXG4gICAqL1xuICBnb05leHQoKTogU3RlcE5vZGVTdGF0ZSB8IG51bGwge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc3RlcHBlci5nb05leHQoKVxuICAgIGNvbnN0IG5ld0luZGV4ID0gdGhpcy5zdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpXG4gICAgY29uc3QgY3VycmVudFN0ZXAgPSB0aGlzLnN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXAoKVxuXG4gICAgY29uc3QgbmF2aWdhdGVFdmVudCA9IG5ldyBDdXN0b21FdmVudCgnZGZlOm5hdmlnYXRlJywge1xuICAgICAgZGV0YWlsOiB7IGRpcmVjdGlvbjogJ25leHQnIGFzIGNvbnN0LCBuZXdJbmRleCwgY3VycmVudFN0ZXAgfSxcbiAgICB9KVxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuYXZpZ2F0ZUV2ZW50KVxuXG4gICAgY29uc3QgaW5kZXhDaGFuZ2VFdmVudCA9IG5ldyBDdXN0b21FdmVudCgnZGZlOmluZGV4LWNoYW5nZScsIHtcbiAgICAgIGRldGFpbDogeyBpbmRleDogbmV3SW5kZXgsIGN1cnJlbnRTdGVwIH0sXG4gICAgfSlcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoaW5kZXhDaGFuZ2VFdmVudClcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBOYXZpZ2F0ZSB0byB0aGUgcHJldmlvdXMgc3RlcC5cbiAgICogRGlzcGF0Y2hlcyAnZGZlOm5hdmlnYXRlJyBhbmQgJ2RmZTppbmRleC1jaGFuZ2UnIGV2ZW50cy5cbiAgICovXG4gIGdvQmFjaygpOiBTdGVwTm9kZVN0YXRlIHwgbnVsbCB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5zdGVwcGVyLmdvQmFjaygpXG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLnN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KClcbiAgICBjb25zdCBjdXJyZW50U3RlcCA9IHRoaXMuc3RlcHBlci5nZXRDdXJyZW50U3RlcCgpXG5cbiAgICBjb25zdCBuYXZpZ2F0ZUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdkZmU6bmF2aWdhdGUnLCB7XG4gICAgICBkZXRhaWw6IHsgZGlyZWN0aW9uOiAnYmFjaycgYXMgY29uc3QsIG5ld0luZGV4LCBjdXJyZW50U3RlcCB9LFxuICAgIH0pXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5hdmlnYXRlRXZlbnQpXG5cbiAgICBjb25zdCBpbmRleENoYW5nZUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdkZmU6aW5kZXgtY2hhbmdlJywge1xuICAgICAgZGV0YWlsOiB7IGluZGV4OiBuZXdJbmRleCwgY3VycmVudFN0ZXAgfSxcbiAgICB9KVxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChpbmRleENoYW5nZUV2ZW50KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEp1bXAgdG8gYSBzcGVjaWZpYyBzdGVwIGluZGV4LlxuICAgKiBEaXNwYXRjaGVzICdkZmU6aW5kZXgtY2hhbmdlJyBldmVudC5cbiAgICovXG4gIGp1bXBUbyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5zdGVwcGVyLmp1bXBUbyhpbmRleClcbiAgICBjb25zdCBjdXJyZW50U3RlcCA9IHRoaXMuc3RlcHBlci5nZXRDdXJyZW50U3RlcCgpXG5cbiAgICBjb25zdCBpbmRleENoYW5nZUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdkZmU6aW5kZXgtY2hhbmdlJywge1xuICAgICAgZGV0YWlsOiB7IGluZGV4LCBjdXJyZW50U3RlcCB9LFxuICAgIH0pXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KGluZGV4Q2hhbmdlRXZlbnQpXG4gIH1cblxuICAvKipcbiAgICogTWFyayBhIHN0ZXAgYXMgY29tcGxldGUuXG4gICAqL1xuICBtYXJrQ29tcGxldGUoc3RlcElkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnN0ZXBwZXIubWFya0NvbXBsZXRlKHN0ZXBJZClcbiAgfVxufVxuXG4vLyDilIDilIDilIAgQ3VzdG9tIEV2ZW50IFR5cGVzIChmb3IgVHlwZVNjcmlwdCkg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIEdsb2JhbEV2ZW50SGFuZGxlcnNFdmVudE1hcCB7XG4gICAgJ2RmZTpuYXZpZ2F0ZSc6IFN0ZXBOYXZpZ2F0ZUV2ZW50XG4gICAgJ2RmZTppbmRleC1jaGFuZ2UnOiBTdGVwSW5kZXhDaGFuZ2VFdmVudFxuICAgICdkZmU6c3RlcC12aXNpYmlsaXR5JzogU3RlcFZpc2liaWxpdHlDaGFuZ2VFdmVudFxuICB9XG59XG4iXX0=