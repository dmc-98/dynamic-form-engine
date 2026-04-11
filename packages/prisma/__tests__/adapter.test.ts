import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaDatabaseAdapter, InMemoryModelStore } from '../src/adapter'

// ─── Mock Prisma Client ─────────────────────────────────────────────────────

function createMockPrisma() {
  return {
    dfeForm: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    dfeFormVersion: {},
    dfeStep: {},
    dfeField: {},
    dfeFieldOption: {
      findMany: vi.fn(),
    },
    dfeSubmission: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dfeAnalyticsEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    dfeExperiment: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn({
      dfeForm: { findFirst: vi.fn() },
      dfeSubmission: { create: vi.fn(), update: vi.fn() },
    })),
  }
}

// ─── InMemoryModelStore Tests ───────────────────────────────────────────────

describe('InMemoryModelStore', () => {
  let store: InMemoryModelStore

  beforeEach(() => {
    store = new InMemoryModelStore()
  })

  it('should store and retrieve records', () => {
    store.set('users', '1', { id: '1', name: 'Alice' })
    const record = store.get('users', '1')
    expect(record).toEqual({ id: '1', name: 'Alice' })
  })

  it('should return undefined for non-existent records', () => {
    expect(store.get('users', 'nonexistent')).toBeUndefined()
  })

  it('should return undefined for non-existent resources', () => {
    expect(store.get('nonexistent', '1')).toBeUndefined()
  })

  it('should get all records for a resource', () => {
    store.set('users', '1', { id: '1', name: 'Alice' })
    store.set('users', '2', { id: '2', name: 'Bob' })
    const all = store.getAll('users')
    expect(all).toHaveLength(2)
  })

  it('should return empty array for non-existent resource', () => {
    expect(store.getAll('nonexistent')).toEqual([])
  })

  it('should clear all data', () => {
    store.set('users', '1', { id: '1' })
    store.set('posts', '1', { id: '1' })
    store.clear()
    expect(store.getAll('users')).toEqual([])
    expect(store.getAll('posts')).toEqual([])
  })

  it('should overwrite existing records', () => {
    store.set('users', '1', { id: '1', name: 'Alice' })
    store.set('users', '1', { id: '1', name: 'Bob' })
    expect(store.get('users', '1')).toEqual({ id: '1', name: 'Bob' })
  })
})

// ─── PrismaDatabaseAdapter Tests ────────────────────────────────────────────

