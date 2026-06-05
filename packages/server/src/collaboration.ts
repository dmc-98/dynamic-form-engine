import {
  createSyncDocument,
  createSyncSnapshot,
  type FormValues,
  type SyncDocumentSnapshot,
  type SyncFieldOperation,
  type SyncPresence,
} from '@dmc--98/dfe-core'
import { generateId } from './uuid'

export type CollaborationEventPayload =
  | { kind: 'operation'; operation: SyncFieldOperation }
  | { kind: 'presence'; presence: SyncPresence }
  | { kind: 'snapshot'; snapshot: SyncDocumentSnapshot }

export interface CollaborationAccessContext {
  tenantId?: string | null
  userId: string
}

export interface CollaborationSessionRecord {
  sessionId: string
  tenantId?: string | null
  formId?: string | null
  versionId?: string | null
  submissionId?: string | null
  createdByUserId: string
  createdAt: number
  updatedAt: number
  lastSequence: number
  metadata?: Record<string, unknown> | null
}

export interface CollaborationEventRecord {
  id: string
  sessionId: string
  sequence: number
  createdAt: number
  actorId?: string | null
  event: CollaborationEventPayload
}

export interface CollaborationJoinSessionInput {
  sessionId: string
  actorId: string
  displayName: string
  color?: string
  tenantId?: string | null
  userId: string
  formId?: string | null
  versionId?: string | null
  submissionId?: string | null
  metadata?: Record<string, unknown>
}

export interface CollaborationJoinSessionResult {
  session: CollaborationSessionRecord
  snapshot: SyncDocumentSnapshot
  latestSequence: number
}

export interface CollaborationListEventsOptions {
  afterSequence?: number
  limit?: number
}

export class CollaborationStoreError extends Error {
  code: 'ACCESS_DENIED' | 'SESSION_NOT_FOUND' | 'SCOPE_MISMATCH'

  constructor(code: CollaborationStoreError['code'], message: string) {
    super(message)
    this.name = 'CollaborationStoreError'
    this.code = code
  }
}

export interface CollaborationStore {
  joinSession(input: CollaborationJoinSessionInput): Promise<CollaborationJoinSessionResult>
  getSession(sessionId: string, access?: CollaborationAccessContext): Promise<CollaborationSessionRecord | null>
  getSnapshot(sessionId: string, access?: CollaborationAccessContext): Promise<SyncDocumentSnapshot | null>
  saveSnapshot(input: {
    sessionId: string
    actorId?: string | null
    access: CollaborationAccessContext
    snapshot: SyncDocumentSnapshot
  }): Promise<CollaborationEventRecord>
  appendOperation(input: {
    sessionId: string
    access: CollaborationAccessContext
    operation: SyncFieldOperation
  }): Promise<CollaborationEventRecord>
  appendPresence(input: {
    sessionId: string
    access: CollaborationAccessContext
    presence: SyncPresence
  }): Promise<CollaborationEventRecord>
  listEvents(
    sessionId: string,
    options?: CollaborationListEventsOptions,
    access?: CollaborationAccessContext,
  ): Promise<CollaborationEventRecord[]>
  listPresence(sessionId: string, access?: CollaborationAccessContext): Promise<SyncPresence[]>
  prunePresence(sessionId: string, olderThanMs: number, access?: CollaborationAccessContext): Promise<number>
}

interface StoredSessionState {
  session: CollaborationSessionRecord
  snapshot: SyncDocumentSnapshot
  events: CollaborationEventRecord[]
  presence: Map<string, SyncPresence>
}

function createEmptySnapshot(
  sessionId: string,
  actorId: string,
  initialValues: FormValues = {},
): SyncDocumentSnapshot {
  return createSyncSnapshot(createSyncDocument({
    sessionId,
    actorId,
    initialValues,
  }))
}

function mergePresenceIntoSnapshot(
  snapshot: SyncDocumentSnapshot,
  presenceEntries: Iterable<SyncPresence>,
): SyncDocumentSnapshot {
  const participants = { ...snapshot.participants }
  for (const presence of presenceEntries) {
    participants[presence.actorId] = presence
  }

  return {
    ...snapshot,
    participants,
  }
}

function matchesOptionalScope(current: string | null | undefined, next: string | null | undefined): boolean {
  if (next === undefined) {
    return true
  }

  return (current ?? null) === next
}

function assertAccess(
  session: CollaborationSessionRecord,
  access?: CollaborationAccessContext,
) {
  if (!access) {
    return
  }

  if (session.tenantId !== undefined && access.tenantId !== undefined && (session.tenantId ?? null) !== (access.tenantId ?? null)) {
    throw new CollaborationStoreError('ACCESS_DENIED', 'Tenant does not have access to this collaboration session')
  }
}

function assertScope(
  session: CollaborationSessionRecord,
  input: CollaborationJoinSessionInput,
) {
  if (!matchesOptionalScope(session.tenantId, input.tenantId)) {
    throw new CollaborationStoreError('SCOPE_MISMATCH', 'tenantId does not match the existing collaboration session')
  }

  if (!matchesOptionalScope(session.formId, input.formId)) {
    throw new CollaborationStoreError('SCOPE_MISMATCH', 'formId does not match the existing collaboration session')
  }

  if (!matchesOptionalScope(session.versionId, input.versionId)) {
    throw new CollaborationStoreError('SCOPE_MISMATCH', 'versionId does not match the existing collaboration session')
  }

  if (!matchesOptionalScope(session.submissionId, input.submissionId)) {
    throw new CollaborationStoreError('SCOPE_MISMATCH', 'submissionId does not match the existing collaboration session')
  }
}

