import React from 'react';
import type { FormField, FormStep } from '@dmc--98/dfe-core';
export interface PropertyEditorProps {
    /** Selected field to edit, or null */
    selectedField: FormField | null;
    /** Selected step to edit, or null */
    selectedStep: FormStep | null;
    /** Callback when field is updated */
    onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
    /** Callback when step is updated */
    onUpdateStep: (stepId: string, updates: Partial<FormStep>) => void;
    /** Class name for the container */
    className?: string;
}
/**
 * Right panel for editing properties of selected field or step.
 * Shows type-specific configuration options.
 */
export declare function PropertyEditor({ selectedField, selectedStep, onUpdateField, onUpdateStep, className, }: PropertyEditorProps): React.ReactElement;
