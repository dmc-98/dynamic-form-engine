import { describe, expect, it } from 'vitest'
import {
  acknowledgeSyncMutation,
  applySyncOperation,
  createSyncDocument,
  createSyncFieldOperation,
  createSyncSnapshot,
  hydrateSyncDocument,
  markSyncMutationFailed,
  mergeSyncOperations,
  pruneInactiveSyncParticipants,
  queueSyncMutation,
  replaceSyncMutationSubmissionId,
  upsertSyncPresence,
} from '../src'

describe('sync document model', () => {
  it('creates local field operations with lamport clocks', () => {
    const state = createSyncDocument({
      sessionId: 'session-1',
      actorId: 'actor-a',
      initialValues: { first_name: 'Ada' },
    })

    const operation = createSyncFieldOperation(state, {
      fieldKey: 'first_name',
      value: 'Grace',
      clientTimestamp: 100,
    })

    expect(operation.lamport).toBe(1)
    expect(operation.actorId).toBe('actor-a')
    expect(operation.fieldKey).toBe('first_name')
  })

  it('applies local and remote operations deterministically', () => {
    let state = createSyncDocument({
      sessionId: 'session-1',
      actorId: 'actor-a',
      initialValues: { first_name: 'Ada' },
    })

    const local = createSyncFieldOperation(state, {
      fieldKey: 'first_name',
      value: 'Grace',
      clientTimestamp: 100,
    })
    state = applySyncOperation(state, local).state

    const remote = {
      ...local,
      id: 'remote-1',
      actorId: 'actor-b',
      value: 'Katherine',
      clientTimestamp: 101,
    }

    const merged = applySyncOperation(state, remote)

    expect(merged.applied).toBe(true)
    expect(merged.valueChanged).toBe(true)
    expect(merged.state.values.first_name).toBe('Katherine')
    expect(merged.state.fieldVersions.first_name?.actorId).toBe('actor-b')
  })

  it('ignores duplicate operations while keeping lamport in sync', () => {
    let state = createSyncDocument({
      sessionId: 'session-1',
      actorId: 'actor-a',
    })

    const operation = {
      id: 'op-1',
      sessionId: 'session-1',
      actorId: 'actor-b',
      type: 'field:set' as const,
      fieldKey: 'department',
      value: 'eng',
      lamport: 4,
      clientTimestamp: 100,
    }

    state = applySyncOperation(state, operation).state
    const duplicate = applySyncOperation(state, operation)

    expect(duplicate.applied).toBe(false)
    expect(duplicate.state.lamport).toBe(4)
    expect(duplicate.state.operations).toHaveLength(1)
  })

  it('merges operations in deterministic order', () => {
    const state = createSyncDocument({
      sessionId: 'session-1',
      actorId: 'actor-a',
    })

    const merged = mergeSyncOperations(state, [
      {
        id: 'op-2',
        sessionId: 'session-1',
        actorId: 'actor-b',
        type: 'field:set',
        fieldKey: 'role',
        value: 'designer',
        lamport: 2,
        clientTimestamp: 200,
      },
      {
        id: 'op-1',
        sessionId: 'session-1',
        actorId: 'actor-c',
        type: 'field:set',
        fieldKey: 'role',
        value: 'engineer',
        lamport: 1,
        clientTimestamp: 100,
      },
    ])

    expect(merged.values.role).toBe('designer')
    expect(merged.operations.map((operation) => operation.id)).toEqual(['op-1', 'op-2'])
  })

  it('round-trips sync snapshots', () => {
    let state = createSyncDocument({
      sessionId: 'session-1',
      actorId: 'actor-a',
      initialValues: { team: 'platform' },
    })
    const operation = createSyncFieldOperation(state, {
      fieldKey: 'team',
      value: 'infrastructure',
      clientTimestamp: 100,
    })
    state = applySyncOperation(state, operation).state
    state = upsertSyncPresence(state, {
      actorId: 'actor-b',
      sessionId: 'session-1',
      displayName: 'Jordan',
      state: 'active',
      updatedAt: 150,
    })

    const snapshot = createSyncSnapshot(state)
    const hydrated = hydrateSyncDocument(snapshot)

    expect(hydrated.values.team).toBe('infrastructure')
    expect(hydrated.participants['actor-b']?.displayName).toBe('Jordan')
    expect(hydrated.appliedOperationIds).toContain(operation.id)
  })

  it('tracks presence updates and prunes inactive participants', () => {
    let state = createSyncDocument({
      sessionId: 'session-1',
      actorId: 'actor-a',
    })

    state = upsertSyncPresence(state, {
      actorId: 'actor-b',
      sessionId: 'session-1',
      displayName: 'Jordan',
      state: 'active',
      updatedAt: 100,
      activeFieldKey: 'first_name',
    })
    state = upsertSyncPresence(state, {
      actorId: 'actor-c',
      sessionId: 'session-1',
      displayName: 'Priya',
      state: 'idle',
      updatedAt: 400,
    })

    const pruned = pruneInactiveSyncParticipants(state, 150, 500)

    expect(pruned.participants['actor-b']).toBeUndefined()
    expect(pruned.participants['actor-c']?.displayName).toBe('Priya')
  })

  it('queues, remaps, fails, and acknowledges pending mutations', () => {
    let state = createSyncDocument({
      sessionId: 'session-1',
      actorId: 'actor-a',
    })

    state = queueSyncMutation(state, {
      id: 'mutation-1',
      type: 'submission:create',
      submissionId: 'offline:submission-1',
      formId: 'form-1',
      versionId: 'version-1',
      enqueuedAt: 100,
    })
    state = queueSyncMutation(state, {
      id: 'mutation-2',
      type: 'step:submit',
      submissionId: 'offline:submission-1',
      stepId: 'step-1',
      values: { first_name: 'Ada' },
      context: { userId: 'user-1' },
      enqueuedAt: 101,
    })

    state = replaceSyncMutationSubmissionId(state, 'offline:submission-1', 'server-submission-1')
    state = markSyncMutationFailed(state, 'mutation-2', 'offline')

    expect(state.pendingMutations[1]?.submissionId).toBe('server-submission-1')
    expect(state.pendingMutations[1]?.status).toBe('failed')
    expect(state.pendingMutations[1]?.attempts).toBe(1)

    state = acknowledgeSyncMutation(state, 'mutation-1')
    expect(state.pendingMutations).toHaveLength(1)
    expect(state.pendingMutations[0]?.id).toBe('mutation-2')
  })
})
