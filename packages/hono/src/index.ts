import { Hono } from 'hono'
import type { Context } from 'hono'
import type { FormRuntimeContext } from '@dmc--98/dfe-core'
import {
  buildAnalyticsSummary,
  CollaborationStoreError,
  completeSubmission,
  createAuditLogEntry,
  deriveProtectedFieldPolicies,
  executeStepSubmit,
  getProtectedFieldVault,
  mergeProtectedFieldPolicies,
  redactProtectedFieldVault,
  sanitizeAnalyticsEventForCompliance,
  sanitizeAnalyticsEventsForCompliance,
  type CollaborationAccessContext,
  type CollaborationJoinSessionInput,
  type CollaborationStore,
  type DatabaseAdapter,
  type AuditLogStore,
  type ComplianceAnalyticsOptions,
  type FieldValueProtector,
  type PersistenceAdapter,
  type ProtectedFieldPolicy,
  storeProtectedFieldVault,
  storeProtectedValuesInContext,
} from '@dmc--98/dfe-server'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeHonoCollaborationOptions {
  /** Collaboration session store */
  store: CollaborationStore
  /** How frequently the SSE stream should poll for new events (default: 1000) */
  pollIntervalMs?: number
  /** Presence records older than this are pruned on read/write (default: 45000) */
  presenceTtlMs?: number
}

export interface DfeHonoAppOptions {
  /** Database adapter instance */
  db: DatabaseAdapter
  /** Optional persistence adapter (file uploads, etc.) */
  persistence?: PersistenceAdapter
  /**
   * Extract the user ID from the context.
   * Returns null/undefined to indicate an unauthenticated request (will return 401).
   * Defaults to c.get('user')?.id, then `x-user-id`, then `userId` query param.
   */
  getUserId?: (c: Context) => string | null | undefined
  /**
   * Extract the tenant/organization ID from the context.
   * Defaults to the `x-tenant-id` header, then `tenantId` query param.
   */
  getTenantId?: (c: Context) => string | null | undefined
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
  /** Optional collaboration routes for remote multi-user sync */
  collaboration?: DfeHonoCollaborationOptions
  /** Optional HIPAA-supporting mode for serverless-friendly audit and analytics controls */
  hipaa?: DfeHonoHipaaModeOptions
}

