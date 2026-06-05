import { type FormField, type FormValues, type FormEngine, type GraphPatch, type FieldNodeState } from '@dmc--98/dfe-core';
export interface UseFormEngineOptions {
    /** Form field definitions */
    fields: FormField[];
    /** Pre-existing values to hydrate */
    initialValues?: FormValues;
    /** Callback when any field value changes */
    onChange?: (key: string, value: unknown, patch: GraphPatch) => void;
}
export interface UseFormEngineReturn {
    /** The underlying engine instance */
    engine: FormEngine;
    /** Current form values (reactive) */
    values: FormValues;
    /** Set a field value (triggers condition re-evaluation) */
    setFieldValue: (key: string, value: unknown) => GraphPatch;
    /** All currently visible fields */
    visibleFields: FormField[];
    /** Get the state of a specific field */
    getFieldState: (key: string) => FieldNodeState | undefined;
    /** Validate all visible required fields */
    validate: () => {
        success: boolean;
        errors: Record<string, string>;
    };
    /** Validate a single step's fields */
    validateStep: (stepId: string) => {
        success: boolean;
        errors: Record<string, string>;
    };
    /** Collect values for submission (excludes hidden/layout) */
    collectSubmissionValues: () => FormValues;
    /** Reset the engine with new fields/values */
    reset: (fields?: FormField[], values?: FormValues) => void;
}
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
export declare function useFormEngine(options: UseFormEngineOptions): UseFormEngineReturn;
