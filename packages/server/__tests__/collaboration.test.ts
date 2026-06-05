import { describe, expect, it } from 'vitest'
import { InMemoryCollaborationStore } from '../src/collaboration'

describe('InMemoryCollaborationStore', () => {
  it('creates a session, stores events, and returns snapshots with presence', async () => {
    const store = new InMemoryCollaborationStore()

    const joined = await store.joinSession({
      sessionId: 'session-1',
      actorId: 'actor-1',
      displayName: 'Owner',
      tenantId: 'tenant-1',
      userId: 'user-1',
      formId: 'form-1',
      versionId: 'version-1',
    })

    expect(joined.latestSequence).toBe(0)
    expect(joined.snapshot.sessionId).toBe('session-1')

    await store.appendPresence({
      sessionId: 'session-1',
      access: { tenantId: 'tenant-1', userId: 'user-1' },
      presence: {
        actorId: 'actor-1',
        sessionId: 'session-1',
        displayName: 'Owner',
        state: 'active',
        activeFieldKey: 'firstName',
        updatedAt: 1,
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
        fieldVersions: {
          firstName: {
            fieldKey: 'firstName',
            operationId: 'op-1',
            actorId: 'actor-1',
            lamport: 1,
            clientTimestamp: 1,
          },
        },
        operations: [
          {
            id: 'op-1',
            sessionId: 'session-1',
            actorId: 'actor-1',
            type: 'field:set',
            fieldKey: 'firstName',
            value: 'Ada',
            lamport: 1,
            clientTimestamp: 1,
          },
        ],
        participants: {},
        pendingMutations: [],
        lastSyncedAt: 1,
      },
    })

    const snapshot = await store.getSnapshot('session-1', {
      tenantId: 'tenant-1',
      userId: 'user-1',
    })

    expect(snapshot?.values).toEqual({ firstName: 'Ada' })
    expect(snapshot?.participants['actor-1']).toMatchObject({
      displayName: 'Owner',
      activeFieldKey: 'firstName',
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

  it('rejects access when tenant scope does not match', async () => {
    const store = new InMemoryCollaborationStore()
    await store.joinSession({
      sessionId: 'session-2',
      actorId: 'actor-1',
      displayName: 'Owner',
      tenantId: 'tenant-1',
      userId: 'user-1',
    })

    await expect(
      store.getSnapshot('session-2', { tenantId: 'tenant-2', userId: 'user-2' }),
    ).rejects.toMatchObject({
      code: 'ACCESS_DENIED',
    })
  })

  it('prunes stale presence records', async () => {
    const store = new InMemoryCollaborationStore()
    await store.joinSession({
      sessionId: 'session-3',
      actorId: 'actor-1',
      displayName: 'Owner',
      userId: 'user-1',
    })

    await store.appendPresence({
      sessionId: 'session-3',
      access: { userId: 'user-1' },
      presence: {
        actorId: 'actor-1',
        sessionId: 'session-3',
        displayName: 'Owner',
        state: 'active',
        updatedAt: Date.now() - 100_000,
      },
    })

    const removed = await store.prunePresence('session-3', 10_000, { userId: 'user-1' })
    expect(removed).toBe(1)
    expect(await store.listPresence('session-3', { userId: 'user-1' })).toEqual([])
  })
})
