import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DrizzleDatabaseAdapter, type DrizzleLike } from '../src/adapter'

// ─── Mock Drizzle Client ────────────────────────────────────────────────────

function createChainableMock(resolvedValue: any = []) {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    then: undefined, // Make it thenable for await
  }
  // Make the chain awaitable
  chain.then = (resolve: any) => Promise.resolve(resolvedValue).then(resolve)
  return chain
}

function createMockDb() {
  const db: any = {
    select: vi.fn(() => createChainableMock()),
    insert: vi.fn(() => createChainableMock()),
    update: vi.fn(() => createChainableMock()),
    delete: vi.fn(() => createChainableMock()),
    query: {},
    transaction: vi.fn((fn: any) => fn(db)),
  }
  return db as DrizzleLike
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('DrizzleDatabaseAdapter', () => {
  let db: ReturnType<typeof createMockDb>
  let adapter: DrizzleDatabaseAdapter

  beforeEach(() => {
    db = createMockDb()
    adapter = new DrizzleDatabaseAdapter(db)
  })

  it('should create an adapter instance', () => {
    expect(adapter).toBeInstanceOf(DrizzleDatabaseAdapter)
  })

  describe('getFormBySlug', () => {
    it('should return null when no form matches', async () => {
      // Override the select chain to return empty
      const chain = createChainableMock([])
      ;(db.select as any).mockReturnValue(chain)

      const result = await adapter.getFormBySlug('nonexistent')
      expect(result).toBeNull()
    })

    it('should load a published form version with steps and fields', async () => {
      ;(db.select as any)
        .mockReturnValueOnce(createChainableMock([
          {
            id: 'form-1',
            tenantId: null,
            slug: 'employee-onboarding',
            title: 'Employee Onboarding',
            description: 'Collect onboarding details',
            createdAt: new Date('2026-03-13T09:00:00.000Z'),
            updatedAt: new Date('2026-03-13T09:05:00.000Z'),
          },
        ]))
        .mockReturnValueOnce(createChainableMock([
          {
            id: 'version-1',
            formId: 'form-1',
            version: 3,
            status: 'PUBLISHED',
            createdAt: new Date('2026-03-13T09:01:00.000Z'),
          },
        ]))
        .mockReturnValueOnce(createChainableMock([
          {
            id: 'step-1',
            versionId: 'version-1',
            title: 'Profile',
            description: 'About you',
            order: 1,
            conditions: null,
            config: { layout: 'single-column' },
          },
        ]))
        .mockReturnValueOnce(createChainableMock([
          {
            id: 'field-1',
            versionId: 'version-1',
            stepId: 'step-1',
            sectionId: null,
            parentFieldId: null,
            key: 'fullName',
            label: 'Full name',
            description: null,
            type: 'SHORT_TEXT',
            required: true,
            order: 1,
            config: { placeholder: 'Ada Lovelace' },
            conditions: null,
          },
        ]))

      const result = await adapter.getFormBySlug('employee-onboarding', { tenantId: null })

      expect(result).toMatchObject({
        id: 'form-1',
        slug: 'employee-onboarding',
        versionId: 'version-1',
      })
      expect(result?.steps[0].title).toBe('Profile')
      expect(result?.fields[0].key).toBe('fullName')
    })
  })

  describe('getFormById', () => {
    it('should return null when no form matches', async () => {
      const chain = createChainableMock([])
      ;(db.select as any).mockReturnValue(chain)

      const result = await adapter.getFormById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('listForms', () => {
    it('should return paginated results', async () => {
      const forms = [
        { id: '1', slug: 'form-1', title: 'Form 1', createdAt: new Date(), updatedAt: new Date() },
      ]
      const chain = createChainableMock(forms)
      ;(db.select as any).mockReturnValue(chain)

      const result = await adapter.listForms({ pageSize: 20, cursor: null })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].slug).toBe('form-1')
    })

    it('should apply search conditions and next cursor pagination', async () => {
      const forms = [
        { id: '1', tenantId: 'tenant-a', slug: 'form-1', title: 'Form 1', description: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', tenantId: 'tenant-a', slug: 'form-2', title: 'Form 2', description: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', tenantId: 'tenant-a', slug: 'form-3', title: 'Form 3', description: null, createdAt: new Date(), updatedAt: new Date() },
      ]
      const chain = createChainableMock(forms)
      ;(db.select as any).mockReturnValue(chain)

      const result = await adapter.listForms(
        { pageSize: 2, cursor: null, search: 'Form' },
        { tenantId: 'tenant-a' },
      )

      expect(chain.where).toHaveBeenCalled()
      expect(result.items).toHaveLength(2)
      expect(result.nextCursor).toBe('2')
    })
  })

  describe('createSubmission', () => {
    it('should insert a submission and return it', async () => {
      const submission = {
        id: 'sub1', formId: 'f1', versionId: 'v1',
        userId: 'u1', status: 'IN_PROGRESS',
      }
      const chain = createChainableMock([submission])
      ;(db.insert as any).mockReturnValue(chain)

      const result = await adapter.createSubmission({
        formId: 'f1',
        versionId: 'v1',
        userId: 'u1',
        context: { userId: 'u1' },
      })

      expect(result).toEqual(submission)
    })
  })

  describe('getSubmission', () => {
    it('should return null when not found', async () => {
      const chain = createChainableMock([])
      ;(db.select as any).mockReturnValue(chain)

      const result = await adapter.getSubmission('nonexistent')
      expect(result).toBeNull()
    })

    it('should return submission when found', async () => {
      const sub = { id: 'sub1', formId: 'f1', userId: 'u1' }
      const chain = createChainableMock([sub])
      ;(db.select as any).mockReturnValue(chain)

      const result = await adapter.getSubmission('sub1')
      expect(result).toEqual(sub)
    })
  })

  describe('updateSubmission', () => {
    it('should update and return the submission', async () => {
      const updated = { id: 'sub1', status: 'COMPLETED' }
      const chain = createChainableMock([updated])
      ;(db.update as any).mockReturnValue(chain)

      const result = await adapter.updateSubmission('sub1', { status: 'COMPLETED' })
      expect(result).toEqual(updated)
    })
  })

  describe('listSubmissions', () => {
    it('should apply tenant, form, and status filters', async () => {
      const chain = createChainableMock([
        { id: 'sub-1', formId: 'form-1', status: 'IN_PROGRESS' },
      ])
      ;(db.select as any).mockReturnValue(chain)

      const result = await adapter.listSubmissions!({
        tenantId: null,
        formId: 'form-1',
        status: 'IN_PROGRESS',
        limit: 25,
      })

      expect(chain.where).toHaveBeenCalled()
      expect(chain.limit).toHaveBeenCalledWith(25)
      expect(result).toEqual([{ id: 'sub-1', formId: 'form-1', status: 'IN_PROGRESS' }])
    })
  })

  describe('executeApiContract', () => {
    it('should use in-memory store by default', async () => {
      const result = await adapter.executeApiContract(
        { method: 'POST', resourceName: 'users', endpoint: '/api/users', fieldMapping: {} } as any,
        { name: 'Alice' }
      )

      expect(result).toHaveProperty('id')
      expect(result.name).toBe('Alice')
    })

    it('should use custom executor when provided', async () => {
      const customExecute = vi.fn().mockResolvedValue({ id: 'custom', name: 'Bob' })
      const customAdapter = new DrizzleDatabaseAdapter(db, {
        executeApiContract: customExecute,
      })

      const result = await customAdapter.executeApiContract(
        { method: 'POST', resourceName: 'users', endpoint: '/api/users', fieldMapping: {} } as any,
        { name: 'Bob' }
      )

      expect(customExecute).toHaveBeenCalled()
      expect(result.name).toBe('Bob')
    })

    it('should store records in separate resource maps', async () => {
      await adapter.executeApiContract(
        { method: 'POST', resourceName: 'users', endpoint: '/api/users', fieldMapping: {} } as any,
        { name: 'Alice' }
      )
      await adapter.executeApiContract(
        { method: 'POST', resourceName: 'posts', endpoint: '/api/posts', fieldMapping: {} } as any,
        { title: 'Hello' }
      )

      // Each resource should have its own record
      const user = await adapter.executeApiContract(
        { method: 'PUT', resourceName: 'users', endpoint: '/api/users', fieldMapping: {} } as any,
        { id: 'override-id', name: 'Bob' }
      )
      expect(user.name).toBe('Bob')
    })
  })

  describe('fetchFieldOptions', () => {
    it('should filter options by search, filters, and cursor', async () => {
      const rows = [
        { id: 'o1', fieldId: 'f1', label: 'Platform Engineering', value: 'platform', meta: { department: 'eng' }, order: 1 },
        { id: 'o2', fieldId: 'f1', label: 'Infrastructure', value: 'infrastructure', meta: { department: 'eng' }, order: 2 },
        { id: 'o3', fieldId: 'f1', label: 'Brand Studio', value: 'brand-studio', meta: { department: 'design' }, order: 3 },
      ]
      const chain = createChainableMock(rows)
      ;(db.select as any).mockReturnValue(chain)

      const filtered = await adapter.fetchFieldOptions('f1', {
        pageSize: 10,
        cursor: null,
        search: 'ing',
        filters: { department: 'eng' },
      })

      expect(filtered.items.map(option => option.value)).toEqual(['platform'])

      const paged = await adapter.fetchFieldOptions('f1', {
        pageSize: 1,
        cursor: null,
        filters: { department: 'eng' },
      })

      expect(paged.items.map(option => option.value)).toEqual(['platform'])
      expect(paged.nextCursor).toBe('o1')

      const nextPage = await adapter.fetchFieldOptions('f1', {
        pageSize: 1,
        cursor: paged.nextCursor,
        filters: { department: 'eng' },
      })

      expect(nextPage.items.map(option => option.value)).toEqual(['infrastructure'])
    })

    it('should drop options with missing metadata when filters are provided', async () => {
      const rows = [
        { id: 'o1', fieldId: 'f1', label: 'No metadata', value: 'none', meta: null, order: 1 },
        { id: 'o2', fieldId: 'f1', label: 'People Ops', value: 'people', meta: { department: 'hr' }, order: 2 },
      ]
      const chain = createChainableMock(rows)
      ;(db.select as any).mockReturnValue(chain)

      const result = await adapter.fetchFieldOptions('f1', {
        pageSize: 10,
        cursor: null,
        filters: { department: 'eng' },
      })

      expect(result.items).toEqual([])
      expect(result.nextCursor).toBeNull()
    })
  })

  describe('analytics and experiments', () => {
    it('should persist analytics events', async () => {
      const chain = createChainableMock([])
      ;(db.insert as any).mockReturnValue(chain)

      await adapter.trackAnalyticsEvent!({
        tenantId: 'tenant-a',
        formId: 'form-1',
        submissionId: 'sub-1',
        event: 'form_started',
        timestamp: 1700000000000,
      })

      expect(db.insert).toHaveBeenCalled()
    })

    it('should map analytics events and apply analytics filters', async () => {
      const chain = createChainableMock([
        {
          tenantId: null,
          formId: 'form-1',
          submissionId: 'sub-1',
          event: 'variant_assigned',
          stepId: null,
          fieldKey: null,
          experimentId: 'exp-1',
          variantId: 'var-1',
          variantKey: 'guided',
          metadata: { variantLabel: 'Guided' },
          occurredAt: 'not-a-date',
        },
      ])
      ;(db.select as any).mockReturnValue(chain)

      const events = await adapter.listAnalyticsEvents!({
        tenantId: null,
        formId: 'form-1',
        from: 1700000000000,
        to: 1700000300000,
      })

      expect(chain.where).toHaveBeenCalled()
      expect(events[0]).toMatchObject({
        formId: 'form-1',
        variantKey: 'guided',
      })
      expect(typeof events[0].timestamp).toBe('number')
    })

    it('should derive analytics summaries from the targeted form when formId is provided', async () => {
      ;(db.select as any).mockReturnValue(createChainableMock([
        {
          tenantId: 'tenant-a',
          formId: 'form-1',
          submissionId: 'sub-1',
          event: 'form_started',
          occurredAt: new Date('2026-03-13T10:00:00.000Z'),
        },
      ]))

      const summary = await adapter.getAnalyticsSummary!({
        tenantId: 'tenant-a',
        formId: 'form-1',
      })

      expect(summary.totalForms).toBe(1)
      expect(summary.totalStarts).toBe(1)
    })

    it('should return active experiments with variants', async () => {
      ;(db.select as any)
        .mockReturnValueOnce(createChainableMock([
          {
            id: 'exp-1',
            formId: 'form-1',
            tenantId: 'tenant-a',
            name: 'Hero copy',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]))
        .mockReturnValueOnce(createChainableMock([
          { id: 'var-1', experimentId: 'exp-1', key: 'control', label: 'Control', weight: 1, overrides: null },
        ]))

      const experiment = await adapter.getActiveExperimentForForm!('form-1', { tenantId: 'tenant-a' })

      expect(experiment?.id).toBe('exp-1')
      expect(experiment?.variants[0].key).toBe('control')
    })

    it('should return null when no experiment matches the query', async () => {
      ;(db.select as any).mockReturnValue(createChainableMock([]))

      const experiment = await adapter.getActiveExperimentForForm!('form-1', { tenantId: null })

      expect(experiment).toBeNull()
    })
  })
})
