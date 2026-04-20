import { and, asc, desc, eq, gte, ilike, isNull, lte, or } from 'drizzle-orm'
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
import {
  dfeAnalyticsEvents,
  dfeExperimentVariants,
  dfeExperiments,
  dfeFieldOptions,
  dfeFields,
  dfeForms,
  dfeFormVersions,
  dfeSteps,
  dfeSubmissions,
} from './schema'

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Minimal Drizzle database interface.
 * Your Drizzle client (e.g., drizzle(pool)) will satisfy this.
 */
export interface DrizzleLike {
  select: (...args: any[]) => any
  insert: (table: any) => any
  update: (table: any) => any
  delete: (table: any) => any
  query: any
  transaction: (fn: (tx: DrizzleLike) => Promise<any>) => Promise<any>
}

export interface DrizzleAdapterOptions {
  /**
   * Custom API contract executor.
   * If not provided, uses a basic in-memory store.
   */
  executeApiContract?: (
    contract: StepApiContract,
    body: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>
}

function buildTenantConditions(access?: AccessContext): any[] {
  if (access?.tenantId === undefined) {
    return []
  }

  return access.tenantId === null
    ? [isNull(dfeForms.tenantId)]
    : [eq(dfeForms.tenantId, access.tenantId)]
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

// ─── Drizzle Database Adapter ───────────────────────────────────────────────

/**
 * Drizzle ORM implementation of the DatabaseAdapter interface.
 *
 * @example
 * ```ts
 * import { drizzle } from 'drizzle-orm/node-postgres'
 * import { DrizzleDatabaseAdapter } from '@dmc--98/dfe-drizzle'
 *
 * const db = drizzle(pool)
 * const adapter = new DrizzleDatabaseAdapter(db)
 * ```
 */
export class DrizzleDatabaseAdapter implements DatabaseAdapter {
  private db: DrizzleLike
  private modelStore = new Map<string, Map<string, Record<string, unknown>>>()
  private customExecute?: DrizzleAdapterOptions['executeApiContract']

  constructor(db: DrizzleLike, options?: DrizzleAdapterOptions) {
    this.db = db
    this.customExecute = options?.executeApiContract
  }

  // ── Form Definitions ──────────────────────────────────────────────────

  async getFormBySlug(slug: string, access?: AccessContext): Promise<FormVersionRecord | null> {
    const conditions = [
      eq(dfeForms.slug, slug),
      ...buildTenantConditions(access),
    ]

    const forms = await this.db
      .select()
      .from(dfeForms)
      .where(and(...conditions))
      .limit(1)

    if (forms.length === 0) return null
    return this.loadFormVersion(forms[0])
  }

  async getFormById(id: string, access?: AccessContext): Promise<FormVersionRecord | null> {
    const conditions = [
      eq(dfeForms.id, id),
      ...buildTenantConditions(access),
    ]

    const forms = await this.db
      .select()
      .from(dfeForms)
      .where(and(...conditions))
      .limit(1)

    if (forms.length === 0) return null
    return this.loadFormVersion(forms[0])
  }

  async listForms(
    params?: PaginationParams,
    access?: AccessContext,
  ): Promise<PaginatedResult<FormDefinitionRecord>> {
    const pageSize = params?.pageSize ?? 20
    const conditions: any[] = [...buildTenantConditions(access)]

    if (params?.search) {
      conditions.push(
        or(
          ilike(dfeForms.title, `%${params.search}%`),
          ilike(dfeForms.slug, `%${params.search}%`),
        ),
      )
    }

    let query = this.db
      .select()
      .from(dfeForms)
      .orderBy(desc(dfeForms.updatedAt))
      .limit(pageSize + 1)

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const rows = await query
    const hasMore = rows.length > pageSize
    const items = (hasMore ? rows.slice(0, -1) : rows).map((form: any) => ({
      id: form.id,
      tenantId: form.tenantId ?? null,
      slug: form.slug,
      title: form.title,
      description: form.description,
      versionId: '',
      status: 'PUBLISHED' as const,
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
    const [row] = await this.db
      .insert(dfeSubmissions)
      .values(data)
      .returning()

    return row
  }

  async getSubmission(id: string): Promise<FormSubmissionRecord | null> {
    const rows = await this.db
      .select()
      .from(dfeSubmissions)
      .where(eq(dfeSubmissions.id, id))
      .limit(1)

    return rows[0] ?? null
  }

  async updateSubmission(id: string, data: Partial<{
    currentStepId: string | null
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    context: FormRuntimeContext
  }>): Promise<FormSubmissionRecord> {
    const [row] = await this.db
      .update(dfeSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dfeSubmissions.id, id))
      .returning()

    return row
  }

  async listSubmissions(query?: {
    tenantId?: string | null
    formId?: string
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    limit?: number
  }): Promise<FormSubmissionRecord[]> {
    const conditions: any[] = []

    if (query?.tenantId !== undefined) {
      conditions.push(query.tenantId === null
        ? isNull(dfeSubmissions.tenantId)
        : eq(dfeSubmissions.tenantId, query.tenantId))
    }

    if (query?.formId) {
      conditions.push(eq(dfeSubmissions.formId, query.formId))
    }

    if (query?.status) {
      conditions.push(eq(dfeSubmissions.status, query.status))
    }

    let request = this.db
      .select()
      .from(dfeSubmissions)
      .orderBy(desc(dfeSubmissions.createdAt))
      .limit(query?.limit ?? 100)

    if (conditions.length > 0) {
      request = request.where(and(...conditions))
    }

    return request
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
    const record = { id, ...body, updatedAt: new Date().toISOString() }

    if (!this.modelStore.has(contract.resourceName)) {
      this.modelStore.set(contract.resourceName, new Map())
    }
    this.modelStore.get(contract.resourceName)!.set(id, record)

    return record
  }

  // ── Dynamic Options ───────────────────────────────────────────────────

  async fetchFieldOptions(
    fieldId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<SelectOption>> {
    const pageSize = params.pageSize
    const rows = await this.db
      .select()
      .from(dfeFieldOptions)
      .where(eq(dfeFieldOptions.fieldId, fieldId))
      .orderBy(asc(dfeFieldOptions.order))
    const filteredRows = rows.filter((row: any) => {
      const matchesSearch = !params.search
        || row.label.toLowerCase().includes(params.search.toLowerCase())
      const matchesFilters = !params.filters || Object.entries(params.filters).every(([key, expected]) => {
        const meta = row.meta
        if (!meta || typeof meta !== 'object') {
          return false
        }

        return String((meta as Record<string, unknown>)[key]) === String(expected)
      })

      return matchesSearch && matchesFilters
    })

    const startIndex = params.cursor
      ? filteredRows.findIndex((row: any) => row.id === params.cursor) + 1
      : 0
    const page = filteredRows.slice(startIndex, startIndex + pageSize + 1)
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
    await this.db
      .insert(dfeAnalyticsEvents)
      .values({
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
      })
  }

  async listAnalyticsEvents(query?: AnalyticsQuery): Promise<ServerFormAnalyticsEvent[]> {
    const conditions: any[] = []

    if (query?.tenantId !== undefined) {
      conditions.push(query.tenantId === null
        ? isNull(dfeAnalyticsEvents.tenantId)
        : eq(dfeAnalyticsEvents.tenantId, query.tenantId))
    }

    if (query?.formId) {
      conditions.push(eq(dfeAnalyticsEvents.formId, query.formId))
    }

    if (query?.from) {
      conditions.push(gte(dfeAnalyticsEvents.occurredAt, new Date(query.from)))
    }

    if (query?.to) {
      conditions.push(lte(dfeAnalyticsEvents.occurredAt, new Date(query.to)))
    }

    let request = this.db
      .select()
      .from(dfeAnalyticsEvents)
      .orderBy(asc(dfeAnalyticsEvents.occurredAt))

    if (conditions.length > 0) {
      request = request.where(and(...conditions))
    }

    const rows = await request
    return rows.map(mapAnalyticsEvent)
  }

  async getAnalyticsSummary(query?: AnalyticsQuery): Promise<AnalyticsSummary> {
    const events = await this.listAnalyticsEvents(query)
    const totalForms = query?.formId
      ? 1
      : (await this.listForms(
        { pageSize: 500 },
        { tenantId: query?.tenantId },
      )).items.length

    return buildAnalyticsSummary(events, { totalForms })
  }

  async getActiveExperimentForForm(
    formId: string,
    access?: AccessContext,
  ): Promise<FormExperimentRecord | null> {
    const conditions: any[] = [
      eq(dfeExperiments.formId, formId),
      eq(dfeExperiments.status, 'ACTIVE'),
    ]

    if (access?.tenantId !== undefined) {
      conditions.push(access.tenantId === null
        ? isNull(dfeExperiments.tenantId)
        : eq(dfeExperiments.tenantId, access.tenantId))
    }

    const experiments = await this.db
      .select()
      .from(dfeExperiments)
      .where(and(...conditions))
      .orderBy(desc(dfeExperiments.updatedAt))
      .limit(1)

    const experiment = experiments[0]
    if (!experiment) {
      return null
    }

    const variants = await this.db
      .select()
      .from(dfeExperimentVariants)
      .where(eq(dfeExperimentVariants.experimentId, experiment.id))
      .orderBy(asc(dfeExperimentVariants.key))

    return {
      id: experiment.id,
      formId: experiment.formId,
      tenantId: experiment.tenantId ?? null,
      name: experiment.name,
      status: experiment.status,
      createdAt: experiment.createdAt,
      updatedAt: experiment.updatedAt,
      variants: variants.map((variant: any) => ({
        id: variant.id,
        experimentId: variant.experimentId,
        key: variant.key,
        label: variant.label,
        weight: variant.weight,
        overrides: variant.overrides ?? null,
      })),
    }
  }

  // ── Private ───────────────────────────────────────────────────────────

  private async loadFormVersion(form: any): Promise<FormVersionRecord | null> {
    const versions = await this.db
      .select()
      .from(dfeFormVersions)
      .where(
        and(
          eq(dfeFormVersions.formId, form.id),
          eq(dfeFormVersions.status, 'PUBLISHED'),
        ),
      )
      .orderBy(desc(dfeFormVersions.version))
      .limit(1)

    if (versions.length === 0) return null

    const version = versions[0]

    const steps = await this.db
      .select()
      .from(dfeSteps)
      .where(eq(dfeSteps.versionId, version.id))
      .orderBy(asc(dfeSteps.order))

    const fields = await this.db
      .select()
      .from(dfeFields)
      .where(eq(dfeFields.versionId, version.id))
      .orderBy(asc(dfeFields.order))

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
      steps: steps.map((step: any): FormStep => ({
        id: step.id,
        versionId: step.versionId,
        title: step.title,
        description: step.description,
        order: step.order,
        conditions: step.conditions,
        config: step.config,
      })),
      fields: fields.map((field: any): FormField => ({
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
