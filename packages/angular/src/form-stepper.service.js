"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DfeFormStepperService = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const dfe_core_1 = require("@dmc-98/dfe-core");
// ─── Service ────────────────────────────────────────────────────────────────
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
let DfeFormStepperService = class DfeFormStepperService {
    constructor() { }
    /**
     * Initialize the service with steps and engine.
     * Must be called before using other methods.
     */
    init(config) {
        const { steps, engine, initialIndex, onNavigate, onIndexChange } = config;
        this.stepper = (0, dfe_core_1.createFormStepper)(steps, engine, initialIndex);
        this.currentStepSubject = new rxjs_1.BehaviorSubject(this.stepper.getCurrentStep());
        this.currentIndexSubject = new rxjs_1.BehaviorSubject(this.stepper.getCurrentIndex());
        this.visibleStepsSubject = new rxjs_1.BehaviorSubject(this.stepper.getVisibleSteps());
        this.canGoBackSubject = new rxjs_1.BehaviorSubject(this.stepper.canGoBack());
        this.isLastStepSubject = new rxjs_1.BehaviorSubject(this.stepper.isLastStep());
        this.progressSubject = new rxjs_1.BehaviorSubject(this.stepper.getProgress());
        this.currentStep$ = this.currentStepSubject.asObservable();
        this.currentIndex$ = this.currentIndexSubject.asObservable();
        this.visibleSteps$ = this.visibleStepsSubject.asObservable();
        this.canGoBack$ = this.canGoBackSubject.asObservable();
        this.isLastStep$ = this.isLastStepSubject.asObservable();
        this.progress$ = this.progressSubject.asObservable();
        this.onNavigate = onNavigate;
        this.onIndexChange = onIndexChange;
    }
    /**
     * Navigate to the next step.
     */
    goNext() {
        var _a, _b;
        const result = this.stepper.goNext();
        const newIndex = this.stepper.getCurrentIndex();
        this.updateStores();
        (_a = this.onNavigate) === null || _a === void 0 ? void 0 : _a.call(this, 'next', newIndex);
        (_b = this.onIndexChange) === null || _b === void 0 ? void 0 : _b.call(this, newIndex);
        return result;
    }
    /**
     * Navigate to the previous step.
     */
    goBack() {
        var _a, _b;
        const result = this.stepper.goBack();
        const newIndex = this.stepper.getCurrentIndex();
        this.updateStores();
        (_a = this.onNavigate) === null || _a === void 0 ? void 0 : _a.call(this, 'back', newIndex);
        (_b = this.onIndexChange) === null || _b === void 0 ? void 0 : _b.call(this, newIndex);
        return result;
    }
    /**
     * Jump to a specific step index.
     */
    jumpTo(index) {
        var _a;
        this.stepper.jumpTo(index);
        this.updateStores();
        (_a = this.onIndexChange) === null || _a === void 0 ? void 0 : _a.call(this, index);
    }
    /**
     * Mark a step as complete.
     */
    markComplete(stepId) {
        this.stepper.markComplete(stepId);
        this.updateStores();
    }
    /**
     * Get the underlying stepper instance.
     */
    getStepper() {
        return this.stepper;
    }
    /**
     * Get current step (snapshot).
     */
    getCurrentStep() {
        return this.stepper.getCurrentStep();
    }
    /**
     * Get current step index (snapshot).
     */
    getCurrentIndex() {
        return this.stepper.getCurrentIndex();
    }
    /**
     * Get visible steps (snapshot).
     */
    getVisibleSteps() {
        return this.stepper.getVisibleSteps();
    }
    /**
     * Get progress info (snapshot).
     */
    getProgress() {
        return this.stepper.getProgress();
    }
    /**
     * Check if user can go back (snapshot).
     */
    getCanGoBack() {
        return this.stepper.canGoBack();
    }
    /**
     * Check if current step is the last (snapshot).
     */
    getIsLastStep() {
        return this.stepper.isLastStep();
    }
    updateStores() {
        this.currentStepSubject.next(this.stepper.getCurrentStep());
        this.currentIndexSubject.next(this.stepper.getCurrentIndex());
        this.visibleStepsSubject.next(this.stepper.getVisibleSteps());
        this.canGoBackSubject.next(this.stepper.canGoBack());
        this.isLastStepSubject.next(this.stepper.isLastStep());
        this.progressSubject.next(this.stepper.getProgress());
    }
};
exports.DfeFormStepperService = DfeFormStepperService;
exports.DfeFormStepperService = DfeFormStepperService = __decorate([
    (0, core_1.Injectable)()
], DfeFormStepperService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybS1zdGVwcGVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmb3JtLXN0ZXBwZXIuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSx3Q0FBMEM7QUFDMUMsK0JBQWtEO0FBQ2xELGtEQUk0QjtBQXFCNUIsK0VBQStFO0FBRS9FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Q0c7QUFFSSxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtJQXNCaEMsZ0JBQWUsQ0FBQztJQUVoQjs7O09BR0c7SUFDSCxJQUFJLENBQUMsTUFBbUM7UUFDdEMsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsR0FBRyxNQUFNLENBQUE7UUFFekUsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLDRCQUFpQixFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUE7UUFFN0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksc0JBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUE7UUFDNUUsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksc0JBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUE7UUFDOUUsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksc0JBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUE7UUFDOUUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksc0JBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7UUFDckUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksc0JBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFD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SUFDbkMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsWUFBWTtRQUNWLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtJQUNqQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhO1FBQ1gsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ2xDLENBQUM7SUFFTyxZQUFZO1FBQ2xCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFBO1FBQzNELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFBO1FBQzdELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFBO1FBQzdELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1FBQ3BELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFBO1FBQ3RELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQTtJQUN2RCxDQUFDO0NBQ0YsQ0FBQTtBQXhKWSxzREFBcUI7Z0NBQXJCLHFCQUFxQjtJQURqQyxJQUFBLGlCQUFVLEdBQUU7R0FDQSxxQkFBcUIsQ0F3SmpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnXG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzJ1xuaW1wb3J0IHtcbiAgY3JlYXRlRm9ybVN0ZXBwZXIsXG4gIHR5cGUgRm9ybUVuZ2luZSwgdHlwZSBGb3JtU3RlcCwgdHlwZSBGb3JtU3RlcHBlcixcbiAgdHlwZSBTdGVwTm9kZVN0YXRlLFxufSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuXG4vLyDilIDilIDilIAgVHlwZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBpbnRlcmZhY2UgRGZlRm9ybVN0ZXBwZXJTZXJ2aWNlQ29uZmlnIHtcbiAgLyoqIFN0ZXAgZGVmaW5pdGlvbnMgKi9cbiAgc3RlcHM6IEZvcm1TdGVwW11cbiAgLyoqIFRoZSBmb3JtIGVuZ2luZSBpbnN0YW5jZSAqL1xuICBlbmdpbmU6IEZvcm1FbmdpbmVcbiAgLyoqIEluaXRpYWwgc3RlcCBpbmRleCAqL1xuICBpbml0aWFsSW5kZXg/OiBudW1iZXJcbiAgLyoqXG4gICAqIENhbGxlZCBhZnRlciBuYXZpZ2F0aW9uIG9jY3VycyAoYmFjayBvciBuZXh0KS5cbiAgICovXG4gIG9uTmF2aWdhdGU/OiAoZGlyZWN0aW9uOiAnYmFjaycgfCAnbmV4dCcsIG5ld0luZGV4OiBudW1iZXIpID0+IHZvaWRcbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuZXZlciB0aGUgY3VycmVudCBzdGVwIGluZGV4IGNoYW5nZXMuXG4gICAqL1xuICBvbkluZGV4Q2hhbmdlPzogKGluZGV4OiBudW1iZXIpID0+IHZvaWRcbn1cblxuLy8g4pSA4pSA4pSAIFNlcnZpY2Ug4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbi8qKlxuICogQW5ndWxhciBpbmplY3RhYmxlIHNlcnZpY2UgZm9yIG11bHRpLXN0ZXAgZm9ybSBuYXZpZ2F0aW9uIHdpdGggUnhKUyBvYnNlcnZhYmxlcy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSdcbiAqIGltcG9ydCB7IERmZUZvcm1TdGVwcGVyU2VydmljZSB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWFuZ3VsYXInXG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnYXBwLW11bHRpLXN0ZXAtZm9ybScsXG4gKiAgIHRlbXBsYXRlOiBgXG4gKiAgICAgPGRpdj5cbiAqICAgICAgIDxoMj57eyAoY3VycmVudFN0ZXAkIHwgYXN5bmMpPy5zdGVwLnRpdGxlIH19PC9oMj5cbiAqICAgICAgIDxwPlN0ZXAge3sgKHByb2dyZXNzJCB8IGFzeW5jKT8uY3VycmVudCB9fSBvZiB7eyAocHJvZ3Jlc3MkIHwgYXN5bmMpPy50b3RhbCB9fTwvcD5cbiAqXG4gKiAgICAgICA8YnV0dG9uICpuZ0lmPVwiKGNhbkdvQmFjayQgfCBhc3luYylcIiAoY2xpY2spPVwiZ29CYWNrKClcIj5CYWNrPC9idXR0b24+XG4gKiAgICAgICA8YnV0dG9uICpuZ0lmPVwiKGlzTGFzdFN0ZXAkIHwgYXN5bmMpOyBlbHNlIG5leHRCdG5cIiAoY2xpY2spPVwiaGFuZGxlU3VibWl0KClcIj5TdWJtaXQ8L2J1dHRvbj5cbiAqICAgICAgIDxuZy10ZW1wbGF0ZSAjbmV4dEJ0bj5cbiAqICAgICAgICAgPGJ1dHRvbiAoY2xpY2spPVwiZ29OZXh0KClcIj5OZXh0PC9idXR0b24+XG4gKiAgICAgICA8L25nLXRlbXBsYXRlPlxuICogICAgIDwvZGl2PlxuICogICBgLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNdWx0aVN0ZXBGb3JtQ29tcG9uZW50IHtcbiAqICAgY3VycmVudFN0ZXAkID0gdGhpcy5zdGVwcGVyU2VydmljZS5jdXJyZW50U3RlcCRcbiAqICAgdmlzaWJsZVN0ZXBzJCA9IHRoaXMuc3RlcHBlclNlcnZpY2UudmlzaWJsZVN0ZXBzJFxuICogICBjYW5Hb0JhY2skID0gdGhpcy5zdGVwcGVyU2VydmljZS5jYW5Hb0JhY2skXG4gKiAgIGlzTGFzdFN0ZXAkID0gdGhpcy5zdGVwcGVyU2VydmljZS5pc0xhc3RTdGVwJFxuICogICBwcm9ncmVzcyQgPSB0aGlzLnN0ZXBwZXJTZXJ2aWNlLnByb2dyZXNzJFxuICpcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBzdGVwcGVyU2VydmljZTogRGZlRm9ybVN0ZXBwZXJTZXJ2aWNlKSB7fVxuICpcbiAqICAgZ29OZXh0KCkge1xuICogICAgIHRoaXMuc3RlcHBlclNlcnZpY2UuZ29OZXh0KClcbiAqICAgfVxuICpcbiAqICAgZ29CYWNrKCkge1xuICogICAgIHRoaXMuc3RlcHBlclNlcnZpY2UuZ29CYWNrKClcbiAqICAgfVxuICpcbiAqICAgaGFuZGxlU3VibWl0KCkge1xuICogICAgIC8vIHN1Ym1pdCBmb3JtXG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRGZlRm9ybVN0ZXBwZXJTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBzdGVwcGVyITogRm9ybVN0ZXBwZXJcbiAgcHJpdmF0ZSBjdXJyZW50U3RlcFN1YmplY3QhOiBCZWhhdmlvclN1YmplY3Q8U3RlcE5vZGVTdGF0ZSB8IG51bGw+XG4gIHByaXZhdGUgY3VycmVudEluZGV4U3ViamVjdCE6IEJlaGF2aW9yU3ViamVjdDxudW1iZXI+XG4gIHByaXZhdGUgdmlzaWJsZVN0ZXBzU3ViamVjdCE6IEJlaGF2aW9yU3ViamVjdDxTdGVwTm9kZVN0YXRlW10+XG4gIHByaXZhdGUgY2FuR29CYWNrU3ViamVjdCE6IEJlaGF2aW9yU3ViamVjdDxib29sZWFuPlxuICBwcml2YXRlIGlzTGFzdFN0ZXBTdWJqZWN0ITogQmVoYXZpb3JTdWJqZWN0PGJvb2xlYW4+XG4gIHByaXZhdGUgcHJvZ3Jlc3NTdWJqZWN0ITogQmVoYXZpb3JTdWJqZWN0PHsgY3VycmVudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyOyBwZXJjZW50OiBudW1iZXIgfT5cblxuICAvKiogT2JzZXJ2YWJsZSBvZiBjdXJyZW50IHN0ZXAgKi9cbiAgY3VycmVudFN0ZXAkITogT2JzZXJ2YWJsZTxTdGVwTm9kZVN0YXRlIHwgbnVsbD5cbiAgLyoqIE9ic2VydmFibGUgb2YgY3VycmVudCBzdGVwIGluZGV4ICovXG4gIGN1cnJlbnRJbmRleCQhOiBPYnNlcnZhYmxlPG51bWJlcj5cbiAgLyoqIE9ic2VydmFibGUgb2YgYWxsIHZpc2libGUgc3RlcHMgKi9cbiAgdmlzaWJsZVN0ZXBzJCE6IE9ic2VydmFibGU8U3RlcE5vZGVTdGF0ZVtdPlxuICAvKiogT2JzZXJ2YWJsZSBvZiB3aGV0aGVyIHVzZXIgY2FuIGdvIGJhY2sgKi9cbiAgY2FuR29CYWNrJCE6IE9ic2VydmFibGU8Ym9vbGVhbj5cbiAgLyoqIE9ic2VydmFibGUgb2Ygd2hldGhlciBjdXJyZW50IHN0ZXAgaXMgdGhlIGxhc3QgKi9cbiAgaXNMYXN0U3RlcCQhOiBPYnNlcnZhYmxlPGJvb2xlYW4+XG4gIC8qKiBPYnNlcnZhYmxlIG9mIHByb2dyZXNzIGluZm8gKi9cbiAgcHJvZ3Jlc3MkITogT2JzZXJ2YWJsZTx7IGN1cnJlbnQ6IG51bWJlcjsgdG90YWw6IG51bWJlcjsgcGVyY2VudDogbnVtYmVyIH0+XG5cbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBzZXJ2aWNlIHdpdGggc3RlcHMgYW5kIGVuZ2luZS5cbiAgICogTXVzdCBiZSBjYWxsZWQgYmVmb3JlIHVzaW5nIG90aGVyIG1ldGhvZHMuXG4gICAqL1xuICBpbml0KGNvbmZpZzogRGZlRm9ybVN0ZXBwZXJTZXJ2aWNlQ29uZmlnKTogdm9pZCB7XG4gICAgY29uc3QgeyBzdGVwcywgZW5naW5lLCBpbml0aWFsSW5kZXgsIG9uTmF2aWdhdGUsIG9uSW5kZXhDaGFuZ2UgfSA9IGNvbmZpZ1xuXG4gICAgdGhpcy5zdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSwgaW5pdGlhbEluZGV4KVxuXG4gICAgdGhpcy5jdXJyZW50U3RlcFN1YmplY3QgPSBuZXcgQmVoYXZpb3JTdWJqZWN0KHRoaXMuc3RlcHBlci5nZXRDdXJyZW50U3RlcCgpKVxuICAgIHRoaXMuY3VycmVudEluZGV4U3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3QodGhpcy5zdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpKVxuICAgIHRoaXMudmlzaWJsZVN0ZXBzU3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3QodGhpcy5zdGVwcGVyLmdldFZpc2libGVTdGVwcygpKVxuICAgIHRoaXMuY2FuR29CYWNrU3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3QodGhpcy5zdGVwcGVyLmNhbkdvQmFjaygpKVxuICAgIHRoaXMuaXNMYXN0U3RlcFN1YmplY3QgPSBuZXcgQmVoYXZpb3JTdWJqZWN0KHRoaXMuc3RlcHBlci5pc0xhc3RTdGVwKCkpXG4gICAgdGhpcy5wcm9ncmVzc1N1YmplY3QgPSBuZXcgQmVoYXZpb3JTdWJqZWN0KHRoaXMuc3RlcHBlci5nZXRQcm9ncmVzcygpKVxuXG4gICAgdGhpcy5jdXJyZW50U3RlcCQgPSB0aGlzLmN1cnJlbnRTdGVwU3ViamVjdC5hc09ic2VydmFibGUoKVxuICAgIHRoaXMuY3VycmVudEluZGV4JCA9IHRoaXMuY3VycmVudEluZGV4U3ViamVjdC5hc09ic2VydmFibGUoKVxuICAgIHRoaXMudmlzaWJsZVN0ZXBzJCA9IHRoaXMudmlzaWJsZVN0ZXBzU3ViamVjdC5hc09ic2VydmFibGUoKVxuICAgIHRoaXMuY2FuR29CYWNrJCA9IHRoaXMuY2FuR29CYWNrU3ViamVjdC5hc09ic2VydmFibGUoKVxuICAgIHRoaXMuaXNMYXN0U3RlcCQgPSB0aGlzLmlzTGFzdFN0ZXBTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpXG4gICAgdGhpcy5wcm9ncmVzcyQgPSB0aGlzLnByb2dyZXNzU3ViamVjdC5hc09ic2VydmFibGUoKVxuXG4gICAgdGhpcy5vbk5hdmlnYXRlID0gb25OYXZpZ2F0ZVxuICAgIHRoaXMub25JbmRleENoYW5nZSA9IG9uSW5kZXhDaGFuZ2VcbiAgfVxuXG4gIHByaXZhdGUgb25OYXZpZ2F0ZT86IChkaXJlY3Rpb246ICdiYWNrJyB8ICduZXh0JywgbmV3SW5kZXg6IG51bWJlcikgPT4gdm9pZFxuICBwcml2YXRlIG9uSW5kZXhDaGFuZ2U/OiAoaW5kZXg6IG51bWJlcikgPT4gdm9pZFxuXG4gIC8qKlxuICAgKiBOYXZpZ2F0ZSB0byB0aGUgbmV4dCBzdGVwLlxuICAgKi9cbiAgZ29OZXh0KCk6IFN0ZXBOb2RlU3RhdGUgfCBudWxsIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnN0ZXBwZXIuZ29OZXh0KClcbiAgICBjb25zdCBuZXdJbmRleCA9IHRoaXMuc3RlcHBlci5nZXRDdXJyZW50SW5kZXgoKVxuICAgIHRoaXMudXBkYXRlU3RvcmVzKClcbiAgICB0aGlzLm9uTmF2aWdhdGU/LignbmV4dCcsIG5ld0luZGV4KVxuICAgIHRoaXMub25JbmRleENoYW5nZT8uKG5ld0luZGV4KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBOYXZpZ2F0ZSB0byB0aGUgcHJldmlvdXMgc3RlcC5cbiAgICovXG4gIGdvQmFjaygpOiBTdGVwTm9kZVN0YXRlIHwgbnVsbCB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5zdGVwcGVyLmdvQmFjaygpXG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLnN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KClcbiAgICB0aGlzLnVwZGF0ZVN0b3JlcygpXG4gICAgdGhpcy5vbk5hdmlnYXRlPy4oJ2JhY2snLCBuZXdJbmRleClcbiAgICB0aGlzLm9uSW5kZXhDaGFuZ2U/LihuZXdJbmRleClcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogSnVtcCB0byBhIHNwZWNpZmljIHN0ZXAgaW5kZXguXG4gICAqL1xuICBqdW1wVG8oaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuc3RlcHBlci5qdW1wVG8oaW5kZXgpXG4gICAgdGhpcy51cGRhdGVTdG9yZXMoKVxuICAgIHRoaXMub25JbmRleENoYW5nZT8uKGluZGV4KVxuICB9XG5cbiAgLyoqXG4gICAqIE1hcmsgYSBzdGVwIGFzIGNvbXBsZXRlLlxuICAgKi9cbiAgbWFya0NvbXBsZXRlKHN0ZXBJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zdGVwcGVyLm1hcmtDb21wbGV0ZShzdGVwSWQpXG4gICAgdGhpcy51cGRhdGVTdG9yZXMoKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdW5kZXJseWluZyBzdGVwcGVyIGluc3RhbmNlLlxuICAgKi9cbiAgZ2V0U3RlcHBlcigpOiBGb3JtU3RlcHBlciB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcHBlclxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjdXJyZW50IHN0ZXAgKHNuYXBzaG90KS5cbiAgICovXG4gIGdldEN1cnJlbnRTdGVwKCk6IFN0ZXBOb2RlU3RhdGUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5zdGVwcGVyLmdldEN1cnJlbnRTdGVwKClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCBzdGVwIGluZGV4IChzbmFwc2hvdCkuXG4gICAqL1xuICBnZXRDdXJyZW50SW5kZXgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5zdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpXG4gIH1cblxuICAvKipcbiAgICogR2V0IHZpc2libGUgc3RlcHMgKHNuYXBzaG90KS5cbiAgICovXG4gIGdldFZpc2libGVTdGVwcygpOiBTdGVwTm9kZVN0YXRlW10ge1xuICAgIHJldHVybiB0aGlzLnN0ZXBwZXIuZ2V0VmlzaWJsZVN0ZXBzKClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcHJvZ3Jlc3MgaW5mbyAoc25hcHNob3QpLlxuICAgKi9cbiAgZ2V0UHJvZ3Jlc3MoKTogeyBjdXJyZW50OiBudW1iZXI7IHRvdGFsOiBudW1iZXI7IHBlcmNlbnQ6IG51bWJlciB9IHtcbiAgICByZXR1cm4gdGhpcy5zdGVwcGVyLmdldFByb2dyZXNzKClcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB1c2VyIGNhbiBnbyBiYWNrIChzbmFwc2hvdCkuXG4gICAqL1xuICBnZXRDYW5Hb0JhY2soKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcHBlci5jYW5Hb0JhY2soKVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGN1cnJlbnQgc3RlcCBpcyB0aGUgbGFzdCAoc25hcHNob3QpLlxuICAgKi9cbiAgZ2V0SXNMYXN0U3RlcCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGVwcGVyLmlzTGFzdFN0ZXAoKVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVTdG9yZXMoKTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50U3RlcFN1YmplY3QubmV4dCh0aGlzLnN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXAoKSlcbiAgICB0aGlzLmN1cnJlbnRJbmRleFN1YmplY3QubmV4dCh0aGlzLnN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KCkpXG4gICAgdGhpcy52aXNpYmxlU3RlcHNTdWJqZWN0Lm5leHQodGhpcy5zdGVwcGVyLmdldFZpc2libGVTdGVwcygpKVxuICAgIHRoaXMuY2FuR29CYWNrU3ViamVjdC5uZXh0KHRoaXMuc3RlcHBlci5jYW5Hb0JhY2soKSlcbiAgICB0aGlzLmlzTGFzdFN0ZXBTdWJqZWN0Lm5leHQodGhpcy5zdGVwcGVyLmlzTGFzdFN0ZXAoKSlcbiAgICB0aGlzLnByb2dyZXNzU3ViamVjdC5uZXh0KHRoaXMuc3RlcHBlci5nZXRQcm9ncmVzcygpKVxuICB9XG59XG4iXX0=