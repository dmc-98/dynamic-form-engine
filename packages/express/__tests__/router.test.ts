import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServer } from 'node:net'
import express from 'express'
import request from 'supertest'
import {
  createAesGcmFieldProtector,
  createInMemoryAuditLogStore,
} from '@dmc-98/dfe-server'
import { createDfeRouter } from '../src/index'

// ─── Mock DatabaseAdapter ───────────────────────────────────────────────────

function createMockDb() {
  return {
    getFormBySlug: vi.fn(),
    getFormById: vi.fn(),
    listForms: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    createSubmission: vi.fn(),
    listSubmissions: vi.fn().mockResolvedValue([]),
    getSubmission: vi.fn(),
    updateSubmission: vi.fn(),
    executeApiContract: vi.fn(),
    trackAnalyticsEvent: vi.fn(),
    getAnalyticsSummary: vi.fn().mockResolvedValue({
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
    getActiveExperimentForForm: vi.fn(),
    fetchFieldOptions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  }
}

// ─── Helper to create Express app with router ───────────────────────────────

function createApp(db: ReturnType<typeof createMockDb>, opts: Record<string, any> = {}) {
  const app = express()
  app.use(express.json())
  app.use(createDfeRouter({ db, ...opts }))
  return app
}

async function detectListenSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()

    server.once('error', () => {
      resolve(false)
    })

    server.listen(0, '127.0.0.1', () => {
      server.close(() => resolve(true))
    })
  })
}

