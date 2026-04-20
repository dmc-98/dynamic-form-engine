import { useState, useCallback, useRef } from 'react'
import type {
  FormRuntimeContext, StepSubmitPayload, StepSubmitResponse, FormValues,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseFormRuntimeOptions {
  /** Base URL of the DFE API (e.g., "http://localhost:3000/api") */
  baseUrl: string
  /** Form ID */
  formId: string
  /** Version ID */
  versionId: string
  /** Custom fetch function (defaults to global fetch) */
  fetchFn?: typeof fetch
  /** Authorization headers */
  headers?: Record<string, string>
}

export interface UseFormRuntimeReturn {
  /** Current submission ID (set after createSubmission) */
  submissionId: string | null
  /** Runtime context (accumulated across steps) */
  context: FormRuntimeContext
  /** Whether a submission operation is in progress */
  isSubmitting: boolean
  /** Last error message */
  error: string | null
  /** Create a new form submission */
  createSubmission: () => Promise<string>
  /** Submit a step's values */
  submitStep: (stepId: string, values: FormValues) => Promise<StepSubmitResponse>
  /** Mark the form as complete */
  completeSubmission: () => Promise<void>
  /** Reset the runtime state */
  reset: () => void
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * React hook for managing form submission lifecycle (create, step submit, complete).
 *
 * Uses refs for mutable state (context, submissionId, headers) to avoid
 * stale closure issues in rapid successive calls.
 */
export function useFormRuntime(options: UseFormRuntimeOptions): UseFormRuntimeReturn {
  const { baseUrl, formId, versionId, fetchFn = fetch, headers = {} } = options

  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [context, setContext] = useState<FormRuntimeContext>({ userId: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use refs for values needed in callbacks to avoid stale closures
  const contextRef = useRef<FormRuntimeContext>(context)
  const submissionIdRef = useRef<string | null>(submissionId)
  const headersRef = useRef(headers)

  // Keep refs in sync with latest values
  contextRef.current = context
  submissionIdRef.current = submissionId
  headersRef.current = headers

  const apiCall = useCallback(async (
    path: string,
    method: string,
    body?: unknown,
  ) => {
    const url = `${baseUrl}${path}`
    const res = await fetchFn(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headersRef.current,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(errBody.error ?? `HTTP ${res.status}`)
    }

    return res.json()
  }, [baseUrl, fetchFn]) // headers accessed via ref — stable callback

  const createSubmission = useCallback(async (): Promise<string> => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await apiCall('/dfe/submissions', 'POST', { formId, versionId })
      setSubmissionId(result.id)
      submissionIdRef.current = result.id
      setContext(result.context)
      contextRef.current = result.context
      return result.id
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [apiCall, formId, versionId])

  const submitStep = useCallback(async (
    stepId: string,
    values: FormValues,
  ): Promise<StepSubmitResponse> => {
    const currentSubmissionId = submissionIdRef.current
    if (!currentSubmissionId) throw new Error('No active submission. Call createSubmission first.')

    setIsSubmitting(true)
    setError(null)
    try {
      const currentContext = contextRef.current
      const payload: StepSubmitPayload = { values, context: currentContext }
      const result: StepSubmitResponse = await apiCall(
        `/dfe/submissions/${currentSubmissionId}/steps/${stepId}`,
        'POST',
        payload,
      )

      if (result.success) {
        setContext(result.context)
        contextRef.current = result.context
      } else {
        setError(result.errors?._api ?? 'Step submission failed')
      }

      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      return { success: false, context: contextRef.current, errors: { _network: msg } }
    } finally {
      setIsSubmitting(false)
    }
  }, [apiCall]) // context and submissionId accessed via refs

  const completeSubmission = useCallback(async (): Promise<void> => {
    const currentSubmissionId = submissionIdRef.current
    if (!currentSubmissionId) throw new Error('No active submission.')

    setIsSubmitting(true)
    setError(null)
    try {
      await apiCall(`/dfe/submissions/${currentSubmissionId}/complete`, 'POST')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [apiCall])

  const reset = useCallback(() => {
    setSubmissionId(null)
    submissionIdRef.current = null
    setContext({ userId: '' })
    contextRef.current = { userId: '' }
    setIsSubmitting(false)
    setError(null)
  }, [])

  return {
    submissionId,
    context,
    isSubmitting,
    error,
    createSubmission,
    submitStep,
    completeSubmission,
    reset,
  }
}