export interface DfeHonoHipaaModeOptions {
  enabled?: boolean
  audit?: AuditLogStore
  fieldPolicies?: ProtectedFieldPolicy[]
  valueProtector?: FieldValueProtector
  analytics?: ComplianceAnalyticsOptions
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clampPageSize(raw: string | undefined, maxPageSize: number): number {
  const parsed = parseInt(raw as string, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 20
  return Math.min(parsed, maxPageSize)
}

function sanitizeFilterValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (/[{}\[\]$]/.test(value)) return null
  if (value.length > 200) return null
  return value
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function encodeSseMessage(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function encodeSseComment(value: string) {
  return `: ${value}\n\n`
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function collaborationErrorResponse(c: Context, error: CollaborationStoreError) {
  if (error.code === 'ACCESS_DENIED') {
    return c.json({ error: error.message }, 403)
  }

  if (error.code === 'SESSION_NOT_FOUND') {
    return c.json({ error: error.message }, 404)
  }

  if (error.code === 'SCOPE_MISMATCH') {
    return c.json({ error: error.message }, 409)
  }

  return c.json({ error: error.message }, 400)
}

// ─── App Factory ────────────────────────────────────────────────────────────

export function createDfeApp(options: DfeHonoAppOptions): Hono {
  const {
    db,
    getUserId = (c: Context) => (c.get('user') as any)?.id
      ?? c.req.header('x-user-id')
      ?? c.req.query('userId')
      ?? null,
    getTenantId = (c: Context) => c.req.header('x-tenant-id') ?? c.req.query('tenantId') ?? null,
    prefix = '/dfe',
    maxPageSize = 100,
    allowedOptionFilterKeys = [],
    skipAuth = false,
    collaboration,
    hipaa,
  } = options

  const app = new Hono()

  function tenantIdForRequest(c: Context): string | undefined {
    return toOptionalString(getTenantId(c))
  }

  function authenticateRequest(c: Context): string | null {
    if (skipAuth) return getUserId(c) ?? 'anonymous'
    const userId = getUserId(c)
    if (!userId) {
      c.status(401)
      return null
    }
    return userId
  }

  function buildAccess(c: Context, userId: string): CollaborationAccessContext {
    return {
      tenantId: tenantIdForRequest(c) ?? undefined,
      userId,
    }
  }

  function verifyOwnership(userId: string, submissionUserId: string, c: Context): boolean {
    if (skipAuth) return true
    if (userId !== submissionUserId) {
      c.status(403)
      return false
    }
    return true
  }

  function verifyTenantAccess(c: Context, resourceTenantId: string | null | undefined): boolean {
    const tenantId = tenantIdForRequest(c)
    if (tenantId === undefined) {
      return true
    }

    if ((resourceTenantId ?? null) !== tenantId) {
      c.status(403)
      return false
    }

    return true
  }

  function getFieldPolicies(form?: { fields: any[] }): ProtectedFieldPolicy[] {
    return mergeProtectedFieldPolicies(
      hipaa?.fieldPolicies,
      form && Array.isArray(form.fields) ? deriveProtectedFieldPolicies(form.fields) : undefined,
    )
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

  app.get(`${prefix}/forms`, async (c) => {
    const cursor = c.req.query('cursor')
    const pageSize = clampPageSize(c.req.query('pageSize'), maxPageSize)
    const search = c.req.query('q')
    const tenantId = tenantIdForRequest(c)

    const result = await db.listForms({
      cursor: cursor ?? null,
      pageSize,
      search: search ? String(search).slice(0, 200) : undefined,
    }, {
      tenantId,
    })

    await audit('form.list', 'form', getUserId(c) ?? null, tenantId ?? null, null, {
      pageSize,
      itemCount: result.items.length,
    })
    return c.json(result)
  })

  app.get(`${prefix}/forms/id/:id`, async (c) => {
    const form = await db.getFormById(c.req.param('id'), {
      tenantId: tenantIdForRequest(c),
    })
    if (!form) {
      return c.json({ error: 'Form not found' }, 404)
    }
    await audit('form.read', 'form', getUserId(c) ?? null, tenantIdForRequest(c) ?? null, form.id, {
      slug: form.slug,
    })
    return c.json(form)
  })

  app.get(`${prefix}/forms/:slug`, async (c) => {
    const slug = c.req.param('slug')
    const form = await db.getFormBySlug(slug, {
      tenantId: tenantIdForRequest(c),
    })
    if (!form) {
      return c.json({ error: 'Form not found' }, 404)
    }
    await audit('form.read', 'form', getUserId(c) ?? null, tenantIdForRequest(c) ?? null, form.id, {
      slug: form.slug,
    })
    return c.json(form)
  })

  app.post(`${prefix}/submissions`, async (c) => {
    const userId = authenticateRequest(c)
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const { formId, versionId } = await c.req.json()
    if (!formId || typeof formId !== 'string') {
      return c.json({ error: 'formId is required and must be a string' }, 400)
    }
    if (!versionId || typeof versionId !== 'string') {
      return c.json({ error: 'versionId is required and must be a string' }, 400)
    }

    const tenantId = tenantIdForRequest(c)
    const form = await db.getFormById(formId, { tenantId, userId })
    if (!form) {
      return c.json({ error: 'Form not found' }, 404)
    }

    const context: FormRuntimeContext = tenantId
      ? { userId, tenantId }
      : { userId }
    const submission = await db.createSubmission({
      tenantId: tenantId ?? null,
      formId,
      versionId,
      userId,
      context,
    })
    const fieldPolicies = getFieldPolicies(form)

    await trackEvent({
      tenantId,
      formId,
      submissionId: submission.id,
      event: 'form_started',
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
        metadata: { stepTitle: firstStep.title },
        timestamp: Date.now(),
      })
    }

    await audit('submission.create', 'submission', userId, tenantId ?? null, submission.id, {
      formId,
      versionId,
      protectedFieldCount: fieldPolicies.filter((policy) => policy.protectAtRest).length,
    })

    return c.json(sanitizeSubmission(submission), 201)
  })

  app.get(`${prefix}/submissions/:id`, async (c) => {
    const userId = authenticateRequest(c)
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const id = c.req.param('id')
    const submission = await db.getSubmission(id)
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    if (!verifyOwnership(userId, submission.userId, c)) {
      return c.json({ error: 'You do not have permission to access this submission' }, 403)
    }

    if (!verifyTenantAccess(c, submission.tenantId)) {
      return c.json({ error: 'You do not have permission to access this tenant resource' }, 403)
    }

    await audit('submission.read', 'submission', userId, submission.tenantId ?? null, submission.id, {
      formId: submission.formId,
      status: submission.status,
    })
    return c.json(sanitizeSubmission(submission))
  })

  app.post(`${prefix}/submissions/:id/steps/:stepId`, async (c) => {
    const userId = authenticateRequest(c)
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const submissionId = c.req.param('id')
    const stepId = c.req.param('stepId')
    const { values, context } = await c.req.json()

    const submission = await db.getSubmission(submissionId)
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    if (!verifyOwnership(userId, submission.userId, c)) {
      return c.json({ error: 'You do not have permission to access this submission' }, 403)
    }

    if (!verifyTenantAccess(c, submission.tenantId)) {
      return c.json({ error: 'You do not have permission to access this tenant resource' }, 403)
    }

    if (submission.status === 'COMPLETED') {
      return c.json({ error: 'Submission is already completed' }, 409)
    }

    const form = await db.getFormById(submission.formId, {
      tenantId: submission.tenantId ?? undefined,
      userId,
    })
    if (!form) {
      return c.json({ error: 'Form not found' }, 404)
    }

    const fieldPolicies = getFieldPolicies(form)
    const nextContext: FormRuntimeContext = {
      ...(submission.context ?? {}),
      ...(context ?? {}),
      userId,
    }
    if (submission.tenantId) {
      nextContext.tenantId = submission.tenantId
    }

    const payloadContext = await maybeProtectContext(
      nextContext,
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
        metadata: { stepTitle: submittedStep?.title ?? stepId },
        timestamp: Date.now(),
      })

      if (nextStep) {
        await trackEvent({
          tenantId: submission.tenantId ?? undefined,
          formId: submission.formId,
          submissionId,
          event: 'step_viewed',
          stepId: nextStep.id,
          metadata: { stepTitle: nextStep.title },
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

      return c.json({
        ...result,
        context: redactProtectedFieldVault(result.context),
      })
    }

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
        metadata: {
          fieldLabel: field?.label ?? fieldKey,
          error,
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

    return c.json(result, 422)
  })

  app.post(`${prefix}/submissions/:id/complete`, async (c) => {
    const userId = authenticateRequest(c)
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const id = c.req.param('id')
    const submission = await db.getSubmission(id)
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    if (!verifyOwnership(userId, submission.userId, c)) {
      return c.json({ error: 'You do not have permission to access this submission' }, 403)
    }

    if (!verifyTenantAccess(c, submission.tenantId)) {
      return c.json({ error: 'You do not have permission to access this tenant resource' }, 403)
    }

    if (submission.status === 'COMPLETED') {
      return c.json({ error: 'Submission is already completed' }, 409)
    }

    await completeSubmission(db, id, submission.context)
    await trackEvent({
      tenantId: submission.tenantId ?? undefined,
      formId: submission.formId,
      submissionId: id,
      event: 'form_completed',
      timestamp: Date.now(),
    })
    await audit('submission.complete', 'submission', userId, submission.tenantId ?? null, id, {
      formId: submission.formId,
    })
    return c.json({ success: true })
  })

  app.get(`${prefix}/analytics`, async (c) => {
    const userId = authenticateRequest(c)
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const tenantId = tenantIdForRequest(c)
    const query = {
      tenantId,
      formId: c.req.query('formId') ?? undefined,
      from: c.req.query('from') ? Number(c.req.query('from')) : undefined,
      to: c.req.query('to') ? Number(c.req.query('to')) : undefined,
    }

    const analyticsForm = query.formId
      ? await db.getFormById(query.formId, { tenantId, userId })
      : null
    const fieldPolicies = getFieldPolicies(analyticsForm ?? undefined)

    if (hipaa?.enabled && fieldPolicies.length > 0) {
      if (!db.listAnalyticsEvents) {
        return c.json({
          error: 'HIPAA-supporting analytics mode requires event-level analytics access from the adapter',
        }, 501)
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
      return c.json(buildAnalyticsSummary(events, {
        totalForms: query.formId ? 1 : new Set(events.map((event) => event.formId)).size,
      }))
    }

    if (db.getAnalyticsSummary) {
      await audit('analytics.read', 'analytics', userId, tenantId ?? null, query.formId ?? null, {
        protectedFieldPolicyCount: fieldPolicies.length,
      })
      return c.json(await db.getAnalyticsSummary(query))
    }

    if (db.listAnalyticsEvents) {
      const events = await db.listAnalyticsEvents(query)
      await audit('analytics.read', 'analytics', userId, tenantId ?? null, query.formId ?? null, {
        eventCount: events.length,
      })
      return c.json(buildAnalyticsSummary(events, {
        totalForms: query.formId ? 1 : new Set(events.map((event) => event.formId)).size,
      }))
    }

    return c.json({ error: 'Analytics are not supported by this adapter' }, 501)
  })

  app.get(`${prefix}/fields/:fieldId/options`, async (c) => {
    const fieldId = c.req.param('fieldId')
    const cursor = c.req.query('cursor')
    const pageSize = clampPageSize(c.req.query('pageSize'), maxPageSize)
    const search = c.req.query('q')

    const filters: Record<string, string> = {}
    for (const key of allowedOptionFilterKeys) {
      const raw = c.req.query(key)
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

    return c.json(result)
  })

  if (collaboration) {
    const collaborationPrefix = `${prefix}/collab/sessions/:sessionId`
    const pollIntervalMs = collaboration.pollIntervalMs ?? 1_000
    const presenceTtlMs = collaboration.presenceTtlMs ?? 45_000

    app.post(`${collaborationPrefix}/join`, async (c) => {
      const userId = authenticateRequest(c)
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      try {
        const sessionId = c.req.param('sessionId') ?? ''
        const body = await c.req.json()
        if (!body?.actorId || typeof body.actorId !== 'string') {
          return c.json({ error: 'actorId is required and must be a string' }, 400)
        }
        if (!body?.displayName || typeof body.displayName !== 'string') {
          return c.json({ error: 'displayName is required and must be a string' }, 400)
        }

        await collaboration.store.prunePresence(sessionId, presenceTtlMs, buildAccess(c, userId)).catch(() => 0)

        const result = await collaboration.store.joinSession({
          sessionId,
          actorId: body.actorId,
          displayName: body.displayName,
          color: toOptionalString(body.color),
          tenantId: tenantIdForRequest(c) ?? null,
          userId,
          formId: toOptionalString(body.formId) ?? null,
          versionId: toOptionalString(body.versionId) ?? null,
          submissionId: toOptionalString(body.submissionId) ?? null,
          metadata: typeof body.metadata === 'object' && body.metadata !== null
            ? body.metadata as Record<string, unknown>
            : undefined,
        } satisfies CollaborationJoinSessionInput)

        return c.json(result)
      } catch (error) {
        if (error instanceof CollaborationStoreError) {
          return collaborationErrorResponse(c, error)
        }
        throw error
      }
    })

    app.get(`${collaborationPrefix}/snapshot`, async (c) => {
      const userId = authenticateRequest(c)
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      try {
        const sessionId = c.req.param('sessionId') ?? ''
        await collaboration.store.prunePresence(sessionId, presenceTtlMs, buildAccess(c, userId)).catch(() => 0)
        const snapshot = await collaboration.store.getSnapshot(sessionId, buildAccess(c, userId))
        if (!snapshot) {
          return c.json({ error: 'Collaboration session not found' }, 404)
        }

        return c.json({ snapshot })
      } catch (error) {
        if (error instanceof CollaborationStoreError) {
          return collaborationErrorResponse(c, error)
        }
        throw error
      }
    })

    app.post(`${collaborationPrefix}/snapshot`, async (c) => {
      const userId = authenticateRequest(c)
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      try {
        const sessionId = c.req.param('sessionId') ?? ''
        const body = await c.req.json()
        if (!body?.snapshot || typeof body.snapshot !== 'object') {
          return c.json({ error: 'snapshot is required' }, 400)
        }

        const record = await collaboration.store.saveSnapshot({
          sessionId,
          actorId: typeof body.actorId === 'string' ? body.actorId : null,
          access: buildAccess(c, userId),
          snapshot: body.snapshot,
        })

        return c.json(record, 201)
      } catch (error) {
        if (error instanceof CollaborationStoreError) {
          return collaborationErrorResponse(c, error)
        }
        throw error
      }
    })

    app.post(`${collaborationPrefix}/operations`, async (c) => {
      const userId = authenticateRequest(c)
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      try {
        const sessionId = c.req.param('sessionId') ?? ''
        const body = await c.req.json()
        const operation = body?.operation
        if (!operation || typeof operation !== 'object') {
          return c.json({ error: 'operation is required' }, 400)
        }
        if (operation.sessionId !== sessionId) {
          return c.json({ error: 'operation.sessionId must match the route sessionId' }, 400)
        }

        const record = await collaboration.store.appendOperation({
          sessionId,
          access: buildAccess(c, userId),
          operation,
        })
        return c.json(record, 201)
      } catch (error) {
        if (error instanceof CollaborationStoreError) {
          return collaborationErrorResponse(c, error)
        }
        throw error
      }
    })

    app.post(`${collaborationPrefix}/presence`, async (c) => {
      const userId = authenticateRequest(c)
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      try {
        const sessionId = c.req.param('sessionId') ?? ''
        const body = await c.req.json()
        const presence = body?.presence
        if (!presence || typeof presence !== 'object') {
          return c.json({ error: 'presence is required' }, 400)
        }
        if (presence.sessionId !== sessionId) {
          return c.json({ error: 'presence.sessionId must match the route sessionId' }, 400)
        }

        await collaboration.store.prunePresence(sessionId, presenceTtlMs, buildAccess(c, userId)).catch(() => 0)
        const record = await collaboration.store.appendPresence({
          sessionId,
          access: buildAccess(c, userId),
          presence,
        })
        return c.json(record, 201)
      } catch (error) {
        if (error instanceof CollaborationStoreError) {
          return collaborationErrorResponse(c, error)
        }
        throw error
      }
    })

    app.get(`${collaborationPrefix}/stream`, async (c) => {
      const userId = authenticateRequest(c)
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      const sessionId = c.req.param('sessionId') ?? ''
      const access = buildAccess(c, userId)
      const afterSequence = Math.max(0, Number.parseInt(c.req.query('after') ?? '0', 10) || 0)
      const signal = c.req.raw.signal
      const encoder = new TextEncoder()

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          let closed = false
          let cursor = afterSequence

          const close = () => {
            if (!closed) {
              closed = true
              controller.close()
            }
          }

          const push = (chunk: string) => {
            if (!closed) {
              controller.enqueue(encoder.encode(chunk))
            }
          }

          if (signal) {
            signal.addEventListener('abort', close, { once: true })
          }

          push(encodeSseComment('connected'))

          const poll = async () => {
            while (!closed && !signal?.aborted) {
              try {
                await collaboration.store.prunePresence(sessionId, presenceTtlMs, access).catch(() => 0)
                const events = await collaboration.store.listEvents(sessionId, {
                  afterSequence: cursor,
                  limit: 100,
                }, access)

                if (events.length === 0) {
                  push(encodeSseComment('keepalive'))
                }

                for (const event of events) {
                  cursor = event.sequence
                  push(encodeSseMessage('message', event))
                }
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                push(encodeSseMessage('error', { error: message }))
                close()
                return
              }

              await delay(pollIntervalMs)
            }

            close()
          }

          poll().catch((error) => {
            push(encodeSseMessage('error', {
              error: error instanceof Error ? error.message : String(error),
            }))
            close()
          })
        },
        cancel() {
          return undefined
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    })
  }

  return app
}
