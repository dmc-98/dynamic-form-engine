import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applySyncOperation,
  createSyncDocument,
  createSyncFieldOperation,
  createSyncSnapshot,
  hydrateSyncDocument,
  mergeSyncOperations,
  pruneInactiveSyncParticipants,
  upsertSyncPresence,
  type FormEngine,
  type FormValues,
  type GraphPatch,
  type SyncConnectionState,
  type SyncDocumentState,
  type SyncFieldOperation,
  type SyncPresence,
} from '@dmc--98/dfe-core'
import {
  buildSyncStorageKey,
  createBroadcastChannelSyncTransport,
  type BrowserPersistenceAdapter,
  type SyncTransport,
  type SyncTransportEvent,
} from './sync'

export interface UseFormSyncOptions {
  engine: FormEngine
  sessionId: string
  actorId: string
  authToken?: string
  displayName?: string
  color?: string
  transport?: SyncTransport
  persistence?: BrowserPersistenceAdapter
  storageKeyPrefix?: string
  participantTtlMs?: number
}

export interface UseFormSyncReturn {
  values: FormValues
  setFieldValue: (key: string, value: unknown, metadata?: Record<string, unknown>) => Promise<GraphPatch>
  participants: SyncPresence[]
  connectionState: SyncConnectionState
  isHydrated: boolean
  pendingOperationCount: number
  lastSyncedAt?: number
  updatePresence: (activeFieldKey?: string | null, state?: SyncPresence['state']) => Promise<void>
  flushSnapshot: () => Promise<void>
}

function shallowValueChanged(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return true
    return left.some((value, index) => value !== right[index])
  }

  return left !== right
}

