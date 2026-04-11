import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  FormRuntimeContext,
  FormValues,
  StepSubmitPayload,
  StepSubmitResponse,
  SyncConnectionState,
} from '@dmc-98/dfe-core'
import {
  buildSyncStorageKey,
  createOfflineRuntimeState,
  createOfflineSubmissionId,
  enqueueOfflineCompleteSubmission,
  enqueueOfflineCreateSubmission,
  enqueueOfflineStepSubmit,
  flushOfflineRuntimeState,
  type BrowserPersistenceAdapter,
  type OfflineRuntimeState,
} from './sync'
import type { UseFormRuntimeOptions } from './useFormRuntime'

export interface UseOfflineFormRuntimeOptions extends UseFormRuntimeOptions {
  persistence?: BrowserPersistenceAdapter
  storageKey?: string
  offlineEnabled?: boolean
}

export interface UseOfflineFormRuntimeReturn {
  submissionId: string | null
  context: FormRuntimeContext
  isSubmitting: boolean
  error: string | null
  isHydrated: boolean
  syncState: SyncConnectionState
  isOffline: boolean
  pendingActions: number
  createSubmission: () => Promise<string>
  submitStep: (stepId: string, values: FormValues) => Promise<StepSubmitResponse>
  completeSubmission: () => Promise<void>
  flushPendingActions: () => Promise<void>
  reset: () => Promise<void>
}

function isProbablyOffline(error: unknown): boolean {
  if (!error) {
    return false
  }

  if (error instanceof TypeError) {
    return true
  }

  const message = error instanceof Error ? error.message : String(error)
  return /network|failed to fetch|load failed/i.test(message)
}

