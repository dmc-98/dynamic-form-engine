import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { DatabaseAdapter, PersistenceAdapter } from '@dmc--98/dfe-server'
import { executeStepSubmit, completeSubmission } from '@dmc--98/dfe-server'
import type { FormRuntimeContext } from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeFastifyPluginOptions {
  /** Database adapter instance */
  db: DatabaseAdapter
  /** Optional persistence adapter (file uploads, etc.) */
  persistence?: PersistenceAdapter
  /**
   * Extract the user ID from the request.
   * Returns null/undefined to indicate an unauthenticated request (will return 401).
   * Defaults to req.user?.id ?? null
   */
  getUserId?: (req: FastifyRequest) => string | null | undefined
  /** Route prefix (default: '/dfe') */
  prefix?: string
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
function clampPageSize(raw: string | undefined, maxPageSize: number): number {
  const parsed = parseInt(raw as string, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 20
  return Math.min(parsed, maxPageSize)
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

function getQueryRecord(req: FastifyRequest): Record<string, unknown> {
  return (req.query ?? {}) as Record<string, unknown>
}

// ─── Plugin Factory ─────────────────────────────────────────────────────────

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
 * import { createDfePlugin } from '@dmc--98/dfe-fastify'
 * import { PrismaDatabaseAdapter } from '@dmc--98/dfe-prisma'
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
export function createDfePlugin(
  options: DfeFastifyPluginOptions,
): (fastify: FastifyInstance) => Promise<void> {
  const {
    db,
    getUserId = (req: FastifyRequest) => (req as Record<string, any>).user?.id ?? null,
    prefix = '/dfe',
    maxPageSize = 100,
    allowedOptionFilterKeys = [],
    skipAuth = false,
  } = options

  return async (fastify: FastifyInstance) => {
    function authenticateRequest(req: FastifyRequest, reply: FastifyReply): string | null {
      if (skipAuth) return getUserId(req) ?? 'anonymous'
      const userId = getUserId(req)
      if (!userId) {
        reply.code(401).send({ error: 'Authentication required' })
        return null
      }
      return userId
    }

    function verifyOwnership(userId: string, submissionUserId: string, reply: FastifyReply): boolean {
      if (skipAuth) return true
      if (userId !== submissionUserId) {
        reply.code(403).send({ error: 'You do not have permission to access this submission' })
        return false
      }
      return true
    }

    // ── List Published Forms ────────────────────────────────────────────────

    fastify.get(`${prefix}/forms`, async (req, reply) => {
      const query = getQueryRecord(req)
      const cursor = query.cursor as string | undefined
      const pageSize = clampPageSize(query.pageSize as string | undefined, maxPageSize)

      const result = await db.listForms({ cursor: cursor ?? null, pageSize })
      reply.send(result)
    })

    // ── Get Form by Slug ────────────────────────────────────────────────────

    fastify.get(`${prefix}/forms/:slug`, async (req, reply) => {
      const { slug } = req.params as { slug: string }
      const form = await db.getFormBySlug(slug)
      if (!form) {
        reply.code(404).send({ error: 'Form not found' })
        return
      }
      reply.send(form)
    })

    // ── Create Submission ───────────────────────────────────────────────────

    fastify.post(`${prefix}/submissions`, async (req, reply) => {
      const userId = authenticateRequest(req, reply)
      if (!userId) return

      const { formId, versionId } = req.body as Record<string, any>
      if (!formId || typeof formId !== 'string') {
        reply.code(400).send({ error: 'formId is required and must be a string' })
        return
      }
      if (!versionId || typeof versionId !== 'string') {
        reply.code(400).send({ error: 'versionId is required and must be a string' })
        return
      }

      const form = await db.getFormById(formId)
      if (!form) {
        reply.code(404).send({ error: 'Form not found' })
        return
      }

      const context: FormRuntimeContext = { userId }
      const submission = await db.createSubmission({ formId, versionId, userId, context })
      reply.code(201).send(submission)
    })

    // ── Get Submission ──────────────────────────────────────────────────────

    fastify.get(`${prefix}/submissions/:id`, async (req, reply) => {
      const userId = authenticateRequest(req, reply)
      if (!userId) return

      const { id } = req.params as { id: string }
      const submission = await db.getSubmission(id)
      if (!submission) {
        reply.code(404).send({ error: 'Submission not found' })
        return
      }

      if (!verifyOwnership(userId, submission.userId, reply)) return
      reply.send(submission)
    })

    // ── Submit Step ─────────────────────────────────────────────────────────

    fastify.post(`${prefix}/submissions/:id/steps/:stepId`, async (req, reply) => {
      const userId = authenticateRequest(req, reply)
      if (!userId) return

      const { id: submissionId, stepId } = req.params as { id: string; stepId: string }
      const { values, context } = req.body as Record<string, any>

      const submission = await db.getSubmission(submissionId)
      if (!submission) {
        reply.code(404).send({ error: 'Submission not found' })
        return
      }

      if (!verifyOwnership(userId, submission.userId, reply)) return

      if (submission.status === 'COMPLETED') {
        reply.code(409).send({ error: 'Submission is already completed' })
        return
      }

      const form = await db.getFormById(submission.formId)
      if (!form) {
        reply.code(404).send({ error: 'Form not found' })
        return
      }

      const result = await executeStepSubmit({
        form,
        stepId,
        payload: { values, context: context ?? submission.context },
        db,
        submissionId,
      })

      if (result.success) {
        reply.send(result)
      } else {
        reply.code(422).send(result)
      }
    })

    // ── Complete Submission ─────────────────────────────────────────────────

    fastify.post(`${prefix}/submissions/:id/complete`, async (req, reply) => {
      const userId = authenticateRequest(req, reply)
      if (!userId) return

      const { id } = req.params as { id: string }
      const submission = await db.getSubmission(id)
      if (!submission) {
        reply.code(404).send({ error: 'Submission not found' })
        return
      }

      if (!verifyOwnership(userId, submission.userId, reply)) return

      if (submission.status === 'COMPLETED') {
        reply.code(409).send({ error: 'Submission is already completed' })
        return
      }

      await completeSubmission(db, id, submission.context)
      reply.send({ success: true })
    })

    // ── Dynamic Field Options ───────────────────────────────────────────────

    fastify.get(`${prefix}/fields/:fieldId/options`, async (req, reply) => {
      const { fieldId } = req.params as { fieldId: string }
      const query = getQueryRecord(req)
      const cursor = query.cursor as string | undefined
      const pageSize = clampPageSize(query.pageSize as string | undefined, maxPageSize)
      const search = query.q as string | undefined

      // Only pass through explicitly allowed filter keys (prevents injection)
      const filters: Record<string, string> = {}
      for (const key of allowedOptionFilterKeys) {
        const raw = query[key]
        const sanitized = sanitizeFilterValue(raw)
        if (sanitized !== null) {
          filters[key] = sanitized
        }
      }

      const result = await db.fetchFieldOptions(fieldId, {
        cursor: cursor ?? null,
        pageSize,
        search: search ? String(search).slice(0, 200) : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      })

      reply.send(result)
    })
  }
}
