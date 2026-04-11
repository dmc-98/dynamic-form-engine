import React from 'react';
import type { StepConfig } from '@dmc-98/dfe-core';
export interface StepConfigPanelProps {
    /** Current step configuration */
    config: StepConfig;
    /** Callback when configuration changes */
    onChange: (config: StepConfig) => void;
    /** Class name for the container */
    className?: string;
}
/**
 * Builder panel for configuring a form step's API contracts and review settings.
 *
 * Uses API-centric terminology throughout:
 * - "API Configuration" (not "Model Bindings")
 * - "API Endpoint" (not "Model")
 * - "Resource name" (not "Model name")
 * - "Request Body Mapping" (not "Field Mapping")
 * - "Context → Request Body" (not "Context → Model")
 *
 * @example
 * ```tsx
 * <StepConfigPanel
 *   config={step.config ?? {}}
 *   onChange={(newConfig) => updateStep(step.id, { config: newConfig })}
 * />
 * ```
 */
export declare function StepConfigPanel({ config, onChange, className }: StepConfigPanelProps): React.JSX.Element;