export class InMemoryCollaborationStore implements CollaborationStore {
  private sessions = new Map<string, StoredSessionState>()

  async joinSession(input: CollaborationJoinSessionInput): Promise<CollaborationJoinSessionResult> {
    let state = this.sessions.get(input.sessionId)
    const now = Date.now()

    if (!state) {
      const session: CollaborationSessionRecord = {
        sessionId: input.sessionId,
        tenantId: input.tenantId ?? undefined,
        formId: input.formId ?? undefined,
        versionId: input.versionId ?? undefined,
        submissionId: input.submissionId ?? undefined,
        createdByUserId: input.userId,
        createdAt: now,
        updatedAt: now,
        lastSequence: 0,
        metadata: input.metadata ?? null,
      }

      state = {
        session,
        snapshot: createEmptySnapshot(input.sessionId, input.actorId),
        events: [],
        presence: new Map(),
      }
      this.sessions.set(input.sessionId, state)
    } else {
      assertAccess(state.session, { tenantId: input.tenantId, userId: input.userId })
      assertScope(state.session, input)
      state.session.updatedAt = now
    }

    return {
      session: { ...state.session },
      snapshot: mergePresenceIntoSnapshot(state.snapshot, state.presence.values()),
      latestSequence: state.session.lastSequence,
    }
  }

  async getSession(sessionId: string, access?: CollaborationAccessContext): Promise<CollaborationSessionRecord | null> {
    const state = this.sessions.get(sessionId)
    if (!state) {
      return null
    }

    assertAccess(state.session, access)
    return { ...state.session }
  }

  async getSnapshot(sessionId: string, access?: CollaborationAccessContext): Promise<SyncDocumentSnapshot | null> {
    const state = this.sessions.get(sessionId)
    if (!state) {
      return null
    }

    assertAccess(state.session, access)
    return mergePresenceIntoSnapshot(state.snapshot, state.presence.values())
  }

  async saveSnapshot(input: {
    sessionId: string
    actorId?: string | null
    access: CollaborationAccessContext
    snapshot: SyncDocumentSnapshot
  }): Promise<CollaborationEventRecord> {
    const state = this.getExistingState(input.sessionId, input.access)
    state.snapshot = mergePresenceIntoSnapshot(input.snapshot, state.presence.values())
    return this.appendEvent(state, {
      actorId: input.actorId ?? input.snapshot.actorId,
      event: {
        kind: 'snapshot',
        snapshot: state.snapshot,
      },
    })
  }

  async appendOperation(input: {
    sessionId: string
    access: CollaborationAccessContext
    operation: SyncFieldOperation
  }): Promise<CollaborationEventRecord> {
    const state = this.getExistingState(input.sessionId, input.access)
    return this.appendEvent(state, {
      actorId: input.operation.actorId,
      event: {
        kind: 'operation',
        operation: input.operation,
      },
    })
  }

  async appendPresence(input: {
    sessionId: string
    access: CollaborationAccessContext
    presence: SyncPresence
  }): Promise<CollaborationEventRecord> {
    const state = this.getExistingState(input.sessionId, input.access)
    state.presence.set(input.presence.actorId, input.presence)
    return this.appendEvent(state, {
      actorId: input.presence.actorId,
      event: {
        kind: 'presence',
        presence: input.presence,
      },
    })
  }

  async listEvents(
    sessionId: string,
    options?: CollaborationListEventsOptions,
    access?: CollaborationAccessContext,
  ): Promise<CollaborationEventRecord[]> {
    const state = this.getExistingState(sessionId, access)
    const afterSequence = options?.afterSequence ?? 0
    const limit = options?.limit ?? 100

    return state.events
      .filter((event) => event.sequence > afterSequence)
      .slice(0, limit)
      .map((event) => ({ ...event }))
  }

  async listPresence(sessionId: string, access?: CollaborationAccessContext): Promise<SyncPresence[]> {
    const state = this.getExistingState(sessionId, access)
    return Array.from(state.presence.values()).map((presence) => ({ ...presence }))
  }

  async prunePresence(sessionId: string, olderThanMs: number, access?: CollaborationAccessContext): Promise<number> {
    const state = this.getExistingState(sessionId, access)
    const now = Date.now()
    let removed = 0

    for (const [actorId, presence] of state.presence.entries()) {
      if (now - presence.updatedAt > olderThanMs) {
        state.presence.delete(actorId)
        removed += 1
      }
    }

    return removed
  }

  private getExistingState(sessionId: string, access?: CollaborationAccessContext) {
    const state = this.sessions.get(sessionId)
    if (!state) {
      throw new CollaborationStoreError('SESSION_NOT_FOUND', 'Collaboration session not found')
    }

    assertAccess(state.session, access)
    return state
  }

  private appendEvent(
    state: StoredSessionState,
    payload: {
      actorId?: string | null
      event: CollaborationEventPayload
    },
  ): CollaborationEventRecord {
    state.session.lastSequence += 1
    state.session.updatedAt = Date.now()

    const record: CollaborationEventRecord = {
      id: generateId(),
      sessionId: state.session.sessionId,
      sequence: state.session.lastSequence,
      createdAt: state.session.updatedAt,
      actorId: payload.actorId ?? null,
      event: payload.event,
    }

    state.events.push(record)
    return { ...record }
  }
}
