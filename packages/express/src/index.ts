import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import type { FormRuntimeContext } from '@dmc-98/dfe-core'
import {
  buildAnalyticsSummary,
  completeSubmission,
  createAuditLogEntry,
  deriveProtectedFieldPolicies,
  executeStepSubmit,
  getProtectedFieldVault,
  mergeProtectedFieldPolicies,
  redactProtectedFieldVault,
  sanitizeAnalyticsEventForCompliance,
  sanitizeAnalyticsEventsForCompliance,
  selectExperimentVariant,
  storeProtectedFieldVault,
  storeProtectedValuesInContext,
} from '@dmc-98/dfe-server'
import type { DatabaseAdapter, PersistenceAdapter } from '@dmc-98/dfe-server'
import type {
  AuditLogStore,
  ComplianceAnalyticsOptions,
  FieldValueProtector,
  ProtectedFieldPolicy,
} from '@dmc-98/dfe-server'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeRouterOptions {
  /** Database adapter instance */
  db: DatabaseAdapter
  /** Optional persistence adapter (file uploads, etc.) */
  persistence?: PersistenceAdapter
  /**
   * Extract the user ID from the request.
   * Returns null/undefined to indicate an unauthenticated request (will return 401).
   * Defaults to req.user?.id ?? null
   */
  getUserId?: (req: Request) => string | null | undefined
  /**
   * Extract the tenant/organization ID from the request.
   * Defaults to the `x-tenant-id` header when present.
   */
  getTenantId?: (req: Request) => string | null | undefined
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
  /**
   * Optional HIPAA-supporting mode.
   * Enables protected-field analytics redaction, audit logging hooks,
   * and encrypted-at-rest submission vault support without claiming compliance.
   */
  hipaa?: DfeHipaaModeOptions
}

