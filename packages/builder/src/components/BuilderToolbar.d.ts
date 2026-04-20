import React from 'react';
import type { FormField, FormStep } from '@dmc--98/dfe-core';
import type { BuilderAction } from '../types';
export interface BuilderToolbarProps {
    /** All fields to export */
    fields: FormField[];
    /** All steps to export */
    steps: FormStep[];
    /** Callback to dispatch builder actions */
    dispatch: React.Dispatch<BuilderAction>;
    /** Whether undo is available */
    canUndo?: boolean;
    /** Whether redo is available */
    canRedo?: boolean;
    /** Class name for the container */
    className?: string;
}
/**
 * Top toolbar with actions like export/import, preview, undo/redo, and add step.
 */
export declare function BuilderToolbar({ fields, steps, dispatch, className, }: BuilderToolbarProps): React.ReactElement;
