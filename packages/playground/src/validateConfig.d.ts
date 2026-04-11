import type { FormField, FormStep } from '@dmc-98/dfe-core';
export interface PlaygroundValidationIssue {
    severity: 'error' | 'warning';
    path: string;
    message: string;
}
export interface PlaygroundFormConfig {
    fields?: FormField[];
    steps?: FormStep[];
}
export declare function validateFormConfigData(config: PlaygroundFormConfig): {
    valid: boolean;
    issues: PlaygroundValidationIssue[];
};
