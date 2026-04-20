import {
  acknowledgeSyncMutation,
  createSyncDocument,
  createSyncSnapshot,
  markSyncMutationFailed,
  queueSyncMutation,
  replaceSyncMutationSubmissionId,
  type FormRuntimeContext,
  type FormValues,
  type StepSubmitPayload,
  type StepSubmitResponse,
  type SyncDocumentState,
  type SyncPendingMutation,
} from '@dmc--98/dfe-core'

export interface BrowserPersistenceAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
}

export interface IndexedDbPersistenceOptions {
  databaseName?: string
  storeName?: string
}

export type SyncTransportEvent =
  | { kind: 'operation'; operation: import('@dmc--98/dfe-core').SyncFieldOperation }
  | { kind: 'presence'; presence: import('@dmc--98/dfe-core').SyncPresence }
  | { kind: 'snapshot'; snapshot: import('@dmc--98/dfe-core').SyncDocumentSnapshot }
  | { kind: 'snapshot_request'; actorId: string; requestedAt: number }

export interface SyncTransportConnection {
  sessionId: string
  actorId: string
  authToken?: string
}

export interface SyncTransport {
  connect(connection: SyncTransportConnection): Promise<void> | void
  disconnect(): void
  publish(event: SyncTransportEvent): Promise<void> | void
  subscribe(listener: (event: SyncTransportEvent) => void): () => void
}

export interface EventSourceLike {
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void
  removeEventListener(type: string, listener: (event: MessageEvent<string>) => void): void
  close(): void
}

export interface RemoteSyncTransportOptions {
  baseUrl: string
  fetchFn?: typeof fetch
  headers?: HeadersInit | (() => HeadersInit)
  query?: Record<string, string | undefined | null> | (() => Record<string, string | undefined | null>)
  eventSourceFactory?: (url: string) => EventSourceLike
  formId?: string
  versionId?: string
  submissionId?: string | null | (() => string | null | undefined)
  displayName?: string | (() => string)
  color?: string | undefined | (() => string | undefined)
  metadata?: Record<string, unknown> | (() => Record<string, unknown> | undefined)
}

export interface OfflineRuntimeState {
  submissionId: string | null
  context: FormRuntimeContext
  pendingMutations: SyncPendingMutation[]
  submissionIdMap: Record<string, string>
  lastSyncedAt?: number
}

export interface OfflineRuntimeApiClient {
  createSubmission(formId: string, versionId: string): Promise<{ id: string; context: FormRuntimeContext }>
  submitStep(submissionId: string, stepId: string, payload: StepSubmitPayload): Promise<StepSubmitResponse>
  completeSubmission(submissionId: string): Promise<void>
}

export function createMemoryPersistenceAdapter(): BrowserPersistenceAdapter {
  const store = new Map<string, unknown>()

  return {
    async get<T>(key: string): Promise<T | null> {
      return (store.get(key) as T | undefined) ?? null
    },
    async set<T>(key: string, value: T): Promise<void> {
      store.set(key, value)
    },
    async delete(key: string): Promise<void> {
      store.delete(key)
    },
  }
}

export function createIndexedDbPersistenceAdapter(
  options: IndexedDbPersistenceOptions = {},
): BrowserPersistenceAdapter {
  const databaseName = options.databaseName ?? 'dfe-sync'
  const storeName = options.storeName ?? 'key-value'

  async function openDatabase(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment')
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
    })
  }

  async function runTransaction<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error: unknown) => void) => void,
  ): Promise<T> {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode)
      const store = transaction.objectStore(storeName)
      run(store, resolve, reject)
      transaction.oncomplete = () => db.close()
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction failed'))
        db.close()
      }
    })
  }

  return {
    get<T>(key: string): Promise<T | null> {
      return runTransaction<T | null>('readonly', (store, resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
        request.onerror = () => reject(request.error ?? new Error(`Failed to read key "${key}"`))
      })
    },
    set<T>(key: string, value: T): Promise<void> {
      return runTransaction<void>('readwrite', (store, resolve, reject) => {
        const request = store.put(value, key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error ?? new Error(`Failed to write key "${key}"`))
      })
    },
    delete(key: string): Promise<void> {
      return runTransaction<void>('readwrite', (store, resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error ?? new Error(`Failed to delete key "${key}"`))
      })
    },
  }
}

