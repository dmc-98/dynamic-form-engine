"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFormEngine = useFormEngine;
const vue_1 = require("vue");
const dfe_core_1 = require("@dmc--98/dfe-core");
// ─── Composable ─────────────────────────────────────────────────────────────
/**
 * Vue 3 composable that wraps createFormEngine with reactive state.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFormEngine } from '@dmc--98/dfe-vue'
 *
 * const props = defineProps<{ fields: FormField[] }>()
 *
 * const { values, setFieldValue, visibleFields, validate } = useFormEngine({
 *   fields: props.fields,
 * })
 *
 * const handleSubmit = () => {
 *   const { success, errors } = validate()
 *   if (success) {
 *     submitToApi(values)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleSubmit">
 *     <div v-for="field in visibleFields" :key="field.key">
 *       <MyFieldComponent
 *         :field="field"
 *         :value="values[field.key]"
 *         @change="(v) => setFieldValue(field.key, v)"
 *       />
 *     </div>
 *     <button type="submit">Submit</button>
 *   </form>
 * </template>
 * ```
 */
function useFormEngine(options) {
    const { fields, initialValues, onChange } = options;
    // Store engine in a shallow ref to avoid unnecessary reactivity overhead
    const engine = (0, vue_1.shallowRef)((0, dfe_core_1.createFormEngine)(fields, initialValues));
    // Tick counter to trigger reactivity on state changes
    const tick = (0, vue_1.ref)(0);
    const setFieldValue = (key, value) => {
        const patch = engine.value.setFieldValue(key, value);
        tick.value++;
        onChange === null || onChange === void 0 ? void 0 : onChange(key, value, patch);
        return patch;
    };
    const reset = (newFields, newValues) => {
        engine.value = (0, dfe_core_1.createFormEngine)(newFields !== null && newFields !== void 0 ? newFields : fields, newValues !== null && newValues !== void 0 ? newValues : initialValues);
        tick.value++;
    };
    // Computed properties that depend on tick
    const values = (0, vue_1.computed)(() => {
        // Access tick to establish dependency
        tick.value;
        return engine.value.getValues();
    });
    const visibleFields = (0, vue_1.computed)(() => {
        // Access tick to establish dependency
        tick.value;
        return engine.value.getVisibleFields();
    });
    const getFieldState = (key) => {
        return engine.value.getFieldState(key);
    };
    const validate = () => {
        tick.value;
        return engine.value.validate();
    };
    const validateStep = (stepId) => {
        tick.value;
        return engine.value.validateStep(stepId);
    };
    const collectSubmissionValues = () => {
        tick.value;
        return engine.value.collectSubmissionValues();
    };
    return {
        engine: engine.value,
        values: readonly(values),
        setFieldValue,
        visibleFields: readonly(visibleFields),
        getFieldState,
        validate,
        validateStep,
        collectSubmissionValues,
        reset,
    };
}
// Helper to make computed readonly
function readonly(computed) {
    return computed;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlRm9ybUVuZ2luZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZUZvcm1FbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUE2RUEsc0NBZ0VDO0FBN0lELDZCQUE0RDtBQUM1RCxrREFJNEI7QUFrQzVCLCtFQUErRTtBQUUvRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQ0c7QUFDSCxTQUFnQixhQUFhLENBQUMsT0FBNkI7SUFDekQsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFBO0lBRW5ELHlFQUF5RTtJQUN6RSxNQUFNLE1BQU0sR0FBRyxJQUFBLGdCQUFVLEVBQWEsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQTtJQUU5RSxzREFBc0Q7SUFDdEQsTUFBTSxJQUFJLEdBQUcsSUFBQSxTQUFHLEVBQUMsQ0FBQyxDQUFDLENBQUE7SUFFbkIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFXLEVBQUUsS0FBYyxFQUFjLEVBQUU7UUFDaEUsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3BELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUNaLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRyxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzdCLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQyxDQUFBO0lBRUQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxTQUF1QixFQUFFLFNBQXNCLEVBQVEsRUFBRTtRQUN0RSxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUEsMkJBQWdCLEVBQUMsU0FBUyxhQUFULFNBQVMsY0FBVCxTQUFTLEdBQUksTUFBTSxFQUFFLFNBQVMsYUFBVCxTQUFTLGNBQVQsU0FBUyxHQUFJLGFBQWEsQ0FBQyxDQUFBO1FBQ2hGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUNkLENBQUMsQ0FBQTtJQUVELDBDQUEwQztJQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFBLGNBQVEsRUFBQyxHQUFHLEVBQUU7UUFDM0Isc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxLQUFLLENBQUE7UUFDVixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUE7SUFDakMsQ0FBQyxDQUFDLENBQUE7SUFFRixNQUFNLGFBQWEsR0FBRyxJQUFBLGNBQVEsRUFBQyxHQUFHLEVBQUU7UUFDbEMsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxLQUFLLENBQUE7UUFDVixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtJQUN4QyxDQUFDLENBQUMsQ0FBQTtJQUVGLE1BQU0sYUFBYSxHQUFHLENBQUMsR0FBVyxFQUE4QixFQUFFO1FBQ2hFLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDeEMsQ0FBQyxDQUFBO0lBRUQsTUFBTSxRQUFRLEdBQUcsR0FBRyxFQUFFO1FBQ3BCLElBQUksQ0FBQyxLQUFLLENBQUE7UUFDVixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDaEMsQ0FBQyxDQUFBO0lBRUQsTUFBTSxZQUFZLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRTtRQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBQ1YsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUMxQyxDQUFDLENBQUE7SUFFRCxNQUFNLHVCQUF1QixHQUFHLEdBQUcsRUFBRTtRQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBQ1YsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUE7SUFDL0MsQ0FBQyxDQUFBO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSztRQUNwQixNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUN4QixhQUFhO1FBQ2IsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDdEMsYUFBYTtRQUNiLFFBQVE7UUFDUixZQUFZO1FBQ1osdUJBQXVCO1FBQ3ZCLEtBQUs7S0FDTixDQUFBO0FBQ0gsQ0FBQztBQUVELG1DQUFtQztBQUNuQyxTQUFTLFFBQVEsQ0FBSSxRQUFhO0lBQ2hDLE9BQU8sUUFBZSxDQUFBO0FBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWYsIGNvbXB1dGVkLCBzaGFsbG93UmVmLCBvblVubW91bnRlZCB9IGZyb20gJ3Z1ZSdcbmltcG9ydCB7XG4gIGNyZWF0ZUZvcm1FbmdpbmUsXG4gIHR5cGUgRm9ybUZpZWxkLCB0eXBlIEZvcm1WYWx1ZXMsIHR5cGUgRm9ybUVuZ2luZSxcbiAgdHlwZSBHcmFwaFBhdGNoLCB0eXBlIEZpZWxkTm9kZVN0YXRlLFxufSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuXG4vLyDilIDilIDilIAgVHlwZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlRm9ybUVuZ2luZU9wdGlvbnMge1xuICAvKiogRm9ybSBmaWVsZCBkZWZpbml0aW9ucyAqL1xuICBmaWVsZHM6IEZvcm1GaWVsZFtdXG4gIC8qKiBQcmUtZXhpc3RpbmcgdmFsdWVzIHRvIGh5ZHJhdGUgKi9cbiAgaW5pdGlhbFZhbHVlcz86IEZvcm1WYWx1ZXNcbiAgLyoqIENhbGxiYWNrIHdoZW4gYW55IGZpZWxkIHZhbHVlIGNoYW5nZXMgKi9cbiAgb25DaGFuZ2U/OiAoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duLCBwYXRjaDogR3JhcGhQYXRjaCkgPT4gdm9pZFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVzZUZvcm1FbmdpbmVSZXR1cm4ge1xuICAvKiogVGhlIHVuZGVybHlpbmcgZW5naW5lIGluc3RhbmNlICovXG4gIGVuZ2luZTogRm9ybUVuZ2luZVxuICAvKiogQ3VycmVudCBmb3JtIHZhbHVlcyAocmVhY3RpdmUpICovXG4gIHZhbHVlczogUmVhZG9ubHk8Rm9ybVZhbHVlcz5cbiAgLyoqIFNldCBhIGZpZWxkIHZhbHVlICh0cmlnZ2VycyBjb25kaXRpb24gcmUtZXZhbHVhdGlvbikgKi9cbiAgc2V0RmllbGRWYWx1ZTogKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bikgPT4gR3JhcGhQYXRjaFxuICAvKiogQWxsIGN1cnJlbnRseSB2aXNpYmxlIGZpZWxkcyAqL1xuICB2aXNpYmxlRmllbGRzOiBSZWFkb25seTxGb3JtRmllbGRbXT5cbiAgLyoqIEdldCB0aGUgc3RhdGUgb2YgYSBzcGVjaWZpYyBmaWVsZCAqL1xuICBnZXRGaWVsZFN0YXRlOiAoa2V5OiBzdHJpbmcpID0+IEZpZWxkTm9kZVN0YXRlIHwgdW5kZWZpbmVkXG4gIC8qKiBWYWxpZGF0ZSBhbGwgdmlzaWJsZSByZXF1aXJlZCBmaWVsZHMgKi9cbiAgdmFsaWRhdGU6ICgpID0+IHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH1cbiAgLyoqIFZhbGlkYXRlIGEgc2luZ2xlIHN0ZXAncyBmaWVsZHMgKi9cbiAgdmFsaWRhdGVTdGVwOiAoc3RlcElkOiBzdHJpbmcpID0+IHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH1cbiAgLyoqIENvbGxlY3QgdmFsdWVzIGZvciBzdWJtaXNzaW9uIChleGNsdWRlcyBoaWRkZW4vbGF5b3V0KSAqL1xuICBjb2xsZWN0U3VibWlzc2lvblZhbHVlczogKCkgPT4gRm9ybVZhbHVlc1xuICAvKiogUmVzZXQgdGhlIGVuZ2luZSB3aXRoIG5ldyBmaWVsZHMvdmFsdWVzICovXG4gIHJlc2V0OiAoZmllbGRzPzogRm9ybUZpZWxkW10sIHZhbHVlcz86IEZvcm1WYWx1ZXMpID0+IHZvaWRcbn1cblxuLy8g4pSA4pSA4pSAIENvbXBvc2FibGUg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbi8qKlxuICogVnVlIDMgY29tcG9zYWJsZSB0aGF0IHdyYXBzIGNyZWF0ZUZvcm1FbmdpbmUgd2l0aCByZWFjdGl2ZSBzdGF0ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdnVlXG4gKiA8c2NyaXB0IHNldHVwIGxhbmc9XCJ0c1wiPlxuICogaW1wb3J0IHsgdXNlRm9ybUVuZ2luZSB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLXZ1ZSdcbiAqXG4gKiBjb25zdCBwcm9wcyA9IGRlZmluZVByb3BzPHsgZmllbGRzOiBGb3JtRmllbGRbXSB9PigpXG4gKlxuICogY29uc3QgeyB2YWx1ZXMsIHNldEZpZWxkVmFsdWUsIHZpc2libGVGaWVsZHMsIHZhbGlkYXRlIH0gPSB1c2VGb3JtRW5naW5lKHtcbiAqICAgZmllbGRzOiBwcm9wcy5maWVsZHMsXG4gKiB9KVxuICpcbiAqIGNvbnN0IGhhbmRsZVN1Ym1pdCA9ICgpID0+IHtcbiAqICAgY29uc3QgeyBzdWNjZXNzLCBlcnJvcnMgfSA9IHZhbGlkYXRlKClcbiAqICAgaWYgKHN1Y2Nlc3MpIHtcbiAqICAgICBzdWJtaXRUb0FwaSh2YWx1ZXMpXG4gKiAgIH1cbiAqIH1cbiAqIDwvc2NyaXB0PlxuICpcbiAqIDx0ZW1wbGF0ZT5cbiAqICAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PVwiaGFuZGxlU3VibWl0XCI+XG4gKiAgICAgPGRpdiB2LWZvcj1cImZpZWxkIGluIHZpc2libGVGaWVsZHNcIiA6a2V5PVwiZmllbGQua2V5XCI+XG4gKiAgICAgICA8TXlGaWVsZENvbXBvbmVudFxuICogICAgICAgICA6ZmllbGQ9XCJmaWVsZFwiXG4gKiAgICAgICAgIDp2YWx1ZT1cInZhbHVlc1tmaWVsZC5rZXldXCJcbiAqICAgICAgICAgQGNoYW5nZT1cIih2KSA9PiBzZXRGaWVsZFZhbHVlKGZpZWxkLmtleSwgdilcIlxuICogICAgICAgLz5cbiAqICAgICA8L2Rpdj5cbiAqICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5TdWJtaXQ8L2J1dHRvbj5cbiAqICAgPC9mb3JtPlxuICogPC90ZW1wbGF0ZT5cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRm9ybUVuZ2luZShvcHRpb25zOiBVc2VGb3JtRW5naW5lT3B0aW9ucyk6IFVzZUZvcm1FbmdpbmVSZXR1cm4ge1xuICBjb25zdCB7IGZpZWxkcywgaW5pdGlhbFZhbHVlcywgb25DaGFuZ2UgfSA9IG9wdGlvbnNcblxuICAvLyBTdG9yZSBlbmdpbmUgaW4gYSBzaGFsbG93IHJlZiB0byBhdm9pZCB1bm5lY2Vzc2FyeSByZWFjdGl2aXR5IG92ZXJoZWFkXG4gIGNvbnN0IGVuZ2luZSA9IHNoYWxsb3dSZWY8Rm9ybUVuZ2luZT4oY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMsIGluaXRpYWxWYWx1ZXMpKVxuXG4gIC8vIFRpY2sgY291bnRlciB0byB0cmlnZ2VyIHJlYWN0aXZpdHkgb24gc3RhdGUgY2hhbmdlc1xuICBjb25zdCB0aWNrID0gcmVmKDApXG5cbiAgY29uc3Qgc2V0RmllbGRWYWx1ZSA9IChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24pOiBHcmFwaFBhdGNoID0+IHtcbiAgICBjb25zdCBwYXRjaCA9IGVuZ2luZS52YWx1ZS5zZXRGaWVsZFZhbHVlKGtleSwgdmFsdWUpXG4gICAgdGljay52YWx1ZSsrXG4gICAgb25DaGFuZ2U/LihrZXksIHZhbHVlLCBwYXRjaClcbiAgICByZXR1cm4gcGF0Y2hcbiAgfVxuXG4gIGNvbnN0IHJlc2V0ID0gKG5ld0ZpZWxkcz86IEZvcm1GaWVsZFtdLCBuZXdWYWx1ZXM/OiBGb3JtVmFsdWVzKTogdm9pZCA9PiB7XG4gICAgZW5naW5lLnZhbHVlID0gY3JlYXRlRm9ybUVuZ2luZShuZXdGaWVsZHMgPz8gZmllbGRzLCBuZXdWYWx1ZXMgPz8gaW5pdGlhbFZhbHVlcylcbiAgICB0aWNrLnZhbHVlKytcbiAgfVxuXG4gIC8vIENvbXB1dGVkIHByb3BlcnRpZXMgdGhhdCBkZXBlbmQgb24gdGlja1xuICBjb25zdCB2YWx1ZXMgPSBjb21wdXRlZCgoKSA9PiB7XG4gICAgLy8gQWNjZXNzIHRpY2sgdG8gZXN0YWJsaXNoIGRlcGVuZGVuY3lcbiAgICB0aWNrLnZhbHVlXG4gICAgcmV0dXJuIGVuZ2luZS52YWx1ZS5nZXRWYWx1ZXMoKVxuICB9KVxuXG4gIGNvbnN0IHZpc2libGVGaWVsZHMgPSBjb21wdXRlZCgoKSA9PiB7XG4gICAgLy8gQWNjZXNzIHRpY2sgdG8gZXN0YWJsaXNoIGRlcGVuZGVuY3lcbiAgICB0aWNrLnZhbHVlXG4gICAgcmV0dXJuIGVuZ2luZS52YWx1ZS5nZXRWaXNpYmxlRmllbGRzKClcbiAgfSlcblxuICBjb25zdCBnZXRGaWVsZFN0YXRlID0gKGtleTogc3RyaW5nKTogRmllbGROb2RlU3RhdGUgfCB1bmRlZmluZWQgPT4ge1xuICAgIHJldHVybiBlbmdpbmUudmFsdWUuZ2V0RmllbGRTdGF0ZShrZXkpXG4gIH1cblxuICBjb25zdCB2YWxpZGF0ZSA9ICgpID0+IHtcbiAgICB0aWNrLnZhbHVlXG4gICAgcmV0dXJuIGVuZ2luZS52YWx1ZS52YWxpZGF0ZSgpXG4gIH1cblxuICBjb25zdCB2YWxpZGF0ZVN0ZXAgPSAoc3RlcElkOiBzdHJpbmcpID0+IHtcbiAgICB0aWNrLnZhbHVlXG4gICAgcmV0dXJuIGVuZ2luZS52YWx1ZS52YWxpZGF0ZVN0ZXAoc3RlcElkKVxuICB9XG5cbiAgY29uc3QgY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMgPSAoKSA9PiB7XG4gICAgdGljay52YWx1ZVxuICAgIHJldHVybiBlbmdpbmUudmFsdWUuY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMoKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBlbmdpbmU6IGVuZ2luZS52YWx1ZSxcbiAgICB2YWx1ZXM6IHJlYWRvbmx5KHZhbHVlcyksXG4gICAgc2V0RmllbGRWYWx1ZSxcbiAgICB2aXNpYmxlRmllbGRzOiByZWFkb25seSh2aXNpYmxlRmllbGRzKSxcbiAgICBnZXRGaWVsZFN0YXRlLFxuICAgIHZhbGlkYXRlLFxuICAgIHZhbGlkYXRlU3RlcCxcbiAgICBjb2xsZWN0U3VibWlzc2lvblZhbHVlcyxcbiAgICByZXNldCxcbiAgfVxufVxuXG4vLyBIZWxwZXIgdG8gbWFrZSBjb21wdXRlZCByZWFkb25seVxuZnVuY3Rpb24gcmVhZG9ubHk8VD4oY29tcHV0ZWQ6IGFueSk6IFJlYWRvbmx5PFQ+IHtcbiAgcmV0dXJuIGNvbXB1dGVkIGFzIGFueVxufVxuIl19