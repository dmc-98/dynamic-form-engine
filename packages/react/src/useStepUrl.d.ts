export interface UseStepUrlOptions {
    /** Total number of steps (for clamping) */
    totalSteps: number;
    /** Search param name (default: 'step') */
    paramName?: string;
    /**
     * Read current search params.
     * Compatible with react-router-dom's `useSearchParams()[0]`.
     */
    searchParams: URLSearchParams;
    /**
     * Set search params.
     * Compatible with react-router-dom's `useSearchParams()[1]`.
     */
    setSearchParams: (params: URLSearchParams, options?: {
        replace?: boolean;
    }) => void;
}
export interface UseStepUrlReturn {
    /** The initial step index parsed from the URL (clamped to valid range) */
    initialIndex: number;
    /**
     * Callback to sync the step index to the URL.
     * Pass this as `onIndexChange` to `useFormStepper`.
     */
    onIndexChange: (index: number) => void;
}
/**
 * Utility hook for syncing step index to URL search params.
 * Works with react-router-dom's `useSearchParams` or any
 * compatible search param API.
 *
 * The URL stores a 0-based step index (e.g., `?step=2` for step 3).
 *
 * @example
 * ```tsx
 * import { useSearchParams } from 'react-router-dom'
 * import { useFormEngine, useFormStepper, useStepUrl } from '@dmc--98/dfe-react'
 *
 * function MultiStepForm({ formData }) {
 *   const [searchParams, setSearchParams] = useSearchParams()
 *   const engine = useFormEngine({ fields: formData.fields })
 *
 *   const stepUrl = useStepUrl({
 *     totalSteps: formData.steps.length,
 *     searchParams,
 *     setSearchParams,
 *   })
 *
 *   const stepper = useFormStepper({
 *     steps: formData.steps,
 *     engine: engine.engine,
 *     initialIndex: stepUrl.initialIndex,
 *     onIndexChange: stepUrl.onIndexChange,
 *     onNavigate: (direction) => {
 *       if (direction === 'back') refetchSubmissionData()
 *     },
 *   })
 *
 *   // ...
 * }
 * ```
 */
export declare function useStepUrl(options: UseStepUrlOptions): UseStepUrlReturn;
