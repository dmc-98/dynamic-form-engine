# Self-Host Submissions & Analytics

A submissions tracker, CSV export, and an analytics dashboard — as primitives you run yourself, so the data never leaves your infrastructure. This recipe wires all three.

## What you get

- A **submissions list** (status: draft / complete, searchable) — from your database via the adapter you already use.
- **CSV export** — `exportSubmissionsToCsv` from `@dmc--98/dfe-core`.
- An **analytics dashboard** — the five core metrics (visits, completion %, exit %, average duration, validation errors), from `@dmc--98/dfe-server`.

## 1. Submissions list + CSV export

The server adapter (`@dmc--98/dfe-prisma` / `@dmc--98/dfe-drizzle`) already stores submissions. List them with `listSubmissions`, then export:

```ts
import { exportSubmissionsToCsv, type SubmissionRow } from '@dmc--98/dfe-core'

// From your adapter:
const { items } = await db.listSubmissions({ formId })

const rows: SubmissionRow[] = items.map(s => ({
  id: s.id,
  status: s.completedAt ? 'COMPLETE' : 'DRAFT',
  submittedAt: s.updatedAt?.toISOString(),
  values: s.values,
}))

const csv = exportSubmissionsToCsv(form.fields, rows)
// Serve it:
res.setHeader('Content-Type', 'text/csv')
res.setHeader('Content-Disposition', `attachment; filename="${form.slug}-submissions.csv"`)
res.send(csv)
```

Columns are `ID, Status, Submitted, <one per field label>`. Commas, quotes, and newlines in answers are RFC-4180 escaped, and array (multi-select) values are comma-joined.

## 2. Analytics dashboard

Track events from the client (or let the Express router's analytics endpoint do it), then read the summary:

```ts
import { createAnalyticsStore } from '@dmc--98/dfe-server'

const analytics = createAnalyticsStore()
// analytics.track({ formId, submissionId, event: 'form_started', timestamp: Date.now() })
// ... 'step_viewed' | 'step_completed' | 'field_error' | 'form_completed' | 'form_abandoned'

const summary = analytics.getAnalyticsSummary(formId)
// {
//   totalStarts,            // ← Visits
//   completionRate,         // ← Complete %
//   abandonmentRate,        // ← Exit %
//   averageCompletionTimeMs,// ← Average duration
//   fieldErrors: [...],     // ← Validation errors (by field)
//   stepFunnel: [...],      // ← Per-step drop-off
//   recentActivity, variantComparison,
// }
```

Render those into whatever dashboard UI you like. For production, swap the in-memory store for a persistent `AnalyticsStore` backed by your database (the interface is small).

## Why self-host

- **Your data stays yours** — no third-party processor holding submissions or PII.
- **No per-seat / per-submission pricing** — it's your database.
- **Compliance-friendly** — the server layer includes a PII/redaction layer (`@dmc--98/dfe-server` compliance helpers) you control.

The trade-off is honest: you run the database and the dashboard. DFE gives you the engine and the metrics; hosting is yours. That's the point.
