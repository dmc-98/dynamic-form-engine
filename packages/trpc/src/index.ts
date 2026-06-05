import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { DatabaseAdapter, PersistenceAdapter } from '@dmc--98/dfe-server'
import { executeStepSubmit, completeSubmission } from '@dmc--98/dfe-server'
import type { FormRuntimeContext } from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeTrpcRouterOptions {
  /** Database adapter instance */
  db: DatabaseAdapter
  /** Optional persistence adapter (file uploads, etc.) */
  persistence?: PersistenceAdapter
  /**
   * Extract the user ID from the context.
   * Returns null/undefined to indicate an unauthenticated request (will throw UNAUTHORIZED).
   * Defaults to ctx.user?.id ?? null
   */
  getUserId?: (ctx: any) => string | null | undefined
  /**
   * Maximum page size for list queries (default: 100).
   * Prevents abuse via extremely large pageSize query params.
   */
  maxPageSize?: number
  /**
   * Allowed filter keys for the dynamic field options endpoint.
   * Only query parameters matching these keys will be passed to the adapter.
   * If not specified, no extra filters are passed (safe default).
   */
  allowedOptionFilterKeys?: string[]
  /**
   * Skip authorization/ownership checks on submission endpoints.
   * Defaults to false. Only set to true for development/testing.
   */
  skipAuth?: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Clamp a page size value to a safe range.
 * Prevents negative, zero, NaN, and extremely large page sizes.
 */
function clampPageSize(raw: number | undefined, maxPageSize: number): number {
  if (!Number.isFinite(raw) || (raw ?? 0) < 1) return 20
  return Math.min(raw ?? 20, maxPageSize)
}

/**
 * Sanitize a string-only filter value.
 * Rejects non-string values and values that look like injection attempts.
 */
function sanitizeFilterValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (/[{}\[\]$]/.test(value)) return null
  if (value.length > 200) return null
  return value
}

function buildRuntimeContext(
  userId: string,
  fallback: FormRuntimeContext,
  overrides?: Record<string, unknown>,
): FormRuntimeContext {
  return {
    ...fallback,
    ...(overrides ?? {}),
    userId,
  }
}

// ─── Router Factory ─────────────────────────────────────────────────────────

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
 * import { createDfeTrpcRouter } from '@dmc--98/dfe-trpc'
 * import { PrismaDatabaseAdapter } from '@dmc--98/dfe-prisma'
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
export function createDfeTrpcRouter(options: DfeTrpcRouterOptions) {
  const {
    db,
    getUserId = (ctx: any) => ctx.user?.id ?? null,
    maxPageSize = 100,
    allowedOptionFilterKeys = [],
    skipAuth = false,
  } = options

  const t = initTRPC.context<any>().create()

  function authenticateContext(ctx: any): string {
    if (skipAuth) return getUserId(ctx) ?? 'anonymous'
    const userId = getUserId(ctx)
    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }
    return userId
  }

  function verifyOwnership(userId: string, submissionUserId: string): void {
    if (skipAuth) return
    if (userId !== submissionUserId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this submission',
      })
    }
  }

  return t.router({
    // ── List Published Forms ────────────────────────────────────────────────

    listForms: t.procedure
      .input(
        z.object({
          cursor: z.string().nullable().optional(),
          pageSize: z.number().int().min(1).max(maxPageSize).optional(),
        }),
      )
      .query(async ({ input }) => {
        const cursor = input.cursor ?? null
        const pageSize = clampPageSize(input.pageSize, maxPageSize)
        return db.listForms({ cursor, pageSize })
      }),

    // ── Get Form by Slug ────────────────────────────────────────────────────

    getFormBySlug: t.procedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const form = await db.getFormBySlug(input.slug)
        if (!form) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Form not found',
          })
        }
        return form
      }),

    // ── Get Form by ID ──────────────────────────────────────────────────────

    getFormById: t.procedure
      .input(z.object({ formId: z.string() }))
      .query(async ({ input }) => {
        const form = await db.getFormById(input.formId)
        if (!form) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Form not found',
          })
        }
        return form
      }),

    // ── Create Submission ───────────────────────────────────────────────────

    createSubmission: t.procedure
      .input(z.object({ formId: z.string(), versionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const userId = authenticateContext(ctx)

        const form = await db.getFormById(input.formId)
        if (!form) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Form not found',
          })
        }

        const context: FormRuntimeContext = { userId }
        return db.createSubmission({
          formId: input.formId,
          versionId: input.versionId,
          userId,
          context,
        })
      }),

    // ── Get Submission ──────────────────────────────────────────────────────

    getSubmission: t.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const userId = authenticateContext(ctx)

        const submission = await db.getSubmission(input.id)
        if (!submission) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Submission not found',
          })
        }

        verifyOwnership(userId, submission.userId)
        return submission
      }),

    // ── Submit Step ─────────────────────────────────────────────────────────

    submitStep: t.procedure
      .input(
        z.object({
          submissionId: z.string(),
          stepId: z.string(),
          values: z.record(z.any()),
          context: z.record(z.any()).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const userId = authenticateContext(ctx)

        const submission = await db.getSubmission(input.submissionId)
        if (!submission) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Submission not found',
          })
        }

        verifyOwnership(userId, submission.userId)

        if (submission.status === 'COMPLETED') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Submission is already completed',
          })
        }

        const form = await db.getFormById(submission.formId)
        if (!form) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Form not found',
          })
        }

        return executeStepSubmit({
          form,
          stepId: input.stepId,
          payload: {
            values: input.values,
            context: buildRuntimeContext(userId, submission.context, input.context),
          },
          db,
          submissionId: input.submissionId,
        })
      }),

    // ── Complete Submission ─────────────────────────────────────────────────

    completeSubmission: t.procedure
      .input(z.object({ submissionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const userId = authenticateContext(ctx)

        const submission = await db.getSubmission(input.submissionId)
        if (!submission) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Submission not found',
          })
        }

        verifyOwnership(userId, submission.userId)

        if (submission.status === 'COMPLETED') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Submission is already completed',
          })
        }

        await completeSubmission(db, input.submissionId, submission.context)
        return { success: true }
      }),

    // ── Dynamic Field Options ───────────────────────────────────────────────

    getFieldOptions: t.procedure
      .input(
        z.object({
          fieldId: z.string(),
          cursor: z.string().nullable().optional(),
          pageSize: z.number().int().min(1).max(maxPageSize).optional(),
          search: z.string().optional(),
          filters: z.record(z.string()).optional(),
        }),
      )
      .query(async ({ input }) => {
        const cursor = input.cursor ?? null
        const pageSize = clampPageSize(input.pageSize, maxPageSize)

        // Only pass through explicitly allowed filter keys (prevents injection)
        const filters: Record<string, string> = {}
        if (input.filters) {
          for (const key of allowedOptionFilterKeys) {
            if (key in input.filters) {
              const raw = input.filters[key]
              const sanitized = sanitizeFilterValue(raw)
              if (sanitized !== null) {
                filters[key] = sanitized
              }
            }
          }
        }

        return db.fetchFieldOptions(input.fieldId, {
          cursor,
          pageSize,
          search: input.search ? String(input.search).slice(0, 200) : undefined,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        })
      }),
  })
}

// Export helper type for client-side inference
export type DfeTrpcRouter = ReturnType<typeof createDfeTrpcRouter>
