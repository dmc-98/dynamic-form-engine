/**
 * In-memory DatabaseAdapter implementation for E2E testing.
 * Provides a fully functional mock database with real storage semantics.
 */
import type { StepApiContract, FormRuntimeContext, SelectOption } from '@dmc--98/dfe-core';
import type { DatabaseAdapter, FormDefinitionRecord, FormVersionRecord, FormSubmissionRecord, PaginationParams, PaginatedResult } from '@dmc--98/dfe-server';
export declare class InMemoryDatabase implements DatabaseAdapter {
    private forms;
    private formsBySlug;
    private submissions;
    private resources;
    private fieldOptions;
    private idCounter;
    seedForm(form: FormVersionRecord): void;
    seedFieldOptions(fieldId: string, options: SelectOption[]): void;
    getSubmissions(): FormSubmissionRecord[];
    getResources(name: string): Record<string, unknown>[];
    clear(): void;
    private nextId;
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
}
export declare function createTestDb(): InMemoryDatabase;
export declare function seedContactForm(db: InMemoryDatabase): FormVersionRecord;
export declare function seedMultiStepForm(db: InMemoryDatabase): FormVersionRecord;
