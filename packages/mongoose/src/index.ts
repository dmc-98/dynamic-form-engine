import type {
  FormField, FormStep, SelectOption, StepApiContract,
  FormRuntimeContext,
} from '@dmc-98/dfe-core'
import type {
  DatabaseAdapter, PaginationParams, PaginatedResult,
  FormDefinitionRecord, FormVersionRecord, FormSubmissionRecord,
} from '@dmc-98/dfe-server'
import { generateId } from '@dmc-98/dfe-server'

// ─── Types for Mongoose Connection ──────────────────────────────────────────

/**
 * Minimal Mongoose connection interface to avoid hard dependency on mongoose.
 * Your Mongoose models will satisfy this interface.
 */
export interface MongooseLike {
  model(name: string, schema?: any): any
  connection: any
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

// ─── Mongoose Database Adapter ──────────────────────────────────────────────

export interface MongooseAdapterOptions {
  /**
   * Custom API contract executor.
   * If not provided, uses an in-memory model store.
   * Override this for production to write to your actual database collections.
   */
  executeApiContract?: (
    contract: StepApiContract,
    body: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>
}

/**
 * Mongoose implementation of the DatabaseAdapter interface.
 *
 * Manages Form, FormVersion, and Submission collections in MongoDB.
 *
 * @example
 * ```ts
 * import mongoose from 'mongoose'
 * import { MongooseDatabaseAdapter } from '@dmc-98/dfe-mongoose'
 *
 * const conn = await mongoose.connect('mongodb://localhost/dfe')
 * const db = new MongooseDatabaseAdapter(conn)
 * ```
 */
export class MongooseDatabaseAdapter implements DatabaseAdapter {
  private conn: MongooseLike
  private modelStore = new InMemoryModelStore()
  private customExecute?: (
    contract: StepApiContract,
    body: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>

  private formModel: any
  private formVersionModel: any
  private fieldOptionModel: any
  private submissionModel: any

  constructor(conn: MongooseLike, options?: MongooseAdapterOptions) {
    this.conn = conn
    this.customExecute = options?.executeApiContract

    // Initialize models
    this.formModel = this.getOrCreateModel('DfeForm', this.getFormSchema())
    this.formVersionModel = this.getOrCreateModel('DfeFormVersion', this.getFormVersionSchema())
    this.fieldOptionModel = this.getOrCreateModel('DfeFieldOption', this.getFieldOptionSchema())
    this.submissionModel = this.getOrCreateModel('DfeSubmission', this.getSubmissionSchema())
  }

  // ── Schema Definitions ──────────────────────────────────────────────────────

  private getFormSchema(): any {
    // Schema is returned as a plain object to allow lazy initialization
    return {
      id: { type: String, required: true, unique: true },
      slug: { type: String, required: true, unique: true, index: true },
      title: { type: String, required: true },
      description: { type: String, default: null },
      createdAt: { type: Date, default: () => new Date() },
      updatedAt: { type: Date, default: () => new Date() },
    }
  }

  private getFormVersionSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      formId: { type: String, required: true, index: true },
      version: { type: Number, required: true },
      status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
      steps: [{
        id: String,
        versionId: String,
        title: String,
        description: String,
        order: Number,
        conditions: {},
        config: {},
      }],
      fields: [{
        id: String,
        versionId: String,
        stepId: String,
        sectionId: String,
        parentFieldId: String,
        key: String,
        label: String,
        description: String,
        type: String,
        required: Boolean,
        order: Number,
        config: {},
        conditions: {},
      }],
      createdAt: { type: Date, default: () => new Date() },
      updatedAt: { type: Date, default: () => new Date() },
    }
  }

