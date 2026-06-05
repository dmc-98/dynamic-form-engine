"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFormStepper = createFormStepper;
const solid_js_1 = require("solid-js");
const dfe_core_1 = require("@dmc--98/dfe-core");
// ─── Composable ─────────────────────────────────────────────────────────────
/**
 * Solid.js primitive for multi-step form navigation using signals and memos.
 *
 * @example
 * ```tsx
 * import { createFormEngine, createFormStepper } from '@dmc--98/dfe-solid'
 * import { Show } from 'solid-js'
 *
 * export function MultiStepForm(props: { formData: any }) {
 *   const engine = createFormEngine({ fields: props.formData.fields })
 *   const stepper = createFormStepper({
 *     steps: props.formData.steps,
 *     engine: engine.engine,
 *   })
 *
 *   return (
 *     <div>
 *       <h2>{stepper.currentStep()?.step.title}</h2>
 *       <p>
 *         Step {stepper.progress().current} of {stepper.progress().total}
 *       </p>
 *
 *       <Show when={stepper.canGoBack()}>
 *         <button onClick={() => stepper.goBack()}>Back</button>
 *       </Show>
 *
 *       <Show
 *         when={stepper.isLastStep()}
 *         fallback={<button onClick={() => stepper.goNext()}>Next</button>}
 *       >
 *         <button onClick={handleSubmit}>Submit</button>
 *       </Show>
 *     </div>
 *   )
 * }
 * ```
 */
