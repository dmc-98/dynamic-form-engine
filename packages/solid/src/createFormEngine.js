"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFormEngine = createFormEngine;
const solid_js_1 = require("solid-js");
const dfe_core_1 = require("@dmc-98/dfe-core");
// ─── Composable ─────────────────────────────────────────────────────────────
/**
 * Solid.js primitive for reactive form engine state using signals and memos.
 *
 * @example
 * ```tsx
 * import { createFormEngine } from '@dmc-98/dfe-solid'
 * import { For } from 'solid-js'
 *
 * export function MyForm(props: { fields: FormField[] }) {
 *   const {
 *     values,
 *     setFieldValue,
 *     visibleFields,
 *     validate,
 *   } = createFormEngine({
 *     fields: props.fields,
 *   })
 *
 *   const handleSubmit = () => {
 *     const { success, errors } = validate()
 *     if (success) {
 *       submitToApi(values())
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
 *       <For each={visibleFields()}>
 *         {(field) => (
 *           <MyFieldComponent
 *             field={field}
 *             value={values()[field.key]}
 *             onChange={(v) => setFieldValue(field.key, v)}
 *           />
 *         )}
 *       </For>
 *       <button type="submit">Submit</button>
 *     </form>
 *   )
 * }
 * ```
 */
function createFormEngine(options) {
    const { fields, initialValues, onChange } = options;
    // Create a signal to track updates
    const [tick, setTick] = (0, solid_js_1.createSignal)(0);
    // Create the engine once
    const engine = (0, dfe_core_1.createFormEngine)(fields, initialValues);
    const setFieldValue = (key, value) => {
        const patch = engine.setFieldValue(key, value);
        setTick(t => t + 1);
        onChange === null || onChange === void 0 ? void 0 : onChange(key, value, patch);
        return patch;
    };
    const reset = (newFields, newValues) => {
        const newEngine = (0, dfe_core_1.createFormEngine)(newFields !== null && newFields !== void 0 ? newFields : fields, newValues !== null && newValues !== void 0 ? newValues : initialValues);
        Object.assign(engine, newEngine);
        setTick(t => t + 1);
    };
    // Create memos that depend on tick
    const values = (0, solid_js_1.createMemo)(() => {
        tick();
        return engine.getValues();
    });
    const visibleFields = (0, solid_js_1.createMemo)(() => {
        tick();
        return engine.getVisibleFields();
    });
    const getFieldState = (key) => {
        return engine.getFieldState(key);
    };
    const validate = () => {
        tick();
        return engine.validate();
    };
    const validateStep = (stepId) => {
        tick();
        return engine.validateStep(stepId);
    };
    const collectSubmissionValues = () => {
        tick();
        return engine.collectSubmissionValues();
    };
    return {
        engine,
        values,
        setFieldValue,
        visibleFields,
        getFieldState,
        validate,
        validateStep,
        collectSubmissionValues,
        reset,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlRm9ybUVuZ2luZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNyZWF0ZUZvcm1FbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFtRkEsNENBaUVDO0FBcEpELHVDQUE2RDtBQUM3RCxrREFJNEI7QUFrQzVCLCtFQUErRTtBQUUvRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5Q0c7QUFDSCxTQUFnQixnQkFBZ0IsQ0FDOUIsT0FBdUM7SUFFdkMsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFBO0lBRW5ELG1DQUFtQztJQUNuQyxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLElBQUEsdUJBQVksRUFBQyxDQUFDLENBQUMsQ0FBQTtJQUV2Qyx5QkFBeUI7SUFDekIsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBb0IsRUFBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFFMUQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFXLEVBQUUsS0FBYyxFQUFjLEVBQUU7UUFDaEUsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDOUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ25CLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRyxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzdCLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQyxDQUFBO0lBRUQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxTQUF1QixFQUFFLFNBQXNCLEVBQVEsRUFBRTtRQUN0RSxNQUFNLFNBQVMsR0FBRyxJQUFBLDJCQUFvQixFQUFDLFNBQVMsYUFBVCxTQUFTLGNBQVQsU0FBUyxHQUFJLE1BQU0sRUFBRSxTQUFTLGFBQVQsU0FBUyxjQUFULFNBQVMsR0FBSSxhQUFhLENBQUMsQ0FBQTtRQUN2RixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNoQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFDckIsQ0FBQyxDQUFBO0lBRUQsbUNBQW1DO0lBQ25DLE1BQU0sTUFBTSxHQUFHLElBQUEscUJBQVUsRUFBQyxHQUFHLEVBQUU7UUFDN0IsSUFBSSxFQUFFLENBQUE7UUFDTixPQUFPLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtJQUMzQixDQUFDLENBQUMsQ0FBQTtJQUVGLE1BQU0sYUFBYSxHQUFHLElBQUEscUJBQVUsRUFBQyxHQUFHLEVBQUU7UUFDcEMsSUFBSSxFQUFFLENBQUE7UUFDTixPQUFPLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO0lBQ2xDLENBQUMsQ0FBQyxDQUFBO0lBRUYsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFXLEVBQThCLEVBQUU7UUFDaEUsT0FBTyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ2xDLENBQUMsQ0FBQTtJQUVELE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtRQUNwQixJQUFJLEVBQUUsQ0FBQTtRQUNOLE9BQU8sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBQzFCLENBQUMsQ0FBQTtJQUVELE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBYyxFQUFFLEVBQUU7UUFDdEMsSUFBSSxFQUFFLENBQUE7UUFDTixPQUFPLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDcEMsQ0FBQyxDQUFBO0lBRUQsTUFBTSx1QkFBdUIsR0FBRyxHQUFHLEVBQUU7UUFDbkMsSUFBSSxFQUFFLENBQUE7UUFDTixPQUFPLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFBO0lBQ3pDLENBQUMsQ0FBQTtJQUVELE9BQU87UUFDTCxNQUFNO1FBQ04sTUFBTTtRQUNOLGFBQWE7UUFDYixhQUFhO1FBQ2IsYUFBYTtRQUNiLFFBQVE7UUFDUixZQUFZO1FBQ1osdUJBQXVCO1FBQ3ZCLEtBQUs7S0FDTixDQUFBO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVNpZ25hbCwgY3JlYXRlTWVtbywgQWNjZXNzb3IgfSBmcm9tICdzb2xpZC1qcydcbmltcG9ydCB7XG4gIGNyZWF0ZUZvcm1FbmdpbmUgYXMgY29yZUNyZWF0ZUZvcm1FbmdpbmUsXG4gIHR5cGUgRm9ybUZpZWxkLCB0eXBlIEZvcm1WYWx1ZXMsIHR5cGUgRm9ybUVuZ2luZSxcbiAgdHlwZSBHcmFwaFBhdGNoLCB0eXBlIEZpZWxkTm9kZVN0YXRlLFxufSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuXG4vLyDilIDilIDilIAgVHlwZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlRm9ybUVuZ2luZVNpZ25hbHNPcHRpb25zIHtcbiAgLyoqIEZvcm0gZmllbGQgZGVmaW5pdGlvbnMgKi9cbiAgZmllbGRzOiBGb3JtRmllbGRbXVxuICAvKiogUHJlLWV4aXN0aW5nIHZhbHVlcyB0byBoeWRyYXRlICovXG4gIGluaXRpYWxWYWx1ZXM/OiBGb3JtVmFsdWVzXG4gIC8qKiBDYWxsYmFjayB3aGVuIGFueSBmaWVsZCB2YWx1ZSBjaGFuZ2VzICovXG4gIG9uQ2hhbmdlPzogKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93biwgcGF0Y2g6IEdyYXBoUGF0Y2gpID0+IHZvaWRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVGb3JtRW5naW5lU2lnbmFsc1JldHVybiB7XG4gIC8qKiBUaGUgdW5kZXJseWluZyBlbmdpbmUgaW5zdGFuY2UgKi9cbiAgZW5naW5lOiBGb3JtRW5naW5lXG4gIC8qKiBDdXJyZW50IGZvcm0gdmFsdWVzIChhY2Nlc3NvcikgKi9cbiAgdmFsdWVzOiBBY2Nlc3NvcjxGb3JtVmFsdWVzPlxuICAvKiogU2V0IGEgZmllbGQgdmFsdWUgKHRyaWdnZXJzIGNvbmRpdGlvbiByZS1ldmFsdWF0aW9uKSAqL1xuICBzZXRGaWVsZFZhbHVlOiAoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKSA9PiBHcmFwaFBhdGNoXG4gIC8qKiBBbGwgY3VycmVudGx5IHZpc2libGUgZmllbGRzIChhY2Nlc3NvcikgKi9cbiAgdmlzaWJsZUZpZWxkczogQWNjZXNzb3I8Rm9ybUZpZWxkW10+XG4gIC8qKiBHZXQgdGhlIHN0YXRlIG9mIGEgc3BlY2lmaWMgZmllbGQgKi9cbiAgZ2V0RmllbGRTdGF0ZTogKGtleTogc3RyaW5nKSA9PiBGaWVsZE5vZGVTdGF0ZSB8IHVuZGVmaW5lZFxuICAvKiogVmFsaWRhdGUgYWxsIHZpc2libGUgcmVxdWlyZWQgZmllbGRzICovXG4gIHZhbGlkYXRlOiAoKSA9PiB7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB9XG4gIC8qKiBWYWxpZGF0ZSBhIHNpbmdsZSBzdGVwJ3MgZmllbGRzICovXG4gIHZhbGlkYXRlU3RlcDogKHN0ZXBJZDogc3RyaW5nKSA9PiB7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB9XG4gIC8qKiBDb2xsZWN0IHZhbHVlcyBmb3Igc3VibWlzc2lvbiAoZXhjbHVkZXMgaGlkZGVuL2xheW91dCkgKi9cbiAgY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXM6ICgpID0+IEZvcm1WYWx1ZXNcbiAgLyoqIFJlc2V0IHRoZSBlbmdpbmUgd2l0aCBuZXcgZmllbGRzL3ZhbHVlcyAqL1xuICByZXNldDogKGZpZWxkcz86IEZvcm1GaWVsZFtdLCB2YWx1ZXM/OiBGb3JtVmFsdWVzKSA9PiB2b2lkXG59XG5cbi8vIOKUgOKUgOKUgCBDb21wb3NhYmxlIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIFNvbGlkLmpzIHByaW1pdGl2ZSBmb3IgcmVhY3RpdmUgZm9ybSBlbmdpbmUgc3RhdGUgdXNpbmcgc2lnbmFscyBhbmQgbWVtb3MuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzeFxuICogaW1wb3J0IHsgY3JlYXRlRm9ybUVuZ2luZSB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLXNvbGlkJ1xuICogaW1wb3J0IHsgRm9yIH0gZnJvbSAnc29saWQtanMnXG4gKlxuICogZXhwb3J0IGZ1bmN0aW9uIE15Rm9ybShwcm9wczogeyBmaWVsZHM6IEZvcm1GaWVsZFtdIH0pIHtcbiAqICAgY29uc3Qge1xuICogICAgIHZhbHVlcyxcbiAqICAgICBzZXRGaWVsZFZhbHVlLFxuICogICAgIHZpc2libGVGaWVsZHMsXG4gKiAgICAgdmFsaWRhdGUsXG4gKiAgIH0gPSBjcmVhdGVGb3JtRW5naW5lKHtcbiAqICAgICBmaWVsZHM6IHByb3BzLmZpZWxkcyxcbiAqICAgfSlcbiAqXG4gKiAgIGNvbnN0IGhhbmRsZVN1Ym1pdCA9ICgpID0+IHtcbiAqICAgICBjb25zdCB7IHN1Y2Nlc3MsIGVycm9ycyB9ID0gdmFsaWRhdGUoKVxuICogICAgIGlmIChzdWNjZXNzKSB7XG4gKiAgICAgICBzdWJtaXRUb0FwaSh2YWx1ZXMoKSlcbiAqICAgICB9XG4gKiAgIH1cbiAqXG4gKiAgIHJldHVybiAoXG4gKiAgICAgPGZvcm0gb25TdWJtaXQ9eyhlKSA9PiB7IGUucHJldmVudERlZmF1bHQoKTsgaGFuZGxlU3VibWl0KCkgfX0+XG4gKiAgICAgICA8Rm9yIGVhY2g9e3Zpc2libGVGaWVsZHMoKX0+XG4gKiAgICAgICAgIHsoZmllbGQpID0+IChcbiAqICAgICAgICAgICA8TXlGaWVsZENvbXBvbmVudFxuICogICAgICAgICAgICAgZmllbGQ9e2ZpZWxkfVxuICogICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcygpW2ZpZWxkLmtleV19XG4gKiAgICAgICAgICAgICBvbkNoYW5nZT17KHYpID0+IHNldEZpZWxkVmFsdWUoZmllbGQua2V5LCB2KX1cbiAqICAgICAgICAgICAvPlxuICogICAgICAgICApfVxuICogICAgICAgPC9Gb3I+XG4gKiAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5TdWJtaXQ8L2J1dHRvbj5cbiAqICAgICA8L2Zvcm0+XG4gKiAgIClcbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRm9ybUVuZ2luZShcbiAgb3B0aW9uczogQ3JlYXRlRm9ybUVuZ2luZVNpZ25hbHNPcHRpb25zLFxuKTogQ3JlYXRlRm9ybUVuZ2luZVNpZ25hbHNSZXR1cm4ge1xuICBjb25zdCB7IGZpZWxkcywgaW5pdGlhbFZhbHVlcywgb25DaGFuZ2UgfSA9IG9wdGlvbnNcblxuICAvLyBDcmVhdGUgYSBzaWduYWwgdG8gdHJhY2sgdXBkYXRlc1xuICBjb25zdCBbdGljaywgc2V0VGlja10gPSBjcmVhdGVTaWduYWwoMClcblxuICAvLyBDcmVhdGUgdGhlIGVuZ2luZSBvbmNlXG4gIGNvbnN0IGVuZ2luZSA9IGNvcmVDcmVhdGVGb3JtRW5naW5lKGZpZWxkcywgaW5pdGlhbFZhbHVlcylcblxuICBjb25zdCBzZXRGaWVsZFZhbHVlID0gKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IEdyYXBoUGF0Y2ggPT4ge1xuICAgIGNvbnN0IHBhdGNoID0gZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSlcbiAgICBzZXRUaWNrKHQgPT4gdCArIDEpXG4gICAgb25DaGFuZ2U/LihrZXksIHZhbHVlLCBwYXRjaClcbiAgICByZXR1cm4gcGF0Y2hcbiAgfVxuXG4gIGNvbnN0IHJlc2V0ID0gKG5ld0ZpZWxkcz86IEZvcm1GaWVsZFtdLCBuZXdWYWx1ZXM/OiBGb3JtVmFsdWVzKTogdm9pZCA9PiB7XG4gICAgY29uc3QgbmV3RW5naW5lID0gY29yZUNyZWF0ZUZvcm1FbmdpbmUobmV3RmllbGRzID8/IGZpZWxkcywgbmV3VmFsdWVzID8/IGluaXRpYWxWYWx1ZXMpXG4gICAgT2JqZWN0LmFzc2lnbihlbmdpbmUsIG5ld0VuZ2luZSlcbiAgICBzZXRUaWNrKHQgPT4gdCArIDEpXG4gIH1cblxuICAvLyBDcmVhdGUgbWVtb3MgdGhhdCBkZXBlbmQgb24gdGlja1xuICBjb25zdCB2YWx1ZXMgPSBjcmVhdGVNZW1vKCgpID0+IHtcbiAgICB0aWNrKClcbiAgICByZXR1cm4gZW5naW5lLmdldFZhbHVlcygpXG4gIH0pXG5cbiAgY29uc3QgdmlzaWJsZUZpZWxkcyA9IGNyZWF0ZU1lbW8oKCkgPT4ge1xuICAgIHRpY2soKVxuICAgIHJldHVybiBlbmdpbmUuZ2V0VmlzaWJsZUZpZWxkcygpXG4gIH0pXG5cbiAgY29uc3QgZ2V0RmllbGRTdGF0ZSA9IChrZXk6IHN0cmluZyk6IEZpZWxkTm9kZVN0YXRlIHwgdW5kZWZpbmVkID0+IHtcbiAgICByZXR1cm4gZW5naW5lLmdldEZpZWxkU3RhdGUoa2V5KVxuICB9XG5cbiAgY29uc3QgdmFsaWRhdGUgPSAoKSA9PiB7XG4gICAgdGljaygpXG4gICAgcmV0dXJuIGVuZ2luZS52YWxpZGF0ZSgpXG4gIH1cblxuICBjb25zdCB2YWxpZGF0ZVN0ZXAgPSAoc3RlcElkOiBzdHJpbmcpID0+IHtcbiAgICB0aWNrKClcbiAgICByZXR1cm4gZW5naW5lLnZhbGlkYXRlU3RlcChzdGVwSWQpXG4gIH1cblxuICBjb25zdCBjb2xsZWN0U3VibWlzc2lvblZhbHVlcyA9ICgpID0+IHtcbiAgICB0aWNrKClcbiAgICByZXR1cm4gZW5naW5lLmNvbGxlY3RTdWJtaXNzaW9uVmFsdWVzKClcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZW5naW5lLFxuICAgIHZhbHVlcyxcbiAgICBzZXRGaWVsZFZhbHVlLFxuICAgIHZpc2libGVGaWVsZHMsXG4gICAgZ2V0RmllbGRTdGF0ZSxcbiAgICB2YWxpZGF0ZSxcbiAgICB2YWxpZGF0ZVN0ZXAsXG4gICAgY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMsXG4gICAgcmVzZXQsXG4gIH1cbn1cbiJdfQ==