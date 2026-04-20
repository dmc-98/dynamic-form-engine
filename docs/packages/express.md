# @dmc--98/dfe-express

Express route handlers for the Dynamic Form Engine. One-liner setup.

## Install

```bash
npm install @dmc--98/dfe-express @dmc--98/dfe-server express
```

## Usage

```ts
import express from 'express'
import { createDfeRouter } from '@dmc--98/dfe-express'
import { PrismaDatabaseAdapter } from '@dmc--98/dfe-prisma'

const app = express()
const db = new PrismaDatabaseAdapter(prisma)

app.use(express.json())
app.use('/api', createDfeRouter({
  db,
  getUserId: (req) => req.auth.userId,
}))
```

## Options

```ts
interface DfeRouterOptions {
  db: DatabaseAdapter            // Required: your database adapter
  persistence?: PersistenceAdapter // Optional: file uploads
  getUserId?: (req: Request) => string // Extract user ID from request
  prefix?: string                // Route prefix (default: '/dfe')
  hipaa?: DfeHipaaModeOptions    // Optional compliance-supporting controls
}
```

## Routes Created

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dfe/forms` | List published forms. Query: `cursor`, `pageSize` |
| `GET` | `/dfe/forms/:slug` | Get a form by slug (with steps + fields) |
| `POST` | `/dfe/submissions` | Create a new submission. Body: `{ formId, versionId }` |
| `GET` | `/dfe/submissions/:id` | Get submission state |
| `POST` | `/dfe/submissions/:id/steps/:stepId` | Submit a step. Body: `{ values, context }` |
| `POST` | `/dfe/submissions/:id/complete` | Mark submission as complete |
| `GET` | `/dfe/analytics` | Return analytics summary for the current tenant/form |
| `GET` | `/dfe/fields/:fieldId/options` | Dynamic field options. Query: `cursor`, `pageSize`, `q` |

## Custom Auth Middleware

The `getUserId` option extracts the user ID from the request. Wire it to your auth middleware:

```ts
// JWT example
app.use('/api', authMiddleware, createDfeRouter({
  db,
  getUserId: (req) => req.user.id,
}))

// API key example
app.use('/api', createDfeRouter({
  db,
  getUserId: (req) => req.headers['x-user-id'] as string,
}))
```

## HIPAA-Supporting Mode

Pass the optional `hipaa` config when you want protected-field analytics redaction, audit logging hooks, and encrypted submission-vault storage:

```ts
import { createAesGcmFieldProtector, createInMemoryAuditLogStore } from '@dmc--98/dfe-server'

const audit = createInMemoryAuditLogStore()
const valueProtector = createAesGcmFieldProtector({ secret: process.env.DFE_HIPAA_SECRET! })

app.use('/api', createDfeRouter({
  db,
  getUserId: (req) => req.auth.userId,
  hipaa: {
    enabled: true,
    audit,
    valueProtector,
  },
}))
```

The built-in audit store is suitable for local development and demos. For production, provide durable audit persistence and manage the encryption secret outside the app process.