export function createBroadcastChannelSyncTransport(): SyncTransport {
  let channel: BroadcastChannel | null = null
  let connection: SyncTransportConnection | null = null
  const listeners = new Set<(event: SyncTransportEvent) => void>()

  function handleMessage(raw: MessageEvent<any>) {
    const payload = raw.data as {
      sessionId?: string
      authToken?: string
      event?: SyncTransportEvent
    }

    if (!payload?.event || !connection) {
      return
    }

    if (payload.sessionId !== connection.sessionId) {
      return
    }

    if ((connection.authToken ?? null) !== (payload.authToken ?? null)) {
      return
    }

    for (const listener of listeners) {
      listener(payload.event)
    }
  }

  return {
    connect(nextConnection) {
      connection = nextConnection
      if (typeof BroadcastChannel === 'undefined') {
        return
      }

      channel?.close()
      channel = new BroadcastChannel(`dfe-sync:${nextConnection.sessionId}`)
      channel.addEventListener('message', handleMessage)
    },
    disconnect() {
      if (channel) {
        channel.removeEventListener('message', handleMessage)
        channel.close()
      }
      channel = null
      connection = null
    },
    publish(event) {
      if (!channel || !connection) {
        return
      }

      channel.postMessage({
        sessionId: connection.sessionId,
        authToken: connection.authToken,
        event,
      })
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

function resolveHeaders(headers?: RemoteSyncTransportOptions['headers']): HeadersInit | undefined {
  return typeof headers === 'function' ? headers() : headers
}

function resolveQuery(query?: RemoteSyncTransportOptions['query']): Record<string, string | undefined | null> {
  return typeof query === 'function' ? query() : (query ?? {})
}

function resolveOptionalValue<T>(
  value: T | (() => T),
): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

function buildRemoteUrl(
  baseUrl: string,
  path: string,
  query: Record<string, string | undefined | null>,
): string {
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

export function createRemoteSyncTransport(options: RemoteSyncTransportOptions): SyncTransport {
  const fetchFn = options.fetchFn ?? fetch
  const eventSourceFactory = options.eventSourceFactory ?? ((url: string) => new EventSource(url))
  const listeners = new Set<(event: SyncTransportEvent) => void>()
  const bufferedEvents: SyncTransportEvent[] = []
  let connection: SyncTransportConnection | null = null
  let source: EventSourceLike | null = null
  let latestSequence = 0
  let isDisconnected = false
  let readyPromise: Promise<void> = Promise.resolve()

  const emit = (event: SyncTransportEvent) => {
    if (listeners.size === 0) {
      bufferedEvents.push(event)
      return
    }

    for (const listener of listeners) {
      listener(event)
    }
  }

  const baseQuery = () => ({
    ...resolveQuery(options.query),
    authToken: connection?.authToken ?? undefined,
  })

  const requestJson = async <T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> => {
    const response = await fetchFn(buildRemoteUrl(options.baseUrl, path, baseQuery()), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(resolveHeaders(options.headers) ?? {}),
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(body.error ?? `HTTP ${response.status}`)
    }

    return response.json()
  }

  const closeSource = () => {
    if (source) {
      source.removeEventListener('message', handleMessage)
      source.removeEventListener('error', handleError)
      source.close()
    }
    source = null
  }

  const handleMessage = (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as {
        sequence?: number
        event?: SyncTransportEvent
      }
      if (!payload?.event) {
        return
      }
      latestSequence = Math.max(latestSequence, payload.sequence ?? latestSequence)
      emit(payload.event)
    } catch {
      return
    }
  }

  const handleError = () => {
    if (isDisconnected) {
      return
    }

    closeSource()
    if (!connection) {
      return
    }

    queueMicrotask(() => {
      if (!isDisconnected && connection) {
        void openStream(connection)
      }
    })
  }

  const openStream = async (nextConnection: SyncTransportConnection) => {
    const url = buildRemoteUrl(
      options.baseUrl,
      `sessions/${nextConnection.sessionId}/stream`,
      {
        ...baseQuery(),
        actorId: nextConnection.actorId,
        after: String(latestSequence),
      },
    )

    closeSource()
    source = eventSourceFactory(url)
    source.addEventListener('message', handleMessage)
    source.addEventListener('error', handleError)
  }

  return {
    async connect(nextConnection) {
      connection = nextConnection
      isDisconnected = false

      readyPromise = (async () => {
        const joined = await requestJson<{
          latestSequence: number
          snapshot?: import('@dmc--98/dfe-core').SyncDocumentSnapshot
        }>(`sessions/${nextConnection.sessionId}/join`, {
          method: 'POST',
          body: JSON.stringify({
            actorId: nextConnection.actorId,
            displayName: resolveOptionalValue(options.displayName ?? nextConnection.actorId),
            color: options.color ? resolveOptionalValue(options.color) : undefined,
            formId: options.formId,
            versionId: options.versionId,
            submissionId: options.submissionId ? resolveOptionalValue(options.submissionId) : undefined,
            metadata: options.metadata ? resolveOptionalValue(options.metadata) : undefined,
          }),
        })

        latestSequence = joined.latestSequence ?? 0
        if (joined.snapshot) {
          emit({ kind: 'snapshot', snapshot: joined.snapshot })
        }

        await openStream(nextConnection)
      })()

      await readyPromise
    },
    disconnect() {
      isDisconnected = true
      closeSource()
      connection = null
    },
    async publish(event) {
      if (!connection) {
        return
      }
      await readyPromise

      if (event.kind === 'snapshot_request') {
        const response = await requestJson<{ snapshot?: import('@dmc--98/dfe-core').SyncDocumentSnapshot }>(
          `sessions/${connection.sessionId}/snapshot`,
          { method: 'GET' },
        )
        if (response.snapshot) {
          emit({ kind: 'snapshot', snapshot: response.snapshot })
        }
        return
      }

      if (event.kind === 'operation') {
        await requestJson(`sessions/${connection.sessionId}/operations`, {
          method: 'POST',
          body: JSON.stringify({ operation: event.operation }),
        })
        return
      }

      if (event.kind === 'presence') {
        await requestJson(`sessions/${connection.sessionId}/presence`, {
          method: 'POST',
          body: JSON.stringify({ presence: event.presence }),
        })
        return
      }

      await requestJson(`sessions/${connection.sessionId}/snapshot`, {
        method: 'POST',
        body: JSON.stringify({
          actorId: connection.actorId,
          snapshot: event.snapshot,
        }),
      })
    },
    subscribe(listener) {
      listeners.add(listener)
      if (bufferedEvents.length > 0) {
        const queued = bufferedEvents.splice(0, bufferedEvents.length)
        for (const event of queued) {
          listener(event)
        }
      }
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function createOfflineSubmissionId(now: number = Date.now()): string {
  return `offline:${now.toString(36)}:${Math.random().toString(36).slice(2, 8)}`
}

export function createOfflineRuntimeState(
  initial: Partial<OfflineRuntimeState> = {},
): OfflineRuntimeState {
  return {
    submissionId: initial.submissionId ?? null,
    context: initial.context ?? { userId: '' },
    pendingMutations: initial.pendingMutations ?? [],
    submissionIdMap: initial.submissionIdMap ?? {},
    lastSyncedAt: initial.lastSyncedAt,
  }
}

export function enqueueOfflineCreateSubmission(
  state: OfflineRuntimeState,
  options: { submissionId: string; formId: string; versionId: string; context?: FormRuntimeContext; now?: number },
): OfflineRuntimeState {
  const doc = queueSyncMutation(createSyncDocument({
    sessionId: 'offline-runtime',
    actorId: 'offline-runtime',
    initialValues: {},
  }), {
    type: 'submission:create',
    submissionId: options.submissionId,
    formId: options.formId,
    versionId: options.versionId,
    context: options.context,
    enqueuedAt: options.now,
  })

  return {
    ...state,
    submissionId: options.submissionId,
    context: options.context ?? state.context,
    pendingMutations: [...state.pendingMutations, doc.pendingMutations[0]!],
  }
}

export function enqueueOfflineStepSubmit(
  state: OfflineRuntimeState,
  options: {
    submissionId: string
    stepId: string
    values: FormValues
    context: FormRuntimeContext
    now?: number
  },
): OfflineRuntimeState {
  const doc = queueSyncMutation(createSyncDocument({
    sessionId: 'offline-runtime',
    actorId: 'offline-runtime',
    initialValues: {},
  }), {
    type: 'step:submit',
    submissionId: options.submissionId,
    stepId: options.stepId,
    values: options.values,
    context: options.context,
    enqueuedAt: options.now,
  })

  return {
    ...state,
    context: options.context,
    pendingMutations: [...state.pendingMutations, doc.pendingMutations[0]!],
  }
}

export function enqueueOfflineCompleteSubmission(
  state: OfflineRuntimeState,
  options: { submissionId: string; context: FormRuntimeContext; now?: number },
): OfflineRuntimeState {
  const doc = queueSyncMutation(createSyncDocument({
    sessionId: 'offline-runtime',
    actorId: 'offline-runtime',
    initialValues: {},
  }), {
    type: 'submission:complete',
    submissionId: options.submissionId,
    context: options.context,
    enqueuedAt: options.now,
  })

  return {
    ...state,
    context: options.context,
    pendingMutations: [...state.pendingMutations, doc.pendingMutations[0]!],
  }
}

export async function flushOfflineRuntimeState(
  state: OfflineRuntimeState,
  client: OfflineRuntimeApiClient,
  now: number = Date.now(),
): Promise<OfflineRuntimeState> {
  let nextState = {
    ...state,
    pendingMutations: [...state.pendingMutations],
    submissionIdMap: { ...state.submissionIdMap },
    context: { ...state.context },
  }

  for (const mutation of state.pendingMutations) {
    try {
      if (mutation.type === 'submission:create') {
        const existingId = nextState.submissionIdMap[mutation.submissionId]
        if (!existingId) {
          const result = await client.createSubmission(mutation.formId!, mutation.versionId!)
          nextState.submissionIdMap[mutation.submissionId] = result.id
          nextState.context = result.context
          if (nextState.submissionId === mutation.submissionId) {
            nextState.submissionId = result.id
          }
          nextState.pendingMutations = replaceSyncMutationSubmissionId({
            ...createSyncDocument({ sessionId: 'offline-runtime', actorId: 'offline-runtime' }),
            pendingMutations: nextState.pendingMutations,
          }, mutation.submissionId, result.id).pendingMutations
        }
      }

      if (mutation.type === 'step:submit') {
        const submissionId = nextState.submissionIdMap[mutation.submissionId] ?? mutation.submissionId
        const payload: StepSubmitPayload = {
          values: mutation.values ?? {},
          context: {
            ...(mutation.context ?? {}),
            ...nextState.context,
          },
        }
        const result = await client.submitStep(submissionId, mutation.stepId!, payload)
        if (!result.success) {
          throw new Error(result.errors?._api ?? result.errors?._network ?? 'Step submission failed while replaying offline queue')
        }
        nextState.context = result.context
        if (nextState.submissionId === mutation.submissionId && submissionId !== mutation.submissionId) {
          nextState.submissionId = submissionId
        }
      }

      if (mutation.type === 'submission:complete') {
        const submissionId = nextState.submissionIdMap[mutation.submissionId] ?? mutation.submissionId
        await client.completeSubmission(submissionId)
        if (nextState.submissionId === mutation.submissionId && submissionId !== mutation.submissionId) {
          nextState.submissionId = submissionId
        }
      }

      nextState.pendingMutations = acknowledgeSyncMutation({
        ...createSyncDocument({ sessionId: 'offline-runtime', actorId: 'offline-runtime' }),
        pendingMutations: nextState.pendingMutations,
      }, mutation.id).pendingMutations
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      nextState.pendingMutations = markSyncMutationFailed({
        ...createSyncDocument({ sessionId: 'offline-runtime', actorId: 'offline-runtime' }),
        pendingMutations: nextState.pendingMutations,
      }, mutation.id, message).pendingMutations
      return nextState
    }
  }

  nextState.lastSyncedAt = now
  return nextState
}

export function buildSyncStorageKey(prefix: string, sessionId: string): string {
  return `${prefix}:${sessionId}`
}

export function createPersistedSyncDocumentState(state: SyncDocumentState) {
  return createSyncSnapshot(state)
}
