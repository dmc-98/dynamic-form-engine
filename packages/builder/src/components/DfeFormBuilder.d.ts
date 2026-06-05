import React from 'react';
export interface DfeFormBuilderProps {
    /** Class name for the builder container */
    className?: string;
}
/**
 * Main form builder component with a 3-panel layout:
 * - Left: Field palette
 * - Center: Form canvas with field cards
 * - Right: Property editor
 *
 * Includes a top toolbar for export/import and other actions.
 */
export declare function DfeFormBuilder({ className }: DfeFormBuilderProps): React.ReactElement;
