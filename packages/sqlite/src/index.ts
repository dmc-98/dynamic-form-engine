import type {
  FormField, FormStep, SelectOption, StepApiContract,
  FormRuntimeContext,
} from '@dmc--98/dfe-core'
import type {
  DatabaseAdapter, PaginationParams, PaginatedResult,
  FormDefinitionRecord, FormVersionRecord, FormSubmissionRecord,
} from '@dmc--98/dfe-server'
import { generateId } from '@dmc--98/dfe-server'

// ─── Types for better-sqlite3 ──────────────────────────────────────────────

/**
 * Minimal better-sqlite3 Database interface to avoid hard dependency.
 * Your Database instance will satisfy this interface.
 */
export interface SqliteLike {
  prepare(sql: string): any
  exec(sql: string): void
  transaction<T>(fn: () => T): () => T
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

// ─── SQLite Database Adapter ────────────────────────────────────────────────

export interface SqliteAdapterOptions {
  /**
   * Custom API contract executor.
   * If not provided, uses an in-memory model store.
   * Override this for production to write to your actual database tables.
   */
  executeApiContract?: (
    contract: StepApiContract,
    body: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>

  /**
   * If true, automatically initialize schema on adapter creation.
   * Default: true
   */
  autoInit?: boolean
}

/**
 * SQLite implementation of the DatabaseAdapter interface using better-sqlite3.
 *
 * Uses prepared statements for all queries and supports transactions.
 * Automatically creates schema on first initialization.
 *
 * @example
 * ```ts
 * import Database from 'better-sqlite3'
 * import { SqliteDatabaseAdapter } from '@dmc--98/dfe-sqlite'
 *
 * const db = new Database('dfe.db')
 * const adapter = new SqliteDatabaseAdapter(db)
 * await adapter.initialize()
 * ```
 */
export class SqliteDatabaseAdapter implements DatabaseAdapter {
  private db: SqliteLike
  private modelStore = new InMemoryModelStore()
  private customExecute?: (
    contract: StepApiContract,
    body: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>

  // Prepared statements cache
  private statements: Map<string, any> = new Map()

  constructor(db: SqliteLike, options?: SqliteAdapterOptions) {
    this.db = db
    this.customExecute = options?.executeApiContract

    if (options?.autoInit !== false) {
      this.initialize()
    }
  }

  /**
   * Initialize the database schema.
   * This creates all necessary tables for the form engine.
   */
  async initialize(): Promise<void> {
    // Create tables
    this.db.exec(`
      -- Forms table
      CREATE TABLE IF NOT EXISTS dfe_forms (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_forms_slug ON dfe_forms(slug);
      CREATE INDEX IF NOT EXISTS idx_forms_updated_at ON dfe_forms(updated_at);

      -- Form versions table
      CREATE TABLE IF NOT EXISTS dfe_form_versions (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES dfe_forms(id),
        UNIQUE(form_id, version)
      );

      CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON dfe_form_versions(form_id);
      CREATE INDEX IF NOT EXISTS idx_form_versions_status ON dfe_form_versions(status);

      -- Steps table
      CREATE TABLE IF NOT EXISTS dfe_steps (
        id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        "order" INTEGER NOT NULL,
        conditions TEXT,
        config TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (version_id) REFERENCES dfe_form_versions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_steps_version_id ON dfe_steps(version_id);

      -- Fields table
      CREATE TABLE IF NOT EXISTS dfe_fields (
        id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        section_id TEXT,
        parent_field_id TEXT,
        key TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        required BOOLEAN NOT NULL DEFAULT 0,
        "order" INTEGER NOT NULL,
        config TEXT,
        conditions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (version_id) REFERENCES dfe_form_versions(id),
        FOREIGN KEY (step_id) REFERENCES dfe_steps(id)
      );

      CREATE INDEX IF NOT EXISTS idx_fields_version_id ON dfe_fields(version_id);
      CREATE INDEX IF NOT EXISTS idx_fields_step_id ON dfe_fields(step_id);

      -- Field options table
      CREATE TABLE IF NOT EXISTS dfe_field_options (
        id TEXT PRIMARY KEY,
        field_id TEXT NOT NULL,
        label TEXT NOT NULL,
        value TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        meta TEXT,
        FOREIGN KEY (field_id) REFERENCES dfe_fields(id)
      );

      CREATE INDEX IF NOT EXISTS idx_field_options_field_id ON dfe_field_options(field_id);

      -- Submissions table
      CREATE TABLE IF NOT EXISTS dfe_submissions (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        version_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        current_step_id TEXT,
        context TEXT NOT NULL DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES dfe_forms(id),
        FOREIGN KEY (version_id) REFERENCES dfe_form_versions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON dfe_submissions(form_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON dfe_submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON dfe_submissions(created_at);
    `)
  }

  // ── Helper Methods ────────────────────────────────────────────────────────

  private prepare(sql: string): any {
    if (!this.statements.has(sql)) {
      this.statements.set(sql, this.db.prepare(sql))
    }
    return this.statements.get(sql)
  }

  private jsonSerialize(obj: any): string {
    return JSON.stringify(obj)
  }

  private jsonParse(str: string): any {
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }

  // ── Form Definitions ──────────────────────────────────────────────────────

  async getFormBySlug(slug: string): Promise<FormVersionRecord | null> {
    const stmt = this.prepare(`
      SELECT f.*, fv.id as version_id, fv.status
      FROM dfe_forms f
      LEFT JOIN dfe_form_versions fv ON f.id = fv.form_id AND fv.status = 'PUBLISHED'
      WHERE f.slug = ?
      LIMIT 1
    `)

    const form = stmt.get(slug) as any
    if (!form) return null

    // Fetch version details
    const versionStmt = this.prepare(`
      SELECT * FROM dfe_form_versions WHERE id = ?
    `)
    const version = versionStmt.get(form.version_id) as any
    if (!version) return null

    return this.mapToFormVersion(form, version)
  }

  async getFormById(id: string): Promise<FormVersionRecord | null> {
    const stmt = this.prepare(`
      SELECT f.*, fv.id as version_id, fv.status
      FROM dfe_forms f
      LEFT JOIN dfe_form_versions fv ON f.id = fv.form_id AND fv.status = 'PUBLISHED'
      WHERE f.id = ?
      LIMIT 1
    `)

    const form = stmt.get(id) as any
    if (!form) return null

    // Fetch version details
    const versionStmt = this.prepare(`
      SELECT * FROM dfe_form_versions WHERE id = ?
    `)
    const version = versionStmt.get(form.version_id) as any
    if (!version) return null

    return this.mapToFormVersion(form, version)
  }

  async listForms(params?: PaginationParams): Promise<PaginatedResult<FormDefinitionRecord>> {
    const pageSize = params?.pageSize ?? 20
    let whereClause = '1 = 1'
    const bindParams: any[] = []

    if (params?.search) {
      whereClause += ` AND (f.title LIKE ? OR f.slug LIKE ?)`
      const searchTerm = `%${params.search}%`
      bindParams.push(searchTerm, searchTerm)
    }

    // Handle cursor-based pagination
    if (params?.cursor) {
      whereClause += ` AND f.updated_at < (SELECT updated_at FROM dfe_forms WHERE id = ?)`
      bindParams.push(params.cursor)
    }

    const stmt = this.prepare(`
      SELECT f.id, f.slug, f.title, f.description, f.created_at, f.updated_at,
             fv.id as version_id, fv.status
      FROM dfe_forms f
      LEFT JOIN dfe_form_versions fv ON f.id = fv.form_id AND fv.status = 'PUBLISHED'
      WHERE ${whereClause}
      ORDER BY f.updated_at DESC
      LIMIT ?
    `)

    bindParams.push(pageSize + 1)
    const forms = stmt.all(...bindParams) as any[]

    const hasMore = forms.length > pageSize
    const items = (hasMore ? forms.slice(0, -1) : forms).map((f: any) => ({
      id: f.id,
      slug: f.slug,
      title: f.title,
      description: f.description,
      versionId: f.version_id ?? '',
      status: f.status ?? 'DRAFT',
      createdAt: new Date(f.created_at),
      updatedAt: new Date(f.updated_at),
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
    const id = generateId()
    const now = new Date().toISOString()

    const stmt = this.prepare(`
      INSERT INTO dfe_submissions (id, form_id, version_id, user_id, context, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.formId,
      data.versionId,
      data.userId,
      this.jsonSerialize(data.context),
      now,
      now
    )

    return {
      id,
      formId: data.formId,
      versionId: data.versionId,
      userId: data.userId,
      status: 'IN_PROGRESS',
      currentStepId: null,
      context: data.context,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }
  }

  async getSubmission(id: string): Promise<FormSubmissionRecord | null> {
    const stmt = this.prepare(`
      SELECT * FROM dfe_submissions WHERE id = ?
    `)

    const submission = stmt.get(id) as any
    if (!submission) return null

    return {
      id: submission.id,
      formId: submission.form_id,
      versionId: submission.version_id,
      userId: submission.user_id,
      status: submission.status,
      currentStepId: submission.current_step_id,
      context: this.jsonParse(submission.context),
      createdAt: new Date(submission.created_at),
      updatedAt: new Date(submission.updated_at),
    }
  }

  async updateSubmission(id: string, data: Partial<{
    currentStepId: string | null
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    context: FormRuntimeContext
  }>): Promise<FormSubmissionRecord> {
    const updates: string[] = []
    const params: any[] = []

    if (data.currentStepId !== undefined) {
      updates.push('current_step_id = ?')
      params.push(data.currentStepId)
    }

    if (data.status !== undefined) {
      updates.push('status = ?')
      params.push(data.status)
    }

    if (data.context !== undefined) {
      updates.push('context = ?')
      params.push(this.jsonSerialize(data.context))
    }

    updates.push('updated_at = ?')
    params.push(new Date().toISOString())

    params.push(id)

    const stmt = this.prepare(`
      UPDATE dfe_submissions SET ${updates.join(', ')} WHERE id = ?
    `)

    stmt.run(...params)

    return this.getSubmission(id) as Promise<FormSubmissionRecord>
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
    let whereClause = 'field_id = ?'
    const bindParams: any[] = [fieldId]

    if (params.search) {
      whereClause += ` AND label LIKE ?`
      bindParams.push(`%${params.search}%`)
    }

    // Handle cursor-based pagination
    if (params.cursor) {
      whereClause += ` AND id < (SELECT id FROM dfe_field_options WHERE id = ?)`
      bindParams.push(params.cursor)
    }

    const stmt = this.prepare(`
      SELECT id, label, value, meta FROM dfe_field_options
      WHERE ${whereClause}
      ORDER BY "order" ASC
      LIMIT ?
    `)

    bindParams.push(pageSize + 1)
    const options = stmt.all(...bindParams) as any[]

    const hasMore = options.length > pageSize
    const items = (hasMore ? options.slice(0, -1) : options).map((o: any) => ({
      label: o.label,
      value: o.value,
      meta: this.jsonParse(o.meta),
    }))

    return {
      items,
      nextCursor: hasMore ? options[options.length - 2]?.id ?? null : null,
    }
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private async mapToFormVersion(form: any, version: any): Promise<FormVersionRecord> {
    // Fetch steps
    const stepsStmt = this.prepare(`
      SELECT * FROM dfe_steps WHERE version_id = ? ORDER BY "order" ASC
    `)
    const steps = stepsStmt.all(version.id) as any[]

    // Fetch fields
    const fieldsStmt = this.prepare(`
      SELECT * FROM dfe_fields WHERE version_id = ? ORDER BY "order" ASC
    `)
    const fields = fieldsStmt.all(version.id) as any[]

    return {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      versionId: version.id,
      status: version.status,
      createdAt: new Date(form.created_at),
      updatedAt: new Date(form.updated_at),
      steps: steps.map((s: any): FormStep => ({
        id: s.id,
        versionId: s.version_id,
        title: s.title,
        description: s.description,
        order: s.order,
        conditions: this.jsonParse(s.conditions),
        config: this.jsonParse(s.config),
      })),
      fields: fields.map((f: any): FormField => ({
        id: f.id,
        versionId: f.version_id,
        stepId: f.step_id,
        sectionId: f.section_id,
        parentFieldId: f.parent_field_id,
        key: f.key,
        label: f.label,
        description: f.description,
        type: f.type,
        required: f.required === 1,
        order: f.order,
        config: this.jsonParse(f.config) ?? {},
        conditions: this.jsonParse(f.conditions),
      })),
    }
  }
}
