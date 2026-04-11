import React from 'react';
import type { FormField, FieldType } from '@dmc-98/dfe-core';
import type { BuilderAction } from '../types';
export interface FormCanvasProps {
    /** All fields to display */
    fields: FormField[];
    /** Currently selected field ID */
    selectedFieldId: string | null;
    /** Callback when field is selected */
    onSelectField: (fieldId: string) => void;
    /** Callback when field is dragged to new position */
    onReorderField: (fieldId: string, newOrder: number) => void;
    /** Callback when a field type is dropped */
    onDropField: (fieldType: FieldType, order: number) => void;
    /** Callback to dispatch builder actions */
    dispatch: React.Dispatch<BuilderAction>;
    /** Class name for the container */
    className?: string;
}
/**
 * Central canvas area where form fields are displayed and can be reordered.
 * Accepts dropped field types from the palette.
 */
export declare function FormCanvas({ fields, selectedFieldId, onSelectField, onReorderField, onDropField, dispatch, className, }: FormCanvasProps): React.ReactElement;
