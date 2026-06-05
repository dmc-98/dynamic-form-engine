import type {
  FormAnalyticsEvent as CoreFormAnalyticsEvent,
  FormField, FormStep, FormValues, StepApiContract,
  FormRuntimeContext, SelectOption,
} from '@dmc--98/dfe-core'

// ─── Database Adapter Interface ─────────────────────────────────────────────

/**
 * Pagination parameters for list queries.
 */
export interface PaginationParams {
  cursor?: string | null
  pageSize: number
  search?: string
  filters?: Record<string, unknown>
}

/**
 * Paginated result set.
 */
export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
  total?: number
}

export interface AccessContext {
  tenantId?: string | null
  userId?: string | null
}

export type ServerFormAnalyticsEvent = Omit<CoreFormAnalyticsEvent, 'event'> & {
  tenantId?: string
  event: CoreFormAnalyticsEvent['event'] | 'variant_assigned'
  experimentId?: string
  variantId?: string
  variantKey?: string
}

/**
 * Minimal form definition record returned from storage.
 */
export interface FormDefinitionRecord {
  id: string
  tenantId?: string | null
  slug: string
  title: string
  description?: string | null
  versionId: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  createdAt: Date
  updatedAt: Date
}

/**
 * Full form version with nested steps and fields.
 */
export interface FormVersionRecord extends FormDefinitionRecord {
  steps: FormStep[]
  fields: FormField[]
}

export interface FormExperimentVariantRecord {
  id: string
  experimentId: string
  key: string
  label: string
  weight: number
  overrides?: Record<string, unknown> | null
}

export interface FormExperimentRecord {
  id: string
  formId: string
  tenantId?: string | null
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  variants: FormExperimentVariantRecord[]
  createdAt: Date
  updatedAt: Date
}

export interface VariantAnalyticsSummary {
  variantId?: string
  variantKey: string
  variantLabel: string
  starts: number
  completions: number
  abandonmentRate: number
  completionRate: number
}

export interface AnalyticsRecentActivity {
  type: string
  description: string
  timestamp: string
}

export interface AnalyticsSummary {
  totalForms: number
  totalSubmissions: number
  totalStarts: number
  totalCompletions: number
  completionRate: number
  abandonmentRate: number
  averageCompletionTimeMs: number
  stepFunnel: Array<{
    stepId: string
    stepTitle: string
    count: number
    dropOff: number
  }>
  fieldErrors: Array<{
    fieldKey: string
    fieldLabel: string
    errorCount: number
  }>
  recentActivity: AnalyticsRecentActivity[]
  variantComparison: VariantAnalyticsSummary[]
}

export interface AnalyticsQuery {
  tenantId?: string | null
  formId?: string
  from?: number
  to?: number
}

/**
 * Form submission record stored in the database.
 */
export interface FormSubmissionRecord {
  id: string
  tenantId?: string | null
  formId: string
  versionId: string
  userId: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  currentStepId?: string | null
  context: FormRuntimeContext
  experimentId?: string | null
  variantId?: string | null
  variantKey?: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Database adapter interface.
 * Implement this interface for your ORM of choice (Prisma, Drizzle, etc.)
 * to connect the DFE server to your database.
 *
 * @example
 * ```ts
 * import { PrismaDatabaseAdapter } from '@dmc--98/dfe-prisma'
 * import { createDfeServer } from '@dmc--98/dfe-server'
 *
 * const db = new PrismaDatabaseAdapter(prismaClient)
 * const server = createDfeServer({ db })
 * ```
 */
export interface DatabaseAdapter {
  // ── Form Definitions ──────────────────────────────────────────────────────

  /** Get a form definition by slug (for runtime rendering) */
  getFormBySlug(slug: string, access?: AccessContext): Promise<FormVersionRecord | null>

  /** Get a form definition by ID */
  getFormById(id: string, access?: AccessContext): Promise<FormVersionRecord | null>

  /** List published forms */
  listForms(params?: PaginationParams, access?: AccessContext): Promise<PaginatedResult<FormDefinitionRecord>>

  // ── Submissions ───────────────────────────────────────────────────────────

  /** Create a new form submission */
  createSubmission(data: {
    tenantId?: string | null
    formId: string
    versionId: string
    userId: string
    context: FormRuntimeContext
    experimentId?: string | null
    variantId?: string | null
    variantKey?: string | null
  }): Promise<FormSubmissionRecord>

  /** Get a submission by ID */
  getSubmission(id: string): Promise<FormSubmissionRecord | null>

  /** Update submission state (step, status, context) */
  updateSubmission(id: string, data: Partial<{
    currentStepId: string | null
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    context: FormRuntimeContext
  }>): Promise<FormSubmissionRecord>

  // ── Dynamic Resource Operations ───────────────────────────────────────────

  /**
   * Execute a step API contract (create/update a resource).
   * This is the core method that performs the actual database write
   * when a step is submitted.
   *
   * **SECURITY WARNING:** If your implementation makes outbound HTTP requests
   * based on `contract.endpoint`, you MUST validate the URL against an allowlist
   * to prevent Server-Side Request Forgery (SSRF). Never allow requests to
   * internal networks (127.0.0.1, 10.x.x.x, 169.254.x.x, etc.) or arbitrary
   * user-controlled URLs. The built-in Prisma/Drizzle adapters use in-memory
   * stores by default and do not make HTTP calls.
   *
   * @param contract - The step's API contract definition
   * @param body - Resolved request body (after fieldMapping + contextToBody)
   * @returns The created/updated record (for responseToContext extraction)
   */
  executeApiContract(
    contract: StepApiContract,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>>

  // ── Dynamic Options ───────────────────────────────────────────────────────

  /** Fetch options for a dynamic SELECT field */
  fetchFieldOptions(
    fieldId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<SelectOption>>

  /** Optional analytics event persistence */
  trackAnalyticsEvent?(event: ServerFormAnalyticsEvent): Promise<void>

  /** Optional analytics event querying */
  listAnalyticsEvents?(query?: AnalyticsQuery): Promise<ServerFormAnalyticsEvent[]>

  /** Optional analytics summary aggregation */
  getAnalyticsSummary?(query?: AnalyticsQuery): Promise<AnalyticsSummary>

  /** Optional submission listing for dashboard and operations surfaces */
  listSubmissions?(query?: {
    tenantId?: string | null
    formId?: string
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    limit?: number
  }): Promise<FormSubmissionRecord[]>

  /** Optional active experiment lookup for a form */
  getActiveExperimentForForm?(formId: string, access?: AccessContext): Promise<FormExperimentRecord | null>
}

// ─── Persistence Adapter Interface ──────────────────────────────────────────

/**
 * Optional persistence adapter for advanced storage needs.
 * Handles file uploads, caching, etc.
 */
export interface PersistenceAdapter {
  /** Upload a file and return a URL */
  uploadFile?(file: {
    name: string
    buffer: Buffer
    mimeType: string
    size: number
  }): Promise<{ url: string; key: string }>

  /** Delete a previously uploaded file */
  deleteFile?(key: string): Promise<void>
}