const describeIfCanListen = (await detectListenSupport()) ? describe : describe.skip

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('createDfeRouter', () => {
  let db: ReturnType<typeof createMockDb>

  beforeEach(() => {
    db = createMockDb()
    vi.clearAllMocks()
  })

  it('should return an Express Router', () => {
    const router = createDfeRouter({ db })
    expect(router).toBeDefined()
    expect(typeof router).toBe('function')
  })

  it('should register all expected routes', () => {
    const router = createDfeRouter({ db })
    const routes = router.stack
      .filter((l: any) => l.route)
      .map((l: any) => ({
        method: Object.keys(l.route.methods)[0],
        path: l.route.path,
      }))

    expect(routes).toEqual(
      expect.arrayContaining([
        { method: 'get', path: '/dfe/forms' },
        { method: 'get', path: '/dfe/forms/id/:id' },
        { method: 'get', path: '/dfe/forms/:slug' },
        { method: 'post', path: '/dfe/submissions' },
        { method: 'get', path: '/dfe/submissions' },
        { method: 'get', path: '/dfe/submissions/:id' },
        { method: 'post', path: '/dfe/submissions/:id/steps/:stepId' },
        { method: 'post', path: '/dfe/submissions/:id/complete' },
        { method: 'get', path: '/dfe/analytics' },
        { method: 'get', path: '/dfe/fields/:fieldId/options' },
      ])
    )
  })

  it('should use a custom prefix', () => {
    const router = createDfeRouter({ db, prefix: '/api/forms' })
    const paths = router.stack
      .filter((l: any) => l.route)
      .map((l: any) => l.route.path)

    expect(paths[0]).toMatch(/^\/api\/forms/)
  })

  describeIfCanListen('GET /dfe/forms', () => {
    it('should list forms with default page size', async () => {
      const app = createApp(db)
      await request(app).get('/dfe/forms').expect(200)

      expect(db.listForms).toHaveBeenCalledWith({
        cursor: null,
        pageSize: 20,
        search: undefined,
      }, { tenantId: undefined })
    })

    it('should clamp pageSize to maxPageSize', async () => {
      const app = createApp(db, { maxPageSize: 50 })
      await request(app).get('/dfe/forms?pageSize=999').expect(200)

      expect(db.listForms).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 50 }),
        { tenantId: undefined },
      )
    })

    it('should handle invalid pageSize gracefully', async () => {
      const app = createApp(db)
      await request(app).get('/dfe/forms?pageSize=abc').expect(200)

      expect(db.listForms).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 20 }),
        { tenantId: undefined },
      )
    })
  })

  describeIfCanListen('GET /dfe/forms/:slug', () => {
    it('should return 404 if form not found', async () => {
      db.getFormBySlug.mockResolvedValue(null)
      const app = createApp(db)
      await request(app).get('/dfe/forms/nonexistent').expect(404)
    })

    it('should return form data when found', async () => {
      const form = { id: '1', slug: 'test', title: 'Test Form' }
      db.getFormBySlug.mockResolvedValue(form)
      const app = createApp(db)

      const res = await request(app).get('/dfe/forms/test').expect(200)
      expect(res.body).toEqual(form)
    })
  })

  describeIfCanListen('GET /dfe/forms/id/:id', () => {
    it('should fetch a form by id', async () => {
      const form = { id: 'form-1', slug: 'test-form', title: 'Test Form' }
      db.getFormById.mockResolvedValue(form)
      const app = createApp(db)

      const res = await request(app).get('/dfe/forms/id/form-1').expect(200)
      expect(res.body).toEqual(form)
      expect(db.getFormById).toHaveBeenCalledWith('form-1', { tenantId: undefined })
    })
  })

  describeIfCanListen('POST /dfe/submissions', () => {
    it('should return 401 when unauthenticated', async () => {
      const app = createApp(db, { getUserId: () => null })

      await request(app)
        .post('/dfe/submissions')
        .send({ formId: 'f1', versionId: 'v1' })
        .expect(401)
    })

    it('should return 400 if formId is missing', async () => {
      const app = createApp(db, { getUserId: () => 'user1' })

      await request(app)
        .post('/dfe/submissions')
        .send({ versionId: 'v1' })
        .expect(400)
    })

    it('should return 400 if versionId is missing', async () => {
      const app = createApp(db, { getUserId: () => 'user1' })

      await request(app)
        .post('/dfe/submissions')
        .send({ formId: 'f1' })
        .expect(400)
    })

    it('should return 404 if form does not exist', async () => {
      db.getFormById.mockResolvedValue(null)
      const app = createApp(db, { getUserId: () => 'user1' })

      await request(app)
        .post('/dfe/submissions')
        .send({ formId: 'f1', versionId: 'v1' })
        .expect(404)
    })

    it('should create submission successfully', async () => {
      db.getFormById.mockResolvedValue({
        id: 'f1',
        versionId: 'v1',
        steps: [{ id: 'step-1', title: 'Step 1', order: 1 }],
      })
      const submission = { id: 'sub1', formId: 'f1', userId: 'user1', status: 'IN_PROGRESS' }
      db.createSubmission.mockResolvedValue(submission)

      const app = createApp(db, { getUserId: () => 'user1' })

      const res = await request(app)
        .post('/dfe/submissions')
        .send({ formId: 'f1', versionId: 'v1' })
        .expect(201)

      expect(res.body).toEqual(submission)
      expect(db.trackAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'form_started' }))
    })

    it('should allow anonymous in skipAuth mode', async () => {
      db.getFormById.mockResolvedValue({ id: 'f1', versionId: 'v1', steps: [] })
      db.createSubmission.mockResolvedValue({ id: 'sub1' })

      const app = createApp(db, { getUserId: () => null, skipAuth: true })

      await request(app)
        .post('/dfe/submissions')
        .send({ formId: 'f1', versionId: 'v1' })
        .expect(201)
    })

    it('should assign experiment variants deterministically when configured', async () => {
      db.getFormById.mockResolvedValue({
        id: 'f1',
        versionId: 'v1',
        steps: [{ id: 'step-1', title: 'Step 1', order: 1 }],
      })
      db.getActiveExperimentForForm.mockResolvedValue({
        id: 'exp-1',
        formId: 'f1',
        name: 'Hero copy',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        variants: [
          { id: 'var-a', experimentId: 'exp-1', key: 'control', label: 'Control', weight: 1 },
          { id: 'var-b', experimentId: 'exp-1', key: 'guided', label: 'Guided', weight: 1 },
        ],
      })
      db.createSubmission.mockImplementation(async (data: any) => ({ id: 'sub1', ...data, status: 'IN_PROGRESS' }))

      const app = createApp(db, {
        getUserId: () => 'user1',
        getTenantId: () => 'tenant-a',
      })

      const res = await request(app)
        .post('/dfe/submissions')
        .send({ formId: 'f1', versionId: 'v1' })
        .expect(201)

      expect(res.body.variantKey).toBeDefined()
      expect(db.trackAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'variant_assigned' }))
    })
  })

  describeIfCanListen('GET /dfe/submissions', () => {
    it('should list submissions for the active tenant', async () => {
      db.listSubmissions.mockResolvedValue([{ id: 'sub-1', formId: 'form-1', userId: 'user1', status: 'COMPLETED' }])
      const app = createApp(db, {
        getUserId: () => 'user1',
        getTenantId: () => 'tenant-a',
      })

      const res = await request(app).get('/dfe/submissions?formId=form-1').expect(200)

      expect(res.body).toHaveLength(1)
      expect(db.listSubmissions).toHaveBeenCalledWith({
        tenantId: 'tenant-a',
        formId: 'form-1',
        status: undefined,
        limit: 20,
      })
    })
  })

  describeIfCanListen('GET /dfe/submissions/:id', () => {
    it('should return 401 when unauthenticated', async () => {
      const app = createApp(db, { getUserId: () => null })
      await request(app).get('/dfe/submissions/sub1').expect(401)
    })

    it('should return 404 when submission not found', async () => {
      db.getSubmission.mockResolvedValue(null)
      const app = createApp(db, { getUserId: () => 'user1' })
      await request(app).get('/dfe/submissions/sub1').expect(404)
    })

    it('should return 403 if user does not own submission', async () => {
      db.getSubmission.mockResolvedValue({
        id: 'sub1',
        userId: 'other-user',
        status: 'IN_PROGRESS',
      })

      const app = createApp(db, { getUserId: () => 'user1' })
      await request(app).get('/dfe/submissions/sub1').expect(403)
    })

    it('should return submission for owner', async () => {
      const submission = { id: 'sub1', userId: 'user1', status: 'IN_PROGRESS' }
      db.getSubmission.mockResolvedValue(submission)

      const app = createApp(db, { getUserId: () => 'user1' })
      const res = await request(app).get('/dfe/submissions/sub1').expect(200)
      expect(res.body).toEqual(submission)
    })
  })

  describeIfCanListen('POST /dfe/submissions/:id/complete', () => {
    it('should return 409 if submission already completed', async () => {
      db.getSubmission.mockResolvedValue({
        id: 'sub1',
        userId: 'user1',
        status: 'COMPLETED',
        context: {},
      })

      const app = createApp(db, { getUserId: () => 'user1' })
      await request(app).post('/dfe/submissions/sub1/complete').expect(409)
    })
  })

  describeIfCanListen('POST /dfe/submissions/:id/steps/:stepId', () => {
    it('stores protected field values in encrypted form and records audit events', async () => {
      const audit = createInMemoryAuditLogStore()
      db.getSubmission.mockResolvedValue({
        id: 'sub1',
        formId: 'form-1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        context: { userId: 'user1' },
      })
      db.getFormById.mockResolvedValue({
        id: 'form-1',
        versionId: 'version-1',
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
      })

      const app = createApp(db, {
        getUserId: () => 'user1',
        hipaa: {
          enabled: true,
          audit,
          valueProtector: createAesGcmFieldProtector({ secret: 'router-test-secret' }),
        },
      })

      const res = await request(app)
        .post('/dfe/submissions/sub1/steps/step-1')
        .send({
          values: {
            email: 'ada@example.com',
          },
          context: { userId: 'user1' },
        })
        .expect(200)

      expect(db.updateSubmission).toHaveBeenCalledWith('sub1', expect.objectContaining({
        currentStepId: 'step-1',
        context: expect.objectContaining({
          dfe: expect.objectContaining({
            protectedFields: expect.objectContaining({
              version: 1,
            }),
          }),
        }),
      }))
      expect((res.body.context.dfe.protectedFields as any).redacted).toBe(true)
      expect(audit.getEntries()).toEqual(expect.arrayContaining([
        expect.objectContaining({
          action: 'submission.write',
          outcome: 'success',
        }),
      ]))
    })

    it('drops protected field analytics when HIPAA mode blocks field-level reporting', async () => {
      const audit = createInMemoryAuditLogStore()
      db.getSubmission.mockResolvedValue({
        id: 'sub1',
        formId: 'form-1',
        userId: 'user1',
        status: 'IN_PROGRESS',
        context: { userId: 'user1' },
      })
      db.getFormById.mockResolvedValue({
        id: 'form-1',
        versionId: 'version-1',
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
      })

      const app = createApp(db, {
        getUserId: () => 'user1',
        hipaa: {
          enabled: true,
          audit,
          valueProtector: createAesGcmFieldProtector({ secret: 'router-test-secret' }),
        },
      })

      await request(app)
        .post('/dfe/submissions/sub1/steps/step-1')
        .send({
          values: {},
          context: { userId: 'user1' },
        })
        .expect(422)

      expect(db.trackAnalyticsEvent).not.toHaveBeenCalledWith(expect.objectContaining({
        event: 'field_error',
      }))
      expect(audit.getEntries()).toEqual(expect.arrayContaining([
        expect.objectContaining({
          action: 'submission.write',
          outcome: 'failure',
        }),
      ]))
    })
  })

  describeIfCanListen('GET /dfe/analytics', () => {
    it('should return analytics summaries for authenticated users', async () => {
      db.getAnalyticsSummary.mockResolvedValue({
        totalForms: 1,
        totalSubmissions: 2,
        totalStarts: 2,
        totalCompletions: 1,
        completionRate: 0.5,
        abandonmentRate: 0,
        averageCompletionTimeMs: 1234,
        stepFunnel: [],
        fieldErrors: [],
        recentActivity: [],
        variantComparison: [],
      })
      const app = createApp(db, {
        getUserId: () => 'user1',
        getTenantId: () => 'tenant-a',
      })

      const res = await request(app).get('/dfe/analytics?formId=form-1').expect(200)

      expect(res.body.totalForms).toBe(1)
      expect(db.getAnalyticsSummary).toHaveBeenCalledWith({
        tenantId: 'tenant-a',
        formId: 'form-1',
        from: undefined,
        to: undefined,
      })
    })
  })

  describeIfCanListen('GET /dfe/fields/:fieldId/options', () => {
    it('should only pass allowed filter keys', async () => {
      const app = createApp(db, { allowedOptionFilterKeys: ['departmentId'] })

      await request(app)
        .get('/dfe/fields/f1/options?departmentId=dept1&maliciousKey=DROP_TABLE&pageSize=10')
        .expect(200)

      const call = db.fetchFieldOptions.mock.calls[0]
      expect(call[1].filters).toEqual({ departmentId: 'dept1' })
    })

    it('should reject filter values with injection characters', async () => {
      const app = createApp(db, { allowedOptionFilterKeys: ['category'] })

      await request(app)
        .get('/dfe/fields/f1/options?category=%7B%22%24gt%22%3A%22%22%7D')
        .expect(200)

      const call = db.fetchFieldOptions.mock.calls[0]
      expect(call[1].filters).toBeUndefined()
    })
  })
})
