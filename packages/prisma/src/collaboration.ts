import {
  createSyncDocument,
  createSyncSnapshot,
  type SyncDocumentSnapshot,
  type SyncFieldOperation,
  type SyncPresence,
} from '@dmc-98/dfe-core'
import {
  CollaborationStoreError,
  type CollaborationAccessContext,
  type CollaborationEventPayload,
  type CollaborationEventRecord,
  type CollaborationJoinSessionInput,
  type CollaborationJoinSessionResult,
  type CollaborationListEventsOptions,
  type CollaborationSessionRecord,
  type CollaborationStore,
} from '@dmc-98/dfe-server'

export interface PrismaCollaborationLike {
  dfeCollaborationSession: any
  dfeCollaborationEvent: any
  dfeCollaborationPresence: any
  $transaction: <T>(fn: (tx: PrismaCollaborationLike) => Promise<T>) => Promise<T>
}

function createEmptySnapshot(sessionId: string, actorId: string): SyncDocumentSnapshot {
  return createSyncSnapshot(createSyncDocument({
    sessionId,
    actorId,
    initialValues: {},
  }))
}

function normalizeSession(row: any): CollaborationSessionRecord {
  return {
    sessionId: row.sessionId,
    tenantId: row.tenantId ?? undefined,
    formId: row.formId ?? undefined,
    versionId: row.versionId ?? undefined,
    submissionId: row.submissionId ?? undefined,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Date.now(),
    lastSequence: row.lastSequence ?? 0,
    metadata: row.metadata ?? null,
  }
}

function normalizePresence(row: any): SyncPresence {
  return {
    actorId: row.actorId,
    sessionId: row.sessionId,
    displayName: row.displayName,
    color: row.color ?? undefined,
    activeFieldKey: row.activeFieldKey ?? null,
    state: row.state,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Date.now(),
    metadata: row.metadata ?? undefined,
  }
}

function normalizeSnapshot(
  row: any,
  fallbackActorId: string,
  presenceRows: any[] = [],
): SyncDocumentSnapshot {
  const base = (row.snapshot ?? createEmptySnapshot(row.sessionId, fallbackActorId)) as SyncDocumentSnapshot
  const participants = {
    ...(base.participants ?? {}),
  }

  for (const presence of presenceRows) {
    const normalized = normalizePresence(presence)
    participants[normalized.actorId] = normalized
  }

  return {
    ...base,
    participants,
  }
}

function matchesOptionalScope(current: string | null | undefined, next: string | null | undefined): boolean {
  if (next === undefined) {
    return true
  }

  return (current ?? null) === next
}

function assertAccess(session: any, access?: CollaborationAccessContext) {
  if (!access) {
    return
  }

  if (session.tenantId !== undefined && access.tenantId !== undefined && (session.tenantId ?? null) !== (access.tenantId ?? null)) {
    throw new CollaborationStoreError('ACCESS_DENIED', 'Tenant does not have access to this collaboration session')
  }
}

function assertScope(session: any, input: CollaborationJoinSessionInput) {
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

function normalizeEvent(row: any): CollaborationEventRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    sequence: row.sequence,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
    actorId: row.actorId ?? undefined,
    event: row.payload as CollaborationEventPayload,
  }
}

export class PrismaCollaborationStore implements CollaborationStore {
  private prisma: PrismaCollaborationLike

  constructor(prisma: PrismaCollaborationLike) {
    this.prisma = prisma
  }

  async joinSession(input: CollaborationJoinSessionInput): Promise<CollaborationJoinSessionResult> {
    return this.prisma.$transaction(async (tx) => {
      let session = await tx.dfeCollaborationSession.findUnique({
        where: { sessionId: input.sessionId },
      })

      if (!session) {
        session = await tx.dfeCollaborationSession.create({
          data: {
            sessionId: input.sessionId,
            tenantId: input.tenantId ?? null,
            formId: input.formId ?? null,
            versionId: input.versionId ?? null,
            submissionId: input.submissionId ?? null,
            createdByUserId: input.userId,
            metadata: input.metadata ?? null,
            snapshot: createEmptySnapshot(input.sessionId, input.actorId),
          },
        })
      } else {
        assertAccess(session, { tenantId: input.tenantId, userId: input.userId })
        assertScope(session, input)
      }

      const presence = await tx.dfeCollaborationPresence.findMany({
        where: { sessionId: input.sessionId },
        orderBy: { updatedAt: 'desc' },
      })

      return {
        session: normalizeSession(session),
        snapshot: normalizeSnapshot(session, input.actorId, presence),
        latestSequence: session.lastSequence ?? 0,
      }
    })
  }

  async getSession(sessionId: string, access?: CollaborationAccessContext): Promise<CollaborationSessionRecord | null> {
    const session = await this.prisma.dfeCollaborationSession.findUnique({
      where: { sessionId },
    })

    if (!session) {
      return null
    }

    assertAccess(session, access)
    return normalizeSession(session)
  }

  async getSnapshot(sessionId: string, access?: CollaborationAccessContext): Promise<SyncDocumentSnapshot | null> {
    const session = await this.prisma.dfeCollaborationSession.findUnique({
      where: { sessionId },
    })
    if (!session) {
      return null
    }

    assertAccess(session, access)
    const presence = await this.prisma.dfeCollaborationPresence.findMany({
      where: { sessionId },
      orderBy: { updatedAt: 'desc' },
    })
    return normalizeSnapshot(session, session.createdByUserId, presence)
  }

