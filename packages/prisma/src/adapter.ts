import type {
  FormField,
  FormRuntimeContext,
  FormStep,
  SelectOption,
  StepApiContract,
} from '@dmc--98/dfe-core'
import {
  buildAnalyticsSummary,
  generateId,
} from '@dmc--98/dfe-server'
import type {
  AccessContext,
  AnalyticsQuery,
  AnalyticsSummary,
  DatabaseAdapter,
  FormDefinitionRecord,
  FormExperimentRecord,
  FormSubmissionRecord,
  ServerFormAnalyticsEvent,
  FormVersionRecord,
  PaginatedResult,
  PaginationParams,
} from '@dmc--98/dfe-server'

// ─── Types for PrismaClient ─────────────────────────────────────────────────

/**
 * Minimal Prisma client interface to avoid hard dependency on @prisma/client.
 * Your generated PrismaClient will satisfy this interface.
 */
export interface PrismaLike {
  dfeForm: any
  dfeFormVersion: any
  dfeStep: any
  dfeField: any
  dfeFieldOption: any
  dfeSubmission: any
  dfeAnalyticsEvent?: any
  dfeExperiment?: any
  dfeExperimentVariant?: any
  $transaction: (fn: (tx: any) => Promise<any>) => Promise<any>
}

// ─── In-Memory Model Store (for API Contract execution) ─────────────────────

/**
 * Simple in-memory model store for dynamic resource operations.
 * This is used by the adapter to execute API contracts that create/update
 * resources via the form engine.
 *
 * For production use, extend this with a real database or replace
 * executeApiContract with your own implementation.
 */
export class InMemoryModelStore {
  private store = new Map<string, Map<string, Record<string, unknown>>>()

  get(resource: string, id: string): Record<string, unknown> | undefined {
    return this.store.get(resource)?.get(id)
  }

  set(resource: string, id: string, data: Record<string, unknown>): void {
    if (!this.store.has(resource)) {
      this.store.set(resource, new Map())
    }
    this.store.get(resource)!.set(id, data)
  }

  getAll(resource: string): Record<string, unknown>[] {
    const map = this.store.get(resource)
    return map ? Array.from(map.values()) : []
  }

  clear(): void {
    this.store.clear()
  }
}

// ─── Prisma Database Adapter ────────────────────────────────────────────────

export interface PrismaAdapterOptions {
  /**
   * Custom API contract executor.
   * If not provided, uses an in-memory model store.
   * Override this for production to write to your actual database tables.
   */
  executeApiContract?: (
    contract: StepApiContract,
    body: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>
}

function buildTenantWhere(access?: AccessContext): Record<string, unknown> {
  if (access?.tenantId === undefined) {
    return {}
  }

  return { tenantId: access.tenantId }
}

function buildAnalyticsWhere(query?: AnalyticsQuery): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  if (query?.tenantId !== undefined) {
    where.tenantId = query.tenantId
  }

  if (query?.formId) {
    where.formId = query.formId
  }

  if (query?.from || query?.to) {
    where.occurredAt = {}

    if (query.from) {
      ;(where.occurredAt as Record<string, unknown>).gte = new Date(query.from)
    }

    if (query.to) {
      ;(where.occurredAt as Record<string, unknown>).lte = new Date(query.to)
    }
  }

  return where
}

function mapAnalyticsEvent(row: any): ServerFormAnalyticsEvent {
  return {
    tenantId: row.tenantId ?? undefined,
    formId: row.formId,
    submissionId: row.submissionId ?? undefined,
    event: row.event,
    stepId: row.stepId ?? undefined,
    fieldKey: row.fieldKey ?? undefined,
    experimentId: row.experimentId ?? undefined,
    variantId: row.variantId ?? undefined,
    variantKey: row.variantKey ?? undefined,
    metadata: row.metadata ?? undefined,
    timestamp: row.occurredAt instanceof Date ? row.occurredAt.getTime() : Date.now(),
  }
}

function mapExperiment(experiment: any): FormExperimentRecord {
  return {
    id: experiment.id,
    formId: experiment.formId,
    tenantId: experiment.tenantId ?? null,
    name: experiment.name,
    status: experiment.status,
    createdAt: experiment.createdAt,
    updatedAt: experiment.updatedAt,
    variants: (experiment.variants ?? []).map((variant: any) => ({
      id: variant.id,
      experimentId: variant.experimentId,
      key: variant.key,
      label: variant.label,
      weight: variant.weight,
      overrides: variant.overrides ?? null,
    })),
  }
}

