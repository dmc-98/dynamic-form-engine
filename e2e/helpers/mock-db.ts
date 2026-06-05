/**
 * In-memory DatabaseAdapter implementation for E2E testing.
 * Provides a fully functional mock database with real storage semantics.
 */
import type {
  FormField,
  FormRuntimeContext,
  FormStep,
  FormValues,
  SelectOption,
  StepApiContract,
} from '@dmc--98/dfe-core'
import {
  buildAnalyticsSummary,
} from '@dmc--98/dfe-server'
import type {
  AccessContext,
  AnalyticsQuery,
  DatabaseAdapter,
  FormDefinitionRecord,
  FormExperimentRecord,
  FormSubmissionRecord,
  ServerFormAnalyticsEvent,
  FormVersionRecord,
  PaginatedResult,
  PaginationParams,
} from '@dmc--98/dfe-server'

export class InMemoryDatabase implements DatabaseAdapter {
  private forms = new Map<string, FormVersionRecord>()
  private submissions = new Map<string, FormSubmissionRecord>()
  private resources = new Map<string, Record<string, unknown>[]>()
  private fieldOptions = new Map<string, SelectOption[]>()
  private analyticsEvents: ServerFormAnalyticsEvent[] = []
  private experiments = new Map<string, FormExperimentRecord>()
  private idCounter = 0

  // ── Setup Helpers ────────────────────────────────────────────────────────

  seedForm(form: FormVersionRecord): void {
    this.forms.set(form.id, form)
  }

  seedFieldOptions(fieldId: string, options: SelectOption[]): void {
    this.fieldOptions.set(fieldId, options)
  }

  seedExperiment(experiment: FormExperimentRecord): void {
    this.experiments.set(experiment.formId, experiment)
  }

  getSubmissions(): FormSubmissionRecord[] {
    return Array.from(this.submissions.values())
  }

  getAnalyticsEvents(): ServerFormAnalyticsEvent[] {
    return [...this.analyticsEvents]
  }

  getResources(name: string): Record<string, unknown>[] {
    return this.resources.get(name) ?? []
  }

  clear(): void {
    this.forms.clear()
    this.submissions.clear()
    this.resources.clear()
    this.fieldOptions.clear()
    this.analyticsEvents = []
    this.experiments.clear()
    this.idCounter = 0
  }

  private nextId(): string {
    return `id_${++this.idCounter}`
  }

  private matchesTenant(recordTenantId: string | null | undefined, access?: AccessContext): boolean {
    if (access?.tenantId === undefined) {
      return true
    }

    return (recordTenantId ?? null) === access.tenantId
  }

  // ── DatabaseAdapter Implementation ───────────────────────────────────────

  async getFormBySlug(slug: string, access?: AccessContext): Promise<FormVersionRecord | null> {
    return Array.from(this.forms.values()).find(
      (form) => form.slug === slug && this.matchesTenant(form.tenantId, access),
    ) ?? null
  }

  async getFormById(id: string, access?: AccessContext): Promise<FormVersionRecord | null> {
    const form = this.forms.get(id) ?? null
    if (!form || !this.matchesTenant(form.tenantId, access)) {
      return null
    }

    return form
  }

  async listForms(
    params?: PaginationParams,
    access?: AccessContext,
  ): Promise<PaginatedResult<FormDefinitionRecord>> {
    const all = Array.from(this.forms.values())
      .filter((form) => this.matchesTenant(form.tenantId, access))
      .filter((form) => {
        if (!params?.search) return true
        const search = params.search.toLowerCase()
        return form.title.toLowerCase().includes(search) || form.slug.toLowerCase().includes(search)
      })

    const pageSize = params?.pageSize ?? 20
    const startIndex = params?.cursor ? parseInt(params.cursor, 10) : 0
    const items = all.slice(startIndex, startIndex + pageSize)
    const nextCursor = startIndex + pageSize < all.length ? String(startIndex + pageSize) : null
    return { items, nextCursor, total: all.length }
  }

  async createSubmission(data: {
    tenantId?: string | null
    formId: string
    versionId: string
    userId: string
    context: FormRuntimeContext
    experimentId?: string | null
    variantId?: string | null
    variantKey?: string | null
  }): Promise<FormSubmissionRecord> {
    const id = this.nextId()
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      context: FormRuntimeContext
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

  async listSubmissions(query?: {
    tenantId?: string | null
    formId?: string
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    limit?: number
  }): Promise<FormSubmissionRecord[]> {
    return Array.from(this.submissions.values())
      .filter((submission) => query?.tenantId === undefined || (submission.tenantId ?? null) === query.tenantId)
      .filter((submission) => !query?.formId || submission.formId === query.formId)
      .filter((submission) => !query?.status || submission.status === query.status)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, query?.limit ?? 100)
  }

  async executeApiContract(
    contract: StepApiContract,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const resource = contract.resourceName
    if (!this.resources.has(resource)) {
      this.resources.set(resource, [])
    }

    const id = this.nextId()
    const record = { id, ...body, createdAt: new Date().toISOString() }
    this.resources.get(resource)!.push(record)
    return record
  }

