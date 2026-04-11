import React from 'react';
import type { StepNodeState } from '@dmc-98/dfe-core';
export interface DfeShadcnStepIndicatorProps {
    steps: StepNodeState[];
    currentIndex: number;
    onStepClick?: (index: number) => void;
    className?: string;
}
/**
 * Styled step indicator using shadcn/ui design patterns.
 */
export declare function DfeShadcnStepIndicator({ steps, currentIndex, onStepClick, className, }: DfeShadcnStepIndicatorProps): React.ReactElement;
