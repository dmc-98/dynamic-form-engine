import type { SelectOption, StepApiContract, FormRuntimeContext } from '@dmc-98/dfe-core';
import type { DatabaseAdapter, PaginationParams, PaginatedResult, FormDefinitionRecord, FormVersionRecord, FormSubmissionRecord } from '@dmc-98/dfe-server';
/**
 * Minimal better-sqlite3 Database interface to avoid hard dependency.
 * Your Database instance will satisfy this interface.
 */
export interface SqliteLike {
    prepare(sql: string): any;
    exec(sql: string): void;
    transaction<T>(fn: () => T): () => T;
}
/**
 * Simple in-memory model store for dynamic resource operations.
 * This is used by the adapter to execute API contracts that create/update
 * resources via the form engine.
 *
 * For production use, extend this with a real database or replace
 * executeApiContract with your own implementation.
 */
export declare class InMemoryModelStore {
    private store;
    get(resource: string, id: string): Record<string, unknown> | undefined;
    set(resource: string, id: string, data: Record<string, unknown>): void;
    getAll(resource: string): Record<string, unknown>[];
    clear(): void;
}
export interface SqliteAdapterOptions {
    /**
     * Custom API contract executor.
     * If not provided, uses an in-memory model store.
     * Override this for production to write to your actual database tables.
     */
    executeApiContract?: (contract: StepApiContract, body: Record<string, unknown>) => Promise<Record<string, unknown>>;
    /**
     * If true, automatically initialize schema on adapter creation.
     * Default: true
     */
    autoInit?: boolean;
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
 * import { SqliteDatabaseAdapter } from '@dmc-98/dfe-sqlite'
 *
 * const db = new Database('dfe.db')
 * const adapter = new SqliteDatabaseAdapter(db)
 * await adapter.initialize()
 * ```
 */
export declare class SqliteDatabaseAdapter implements DatabaseAdapter {
    private db;
    private modelStore;
    private customExecute?;
    private statements;
    constructor(db: SqliteLike, options?: SqliteAdapterOptions);
    /**
     * Initialize the database schema.
     * This creates all necessary tables for the form engine.
     */
    initialize(): Promise<void>;
    private prepare;
    private jsonSerialize;
    private jsonParse;
    getFormBySlug(slug: string): Promise<FormVersionRecord | null>;
    getFormById(id: string): Promise<FormVersionRecord | null>;
    listForms(params?: PaginationParams): Promise<PaginatedResult<FormDefinitionRecord>>;
    createSubmission(data: {
        formId: string;
        versionId: string;
        userId: string;
        context: FormRuntimeContext;
    }): Promise<FormSubmissionRecord>;
    getSubmission(id: string): Promise<FormSubmissionRecord | null>;
    updateSubmission(id: string, data: Partial<{
        currentStepId: string | null;
        status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
        context: FormRuntimeContext;
    }>): Promise<FormSubmissionRecord>;
    executeApiContract(contract: StepApiContract, body: Record<string, unknown>): Promise<Record<string, unknown>>;
    fetchFieldOptions(fieldId: string, params: PaginationParams): Promise<PaginatedResult<SelectOption>>;
    private mapToFormVersion;
}
