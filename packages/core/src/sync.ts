import type {
  FieldKey,
  FormRuntimeContext,
  FormValues,
  SyncDocumentSnapshot,
  SyncDocumentState,
  SyncFieldOperation,
  SyncFieldVersion,
  SyncOperationApplyResult,
  SyncPendingMutation,
  SyncPresence,
} from './types'

interface CreateSyncDocumentOptions {
  sessionId: string
  actorId: string
  initialValues?: FormValues
}

interface CreateSyncFieldOperationOptions {
  fieldKey: FieldKey
  value: unknown
  clientTimestamp?: number
  metadata?: Record<string, unknown>
}

interface QueueSyncMutationOptions {
  id?: string
  type: SyncPendingMutation['type']
  submissionId: string
  formId?: string
  versionId?: string
  stepId?: string
  values?: FormValues
  context?: FormRuntimeContext
  enqueuedAt?: number
  metadata?: Record<string, unknown>
}

const MAX_SYNC_OPERATIONS = 250
const MAX_APPLIED_OPERATION_IDS = 500

function createSyncId(prefix: string): string {
  const cryptoApi = globalThis as typeof globalThis & {
    crypto?: { randomUUID?: () => string }
  }
  const uuid = typeof cryptoApi.crypto?.randomUUID === 'function'
    ? cryptoApi.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

  return `${prefix}:${uuid}`
}

function compareVersions(
  incoming: Pick<SyncFieldVersion, 'lamport' | 'clientTimestamp' | 'actorId' | 'operationId'>,
  current: Pick<SyncFieldVersion, 'lamport' | 'clientTimestamp' | 'actorId' | 'operationId'>,
): number {
  if (incoming.lamport !== current.lamport) {
    return incoming.lamport - current.lamport
  }

  if (incoming.clientTimestamp !== current.clientTimestamp) {
    return incoming.clientTimestamp - current.clientTimestamp
  }

  if (incoming.actorId !== current.actorId) {
    return incoming.actorId.localeCompare(current.actorId)
  }

  return incoming.operationId.localeCompare(current.operationId)
}

function trimOperations(operations: SyncFieldOperation[]): SyncFieldOperation[] {
  if (operations.length <= MAX_SYNC_OPERATIONS) {
    return operations
  }

  return operations.slice(-MAX_SYNC_OPERATIONS)
}

function trimAppliedIds(ids: string[]): string[] {
  if (ids.length <= MAX_APPLIED_OPERATION_IDS) {
    return ids
  }

  return ids.slice(-MAX_APPLIED_OPERATION_IDS)
}

export function createSyncDocument(options: CreateSyncDocumentOptions): SyncDocumentState {
  const values = { ...(options.initialValues ?? {}) }
  const fieldVersions: Record<FieldKey, SyncFieldVersion> = {}

  for (const fieldKey of Object.keys(values)) {
    fieldVersions[fieldKey] = {
      fieldKey,
      operationId: `initial:${fieldKey}`,
      actorId: options.actorId,
      lamport: 0,
      clientTimestamp: 0,
    }
  }

  return {
    sessionId: options.sessionId,
    actorId: options.actorId,
    lamport: 0,
    values,
    fieldVersions,
    operations: [],
    appliedOperationIds: [],
    participants: {},
    pendingMutations: [],
  }
}

export function createSyncFieldOperation(
  state: SyncDocumentState,
  options: CreateSyncFieldOperationOptions,
): SyncFieldOperation {
  return {
    id: createSyncId('sync-op'),
    sessionId: state.sessionId,
    actorId: state.actorId,
    type: 'field:set',
    fieldKey: options.fieldKey,
    value: options.value,
    lamport: state.lamport + 1,
    clientTimestamp: options.clientTimestamp ?? Date.now(),
    metadata: options.metadata,
  }
}

export function applySyncOperation(
  state: SyncDocumentState,
  operation: SyncFieldOperation,
): SyncOperationApplyResult {
  if (state.appliedOperationIds.includes(operation.id)) {
    return {
      state: {
        ...state,
        lamport: Math.max(state.lamport, operation.lamport),
      },
      applied: false,
      valueChanged: false,
    }
  }

  const currentVersion = state.fieldVersions[operation.fieldKey]
  const nextState: SyncDocumentState = {
    ...state,
    lamport: Math.max(state.lamport, operation.lamport),
    operations: trimOperations([...state.operations, operation]),
    appliedOperationIds: trimAppliedIds([...state.appliedOperationIds, operation.id]),
  }

  const incomingVersion: SyncFieldVersion = {
    fieldKey: operation.fieldKey,
    operationId: operation.id,
    actorId: operation.actorId,
    lamport: operation.lamport,
    clientTimestamp: operation.clientTimestamp,
  }

  if (!currentVersion || compareVersions(incomingVersion, currentVersion) >= 0) {
    nextState.values = {
      ...state.values,
      [operation.fieldKey]: operation.value,
    }
    nextState.fieldVersions = {
      ...state.fieldVersions,
      [operation.fieldKey]: incomingVersion,
    }

    return {
      state: nextState,
      applied: true,
      valueChanged: currentVersion?.operationId !== incomingVersion.operationId,
    }
  }

  nextState.values = { ...state.values }
  nextState.fieldVersions = { ...state.fieldVersions }

  return {
    state: nextState,
    applied: true,
    valueChanged: false,
  }
}

