import React from 'react';
import type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core';
export interface DfeMantineFormPreviewProps {
    fields: FormField[];
    values: FormValues;
    steps?: StepNodeState[];
    className?: string;
}
/**
 * Styled read-only form preview using Mantine design patterns.
 */
export declare function DfeMantineFormPreview({ fields, values, steps, className, }: DfeMantineFormPreviewProps): React.ReactElement;