export interface DfeHipaaModeOptions {
  enabled?: boolean
  audit?: AuditLogStore
  fieldPolicies?: ProtectedFieldPolicy[]
  valueProtector?: FieldValueProtector
  analytics?: ComplianceAnalyticsOptions
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

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

function normalizeTenantHeader(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

// ─── Router Factory ─────────────────────────────────────────────────────────

// ─── Rate Limiting ─────────────────────────────────────────────────────────
export { createRateLimiter } from './rate-limit'
export type { RateLimitOptions } from './rate-limit'

/**
 * Create an Express router with all DFE API routes.
 *
 * **Security:** By default, all submission-related endpoints require authentication
 * (getUserId must return a non-null value) and enforce ownership checks (a user can
 * only access their own submissions). Set `skipAuth: true` to disable for development.
 *
 * **Body Size:** Configure `express.json({ limit: '1mb' })` on your Express app
 * to prevent large payload attacks.
 *
 * **Rate Limiting:** Add rate limiting middleware (e.g., `express-rate-limit`) to
 * prevent abuse of submission endpoints.
 */
export function createDfeRouter(options: DfeRouterOptions): Router {
  const {
    db,
    getUserId = (req: Request) => (req as Record<string, any>).user?.id ?? null,
    getTenantId = (req: Request) => normalizeTenantHeader(req.headers['x-tenant-id']),
    prefix = '/dfe',
    maxPageSize = 100,
    allowedOptionFilterKeys = [],
    skipAuth = false,
    hipaa,
  } = options

  const router = Router()

  function tenantIdForRequest(req: Request): string | undefined {
    return getTenantId(req) ?? undefined
  }

  function authenticateRequest(req: Request, res: Response): string | null {
    if (skipAuth) return getUserId(req) ?? 'anonymous'
    const userId = getUserId(req)
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' })
      return null
    }
    return userId
  }

  function verifyOwnership(userId: string, submissionUserId: string, res: Response): boolean {
    if (skipAuth) return true
    if (userId !== submissionUserId) {
      res.status(403).json({ error: 'You do not have permission to access this submission' })
      return false
    }
    return true
  }

  function verifyTenantAccess(req: Request, submissionTenantId: string | null | undefined, res: Response): boolean {
    const tenantId = tenantIdForRequest(req)
    if (tenantId === undefined) {
      return true
    }

    if ((submissionTenantId ?? null) !== tenantId) {
      res.status(403).json({ error: 'You do not have permission to access this tenant resource' })
      return false
    }

    return true
  }

  async function trackEvent(event: Parameters<NonNullable<DatabaseAdapter['trackAnalyticsEvent']>>[0]) {
    if (!db.trackAnalyticsEvent) {
      return
    }

    const sanitized = hipaa?.enabled
      ? sanitizeAnalyticsEventForCompliance(event, hipaa.fieldPolicies ?? [], hipaa.analytics)
      : event

    if (!sanitized) {
      return
    }

    await db.trackAnalyticsEvent(sanitized)
  }

  function getFieldPolicies(form?: { fields: any[] }): ProtectedFieldPolicy[] {
    return mergeProtectedFieldPolicies(
      hipaa?.fieldPolicies,
      form && Array.isArray(form.fields) ? deriveProtectedFieldPolicies(form.fields) : undefined,
    )
  }

  function sanitizeSubmission<T extends { context: FormRuntimeContext }>(submission: T): T {
    if (!hipaa?.enabled) {
      return submission
    }

    return {
      ...submission,
      context: redactProtectedFieldVault(submission.context),
    }
  }

  function seedProtectedContext(
    context: FormRuntimeContext,
    existingContext?: FormRuntimeContext,
  ): FormRuntimeContext {
    if (!hipaa?.enabled || !existingContext) {
      return context
    }

    const existingVault = getProtectedFieldVault(existingContext)
    return existingVault ? storeProtectedFieldVault(context, existingVault) : context
  }

  async function maybeProtectContext(
    context: FormRuntimeContext,
    values: Record<string, unknown>,
    policies: ProtectedFieldPolicy[],
    existingContext?: FormRuntimeContext,
  ): Promise<FormRuntimeContext> {
    const seededContext = seedProtectedContext(context, existingContext)
    if (!hipaa?.enabled || !hipaa.valueProtector) {
      return seededContext
    }

    return storeProtectedValuesInContext(seededContext, values, policies, hipaa.valueProtector)
  }

  async function audit(
    action: string,
    targetType: string,
    actorId: string | null,
    tenantId: string | null | undefined,
    targetId?: string | null,
    metadata?: Record<string, unknown>,
    outcome: 'success' | 'failure' = 'success',
  ) {
    if (!hipaa?.enabled || !hipaa.audit) {
      return
    }

    await hipaa.audit.write(createAuditLogEntry({
      action,
      actorId,
      tenantId: tenantId ?? null,
      targetType,
      targetId,
      outcome,
      metadata,
    }))
  }

  function buildSubmissionContext(
    userId: string,
    tenantId: string | undefined,
    assignment?: {
      experimentId: string
      experimentName: string
      variantId: string
      variantKey: string
      variantLabel: string
      variantOverrides: Record<string, unknown> | null
    },
  ): FormRuntimeContext {
    const dfe: Record<string, unknown> = {
      tenantId: tenantId ?? null,
      experimentId: assignment?.experimentId ?? null,
      experimentName: assignment?.experimentName ?? null,
      variantId: assignment?.variantId ?? null,
      variantKey: assignment?.variantKey ?? null,
      variantLabel: assignment?.variantLabel ?? null,
      variantOverrides: assignment?.variantOverrides ?? null,
    }

    return {
      userId,
      ...(tenantId ? { tenantId } : {}),
      dfe,
    }
  }

  // ── List Published Forms ────────────────────────────────────────────────

  router.get(`${prefix}/forms`, asyncHandler(async (req, res) => {
    const cursor = req.query.cursor as string | undefined
    const pageSize = clampPageSize(req.query.pageSize as string, maxPageSize)
    const tenantId = tenantIdForRequest(req)
    const result = await db.listForms(
      {
        cursor: cursor ?? null,
        pageSize,
        search: typeof req.query.q === 'string' ? req.query.q : undefined,
      },
      { tenantId },
    )

    const items = await Promise.all(result.items.map(async (item) => {
      const submissions = db.listSubmissions
        ? await db.listSubmissions({ tenantId, formId: item.id, limit: 1000 })
        : []
      const summary = db.getAnalyticsSummary
        ? await db.getAnalyticsSummary({ tenantId, formId: item.id })
        : null
      const completed = submissions.filter((submission) => submission.status === 'COMPLETED').length

      return {
        ...item,
        submissionCount: submissions.length,
        completionRate: summary?.completionRate ?? (submissions.length > 0 ? completed / submissions.length : 0),
      }
    }))

    await audit('form.list', 'form', getUserId(req) ?? null, tenantId ?? null, null, {
      pageSize,
      itemCount: items.length,
    })
    res.json({ ...result, items })
  }))

  // ── Get Form by ID ──────────────────────────────────────────────────────

  router.get(`${prefix}/forms/id/:id`, asyncHandler(async (req, res) => {
    const form = await db.getFormById(req.params.id, { tenantId: tenantIdForRequest(req) })
    if (!form) {
      res.status(404).json({ error: 'Form not found' })
      return
    }
    await audit('form.read', 'form', getUserId(req) ?? null, tenantIdForRequest(req) ?? null, form.id, {
      slug: form.slug,
    })
    res.json(form)
  }))

  // ── Get Form by Slug ────────────────────────────────────────────────────

  router.get(`${prefix}/forms/:slug`, asyncHandler(async (req, res) => {
    const form = await db.getFormBySlug(req.params.slug, { tenantId: tenantIdForRequest(req) })
    if (!form) {
      res.status(404).json({ error: 'Form not found' })
      return
    }
    await audit('form.read', 'form', getUserId(req) ?? null, tenantIdForRequest(req) ?? null, form.id, {
      slug: form.slug,
    })
    res.json(form)
  }))

  // ── Create Submission ───────────────────────────────────────────────────

  router.post(`${prefix}/submissions`, asyncHandler(async (req, res) => {
    const userId = authenticateRequest(req, res)
    if (!userId) return

    const tenantId = tenantIdForRequest(req)
    const { formId, versionId } = req.body
    if (!formId || typeof formId !== 'string') {
      res.status(400).json({ error: 'formId is required and must be a string' })
      return
    }
    if (!versionId || typeof versionId !== 'string') {
      res.status(400).json({ error: 'versionId is required and must be a string' })
      return
    }

    const access = { tenantId, userId }
    const form = await db.getFormById(formId, access)
    if (!form) {
      res.status(404).json({ error: 'Form not found' })
      return
    }

    const experiment = await db.getActiveExperimentForForm?.(formId, access)
    const variant = experiment ? selectExperimentVariant(experiment, `${tenantId ?? 'public'}:${userId}`) : null
    const assignment = experiment && variant ? {
      experimentId: experiment.id,
      experimentName: experiment.name,
      variantId: variant.id,
      variantKey: variant.key,
      variantLabel: variant.label,
      variantOverrides: (variant.overrides as Record<string, unknown> | null) ?? null,
    } : undefined
    const context = buildSubmissionContext(userId, tenantId, assignment)
    const fieldPolicies = getFieldPolicies(form)

    const submission = await db.createSubmission({
      tenantId: tenantId ?? null,
      formId,
      versionId,
      userId,
      context,
      experimentId: assignment?.experimentId ?? null,
      variantId: assignment?.variantId ?? null,
      variantKey: assignment?.variantKey ?? null,
    })

    if (assignment) {
      await trackEvent({
        tenantId,
        formId,
        submissionId: submission.id,
        event: 'variant_assigned',
        experimentId: assignment.experimentId,
        variantId: assignment.variantId,
        variantKey: assignment.variantKey,
        metadata: {
          experimentName: assignment.experimentName,
          variantLabel: assignment.variantLabel,
          variantOverrides: assignment.variantOverrides,
        },
        timestamp: Date.now(),
      })
    }

    await trackEvent({
      tenantId,
      formId,
      submissionId: submission.id,
      event: 'form_started',
      experimentId: assignment?.experimentId,
      variantId: assignment?.variantId,
      variantKey: assignment?.variantKey,
      metadata: {
        variantLabel: assignment?.variantLabel,
      },
      timestamp: Date.now(),
    })

    const firstStep = form.steps[0]
    if (firstStep) {
      await trackEvent({
        tenantId,
        formId,
        submissionId: submission.id,
        event: 'step_viewed',
        stepId: firstStep.id,
        experimentId: assignment?.experimentId,
        variantId: assignment?.variantId,
        variantKey: assignment?.variantKey,
        metadata: {
          stepTitle: firstStep.title,
          variantLabel: assignment?.variantLabel,
        },
        timestamp: Date.now(),
      })
    }

    await audit('submission.create', 'submission', userId, tenantId ?? null, submission.id, {
      formId,
      versionId,
      protectedFieldCount: fieldPolicies.filter((policy) => policy.protectAtRest).length,
    })

    res.status(201).json(sanitizeSubmission(submission))
  }))

  // ── List Submissions ────────────────────────────────────────────────────

  router.get(`${prefix}/submissions`, asyncHandler(async (req, res) => {
    const userId = authenticateRequest(req, res)
    if (!userId) return

    if (!db.listSubmissions) {
      res.status(501).json({ error: 'Submission listing is not supported by this adapter' })
      return
    }

    const tenantId = tenantIdForRequest(req)
    const submissions = await db.listSubmissions({
      tenantId,
      formId: typeof req.query.formId === 'string' ? req.query.formId : undefined,
      status: typeof req.query.status === 'string' ? req.query.status as any : undefined,
      limit: clampPageSize(req.query.limit as string | undefined, 500),
    })

    await audit('submission.list', 'submission', userId, tenantId ?? null, null, {
      count: submissions.length,
      formId: typeof req.query.formId === 'string' ? req.query.formId : null,
      status: typeof req.query.status === 'string' ? req.query.status : null,
    })

    res.json(submissions.map((submission) => sanitizeSubmission(submission)))
  }))

  // ── Get Submission ──────────────────────────────────────────────────────

  router.get(`${prefix}/submissions/:id`, asyncHandler(async (req, res) => {
    const userId = authenticateRequest(req, res)
    if (!userId) return

    const submission = await db.getSubmission(req.params.id)
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' })
      return
    }

    if (!verifyTenantAccess(req, submission.tenantId, res)) return
    if (!verifyOwnership(userId, submission.userId, res)) return
    await audit('submission.read', 'submission', userId, submission.tenantId ?? null, submission.id, {
      formId: submission.formId,
      status: submission.status,
    })
    res.json(sanitizeSubmission(submission))
  }))

