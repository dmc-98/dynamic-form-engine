import React from 'react';
import type { FormField, FieldType } from '@dmc-98/dfe-core';
export interface ConfigPanelProps {
    /** The field being configured */
    field: FormField;
    /** Callback when field properties change */
    onChange: (updates: Partial<FormField>) => void;
    /** Available field types (subset can be passed for restricted builders) */
    allowedTypes?: FieldType[];
    /** Class name for the container */
    className?: string;
}
/**
 * Builder panel for configuring a single form field.
 *
 * Renders a "Basics" section (label, key, type, required) and a
 * type-specific configuration panel.
 *
 * **Intentionally omits field-level "Model Binding"** — the step-level
 * StepConfigPanel's "Request Body Mapping" is the single source of truth
 * for mapping field values to API request bodies.
 *
 * For SELECT fields, uses API-centric labels:
 * - "Resource name" (not "Model name")
 * - "Display field" (not "Label key")
 * - "ID field" (not "Value key")
 *
 * @example
 * ```tsx
 * <ConfigPanel
 *   field={selectedField}
 *   onChange={(updates) => updateField(selectedField.id, updates)}
 * />
 * ```
 */
export declare function ConfigPanel({ field, onChange, allowedTypes, className }: ConfigPanelProps): React.JSX.Element;