export function mergeSyncOperations(
  state: SyncDocumentState,
  operations: SyncFieldOperation[],
): SyncDocumentState {
  const sorted = [...operations].sort((left, right) => {
    if (left.lamport !== right.lamport) {
      return left.lamport - right.lamport
    }

    if (left.clientTimestamp !== right.clientTimestamp) {
      return left.clientTimestamp - right.clientTimestamp
    }

    if (left.actorId !== right.actorId) {
      return left.actorId.localeCompare(right.actorId)
    }

    return left.id.localeCompare(right.id)
  })

  let nextState = state
  for (const operation of sorted) {
    nextState = applySyncOperation(nextState, operation).state
  }

  return nextState
}

export function upsertSyncPresence(
  state: SyncDocumentState,
  presence: SyncPresence,
): SyncDocumentState {
  const current = state.participants[presence.actorId]
  if (current && current.updatedAt > presence.updatedAt) {
    return state
  }

  return {
    ...state,
    participants: {
      ...state.participants,
      [presence.actorId]: presence,
    },
  }
}

export function removeSyncPresence(
  state: SyncDocumentState,
  actorId: string,
): SyncDocumentState {
  if (!state.participants[actorId]) {
    return state
  }

  const participants = { ...state.participants }
  delete participants[actorId]

  return {
    ...state,
    participants,
  }
}

export function pruneInactiveSyncParticipants(
  state: SyncDocumentState,
  olderThanMs: number,
  now: number = Date.now(),
): SyncDocumentState {
  const participants: Record<string, SyncPresence> = {}

  for (const [actorId, presence] of Object.entries(state.participants)) {
    if (now - presence.updatedAt <= olderThanMs) {
      participants[actorId] = presence
    }
  }

  return {
    ...state,
    participants,
  }
}

export function queueSyncMutation(
  state: SyncDocumentState,
  options: QueueSyncMutationOptions,
): SyncDocumentState {
  const mutation: SyncPendingMutation = {
    id: options.id ?? createSyncId('sync-mutation'),
    type: options.type,
    submissionId: options.submissionId,
    formId: options.formId,
    versionId: options.versionId,
    stepId: options.stepId,
    values: options.values,
    context: options.context,
    enqueuedAt: options.enqueuedAt ?? Date.now(),
    attempts: 0,
    status: 'pending',
    metadata: options.metadata,
  }

  return {
    ...state,
    pendingMutations: [...state.pendingMutations, mutation],
  }
}

export function acknowledgeSyncMutation(
  state: SyncDocumentState,
  mutationId: string,
): SyncDocumentState {
  return {
    ...state,
    pendingMutations: state.pendingMutations.filter((mutation) => mutation.id !== mutationId),
  }
}

export function markSyncMutationFailed(
  state: SyncDocumentState,
  mutationId: string,
  error: string,
): SyncDocumentState {
  return {
    ...state,
    pendingMutations: state.pendingMutations.map((mutation) => {
      if (mutation.id !== mutationId) {
        return mutation
      }

      return {
        ...mutation,
        status: 'failed',
        attempts: mutation.attempts + 1,
        lastError: error,
      }
    }),
  }
}

export function replaceSyncMutationSubmissionId(
  state: SyncDocumentState,
  fromSubmissionId: string,
  toSubmissionId: string,
): SyncDocumentState {
  return {
    ...state,
    pendingMutations: state.pendingMutations.map((mutation) => (
      mutation.submissionId === fromSubmissionId
        ? { ...mutation, submissionId: toSubmissionId }
        : mutation
    )),
  }
}

export function createSyncSnapshot(state: SyncDocumentState): SyncDocumentSnapshot {
  return {
    sessionId: state.sessionId,
    actorId: state.actorId,
    lamport: state.lamport,
    values: { ...state.values },
    fieldVersions: { ...state.fieldVersions },
    operations: [...state.operations],
    participants: { ...state.participants },
    pendingMutations: [...state.pendingMutations],
    lastSyncedAt: state.lastSyncedAt,
  }
}

export function hydrateSyncDocument(snapshot: SyncDocumentSnapshot): SyncDocumentState {
  return {
    sessionId: snapshot.sessionId,
    actorId: snapshot.actorId,
    lamport: snapshot.lamport,
    values: { ...snapshot.values },
    fieldVersions: { ...snapshot.fieldVersions },
    operations: [...snapshot.operations],
    appliedOperationIds: trimAppliedIds(snapshot.operations.map((operation) => operation.id)),
    participants: { ...snapshot.participants },
    pendingMutations: [...snapshot.pendingMutations],
    lastSyncedAt: snapshot.lastSyncedAt,
  }
}
