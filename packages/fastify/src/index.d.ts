import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DatabaseAdapter, PersistenceAdapter } from '@dmc-98/dfe-server';
export interface DfeFastifyPluginOptions {
    /** Database adapter instance */
    db: DatabaseAdapter;
    /** Optional persistence adapter (file uploads, etc.) */
    persistence?: PersistenceAdapter;
    /**
     * Extract the user ID from the request.
     * Returns null/undefined to indicate an unauthenticated request (will return 401).
     * Defaults to req.user?.id ?? null
     */
    getUserId?: (req: FastifyRequest) => string | null | undefined;
    /** Route prefix (default: '/dfe') */
    prefix?: string;
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
 * Create a Fastify plugin with all DFE API routes.
 *
 * **Security:** By default, all submission-related endpoints require authentication
 * (getUserId must return a non-null value) and enforce ownership checks (a user can
 * only access their own submissions). Set `skipAuth: true` to disable for development.
 *
 * **Body Size:** Configure Fastify body size limits to prevent large payload attacks.
 * Example: `fastify.register(require('@fastify/compress'))`
 *
 * **Rate Limiting:** Add rate limiting middleware (e.g., `@fastify/rate-limit`) to
 * prevent abuse of submission endpoints.
 *
 * @example
 * ```ts
 * import Fastify from 'fastify'
 * import { createDfePlugin } from '@dmc-98/dfe-fastify'
 * import { PrismaDatabaseAdapter } from '@dmc-98/dfe-prisma'
 *
 * const fastify = Fastify()
 * const db = new PrismaDatabaseAdapter(prisma)
 *
 * await fastify.register(createDfePlugin({
 *   db,
 *   getUserId: (req) => req.user?.userId ?? null,
 *   allowedOptionFilterKeys: ['departmentId', 'categoryId'],
 * }), { prefix: '/api' })
 * ```
 */
export declare function createDfePlugin(options: DfeFastifyPluginOptions): (fastify: FastifyInstance) => Promise<void>;
