import { describe, expect, it } from 'vitest'
import { CollaborationStoreError } from '@dmc-98/dfe-server'
import { PrismaCollaborationStore } from '../src/collaboration'

function createMockPrismaCollaboration() {
  const sessions = new Map<string, any>()
  const events: any[] = []
  const presence = new Map<string, any>()

  const keyForPresence = (sessionId: string, actorId: string) => `${sessionId}:${actorId}`

  const client: any = {
    dfeCollaborationSession: {
      findUnique: async ({ where }: any) => sessions.get(where.sessionId) ?? null,
      create: async ({ data }: any) => {
        const row = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSequence: data.lastSequence ?? 0,
        }
        sessions.set(data.sessionId, row)
        return row
      },
      update: async ({ where, data }: any) => {
        const existing = sessions.get(where.sessionId)
        if (!existing) {
          throw new Error('session not found')
        }

        const next = {
          ...existing,
          ...data,
          lastSequence: data.lastSequence?.increment
            ? existing.lastSequence + data.lastSequence.increment
            : (data.lastSequence ?? existing.lastSequence),
          snapshot: data.snapshot ?? existing.snapshot,
          updatedAt: new Date(),
        }
        sessions.set(where.sessionId, next)
        return next
      },
    },
    dfeCollaborationEvent: {
      create: async ({ data }: any) => {
        const row = {
          ...data,
          id: data.id ?? `event-${events.length + 1}`,
          createdAt: new Date(),
        }
        events.push(row)
        return row
      },
      findMany: async ({ where, orderBy, take }: any) => {
        const filtered = events
          .filter((row) => row.sessionId === where.sessionId && row.sequence > (where.sequence?.gt ?? 0))
          .sort((left, right) => left.sequence - right.sequence)
        return orderBy?.sequence === 'asc' ? filtered.slice(0, take ?? filtered.length) : filtered
      },
    },
    dfeCollaborationPresence: {
      findMany: async ({ where }: any) => {
        const rows = Array.from(presence.values()).filter((row) => row.sessionId === where.sessionId)
        return rows.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      },
      upsert: async ({ where, create, update }: any) => {
        const key = keyForPresence(where.sessionId_actorId.sessionId, where.sessionId_actorId.actorId)
        const existing = presence.get(key)
        const row = existing
          ? { ...existing, ...update }
          : { ...create }
        presence.set(key, row)
        return row
      },
      deleteMany: async ({ where }: any) => {
        let count = 0
        for (const [key, row] of presence.entries()) {
          if (row.sessionId === where.sessionId && row.updatedAt < where.updatedAt.lt) {
            presence.delete(key)
            count += 1
          }
        }
        return { count }
      },
    },
    $transaction: async (fn: any) => fn(client),
  }

  return client
}