  private getFieldOptionSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      fieldId: { type: String, required: true, index: true },
      label: { type: String, required: true },
      value: { type: String, required: true },
      order: { type: Number, default: 0 },
      meta: {},
    }
  }

  private getSubmissionSchema(): any {
    return {
      id: { type: String, required: true, unique: true },
      formId: { type: String, required: true, index: true },
      versionId: { type: String, required: true },
      userId: { type: String, required: true },
      status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'], default: 'IN_PROGRESS' },
      currentStepId: { type: String, default: null },
      context: { type: Object, default: {} },
      createdAt: { type: Date, default: () => new Date(), index: true },
      updatedAt: { type: Date, default: () => new Date() },
    }
  }

  private getOrCreateModel(name: string, schema: any): any {
    try {
      return this.conn.model(name)
    } catch {
      // Model doesn't exist, create it with schema
      // We need to create a schema object if we have Mongoose available
      const schemaObj = this.buildMongooseSchema(schema)
      return this.conn.model(name, schemaObj)
    }
  }

  private buildMongooseSchema(schemaObj: any): any {
    // This would use mongoose.Schema in a real implementation
    // For now, return the schema definition
    // The actual Mongoose integration will handle this
    return schemaObj
  }

  // ── Form Definitions ──────────────────────────────────────────────────────

  async getFormBySlug(slug: string): Promise<FormVersionRecord | null> {
    const form = await this.formModel.findOne({ slug }).lean()

    if (!form) return null

    const version = await this.formVersionModel.findOne({
      formId: form.id,
      status: 'PUBLISHED',
    }).sort({ version: -1 }).lean()

    if (!version) return null

    return this.mapToFormVersion(form, version)
  }

  async getFormById(id: string): Promise<FormVersionRecord | null> {
    const form = await this.formModel.findOne({ id }).lean()

    if (!form) return null

    const version = await this.formVersionModel.findOne({
      formId: form.id,
      status: 'PUBLISHED',
    }).sort({ version: -1 }).lean()

    if (!version) return null

    return this.mapToFormVersion(form, version)
  }

  async listForms(params?: PaginationParams): Promise<PaginatedResult<FormDefinitionRecord>> {
    const pageSize = params?.pageSize ?? 20
    const query: Record<string, any> = {}

    if (params?.search) {
      query.$or = [
        { title: { $regex: params.search, $options: 'i' } },
        { slug: { $regex: params.search, $options: 'i' } },
      ]
    }

    // Handle cursor-based pagination
    let skip = 0
    if (params?.cursor) {
      const cursorDoc = await this.formModel.findOne({ id: params.cursor }).lean()
      if (cursorDoc) {
        skip = 1
      }
    }

    const forms = await this.formModel
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize + 1)
      .lean()

    const hasMore = forms.length > pageSize
    const items = (hasMore ? forms.slice(0, -1) : forms).map((f: any) => ({
      id: f.id,
      slug: f.slug,
      title: f.title,
      description: f.description,
      versionId: f.versionId ?? '',
      status: f.status ?? 'DRAFT',
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }))

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    }
  }

  // ── Submissions ───────────────────────────────────────────────────────────

  async createSubmission(data: {
    formId: string
    versionId: string
    userId: string
    context: FormRuntimeContext
  }): Promise<FormSubmissionRecord> {
    const submission = await this.submissionModel.create({
      id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return submission.toObject()
  }

  async getSubmission(id: string): Promise<FormSubmissionRecord | null> {
    const submission = await this.submissionModel.findOne({ id }).lean()
    return submission
  }

  async updateSubmission(id: string, data: Partial<{
    currentStepId: string | null
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    context: FormRuntimeContext
  }>): Promise<FormSubmissionRecord> {
    const submission = await this.submissionModel.findOneAndUpdate(
      { id },
      { ...data, updatedAt: new Date() },
      { new: true }
    ).lean()
    return submission
  }

  // ── Dynamic Resource Operations ──────────────────────────────────────────

  async executeApiContract(
    contract: StepApiContract,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // Use custom executor if provided
    if (this.customExecute) {
      return this.customExecute(contract, body)
    }

    // Default: in-memory model store
    const id = (body.id as string) ?? generateId()
    const record: Record<string, unknown> = { id, ...body, updatedAt: new Date().toISOString() }

    if (contract.method === 'POST') {
      record.createdAt = new Date().toISOString()
    }

    this.modelStore.set(contract.resourceName, id, record)
    return record
  }

  // ── Dynamic Options ───────────────────────────────────────────────────────

  async fetchFieldOptions(
    fieldId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<SelectOption>> {
    const pageSize = params.pageSize
    const query: Record<string, any> = { fieldId }

    if (params.search) {
      query.label = { $regex: params.search, $options: 'i' }
    }

    let skip = 0
    if (params.cursor) {
      const cursorDoc = await this.fieldOptionModel.findOne({ id: params.cursor }).lean()
      if (cursorDoc) {
        skip = 1
      }
    }

    const options = await this.fieldOptionModel
      .find(query)
      .sort({ order: 1 })
      .skip(skip)
      .limit(pageSize + 1)
      .lean()

    const hasMore = options.length > pageSize
    const items = (hasMore ? options.slice(0, -1) : options).map((o: any) => ({
      label: o.label,
      value: o.value,
      meta: o.meta,
    }))

    return {
      items,
      nextCursor: hasMore ? options[options.length - 2]?.id ?? null : null,
    }
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private mapToFormVersion(form: any, version: any): FormVersionRecord {
    return {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      versionId: version.id,
      status: version.status,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      steps: (version.steps ?? []).map((s: any): FormStep => ({
        id: s.id,
        versionId: s.versionId,
        title: s.title,
        description: s.description,
        order: s.order,
        conditions: s.conditions,
        config: s.config,
      })),
      fields: (version.fields ?? []).map((f: any): FormField => ({
        id: f.id,
        versionId: f.versionId,
        stepId: f.stepId,
        sectionId: f.sectionId,
        parentFieldId: f.parentFieldId,
        key: f.key,
        label: f.label,
        description: f.description,
        type: f.type,
        required: f.required,
        order: f.order,
        config: f.config ?? {},
        conditions: f.conditions,
      })),
    }
  }
}
