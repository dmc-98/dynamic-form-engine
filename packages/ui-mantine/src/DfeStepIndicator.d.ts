import React from 'react';
import type { StepNodeState } from '@dmc--98/dfe-core';
export interface DfeMantineStepIndicatorProps {
    steps: StepNodeState[];
    currentIndex: number;
    onStepClick?: (index: number) => void;
    className?: string;
}
/**
 * Styled step indicator using Mantine design patterns.
 */
export declare function DfeMantineStepIndicator({ steps, currentIndex, onStepClick, className, }: DfeMantineStepIndicatorProps): React.ReactElement;
