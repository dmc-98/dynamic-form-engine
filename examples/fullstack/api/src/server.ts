import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { PrismaDatabaseAdapter } from '@dmc--98/dfe-prisma'
import { createDfeRouter } from '@dmc--98/dfe-express'
import {
  createInMemorySpanExporter,
  createOpenTelemetryTracer,
  createTracingMiddleware,
  createAuditLogEntry,
} from '@dmc--98/dfe-server'
import {
  exampleHipaaAuditStore,
  exampleHipaaValueProtector,
  getExampleHipaaFieldPolicies,
  revealExampleProtectedValues,
} from './compliance'

const prisma = new PrismaClient()
const db = new PrismaDatabaseAdapter(prisma)
const exporter = createInMemorySpanExporter()
const tracer = createOpenTelemetryTracer({
  serviceName: 'dfe-example-api',
  exporter,
})
const defaultTenantId = process.env.DFE_TENANT_ID ?? 'demo-tenant'

const app = express()
app.use(cors())
app.use(express.json())
app.use(createTracingMiddleware(tracer))

// Mount DFE routes at /api/dfe/*
app.use('/api', createDfeRouter({
  db,
  allowedOptionFilterKeys: ['department'],
  hipaa: {
    enabled: true,
    audit: exampleHipaaAuditStore,
    fieldPolicies: getExampleHipaaFieldPolicies(),
    valueProtector: exampleHipaaValueProtector,
  },
  getTenantId: (req) => {
    return (req as any).headers['x-tenant-id'] as string ?? defaultTenantId
  },
  getUserId: (req) => {
    // In a real app, extract from JWT/session
    return (req as any).headers['x-user-id'] as string ?? 'demo-user'
  },
}))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/observability/traces', (_req, res) => {
  res.json({
    serviceName: 'dfe-example-api',
    count: exporter.getFinishedSpans().length,
    traces: exporter.getFinishedSpans().slice(-25),
  })
})

app.get('/api/compliance/audit-log', async (req, res) => {
  res.json({
    count: (await exampleHipaaAuditStore.list({ tenantId: (req.headers['x-tenant-id'] as string | undefined) ?? defaultTenantId })).length,
    entries: await exampleHipaaAuditStore.list({
      tenantId: (req.headers['x-tenant-id'] as string | undefined) ?? defaultTenantId,
      limit: 100,
    }),
  })
})

app.get('/api/compliance/submissions/:id/export', async (req, res) => {
  const submission = await db.getSubmission(req.params.id)
  if (!submission) {
    res.status(404).json({ error: 'Submission not found' })
    return
  }

  const requestTenantId = (req.headers['x-tenant-id'] as string | undefined) ?? defaultTenantId
  if ((submission.tenantId ?? null) !== requestTenantId) {
    res.status(403).json({ error: 'Tenant mismatch' })
    return
  }

  const actorId = (req.headers['x-user-id'] as string | undefined) ?? 'demo-user'
  if (submission.userId !== actorId) {
    res.status(403).json({ error: 'You do not have permission to export this submission' })
    return
  }

  const form = await db.getFormById(submission.formId, {
    tenantId: requestTenantId,
    userId: actorId,
  })

  await exampleHipaaAuditStore.write(createAuditLogEntry({
    action: 'submission.export',
    actorId,
    tenantId: requestTenantId,
    targetType: 'submission',
    targetId: submission.id,
    outcome: 'success',
    metadata: {
      formId: submission.formId,
    },
  }))

  res.json({
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

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`🚀 DFE Example API running on http://localhost:${PORT}`)
  console.log(`   API routes: http://localhost:${PORT}/api/dfe/forms`)
})
