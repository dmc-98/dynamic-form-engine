"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFormEngine = useFormEngine;
const react_1 = require("react");
const dfe_core_1 = require("@dmc--98/dfe-core");
// ─── Hook ───────────────────────────────────────────────────────────────────
/**
 * React hook that wraps createFormEngine with reactive state.
 *
 * @example
 * ```tsx
 * import { useFormEngine } from '@dmc--98/dfe-react'
 *
 * function MyForm({ fields, initialData }) {
 *   const { values, setFieldValue, visibleFields, validate } = useFormEngine({
 *     fields,
 *     initialValues: initialData,
 *   })
 *
 *   return (
 *     <form onSubmit={() => {
 *       const { success, errors } = validate()
 *       if (success) submitToApi(values)
 *     }}>
 *       {visibleFields.map(field => (
 *         <MyFieldComponent
 *           key={field.key}
 *           field={field}
 *           value={values[field.key]}
 *           onChange={(v) => setFieldValue(field.key, v)}
 *         />
 *       ))}
 *     </form>
 *   )
 * }
 * ```
 */
function useFormEngine(options) {
    const { fields, initialValues, onChange } = options;
    // Use ref to hold engine to avoid re-creating on every render
    const engineRef = (0, react_1.useRef)((0, dfe_core_1.createFormEngine)(fields, initialValues));
    // Reactive state trigger — increment to force re-render
    const [tick, setTick] = (0, react_1.useState)(0);
    const setFieldValue = (0, react_1.useCallback)((key, value) => {
        const patch = engineRef.current.setFieldValue(key, value);
        setTick(t => t + 1);
        onChange === null || onChange === void 0 ? void 0 : onChange(key, value, patch);
        return patch;
    }, [onChange]);
    const reset = (0, react_1.useCallback)((newFields, newValues) => {
        engineRef.current = (0, dfe_core_1.createFormEngine)(newFields !== null && newFields !== void 0 ? newFields : fields, newValues !== null && newValues !== void 0 ? newValues : initialValues);
        setTick(t => t + 1);
    }, [fields, initialValues]);
    // Memoize derived values based on tick
    const values = (0, react_1.useMemo)(() => engineRef.current.getValues(), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick]);
    const visibleFields = (0, react_1.useMemo)(() => engineRef.current.getVisibleFields(), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick]);
    return {
        engine: engineRef.current,
        values,
        setFieldValue,
        visibleFields,
        getFieldState: (0, react_1.useCallback)((key) => engineRef.current.getFieldState(key), []),
        validate: (0, react_1.useCallback)(() => engineRef.current.validate(), 
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tick]),
        validateStep: (0, react_1.useCallback)((stepId) => engineRef.current.validateStep(stepId), 
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tick]),
        collectSubmissionValues: (0, react_1.useCallback)(() => engineRef.current.collectSubmissionValues(), 
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tick]),
        reset,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlRm9ybUVuZ2luZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZUZvcm1FbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUF3RUEsc0NBNERDO0FBcElELGlDQUE4RDtBQUM5RCxrREFJNEI7QUFrQzVCLCtFQUErRTtBQUUvRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBOEJHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLE9BQTZCO0lBQ3pELE1BQU0sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQTtJQUVuRCw4REFBOEQ7SUFDOUQsTUFBTSxTQUFTLEdBQUcsSUFBQSxjQUFNLEVBQWEsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQTtJQUU3RSx3REFBd0Q7SUFDeEQsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUE7SUFFbkMsTUFBTSxhQUFhLEdBQUcsSUFBQSxtQkFBVyxFQUFDLENBQUMsR0FBVyxFQUFFLEtBQWMsRUFBYyxFQUFFO1FBQzVFLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN6RCxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDbkIsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFHLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDN0IsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0lBRWQsTUFBTSxLQUFLLEdBQUcsSUFBQSxtQkFBVyxFQUFDLENBQUMsU0FBdUIsRUFBRSxTQUFzQixFQUFFLEVBQUU7UUFDNUUsU0FBUyxDQUFDLE9BQU8sR0FBRyxJQUFBLDJCQUFnQixFQUFDLFNBQVMsYUFBVCxTQUFTLGNBQVQsU0FBUyxHQUFJLE1BQU0sRUFBRSxTQUFTLGFBQVQsU0FBUyxjQUFULFNBQVMsR0FBSSxhQUFhLENBQUMsQ0FBQTtRQUNyRixPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFDckIsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUE7SUFFM0IsdUNBQXVDO0lBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUEsZUFBTyxFQUNwQixHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtJQUNuQyx1REFBdUQ7SUFDdkQsQ0FBQyxJQUFJLENBQUMsQ0FDUCxDQUFBO0lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBQSxlQUFPLEVBQzNCLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUU7SUFDMUMsdURBQXVEO0lBQ3ZELENBQUMsSUFBSSxDQUFDLENBQ1AsQ0FBQTtJQUVELE9BQU87UUFDTCxNQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU87UUFDekIsTUFBTTtRQUNOLGFBQWE7UUFDYixhQUFhO1FBQ2IsYUFBYSxFQUFFLElBQUEsbUJBQVcsRUFDeEIsQ0FBQyxHQUFXLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxFQUNyRCxFQUFFLENBQ0g7UUFDRCxRQUFRLEVBQUUsSUFBQSxtQkFBVyxFQUNuQixHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtRQUNsQyx1REFBdUQ7UUFDdkQsQ0FBQyxJQUFJLENBQUMsQ0FDUDtRQUNELFlBQVksRUFBRSxJQUFBLG1CQUFXLEVBQ3ZCLENBQUMsTUFBYyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7UUFDMUQsdURBQXVEO1FBQ3ZELENBQUMsSUFBSSxDQUFDLENBQ1A7UUFDRCx1QkFBdUIsRUFBRSxJQUFBLG1CQUFXLEVBQ2xDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQUU7UUFDakQsdURBQXVEO1FBQ3ZELENBQUMsSUFBSSxDQUFDLENBQ1A7UUFDRCxLQUFLO0tBQ04sQ0FBQTtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VTdGF0ZSwgdXNlQ2FsbGJhY2ssIHVzZU1lbW8sIHVzZVJlZiB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtcbiAgY3JlYXRlRm9ybUVuZ2luZSxcbiAgdHlwZSBGb3JtRmllbGQsIHR5cGUgRm9ybVZhbHVlcywgdHlwZSBGb3JtRW5naW5lLFxuICB0eXBlIEdyYXBoUGF0Y2gsIHR5cGUgRmllbGROb2RlU3RhdGUsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5cbi8vIOKUgOKUgOKUgCBUeXBlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGludGVyZmFjZSBVc2VGb3JtRW5naW5lT3B0aW9ucyB7XG4gIC8qKiBGb3JtIGZpZWxkIGRlZmluaXRpb25zICovXG4gIGZpZWxkczogRm9ybUZpZWxkW11cbiAgLyoqIFByZS1leGlzdGluZyB2YWx1ZXMgdG8gaHlkcmF0ZSAqL1xuICBpbml0aWFsVmFsdWVzPzogRm9ybVZhbHVlc1xuICAvKiogQ2FsbGJhY2sgd2hlbiBhbnkgZmllbGQgdmFsdWUgY2hhbmdlcyAqL1xuICBvbkNoYW5nZT86IChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24sIHBhdGNoOiBHcmFwaFBhdGNoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlRm9ybUVuZ2luZVJldHVybiB7XG4gIC8qKiBUaGUgdW5kZXJseWluZyBlbmdpbmUgaW5zdGFuY2UgKi9cbiAgZW5naW5lOiBGb3JtRW5naW5lXG4gIC8qKiBDdXJyZW50IGZvcm0gdmFsdWVzIChyZWFjdGl2ZSkgKi9cbiAgdmFsdWVzOiBGb3JtVmFsdWVzXG4gIC8qKiBTZXQgYSBmaWVsZCB2YWx1ZSAodHJpZ2dlcnMgY29uZGl0aW9uIHJlLWV2YWx1YXRpb24pICovXG4gIHNldEZpZWxkVmFsdWU6IChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24pID0+IEdyYXBoUGF0Y2hcbiAgLyoqIEFsbCBjdXJyZW50bHkgdmlzaWJsZSBmaWVsZHMgKi9cbiAgdmlzaWJsZUZpZWxkczogRm9ybUZpZWxkW11cbiAgLyoqIEdldCB0aGUgc3RhdGUgb2YgYSBzcGVjaWZpYyBmaWVsZCAqL1xuICBnZXRGaWVsZFN0YXRlOiAoa2V5OiBzdHJpbmcpID0+IEZpZWxkTm9kZVN0YXRlIHwgdW5kZWZpbmVkXG4gIC8qKiBWYWxpZGF0ZSBhbGwgdmlzaWJsZSByZXF1aXJlZCBmaWVsZHMgKi9cbiAgdmFsaWRhdGU6ICgpID0+IHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH1cbiAgLyoqIFZhbGlkYXRlIGEgc2luZ2xlIHN0ZXAncyBmaWVsZHMgKi9cbiAgdmFsaWRhdGVTdGVwOiAoc3RlcElkOiBzdHJpbmcpID0+IHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH1cbiAgLyoqIENvbGxlY3QgdmFsdWVzIGZvciBzdWJtaXNzaW9uIChleGNsdWRlcyBoaWRkZW4vbGF5b3V0KSAqL1xuICBjb2xsZWN0U3VibWlzc2lvblZhbHVlczogKCkgPT4gRm9ybVZhbHVlc1xuICAvKiogUmVzZXQgdGhlIGVuZ2luZSB3aXRoIG5ldyBmaWVsZHMvdmFsdWVzICovXG4gIHJlc2V0OiAoZmllbGRzPzogRm9ybUZpZWxkW10sIHZhbHVlcz86IEZvcm1WYWx1ZXMpID0+IHZvaWRcbn1cblxuLy8g4pSA4pSA4pSAIEhvb2sg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbi8qKlxuICogUmVhY3QgaG9vayB0aGF0IHdyYXBzIGNyZWF0ZUZvcm1FbmdpbmUgd2l0aCByZWFjdGl2ZSBzdGF0ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHN4XG4gKiBpbXBvcnQgeyB1c2VGb3JtRW5naW5lIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtcmVhY3QnXG4gKlxuICogZnVuY3Rpb24gTXlGb3JtKHsgZmllbGRzLCBpbml0aWFsRGF0YSB9KSB7XG4gKiAgIGNvbnN0IHsgdmFsdWVzLCBzZXRGaWVsZFZhbHVlLCB2aXNpYmxlRmllbGRzLCB2YWxpZGF0ZSB9ID0gdXNlRm9ybUVuZ2luZSh7XG4gKiAgICAgZmllbGRzLFxuICogICAgIGluaXRpYWxWYWx1ZXM6IGluaXRpYWxEYXRhLFxuICogICB9KVxuICpcbiAqICAgcmV0dXJuIChcbiAqICAgICA8Zm9ybSBvblN1Ym1pdD17KCkgPT4ge1xuICogICAgICAgY29uc3QgeyBzdWNjZXNzLCBlcnJvcnMgfSA9IHZhbGlkYXRlKClcbiAqICAgICAgIGlmIChzdWNjZXNzKSBzdWJtaXRUb0FwaSh2YWx1ZXMpXG4gKiAgICAgfX0+XG4gKiAgICAgICB7dmlzaWJsZUZpZWxkcy5tYXAoZmllbGQgPT4gKFxuICogICAgICAgICA8TXlGaWVsZENvbXBvbmVudFxuICogICAgICAgICAgIGtleT17ZmllbGQua2V5fVxuICogICAgICAgICAgIGZpZWxkPXtmaWVsZH1cbiAqICAgICAgICAgICB2YWx1ZT17dmFsdWVzW2ZpZWxkLmtleV19XG4gKiAgICAgICAgICAgb25DaGFuZ2U9eyh2KSA9PiBzZXRGaWVsZFZhbHVlKGZpZWxkLmtleSwgdil9XG4gKiAgICAgICAgIC8+XG4gKiAgICAgICApKX1cbiAqICAgICA8L2Zvcm0+XG4gKiAgIClcbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRm9ybUVuZ2luZShvcHRpb25zOiBVc2VGb3JtRW5naW5lT3B0aW9ucyk6IFVzZUZvcm1FbmdpbmVSZXR1cm4ge1xuICBjb25zdCB7IGZpZWxkcywgaW5pdGlhbFZhbHVlcywgb25DaGFuZ2UgfSA9IG9wdGlvbnNcblxuICAvLyBVc2UgcmVmIHRvIGhvbGQgZW5naW5lIHRvIGF2b2lkIHJlLWNyZWF0aW5nIG9uIGV2ZXJ5IHJlbmRlclxuICBjb25zdCBlbmdpbmVSZWYgPSB1c2VSZWY8Rm9ybUVuZ2luZT4oY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMsIGluaXRpYWxWYWx1ZXMpKVxuXG4gIC8vIFJlYWN0aXZlIHN0YXRlIHRyaWdnZXIg4oCUIGluY3JlbWVudCB0byBmb3JjZSByZS1yZW5kZXJcbiAgY29uc3QgW3RpY2ssIHNldFRpY2tdID0gdXNlU3RhdGUoMClcblxuICBjb25zdCBzZXRGaWVsZFZhbHVlID0gdXNlQ2FsbGJhY2soKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IEdyYXBoUGF0Y2ggPT4ge1xuICAgIGNvbnN0IHBhdGNoID0gZW5naW5lUmVmLmN1cnJlbnQuc2V0RmllbGRWYWx1ZShrZXksIHZhbHVlKVxuICAgIHNldFRpY2sodCA9PiB0ICsgMSlcbiAgICBvbkNoYW5nZT8uKGtleSwgdmFsdWUsIHBhdGNoKVxuICAgIHJldHVybiBwYXRjaFxuICB9LCBbb25DaGFuZ2VdKVxuXG4gIGNvbnN0IHJlc2V0ID0gdXNlQ2FsbGJhY2soKG5ld0ZpZWxkcz86IEZvcm1GaWVsZFtdLCBuZXdWYWx1ZXM/OiBGb3JtVmFsdWVzKSA9PiB7XG4gICAgZW5naW5lUmVmLmN1cnJlbnQgPSBjcmVhdGVGb3JtRW5naW5lKG5ld0ZpZWxkcyA/PyBmaWVsZHMsIG5ld1ZhbHVlcyA/PyBpbml0aWFsVmFsdWVzKVxuICAgIHNldFRpY2sodCA9PiB0ICsgMSlcbiAgfSwgW2ZpZWxkcywgaW5pdGlhbFZhbHVlc10pXG5cbiAgLy8gTWVtb2l6ZSBkZXJpdmVkIHZhbHVlcyBiYXNlZCBvbiB0aWNrXG4gIGNvbnN0IHZhbHVlcyA9IHVzZU1lbW8oXG4gICAgKCkgPT4gZW5naW5lUmVmLmN1cnJlbnQuZ2V0VmFsdWVzKCksXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICAgIFt0aWNrXSxcbiAgKVxuXG4gIGNvbnN0IHZpc2libGVGaWVsZHMgPSB1c2VNZW1vKFxuICAgICgpID0+IGVuZ2luZVJlZi5jdXJyZW50LmdldFZpc2libGVGaWVsZHMoKSxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gICAgW3RpY2tdLFxuICApXG5cbiAgcmV0dXJuIHtcbiAgICBlbmdpbmU6IGVuZ2luZVJlZi5jdXJyZW50LFxuICAgIHZhbHVlcyxcbiAgICBzZXRGaWVsZFZhbHVlLFxuICAgIHZpc2libGVGaWVsZHMsXG4gICAgZ2V0RmllbGRTdGF0ZTogdXNlQ2FsbGJhY2soXG4gICAgICAoa2V5OiBzdHJpbmcpID0+IGVuZ2luZVJlZi5jdXJyZW50LmdldEZpZWxkU3RhdGUoa2V5KSxcbiAgICAgIFtdLFxuICAgICksXG4gICAgdmFsaWRhdGU6IHVzZUNhbGxiYWNrKFxuICAgICAgKCkgPT4gZW5naW5lUmVmLmN1cnJlbnQudmFsaWRhdGUoKSxcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgICAgIFt0aWNrXSxcbiAgICApLFxuICAgIHZhbGlkYXRlU3RlcDogdXNlQ2FsbGJhY2soXG4gICAgICAoc3RlcElkOiBzdHJpbmcpID0+IGVuZ2luZVJlZi5jdXJyZW50LnZhbGlkYXRlU3RlcChzdGVwSWQpLFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICAgICAgW3RpY2tdLFxuICAgICksXG4gICAgY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXM6IHVzZUNhbGxiYWNrKFxuICAgICAgKCkgPT4gZW5naW5lUmVmLmN1cnJlbnQuY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMoKSxcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgICAgIFt0aWNrXSxcbiAgICApLFxuICAgIHJlc2V0LFxuICB9XG59XG4iXX0=