describe('PrismaDatabaseAdapter', () => {
  let prisma: ReturnType<typeof createMockPrisma>
  let adapter: PrismaDatabaseAdapter

  beforeEach(() => {
    prisma = createMockPrisma()
    adapter = new PrismaDatabaseAdapter(prisma)
  })

  describe('getFormBySlug', () => {
    it('should return null when form not found', async () => {
      prisma.dfeForm.findFirst.mockResolvedValue(null)
      const result = await adapter.getFormBySlug('nonexistent')
      expect(result).toBeNull()
    })

    it('should return null when form has no published versions', async () => {
      prisma.dfeForm.findFirst.mockResolvedValue({
        id: '1',
        slug: 'test',
        title: 'Test',
        versions: [],
      })
      const result = await adapter.getFormBySlug('test')
      expect(result).toBeNull()
    })

    it('should map form with published version correctly', async () => {
      prisma.dfeForm.findFirst.mockResolvedValue({
        id: 'f1',
        tenantId: 'tenant-a',
        slug: 'test-form',
        title: 'Test Form',
        description: 'A test form',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        versions: [{
          id: 'v1',
          status: 'PUBLISHED',
          steps: [{
            id: 's1',
            versionId: 'v1',
            title: 'Step 1',
            description: null,
            order: 1,
            conditions: null,
            config: null,
          }],
          fields: [{
            id: 'field1',
            versionId: 'v1',
            stepId: 's1',
            sectionId: null,
            parentFieldId: null,
            key: 'name',
            label: 'Name',
            description: null,
            type: 'SHORT_TEXT',
            required: true,
            order: 1,
            config: { placeholder: 'Enter name' },
            conditions: null,
          }],
        }],
      })

      const result = await adapter.getFormBySlug('test-form')
      expect(result).not.toBeNull()
      expect(result!.slug).toBe('test-form')
      expect(result!.tenantId).toBe('tenant-a')
      expect(result!.steps).toHaveLength(1)
      expect(result!.steps[0].title).toBe('Step 1')
      expect(result!.fields).toHaveLength(1)
      expect(result!.fields[0].key).toBe('name')
      expect(result!.fields[0].config).toEqual({ placeholder: 'Enter name' })
    })
  })

  describe('getFormById', () => {
    it('should return null when form not found', async () => {
      prisma.dfeForm.findFirst.mockResolvedValue(null)
      const result = await adapter.getFormById('nonexistent')
      expect(result).toBeNull()
    })

    it('should map a published form version by id', async () => {
      prisma.dfeForm.findFirst.mockResolvedValue({
        id: 'f1',
        tenantId: 'tenant-a',
        slug: 'test-form',
        title: 'Test Form',
        description: 'A test form',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        versions: [{
          id: 'v1',
          status: 'PUBLISHED',
          steps: [],
          fields: [],
        }],
      })

      const result = await adapter.getFormById('f1', { tenantId: 'tenant-a' })

      expect(result).toMatchObject({
        id: 'f1',
        tenantId: 'tenant-a',
        versionId: 'v1',
        slug: 'test-form',
      })
    })
  })

  describe('listForms', () => {
    it('should list forms with pagination', async () => {
      prisma.dfeForm.findMany.mockResolvedValue([
        { id: '1', slug: 'form-1', title: 'Form 1', createdAt: new Date(), updatedAt: new Date(), versions: [{ id: 'v1', status: 'PUBLISHED' }] },
        { id: '2', slug: 'form-2', title: 'Form 2', createdAt: new Date(), updatedAt: new Date(), versions: [{ id: 'v2', status: 'PUBLISHED' }] },
      ])

      const result = await adapter.listForms({ pageSize: 20, cursor: null })
      expect(result.items).toHaveLength(2)
      expect(result.nextCursor).toBeNull()
    })

    it('should detect hasMore when items exceed pageSize', async () => {
      const items = Array.from({ length: 3 }, (_, i) => ({
        id: `${i}`, slug: `form-${i}`, title: `Form ${i}`,
        createdAt: new Date(), updatedAt: new Date(),
        versions: [{ id: `v${i}`, status: 'PUBLISHED' }],
      }))
      prisma.dfeForm.findMany.mockResolvedValue(items)

      const result = await adapter.listForms({ pageSize: 2, cursor: null })
      expect(result.items).toHaveLength(2)
      expect(result.nextCursor).toBe('1') // last item id
    })

    it('should pass tenant, search, and cursor filters to Prisma', async () => {
      prisma.dfeForm.findMany.mockResolvedValue([])

      await adapter.listForms(
        { pageSize: 5, cursor: 'form-9', search: 'onboarding' },
        { tenantId: 'tenant-a' },
      )

      expect(prisma.dfeForm.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          tenantId: 'tenant-a',
          OR: [
            { title: { contains: 'onboarding', mode: 'insensitive' } },
            { slug: { contains: 'onboarding', mode: 'insensitive' } },
          ],
        },
        cursor: { id: 'form-9' },
        skip: 1,
      }))
    })
  })

  describe('createSubmission', () => {
    it('should create a submission', async () => {
      const expected = { id: 'sub1', formId: 'f1', userId: 'u1', status: 'IN_PROGRESS' }
      prisma.dfeSubmission.create.mockResolvedValue(expected)

      const result = await adapter.createSubmission({
        formId: 'f1',
        versionId: 'v1',
        userId: 'u1',
        tenantId: 'tenant-a',
        experimentId: 'exp-1',
        variantId: 'variant-a',
        variantKey: 'guided',
        context: { userId: 'u1' },
      })

      expect(result).toEqual(expected)
      expect(prisma.dfeSubmission.create).toHaveBeenCalled()
    })
  })

  describe('getSubmission', () => {
    it('should return null when not found', async () => {
      prisma.dfeSubmission.findUnique.mockResolvedValue(null)
      const result = await adapter.getSubmission('nonexistent')
      expect(result).toBeNull()
    })

    it('should return submission when found', async () => {
      const sub = { id: 'sub1', formId: 'f1', userId: 'u1' }
      prisma.dfeSubmission.findUnique.mockResolvedValue(sub)
      const result = await adapter.getSubmission('sub1')
      expect(result).toEqual(sub)
    })
  })

  describe('updateSubmission', () => {
    it('should update submission status', async () => {
      const updated = { id: 'sub1', status: 'COMPLETED' }
      prisma.dfeSubmission.update.mockResolvedValue(updated)

      const result = await adapter.updateSubmission('sub1', { status: 'COMPLETED' })
      expect(result).toEqual(updated)
      expect(prisma.dfeSubmission.update).toHaveBeenCalledWith({
        where: { id: 'sub1' },
        data: { status: 'COMPLETED' },
      })
    })
  })

  describe('listSubmissions', () => {
    it('should pass tenant, form, status, and limit filters to Prisma', async () => {
      prisma.dfeSubmission.findMany.mockResolvedValue([
        { id: 'sub-1', formId: 'form-1', status: 'IN_PROGRESS' },
      ])

      const result = await adapter.listSubmissions!({
        tenantId: 'tenant-a',
        formId: 'form-1',
        status: 'IN_PROGRESS',
        limit: 25,
      })

      expect(prisma.dfeSubmission.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-a',
          formId: 'form-1',
          status: 'IN_PROGRESS',
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      })
      expect(result).toEqual([{ id: 'sub-1', formId: 'form-1', status: 'IN_PROGRESS' }])
    })
  })

  describe('executeApiContract', () => {
    it('should use in-memory store by default', async () => {
      const result = await adapter.executeApiContract(
        { method: 'POST', resourceName: 'users', endpoint: '/api/users', fieldMapping: {} },
        { name: 'Alice' }
      )

      expect(result).toHaveProperty('id')
      expect(result.name).toBe('Alice')
      expect(result).toHaveProperty('createdAt')
    })

    it('should use custom executor when provided', async () => {
      const customExecute = vi.fn().mockResolvedValue({ id: 'custom-1', name: 'Bob' })
      const adapterWithCustom = new PrismaDatabaseAdapter(prisma, {
        executeApiContract: customExecute,
      })

      const contract = { method: 'POST', resourceName: 'users', endpoint: '/api/users', fieldMapping: {} }
      const result = await adapterWithCustom.executeApiContract(contract as any, { name: 'Bob' })

      expect(customExecute).toHaveBeenCalledWith(contract, { name: 'Bob' })
      expect(result.name).toBe('Bob')
    })
  })

  describe('fetchFieldOptions', () => {
    it('should fetch options for a field', async () => {
      prisma.dfeFieldOption.findMany.mockResolvedValue([
        { id: 'o1', label: 'Option 1', value: 'opt1', meta: null },
        { id: 'o2', label: 'Option 2', value: 'opt2', meta: null },
      ])

      const result = await adapter.fetchFieldOptions('f1', {
        pageSize: 20,
        cursor: null,
      })

      expect(result.items).toHaveLength(2)
      expect(result.items[0].label).toBe('Option 1')
    })

    it('should filter options by search, filters, and cursor', async () => {
      prisma.dfeFieldOption.findMany.mockResolvedValue([
        { id: 'o1', label: 'Platform Engineering', value: 'platform', meta: { department: 'eng' } },
        { id: 'o2', label: 'Infrastructure', value: 'infrastructure', meta: { department: 'eng' } },
        { id: 'o3', label: 'Brand Studio', value: 'brand-studio', meta: { department: 'design' } },
      ])

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

    it('should exclude options when metadata does not match the requested filters', async () => {
      prisma.dfeFieldOption.findMany.mockResolvedValue([
        { id: 'o1', label: 'No metadata', value: 'none', meta: null },
        { id: 'o2', label: 'People Ops', value: 'people', meta: { department: 'hr' } },
      ])

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
    it('should ignore analytics tracking when the model is unavailable', async () => {
      delete (prisma as any).dfeAnalyticsEvent

      await expect(adapter.trackAnalyticsEvent!({
        formId: 'form-1',
        event: 'form_started',
        timestamp: 1700000000000,
      })).resolves.toBeUndefined()
    })

    it('should persist analytics events when the model is available', async () => {
      await adapter.trackAnalyticsEvent!({
        tenantId: 'tenant-a',
        formId: 'form-1',
        submissionId: 'sub-1',
        event: 'form_started',
        timestamp: 1700000000000,
      })

      expect(prisma.dfeAnalyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-a',
          formId: 'form-1',
          event: 'form_started',
        }),
      })
    })

    it('should list analytics events using mapped query filters', async () => {
      prisma.dfeAnalyticsEvent.findMany.mockResolvedValue([
        {
          tenantId: 'tenant-a',
          formId: 'form-1',
          submissionId: 'sub-1',
          event: 'variant_assigned',
          stepId: null,
          fieldKey: null,
          experimentId: 'exp-1',
          variantId: 'variant-a',
          variantKey: 'guided',
          metadata: { variantLabel: 'Guided' },
          occurredAt: 'not-a-date',
        },
      ])

      const events = await adapter.listAnalyticsEvents!({
        tenantId: 'tenant-a',
        formId: 'form-1',
        from: 1700000000000,
        to: 1700000300000,
      })

      expect(prisma.dfeAnalyticsEvent.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-a',
          formId: 'form-1',
          occurredAt: {
            gte: new Date(1700000000000),
            lte: new Date(1700000300000),
          },
        },
        orderBy: { occurredAt: 'asc' },
      })
      expect(events[0]).toMatchObject({
        variantKey: 'guided',
        metadata: { variantLabel: 'Guided' },
      })
      expect(typeof events[0].timestamp).toBe('number')
    })

    it('should return an empty analytics list when the model is unavailable', async () => {
      delete (prisma as any).dfeAnalyticsEvent

      await expect(adapter.listAnalyticsEvents!({ tenantId: 'tenant-a' })).resolves.toEqual([])
    })

    it('should build analytics summaries from persisted events', async () => {
      prisma.dfeAnalyticsEvent.findMany.mockResolvedValue([
        {
          tenantId: 'tenant-a',
          formId: 'form-1',
          submissionId: 'sub-1',
          event: 'form_started',
          occurredAt: new Date('2026-03-13T10:00:00.000Z'),
        },
        {
          tenantId: 'tenant-a',
          formId: 'form-1',
          submissionId: 'sub-1',
          event: 'form_completed',
          occurredAt: new Date('2026-03-13T10:05:00.000Z'),
        },
      ])
      prisma.dfeForm.count.mockResolvedValue(2)

      const summary = await adapter.getAnalyticsSummary!({ tenantId: 'tenant-a' })

      expect(summary.totalForms).toBe(2)
      expect(summary.totalStarts).toBe(1)
      expect(summary.totalCompletions).toBe(1)
      expect(summary.completionRate).toBe(1)
    })

    it('should derive summary form totals from the queried form when formId is provided', async () => {
      prisma.dfeAnalyticsEvent.findMany.mockResolvedValue([
        {
          tenantId: 'tenant-a',
          formId: 'form-1',
          submissionId: 'sub-1',
          event: 'form_started',
          occurredAt: new Date('2026-03-13T10:00:00.000Z'),
        },
      ])

      const summary = await adapter.getAnalyticsSummary!({
        tenantId: 'tenant-a',
        formId: 'form-1',
      })

      expect(summary.totalForms).toBe(1)
      expect(prisma.dfeForm.count).not.toHaveBeenCalled()
    })

    it('should fall back to counting distinct form ids when count is unavailable', async () => {
      prisma.dfeAnalyticsEvent.findMany.mockResolvedValue([
        {
          tenantId: 'tenant-a',
          formId: 'form-1',
          submissionId: 'sub-1',
          event: 'form_started',
          occurredAt: new Date('2026-03-13T10:00:00.000Z'),
        },
        {
          tenantId: 'tenant-a',
          formId: 'form-2',
          submissionId: 'sub-2',
          event: 'form_started',
          occurredAt: new Date('2026-03-13T10:01:00.000Z'),
        },
      ])
      delete (prisma as any).dfeForm.count

      const summary = await adapter.getAnalyticsSummary!({ tenantId: 'tenant-a' })

      expect(summary.totalForms).toBe(2)
    })

    it('should return the active experiment with variants', async () => {
      prisma.dfeExperiment.findFirst.mockResolvedValue({
        id: 'exp-1',
        formId: 'form-1',
        tenantId: 'tenant-a',
        name: 'Hero copy',
        status: 'ACTIVE',
        createdAt: new Date('2026-03-13T10:00:00.000Z'),
        updatedAt: new Date('2026-03-13T10:00:00.000Z'),
        variants: [
          { id: 'variant-a', experimentId: 'exp-1', key: 'control', label: 'Control', weight: 1, overrides: null },
        ],
      })

      const experiment = await adapter.getActiveExperimentForForm!('form-1', { tenantId: 'tenant-a' })

      expect(experiment?.name).toBe('Hero copy')
      expect(experiment?.variants[0].key).toBe('control')
    })

    it('should return null when the experiment model is unavailable or empty', async () => {
      delete (prisma as any).dfeExperiment
      await expect(adapter.getActiveExperimentForForm!('form-1')).resolves.toBeNull()

      prisma.dfeExperiment = { findFirst: vi.fn().mockResolvedValue(null) }
      await expect(adapter.getActiveExperimentForForm!('form-1', { tenantId: null })).resolves.toBeNull()
    })
  })
})
