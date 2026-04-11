import type { DatabaseAdapter, PersistenceAdapter } from '@dmc-98/dfe-server';
export interface DfeTrpcRouterOptions {
    /** Database adapter instance */
    db: DatabaseAdapter;
    /** Optional persistence adapter (file uploads, etc.) */
    persistence?: PersistenceAdapter;
    /**
     * Extract the user ID from the context.
     * Returns null/undefined to indicate an unauthenticated request (will throw UNAUTHORIZED).
     * Defaults to ctx.user?.id ?? null
     */
    getUserId?: (ctx: any) => string | null | undefined;
    /**
     * Maximum page size for list queries (default: 100).
     * Prevents abuse via extremely large pageSize query params.
     */
    maxPageSize?: number;
    /**
     * Allowed filter keys for the dynamic field options endpoint.
     * Only query parameters matching these keys will be passed to the adapter.
     * If not specified, no extra filters are passed (safe default).
     */
    allowedOptionFilterKeys?: string[];
    /**
     * Skip authorization/ownership checks on submission endpoints.
     * Defaults to false. Only set to true for development/testing.
     */
    skipAuth?: boolean;
}
/**
 * Create a tRPC router with all DFE API procedures.
 *
 * **Security:** By default, all submission-related procedures require authentication
 * (getUserId must return a non-null value) and enforce ownership checks (a user can
 * only access their own submissions). Set `skipAuth: true` to disable for development.
 *
 * **Rate Limiting:** Add rate limiting middleware to your tRPC server to prevent
 * abuse of submission endpoints.
 *
 * @example
 * ```ts
 * import { createDfeTrpcRouter } from '@dmc-98/dfe-trpc'
 * import { PrismaDatabaseAdapter } from '@dmc-98/dfe-prisma'
 *
 * const db = new PrismaDatabaseAdapter(prisma)
 * const dfeRouter = createDfeTrpcRouter({
 *   db,
 *   getUserId: (ctx) => ctx.user?.id ?? null,
 *   allowedOptionFilterKeys: ['departmentId', 'categoryId'],
 * })
 *
 * export const appRouter = t.router({
 *   dfe: dfeRouter,
 *   // ... other routers
 * })
 * ```
 */
export declare function createDfeTrpcRouter(options: DfeTrpcRouterOptions): import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: any;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: import("@trpc/server").DefaultDataTransformer;
}>, {
    listForms: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: any;
        _input_in: {
            cursor?: string | null | undefined;
            pageSize?: number | undefined;
        };
        _input_out: {
            cursor?: string | null | undefined;
            pageSize?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@dmc-98/dfe-server").PaginatedResult<import("@dmc-98/dfe-server").FormDefinitionRecord>>;
    getFormBySlug: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: any;
        _input_in: {
            slug: string;
        };
        _input_out: {
            slug: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@dmc-98/dfe-server").FormVersionRecord>;
    getFormById: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: any;
        _input_in: {
            formId: string;
        };
        _input_out: {
            formId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@dmc-98/dfe-server").FormVersionRecord>;
    createSubmission: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: any;
        _input_in: {
            formId: string;
            versionId: string;
        };
        _input_out: {
            formId: string;
            versionId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@dmc-98/dfe-server").FormSubmissionRecord>;
    getSubmission: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: any;
        _input_in: {
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@dmc-98/dfe-server").FormSubmissionRecord>;
    submitStep: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: any;
        _input_in: {
            values: Record<string, any>;
            stepId: string;
            submissionId: string;
            context?: Record<string, any> | undefined;
        };
        _input_out: {
            values: Record<string, any>;
            stepId: string;
            submissionId: string;
            context?: Record<string, any> | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@dmc-98/dfe-core").StepSubmitResponse>;
    completeSubmission: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: any;
        _input_in: {
            submissionId: string;
        };
        _input_out: {
            submissionId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
    }>;
    getFieldOptions: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: any;
        _input_in: {
            fieldId: string;
            search?: string | undefined;
            filters?: Record<string, string> | undefined;
            cursor?: string | null | undefined;
            pageSize?: number | undefined;
        };
        _input_out: {
            fieldId: string;
            search?: string | undefined;
            filters?: Record<string, string> | undefined;
            cursor?: string | null | undefined;
            pageSize?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@dmc-98/dfe-server").PaginatedResult<import("@dmc-98/dfe-core").SelectOption>>;
}>;
export type DfeTrpcRouter = ReturnType<typeof createDfeTrpcRouter>;
