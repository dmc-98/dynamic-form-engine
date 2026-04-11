"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteDatabaseAdapter = exports.InMemoryModelStore = void 0;
const dfe_server_1 = require("@dmc-98/dfe-server");
// ─── In-Memory Model Store (for API Contract execution) ─────────────────────
/**
 * Simple in-memory model store for dynamic resource operations.
 * This is used by the adapter to execute API contracts that create/update
 * resources via the form engine.
 *
 * For production use, extend this with a real database or replace
 * executeApiContract with your own implementation.
 */
class InMemoryModelStore {
    constructor() {
        this.store = new Map();
    }
    get(resource, id) {
        var _a;
        return (_a = this.store.get(resource)) === null || _a === void 0 ? void 0 : _a.get(id);
    }
    set(resource, id, data) {
        if (!this.store.has(resource)) {
            this.store.set(resource, new Map());
        }
        this.store.get(resource).set(id, data);
    }
    getAll(resource) {
        const map = this.store.get(resource);
        return map ? Array.from(map.values()) : [];
    }
    clear() {
        this.store.clear();
    }
}
exports.InMemoryModelStore = InMemoryModelStore;
/**
 * SQLite implementation of the DatabaseAdapter interface using better-sqlite3.
 *
 * Uses prepared statements for all queries and supports transactions.
 * Automatically creates schema on first initialization.
 *
 * @example
 * ```ts
 * import Database from 'better-sqlite3'
 * import { SqliteDatabaseAdapter } from '@dmc-98/dfe-sqlite'
 *
 * const db = new Database('dfe.db')
 * const adapter = new SqliteDatabaseAdapter(db)
 * await adapter.initialize()
 * ```
 */
