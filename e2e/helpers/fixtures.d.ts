/**
 * Shared test fixtures for E2E tests.
 * Provides reusable form configurations, fields, and steps.
 */
import type { FormField, FormStep, FormValues, FieldType } from '@dmc--98/dfe-core';
export declare function makeField(keyOrOverrides: string | (Partial<FormField> & {
    key: string;
    type?: FieldType;
}), type?: FieldType | string, label?: string, config?: Record<string, any>): FormField;
export declare function makeStep(overrides: Partial<FormStep> & {
    id: string;
    title: string;
}): FormStep;
export declare function resetFieldCounter(): void;
export declare function createContactForm(): {
    fields: FormField[];
    steps: FormStep[];
};
export declare function createAllFieldTypesForm(): {
    fields: FormField[];
};
export declare function createMultiStepConditionalForm(): {
    fields: FormField[];
    steps: FormStep[];
};
export declare function createBranchingForm(): {
    fields: FormField[];
    steps: FormStep[];
};
export declare function createConditionalVisibilityForm(): {
    fields: FormField[];
};
export declare function createLargeForm(count: number): {
    fields: FormField[];
};
export declare function createValidContactValues(): FormValues;
export declare function createI18nForm(): {
    fields: FormField[];
};
export declare function createPermissionsForm(): {
    fields: FormField[];
};
