import { describe, expect, it, vi } from 'vitest'
import {
  InMemoryCollaborationStore,
  createAesGcmFieldProtector,
  createInMemoryAuditLogStore,
} from '@dmc--98/dfe-server'
import { createDfeApp } from '../src/index'

function createStubDb() {
  return {
    listForms: async () => ({ items: [], nextCursor: null }),
    getFormBySlug: async () => null,
    getFormById: async () => null,
    createSubmission: async () => {
      throw new Error('not implemented')
    },
    getSubmission: async () => null,
    updateSubmission: async () => {
      throw new Error('not implemented')
    },
    executeApiContract: async () => ({}),
    fetchFieldOptions: async () => ({ items: [], nextCursor: null }),
    trackAnalyticsEvent: vi.fn().mockResolvedValue(undefined),
    listAnalyticsEvents: async () => [],
    getAnalyticsSummary: async () => ({
      totalForms: 0,
      totalSubmissions: 0,
      totalStarts: 0,
      totalCompletions: 0,
      completionRate: 0,
      abandonmentRate: 0,
      averageCompletionTimeMs: 0,
      stepFunnel: [],
      fieldErrors: [],
      recentActivity: [],
      variantComparison: [],
    }),
  }
}

describe('createDfeApp collaboration routes', () => {
  it('joins a collaboration session and returns the initial snapshot', async () => {
    const app = createDfeApp({
      db: createStubDb() as any,
      collaboration: {
        store: new InMemoryCollaborationStore(),
      },
    })

    const response = await app.request('/dfe/collab/sessions/session-1/join?tenantId=tenant-1&userId=user-1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actorId: 'actor-1',
        displayName: 'Owner',
        formId: 'form-1',
        versionId: 'version-1',
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.latestSequence).toBe(0)
    expect(body.snapshot.sessionId).toBe('session-1')
  })

  it('stores operations and returns them in the session snapshot', async () => {
    const store = new InMemoryCollaborationStore()
    const app = createDfeApp({
      db: createStubDb() as any,
      collaboration: { store },
    })

    await app.request('/dfe/collab/sessions/session-2/join?userId=user-1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actorId: 'actor-1',
        displayName: 'Owner',
      }),
    })

    const operationResponse = await app.request('/dfe/collab/sessions/session-2/operations?userId=user-1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operation: {
          id: 'op-1',
          sessionId: 'session-2',
          actorId: 'actor-1',
          type: 'field:set',
          fieldKey: 'firstName',
          value: 'Ada',
          lamport: 1,
          clientTimestamp: 1,
        },
      }),
    })

    expect(operationResponse.status).toBe(201)

    const snapshotResponse = await app.request('/dfe/collab/sessions/session-2/snapshot?userId=user-1')
    expect(snapshotResponse.status).toBe(200)
    const snapshotBody = await snapshotResponse.json()
    expect(snapshotBody.snapshot.sessionId).toBe('session-2')

    const events = await store.listEvents('session-2', { afterSequence: 0, limit: 10 }, { userId: 'user-1' })
    expect(events).toHaveLength(1)
    expect(events[0].event.kind).toBe('operation')
  })

  it('supports HIPAA-aware protected storage and audit logging in the serverless route surface', async () => {
    const audit = createInMemoryAuditLogStore()
    const db = createStubDb()
    db.getSubmission = async () => ({
      id: 'sub-1',
      formId: 'form-1',
      userId: 'user-1',
      status: 'IN_PROGRESS',
      context: { userId: 'user-1' },
    })
    db.getFormById = async () => ({
      id: 'form-1',
      versionId: 'version-1',
      slug: 'protected-form',
      title: 'Protected Form',
      status: 'PUBLISHED',
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [{ id: 'step-1', title: 'Protected Step', order: 1, config: {} }],
      fields: [
        {
          id: 'field-1',
          versionId: 'version-1',
          stepId: 'step-1',
          key: 'email',
          label: 'Email Address',
          type: 'EMAIL',
          required: true,
          order: 1,
          config: {
            dataClassification: 'pii',
            compliance: {
              protected: true,
              encryptAtRest: true,
              allowAnalytics: false,
            },
          },
        },
      ],
    }) as any
    db.updateSubmission = vi.fn().mockResolvedValue({
      id: 'sub-1',
      formId: 'form-1',
      userId: 'user-1',
      status: 'IN_PROGRESS',
      context: { userId: 'user-1' },
    })

    const app = createDfeApp({
      db: db as any,
      hipaa: {
        enabled: true,
        audit,
        valueProtector: createAesGcmFieldProtector({ secret: 'hono-test-secret' }),
      },
    })

    const response = await app.request('/dfe/submissions/sub-1/steps/step-1?userId=user-1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        values: { email: 'ada@example.com' },
        context: { userId: 'user-1' },
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.context.dfe.protectedFields.redacted).toBe(true)
    expect(db.updateSubmission).toHaveBeenCalledWith('sub-1', expect.objectContaining({
      context: expect.objectContaining({
        dfe: expect.objectContaining({
          protectedFields: expect.objectContaining({
            version: 1,
          }),
        }),
      }),
    }))
    expect(audit.getEntries()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: 'submission.write',
        outcome: 'success',
      }),
    ]))
  })
})
