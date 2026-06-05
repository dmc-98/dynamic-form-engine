"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFormEngineStore = createFormEngineStore;
exports.createFormStepperStore = createFormStepperStore;
const store_1 = require("svelte/store");
const dfe_core_1 = require("@dmc--98/dfe-core");
// ─── Form Engine Store ──────────────────────────────────────────────────────
/**
 * Creates reactive Svelte stores for form engine state.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createFormEngineStore } from '@dmc--98/dfe-svelte'
 *
 *   export let fields
 *
 *   const { values, visibleFields, setFieldValue, validate } = createFormEngineStore(fields)
 * </script>
 *
 * <form on:submit|preventDefault={() => {
 *   const { success } = validate()
 *   if (success) submitToApi($values)
 * }}>
 *   {#each $visibleFields as field (field.key)}
 *     <MyFieldComponent
 *       {field}
 *       value={$values[field.key]}
 *       onChange={(v) => setFieldValue(field.key, v)}
 *     />
 *   {/each}
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
function createFormEngineStore(fields, initialValues, onChange) {
    const engine = (0, dfe_core_1.createFormEngine)(fields, initialValues);
    const values = (0, store_1.writable)(engine.getValues());
    const visibleFields = (0, store_1.writable)(engine.getVisibleFields());
    const updateStores = () => {
        values.set(engine.getValues());
        visibleFields.set(engine.getVisibleFields());
    };
    const setFieldValue = (key, value) => {
        const patch = engine.setFieldValue(key, value);
        updateStores();
        onChange === null || onChange === void 0 ? void 0 : onChange(key, value, patch);
        return patch;
    };
    const reset = (newFields, newValues) => {
        const newEngine = (0, dfe_core_1.createFormEngine)(newFields !== null && newFields !== void 0 ? newFields : fields, newValues !== null && newValues !== void 0 ? newValues : initialValues);
        Object.assign(engine, newEngine);
        updateStores();
    };
    const getFieldState = (key) => {
        return engine.getFieldState(key);
    };
    const validate = () => {
        return engine.validate();
    };
    const validateStep = (stepId) => {
        return engine.validateStep(stepId);
    };
    const collectSubmissionValues = () => {
        return engine.collectSubmissionValues();
    };
    return {
        engine,
        values,
        visibleFields,
        setFieldValue,
        getFieldState,
        validate,
        validateStep,
        collectSubmissionValues,
        reset,
    };
}
// ─── Form Stepper Store ─────────────────────────────────────────────────────
/**
 * Creates reactive Svelte stores for multi-step form navigation.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createFormEngineStore, createFormStepperStore } from '@dmc--98/dfe-svelte'
 *
 *   export let formData
 *
 *   const engineStores = createFormEngineStore(formData.fields)
 *   const stepperStores = createFormStepperStore(formData.steps, engineStores.engine)
 * </script>
 *
 * <div>
 *   <h2>{$stepperStores.currentStep?.step.title}</h2>
 *   <p>Step {$stepperStores.progress.current} of {$stepperStores.progress.total}</p>
 *
 *   {#if $stepperStores.canGoBack}
 *     <button on:click={stepperStores.goBack}>Back</button>
 *   {/if}
 *
 *   {#if $stepperStores.isLastStep}
 *     <button on:click={handleSubmit}>Submit</button>
 *   {:else}
 *     <button on:click={stepperStores.goNext}>Next</button>
 *   {/if}
 * </div>
 * ```
 */