function createFormStepper(options) {
    const { steps, engine, initialIndex, onNavigate, onIndexChange } = options;
    const [tick, setTick] = (0, solid_js_1.createSignal)(0);
    const stepper = (0, dfe_core_1.createFormStepper)(steps, engine, initialIndex);
    const goNext = () => {
        const result = stepper.goNext();
        const newIndex = stepper.getCurrentIndex();
        setTick(t => t + 1);
        onNavigate === null || onNavigate === void 0 ? void 0 : onNavigate('next', newIndex);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange(newIndex);
        return result;
    };
    const goBack = () => {
        const result = stepper.goBack();
        const newIndex = stepper.getCurrentIndex();
        setTick(t => t + 1);
        onNavigate === null || onNavigate === void 0 ? void 0 : onNavigate('back', newIndex);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange(newIndex);
        return result;
    };
    const jumpTo = (index) => {
        stepper.jumpTo(index);
        setTick(t => t + 1);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange(index);
    };
    const markComplete = (stepId) => {
        stepper.markComplete(stepId);
        setTick(t => t + 1);
    };
    const currentStep = (0, solid_js_1.createMemo)(() => {
        tick();
        return stepper.getCurrentStep();
    });
    const currentIndex = (0, solid_js_1.createMemo)(() => {
        tick();
        return stepper.getCurrentIndex();
    });
    const visibleSteps = (0, solid_js_1.createMemo)(() => {
        tick();
        return stepper.getVisibleSteps();
    });
    const canGoBack = (0, solid_js_1.createMemo)(() => {
        tick();
        return stepper.canGoBack();
    });
    const isLastStep = (0, solid_js_1.createMemo)(() => {
        tick();
        return stepper.isLastStep();
    });
    const progress = (0, solid_js_1.createMemo)(() => {
        tick();
        return stepper.getProgress();
    });
    return {
        stepper,
        currentStep,
        currentIndex,
        visibleSteps,
        canGoBack,
        isLastStep,
        goNext,
        goBack,
        jumpTo,
        markComplete,
        progress,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlRm9ybVN0ZXBwZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVhdGVGb3JtU3RlcHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTBGQSw4Q0FpRkM7QUEzS0QsdUNBQTZEO0FBQzdELGtEQUk0QjtBQThDNUIsK0VBQStFO0FBRS9FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FvQ0c7QUFDSCxTQUFnQixpQkFBaUIsQ0FDL0IsT0FBd0M7SUFFeEMsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsR0FBRyxPQUFPLENBQUE7SUFFMUUsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxJQUFBLHVCQUFZLEVBQUMsQ0FBQyxDQUFDLENBQUE7SUFFdkMsTUFBTSxPQUFPLEdBQUcsSUFBQSw0QkFBcUIsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFBO0lBRWxFLE1BQU0sTUFBTSxHQUFHLEdBQXlCLEVBQUU7UUFDeEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFBO1FBQy9CLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQTtRQUMxQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDbkIsVUFBVSxhQUFWLFVBQVUsdUJBQVYsVUFBVSxDQUFHLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUM5QixhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUcsUUFBUSxDQUFDLENBQUE7UUFDekIsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDLENBQUE7SUFFRCxNQUFNLE1BQU0sR0FBRyxHQUF5QixFQUFFO1FBQ3hDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUMvQixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUE7UUFDMUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ25CLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDOUIsYUFBYSxhQUFiLGFBQWEsdUJBQWIsYUFBYSxDQUFHLFFBQVEsQ0FBQyxDQUFBO1FBQ3pCLE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQyxDQUFBO0lBRUQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxLQUFhLEVBQVEsRUFBRTtRQUNyQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3JCLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUNuQixhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUcsS0FBSyxDQUFDLENBQUE7SUFDeEIsQ0FBQyxDQUFBO0lBRUQsTUFBTSxZQUFZLEdBQUcsQ0FBQyxNQUFjLEVBQVEsRUFBRTtRQUM1QyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzVCLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUNyQixDQUFDLENBQUE7SUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFBLHFCQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ2xDLElBQUksRUFBRSxDQUFBO1FBQ04sT0FBTyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUE7SUFDakMsQ0FBQyxDQUFDLENBQUE7SUFFRixNQUFNLFlBQVksR0FBRyxJQUFBLHFCQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ25DLElBQUksRUFBRSxDQUFBO1FBQ04sT0FBTyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUE7SUFDbEMsQ0FBQyxDQUFDLENBQUE7SUFFRixNQUFNLFlBQVksR0FBRyxJQUFBLHFCQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ25DLElBQUksRUFBRSxDQUFBO1FBQ04sT0FBTyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUE7SUFDbEMsQ0FBQyxDQUFDLENBQUE7SUFFRixNQUFNLFNBQVMsR0FBRyxJQUFBLHFCQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ2hDLElBQUksRUFBRSxDQUFBO1FBQ04sT0FBTyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUE7SUFDNUIsQ0FBQyxDQUFDLENBQUE7SUFFRixNQUFNLFVBQVUsR0FBRyxJQUFBLHFCQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ2pDLElBQUksRUFBRSxDQUFBO1FBQ04sT0FBTyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUE7SUFDN0IsQ0FBQyxDQUFDLENBQUE7SUFFRixNQUFNLFFBQVEsR0FBRyxJQUFBLHFCQUFVLEVBQUMsR0FBRyxFQUFFO1FBQy9CLElBQUksRUFBRSxDQUFBO1FBQ04sT0FBTyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDOUIsQ0FBQyxDQUFDLENBQUE7SUFFRixPQUFPO1FBQ0wsT0FBTztRQUNQLFdBQVc7UUFDWCxZQUFZO1FBQ1osWUFBWTtRQUNaLFNBQVM7UUFDVCxVQUFVO1FBQ1YsTUFBTTtRQUNOLE1BQU07UUFDTixNQUFNO1FBQ04sWUFBWTtRQUNaLFFBQVE7S0FDVCxDQUFBO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVNpZ25hbCwgY3JlYXRlTWVtbywgQWNjZXNzb3IgfSBmcm9tICdzb2xpZC1qcydcbmltcG9ydCB7XG4gIGNyZWF0ZUZvcm1TdGVwcGVyIGFzIGNvcmVDcmVhdGVGb3JtU3RlcHBlcixcbiAgdHlwZSBGb3JtRW5naW5lLCB0eXBlIEZvcm1TdGVwLCB0eXBlIEZvcm1TdGVwcGVyLFxuICB0eXBlIFN0ZXBOb2RlU3RhdGUsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5cbi8vIOKUgOKUgOKUgCBUeXBlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVGb3JtU3RlcHBlclNpZ25hbHNPcHRpb25zIHtcbiAgLyoqIFN0ZXAgZGVmaW5pdGlvbnMgKi9cbiAgc3RlcHM6IEZvcm1TdGVwW11cbiAgLyoqIFRoZSBmb3JtIGVuZ2luZSBpbnN0YW5jZSAqL1xuICBlbmdpbmU6IEZvcm1FbmdpbmVcbiAgLyoqIEluaXRpYWwgc3RlcCBpbmRleCAqL1xuICBpbml0aWFsSW5kZXg/OiBudW1iZXJcbiAgLyoqXG4gICAqIENhbGxlZCBhZnRlciBuYXZpZ2F0aW9uIG9jY3VycyAoYmFjayBvciBuZXh0KS5cbiAgICovXG4gIG9uTmF2aWdhdGU/OiAoZGlyZWN0aW9uOiAnYmFjaycgfCAnbmV4dCcsIG5ld0luZGV4OiBudW1iZXIpID0+IHZvaWRcbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuZXZlciB0aGUgY3VycmVudCBzdGVwIGluZGV4IGNoYW5nZXMuXG4gICAqL1xuICBvbkluZGV4Q2hhbmdlPzogKGluZGV4OiBudW1iZXIpID0+IHZvaWRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVGb3JtU3RlcHBlclNpZ25hbHNSZXR1cm4ge1xuICAvKiogVGhlIHVuZGVybHlpbmcgc3RlcHBlciBpbnN0YW5jZSAqL1xuICBzdGVwcGVyOiBGb3JtU3RlcHBlclxuICAvKiogQ3VycmVudCBzdGVwIHN0YXRlIChhY2Nlc3NvcikgKi9cbiAgY3VycmVudFN0ZXA6IEFjY2Vzc29yPFN0ZXBOb2RlU3RhdGUgfCBudWxsPlxuICAvKiogQ3VycmVudCBzdGVwIGluZGV4IChhY2Nlc3NvcikgKi9cbiAgY3VycmVudEluZGV4OiBBY2Nlc3NvcjxudW1iZXI+XG4gIC8qKiBBbGwgdmlzaWJsZSBzdGVwcyAoYWNjZXNzb3IpICovXG4gIHZpc2libGVTdGVwczogQWNjZXNzb3I8U3RlcE5vZGVTdGF0ZVtdPlxuICAvKiogV2hldGhlciB1c2VyIGNhbiBnbyBiYWNrIChhY2Nlc3NvcikgKi9cbiAgY2FuR29CYWNrOiBBY2Nlc3Nvcjxib29sZWFuPlxuICAvKiogV2hldGhlciBjdXJyZW50IHN0ZXAgaXMgdGhlIGxhc3QgKGFjY2Vzc29yKSAqL1xuICBpc0xhc3RTdGVwOiBBY2Nlc3Nvcjxib29sZWFuPlxuICAvKiogTmF2aWdhdGUgdG8gbmV4dCBzdGVwICovXG4gIGdvTmV4dDogKCkgPT4gU3RlcE5vZGVTdGF0ZSB8IG51bGxcbiAgLyoqIE5hdmlnYXRlIHRvIHByZXZpb3VzIHN0ZXAgKi9cbiAgZ29CYWNrOiAoKSA9PiBTdGVwTm9kZVN0YXRlIHwgbnVsbFxuICAvKiogSnVtcCB0byBhIHNwZWNpZmljIHN0ZXAgaW5kZXggKi9cbiAganVtcFRvOiAoaW5kZXg6IG51bWJlcikgPT4gdm9pZFxuICAvKiogTWFyayBhIHN0ZXAgYXMgY29tcGxldGUgKi9cbiAgbWFya0NvbXBsZXRlOiAoc3RlcElkOiBzdHJpbmcpID0+IHZvaWRcbiAgLyoqIFByb2dyZXNzIGluZm8gKGFjY2Vzc29yKSAqL1xuICBwcm9ncmVzczogQWNjZXNzb3I8eyBjdXJyZW50OiBudW1iZXI7IHRvdGFsOiBudW1iZXI7IHBlcmNlbnQ6IG51bWJlciB9PlxufVxuXG4vLyDilIDilIDilIAgQ29tcG9zYWJsZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBTb2xpZC5qcyBwcmltaXRpdmUgZm9yIG11bHRpLXN0ZXAgZm9ybSBuYXZpZ2F0aW9uIHVzaW5nIHNpZ25hbHMgYW5kIG1lbW9zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c3hcbiAqIGltcG9ydCB7IGNyZWF0ZUZvcm1FbmdpbmUsIGNyZWF0ZUZvcm1TdGVwcGVyIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtc29saWQnXG4gKiBpbXBvcnQgeyBTaG93IH0gZnJvbSAnc29saWQtanMnXG4gKlxuICogZXhwb3J0IGZ1bmN0aW9uIE11bHRpU3RlcEZvcm0ocHJvcHM6IHsgZm9ybURhdGE6IGFueSB9KSB7XG4gKiAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoeyBmaWVsZHM6IHByb3BzLmZvcm1EYXRhLmZpZWxkcyB9KVxuICogICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoe1xuICogICAgIHN0ZXBzOiBwcm9wcy5mb3JtRGF0YS5zdGVwcyxcbiAqICAgICBlbmdpbmU6IGVuZ2luZS5lbmdpbmUsXG4gKiAgIH0pXG4gKlxuICogICByZXR1cm4gKFxuICogICAgIDxkaXY+XG4gKiAgICAgICA8aDI+e3N0ZXBwZXIuY3VycmVudFN0ZXAoKT8uc3RlcC50aXRsZX08L2gyPlxuICogICAgICAgPHA+XG4gKiAgICAgICAgIFN0ZXAge3N0ZXBwZXIucHJvZ3Jlc3MoKS5jdXJyZW50fSBvZiB7c3RlcHBlci5wcm9ncmVzcygpLnRvdGFsfVxuICogICAgICAgPC9wPlxuICpcbiAqICAgICAgIDxTaG93IHdoZW49e3N0ZXBwZXIuY2FuR29CYWNrKCl9PlxuICogICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHN0ZXBwZXIuZ29CYWNrKCl9PkJhY2s8L2J1dHRvbj5cbiAqICAgICAgIDwvU2hvdz5cbiAqXG4gKiAgICAgICA8U2hvd1xuICogICAgICAgICB3aGVuPXtzdGVwcGVyLmlzTGFzdFN0ZXAoKX1cbiAqICAgICAgICAgZmFsbGJhY2s9ezxidXR0b24gb25DbGljaz17KCkgPT4gc3RlcHBlci5nb05leHQoKX0+TmV4dDwvYnV0dG9uPn1cbiAqICAgICAgID5cbiAqICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVTdWJtaXR9PlN1Ym1pdDwvYnV0dG9uPlxuICogICAgICAgPC9TaG93PlxuICogICAgIDwvZGl2PlxuICogICApXG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZvcm1TdGVwcGVyKFxuICBvcHRpb25zOiBDcmVhdGVGb3JtU3RlcHBlclNpZ25hbHNPcHRpb25zLFxuKTogQ3JlYXRlRm9ybVN0ZXBwZXJTaWduYWxzUmV0dXJuIHtcbiAgY29uc3QgeyBzdGVwcywgZW5naW5lLCBpbml0aWFsSW5kZXgsIG9uTmF2aWdhdGUsIG9uSW5kZXhDaGFuZ2UgfSA9IG9wdGlvbnNcblxuICBjb25zdCBbdGljaywgc2V0VGlja10gPSBjcmVhdGVTaWduYWwoMClcblxuICBjb25zdCBzdGVwcGVyID0gY29yZUNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUsIGluaXRpYWxJbmRleClcblxuICBjb25zdCBnb05leHQgPSAoKTogU3RlcE5vZGVTdGF0ZSB8IG51bGwgPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHN0ZXBwZXIuZ29OZXh0KClcbiAgICBjb25zdCBuZXdJbmRleCA9IHN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KClcbiAgICBzZXRUaWNrKHQgPT4gdCArIDEpXG4gICAgb25OYXZpZ2F0ZT8uKCduZXh0JywgbmV3SW5kZXgpXG4gICAgb25JbmRleENoYW5nZT8uKG5ld0luZGV4KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIGNvbnN0IGdvQmFjayA9ICgpOiBTdGVwTm9kZVN0YXRlIHwgbnVsbCA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3RlcHBlci5nb0JhY2soKVxuICAgIGNvbnN0IG5ld0luZGV4ID0gc3RlcHBlci5nZXRDdXJyZW50SW5kZXgoKVxuICAgIHNldFRpY2sodCA9PiB0ICsgMSlcbiAgICBvbk5hdmlnYXRlPy4oJ2JhY2snLCBuZXdJbmRleClcbiAgICBvbkluZGV4Q2hhbmdlPy4obmV3SW5kZXgpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgY29uc3QganVtcFRvID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBzdGVwcGVyLmp1bXBUbyhpbmRleClcbiAgICBzZXRUaWNrKHQgPT4gdCArIDEpXG4gICAgb25JbmRleENoYW5nZT8uKGluZGV4KVxuICB9XG5cbiAgY29uc3QgbWFya0NvbXBsZXRlID0gKHN0ZXBJZDogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgc3RlcHBlci5tYXJrQ29tcGxldGUoc3RlcElkKVxuICAgIHNldFRpY2sodCA9PiB0ICsgMSlcbiAgfVxuXG4gIGNvbnN0IGN1cnJlbnRTdGVwID0gY3JlYXRlTWVtbygoKSA9PiB7XG4gICAgdGljaygpXG4gICAgcmV0dXJuIHN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXAoKVxuICB9KVxuXG4gIGNvbnN0IGN1cnJlbnRJbmRleCA9IGNyZWF0ZU1lbW8oKCkgPT4ge1xuICAgIHRpY2soKVxuICAgIHJldHVybiBzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpXG4gIH0pXG5cbiAgY29uc3QgdmlzaWJsZVN0ZXBzID0gY3JlYXRlTWVtbygoKSA9PiB7XG4gICAgdGljaygpXG4gICAgcmV0dXJuIHN0ZXBwZXIuZ2V0VmlzaWJsZVN0ZXBzKClcbiAgfSlcblxuICBjb25zdCBjYW5Hb0JhY2sgPSBjcmVhdGVNZW1vKCgpID0+IHtcbiAgICB0aWNrKClcbiAgICByZXR1cm4gc3RlcHBlci5jYW5Hb0JhY2soKVxuICB9KVxuXG4gIGNvbnN0IGlzTGFzdFN0ZXAgPSBjcmVhdGVNZW1vKCgpID0+IHtcbiAgICB0aWNrKClcbiAgICByZXR1cm4gc3RlcHBlci5pc0xhc3RTdGVwKClcbiAgfSlcblxuICBjb25zdCBwcm9ncmVzcyA9IGNyZWF0ZU1lbW8oKCkgPT4ge1xuICAgIHRpY2soKVxuICAgIHJldHVybiBzdGVwcGVyLmdldFByb2dyZXNzKClcbiAgfSlcblxuICByZXR1cm4ge1xuICAgIHN0ZXBwZXIsXG4gICAgY3VycmVudFN0ZXAsXG4gICAgY3VycmVudEluZGV4LFxuICAgIHZpc2libGVTdGVwcyxcbiAgICBjYW5Hb0JhY2ssXG4gICAgaXNMYXN0U3RlcCxcbiAgICBnb05leHQsXG4gICAgZ29CYWNrLFxuICAgIGp1bXBUbyxcbiAgICBtYXJrQ29tcGxldGUsXG4gICAgcHJvZ3Jlc3MsXG4gIH1cbn1cbiJdfQ==