describe('PrismaCollaborationStore', () => {
  it('creates sessions, persists events, and returns snapshots', async () => {
    const prisma = createMockPrismaCollaboration()
    const store = new PrismaCollaborationStore(prisma)

    const joined = await store.joinSession({
      sessionId: 'session-1',
      actorId: 'actor-1',
      displayName: 'Owner',
      userId: 'user-1',
      tenantId: 'tenant-1',
      formId: 'form-1',
      versionId: 'version-1',
    })

    expect(joined.latestSequence).toBe(0)

    await store.appendPresence({
      sessionId: 'session-1',
      access: { tenantId: 'tenant-1', userId: 'user-1' },
      presence: {
        actorId: 'actor-1',
        sessionId: 'session-1',
        displayName: 'Owner',
        state: 'active',
        updatedAt: Date.now(),
      },
    })

    await store.appendOperation({
      sessionId: 'session-1',
      access: { tenantId: 'tenant-1', userId: 'user-1' },
      operation: {
        id: 'op-1',
        sessionId: 'session-1',
        actorId: 'actor-1',
        type: 'field:set',
        fieldKey: 'firstName',
        value: 'Ada',
        lamport: 1,
        clientTimestamp: 1,
      },
    })

    await store.saveSnapshot({
      sessionId: 'session-1',
      actorId: 'actor-1',
      access: { tenantId: 'tenant-1', userId: 'user-1' },
      snapshot: {
        sessionId: 'session-1',
        actorId: 'actor-1',
        lamport: 1,
        values: { firstName: 'Ada' },
        fieldVersions: {},
        operations: [],
        participants: {},
        pendingMutations: [],
      },
    })

    const snapshot = await store.getSnapshot('session-1', {
      tenantId: 'tenant-1',
      userId: 'user-1',
    })

    expect(snapshot?.values).toEqual({ firstName: 'Ada' })
    expect(snapshot?.participants['actor-1']).toMatchObject({
      displayName: 'Owner',
    })

    const events = await store.listEvents('session-1', {
      afterSequence: 0,
      limit: 10,
    }, {
      tenantId: 'tenant-1',
      userId: 'user-1',
    })

    expect(events).toHaveLength(3)
    expect(events.map((event) => event.event.kind)).toEqual([
      'presence',
      'operation',
      'snapshot',
    ])
  })

  it('enforces tenant and scope boundaries for existing sessions', async () => {
    const prisma = createMockPrismaCollaboration()
    const store = new PrismaCollaborationStore(prisma)

    await store.joinSession({
      sessionId: 'session-2',
      actorId: 'actor-1',
      displayName: 'Owner',
      userId: 'user-1',
      tenantId: 'tenant-1',
      formId: 'form-1',
      versionId: 'version-1',
    })

    await expect(store.getSession('session-2', {
      tenantId: 'tenant-2',
      userId: 'user-2',
    })).rejects.toMatchObject<CollaborationStoreError>({
      code: 'ACCESS_DENIED',
    })

    await expect(store.joinSession({
      sessionId: 'session-2',
      actorId: 'actor-2',
      displayName: 'Guest',
      userId: 'user-1',
      tenantId: 'tenant-1',
      formId: 'form-2',
      versionId: 'version-1',
    })).rejects.toMatchObject<CollaborationStoreError>({
      code: 'SCOPE_MISMATCH',
    })
  })

  it('lists and prunes presence entries and rejects missing sessions', async () => {
    const prisma = createMockPrismaCollaboration()
    const store = new PrismaCollaborationStore(prisma)
    const now = Date.now()

    await store.joinSession({
      sessionId: 'session-3',
      actorId: 'actor-1',
      displayName: 'Owner',
      userId: 'user-1',
      tenantId: 'tenant-1',
      formId: 'form-1',
      versionId: 'version-1',
    })

    await store.appendPresence({
      sessionId: 'session-3',
      access: { tenantId: 'tenant-1', userId: 'user-1' },
      presence: {
        actorId: 'actor-1',
        sessionId: 'session-3',
        displayName: 'Owner',
        state: 'active',
        updatedAt: now - 10_000,
      },
    })

    await store.appendPresence({
      sessionId: 'session-3',
      access: { tenantId: 'tenant-1', userId: 'user-1' },
      presence: {
        actorId: 'actor-2',
        sessionId: 'session-3',
        displayName: 'Guest',
        state: 'idle',
        updatedAt: now,
      },
    })

    const listed = await store.listPresence('session-3', {
      tenantId: 'tenant-1',
      userId: 'user-1',
    })

    expect(listed).toHaveLength(2)
    expect(listed[0]?.actorId).toBe('actor-2')

    const pruned = await store.prunePresence('session-3', 5_000, {
      tenantId: 'tenant-1',
      userId: 'user-1',
    })

    expect(pruned).toBe(1)

    const remaining = await store.listPresence('session-3', {
      tenantId: 'tenant-1',
      userId: 'user-1',
    })

    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.actorId).toBe('actor-2')

    await expect(store.listPresence('missing-session', {
      tenantId: 'tenant-1',
      userId: 'user-1',
    })).rejects.toMatchObject<CollaborationStoreError>({
      code: 'SESSION_NOT_FOUND',
    })
  })
})
