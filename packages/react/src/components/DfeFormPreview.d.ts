import React from 'react';
import type { FormField, FormValues, StepNodeState } from '@dmc-98/dfe-core';
export interface DfeFormPreviewProps {
    fields: FormField[];
    values: FormValues;
    steps?: StepNodeState[];
    className?: string;
    renderValue?: (field: FormField, value: unknown) => React.ReactNode;
}
/**
 * Read-only form preview component that displays form values in a formatted view.
 * Automatically groups fields by steps if steps are provided.
 * Handles proper formatting for all field types (dates, booleans, multiselects, etc.)
 *
 * @example
 * ```tsx
 * <DfeFormPreview
 *   fields={engine.allFields}
 *   values={engine.values}
 *   steps={stepper.allSteps}
 *   renderValue={(field, value) => (
 *     field.type === 'CHECKBOX' ? (value ? '✓' : '✗') : undefined
 *   )}
 * />
 * ```
 */
export declare function DfeFormPreview({ fields, values, steps, className, renderValue, }: DfeFormPreviewProps): React.ReactElement;