export function useOfflineFormRuntime(
  options: UseOfflineFormRuntimeOptions,
): UseOfflineFormRuntimeReturn {
  const {
    baseUrl,
    formId,
    versionId,
    fetchFn = fetch,
    headers = {},
    persistence,
    storageKey = buildSyncStorageKey('dfe-runtime', `${formId}:${versionId}`),
    offlineEnabled = true,
  } = options

  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [context, setContext] = useState<FormRuntimeContext>({ userId: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingActions, setPendingActions] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)
  const [syncState, setSyncState] = useState<SyncConnectionState>('idle')

  const runtimeStateRef = useRef<OfflineRuntimeState>(createOfflineRuntimeState())
  const headersRef = useRef(headers)

  headersRef.current = headers

  const readOnlineState = useCallback(() => {
    if (typeof navigator === 'undefined') {
      return true
    }
    return navigator.onLine
  }, [])

  const persistRuntimeState = useCallback(async () => {
    if (!persistence) {
      return
    }
    await persistence.set(storageKey, runtimeStateRef.current)
  }, [persistence, storageKey])

  const applyRuntimeState = useCallback((nextState: OfflineRuntimeState) => {
    runtimeStateRef.current = nextState
    setSubmissionId(nextState.submissionId)
    setContext(nextState.context)
    setPendingActions(nextState.pendingMutations.length)
  }, [])

  const apiCall = useCallback(async (
    path: string,
    method: string,
    body?: unknown,
  ) => {
    const response = await fetchFn(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headersRef.current,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(errBody.error ?? `HTTP ${response.status}`)
    }

    return response.json()
  }, [baseUrl, fetchFn])

  const flushPendingActions = useCallback(async () => {
    if (!offlineEnabled || !readOnlineState() || runtimeStateRef.current.pendingMutations.length === 0) {
      setSyncState(readOnlineState() ? 'online' : 'offline')
      return
    }

    setSyncState('syncing')
    setError(null)

    try {
      const nextState = await flushOfflineRuntimeState(runtimeStateRef.current, {
        createSubmission: async (nextFormId, nextVersionId) => {
          const result = await apiCall('/dfe/submissions', 'POST', {
            formId: nextFormId,
            versionId: nextVersionId,
          })
          return {
            id: result.id as string,
            context: (result.context ?? { userId: '' }) as FormRuntimeContext,
          }
        },
        submitStep: async (nextSubmissionId, stepId, payload) => (
          apiCall(`/dfe/submissions/${nextSubmissionId}/steps/${stepId}`, 'POST', payload)
        ),
        completeSubmission: async (nextSubmissionId) => {
          await apiCall(`/dfe/submissions/${nextSubmissionId}/complete`, 'POST')
        },
      })

      applyRuntimeState(nextState)
      await persistRuntimeState()
      setSyncState(nextState.pendingMutations.length > 0 ? 'offline' : 'online')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
      setSyncState(readOnlineState() ? 'error' : 'offline')
    }
  }, [apiCall, applyRuntimeState, offlineEnabled, persistRuntimeState, readOnlineState])

  useEffect(() => {
    let ignore = false

    const hydrateRuntimeState = async () => {
      if (!persistence) {
        setSyncState(readOnlineState() ? 'online' : 'offline')
        setIsHydrated(true)
        return
      }

      const persisted = await persistence.get<OfflineRuntimeState>(storageKey)
      if (ignore) {
        return
      }

      if (persisted) {
        applyRuntimeState(createOfflineRuntimeState(persisted))
      }
      setSyncState(readOnlineState() ? 'online' : 'offline')
      setIsHydrated(true)
    }

    hydrateRuntimeState().catch(() => {
      if (!ignore) {
        setSyncState(readOnlineState() ? 'online' : 'offline')
        setIsHydrated(true)
      }
    })

    return () => {
      ignore = true
    }
  }, [applyRuntimeState, persistence, readOnlineState, storageKey])

  useEffect(() => {
    if (!isHydrated || !offlineEnabled || !readOnlineState() || pendingActions === 0) {
      return
    }

    flushPendingActions().catch(() => undefined)
  }, [flushPendingActions, isHydrated, offlineEnabled, pendingActions, readOnlineState])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleOnline = () => {
      setSyncState('online')
      flushPendingActions().catch(() => undefined)
    }
    const handleOffline = () => {
      setSyncState('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [flushPendingActions])

  const createSubmission = useCallback(async (): Promise<string> => {
    setIsSubmitting(true)
    setError(null)
    try {
      if (!offlineEnabled || readOnlineState()) {
        const result = await apiCall('/dfe/submissions', 'POST', { formId, versionId })
        const nextState = createOfflineRuntimeState({
          ...runtimeStateRef.current,
          submissionId: result.id as string,
          context: (result.context ?? { userId: '' }) as FormRuntimeContext,
        })
        applyRuntimeState(nextState)
        await persistRuntimeState()
        setSyncState('online')
        return result.id as string
      }

      const localSubmissionId = createOfflineSubmissionId()
      const nextState = enqueueOfflineCreateSubmission(runtimeStateRef.current, {
        submissionId: localSubmissionId,
        formId,
        versionId,
        context: runtimeStateRef.current.context,
      })
      applyRuntimeState(nextState)
      await persistRuntimeState()
      setSyncState('offline')
      return localSubmissionId
    } catch (nextError) {
      if (offlineEnabled && isProbablyOffline(nextError)) {
        const localSubmissionId = createOfflineSubmissionId()
        const nextState = enqueueOfflineCreateSubmission(runtimeStateRef.current, {
          submissionId: localSubmissionId,
          formId,
          versionId,
          context: runtimeStateRef.current.context,
        })
        applyRuntimeState(nextState)
        await persistRuntimeState()
        setSyncState('offline')
        return localSubmissionId
      }

      const message = nextError instanceof Error ? nextError.message : String(nextError)
      setError(message)
      throw nextError
    } finally {
      setIsSubmitting(false)
    }
  }, [
    apiCall,
    applyRuntimeState,
    formId,
    offlineEnabled,
    persistRuntimeState,
    readOnlineState,
    versionId,
  ])

  const submitStep = useCallback(async (
    stepId: string,
    values: FormValues,
  ): Promise<StepSubmitResponse> => {
    const currentSubmissionId = runtimeStateRef.current.submissionId
    if (!currentSubmissionId) {
      throw new Error('No active submission. Call createSubmission first.')
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (!offlineEnabled || readOnlineState()) {
        const payload: StepSubmitPayload = {
          values,
          context: runtimeStateRef.current.context,
        }
        const result = await apiCall(
          `/dfe/submissions/${currentSubmissionId}/steps/${stepId}`,
          'POST',
          payload,
        ) as StepSubmitResponse

        if (result.success) {
          const nextState = createOfflineRuntimeState({
            ...runtimeStateRef.current,
            context: result.context,
          })
          applyRuntimeState(nextState)
          await persistRuntimeState()
          setSyncState('online')
        } else {
          setError(result.errors?._api ?? 'Step submission failed')
        }

        return result
      }

      const nextState = enqueueOfflineStepSubmit(runtimeStateRef.current, {
        submissionId: currentSubmissionId,
        stepId,
        values,
        context: runtimeStateRef.current.context,
      })
      applyRuntimeState(nextState)
      await persistRuntimeState()
      setSyncState('offline')
      return {
        success: true,
        context: runtimeStateRef.current.context,
      }
    } catch (nextError) {
      if (offlineEnabled && isProbablyOffline(nextError)) {
        const nextState = enqueueOfflineStepSubmit(runtimeStateRef.current, {
          submissionId: currentSubmissionId,
          stepId,
          values,
          context: runtimeStateRef.current.context,
        })
        applyRuntimeState(nextState)
        await persistRuntimeState()
        setSyncState('offline')
        return {
          success: true,
          context: runtimeStateRef.current.context,
        }
      }

      const message = nextError instanceof Error ? nextError.message : String(nextError)
      setError(message)
      return {
        success: false,
        context: runtimeStateRef.current.context,
        errors: { _network: message },
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [apiCall, applyRuntimeState, offlineEnabled, persistRuntimeState, readOnlineState])

  const completeSubmission = useCallback(async (): Promise<void> => {
    const currentSubmissionId = runtimeStateRef.current.submissionId
    if (!currentSubmissionId) {
      throw new Error('No active submission.')
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (!offlineEnabled || readOnlineState()) {
        await apiCall(`/dfe/submissions/${currentSubmissionId}/complete`, 'POST')
        setSyncState('online')
        return
      }

      const nextState = enqueueOfflineCompleteSubmission(runtimeStateRef.current, {
        submissionId: currentSubmissionId,
        context: runtimeStateRef.current.context,
      })
      applyRuntimeState(nextState)
      await persistRuntimeState()
      setSyncState('offline')
    } catch (nextError) {
      if (offlineEnabled && isProbablyOffline(nextError)) {
        const nextState = enqueueOfflineCompleteSubmission(runtimeStateRef.current, {
          submissionId: currentSubmissionId,
          context: runtimeStateRef.current.context,
        })
        applyRuntimeState(nextState)
        await persistRuntimeState()
        setSyncState('offline')
        return
      }

      const message = nextError instanceof Error ? nextError.message : String(nextError)
      setError(message)
      throw nextError
    } finally {
      setIsSubmitting(false)
    }
  }, [apiCall, applyRuntimeState, offlineEnabled, persistRuntimeState, readOnlineState])

  const reset = useCallback(async () => {
    const nextState = createOfflineRuntimeState()
    applyRuntimeState(nextState)
    setError(null)
    setIsSubmitting(false)
    setSyncState(readOnlineState() ? 'online' : 'offline')

    if (persistence) {
      await persistence.delete(storageKey)
    }
  }, [applyRuntimeState, persistence, readOnlineState, storageKey])

  return {
    submissionId,
    context,
    isSubmitting,
    error,
    isHydrated,
    syncState,
    isOffline: syncState === 'offline',
    pendingActions,
    createSubmission,
    submitStep,
    completeSubmission,
    flushPendingActions,
    reset,
  }
}