  async saveSnapshot(input: {
    sessionId: string
    actorId?: string | null
    access: CollaborationAccessContext
    snapshot: SyncDocumentSnapshot
  }): Promise<CollaborationEventRecord> {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.requireSession(tx, input.sessionId, input.access)
      const updated = await tx.dfeCollaborationSession.update({
        where: { sessionId: input.sessionId },
        data: {
          lastSequence: { increment: 1 },
          snapshot: input.snapshot,
        },
      })

      const created = await tx.dfeCollaborationEvent.create({
        data: {
          sessionId: input.sessionId,
          sequence: updated.lastSequence,
          actorId: input.actorId ?? null,
          kind: 'snapshot',
          payload: {
            kind: 'snapshot',
            snapshot: input.snapshot,
          },
        },
      })

      return normalizeEvent(created)
    })
  }

  async appendOperation(input: {
    sessionId: string
    access: CollaborationAccessContext
    operation: SyncFieldOperation
  }): Promise<CollaborationEventRecord> {
    return this.prisma.$transaction(async (tx) => {
      await this.requireSession(tx, input.sessionId, input.access)
      const updated = await tx.dfeCollaborationSession.update({
        where: { sessionId: input.sessionId },
        data: {
          lastSequence: { increment: 1 },
        },
      })

      const created = await tx.dfeCollaborationEvent.create({
        data: {
          sessionId: input.sessionId,
          sequence: updated.lastSequence,
          actorId: input.operation.actorId,
          kind: 'operation',
          payload: {
            kind: 'operation',
            operation: input.operation,
          },
        },
      })

      return normalizeEvent(created)
    })
  }

  async appendPresence(input: {
    sessionId: string
    access: CollaborationAccessContext
    presence: SyncPresence
  }): Promise<CollaborationEventRecord> {
    return this.prisma.$transaction(async (tx) => {
      await this.requireSession(tx, input.sessionId, input.access)
      await tx.dfeCollaborationPresence.upsert({
        where: {
          sessionId_actorId: {
            sessionId: input.sessionId,
            actorId: input.presence.actorId,
          },
        },
        create: {
          sessionId: input.sessionId,
          actorId: input.presence.actorId,
          displayName: input.presence.displayName,
          color: input.presence.color ?? null,
          activeFieldKey: input.presence.activeFieldKey ?? null,
          state: input.presence.state,
          metadata: input.presence.metadata ?? null,
          updatedAt: new Date(input.presence.updatedAt),
        },
        update: {
          displayName: input.presence.displayName,
          color: input.presence.color ?? null,
          activeFieldKey: input.presence.activeFieldKey ?? null,
          state: input.presence.state,
          metadata: input.presence.metadata ?? null,
          updatedAt: new Date(input.presence.updatedAt),
        },
      })

      const updated = await tx.dfeCollaborationSession.update({
        where: { sessionId: input.sessionId },
        data: {
          lastSequence: { increment: 1 },
        },
      })

      const created = await tx.dfeCollaborationEvent.create({
        data: {
          sessionId: input.sessionId,
          sequence: updated.lastSequence,
          actorId: input.presence.actorId,
          kind: 'presence',
          payload: {
            kind: 'presence',
            presence: input.presence,
          },
        },
      })

      return normalizeEvent(created)
    })
  }

  async listEvents(
    sessionId: string,
    options?: CollaborationListEventsOptions,
    access?: CollaborationAccessContext,
  ): Promise<CollaborationEventRecord[]> {
    await this.requireSession(this.prisma, sessionId, access)
    const events = await this.prisma.dfeCollaborationEvent.findMany({
      where: {
        sessionId,
        sequence: {
          gt: options?.afterSequence ?? 0,
        },
      },
      orderBy: { sequence: 'asc' },
      take: options?.limit ?? 100,
    })

    return events.map(normalizeEvent)
  }

  async listPresence(sessionId: string, access?: CollaborationAccessContext): Promise<SyncPresence[]> {
    await this.requireSession(this.prisma, sessionId, access)
    const rows = await this.prisma.dfeCollaborationPresence.findMany({
      where: { sessionId },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map(normalizePresence)
  }

  async prunePresence(sessionId: string, olderThanMs: number, access?: CollaborationAccessContext): Promise<number> {
    await this.requireSession(this.prisma, sessionId, access)
    const threshold = new Date(Date.now() - olderThanMs)
    const result = await this.prisma.dfeCollaborationPresence.deleteMany({
      where: {
        sessionId,
        updatedAt: {
          lt: threshold,
        },
      },
    })
    return result.count ?? 0
  }

  private async requireSession(
    tx: PrismaCollaborationLike,
    sessionId: string,
    access?: CollaborationAccessContext,
  ) {
    const session = await tx.dfeCollaborationSession.findUnique({
      where: { sessionId },
    })
    if (!session) {
      throw new CollaborationStoreError('SESSION_NOT_FOUND', 'Collaboration session not found')
    }

    assertAccess(session, access)
    return session
  }
}