  // ── Submit Step ─────────────────────────────────────────────────────────

  router.post(`${prefix}/submissions/:id/steps/:stepId`, asyncHandler(async (req, res) => {
    const userId = authenticateRequest(req, res)
    if (!userId) return

    const { id: submissionId, stepId } = req.params
    const { values, context } = req.body

    const submission = await db.getSubmission(submissionId)
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' })
      return
    }

    if (!verifyTenantAccess(req, submission.tenantId, res)) return
    if (!verifyOwnership(userId, submission.userId, res)) return

    if (submission.status === 'COMPLETED') {
      res.status(409).json({ error: 'Submission is already completed' })
      return
    }

    const form = await db.getFormById(submission.formId, {
      tenantId: tenantIdForRequest(req),
      userId,
    })
    if (!form) {
      res.status(404).json({ error: 'Form not found' })
      return
    }

    const fieldPolicies = getFieldPolicies(form)
    const payloadContext = await maybeProtectContext(
      (context ?? submission.context) as FormRuntimeContext,
      values ?? {},
      fieldPolicies,
      submission.context,
    )

    const result = await executeStepSubmit({
      form,
      stepId,
      payload: { values, context: payloadContext },
      db,
      submissionId,
    })

    if (result.success) {
      const submittedStep = form.steps.find((step) => step.id === stepId)
      const nextStep = form.steps.find((step) => step.order > (submittedStep?.order ?? -1))

      await trackEvent({
        tenantId: submission.tenantId ?? undefined,
        formId: submission.formId,
        submissionId,
        event: 'step_completed',
        stepId,
        experimentId: submission.experimentId ?? undefined,
        variantId: submission.variantId ?? undefined,
        variantKey: submission.variantKey ?? undefined,
        metadata: {
          stepTitle: submittedStep?.title ?? stepId,
          variantLabel: (result.context as any)?.dfe?.variantLabel,
        },
        timestamp: Date.now(),
      })

      if (nextStep) {
        await trackEvent({
          tenantId: submission.tenantId ?? undefined,
          formId: submission.formId,
          submissionId,
          event: 'step_viewed',
          stepId: nextStep.id,
          experimentId: submission.experimentId ?? undefined,
          variantId: submission.variantId ?? undefined,
          variantKey: submission.variantKey ?? undefined,
          metadata: {
            stepTitle: nextStep.title,
            variantLabel: (result.context as any)?.dfe?.variantLabel,
          },
          timestamp: Date.now(),
        })
      }

      await audit('submission.write', 'submission', userId, submission.tenantId ?? null, submissionId, {
        stepId,
        outcome: 'validated',
        protectedFieldCount: fieldPolicies.filter(
          (policy) => policy.protectAtRest && values?.[policy.key] !== undefined,
        ).length,
      })

      res.json({
        ...result,
        context: redactProtectedFieldVault(result.context),
      })
    } else {
      const fieldErrors = Object.entries(result.errors ?? {})
        .filter(([key]) => !key.startsWith('_'))

      await Promise.all(fieldErrors.map(async ([fieldKey, error]) => {
        const field = form.fields.find((candidate) => candidate.key === fieldKey)
        const event = sanitizeAnalyticsEventForCompliance({
          tenantId: submission.tenantId ?? undefined,
          formId: submission.formId,
          submissionId,
          event: 'field_error',
          stepId,
          fieldKey,
          experimentId: submission.experimentId ?? undefined,
          variantId: submission.variantId ?? undefined,
          variantKey: submission.variantKey ?? undefined,
          metadata: {
            fieldLabel: field?.label ?? fieldKey,
            error,
            variantLabel: (submission.context as any)?.dfe?.variantLabel,
          },
          timestamp: Date.now(),
        }, fieldPolicies, hipaa?.analytics)

        if (!event) {
          return
        }

        await trackEvent(event)
      }))

      await audit('submission.write', 'submission', userId, submission.tenantId ?? null, submissionId, {
        stepId,
        outcome: 'validation_failed',
        errorCount: fieldErrors.length,
      }, 'failure')

      res.status(422).json(result)
    }
  }))

  // ── Complete Submission ─────────────────────────────────────────────────

  router.post(`${prefix}/submissions/:id/complete`, asyncHandler(async (req, res) => {
    const userId = authenticateRequest(req, res)
    if (!userId) return

    const submission = await db.getSubmission(req.params.id)
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' })
      return
    }

    if (!verifyTenantAccess(req, submission.tenantId, res)) return
    if (!verifyOwnership(userId, submission.userId, res)) return

    if (submission.status === 'COMPLETED') {
      res.status(409).json({ error: 'Submission is already completed' })
      return
    }

    await completeSubmission(db, req.params.id, submission.context)
    await trackEvent({
      tenantId: submission.tenantId ?? undefined,
      formId: submission.formId,
      submissionId: req.params.id,
      event: 'form_completed',
      experimentId: submission.experimentId ?? undefined,
      variantId: submission.variantId ?? undefined,
      variantKey: submission.variantKey ?? undefined,
      metadata: {
        variantLabel: (submission.context as any)?.dfe?.variantLabel,
      },
      timestamp: Date.now(),
    })
    await audit('submission.complete', 'submission', userId, submission.tenantId ?? null, req.params.id, {
      formId: submission.formId,
    })
    res.json({ success: true })
  }))

  // ── Analytics Summary ───────────────────────────────────────────────────

  router.get(`${prefix}/analytics`, asyncHandler(async (req, res) => {
    const userId = authenticateRequest(req, res)
    if (!userId) return

    const tenantId = tenantIdForRequest(req)
    const query = {
      tenantId,
      formId: typeof req.query.formId === 'string' ? req.query.formId : undefined,
      from: typeof req.query.from === 'string' ? Number(req.query.from) : undefined,
      to: typeof req.query.to === 'string' ? Number(req.query.to) : undefined,
    }

    const analyticsForm = query.formId
      ? await db.getFormById(query.formId, { tenantId, userId })
      : null
    const fieldPolicies = getFieldPolicies(analyticsForm ?? undefined)

    if (hipaa?.enabled && fieldPolicies.length > 0) {
      if (!db.listAnalyticsEvents) {
        res.status(501).json({
          error: 'HIPAA-supporting analytics mode requires event-level analytics access from the adapter',
        })
        return
      }

      const events = sanitizeAnalyticsEventsForCompliance(
        await db.listAnalyticsEvents(query),
        fieldPolicies,
        hipaa.analytics,
      )
      await audit('analytics.read', 'analytics', userId, tenantId ?? null, query.formId ?? null, {
        eventCount: events.length,
        protectedFieldPolicyCount: fieldPolicies.length,
      })
      res.json(buildAnalyticsSummary(events, {
        totalForms: query.formId ? 1 : new Set(events.map((event) => event.formId)).size,
      }))
      return
    }

    if (db.getAnalyticsSummary) {
      await audit('analytics.read', 'analytics', userId, tenantId ?? null, query.formId ?? null, {
        protectedFieldPolicyCount: fieldPolicies.length,
      })
      res.json(await db.getAnalyticsSummary(query))
      return
    }

    if (db.listAnalyticsEvents) {
      const events = await db.listAnalyticsEvents(query)
      await audit('analytics.read', 'analytics', userId, tenantId ?? null, query.formId ?? null, {
        eventCount: events.length,
      })
      res.json(buildAnalyticsSummary(events, {
        totalForms: query.formId ? 1 : new Set(events.map((event) => event.formId)).size,
      }))
      return
    }

    res.status(501).json({ error: 'Analytics are not supported by this adapter' })
  }))

  // ── Dynamic Field Options ───────────────────────────────────────────────

  router.get(`${prefix}/fields/:fieldId/options`, asyncHandler(async (req, res) => {
    const { fieldId } = req.params
    const cursor = req.query.cursor as string | undefined
    const pageSize = clampPageSize(req.query.pageSize as string, maxPageSize)
    const search = req.query.q as string | undefined

    const filters: Record<string, string> = {}
    for (const key of allowedOptionFilterKeys) {
      const raw = req.query[key]
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

    res.json(result)
  }))

  return router
}
