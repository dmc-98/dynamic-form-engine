import type { FormRuntimeContext, StepSubmitResponse, FormValues } from '@dmc--98/dfe-core';
export interface UseFormRuntimeOptions {
    /** Base URL of the DFE API (e.g., "http://localhost:3000/api") */
    baseUrl: string;
    /** Form ID */
    formId: string;
    /** Version ID */
    versionId: string;
    /** Custom fetch function (defaults to global fetch) */
    fetchFn?: typeof fetch;
    /** Authorization headers */
    headers?: Record<string, string>;
}
export interface UseFormRuntimeReturn {
    /** Current submission ID (set after createSubmission) */
    submissionId: string | null;
    /** Runtime context (accumulated across steps) */
    context: FormRuntimeContext;
    /** Whether a submission operation is in progress */
    isSubmitting: boolean;
    /** Last error message */
    error: string | null;
    /** Create a new form submission */
    createSubmission: () => Promise<string>;
    /** Submit a step's values */
    submitStep: (stepId: string, values: FormValues) => Promise<StepSubmitResponse>;
    /** Mark the form as complete */
    completeSubmission: () => Promise<void>;
    /** Reset the runtime state */
    reset: () => void;
}
/**
 * React hook for managing form submission lifecycle (create, step submit, complete).
 *
 * Uses refs for mutable state (context, submissionId, headers) to avoid
 * stale closure issues in rapid successive calls.
 */
export declare function useFormRuntime(options: UseFormRuntimeOptions): UseFormRuntimeReturn;
