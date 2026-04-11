import type { SelectOption, StepApiContract, FormRuntimeContext } from '@dmc-98/dfe-core';
import type { DatabaseAdapter, PaginationParams, PaginatedResult, FormDefinitionRecord, FormVersionRecord, FormSubmissionRecord } from '@dmc-98/dfe-server';
/**
 * Minimal Mongoose connection interface to avoid hard dependency on mongoose.
 * Your Mongoose models will satisfy this interface.
 */
export interface MongooseLike {
    model(name: string, schema?: any): any;
    connection: any;
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
export interface MongooseAdapterOptions {
    /**
     * Custom API contract executor.
     * If not provided, uses an in-memory model store.
     * Override this for production to write to your actual database collections.
     */
    executeApiContract?: (contract: StepApiContract, body: Record<string, unknown>) => Promise<Record<string, unknown>>;
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
export declare class MongooseDatabaseAdapter implements DatabaseAdapter {
    private conn;
    private modelStore;
    private customExecute?;
    private formModel;
    private formVersionModel;
    private fieldOptionModel;
    private submissionModel;
    constructor(conn: MongooseLike, options?: MongooseAdapterOptions);
    private getFormSchema;
    private getFormVersionSchema;
    private getFieldOptionSchema;
    private getSubmissionSchema;
    private getOrCreateModel;
    private buildMongooseSchema;
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