/**
 * Prisma implementation of the DatabaseAdapter interface.
 *
 * @example
 * ```ts
 * import { PrismaClient } from '@prisma/client'
 * import { PrismaDatabaseAdapter } from '@dmc--98/dfe-prisma'
 *
 * const prisma = new PrismaClient()
 * const db = new PrismaDatabaseAdapter(prisma)
 * ```
 */
export class PrismaDatabaseAdapter implements DatabaseAdapter {
  private prisma: PrismaLike
  private modelStore = new InMemoryModelStore()
  private customExecute?: (
    contract: StepApiContract,
    body: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>

  constructor(prisma: PrismaLike, options?: PrismaAdapterOptions) {
    this.prisma = prisma
    this.customExecute = options?.executeApiContract
  }

  // ── Form Definitions ──────────────────────────────────────────────────

  async getFormBySlug(slug: string, access?: AccessContext): Promise<FormVersionRecord | null> {
    const form = await this.prisma.dfeForm.findFirst({
      where: {
        slug,
        ...buildTenantWhere(access),
      },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            steps: { orderBy: { order: 'asc' } },
            fields: { orderBy: { order: 'asc' } },
          },
        },
      },
    })

    if (!form || form.versions.length === 0) return null

    const version = form.versions[0]
    return this.mapToFormVersion(form, version)
  }

  async getFormById(id: string, access?: AccessContext): Promise<FormVersionRecord | null> {
    const form = await this.prisma.dfeForm.findFirst({
      where: {
        id,
        ...buildTenantWhere(access),
      },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            steps: { orderBy: { order: 'asc' } },
            fields: { orderBy: { order: 'asc' } },
          },
        },
      },
    })

    if (!form || form.versions.length === 0) return null

    const version = form.versions[0]
    return this.mapToFormVersion(form, version)
  }

  async listForms(
    params?: PaginationParams,
    access?: AccessContext,
  ): Promise<PaginatedResult<FormDefinitionRecord>> {
    const pageSize = params?.pageSize ?? 20

    const where: Record<string, unknown> = {
      ...buildTenantWhere(access),
    }

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    const cursor = params?.cursor ? { id: params.cursor } : undefined

    const forms = await this.prisma.dfeForm.findMany({
      where,
      take: pageSize + 1,
      cursor,
      skip: cursor ? 1 : 0,
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    })

    const hasMore = forms.length > pageSize
    const items = (hasMore ? forms.slice(0, -1) : forms).map((form: any) => ({
      id: form.id,
      tenantId: form.tenantId ?? null,
      slug: form.slug,
      title: form.title,
      description: form.description,
      versionId: form.versions[0]?.id ?? '',
      status: form.versions[0]?.status ?? 'DRAFT',
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    }))

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    }
  }

  // ── Submissions ───────────────────────────────────────────────────────

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
    return this.prisma.dfeSubmission.create({ data })
  }

  async getSubmission(id: string): Promise<FormSubmissionRecord | null> {
    return this.prisma.dfeSubmission.findUnique({ where: { id } })
  }

  async updateSubmission(id: string, data: Partial<{
    currentStepId: string | null
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    context: FormRuntimeContext
  }>): Promise<FormSubmissionRecord> {
    return this.prisma.dfeSubmission.update({
      where: { id },
      data,
    })
  }

  async listSubmissions(query?: {
    tenantId?: string | null
    formId?: string
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    limit?: number
  }): Promise<FormSubmissionRecord[]> {
    const where: Record<string, unknown> = {}

    if (query?.tenantId !== undefined) {
      where.tenantId = query.tenantId
    }

    if (query?.formId) {
      where.formId = query.formId
    }

    if (query?.status) {
      where.status = query.status
    }

    return this.prisma.dfeSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query?.limit ?? 100,
    })
  }

  // ── Dynamic Resource Operations ───────────────────────────────────────

  async executeApiContract(
    contract: StepApiContract,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (this.customExecute) {
      return this.customExecute(contract, body)
    }

    const id = (body.id as string) ?? generateId()
    const record: Record<string, unknown> = { id, ...body, updatedAt: new Date().toISOString() }

    if (contract.method === 'POST') {
      record.createdAt = new Date().toISOString()
    }

    this.modelStore.set(contract.resourceName, id, record)
    return record
  }

  // ── Dynamic Options ───────────────────────────────────────────────────

  async fetchFieldOptions(
    fieldId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<SelectOption>> {
    const pageSize = params.pageSize
    const options = await this.prisma.dfeFieldOption.findMany({
      where: { fieldId },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    })

    const filteredOptions = options.filter((option: any) => {
      const matchesSearch = !params.search
        || option.label.toLowerCase().includes(params.search.toLowerCase())
      const matchesFilters = !params.filters || Object.entries(params.filters).every(([key, expected]) => {
        const meta = option.meta
        if (!meta || typeof meta !== 'object') {
          return false
        }

        return String((meta as Record<string, unknown>)[key]) === String(expected)
      })

      return matchesSearch && matchesFilters
    })

    const startIndex = params.cursor
      ? filteredOptions.findIndex((option: any) => option.id === params.cursor) + 1
      : 0
    const page = filteredOptions.slice(startIndex, startIndex + pageSize + 1)
    const hasMore = page.length > pageSize
    const items = (hasMore ? page.slice(0, pageSize) : page).map((option: any) => ({
      label: option.label,
      value: option.value,
      meta: option.meta,
    }))

    return {
      items,
      nextCursor: hasMore ? page[pageSize - 1]?.id ?? null : null,
    }
  }

  // ── Analytics and Experiments ─────────────────────────────────────────

  async trackAnalyticsEvent(event: ServerFormAnalyticsEvent): Promise<void> {
    if (!this.prisma.dfeAnalyticsEvent?.create) {
      return
    }

    await this.prisma.dfeAnalyticsEvent.create({
      data: {
        tenantId: event.tenantId ?? null,
        formId: event.formId,
        submissionId: event.submissionId ?? null,
        event: event.event,
        stepId: event.stepId ?? null,
        fieldKey: event.fieldKey ?? null,
        experimentId: event.experimentId ?? null,
        variantId: event.variantId ?? null,
        variantKey: event.variantKey ?? null,
        metadata: event.metadata ?? null,
        occurredAt: new Date(event.timestamp),
      },
    })
  }

  async listAnalyticsEvents(query?: AnalyticsQuery): Promise<ServerFormAnalyticsEvent[]> {
    if (!this.prisma.dfeAnalyticsEvent?.findMany) {
      return []
    }

    const rows = await this.prisma.dfeAnalyticsEvent.findMany({
      where: buildAnalyticsWhere(query),
      orderBy: { occurredAt: 'asc' },
    })

    return rows.map(mapAnalyticsEvent)
  }

  async getAnalyticsSummary(query?: AnalyticsQuery): Promise<AnalyticsSummary> {
    const events = await this.listAnalyticsEvents(query)
    const totalForms = query?.formId
      ? 1
      : this.prisma.dfeForm?.count
        ? await this.prisma.dfeForm.count({ where: buildTenantWhere({ tenantId: query?.tenantId }) })
        : new Set(events.map((event) => event.formId)).size

    return buildAnalyticsSummary(events, { totalForms })
  }

  async getActiveExperimentForForm(
    formId: string,
    access?: AccessContext,
  ): Promise<FormExperimentRecord | null> {
    if (!this.prisma.dfeExperiment?.findFirst) {
      return null
    }

    const experiment = await this.prisma.dfeExperiment.findFirst({
      where: {
        formId,
        status: 'ACTIVE',
        ...buildTenantWhere(access),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        variants: {
          orderBy: { key: 'asc' },
        },
      },
    })

    return experiment ? mapExperiment(experiment) : null
  }

  // ── Private Helpers ───────────────────────────────────────────────────

  private mapToFormVersion(form: any, version: any): FormVersionRecord {
    return {
      id: form.id,
      tenantId: form.tenantId ?? null,
      slug: form.slug,
      title: form.title,
      description: form.description,
      versionId: version.id,
      status: version.status,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      steps: version.steps.map((step: any): FormStep => ({
        id: step.id,
        versionId: step.versionId,
        title: step.title,
        description: step.description,
        order: step.order,
        conditions: step.conditions,
        config: step.config,
      })),
      fields: version.fields.map((field: any): FormField => ({
        id: field.id,
        versionId: field.versionId,
        stepId: field.stepId,
        sectionId: field.sectionId,
        parentFieldId: field.parentFieldId,
        key: field.key,
        label: field.label,
        description: field.description,
        type: field.type,
        required: field.required,
        order: field.order,
        config: field.config ?? {},
        conditions: field.conditions,
      })),
    }
  }
}