class SqliteDatabaseAdapter {
    constructor(db, options) {
        this.modelStore = new InMemoryModelStore();
        // Prepared statements cache
        this.statements = new Map();
        this.db = db;
        this.customExecute = options === null || options === void 0 ? void 0 : options.executeApiContract;
        if ((options === null || options === void 0 ? void 0 : options.autoInit) !== false) {
            this.initialize();
        }
    }
    /**
     * Initialize the database schema.
     * This creates all necessary tables for the form engine.
     */
    async initialize() {
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
    `);
    }
    // ── Helper Methods ────────────────────────────────────────────────────────
    prepare(sql) {
        if (!this.statements.has(sql)) {
            this.statements.set(sql, this.db.prepare(sql));
        }
        return this.statements.get(sql);
    }
    jsonSerialize(obj) {
        return JSON.stringify(obj);
    }
    jsonParse(str) {
        try {
            return JSON.parse(str);
        }
        catch (_a) {
            return null;
        }
    }
    // ── Form Definitions ──────────────────────────────────────────────────────
    async getFormBySlug(slug) {
        const stmt = this.prepare(`
      SELECT f.*, fv.id as version_id, fv.status
      FROM dfe_forms f
      LEFT JOIN dfe_form_versions fv ON f.id = fv.form_id AND fv.status = 'PUBLISHED'
      WHERE f.slug = ?
      LIMIT 1
    `);
        const form = stmt.get(slug);
        if (!form)
            return null;
        // Fetch version details
        const versionStmt = this.prepare(`
      SELECT * FROM dfe_form_versions WHERE id = ?
    `);
        const version = versionStmt.get(form.version_id);
        if (!version)
            return null;
        return this.mapToFormVersion(form, version);
    }
    async getFormById(id) {
        const stmt = this.prepare(`
      SELECT f.*, fv.id as version_id, fv.status
      FROM dfe_forms f
      LEFT JOIN dfe_form_versions fv ON f.id = fv.form_id AND fv.status = 'PUBLISHED'
      WHERE f.id = ?
      LIMIT 1
    `);
        const form = stmt.get(id);
        if (!form)
            return null;
        // Fetch version details
        const versionStmt = this.prepare(`
      SELECT * FROM dfe_form_versions WHERE id = ?
    `);
        const version = versionStmt.get(form.version_id);
        if (!version)
            return null;
        return this.mapToFormVersion(form, version);
    }
    async listForms(params) {
        var _a, _b, _c;
        const pageSize = (_a = params === null || params === void 0 ? void 0 : params.pageSize) !== null && _a !== void 0 ? _a : 20;
        let whereClause = '1 = 1';
        const bindParams = [];
        if (params === null || params === void 0 ? void 0 : params.search) {
            whereClause += ` AND (f.title LIKE ? OR f.slug LIKE ?)`;
            const searchTerm = `%${params.search}%`;
            bindParams.push(searchTerm, searchTerm);
        }
        // Handle cursor-based pagination
        if (params === null || params === void 0 ? void 0 : params.cursor) {
            whereClause += ` AND f.updated_at < (SELECT updated_at FROM dfe_forms WHERE id = ?)`;
            bindParams.push(params.cursor);
        }
        const stmt = this.prepare(`
      SELECT f.id, f.slug, f.title, f.description, f.created_at, f.updated_at,
             fv.id as version_id, fv.status
      FROM dfe_forms f
      LEFT JOIN dfe_form_versions fv ON f.id = fv.form_id AND fv.status = 'PUBLISHED'
      WHERE ${whereClause}
      ORDER BY f.updated_at DESC
      LIMIT ?
    `);
        bindParams.push(pageSize + 1);
        const forms = stmt.all(...bindParams);
        const hasMore = forms.length > pageSize;
        const items = (hasMore ? forms.slice(0, -1) : forms).map((f) => {
            var _a, _b;
            return ({
                id: f.id,
                slug: f.slug,
                title: f.title,
                description: f.description,
                versionId: (_a = f.version_id) !== null && _a !== void 0 ? _a : '',
                status: (_b = f.status) !== null && _b !== void 0 ? _b : 'DRAFT',
                createdAt: new Date(f.created_at),
                updatedAt: new Date(f.updated_at),
            });
        });
        return {
            items,
            nextCursor: hasMore ? (_c = (_b = items[items.length - 1]) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null : null,
        };
    }
    // ── Submissions ───────────────────────────────────────────────────────────
    async createSubmission(data) {
        const id = (0, dfe_server_1.generateId)();
        const now = new Date().toISOString();
        const stmt = this.prepare(`
      INSERT INTO dfe_submissions (id, form_id, version_id, user_id, context, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, data.formId, data.versionId, data.userId, this.jsonSerialize(data.context), now, now);
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
        };
    }
    async getSubmission(id) {
        const stmt = this.prepare(`
      SELECT * FROM dfe_submissions WHERE id = ?
    `);
        const submission = stmt.get(id);
        if (!submission)
            return null;
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
        };
    }
    async updateSubmission(id, data) {
        const updates = [];
        const params = [];
        if (data.currentStepId !== undefined) {
            updates.push('current_step_id = ?');
            params.push(data.currentStepId);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            params.push(data.status);
        }
        if (data.context !== undefined) {
            updates.push('context = ?');
            params.push(this.jsonSerialize(data.context));
        }
        updates.push('updated_at = ?');
        params.push(new Date().toISOString());
        params.push(id);
        const stmt = this.prepare(`
      UPDATE dfe_submissions SET ${updates.join(', ')} WHERE id = ?
    `);
        stmt.run(...params);
        return this.getSubmission(id);
    }
    // ── Dynamic Resource Operations ──────────────────────────────────────────
    async executeApiContract(contract, body) {
        var _a;
        // Use custom executor if provided
        if (this.customExecute) {
            return this.customExecute(contract, body);
        }
        // Default: in-memory model store
        const id = (_a = body.id) !== null && _a !== void 0 ? _a : (0, dfe_server_1.generateId)();
        const record = { id, ...body, updatedAt: new Date().toISOString() };
        if (contract.method === 'POST') {
            record.createdAt = new Date().toISOString();
        }
        this.modelStore.set(contract.resourceName, id, record);
        return record;
    }
    // ── Dynamic Options ───────────────────────────────────────────────────────
    async fetchFieldOptions(fieldId, params) {
        var _a, _b;
        const pageSize = params.pageSize;
        let whereClause = 'field_id = ?';
        const bindParams = [fieldId];
        if (params.search) {
            whereClause += ` AND label LIKE ?`;
            bindParams.push(`%${params.search}%`);
        }
        // Handle cursor-based pagination
        if (params.cursor) {
            whereClause += ` AND id < (SELECT id FROM dfe_field_options WHERE id = ?)`;
            bindParams.push(params.cursor);
        }
        const stmt = this.prepare(`
      SELECT id, label, value, meta FROM dfe_field_options
      WHERE ${whereClause}
      ORDER BY "order" ASC
      LIMIT ?
    `);
        bindParams.push(pageSize + 1);
        const options = stmt.all(...bindParams);
        const hasMore = options.length > pageSize;
        const items = (hasMore ? options.slice(0, -1) : options).map((o) => ({
            label: o.label,
            value: o.value,
            meta: this.jsonParse(o.meta),
        }));
        return {
            items,
            nextCursor: hasMore ? (_b = (_a = options[options.length - 2]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null : null,
        };
    }
    // ── Private Helpers ────────────────────────────────────────────────────────
    async mapToFormVersion(form, version) {
        // Fetch steps
        const stepsStmt = this.prepare(`
      SELECT * FROM dfe_steps WHERE version_id = ? ORDER BY "order" ASC
    `);
        const steps = stepsStmt.all(version.id);
        // Fetch fields
        const fieldsStmt = this.prepare(`
      SELECT * FROM dfe_fields WHERE version_id = ? ORDER BY "order" ASC
    `);
        const fields = fieldsStmt.all(version.id);
        return {
            id: form.id,
            slug: form.slug,
            title: form.title,
            description: form.description,
            versionId: version.id,
            status: version.status,
            createdAt: new Date(form.created_at),
            updatedAt: new Date(form.updated_at),
            steps: steps.map((s) => ({
                id: s.id,
                versionId: s.version_id,
                title: s.title,
                description: s.description,
                order: s.order,
                conditions: this.jsonParse(s.conditions),
                config: this.jsonParse(s.config),
            })),
            fields: fields.map((f) => {
                var _a;
                return ({
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
                    config: (_a = this.jsonParse(f.config)) !== null && _a !== void 0 ? _a : {},
                    conditions: this.jsonParse(f.conditions),
                });
            }),
        };
    }
}
exports.SqliteDatabaseAdapter = SqliteDatabaseAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFRQSxzREFBa0Q7QUFjbEQsK0VBQStFO0FBRS9FOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLGtCQUFrQjtJQUEvQjtRQUNVLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBZ0QsQ0FBQTtJQXFCekUsQ0FBQztJQW5CQyxHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFVOztRQUM5QixPQUFPLE1BQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDBDQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUMxQyxDQUFDO0lBRUQsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBVSxFQUFFLElBQTZCO1FBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDckMsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDekMsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFnQjtRQUNyQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNwQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBQzVDLENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUNwQixDQUFDO0NBQ0Y7QUF0QkQsZ0RBc0JDO0FBc0JEOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUNILE1BQWEscUJBQXFCO0lBV2hDLFlBQVksRUFBYyxFQUFFLE9BQThCO1FBVGxELGVBQVUsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUE7UUFNN0MsNEJBQTRCO1FBQ3BCLGVBQVUsR0FBcUIsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUc5QyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUNaLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLGtCQUFrQixDQUFBO1FBRWhELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsUUFBUSxNQUFLLEtBQUssRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtRQUNuQixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxVQUFVO1FBQ2QsZ0JBQWdCO1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQWtHWixDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsNkVBQTZFO0lBRXJFLE9BQU8sQ0FBQyxHQUFXO1FBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ2hELENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ2pDLENBQUM7SUFFTyxhQUFhLENBQUMsR0FBUTtRQUM1QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDNUIsQ0FBQztJQUVPLFNBQVMsQ0FBQyxHQUFXO1FBQzNCLElBQUksQ0FBQztZQUNILE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUN4QixDQUFDO1FBQUMsV0FBTSxDQUFDO1lBQ1AsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDO0lBQ0gsQ0FBQztJQUVELDZFQUE2RTtJQUU3RSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQVk7UUFDOUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7Ozs7O0tBTXpCLENBQUMsQ0FBQTtRQUVGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFRLENBQUE7UUFDbEMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPLElBQUksQ0FBQTtRQUV0Qix3QkFBd0I7UUFDeEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7S0FFaEMsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFRLENBQUE7UUFDdkQsSUFBSSxDQUFDLE9BQU87WUFBRSxPQUFPLElBQUksQ0FBQTtRQUV6QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBVTtRQUMxQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDOzs7Ozs7S0FNekIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVEsQ0FBQTtRQUNoQyxJQUFJLENBQUMsSUFBSTtZQUFFLE9BQU8sSUFBSSxDQUFBO1FBRXRCLHdCQUF3QjtRQUN4QixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDOztLQUVoQyxDQUFDLENBQUE7UUFDRixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQVEsQ0FBQTtRQUN2RCxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU8sSUFBSSxDQUFBO1FBRXpCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUM3QyxDQUFDO0lBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUF5Qjs7UUFDdkMsTUFBTSxRQUFRLEdBQUcsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsUUFBUSxtQ0FBSSxFQUFFLENBQUE7UUFDdkMsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFBO1FBQ3pCLE1BQU0sVUFBVSxHQUFVLEVBQUUsQ0FBQTtRQUU1QixJQUFJLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxNQUFNLEVBQUUsQ0FBQztZQUNuQixXQUFXLElBQUksd0NBQXdDLENBQUE7WUFDdkQsTUFBTSxVQUFVLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUE7WUFDdkMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDekMsQ0FBQztRQUVELGlDQUFpQztRQUNqQyxJQUFJLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxNQUFNLEVBQUUsQ0FBQztZQUNuQixXQUFXLElBQUkscUVBQXFFLENBQUE7WUFDcEYsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDaEMsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7Ozs7O2NBS2hCLFdBQVc7OztLQUdwQixDQUFDLENBQUE7UUFFRixVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUM3QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFVLENBQUE7UUFFOUMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUE7UUFDdkMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFOztZQUFDLE9BQUEsQ0FBQztnQkFDcEUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUNSLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtnQkFDWixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7Z0JBQ2QsV0FBVyxFQUFFLENBQUMsQ0FBQyxXQUFXO2dCQUMxQixTQUFTLEVBQUUsTUFBQSxDQUFDLENBQUMsVUFBVSxtQ0FBSSxFQUFFO2dCQUM3QixNQUFNLEVBQUUsTUFBQSxDQUFDLENBQUMsTUFBTSxtQ0FBSSxPQUFPO2dCQUMzQixTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDakMsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7YUFDbEMsQ0FBQyxDQUFBO1NBQUEsQ0FBQyxDQUFBO1FBRUgsT0FBTztZQUNMLEtBQUs7WUFDTCxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFBLE1BQUEsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLDBDQUFFLEVBQUUsbUNBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO1NBQ2pFLENBQUE7SUFDSCxDQUFDO0lBRUQsNkVBQTZFO0lBRTdFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUt0QjtRQUNDLE1BQU0sRUFBRSxHQUFHLElBQUEsdUJBQVUsR0FBRSxDQUFBO1FBQ3ZCLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFFcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7O0tBR3pCLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxHQUFHLENBQ04sRUFBRSxFQUNGLElBQUksQ0FBQyxNQUFNLEVBQ1gsSUFBSSxDQUFDLFNBQVMsRUFDZCxJQUFJLENBQUMsTUFBTSxFQUNYLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUNoQyxHQUFHLEVBQ0gsR0FBRyxDQUNKLENBQUE7UUFFRCxPQUFPO1lBQ0wsRUFBRTtZQUNGLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDekIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLE1BQU0sRUFBRSxhQUFhO1lBQ3JCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztZQUNyQixTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3hCLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUM7U0FDekIsQ0FBQTtJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQVU7UUFDNUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7S0FFekIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVEsQ0FBQTtRQUN0QyxJQUFJLENBQUMsVUFBVTtZQUFFLE9BQU8sSUFBSSxDQUFBO1FBRTVCLE9BQU87WUFDTCxFQUFFLEVBQUUsVUFBVSxDQUFDLEVBQUU7WUFDakIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxPQUFPO1lBQzFCLFNBQVMsRUFBRSxVQUFVLENBQUMsVUFBVTtZQUNoQyxNQUFNLEVBQUUsVUFBVSxDQUFDLE9BQU87WUFDMUIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO1lBQ3pCLGFBQWEsRUFBRSxVQUFVLENBQUMsZUFBZTtZQUN6QyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQzNDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDO1lBQzFDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDO1NBQzNDLENBQUE7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQVUsRUFBRSxJQUlqQztRQUNBLE1BQU0sT0FBTyxHQUFhLEVBQUUsQ0FBQTtRQUM1QixNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUE7UUFFeEIsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQTtZQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUNqQyxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDMUIsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMvQixPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtRQUMvQyxDQUFDO1FBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFBO1FBRXJDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFZixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO21DQUNLLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0tBQ2hELENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQTtRQUVuQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFrQyxDQUFBO0lBQ2hFLENBQUM7SUFFRCw0RUFBNEU7SUFFNUUsS0FBSyxDQUFDLGtCQUFrQixDQUN0QixRQUF5QixFQUN6QixJQUE2Qjs7UUFFN0Isa0NBQWtDO1FBQ2xDLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDM0MsQ0FBQztRQUVELGlDQUFpQztRQUNqQyxNQUFNLEVBQUUsR0FBRyxNQUFDLElBQUksQ0FBQyxFQUFhLG1DQUFJLElBQUEsdUJBQVUsR0FBRSxDQUFBO1FBQzlDLE1BQU0sTUFBTSxHQUE0QixFQUFFLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFBO1FBRTVGLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQUUsQ0FBQztZQUMvQixNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDN0MsQ0FBQztRQUVELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3RELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVELDZFQUE2RTtJQUU3RSxLQUFLLENBQUMsaUJBQWlCLENBQ3JCLE9BQWUsRUFDZixNQUF3Qjs7UUFFeEIsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQTtRQUNoQyxJQUFJLFdBQVcsR0FBRyxjQUFjLENBQUE7UUFDaEMsTUFBTSxVQUFVLEdBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUVuQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNsQixXQUFXLElBQUksbUJBQW1CLENBQUE7WUFDbEMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO1FBQ3ZDLENBQUM7UUFFRCxpQ0FBaUM7UUFDakMsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbEIsV0FBVyxJQUFJLDJEQUEyRCxDQUFBO1lBQzFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ2hDLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDOztjQUVoQixXQUFXOzs7S0FHcEIsQ0FBQyxDQUFBO1FBRUYsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBVSxDQUFBO1FBRWhELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFBO1FBQ3pDLE1BQU0sS0FBSyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEUsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLO1lBQ2QsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLO1lBQ2QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztTQUM3QixDQUFDLENBQUMsQ0FBQTtRQUVILE9BQU87WUFDTCxLQUFLO1lBQ0wsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBQSxNQUFBLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQywwQ0FBRSxFQUFFLG1DQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSTtTQUNyRSxDQUFBO0lBQ0gsQ0FBQztJQUVELDhFQUE4RTtJQUV0RSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBUyxFQUFFLE9BQVk7UUFDcEQsY0FBYztRQUNkLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7O0tBRTlCLENBQUMsQ0FBQTtRQUNGLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBVSxDQUFBO1FBRWhELGVBQWU7UUFDZixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDOztLQUUvQixDQUFDLENBQUE7UUFDRixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQVUsQ0FBQTtRQUVsRCxPQUFPO1lBQ0wsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDckIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3BDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3BDLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBTSxFQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUN0QyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ1IsU0FBUyxFQUFFLENBQUMsQ0FBQyxVQUFVO2dCQUN2QixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7Z0JBQ2QsV0FBVyxFQUFFLENBQUMsQ0FBQyxXQUFXO2dCQUMxQixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7Z0JBQ2QsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDeEMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQzthQUNqQyxDQUFDLENBQUM7WUFDSCxNQUFNLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQU0sRUFBYSxFQUFFOztnQkFBQyxPQUFBLENBQUM7b0JBQ3pDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDUixTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQVU7b0JBQ3ZCLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTztvQkFDakIsU0FBUyxFQUFFLENBQUMsQ0FBQyxVQUFVO29CQUN2QixhQUFhLEVBQUUsQ0FBQyxDQUFDLGVBQWU7b0JBQ2hDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRztvQkFDVixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7b0JBQ2QsV0FBVyxFQUFFLENBQUMsQ0FBQyxXQUFXO29CQUMxQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7b0JBQ1osUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssQ0FBQztvQkFDMUIsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLO29CQUNkLE1BQU0sRUFBRSxNQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxtQ0FBSSxFQUFFO29CQUN0QyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO2lCQUN6QyxDQUFDLENBQUE7YUFBQSxDQUFDO1NBQ0osQ0FBQTtJQUNILENBQUM7Q0FDRjtBQXhjRCxzREF3Y0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEZvcm1GaWVsZCwgRm9ybVN0ZXAsIFNlbGVjdE9wdGlvbiwgU3RlcEFwaUNvbnRyYWN0LFxuICBGb3JtUnVudGltZUNvbnRleHQsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5pbXBvcnQgdHlwZSB7XG4gIERhdGFiYXNlQWRhcHRlciwgUGFnaW5hdGlvblBhcmFtcywgUGFnaW5hdGVkUmVzdWx0LFxuICBGb3JtRGVmaW5pdGlvblJlY29yZCwgRm9ybVZlcnNpb25SZWNvcmQsIEZvcm1TdWJtaXNzaW9uUmVjb3JkLFxufSBmcm9tICdAc25hcmp1bjk4L2RmZS1zZXJ2ZXInXG5pbXBvcnQgeyBnZW5lcmF0ZUlkIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtc2VydmVyJ1xuXG4vLyDilIDilIDilIAgVHlwZXMgZm9yIGJldHRlci1zcWxpdGUzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4vKipcbiAqIE1pbmltYWwgYmV0dGVyLXNxbGl0ZTMgRGF0YWJhc2UgaW50ZXJmYWNlIHRvIGF2b2lkIGhhcmQgZGVwZW5kZW5jeS5cbiAqIFlvdXIgRGF0YWJhc2UgaW5zdGFuY2Ugd2lsbCBzYXRpc2Z5IHRoaXMgaW50ZXJmYWNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNxbGl0ZUxpa2Uge1xuICBwcmVwYXJlKHNxbDogc3RyaW5nKTogYW55XG4gIGV4ZWMoc3FsOiBzdHJpbmcpOiB2b2lkXG4gIHRyYW5zYWN0aW9uPFQ+KGZuOiAoKSA9PiBUKTogKCkgPT4gVFxufVxuXG4vLyDilIDilIDilIAgSW4tTWVtb3J5IE1vZGVsIFN0b3JlIChmb3IgQVBJIENvbnRyYWN0IGV4ZWN1dGlvbikg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbi8qKlxuICogU2ltcGxlIGluLW1lbW9yeSBtb2RlbCBzdG9yZSBmb3IgZHluYW1pYyByZXNvdXJjZSBvcGVyYXRpb25zLlxuICogVGhpcyBpcyB1c2VkIGJ5IHRoZSBhZGFwdGVyIHRvIGV4ZWN1dGUgQVBJIGNvbnRyYWN0cyB0aGF0IGNyZWF0ZS91cGRhdGVcbiAqIHJlc291cmNlcyB2aWEgdGhlIGZvcm0gZW5naW5lLlxuICpcbiAqIEZvciBwcm9kdWN0aW9uIHVzZSwgZXh0ZW5kIHRoaXMgd2l0aCBhIHJlYWwgZGF0YWJhc2Ugb3IgcmVwbGFjZVxuICogZXhlY3V0ZUFwaUNvbnRyYWN0IHdpdGggeW91ciBvd24gaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBJbk1lbW9yeU1vZGVsU3RvcmUge1xuICBwcml2YXRlIHN0b3JlID0gbmV3IE1hcDxzdHJpbmcsIE1hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+Pj4oKVxuXG4gIGdldChyZXNvdXJjZTogc3RyaW5nLCBpZDogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnN0b3JlLmdldChyZXNvdXJjZSk/LmdldChpZClcbiAgfVxuXG4gIHNldChyZXNvdXJjZTogc3RyaW5nLCBpZDogc3RyaW5nLCBkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xuICAgIGlmICghdGhpcy5zdG9yZS5oYXMocmVzb3VyY2UpKSB7XG4gICAgICB0aGlzLnN0b3JlLnNldChyZXNvdXJjZSwgbmV3IE1hcCgpKVxuICAgIH1cbiAgICB0aGlzLnN0b3JlLmdldChyZXNvdXJjZSkhLnNldChpZCwgZGF0YSlcbiAgfVxuXG4gIGdldEFsbChyZXNvdXJjZTogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSB7XG4gICAgY29uc3QgbWFwID0gdGhpcy5zdG9yZS5nZXQocmVzb3VyY2UpXG4gICAgcmV0dXJuIG1hcCA/IEFycmF5LmZyb20obWFwLnZhbHVlcygpKSA6IFtdXG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLnN0b3JlLmNsZWFyKClcbiAgfVxufVxuXG4vLyDilIDilIDilIAgU1FMaXRlIERhdGFiYXNlIEFkYXB0ZXIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBpbnRlcmZhY2UgU3FsaXRlQWRhcHRlck9wdGlvbnMge1xuICAvKipcbiAgICogQ3VzdG9tIEFQSSBjb250cmFjdCBleGVjdXRvci5cbiAgICogSWYgbm90IHByb3ZpZGVkLCB1c2VzIGFuIGluLW1lbW9yeSBtb2RlbCBzdG9yZS5cbiAgICogT3ZlcnJpZGUgdGhpcyBmb3IgcHJvZHVjdGlvbiB0byB3cml0ZSB0byB5b3VyIGFjdHVhbCBkYXRhYmFzZSB0YWJsZXMuXG4gICAqL1xuICBleGVjdXRlQXBpQ29udHJhY3Q/OiAoXG4gICAgY29udHJhY3Q6IFN0ZXBBcGlDb250cmFjdCxcbiAgICBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKSA9PiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PlxuXG4gIC8qKlxuICAgKiBJZiB0cnVlLCBhdXRvbWF0aWNhbGx5IGluaXRpYWxpemUgc2NoZW1hIG9uIGFkYXB0ZXIgY3JlYXRpb24uXG4gICAqIERlZmF1bHQ6IHRydWVcbiAgICovXG4gIGF1dG9Jbml0PzogYm9vbGVhblxufVxuXG4vKipcbiAqIFNRTGl0ZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgRGF0YWJhc2VBZGFwdGVyIGludGVyZmFjZSB1c2luZyBiZXR0ZXItc3FsaXRlMy5cbiAqXG4gKiBVc2VzIHByZXBhcmVkIHN0YXRlbWVudHMgZm9yIGFsbCBxdWVyaWVzIGFuZCBzdXBwb3J0cyB0cmFuc2FjdGlvbnMuXG4gKiBBdXRvbWF0aWNhbGx5IGNyZWF0ZXMgc2NoZW1hIG9uIGZpcnN0IGluaXRpYWxpemF0aW9uLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IERhdGFiYXNlIGZyb20gJ2JldHRlci1zcWxpdGUzJ1xuICogaW1wb3J0IHsgU3FsaXRlRGF0YWJhc2VBZGFwdGVyIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtc3FsaXRlJ1xuICpcbiAqIGNvbnN0IGRiID0gbmV3IERhdGFiYXNlKCdkZmUuZGInKVxuICogY29uc3QgYWRhcHRlciA9IG5ldyBTcWxpdGVEYXRhYmFzZUFkYXB0ZXIoZGIpXG4gKiBhd2FpdCBhZGFwdGVyLmluaXRpYWxpemUoKVxuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBTcWxpdGVEYXRhYmFzZUFkYXB0ZXIgaW1wbGVtZW50cyBEYXRhYmFzZUFkYXB0ZXIge1xuICBwcml2YXRlIGRiOiBTcWxpdGVMaWtlXG4gIHByaXZhdGUgbW9kZWxTdG9yZSA9IG5ldyBJbk1lbW9yeU1vZGVsU3RvcmUoKVxuICBwcml2YXRlIGN1c3RvbUV4ZWN1dGU/OiAoXG4gICAgY29udHJhY3Q6IFN0ZXBBcGlDb250cmFjdCxcbiAgICBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKSA9PiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PlxuXG4gIC8vIFByZXBhcmVkIHN0YXRlbWVudHMgY2FjaGVcbiAgcHJpdmF0ZSBzdGF0ZW1lbnRzOiBNYXA8c3RyaW5nLCBhbnk+ID0gbmV3IE1hcCgpXG5cbiAgY29uc3RydWN0b3IoZGI6IFNxbGl0ZUxpa2UsIG9wdGlvbnM/OiBTcWxpdGVBZGFwdGVyT3B0aW9ucykge1xuICAgIHRoaXMuZGIgPSBkYlxuICAgIHRoaXMuY3VzdG9tRXhlY3V0ZSA9IG9wdGlvbnM/LmV4ZWN1dGVBcGlDb250cmFjdFxuXG4gICAgaWYgKG9wdGlvbnM/LmF1dG9Jbml0ICE9PSBmYWxzZSkge1xuICAgICAgdGhpcy5pbml0aWFsaXplKClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZGF0YWJhc2Ugc2NoZW1hLlxuICAgKiBUaGlzIGNyZWF0ZXMgYWxsIG5lY2Vzc2FyeSB0YWJsZXMgZm9yIHRoZSBmb3JtIGVuZ2luZS5cbiAgICovXG4gIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gQ3JlYXRlIHRhYmxlc1xuICAgIHRoaXMuZGIuZXhlYyhgXG4gICAgICAtLSBGb3JtcyB0YWJsZVxuICAgICAgQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgZGZlX2Zvcm1zIChcbiAgICAgICAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgICAgICAgc2x1ZyBURVhUIFVOSVFVRSBOT1QgTlVMTCxcbiAgICAgICAgdGl0bGUgVEVYVCBOT1QgTlVMTCxcbiAgICAgICAgZGVzY3JpcHRpb24gVEVYVCxcbiAgICAgICAgY3JlYXRlZF9hdCBEQVRFVElNRSBERUZBVUxUIENVUlJFTlRfVElNRVNUQU1QLFxuICAgICAgICB1cGRhdGVkX2F0IERBVEVUSU1FIERFRkFVTFQgQ1VSUkVOVF9USU1FU1RBTVBcbiAgICAgICk7XG5cbiAgICAgIENSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIGlkeF9mb3Jtc19zbHVnIE9OIGRmZV9mb3JtcyhzbHVnKTtcbiAgICAgIENSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIGlkeF9mb3Jtc191cGRhdGVkX2F0IE9OIGRmZV9mb3Jtcyh1cGRhdGVkX2F0KTtcblxuICAgICAgLS0gRm9ybSB2ZXJzaW9ucyB0YWJsZVxuICAgICAgQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgZGZlX2Zvcm1fdmVyc2lvbnMgKFxuICAgICAgICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICAgICAgICBmb3JtX2lkIFRFWFQgTk9UIE5VTEwsXG4gICAgICAgIHZlcnNpb24gSU5URUdFUiBOT1QgTlVMTCxcbiAgICAgICAgc3RhdHVzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnRFJBRlQnLFxuICAgICAgICBjcmVhdGVkX2F0IERBVEVUSU1FIERFRkFVTFQgQ1VSUkVOVF9USU1FU1RBTVAsXG4gICAgICAgIHVwZGF0ZWRfYXQgREFURVRJTUUgREVGQVVMVCBDVVJSRU5UX1RJTUVTVEFNUCxcbiAgICAgICAgRk9SRUlHTiBLRVkgKGZvcm1faWQpIFJFRkVSRU5DRVMgZGZlX2Zvcm1zKGlkKSxcbiAgICAgICAgVU5JUVVFKGZvcm1faWQsIHZlcnNpb24pXG4gICAgICApO1xuXG4gICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBpZHhfZm9ybV92ZXJzaW9uc19mb3JtX2lkIE9OIGRmZV9mb3JtX3ZlcnNpb25zKGZvcm1faWQpO1xuICAgICAgQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgaWR4X2Zvcm1fdmVyc2lvbnNfc3RhdHVzIE9OIGRmZV9mb3JtX3ZlcnNpb25zKHN0YXR1cyk7XG5cbiAgICAgIC0tIFN0ZXBzIHRhYmxlXG4gICAgICBDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUUyBkZmVfc3RlcHMgKFxuICAgICAgICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICAgICAgICB2ZXJzaW9uX2lkIFRFWFQgTk9UIE5VTEwsXG4gICAgICAgIHRpdGxlIFRFWFQgTk9UIE5VTEwsXG4gICAgICAgIGRlc2NyaXB0aW9uIFRFWFQsXG4gICAgICAgIFwib3JkZXJcIiBJTlRFR0VSIE5PVCBOVUxMLFxuICAgICAgICBjb25kaXRpb25zIFRFWFQsXG4gICAgICAgIGNvbmZpZyBURVhULFxuICAgICAgICBjcmVhdGVkX2F0IERBVEVUSU1FIERFRkFVTFQgQ1VSUkVOVF9USU1FU1RBTVAsXG4gICAgICAgIEZPUkVJR04gS0VZICh2ZXJzaW9uX2lkKSBSRUZFUkVOQ0VTIGRmZV9mb3JtX3ZlcnNpb25zKGlkKVxuICAgICAgKTtcblxuICAgICAgQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgaWR4X3N0ZXBzX3ZlcnNpb25faWQgT04gZGZlX3N0ZXBzKHZlcnNpb25faWQpO1xuXG4gICAgICAtLSBGaWVsZHMgdGFibGVcbiAgICAgIENSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTIGRmZV9maWVsZHMgKFxuICAgICAgICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICAgICAgICB2ZXJzaW9uX2lkIFRFWFQgTk9UIE5VTEwsXG4gICAgICAgIHN0ZXBfaWQgVEVYVCBOT1QgTlVMTCxcbiAgICAgICAgc2VjdGlvbl9pZCBURVhULFxuICAgICAgICBwYXJlbnRfZmllbGRfaWQgVEVYVCxcbiAgICAgICAga2V5IFRFWFQgTk9UIE5VTEwsXG4gICAgICAgIGxhYmVsIFRFWFQgTk9UIE5VTEwsXG4gICAgICAgIGRlc2NyaXB0aW9uIFRFWFQsXG4gICAgICAgIHR5cGUgVEVYVCBOT1QgTlVMTCxcbiAgICAgICAgcmVxdWlyZWQgQk9PTEVBTiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gICAgICAgIFwib3JkZXJcIiBJTlRFR0VSIE5PVCBOVUxMLFxuICAgICAgICBjb25maWcgVEVYVCxcbiAgICAgICAgY29uZGl0aW9ucyBURVhULFxuICAgICAgICBjcmVhdGVkX2F0IERBVEVUSU1FIERFRkFVTFQgQ1VSUkVOVF9USU1FU1RBTVAsXG4gICAgICAgIEZPUkVJR04gS0VZICh2ZXJzaW9uX2lkKSBSRUZFUkVOQ0VTIGRmZV9mb3JtX3ZlcnNpb25zKGlkKSxcbiAgICAgICAgRk9SRUlHTiBLRVkgKHN0ZXBfaWQpIFJFRkVSRU5DRVMgZGZlX3N0ZXBzKGlkKVxuICAgICAgKTtcblxuICAgICAgQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgaWR4X2ZpZWxkc192ZXJzaW9uX2lkIE9OIGRmZV9maWVsZHModmVyc2lvbl9pZCk7XG4gICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBpZHhfZmllbGRzX3N0ZXBfaWQgT04gZGZlX2ZpZWxkcyhzdGVwX2lkKTtcblxuICAgICAgLS0gRmllbGQgb3B0aW9ucyB0YWJsZVxuICAgICAgQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgZGZlX2ZpZWxkX29wdGlvbnMgKFxuICAgICAgICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICAgICAgICBmaWVsZF9pZCBURVhUIE5PVCBOVUxMLFxuICAgICAgICBsYWJlbCBURVhUIE5PVCBOVUxMLFxuICAgICAgICB2YWx1ZSBURVhUIE5PVCBOVUxMLFxuICAgICAgICBcIm9yZGVyXCIgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gICAgICAgIG1ldGEgVEVYVCxcbiAgICAgICAgRk9SRUlHTiBLRVkgKGZpZWxkX2lkKSBSRUZFUkVOQ0VTIGRmZV9maWVsZHMoaWQpXG4gICAgICApO1xuXG4gICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBpZHhfZmllbGRfb3B0aW9uc19maWVsZF9pZCBPTiBkZmVfZmllbGRfb3B0aW9ucyhmaWVsZF9pZCk7XG5cbiAgICAgIC0tIFN1Ym1pc3Npb25zIHRhYmxlXG4gICAgICBDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUUyBkZmVfc3VibWlzc2lvbnMgKFxuICAgICAgICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICAgICAgICBmb3JtX2lkIFRFWFQgTk9UIE5VTEwsXG4gICAgICAgIHZlcnNpb25faWQgVEVYVCBOT1QgTlVMTCxcbiAgICAgICAgdXNlcl9pZCBURVhUIE5PVCBOVUxMLFxuICAgICAgICBzdGF0dXMgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdJTl9QUk9HUkVTUycsXG4gICAgICAgIGN1cnJlbnRfc3RlcF9pZCBURVhULFxuICAgICAgICBjb250ZXh0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAne30nLFxuICAgICAgICBjcmVhdGVkX2F0IERBVEVUSU1FIERFRkFVTFQgQ1VSUkVOVF9USU1FU1RBTVAsXG4gICAgICAgIHVwZGF0ZWRfYXQgREFURVRJTUUgREVGQVVMVCBDVVJSRU5UX1RJTUVTVEFNUCxcbiAgICAgICAgRk9SRUlHTiBLRVkgKGZvcm1faWQpIFJFRkVSRU5DRVMgZGZlX2Zvcm1zKGlkKSxcbiAgICAgICAgRk9SRUlHTiBLRVkgKHZlcnNpb25faWQpIFJFRkVSRU5DRVMgZGZlX2Zvcm1fdmVyc2lvbnMoaWQpXG4gICAgICApO1xuXG4gICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBpZHhfc3VibWlzc2lvbnNfZm9ybV9pZCBPTiBkZmVfc3VibWlzc2lvbnMoZm9ybV9pZCk7XG4gICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBpZHhfc3VibWlzc2lvbnNfdXNlcl9pZCBPTiBkZmVfc3VibWlzc2lvbnModXNlcl9pZCk7XG4gICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBpZHhfc3VibWlzc2lvbnNfY3JlYXRlZF9hdCBPTiBkZmVfc3VibWlzc2lvbnMoY3JlYXRlZF9hdCk7XG4gICAgYClcbiAgfVxuXG4gIC8vIOKUgOKUgCBIZWxwZXIgTWV0aG9kcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBwcml2YXRlIHByZXBhcmUoc3FsOiBzdHJpbmcpOiBhbnkge1xuICAgIGlmICghdGhpcy5zdGF0ZW1lbnRzLmhhcyhzcWwpKSB7XG4gICAgICB0aGlzLnN0YXRlbWVudHMuc2V0KHNxbCwgdGhpcy5kYi5wcmVwYXJlKHNxbCkpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnN0YXRlbWVudHMuZ2V0KHNxbClcbiAgfVxuXG4gIHByaXZhdGUganNvblNlcmlhbGl6ZShvYmo6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iailcbiAgfVxuXG4gIHByaXZhdGUganNvblBhcnNlKHN0cjogc3RyaW5nKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2Uoc3RyKVxuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cblxuICAvLyDilIDilIAgRm9ybSBEZWZpbml0aW9ucyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBhc3luYyBnZXRGb3JtQnlTbHVnKHNsdWc6IHN0cmluZyk6IFByb21pc2U8Rm9ybVZlcnNpb25SZWNvcmQgfCBudWxsPiB7XG4gICAgY29uc3Qgc3RtdCA9IHRoaXMucHJlcGFyZShgXG4gICAgICBTRUxFQ1QgZi4qLCBmdi5pZCBhcyB2ZXJzaW9uX2lkLCBmdi5zdGF0dXNcbiAgICAgIEZST00gZGZlX2Zvcm1zIGZcbiAgICAgIExFRlQgSk9JTiBkZmVfZm9ybV92ZXJzaW9ucyBmdiBPTiBmLmlkID0gZnYuZm9ybV9pZCBBTkQgZnYuc3RhdHVzID0gJ1BVQkxJU0hFRCdcbiAgICAgIFdIRVJFIGYuc2x1ZyA9ID9cbiAgICAgIExJTUlUIDFcbiAgICBgKVxuXG4gICAgY29uc3QgZm9ybSA9IHN0bXQuZ2V0KHNsdWcpIGFzIGFueVxuICAgIGlmICghZm9ybSkgcmV0dXJuIG51bGxcblxuICAgIC8vIEZldGNoIHZlcnNpb24gZGV0YWlsc1xuICAgIGNvbnN0IHZlcnNpb25TdG10ID0gdGhpcy5wcmVwYXJlKGBcbiAgICAgIFNFTEVDVCAqIEZST00gZGZlX2Zvcm1fdmVyc2lvbnMgV0hFUkUgaWQgPSA/XG4gICAgYClcbiAgICBjb25zdCB2ZXJzaW9uID0gdmVyc2lvblN0bXQuZ2V0KGZvcm0udmVyc2lvbl9pZCkgYXMgYW55XG4gICAgaWYgKCF2ZXJzaW9uKSByZXR1cm4gbnVsbFxuXG4gICAgcmV0dXJuIHRoaXMubWFwVG9Gb3JtVmVyc2lvbihmb3JtLCB2ZXJzaW9uKVxuICB9XG5cbiAgYXN5bmMgZ2V0Rm9ybUJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8Rm9ybVZlcnNpb25SZWNvcmQgfCBudWxsPiB7XG4gICAgY29uc3Qgc3RtdCA9IHRoaXMucHJlcGFyZShgXG4gICAgICBTRUxFQ1QgZi4qLCBmdi5pZCBhcyB2ZXJzaW9uX2lkLCBmdi5zdGF0dXNcbiAgICAgIEZST00gZGZlX2Zvcm1zIGZcbiAgICAgIExFRlQgSk9JTiBkZmVfZm9ybV92ZXJzaW9ucyBmdiBPTiBmLmlkID0gZnYuZm9ybV9pZCBBTkQgZnYuc3RhdHVzID0gJ1BVQkxJU0hFRCdcbiAgICAgIFdIRVJFIGYuaWQgPSA/XG4gICAgICBMSU1JVCAxXG4gICAgYClcblxuICAgIGNvbnN0IGZvcm0gPSBzdG10LmdldChpZCkgYXMgYW55XG4gICAgaWYgKCFmb3JtKSByZXR1cm4gbnVsbFxuXG4gICAgLy8gRmV0Y2ggdmVyc2lvbiBkZXRhaWxzXG4gICAgY29uc3QgdmVyc2lvblN0bXQgPSB0aGlzLnByZXBhcmUoYFxuICAgICAgU0VMRUNUICogRlJPTSBkZmVfZm9ybV92ZXJzaW9ucyBXSEVSRSBpZCA9ID9cbiAgICBgKVxuICAgIGNvbnN0IHZlcnNpb24gPSB2ZXJzaW9uU3RtdC5nZXQoZm9ybS52ZXJzaW9uX2lkKSBhcyBhbnlcbiAgICBpZiAoIXZlcnNpb24pIHJldHVybiBudWxsXG5cbiAgICByZXR1cm4gdGhpcy5tYXBUb0Zvcm1WZXJzaW9uKGZvcm0sIHZlcnNpb24pXG4gIH1cblxuICBhc3luYyBsaXN0Rm9ybXMocGFyYW1zPzogUGFnaW5hdGlvblBhcmFtcyk6IFByb21pc2U8UGFnaW5hdGVkUmVzdWx0PEZvcm1EZWZpbml0aW9uUmVjb3JkPj4ge1xuICAgIGNvbnN0IHBhZ2VTaXplID0gcGFyYW1zPy5wYWdlU2l6ZSA/PyAyMFxuICAgIGxldCB3aGVyZUNsYXVzZSA9ICcxID0gMSdcbiAgICBjb25zdCBiaW5kUGFyYW1zOiBhbnlbXSA9IFtdXG5cbiAgICBpZiAocGFyYW1zPy5zZWFyY2gpIHtcbiAgICAgIHdoZXJlQ2xhdXNlICs9IGAgQU5EIChmLnRpdGxlIExJS0UgPyBPUiBmLnNsdWcgTElLRSA/KWBcbiAgICAgIGNvbnN0IHNlYXJjaFRlcm0gPSBgJSR7cGFyYW1zLnNlYXJjaH0lYFxuICAgICAgYmluZFBhcmFtcy5wdXNoKHNlYXJjaFRlcm0sIHNlYXJjaFRlcm0pXG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGN1cnNvci1iYXNlZCBwYWdpbmF0aW9uXG4gICAgaWYgKHBhcmFtcz8uY3Vyc29yKSB7XG4gICAgICB3aGVyZUNsYXVzZSArPSBgIEFORCBmLnVwZGF0ZWRfYXQgPCAoU0VMRUNUIHVwZGF0ZWRfYXQgRlJPTSBkZmVfZm9ybXMgV0hFUkUgaWQgPSA/KWBcbiAgICAgIGJpbmRQYXJhbXMucHVzaChwYXJhbXMuY3Vyc29yKVxuICAgIH1cblxuICAgIGNvbnN0IHN0bXQgPSB0aGlzLnByZXBhcmUoYFxuICAgICAgU0VMRUNUIGYuaWQsIGYuc2x1ZywgZi50aXRsZSwgZi5kZXNjcmlwdGlvbiwgZi5jcmVhdGVkX2F0LCBmLnVwZGF0ZWRfYXQsXG4gICAgICAgICAgICAgZnYuaWQgYXMgdmVyc2lvbl9pZCwgZnYuc3RhdHVzXG4gICAgICBGUk9NIGRmZV9mb3JtcyBmXG4gICAgICBMRUZUIEpPSU4gZGZlX2Zvcm1fdmVyc2lvbnMgZnYgT04gZi5pZCA9IGZ2LmZvcm1faWQgQU5EIGZ2LnN0YXR1cyA9ICdQVUJMSVNIRUQnXG4gICAgICBXSEVSRSAke3doZXJlQ2xhdXNlfVxuICAgICAgT1JERVIgQlkgZi51cGRhdGVkX2F0IERFU0NcbiAgICAgIExJTUlUID9cbiAgICBgKVxuXG4gICAgYmluZFBhcmFtcy5wdXNoKHBhZ2VTaXplICsgMSlcbiAgICBjb25zdCBmb3JtcyA9IHN0bXQuYWxsKC4uLmJpbmRQYXJhbXMpIGFzIGFueVtdXG5cbiAgICBjb25zdCBoYXNNb3JlID0gZm9ybXMubGVuZ3RoID4gcGFnZVNpemVcbiAgICBjb25zdCBpdGVtcyA9IChoYXNNb3JlID8gZm9ybXMuc2xpY2UoMCwgLTEpIDogZm9ybXMpLm1hcCgoZjogYW55KSA9PiAoe1xuICAgICAgaWQ6IGYuaWQsXG4gICAgICBzbHVnOiBmLnNsdWcsXG4gICAgICB0aXRsZTogZi50aXRsZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBmLmRlc2NyaXB0aW9uLFxuICAgICAgdmVyc2lvbklkOiBmLnZlcnNpb25faWQgPz8gJycsXG4gICAgICBzdGF0dXM6IGYuc3RhdHVzID8/ICdEUkFGVCcsXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKGYuY3JlYXRlZF9hdCksXG4gICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKGYudXBkYXRlZF9hdCksXG4gICAgfSkpXG5cbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXMsXG4gICAgICBuZXh0Q3Vyc29yOiBoYXNNb3JlID8gaXRlbXNbaXRlbXMubGVuZ3RoIC0gMV0/LmlkID8/IG51bGwgOiBudWxsLFxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgCBTdWJtaXNzaW9ucyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBhc3luYyBjcmVhdGVTdWJtaXNzaW9uKGRhdGE6IHtcbiAgICBmb3JtSWQ6IHN0cmluZ1xuICAgIHZlcnNpb25JZDogc3RyaW5nXG4gICAgdXNlcklkOiBzdHJpbmdcbiAgICBjb250ZXh0OiBGb3JtUnVudGltZUNvbnRleHRcbiAgfSk6IFByb21pc2U8Rm9ybVN1Ym1pc3Npb25SZWNvcmQ+IHtcbiAgICBjb25zdCBpZCA9IGdlbmVyYXRlSWQoKVxuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuXG4gICAgY29uc3Qgc3RtdCA9IHRoaXMucHJlcGFyZShgXG4gICAgICBJTlNFUlQgSU5UTyBkZmVfc3VibWlzc2lvbnMgKGlkLCBmb3JtX2lkLCB2ZXJzaW9uX2lkLCB1c2VyX2lkLCBjb250ZXh0LCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0KVxuICAgICAgVkFMVUVTICg/LCA/LCA/LCA/LCA/LCA/LCA/KVxuICAgIGApXG5cbiAgICBzdG10LnJ1bihcbiAgICAgIGlkLFxuICAgICAgZGF0YS5mb3JtSWQsXG4gICAgICBkYXRhLnZlcnNpb25JZCxcbiAgICAgIGRhdGEudXNlcklkLFxuICAgICAgdGhpcy5qc29uU2VyaWFsaXplKGRhdGEuY29udGV4dCksXG4gICAgICBub3csXG4gICAgICBub3dcbiAgICApXG5cbiAgICByZXR1cm4ge1xuICAgICAgaWQsXG4gICAgICBmb3JtSWQ6IGRhdGEuZm9ybUlkLFxuICAgICAgdmVyc2lvbklkOiBkYXRhLnZlcnNpb25JZCxcbiAgICAgIHVzZXJJZDogZGF0YS51c2VySWQsXG4gICAgICBzdGF0dXM6ICdJTl9QUk9HUkVTUycsXG4gICAgICBjdXJyZW50U3RlcElkOiBudWxsLFxuICAgICAgY29udGV4dDogZGF0YS5jb250ZXh0LFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZShub3cpLFxuICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZShub3cpLFxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdldFN1Ym1pc3Npb24oaWQ6IHN0cmluZyk6IFByb21pc2U8Rm9ybVN1Ym1pc3Npb25SZWNvcmQgfCBudWxsPiB7XG4gICAgY29uc3Qgc3RtdCA9IHRoaXMucHJlcGFyZShgXG4gICAgICBTRUxFQ1QgKiBGUk9NIGRmZV9zdWJtaXNzaW9ucyBXSEVSRSBpZCA9ID9cbiAgICBgKVxuXG4gICAgY29uc3Qgc3VibWlzc2lvbiA9IHN0bXQuZ2V0KGlkKSBhcyBhbnlcbiAgICBpZiAoIXN1Ym1pc3Npb24pIHJldHVybiBudWxsXG5cbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHN1Ym1pc3Npb24uaWQsXG4gICAgICBmb3JtSWQ6IHN1Ym1pc3Npb24uZm9ybV9pZCxcbiAgICAgIHZlcnNpb25JZDogc3VibWlzc2lvbi52ZXJzaW9uX2lkLFxuICAgICAgdXNlcklkOiBzdWJtaXNzaW9uLnVzZXJfaWQsXG4gICAgICBzdGF0dXM6IHN1Ym1pc3Npb24uc3RhdHVzLFxuICAgICAgY3VycmVudFN0ZXBJZDogc3VibWlzc2lvbi5jdXJyZW50X3N0ZXBfaWQsXG4gICAgICBjb250ZXh0OiB0aGlzLmpzb25QYXJzZShzdWJtaXNzaW9uLmNvbnRleHQpLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZShzdWJtaXNzaW9uLmNyZWF0ZWRfYXQpLFxuICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZShzdWJtaXNzaW9uLnVwZGF0ZWRfYXQpLFxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZVN1Ym1pc3Npb24oaWQ6IHN0cmluZywgZGF0YTogUGFydGlhbDx7XG4gICAgY3VycmVudFN0ZXBJZDogc3RyaW5nIHwgbnVsbFxuICAgIHN0YXR1czogJ0lOX1BST0dSRVNTJyB8ICdDT01QTEVURUQnIHwgJ0FCQU5ET05FRCdcbiAgICBjb250ZXh0OiBGb3JtUnVudGltZUNvbnRleHRcbiAgfT4pOiBQcm9taXNlPEZvcm1TdWJtaXNzaW9uUmVjb3JkPiB7XG4gICAgY29uc3QgdXBkYXRlczogc3RyaW5nW10gPSBbXVxuICAgIGNvbnN0IHBhcmFtczogYW55W10gPSBbXVxuXG4gICAgaWYgKGRhdGEuY3VycmVudFN0ZXBJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB1cGRhdGVzLnB1c2goJ2N1cnJlbnRfc3RlcF9pZCA9ID8nKVxuICAgICAgcGFyYW1zLnB1c2goZGF0YS5jdXJyZW50U3RlcElkKVxuICAgIH1cblxuICAgIGlmIChkYXRhLnN0YXR1cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB1cGRhdGVzLnB1c2goJ3N0YXR1cyA9ID8nKVxuICAgICAgcGFyYW1zLnB1c2goZGF0YS5zdGF0dXMpXG4gICAgfVxuXG4gICAgaWYgKGRhdGEuY29udGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB1cGRhdGVzLnB1c2goJ2NvbnRleHQgPSA/JylcbiAgICAgIHBhcmFtcy5wdXNoKHRoaXMuanNvblNlcmlhbGl6ZShkYXRhLmNvbnRleHQpKVxuICAgIH1cblxuICAgIHVwZGF0ZXMucHVzaCgndXBkYXRlZF9hdCA9ID8nKVxuICAgIHBhcmFtcy5wdXNoKG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSlcblxuICAgIHBhcmFtcy5wdXNoKGlkKVxuXG4gICAgY29uc3Qgc3RtdCA9IHRoaXMucHJlcGFyZShgXG4gICAgICBVUERBVEUgZGZlX3N1Ym1pc3Npb25zIFNFVCAke3VwZGF0ZXMuam9pbignLCAnKX0gV0hFUkUgaWQgPSA/XG4gICAgYClcblxuICAgIHN0bXQucnVuKC4uLnBhcmFtcylcblxuICAgIHJldHVybiB0aGlzLmdldFN1Ym1pc3Npb24oaWQpIGFzIFByb21pc2U8Rm9ybVN1Ym1pc3Npb25SZWNvcmQ+XG4gIH1cblxuICAvLyDilIDilIAgRHluYW1pYyBSZXNvdXJjZSBPcGVyYXRpb25zIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGFzeW5jIGV4ZWN1dGVBcGlDb250cmFjdChcbiAgICBjb250cmFjdDogU3RlcEFwaUNvbnRyYWN0LFxuICAgIGJvZHk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gICAgLy8gVXNlIGN1c3RvbSBleGVjdXRvciBpZiBwcm92aWRlZFxuICAgIGlmICh0aGlzLmN1c3RvbUV4ZWN1dGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1c3RvbUV4ZWN1dGUoY29udHJhY3QsIGJvZHkpXG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdDogaW4tbWVtb3J5IG1vZGVsIHN0b3JlXG4gICAgY29uc3QgaWQgPSAoYm9keS5pZCBhcyBzdHJpbmcpID8/IGdlbmVyYXRlSWQoKVxuICAgIGNvbnN0IHJlY29yZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7IGlkLCAuLi5ib2R5LCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9XG5cbiAgICBpZiAoY29udHJhY3QubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgIHJlY29yZC5jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9XG5cbiAgICB0aGlzLm1vZGVsU3RvcmUuc2V0KGNvbnRyYWN0LnJlc291cmNlTmFtZSwgaWQsIHJlY29yZClcbiAgICByZXR1cm4gcmVjb3JkXG4gIH1cblxuICAvLyDilIDilIAgRHluYW1pYyBPcHRpb25zIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGFzeW5jIGZldGNoRmllbGRPcHRpb25zKFxuICAgIGZpZWxkSWQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IFBhZ2luYXRpb25QYXJhbXMsXG4gICk6IFByb21pc2U8UGFnaW5hdGVkUmVzdWx0PFNlbGVjdE9wdGlvbj4+IHtcbiAgICBjb25zdCBwYWdlU2l6ZSA9IHBhcmFtcy5wYWdlU2l6ZVxuICAgIGxldCB3aGVyZUNsYXVzZSA9ICdmaWVsZF9pZCA9ID8nXG4gICAgY29uc3QgYmluZFBhcmFtczogYW55W10gPSBbZmllbGRJZF1cblxuICAgIGlmIChwYXJhbXMuc2VhcmNoKSB7XG4gICAgICB3aGVyZUNsYXVzZSArPSBgIEFORCBsYWJlbCBMSUtFID9gXG4gICAgICBiaW5kUGFyYW1zLnB1c2goYCUke3BhcmFtcy5zZWFyY2h9JWApXG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGN1cnNvci1iYXNlZCBwYWdpbmF0aW9uXG4gICAgaWYgKHBhcmFtcy5jdXJzb3IpIHtcbiAgICAgIHdoZXJlQ2xhdXNlICs9IGAgQU5EIGlkIDwgKFNFTEVDVCBpZCBGUk9NIGRmZV9maWVsZF9vcHRpb25zIFdIRVJFIGlkID0gPylgXG4gICAgICBiaW5kUGFyYW1zLnB1c2gocGFyYW1zLmN1cnNvcilcbiAgICB9XG5cbiAgICBjb25zdCBzdG10ID0gdGhpcy5wcmVwYXJlKGBcbiAgICAgIFNFTEVDVCBpZCwgbGFiZWwsIHZhbHVlLCBtZXRhIEZST00gZGZlX2ZpZWxkX29wdGlvbnNcbiAgICAgIFdIRVJFICR7d2hlcmVDbGF1c2V9XG4gICAgICBPUkRFUiBCWSBcIm9yZGVyXCIgQVNDXG4gICAgICBMSU1JVCA/XG4gICAgYClcblxuICAgIGJpbmRQYXJhbXMucHVzaChwYWdlU2l6ZSArIDEpXG4gICAgY29uc3Qgb3B0aW9ucyA9IHN0bXQuYWxsKC4uLmJpbmRQYXJhbXMpIGFzIGFueVtdXG5cbiAgICBjb25zdCBoYXNNb3JlID0gb3B0aW9ucy5sZW5ndGggPiBwYWdlU2l6ZVxuICAgIGNvbnN0IGl0ZW1zID0gKGhhc01vcmUgPyBvcHRpb25zLnNsaWNlKDAsIC0xKSA6IG9wdGlvbnMpLm1hcCgobzogYW55KSA9PiAoe1xuICAgICAgbGFiZWw6IG8ubGFiZWwsXG4gICAgICB2YWx1ZTogby52YWx1ZSxcbiAgICAgIG1ldGE6IHRoaXMuanNvblBhcnNlKG8ubWV0YSksXG4gICAgfSkpXG5cbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXMsXG4gICAgICBuZXh0Q3Vyc29yOiBoYXNNb3JlID8gb3B0aW9uc1tvcHRpb25zLmxlbmd0aCAtIDJdPy5pZCA/PyBudWxsIDogbnVsbCxcbiAgICB9XG4gIH1cblxuICAvLyDilIDilIAgUHJpdmF0ZSBIZWxwZXJzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIHByaXZhdGUgYXN5bmMgbWFwVG9Gb3JtVmVyc2lvbihmb3JtOiBhbnksIHZlcnNpb246IGFueSk6IFByb21pc2U8Rm9ybVZlcnNpb25SZWNvcmQ+IHtcbiAgICAvLyBGZXRjaCBzdGVwc1xuICAgIGNvbnN0IHN0ZXBzU3RtdCA9IHRoaXMucHJlcGFyZShgXG4gICAgICBTRUxFQ1QgKiBGUk9NIGRmZV9zdGVwcyBXSEVSRSB2ZXJzaW9uX2lkID0gPyBPUkRFUiBCWSBcIm9yZGVyXCIgQVNDXG4gICAgYClcbiAgICBjb25zdCBzdGVwcyA9IHN0ZXBzU3RtdC5hbGwodmVyc2lvbi5pZCkgYXMgYW55W11cblxuICAgIC8vIEZldGNoIGZpZWxkc1xuICAgIGNvbnN0IGZpZWxkc1N0bXQgPSB0aGlzLnByZXBhcmUoYFxuICAgICAgU0VMRUNUICogRlJPTSBkZmVfZmllbGRzIFdIRVJFIHZlcnNpb25faWQgPSA/IE9SREVSIEJZIFwib3JkZXJcIiBBU0NcbiAgICBgKVxuICAgIGNvbnN0IGZpZWxkcyA9IGZpZWxkc1N0bXQuYWxsKHZlcnNpb24uaWQpIGFzIGFueVtdXG5cbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGZvcm0uaWQsXG4gICAgICBzbHVnOiBmb3JtLnNsdWcsXG4gICAgICB0aXRsZTogZm9ybS50aXRsZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBmb3JtLmRlc2NyaXB0aW9uLFxuICAgICAgdmVyc2lvbklkOiB2ZXJzaW9uLmlkLFxuICAgICAgc3RhdHVzOiB2ZXJzaW9uLnN0YXR1cyxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoZm9ybS5jcmVhdGVkX2F0KSxcbiAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoZm9ybS51cGRhdGVkX2F0KSxcbiAgICAgIHN0ZXBzOiBzdGVwcy5tYXAoKHM6IGFueSk6IEZvcm1TdGVwID0+ICh7XG4gICAgICAgIGlkOiBzLmlkLFxuICAgICAgICB2ZXJzaW9uSWQ6IHMudmVyc2lvbl9pZCxcbiAgICAgICAgdGl0bGU6IHMudGl0bGUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzLmRlc2NyaXB0aW9uLFxuICAgICAgICBvcmRlcjogcy5vcmRlcixcbiAgICAgICAgY29uZGl0aW9uczogdGhpcy5qc29uUGFyc2Uocy5jb25kaXRpb25zKSxcbiAgICAgICAgY29uZmlnOiB0aGlzLmpzb25QYXJzZShzLmNvbmZpZyksXG4gICAgICB9KSksXG4gICAgICBmaWVsZHM6IGZpZWxkcy5tYXAoKGY6IGFueSk6IEZvcm1GaWVsZCA9PiAoe1xuICAgICAgICBpZDogZi5pZCxcbiAgICAgICAgdmVyc2lvbklkOiBmLnZlcnNpb25faWQsXG4gICAgICAgIHN0ZXBJZDogZi5zdGVwX2lkLFxuICAgICAgICBzZWN0aW9uSWQ6IGYuc2VjdGlvbl9pZCxcbiAgICAgICAgcGFyZW50RmllbGRJZDogZi5wYXJlbnRfZmllbGRfaWQsXG4gICAgICAgIGtleTogZi5rZXksXG4gICAgICAgIGxhYmVsOiBmLmxhYmVsLFxuICAgICAgICBkZXNjcmlwdGlvbjogZi5kZXNjcmlwdGlvbixcbiAgICAgICAgdHlwZTogZi50eXBlLFxuICAgICAgICByZXF1aXJlZDogZi5yZXF1aXJlZCA9PT0gMSxcbiAgICAgICAgb3JkZXI6IGYub3JkZXIsXG4gICAgICAgIGNvbmZpZzogdGhpcy5qc29uUGFyc2UoZi5jb25maWcpID8/IHt9LFxuICAgICAgICBjb25kaXRpb25zOiB0aGlzLmpzb25QYXJzZShmLmNvbmRpdGlvbnMpLFxuICAgICAgfSkpLFxuICAgIH1cbiAgfVxufVxuIl19