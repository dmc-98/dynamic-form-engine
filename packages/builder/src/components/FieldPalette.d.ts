import React from 'react';
import type { FieldType } from '@dmc--98/dfe-core';
export interface FieldPaletteProps {
    /** Callback when a field type is selected for dragging */
    onFieldTypeSelect?: (fieldType: FieldType) => void;
    /** Class name for the container */
    className?: string;
}
/**
 * Sidebar palette showing all available field types grouped by category.
 * Supports HTML5 drag-and-drop with field types.
 */
export declare function FieldPalette({ onFieldTypeSelect, className }: FieldPaletteProps): React.ReactElement;
