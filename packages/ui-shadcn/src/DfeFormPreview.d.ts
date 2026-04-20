import React from 'react';
import type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core';
export interface DfeShadcnFormPreviewProps {
    fields: FormField[];
    values: FormValues;
    steps?: StepNodeState[];
    className?: string;
}
/**
 * Styled read-only form preview using shadcn/ui design patterns.
 */
export declare function DfeShadcnFormPreview({ fields, values, steps, className, }: DfeShadcnFormPreviewProps): React.ReactElement;
