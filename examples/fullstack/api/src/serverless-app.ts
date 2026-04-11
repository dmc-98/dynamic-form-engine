import { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import { PrismaCollaborationStore, PrismaDatabaseAdapter } from '@dmc-98/dfe-prisma'
import { cors } from 'hono/cors'
import { createDfeApp } from '@dmc-98/dfe-hono'
import { createAuditLogEntry } from '@dmc-98/dfe-server'
import {
  exampleHipaaAuditStore,
  exampleHipaaValueProtector,
  getExampleHipaaFieldPolicies,
  revealExampleProtectedValues,
} from './compliance'

const prisma = new PrismaClient()
const db = new PrismaDatabaseAdapter(prisma)
const collaboration = new PrismaCollaborationStore(prisma as any)
const defaultTenantId = process.env.DFE_TENANT_ID ?? 'demo-tenant'

export function createServerlessApp() {
  const api = createDfeApp({
    db,
    prefix: '/api/dfe',
    allowedOptionFilterKeys: ['department'],
    hipaa: {
      enabled: true,
      audit: exampleHipaaAuditStore,
      fieldPolicies: getExampleHipaaFieldPolicies(),
      valueProtector: exampleHipaaValueProtector,
    },
    collaboration: {
      store: collaboration,
      pollIntervalMs: Number.parseInt(process.env.DFE_COLLAB_POLL_MS ?? '250', 10),
      presenceTtlMs: Number.parseInt(process.env.DFE_COLLAB_PRESENCE_TTL_MS ?? '45000', 10),
    },
    getTenantId: (c) => c.req.header('x-tenant-id') ?? c.req.query('tenantId') ?? defaultTenantId,
    getUserId: (c) => c.req.header('x-user-id') ?? c.req.query('userId') ?? 'demo-user',
  })

  const app = new Hono()
  app.use('*', cors())
  app.route('/', api)

  app.get('/health', (c) => c.json({ status: 'ok', mode: 'serverless' }))

  app.get('/api/compliance/audit-log', async (c) => {
    const tenantId = c.req.header('x-tenant-id') ?? c.req.query('tenantId') ?? defaultTenantId
    const entries = await exampleHipaaAuditStore.list({ tenantId, limit: 100 })
    return c.json({ count: entries.length, entries })
  })

  app.get('/api/compliance/submissions/:id/export', async (c) => {
    const submission = await db.getSubmission(c.req.param('id'))
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    const tenantId = c.req.header('x-tenant-id') ?? c.req.query('tenantId') ?? defaultTenantId
    if ((submission.tenantId ?? null) !== tenantId) {
      return c.json({ error: 'Tenant mismatch' }, 403)
    }

    const actorId = c.req.header('x-user-id') ?? c.req.query('userId') ?? 'demo-user'
    if (submission.userId !== actorId) {
      return c.json({ error: 'You do not have permission to export this submission' }, 403)
    }

    const form = await db.getFormById(submission.formId, { tenantId, userId: actorId })

    await exampleHipaaAuditStore.write(createAuditLogEntry({
      action: 'submission.export',
      actorId,
      tenantId,
      targetType: 'submission',
      targetId: submission.id,
      outcome: 'success',
      metadata: {
        formId: submission.formId,
      },
    }))

    return c.json({
      submission: {
        ...submission,
        context: {
          ...submission.context,
          dfe: {
            ...((submission.context as any)?.dfe ?? {}),
            protectedFields: {
              redacted: true,
            },
          },
        },
      },
      protectedValues: await revealExampleProtectedValues(submission.context, form ?? undefined),
    })
  })

  return app
}

export const app = createServerlessApp()