  async fetchFieldOptions(
    fieldId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<SelectOption>> {
    const all = this.fieldOptions.get(fieldId) ?? []
    let filtered = all

    if (params.filters) {
      filtered = all.filter((option) => {
        for (const [key, value] of Object.entries(params.filters!)) {
          const metaValue = option.meta && typeof option.meta === 'object'
            ? (option.meta as Record<string, unknown>)[key]
            : undefined
          if (String(metaValue) !== String(value)) return false
        }
        return true
      })
    }

    if (params.search) {
      const query = params.search.toLowerCase()
      filtered = filtered.filter((option) =>
        option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query),
      )
    }

    const pageSize = params.pageSize ?? 20
    const startIndex = params.cursor ? parseInt(params.cursor, 10) : 0
    const items = filtered.slice(startIndex, startIndex + pageSize)
    const nextCursor = startIndex + pageSize < filtered.length ? String(startIndex + pageSize) : null

    return { items, nextCursor, total: filtered.length }
  }

  async trackAnalyticsEvent(event: ServerFormAnalyticsEvent): Promise<void> {
    this.analyticsEvents.push(event)
  }

  async listAnalyticsEvents(query?: AnalyticsQuery): Promise<ServerFormAnalyticsEvent[]> {
    return this.analyticsEvents.filter((event) => {
      if (query?.tenantId !== undefined && (event.tenantId ?? null) !== query.tenantId) {
        return false
      }
      if (query?.formId && event.formId !== query.formId) {
        return false
      }
      if (query?.from && event.timestamp < query.from) {
        return false
      }
      if (query?.to && event.timestamp > query.to) {
        return false
      }
      return true
    })
  }

  async getAnalyticsSummary(query?: AnalyticsQuery) {
    const events = await this.listAnalyticsEvents(query)
    const totalForms = query?.formId
      ? 1
      : Array.from(this.forms.values()).filter((form) => {
        if (query?.tenantId === undefined) return true
        return (form.tenantId ?? null) === query.tenantId
      }).length
    return buildAnalyticsSummary(events, { totalForms })
  }

  async getActiveExperimentForForm(
    formId: string,
    access?: AccessContext,
  ): Promise<FormExperimentRecord | null> {
    const experiment = this.experiments.get(formId) ?? null
    if (!experiment || !this.matchesTenant(experiment.tenantId, access)) {
      return null
    }

    return experiment
  }
}

// ─── Factory ───────────────────────────────────────────────────────────────

export function createTestDb(): InMemoryDatabase {
  return new InMemoryDatabase()
}

// ─── Seed Data ─────────────────────────────────────────────────────────────

export function seedContactForm(db: InMemoryDatabase): FormVersionRecord {
  const form: FormVersionRecord = {
    id: 'form_contact',
    tenantId: 'tenant_a',
    slug: 'contact-us',
    title: 'Contact Us',
    description: 'Get in touch with us',
    versionId: 'v1',
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
    fields: [
      {
        id: 'f1', versionId: 'v1', key: 'firstName', label: 'First Name', type: 'SHORT_TEXT',
        required: true, order: 0, config: { minLength: 1 }, stepId: 'step_info',
      } as any,
      {
        id: 'f2', versionId: 'v1', key: 'lastName', label: 'Last Name', type: 'SHORT_TEXT',
        required: true, order: 1, config: { minLength: 1 }, stepId: 'step_info',
      } as any,
      {
        id: 'f3', versionId: 'v1', key: 'email', label: 'Email', type: 'EMAIL',
        required: true, order: 2, config: {}, stepId: 'step_info',
      } as any,
      {
        id: 'f4', versionId: 'v1', key: 'message', label: 'Message', type: 'LONG_TEXT',
        required: true, order: 3, config: { minLength: 10 }, stepId: 'step_message',
      } as any,
    ],
    steps: [
      { id: 'step_info', versionId: 'v1', title: 'Contact Info', order: 0 },
      { id: 'step_message', versionId: 'v1', title: 'Message', order: 1 },
    ],
  }
  db.seedForm(form)
  return form
}

export function seedMultiStepForm(db: InMemoryDatabase): FormVersionRecord {
  const form: FormVersionRecord = {
    id: 'form_multi',
    tenantId: 'tenant_a',
    slug: 'multi-step-form',
    title: 'Multi-Step Registration',
    description: 'A multi-step registration form',
    versionId: 'v1',
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
    fields: [
      {
        id: 'f1', versionId: 'v1', key: 'name', label: 'Name', type: 'SHORT_TEXT',
        required: true, order: 0, config: { minLength: 1 }, stepId: 'step_1',
      } as any,
      {
        id: 'f2', versionId: 'v1', key: 'email', label: 'Email', type: 'EMAIL',
        required: true, order: 1, config: {}, stepId: 'step_1',
      } as any,
      {
        id: 'f3', versionId: 'v1', key: 'age', label: 'Age', type: 'NUMBER',
        required: true, order: 2, config: { min: 18, max: 120 }, stepId: 'step_2',
      } as any,
      {
        id: 'f4', versionId: 'v1', key: 'bio', label: 'Bio', type: 'LONG_TEXT',
        required: false, order: 3, config: {}, stepId: 'step_2',
      } as any,
      {
        id: 'f5', versionId: 'v1', key: 'agree', label: 'I agree to terms', type: 'CHECKBOX',
        required: false, order: 4, config: {}, stepId: 'step_3',
      } as any,
    ],
    steps: [
      { id: 'step_1', versionId: 'v1', title: 'Account', order: 0 },
      { id: 'step_2', versionId: 'v1', title: 'Profile', order: 1 },
      { id: 'step_3', versionId: 'v1', title: 'Terms', order: 2 },
    ],
  }
  db.seedForm(form)
  return form
}
