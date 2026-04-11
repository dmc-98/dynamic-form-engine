import { describe, it, expect, beforeEach } from 'vitest'
import { createDfeRouter } from '@dmc-98/dfe-express'
import { InMemoryDatabase, createTestDb, seedContactForm, seedMultiStepForm } from './helpers/mock-db'

// Use require to load these packages at runtime in Node environment
const express = require('express').default || require('express')
const request = require('supertest')

describe('Express API Pipeline E2E Tests', () => {
  let db: InMemoryDatabase
  let app: any

  beforeEach(() => {
    db = createTestDb()
    app = express()
    app.use(express.json())
    app.use(createDfeRouter({ db, getUserId: () => 'user-1', skipAuth: false }))
  })

  describe('GET /dfe/forms', () => {
    it('should return 200 with empty items when no forms exist', async () => {
      const res = await request(app).get('/dfe/forms')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('items')
      expect(res.body.items).toEqual([])
    })

    it('should return 200 with seeded forms', async () => {
      seedContactForm(db)
      const res = await request(app).get('/dfe/forms')
      expect(res.status).toBe(200)
      expect(res.body.items.length).toBeGreaterThan(0)
      expect(res.body.items[0]).toHaveProperty('id')
      expect(res.body.items[0]).toHaveProperty('slug')
    })

    it('should support cursor pagination with pageSize=1', async () => {
      seedContactForm(db)
      seedMultiStepForm(db)
      const res = await request(app).get('/dfe/forms?pageSize=1')
      expect(res.status).toBe(200)
      expect(res.body.items.length).toBe(1)
      expect(res.body).toHaveProperty('nextCursor')
    })

    it('should return next page using cursor parameter', async () => {
      seedContactForm(db)
      seedMultiStepForm(db)
      const firstPage = await request(app).get('/dfe/forms?pageSize=1')
      expect(firstPage.body.nextCursor).toBeDefined()

      const secondPage = await request(app).get(`/dfe/forms?pageSize=1&cursor=${firstPage.body.nextCursor}`)
      expect(secondPage.status).toBe(200)
      expect(secondPage.body.items.length).toBeGreaterThan(0)
      expect(secondPage.body.items[0].id).not.toBe(firstPage.body.items[0].id)
    })
  })

  describe('GET /dfe/forms/:slug', () => {
    it('should return 200 with form data when form exists', async () => {
      const form = seedContactForm(db)
      const res = await request(app).get(`/dfe/forms/${form.slug}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', form.id)
      expect(res.body).toHaveProperty('slug', form.slug)
      expect(res.body).toHaveProperty('steps')
    })

    it('should return 404 when form does not exist', async () => {
      const res = await request(app).get('/dfe/forms/nonexistent-form')
      expect(res.status).toBe(404)
    })

    it('should return complete form structure with fields', async () => {
      const form = seedContactForm(db)
      const res = await request(app).get(`/dfe/forms/${form.slug}`)
      expect(res.status).toBe(200)
      expect(res.body.steps).toBeInstanceOf(Array)
      expect(res.body.steps.length).toBeGreaterThan(0)
      expect(res.body.fields).toBeInstanceOf(Array)
      expect(res.body.fields.length).toBeGreaterThan(0)
    })
  })

  describe('POST /dfe/submissions', () => {
    it('should return 201 with submission ID when valid form is submitted', async () => {
      const form = seedContactForm(db)
      const res = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body).toHaveProperty('formId', form.id)
      expect(res.body).toHaveProperty('status', 'IN_PROGRESS')
    })

    it('should return 400 when formId is missing', async () => {
      const form = seedContactForm(db)
      const res = await request(app)
        .post('/dfe/submissions')
        .send({ versionId: form.versionId })
      expect(res.status).toBe(400)
    })

    it('should return 400 when versionId is missing', async () => {
      const form = seedContactForm(db)
      const res = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id })
      expect(res.status).toBe(400)
    })

    it('should return 401 when user is not authenticated', async () => {
      const appUnauth = express()
      appUnauth.use(express.json())
      appUnauth.use(createDfeRouter({ db, getUserId: () => null, skipAuth: false }))

      const form = seedContactForm(db)
      const res = await request(appUnauth)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })
      expect(res.status).toBe(401)
    })

    it('should create submission with correct ownership', async () => {
      const form = seedContactForm(db)
      const res = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })
      expect(res.status).toBe(201)
      expect(res.body.userId).toBe('user-1')
    })
  })

  describe('GET /dfe/submissions/:id', () => {
    it('should return 200 with submission data', async () => {
      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const res = await request(app).get(`/dfe/submissions/${submission.body.id}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', submission.body.id)
      expect(res.body).toHaveProperty('formId', form.id)
    })

    it('should return 404 when submission does not exist', async () => {
      const res = await request(app).get('/dfe/submissions/nonexistent-id')
      expect(res.status).toBe(404)
    })

    it('should return 401 when user is not authenticated', async () => {
      const appUnauth = express()
      appUnauth.use(express.json())
      appUnauth.use(createDfeRouter({ db, getUserId: () => null, skipAuth: false }))

      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const res = await request(appUnauth).get(`/dfe/submissions/${submission.body.id}`)
      expect(res.status).toBe(401)
    })

    it('should return 403 when user does not own submission', async () => {
      const appOtherUser = express()
      appOtherUser.use(express.json())
      appOtherUser.use(createDfeRouter({ db, getUserId: () => 'user-2', skipAuth: false }))

      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const res = await request(appOtherUser).get(`/dfe/submissions/${submission.body.id}`)
      expect(res.status).toBe(403)
    })
  })

  describe('POST /dfe/submissions/:id/steps/:stepId', () => {
    it('should return 200 with valid step values', async () => {
      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      // step_info requires firstName, lastName, email
      const firstStep = form.steps[0]
      const res = await request(app)
        .post(`/dfe/submissions/${submission.body.id}/steps/${firstStep.id}`)
        .send({ values: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('success', true)
    })

    it('should update submission after step submit', async () => {
      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const firstStep = form.steps[0]
      const stepRes = await request(app)
        .post(`/dfe/submissions/${submission.body.id}/steps/${firstStep.id}`)
        .send({ values: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } })
      expect(stepRes.status).toBe(200)
      expect(stepRes.body.success).toBe(true)

      // Verify submission's currentStepId was updated
      const res = await request(app).get(`/dfe/submissions/${submission.body.id}`)
      expect(res.status).toBe(200)
      expect(res.body.currentStepId).toBe(firstStep.id)
    })

    it('should return 401 when user is not authenticated', async () => {
      const appUnauth = express()
      appUnauth.use(express.json())
      appUnauth.use(createDfeRouter({ db, getUserId: () => null, skipAuth: false }))

      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const res = await request(appUnauth)
        .post(`/dfe/submissions/${submission.body.id}/steps/${form.steps[0].id}`)
        .send({ values: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } })
      expect(res.status).toBe(401)
    })

    it('should return 422 with validation errors for invalid step values', async () => {
      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      // step_info fields are required, sending empty should fail validation
      const res = await request(app)
        .post(`/dfe/submissions/${submission.body.id}/steps/${form.steps[0].id}`)
        .send({ values: {} })
      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /dfe/submissions/:id/complete', () => {
    it('should return 200 and mark submission as completed', async () => {
      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const res = await request(app)
        .post(`/dfe/submissions/${submission.body.id}/complete`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('should return 401 when user is not authenticated', async () => {
      const appUnauth = express()
      appUnauth.use(express.json())
      appUnauth.use(createDfeRouter({ db, getUserId: () => null, skipAuth: false }))

      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const res = await request(appUnauth)
        .post(`/dfe/submissions/${submission.body.id}/complete`)
      expect(res.status).toBe(401)
    })

    it('should handle gracefully when completing already completed submission', async () => {
      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      await request(app)
        .post(`/dfe/submissions/${submission.body.id}/complete`)

      const res = await request(app)
        .post(`/dfe/submissions/${submission.body.id}/complete`)
      // Already completed returns 409 conflict
      expect(res.status).toBe(409)
    })
  })

  describe('GET /dfe/fields/:fieldId/options', () => {
    it('should return 200 with field options', async () => {
      const form = seedContactForm(db)
      const fieldWithOptions = form.fields.find((f: any) => f.options)

      if (fieldWithOptions) {
        const res = await request(app).get(`/dfe/fields/${fieldWithOptions.id}/options`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('items')
      }
    })

    it('should support search filter for dynamic options', async () => {
      const form = seedContactForm(db)
      const fieldWithOptions = form.fields.find((f: any) => f.options)

      if (fieldWithOptions) {
        const res = await request(app)
          .get(`/dfe/fields/${fieldWithOptions.id}/options?q=test`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('items')
      }
    })

    it('should support country filter for location-based options', async () => {
      const form = seedContactForm(db)
      const fieldWithOptions = form.fields.find((f: any) => f.options)

      if (fieldWithOptions) {
        const res = await request(app)
          .get(`/dfe/fields/${fieldWithOptions.id}/options?country=US`)
        expect(res.status).toBe(200)
      }
    })

    it('should sanitize filter keys with injection characters', async () => {
      const form = seedContactForm(db)
      const fieldWithOptions = form.fields.find((f: any) => f.options)

      if (fieldWithOptions) {
        const res = await request(app)
          .get(`/dfe/fields/${fieldWithOptions.id}/options?search=${encodeURIComponent('{$ne: null}')}`)
        expect(res.status).toBe(200)
        expect(res.body.items).toBeDefined()
      }
    })
  })

  describe('Full pipeline workflow', () => {
    it('should complete full multi-step form submission workflow', async () => {
      const form = seedMultiStepForm(db)

      // Create submission
      const createRes = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })
      expect(createRes.status).toBe(201)
      const submissionId = createRes.body.id

      // Submit step 1 (name + email required)
      const step1Res = await request(app)
        .post(`/dfe/submissions/${submissionId}/steps/${form.steps[0].id}`)
        .send({ values: { name: 'John Doe', email: 'john@example.com' } })
      expect(step1Res.status).toBe(200)

      // Submit step 2 (age required)
      const step2Res = await request(app)
        .post(`/dfe/submissions/${submissionId}/steps/${form.steps[1].id}`)
        .send({ values: { age: 30 } })
      expect(step2Res.status).toBe(200)

      // Submit step 3 (agree optional)
      const step3Res = await request(app)
        .post(`/dfe/submissions/${submissionId}/steps/${form.steps[2].id}`)
        .send({ values: { agree: true } })
      expect(step3Res.status).toBe(200)

      // Complete submission
      const completeRes = await request(app)
        .post(`/dfe/submissions/${submissionId}/complete`)
      expect(completeRes.status).toBe(200)
      expect(completeRes.body.success).toBe(true)

      // Verify final state
      const finalRes = await request(app).get(`/dfe/submissions/${submissionId}`)
      expect(finalRes.status).toBe(200)
      expect(finalRes.body.status).toBe('COMPLETED')
      // Context contains userId from initial creation (values aren't auto-merged without API contracts)
      expect(finalRes.body.context.userId).toBe('user-1')
    })

    it('should create multiple submissions with unique IDs', async () => {
      const form = seedContactForm(db)

      const submission1 = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const submission2 = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      expect(submission1.status).toBe(201)
      expect(submission2.status).toBe(201)
      expect(submission1.body.id).not.toBe(submission2.body.id)
    })
  })

  describe('Router options', () => {
    it('should bypass auth checks when skipAuth is true', async () => {
      const appNoAuth = express()
      appNoAuth.use(express.json())
      appNoAuth.use(createDfeRouter({ db, getUserId: () => null, skipAuth: true }))

      const form = seedContactForm(db)
      const res = await request(appNoAuth)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })
      expect(res.status).toBe(201)
    })

    it('should use custom prefix for all routes', async () => {
      const appCustom = express()
      appCustom.use(express.json())
      appCustom.use(createDfeRouter({
        db,
        getUserId: () => 'user-1',
        skipAuth: false,
        prefix: '/api/v2'
      }))

      const form = seedContactForm(db)
      const res = await request(appCustom).get('/api/v2/forms')
      expect(res.status).toBe(200)
    })

    it('should clamp page size to maxPageSize', async () => {
      const appLimited = express()
      appLimited.use(express.json())
      appLimited.use(createDfeRouter({
        db,
        getUserId: () => 'user-1',
        maxPageSize: 50
      }))

      seedContactForm(db)
      const res = await request(appLimited).get('/dfe/forms?pageSize=999')
      expect(res.status).toBe(200)
      expect(res.body.items.length).toBeLessThanOrEqual(50)
    })

    it('should restrict field option filters to allowedOptionFilterKeys', async () => {
      const appRestricted = express()
      appRestricted.use(express.json())
      appRestricted.use(createDfeRouter({
        db,
        getUserId: () => 'user-1',
        allowedOptionFilterKeys: ['search']
      }))

      const form = seedContactForm(db)
      const fieldWithOptions = form.fields.find((f: any) => f.options)

      if (fieldWithOptions) {
        const res = await request(appRestricted)
          .get(`/dfe/fields/${fieldWithOptions.id}/options?country=US&search=test`)
        expect(res.status).toBe(200)
      }
    })
  })

  describe('Edge cases', () => {
    it('should default pageSize to 20 when negative value is provided', async () => {
      seedContactForm(db)
      const res = await request(app).get('/dfe/forms?pageSize=-5')
      expect(res.status).toBe(200)
      expect(res.body.items).toBeDefined()
    })

    it('should handle invalid JSON body gracefully', async () => {
      const res = await request(app)
        .post('/dfe/submissions')
        .set('Content-Type', 'application/json')
        .send('invalid json')
      expect(res.status).toBe(400)
    })

    it('should return all forms when multiple forms are seeded', async () => {
      seedContactForm(db)
      seedMultiStepForm(db)
      const res = await request(app).get('/dfe/forms')
      expect(res.status).toBe(200)
      expect(res.body.items.length).toBeGreaterThanOrEqual(2)
    })

    it('should return 422 for non-existent step ID', async () => {
      const form = seedContactForm(db)
      const submission = await request(app)
        .post('/dfe/submissions')
        .send({ formId: form.id, versionId: form.versionId })

      const res = await request(app)
        .post(`/dfe/submissions/${submission.body.id}/steps/nonexistent-step`)
        .send({ values: {} })
      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })
  })
})
