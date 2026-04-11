import type { FormField, FormStep, StepApiContract } from '../src/types';
/** Create a minimal field definition for testing */
export declare function makeField(overrides: Partial<FormField> & {
    key: string;
}): FormField;
/** Create a minimal step definition for testing */
export declare function makeStep(overrides: Partial<FormStep> & {
    id: string;
    title: string;
}): FormStep;
/** Create a step API contract for testing */
export declare function makeApiContract(overrides: Partial<StepApiContract>): StepApiContract;
