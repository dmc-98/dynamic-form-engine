import React from 'react';
import type { FormField, FormValues } from '@dmc-98/dfe-core';
import type { FieldRendererProps } from '../renderers';
export interface DfeFormRendererProps {
    /** Visible fields to render */
    fields: FormField[];
    /** Current form values */
    values: FormValues;
    /** Callback when a field value changes */
    onFieldChange: (key: string, value: unknown) => void;
    /** Validation errors keyed by field key */
    errors?: Record<string, string>;
    /**
     * Custom field renderer. If not provided, renders a default
     * unstyled input for each field type.
     */
    renderField?: React.ComponentType<FieldRendererProps>;
    /** Class name for the form container */
    className?: string;
}
/**
 * Headless form renderer that iterates over visible fields
 * and renders each one using a field renderer function.
 *
 * By default, renders unstyled HTML inputs. Pass `renderField`
 * to use your own UI components.
 *
 * @example
 * ```tsx
 * <DfeFormRenderer
 *   fields={engine.visibleFields}
 *   values={engine.values}
 *   onFieldChange={engine.setFieldValue}
 *   errors={validationErrors}
 *   renderField={({ field, value, onChange, error }) => (
 *     <MyCustomInput field={field} value={value} onChange={onChange} error={error} />
 *   )}
 * />
 * ```
 */
export declare function DefaultFieldRenderer(props: FieldRendererProps): React.ReactElement;
export declare function DfeFormRenderer({ fields, values, onFieldChange, errors, renderField, className, }: DfeFormRendererProps): React.ReactElement;
export type { FieldRendererProps } from '../renderers';
