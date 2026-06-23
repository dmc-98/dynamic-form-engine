/**
 * Self-test for the adapter certification kit.
 *
 * Builds a minimal in-memory DatabaseAdapter, runs the full conformance suite
 * against it, and asserts all cases pass. This proves the kit itself is
 * correct and doubles as a reference implementation.
 */

import { describe, it, expect } from 'vitest'
import {
  runDatabaseAdapterConformance,
  CONFORMANCE_SEED,
  type ConformanceSeedData,
} from '../src/adapter-conformance'
import type {
  DatabaseAdapter,
  FormDefinitionRecord,
  FormSubmissionRecord,
  FormVersionRecord,
  PaginatedResult,
  PaginationParams,
} from '../src/adapters'
import type { SelectOption, StepApiContract } from '@dmc--98/dfe-core'

// ─── In-memory adapter ───────────────────────────────────────────────────────

/**
 * Minimal in-memory DatabaseAdapter. Not for production — purely for
 * certifying the kit and as a reference implementation.
 */
class MemoryDatabaseAdapter implements DatabaseAdapter {
  private forms = new Map<string, FormVersionRecord>()
  private formsBySlug = new Map<string, FormVersionRecord>()
  private submissions = new Map<string, FormSubmissionRecord>()
  private submissionIdCounter = 1

  seed(data: ConformanceSeedData): void {
    const form = data.form
    this.forms.set(form.id, form)
    this.formsBySlug.set(form.slug, form)
  }

  async getFormBySlug(slug: string): Promise<FormVersionRecord | null> {
    return this.formsBySlug.get(slug) ?? null
  }

  async getFormById(id: string): Promise<FormVersionRecord | null> {
    return this.forms.get(id) ?? null
  }

  async listForms(
    params?: PaginationParams,
  ): Promise<PaginatedResult<FormDefinitionRecord>> {
    const pageSize = params?.pageSize ?? 20
    const allForms = Array.from(this.forms.values())
    const items: FormDefinitionRecord[] = allForms.slice(0, pageSize).map((f) => ({
      id: f.id,
      tenantId: f.tenantId,
      slug: f.slug,
      title: f.title,
      description: f.description,
      versionId: f.versionId,
      status: f.status,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }))
    return {
      items,
      nextCursor: allForms.length > pageSize ? 'next' : null,
    }
  }

  async createSubmission(data: {
    tenantId?: string | null
    formId: string
    versionId: string
    userId: string
    context: any
    experimentId?: string | null
    variantId?: string | null
    variantKey?: string | null
  }): Promise<FormSubmissionRecord> {
    const id = `submission-${this.submissionIdCounter++}`
    const now = new Date()
    const record: FormSubmissionRecord = {
      id,
      tenantId: data.tenantId ?? null,
      formId: data.formId,
      versionId: data.versionId,
      userId: data.userId,
      status: 'IN_PROGRESS',
      currentStepId: null,
      context: data.context,
      experimentId: data.experimentId ?? null,
      variantId: data.variantId ?? null,
      variantKey: data.variantKey ?? null,
      createdAt: now,
      updatedAt: now,
    }
    this.submissions.set(id, record)
    return record
  }

  async getSubmission(id: string): Promise<FormSubmissionRecord | null> {
    return this.submissions.get(id) ?? null
  }

  async updateSubmission(
    id: string,
    data: Partial<{
      currentStepId: string | null
      status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
      context: any
    }>,
  ): Promise<FormSubmissionRecord> {
    const existing = this.submissions.get(id)
    if (!existing) throw new Error(`Submission not found: ${id}`)
    const updated: FormSubmissionRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    }
    this.submissions.set(id, updated)
    return updated
  }

  async executeApiContract(
    _contract: StepApiContract,
    _body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // Return a minimal response with a synthetic id.
    return { id: `resource-${Date.now()}` }
  }

  async fetchFieldOptions(
    _fieldId: string,
    _params: PaginationParams,
  ): Promise<PaginatedResult<SelectOption>> {
    return { items: [], nextCursor: null }
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('runDatabaseAdapterConformance', () => {
  it('passes all cases against the reference in-memory adapter', async () => {
    const adapter = new MemoryDatabaseAdapter()

    const report = await runDatabaseAdapterConformance(adapter, async (seed) => {
      adapter.seed(seed)
    })

    // Surface individual failures clearly if any case failed.
    const failures = report.results.filter((r) => !r.ok)
    expect(failures, report.summary).toEqual([])
    expect(report.ok).toBe(true)
    expect(report.passed).toBe(report.total)
  })

  it('reports failures clearly when a case fails', async () => {
    // Adapter that never finds the form — breaks all read-path cases.
    const brokenAdapter: DatabaseAdapter = {
      getFormBySlug: async () => null,
      getFormById: async () => null,
      listForms: async () => ({ items: [], nextCursor: null }),
      createSubmission: async (d) => ({
        id: 'sub-1',
        tenantId: null,
        formId: d.formId,
        versionId: d.versionId,
        userId: d.userId,
        status: 'IN_PROGRESS',
        currentStepId: null,
        context: d.context,
        experimentId: null,
        variantId: null,
        variantKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      getSubmission: async () => null,
      updateSubmission: async () => {
        throw new Error('not implemented')
      },
      executeApiContract: async () => ({}),
      fetchFieldOptions: async () => ({ items: [], nextCursor: null }),
    }

    const report = await runDatabaseAdapterConformance(brokenAdapter, async () => {
      // no-op: broken adapter ignores seed
    })

    expect(report.ok).toBe(false)
    expect(report.failed).toBeGreaterThan(0)
    expect(report.summary).toMatch(/FAILED/)
    // getFormBySlug should be among the failures
    const slugCase = report.results.find((r) => r.name.includes('getFormBySlug — returns seeded form'))
    expect(slugCase?.ok).toBe(false)
  })

  it('exposes CONFORMANCE_SEED for caller use in their seed function', () => {
    expect(CONFORMANCE_SEED.form.id).toBe('cf-form-1')
    expect(CONFORMANCE_SEED.form.slug).toBe('conformance-test-form')
    expect(CONFORMANCE_SEED.form.status).toBe('PUBLISHED')
    expect(CONFORMANCE_SEED.form.steps.length).toBeGreaterThan(0)
    expect(CONFORMANCE_SEED.form.fields.length).toBeGreaterThan(0)
  })

  it('conformance report shape is correct', async () => {
    const adapter = new MemoryDatabaseAdapter()
    const report = await runDatabaseAdapterConformance(adapter, async (seed) => {
      adapter.seed(seed)
    })

    expect(typeof report.ok).toBe('boolean')
    expect(typeof report.passed).toBe('number')
    expect(typeof report.failed).toBe('number')
    expect(typeof report.total).toBe('number')
    expect(report.passed + report.failed).toBe(report.total)
    expect(typeof report.summary).toBe('string')
    expect(Array.isArray(report.results)).toBe(true)
    for (const r of report.results) {
      expect(typeof r.name).toBe('string')
      expect(typeof r.ok).toBe('boolean')
    }
  })
})