export function useFormSync(options: UseFormSyncOptions): UseFormSyncReturn {
  const {
    engine,
    sessionId,
    actorId,
    authToken,
    displayName = actorId,
    color,
    transport: providedTransport,
    persistence,
    storageKeyPrefix = 'dfe-sync',
    participantTtlMs = 45_000,
  } = options
  const transportRef = useRef<SyncTransport | null>(null)
  if (!transportRef.current) {
    transportRef.current = providedTransport ?? createBroadcastChannelSyncTransport()
  }
  const transport = transportRef.current

  const storageKey = useMemo(
    () => buildSyncStorageKey(storageKeyPrefix, sessionId),
    [sessionId, storageKeyPrefix],
  )

  const documentRef = useRef<SyncDocumentState>(createSyncDocument({
    sessionId,
    actorId,
    initialValues: engine.getValues(),
  }))
  const [values, setValues] = useState<FormValues>(() => engine.getValues())
  const [participants, setParticipants] = useState<SyncPresence[]>([])
  const [connectionState, setConnectionState] = useState<SyncConnectionState>('idle')
  const [isHydrated, setIsHydrated] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>(undefined)

  const persistSnapshot = useCallback(async () => {
    if (!persistence) return
    const snapshot = createSyncSnapshot(documentRef.current)
    await persistence.set(storageKey, snapshot)
  }, [persistence, storageKey])

  const syncEngineValues = useCallback((nextValues: FormValues) => {
    const currentValues = engine.getValues()
    for (const [fieldKey, nextValue] of Object.entries(nextValues)) {
      if (shallowValueChanged(currentValues[fieldKey], nextValue)) {
        engine.setFieldValue(fieldKey, nextValue)
      }
    }
    setValues(engine.getValues())
  }, [engine])

  const refreshParticipants = useCallback(() => {
    documentRef.current = pruneInactiveSyncParticipants(documentRef.current, participantTtlMs)
    const nextParticipants = Object.values(documentRef.current.participants)
      .sort((left, right) => right.updatedAt - left.updatedAt)
    setParticipants(nextParticipants)
  }, [participantTtlMs])

  const publish = useCallback(async (event: SyncTransportEvent) => {
    await transport.publish(event)
  }, [transport])

  const updatePresence = useCallback(async (
    activeFieldKey: string | null = null,
    state: SyncPresence['state'] = 'active',
  ) => {
    const presence: SyncPresence = {
      actorId,
      sessionId,
      displayName,
      color,
      activeFieldKey,
      state,
      updatedAt: Date.now(),
    }
    documentRef.current = upsertSyncPresence(documentRef.current, presence)
    refreshParticipants()
    await persistSnapshot()
    await publish({ kind: 'presence', presence })
  }, [actorId, color, displayName, persistSnapshot, publish, refreshParticipants, sessionId])

  useEffect(() => {
    documentRef.current = createSyncDocument({
      sessionId,
      actorId,
      initialValues: engine.getValues(),
    })
    setValues(engine.getValues())
    setParticipants([])
    setConnectionState('idle')
    setIsHydrated(false)
    setLastSyncedAt(undefined)
  }, [actorId, engine, sessionId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleOnline = () => setConnectionState('online')
    const handleOffline = () => setConnectionState('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const loadSnapshot = async () => {
      if (!persistence) {
        setIsHydrated(true)
        return
      }

      const snapshot = await persistence.get<ReturnType<typeof createSyncSnapshot>>(storageKey)
      if (ignore || !snapshot) {
        if (!ignore) {
          setIsHydrated(true)
        }
        return
      }

      documentRef.current = hydrateSyncDocument(snapshot)
      syncEngineValues(documentRef.current.values)
      refreshParticipants()
      setLastSyncedAt(snapshot.lastSyncedAt)
      setIsHydrated(true)
    }

    loadSnapshot().catch(() => {
      if (!ignore) {
        setIsHydrated(true)
      }
    })

    return () => {
      ignore = true
    }
  }, [persistence, refreshParticipants, storageKey, syncEngineValues])

  useEffect(() => {
    setConnectionState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online')
    Promise.resolve(transport.connect({
      sessionId,
      actorId,
      authToken,
    })).catch(() => {
      setConnectionState('error')
    })

    const unsubscribe = transport.subscribe((event) => {
      if (event.kind === 'operation') {
        const operation = event.operation
        if (operation.actorId === actorId || operation.sessionId !== sessionId) {
          return
        }

        const result = applySyncOperation(documentRef.current, operation)
        documentRef.current = result.state
        if (result.valueChanged) {
          syncEngineValues(documentRef.current.values)
        }
        setLastSyncedAt(Date.now())
        persistSnapshot().catch(() => undefined)
        return
      }

      if (event.kind === 'presence') {
        if (event.presence.actorId === actorId || event.presence.sessionId !== sessionId) {
          return
        }
        documentRef.current = upsertSyncPresence(documentRef.current, event.presence)
        refreshParticipants()
        persistSnapshot().catch(() => undefined)
        return
      }

      if (event.kind === 'snapshot_request') {
        if (event.actorId === actorId) {
          return
        }
        publish({ kind: 'snapshot', snapshot: createSyncSnapshot(documentRef.current) }).catch(() => undefined)
        return
      }

      if (event.kind === 'snapshot' && event.snapshot.sessionId === sessionId) {
        documentRef.current = mergeSyncOperations(documentRef.current, event.snapshot.operations)
        for (const presence of Object.values(event.snapshot.participants)) {
          documentRef.current = upsertSyncPresence(documentRef.current, presence)
        }
        documentRef.current = {
          ...documentRef.current,
          lastSyncedAt: event.snapshot.lastSyncedAt ?? documentRef.current.lastSyncedAt,
        }
        syncEngineValues(documentRef.current.values)
        refreshParticipants()
        setLastSyncedAt(Date.now())
        persistSnapshot().catch(() => undefined)
      }
    })

    updatePresence(null, 'active').catch(() => undefined)
    publish({ kind: 'snapshot_request', actorId, requestedAt: Date.now() }).catch(() => undefined)

    return () => {
      updatePresence(null, 'offline').catch(() => undefined)
      unsubscribe()
      transport.disconnect()
      setConnectionState('idle')
    }
  }, [
    actorId,
    authToken,
    persistSnapshot,
    publish,
    refreshParticipants,
    sessionId,
    syncEngineValues,
    transport,
    updatePresence,
  ])

  const setFieldValue = useCallback(async (
    key: string,
    value: unknown,
    metadata?: Record<string, unknown>,
  ): Promise<GraphPatch> => {
    const patch = engine.setFieldValue(key, value)
    const operation: SyncFieldOperation = createSyncFieldOperation(documentRef.current, {
      fieldKey: key,
      value,
      metadata,
    })
    documentRef.current = applySyncOperation(documentRef.current, operation).state
    setValues(engine.getValues())
    setLastSyncedAt(Date.now())

    await persistSnapshot()
    await publish({ kind: 'operation', operation })
    await publish({ kind: 'snapshot', snapshot: createSyncSnapshot(documentRef.current) })
    await updatePresence(key)

    return patch
  }, [engine, persistSnapshot, publish, updatePresence])

  const flushSnapshot = useCallback(async () => {
    await persistSnapshot()
    await publish({ kind: 'snapshot', snapshot: createSyncSnapshot(documentRef.current) })
  }, [persistSnapshot, publish])

  return {
    values,
    setFieldValue,
    participants,
    connectionState,
    isHydrated,
    pendingOperationCount: documentRef.current.pendingMutations.length,
    lastSyncedAt,
    updatePresence,
    flushSnapshot,
  }
}
