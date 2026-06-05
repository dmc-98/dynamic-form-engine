import React from 'react';
import type { StepNodeState } from '@dmc--98/dfe-core';
export interface DfeStepIndicatorProps {
    /** All visible steps */
    steps: StepNodeState[];
    /** Current step index (zero-based) */
    currentIndex: number;
    /** Callback when a step is clicked */
    onStepClick?: (index: number) => void;
    /** Class name for the container */
    className?: string;
}
/**
 * Headless step progress indicator for multi-step forms.
 * Renders an unstyled ordered list of steps with data attributes
 * for styling via CSS.
 *
 * Data attributes on each step:
 * - `data-dfe-step` — step ID
 * - `data-dfe-active` — "true" if this is the current step
 * - `data-dfe-complete` — "true" if the step is marked complete
 * - `data-dfe-clickable` — "true" if onStepClick is provided
 *
 * @example
 * ```tsx
 * <DfeStepIndicator
 *   steps={stepper.visibleSteps}
 *   currentIndex={stepper.currentIndex}
 *   onStepClick={stepper.jumpTo}
 * />
 * ```
 */
export declare function DfeStepIndicator({ steps, currentIndex, onStepClick, className, }: DfeStepIndicatorProps): React.ReactElement;