function createFormStepperStore(steps, engine, initialIndex, onNavigate, onIndexChange) {
    const stepper = (0, dfe_core_1.createFormStepper)(steps, engine, initialIndex);
    const currentStep = (0, store_1.writable)(stepper.getCurrentStep());
    const currentIndex = (0, store_1.writable)(stepper.getCurrentIndex());
    const visibleSteps = (0, store_1.writable)(stepper.getVisibleSteps());
    const canGoBack = (0, store_1.writable)(stepper.canGoBack());
    const isLastStep = (0, store_1.writable)(stepper.isLastStep());
    const progress = (0, store_1.writable)(stepper.getProgress());
    const updateStores = () => {
        currentStep.set(stepper.getCurrentStep());
        currentIndex.set(stepper.getCurrentIndex());
        visibleSteps.set(stepper.getVisibleSteps());
        canGoBack.set(stepper.canGoBack());
        isLastStep.set(stepper.isLastStep());
        progress.set(stepper.getProgress());
    };
    const goNext = () => {
        const result = stepper.goNext();
        const newIndex = stepper.getCurrentIndex();
        updateStores();
        onNavigate === null || onNavigate === void 0 ? void 0 : onNavigate('next', newIndex);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange(newIndex);
        return result;
    };
    const goBack = () => {
        const result = stepper.goBack();
        const newIndex = stepper.getCurrentIndex();
        updateStores();
        onNavigate === null || onNavigate === void 0 ? void 0 : onNavigate('back', newIndex);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange(newIndex);
        return result;
    };
    const jumpTo = (index) => {
        stepper.jumpTo(index);
        updateStores();
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange(index);
    };
    const markComplete = (stepId) => {
        stepper.markComplete(stepId);
        updateStores();
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RvcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBdUZBLHNEQXVEQztBQWtDRCx3REFtRUM7QUFuUEQsd0NBQXVDO0FBQ3ZDLGtEQU00QjtBQWtENUIsK0VBQStFO0FBRS9FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EyQkc7QUFDSCxTQUFnQixxQkFBcUIsQ0FDbkMsTUFBbUIsRUFDbkIsYUFBMEIsRUFDMUIsUUFBbUU7SUFFbkUsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFFdEQsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBUSxFQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO0lBQzNDLE1BQU0sYUFBYSxHQUFHLElBQUEsZ0JBQVEsRUFBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO0lBRXpELE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1FBQzlCLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQTtJQUM5QyxDQUFDLENBQUE7SUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUFjLEVBQWMsRUFBRTtRQUNoRSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUM5QyxZQUFZLEVBQUUsQ0FBQTtRQUNkLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRyxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzdCLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQyxDQUFBO0lBRUQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxTQUF1QixFQUFFLFNBQXNC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QUNULENBQUE7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXG5pbXBvcnQge1xuICBjcmVhdGVGb3JtRW5naW5lLFxuICBjcmVhdGVGb3JtU3RlcHBlcixcbiAgdHlwZSBGb3JtRmllbGQsIHR5cGUgRm9ybVZhbHVlcywgdHlwZSBGb3JtRW5naW5lLFxuICB0eXBlIEdyYXBoUGF0Y2gsIHR5cGUgRmllbGROb2RlU3RhdGUsXG4gIHR5cGUgRm9ybVN0ZXAsIHR5cGUgRm9ybVN0ZXBwZXIsIHR5cGUgU3RlcE5vZGVTdGF0ZSxcbn0gZnJvbSAnQHNuYXJqdW45OC9kZmUtY29yZSdcblxuLy8g4pSA4pSA4pSAIFR5cGVzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgaW50ZXJmYWNlIEZvcm1FbmdpbmVTdG9yZXMge1xuICAvKiogVGhlIHVuZGVybHlpbmcgZW5naW5lIGluc3RhbmNlICovXG4gIGVuZ2luZTogRm9ybUVuZ2luZVxuICAvKiogQ3VycmVudCBmb3JtIHZhbHVlcyAod3JpdGFibGUgc3RvcmUpICovXG4gIHZhbHVlczogUmV0dXJuVHlwZTx0eXBlb2Ygd3JpdGFibGU8Rm9ybVZhbHVlcz4+XG4gIC8qKiBBbGwgY3VycmVudGx5IHZpc2libGUgZmllbGRzICh3cml0YWJsZSBzdG9yZSkgKi9cbiAgdmlzaWJsZUZpZWxkczogUmV0dXJuVHlwZTx0eXBlb2Ygd3JpdGFibGU8Rm9ybUZpZWxkW10+PlxuICAvKiogU2V0IGEgZmllbGQgdmFsdWUgKHRyaWdnZXJzIGNvbmRpdGlvbiByZS1ldmFsdWF0aW9uKSAqL1xuICBzZXRGaWVsZFZhbHVlOiAoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKSA9PiBHcmFwaFBhdGNoXG4gIC8qKiBHZXQgdGhlIHN0YXRlIG9mIGEgc3BlY2lmaWMgZmllbGQgKi9cbiAgZ2V0RmllbGRTdGF0ZTogKGtleTogc3RyaW5nKSA9PiBGaWVsZE5vZGVTdGF0ZSB8IHVuZGVmaW5lZFxuICAvKiogVmFsaWRhdGUgYWxsIHZpc2libGUgcmVxdWlyZWQgZmllbGRzICovXG4gIHZhbGlkYXRlOiAoKSA9PiB7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB9XG4gIC8qKiBWYWxpZGF0ZSBhIHNpbmdsZSBzdGVwJ3MgZmllbGRzICovXG4gIHZhbGlkYXRlU3RlcDogKHN0ZXBJZDogc3RyaW5nKSA9PiB7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB9XG4gIC8qKiBDb2xsZWN0IHZhbHVlcyBmb3Igc3VibWlzc2lvbiAoZXhjbHVkZXMgaGlkZGVuL2xheW91dCkgKi9cbiAgY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXM6ICgpID0+IEZvcm1WYWx1ZXNcbiAgLyoqIFJlc2V0IHRoZSBlbmdpbmUgd2l0aCBuZXcgZmllbGRzL3ZhbHVlcyAqL1xuICByZXNldDogKGZpZWxkcz86IEZvcm1GaWVsZFtdLCB2YWx1ZXM/OiBGb3JtVmFsdWVzKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRm9ybVN0ZXBwZXJTdG9yZXMge1xuICAvKiogVGhlIHVuZGVybHlpbmcgc3RlcHBlciBpbnN0YW5jZSAqL1xuICBzdGVwcGVyOiBGb3JtU3RlcHBlclxuICAvKiogQ3VycmVudCBzdGVwIHN0YXRlICh3cml0YWJsZSBzdG9yZSkgKi9cbiAgY3VycmVudFN0ZXA6IFJldHVyblR5cGU8dHlwZW9mIHdyaXRhYmxlPFN0ZXBOb2RlU3RhdGUgfCBudWxsPj5cbiAgLyoqIEN1cnJlbnQgc3RlcCBpbmRleCAod3JpdGFibGUgc3RvcmUpICovXG4gIGN1cnJlbnRJbmRleDogUmV0dXJuVHlwZTx0eXBlb2Ygd3JpdGFibGU8bnVtYmVyPj5cbiAgLyoqIEFsbCB2aXNpYmxlIHN0ZXBzICh3cml0YWJsZSBzdG9yZSkgKi9cbiAgdmlzaWJsZVN0ZXBzOiBSZXR1cm5UeXBlPHR5cGVvZiB3cml0YWJsZTxTdGVwTm9kZVN0YXRlW10+PlxuICAvKiogV2hldGhlciB1c2VyIGNhbiBnbyBiYWNrICh3cml0YWJsZSBzdG9yZSkgKi9cbiAgY2FuR29CYWNrOiBSZXR1cm5UeXBlPHR5cGVvZiB3cml0YWJsZTxib29sZWFuPj5cbiAgLyoqIFdoZXRoZXIgY3VycmVudCBzdGVwIGlzIHRoZSBsYXN0ICh3cml0YWJsZSBzdG9yZSkgKi9cbiAgaXNMYXN0U3RlcDogUmV0dXJuVHlwZTx0eXBlb2Ygd3JpdGFibGU8Ym9vbGVhbj4+XG4gIC8qKiBOYXZpZ2F0ZSB0byBuZXh0IHN0ZXAgKi9cbiAgZ29OZXh0OiAoKSA9PiBTdGVwTm9kZVN0YXRlIHwgbnVsbFxuICAvKiogTmF2aWdhdGUgdG8gcHJldmlvdXMgc3RlcCAqL1xuICBnb0JhY2s6ICgpID0+IFN0ZXBOb2RlU3RhdGUgfCBudWxsXG4gIC8qKiBKdW1wIHRvIGEgc3BlY2lmaWMgc3RlcCBpbmRleCAqL1xuICBqdW1wVG86IChpbmRleDogbnVtYmVyKSA9PiB2b2lkXG4gIC8qKiBNYXJrIGEgc3RlcCBhcyBjb21wbGV0ZSAqL1xuICBtYXJrQ29tcGxldGU6IChzdGVwSWQ6IHN0cmluZykgPT4gdm9pZFxuICAvKiogUHJvZ3Jlc3MgaW5mbyAod3JpdGFibGUgc3RvcmUpICovXG4gIHByb2dyZXNzOiBSZXR1cm5UeXBlPHR5cGVvZiB3cml0YWJsZTx7IGN1cnJlbnQ6IG51bWJlcjsgdG90YWw6IG51bWJlcjsgcGVyY2VudDogbnVtYmVyIH0+PlxufVxuXG4vLyDilIDilIDilIAgRm9ybSBFbmdpbmUgU3RvcmUg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbi8qKlxuICogQ3JlYXRlcyByZWFjdGl2ZSBTdmVsdGUgc3RvcmVzIGZvciBmb3JtIGVuZ2luZSBzdGF0ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgc3ZlbHRlXG4gKiA8c2NyaXB0PlxuICogICBpbXBvcnQgeyBjcmVhdGVGb3JtRW5naW5lU3RvcmUgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1zdmVsdGUnXG4gKlxuICogICBleHBvcnQgbGV0IGZpZWxkc1xuICpcbiAqICAgY29uc3QgeyB2YWx1ZXMsIHZpc2libGVGaWVsZHMsIHNldEZpZWxkVmFsdWUsIHZhbGlkYXRlIH0gPSBjcmVhdGVGb3JtRW5naW5lU3RvcmUoZmllbGRzKVxuICogPC9zY3JpcHQ+XG4gKlxuICogPGZvcm0gb246c3VibWl0fHByZXZlbnREZWZhdWx0PXsoKSA9PiB7XG4gKiAgIGNvbnN0IHsgc3VjY2VzcyB9ID0gdmFsaWRhdGUoKVxuICogICBpZiAoc3VjY2Vzcykgc3VibWl0VG9BcGkoJHZhbHVlcylcbiAqIH19PlxuICogICB7I2VhY2ggJHZpc2libGVGaWVsZHMgYXMgZmllbGQgKGZpZWxkLmtleSl9XG4gKiAgICAgPE15RmllbGRDb21wb25lbnRcbiAqICAgICAgIHtmaWVsZH1cbiAqICAgICAgIHZhbHVlPXskdmFsdWVzW2ZpZWxkLmtleV19XG4gKiAgICAgICBvbkNoYW5nZT17KHYpID0+IHNldEZpZWxkVmFsdWUoZmllbGQua2V5LCB2KX1cbiAqICAgICAvPlxuICogICB7L2VhY2h9XG4gKiAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPlN1Ym1pdDwvYnV0dG9uPlxuICogPC9mb3JtPlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGb3JtRW5naW5lU3RvcmUoXG4gIGZpZWxkczogRm9ybUZpZWxkW10sXG4gIGluaXRpYWxWYWx1ZXM/OiBGb3JtVmFsdWVzLFxuICBvbkNoYW5nZT86IChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24sIHBhdGNoOiBHcmFwaFBhdGNoKSA9PiB2b2lkLFxuKTogRm9ybUVuZ2luZVN0b3JlcyB7XG4gIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzLCBpbml0aWFsVmFsdWVzKVxuXG4gIGNvbnN0IHZhbHVlcyA9IHdyaXRhYmxlKGVuZ2luZS5nZXRWYWx1ZXMoKSlcbiAgY29uc3QgdmlzaWJsZUZpZWxkcyA9IHdyaXRhYmxlKGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKCkpXG5cbiAgY29uc3QgdXBkYXRlU3RvcmVzID0gKCkgPT4ge1xuICAgIHZhbHVlcy5zZXQoZW5naW5lLmdldFZhbHVlcygpKVxuICAgIHZpc2libGVGaWVsZHMuc2V0KGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKCkpXG4gIH1cblxuICBjb25zdCBzZXRGaWVsZFZhbHVlID0gKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IEdyYXBoUGF0Y2ggPT4ge1xuICAgIGNvbnN0IHBhdGNoID0gZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSlcbiAgICB1cGRhdGVTdG9yZXMoKVxuICAgIG9uQ2hhbmdlPy4oa2V5LCB2YWx1ZSwgcGF0Y2gpXG4gICAgcmV0dXJuIHBhdGNoXG4gIH1cblxuICBjb25zdCByZXNldCA9IChuZXdGaWVsZHM/OiBGb3JtRmllbGRbXSwgbmV3VmFsdWVzPzogRm9ybVZhbHVlcyk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IG5ld0VuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUobmV3RmllbGRzID8/IGZpZWxkcywgbmV3VmFsdWVzID8/IGluaXRpYWxWYWx1ZXMpXG4gICAgT2JqZWN0LmFzc2lnbihlbmdpbmUsIG5ld0VuZ2luZSlcbiAgICB1cGRhdGVTdG9yZXMoKVxuICB9XG5cbiAgY29uc3QgZ2V0RmllbGRTdGF0ZSA9IChrZXk6IHN0cmluZyk6IEZpZWxkTm9kZVN0YXRlIHwgdW5kZWZpbmVkID0+IHtcbiAgICByZXR1cm4gZW5naW5lLmdldEZpZWxkU3RhdGUoa2V5KVxuICB9XG5cbiAgY29uc3QgdmFsaWRhdGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIGVuZ2luZS52YWxpZGF0ZSgpXG4gIH1cblxuICBjb25zdCB2YWxpZGF0ZVN0ZXAgPSAoc3RlcElkOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gZW5naW5lLnZhbGlkYXRlU3RlcChzdGVwSWQpXG4gIH1cblxuICBjb25zdCBjb2xsZWN0U3VibWlzc2lvblZhbHVlcyA9ICgpID0+IHtcbiAgICByZXR1cm4gZW5naW5lLmNvbGxlY3RTdWJtaXNzaW9uVmFsdWVzKClcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZW5naW5lLFxuICAgIHZhbHVlcyxcbiAgICB2aXNpYmxlRmllbGRzLFxuICAgIHNldEZpZWxkVmFsdWUsXG4gICAgZ2V0RmllbGRTdGF0ZSxcbiAgICB2YWxpZGF0ZSxcbiAgICB2YWxpZGF0ZVN0ZXAsXG4gICAgY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMsXG4gICAgcmVzZXQsXG4gIH1cbn1cblxuLy8g4pSA4pSA4pSAIEZvcm0gU3RlcHBlciBTdG9yZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBDcmVhdGVzIHJlYWN0aXZlIFN2ZWx0ZSBzdG9yZXMgZm9yIG11bHRpLXN0ZXAgZm9ybSBuYXZpZ2F0aW9uLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBzdmVsdGVcbiAqIDxzY3JpcHQ+XG4gKiAgIGltcG9ydCB7IGNyZWF0ZUZvcm1FbmdpbmVTdG9yZSwgY3JlYXRlRm9ybVN0ZXBwZXJTdG9yZSB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLXN2ZWx0ZSdcbiAqXG4gKiAgIGV4cG9ydCBsZXQgZm9ybURhdGFcbiAqXG4gKiAgIGNvbnN0IGVuZ2luZVN0b3JlcyA9IGNyZWF0ZUZvcm1FbmdpbmVTdG9yZShmb3JtRGF0YS5maWVsZHMpXG4gKiAgIGNvbnN0IHN0ZXBwZXJTdG9yZXMgPSBjcmVhdGVGb3JtU3RlcHBlclN0b3JlKGZvcm1EYXRhLnN0ZXBzLCBlbmdpbmVTdG9yZXMuZW5naW5lKVxuICogPC9zY3JpcHQ+XG4gKlxuICogPGRpdj5cbiAqICAgPGgyPnskc3RlcHBlclN0b3Jlcy5jdXJyZW50U3RlcD8uc3RlcC50aXRsZX08L2gyPlxuICogICA8cD5TdGVwIHskc3RlcHBlclN0b3Jlcy5wcm9ncmVzcy5jdXJyZW50fSBvZiB7JHN0ZXBwZXJTdG9yZXMucHJvZ3Jlc3MudG90YWx9PC9wPlxuICpcbiAqICAgeyNpZiAkc3RlcHBlclN0b3Jlcy5jYW5Hb0JhY2t9XG4gKiAgICAgPGJ1dHRvbiBvbjpjbGljaz17c3RlcHBlclN0b3Jlcy5nb0JhY2t9PkJhY2s8L2J1dHRvbj5cbiAqICAgey9pZn1cbiAqXG4gKiAgIHsjaWYgJHN0ZXBwZXJTdG9yZXMuaXNMYXN0U3RlcH1cbiAqICAgICA8YnV0dG9uIG9uOmNsaWNrPXtoYW5kbGVTdWJtaXR9PlN1Ym1pdDwvYnV0dG9uPlxuICogICB7OmVsc2V9XG4gKiAgICAgPGJ1dHRvbiBvbjpjbGljaz17c3RlcHBlclN0b3Jlcy5nb05leHR9Pk5leHQ8L2J1dHRvbj5cbiAqICAgey9pZn1cbiAqIDwvZGl2PlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGb3JtU3RlcHBlclN0b3JlKFxuICBzdGVwczogRm9ybVN0ZXBbXSxcbiAgZW5naW5lOiBGb3JtRW5naW5lLFxuICBpbml0aWFsSW5kZXg/OiBudW1iZXIsXG4gIG9uTmF2aWdhdGU/OiAoZGlyZWN0aW9uOiAnYmFjaycgfCAnbmV4dCcsIG5ld0luZGV4OiBudW1iZXIpID0+IHZvaWQsXG4gIG9uSW5kZXhDaGFuZ2U/OiAoaW5kZXg6IG51bWJlcikgPT4gdm9pZCxcbik6IEZvcm1TdGVwcGVyU3RvcmVzIHtcbiAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUsIGluaXRpYWxJbmRleClcblxuICBjb25zdCBjdXJyZW50U3RlcCA9IHdyaXRhYmxlKHN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXAoKSlcbiAgY29uc3QgY3VycmVudEluZGV4ID0gd3JpdGFibGUoc3RlcHBlci5nZXRDdXJyZW50SW5kZXgoKSlcbiAgY29uc3QgdmlzaWJsZVN0ZXBzID0gd3JpdGFibGUoc3RlcHBlci5nZXRWaXNpYmxlU3RlcHMoKSlcbiAgY29uc3QgY2FuR29CYWNrID0gd3JpdGFibGUoc3RlcHBlci5jYW5Hb0JhY2soKSlcbiAgY29uc3QgaXNMYXN0U3RlcCA9IHdyaXRhYmxlKHN0ZXBwZXIuaXNMYXN0U3RlcCgpKVxuICBjb25zdCBwcm9ncmVzcyA9IHdyaXRhYmxlKHN0ZXBwZXIuZ2V0UHJvZ3Jlc3MoKSlcblxuICBjb25zdCB1cGRhdGVTdG9yZXMgPSAoKSA9PiB7XG4gICAgY3VycmVudFN0ZXAuc2V0KHN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXAoKSlcbiAgICBjdXJyZW50SW5kZXguc2V0KHN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KCkpXG4gICAgdmlzaWJsZVN0ZXBzLnNldChzdGVwcGVyLmdldFZpc2libGVTdGVwcygpKVxuICAgIGNhbkdvQmFjay5zZXQoc3RlcHBlci5jYW5Hb0JhY2soKSlcbiAgICBpc0xhc3RTdGVwLnNldChzdGVwcGVyLmlzTGFzdFN0ZXAoKSlcbiAgICBwcm9ncmVzcy5zZXQoc3RlcHBlci5nZXRQcm9ncmVzcygpKVxuICB9XG5cbiAgY29uc3QgZ29OZXh0ID0gKCk6IFN0ZXBOb2RlU3RhdGUgfCBudWxsID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBzdGVwcGVyLmdvTmV4dCgpXG4gICAgY29uc3QgbmV3SW5kZXggPSBzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpXG4gICAgdXBkYXRlU3RvcmVzKClcbiAgICBvbk5hdmlnYXRlPy4oJ25leHQnLCBuZXdJbmRleClcbiAgICBvbkluZGV4Q2hhbmdlPy4obmV3SW5kZXgpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgY29uc3QgZ29CYWNrID0gKCk6IFN0ZXBOb2RlU3RhdGUgfCBudWxsID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBzdGVwcGVyLmdvQmFjaygpXG4gICAgY29uc3QgbmV3SW5kZXggPSBzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpXG4gICAgdXBkYXRlU3RvcmVzKClcbiAgICBvbk5hdmlnYXRlPy4oJ2JhY2snLCBuZXdJbmRleClcbiAgICBvbkluZGV4Q2hhbmdlPy4obmV3SW5kZXgpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgY29uc3QganVtcFRvID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBzdGVwcGVyLmp1bXBUbyhpbmRleClcbiAgICB1cGRhdGVTdG9yZXMoKVxuICAgIG9uSW5kZXhDaGFuZ2U/LihpbmRleClcbiAgfVxuXG4gIGNvbnN0IG1hcmtDb21wbGV0ZSA9IChzdGVwSWQ6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIHN0ZXBwZXIubWFya0NvbXBsZXRlKHN0ZXBJZClcbiAgICB1cGRhdGVTdG9yZXMoKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdGVwcGVyLFxuICAgIGN1cnJlbnRTdGVwLFxuICAgIGN1cnJlbnRJbmRleCxcbiAgICB2aXNpYmxlU3RlcHMsXG4gICAgY2FuR29CYWNrLFxuICAgIGlzTGFzdFN0ZXAsXG4gICAgZ29OZXh0LFxuICAgIGdvQmFjayxcbiAgICBqdW1wVG8sXG4gICAgbWFya0NvbXBsZXRlLFxuICAgIHByb2dyZXNzLFxuICB9XG59XG4iXX0=