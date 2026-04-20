import React from 'react';
import type { FormField, FormStep } from '@dmc--98/dfe-core';
export interface DfePlaygroundProps {
    /** Initial form configuration JSON string */
    initialConfig?: string;
    /** Class name for the container */
    className?: string;
}
export interface FormConfig {
    fields: FormField[];
    steps?: FormStep[];
}
/**
 * Interactive playground for testing Dynamic Form Engine configurations.
 * Split pane with JSON editor on left and live form preview on right.
 * Includes validation, template loading, and field value inspection.
 */
export declare function DfePlayground({ initialConfig, className }: DfePlaygroundProps): React.ReactElement;
