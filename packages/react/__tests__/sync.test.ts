import { describe, expect, it, vi } from 'vitest'
import type { FormRuntimeContext } from '@dmc-98/dfe-core'
import {
  createMemoryPersistenceAdapter,
  createOfflineRuntimeState,
  createOfflineSubmissionId,
  enqueueOfflineCompleteSubmission,
  enqueueOfflineCreateSubmission,
  enqueueOfflineStepSubmit,
  flushOfflineRuntimeState,
} from '../src'

describe('react sync utilities', () => {
  it('creates deterministic offline runtime state and local submission ids', () => {
    const state = createOfflineRuntimeState({
      context: { userId: 'user-1' },
    })

    expect(state.pendingMutations).toEqual([])
    expect(state.context.userId).toBe('user-1')
    expect(createOfflineSubmissionId(100)).toMatch(/^offline:/)
  })

  it('persists and restores values through the memory adapter', async () => {
    const storage = createMemoryPersistenceAdapter()
    await storage.set('draft', { hello: 'world' })

    expect(await storage.get<{ hello: string }>('draft')).toEqual({ hello: 'world' })

    await storage.delete('draft')
    expect(await storage.get('draft')).toBeNull()
  })

  it('queues offline submission lifecycle actions', () => {
    const baseContext: FormRuntimeContext = { userId: 'user-1' }
    let state = createOfflineRuntimeState({
      context: baseContext,
    })

    state = enqueueOfflineCreateSubmission(state, {
      submissionId: 'offline:1',
      formId: 'form-1',
      versionId: 'version-1',
      context: baseContext,
      now: 100,
    })
    state = enqueueOfflineStepSubmit(state, {
      submissionId: 'offline:1',
      stepId: 'step-1',
      values: { first_name: 'Ada' },
      context: baseContext,
      now: 101,
    })
    state = enqueueOfflineCompleteSubmission(state, {
      submissionId: 'offline:1',
      context: baseContext,
      now: 102,
    })

    expect(state.pendingMutations.map((mutation) => mutation.type)).toEqual([
      'submission:create',
      'step:submit',
      'submission:complete',
    ])
  })

  it('flushes queued runtime actions and remaps offline submission ids', async () => {
    const createSubmission = vi.fn().mockResolvedValue({
      id: 'server-submission-1',
      context: {
        userId: 'user-1',
        employeeId: 'employee-1',
      },
    })
    const submitStep = vi.fn().mockResolvedValue({
      success: true,
      context: {
        userId: 'user-1',
        employeeId: 'employee-1',
        assignmentId: 'assignment-1',
      },
    })
    const completeSubmission = vi.fn().mockResolvedValue(undefined)

    let state = createOfflineRuntimeState({
      context: { userId: 'user-1' },
    })

    state = enqueueOfflineCreateSubmission(state, {
      submissionId: 'offline:submission-1',
      formId: 'form-1',
      versionId: 'version-1',
      context: { userId: 'user-1' },
    })
    state = enqueueOfflineStepSubmit(state, {
      submissionId: 'offline:submission-1',
      stepId: 'step-1',
      values: { first_name: 'Ada' },
      context: { userId: 'user-1' },
    })
    state = enqueueOfflineCompleteSubmission(state, {
      submissionId: 'offline:submission-1',
      context: { userId: 'user-1' },
    })

    const flushed = await flushOfflineRuntimeState(state, {
      createSubmission,
      submitStep,
      completeSubmission,
    }, 500)

    expect(createSubmission).toHaveBeenCalledWith('form-1', 'version-1')
    expect(submitStep).toHaveBeenCalledWith('server-submission-1', 'step-1', {
      values: { first_name: 'Ada' },
      context: {
        userId: 'user-1',
        employeeId: 'employee-1',
      },
    })
    expect(completeSubmission).toHaveBeenCalledWith('server-submission-1')
    expect(flushed.pendingMutations).toEqual([])
    expect(flushed.submissionId).toBe('server-submission-1')
    expect(flushed.context.assignmentId).toBe('assignment-1')
    expect(flushed.lastSyncedAt).toBe(500)
  })
})
