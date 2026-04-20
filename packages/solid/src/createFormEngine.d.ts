import { Accessor } from 'solid-js';
import { type FormField, type FormValues, type FormEngine, type GraphPatch, type FieldNodeState } from '@dmc--98/dfe-core';
export interface CreateFormEngineSignalsOptions {
    /** Form field definitions */
    fields: FormField[];
    /** Pre-existing values to hydrate */
    initialValues?: FormValues;
    /** Callback when any field value changes */
    onChange?: (key: string, value: unknown, patch: GraphPatch) => void;
}
export interface CreateFormEngineSignalsReturn {
    /** The underlying engine instance */
    engine: FormEngine;
    /** Current form values (accessor) */
    values: Accessor<FormValues>;
    /** Set a field value (triggers condition re-evaluation) */
    setFieldValue: (key: string, value: unknown) => GraphPatch;
    /** All currently visible fields (accessor) */
    visibleFields: Accessor<FormField[]>;
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
 * Solid.js primitive for reactive form engine state using signals and memos.
 *
 * @example
 * ```tsx
 * import { createFormEngine } from '@dmc--98/dfe-solid'
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
export declare function createFormEngine(options: CreateFormEngineSignalsOptions): CreateFormEngineSignalsReturn;
