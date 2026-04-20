# @dmc--98/dfe-drizzle

Drizzle ORM adapter for the Dynamic Form Engine.

## Install

```bash
npm install @dmc--98/dfe-drizzle @dmc--98/dfe-server drizzle-orm
```

## Recommended Migration Flow

Use the adapter-aware CLI first, then hand off to your normal Drizzle migration commands:

```bash
npx dfe migrate plan --adapter drizzle
npx dfe migrate generate --adapter drizzle
npx drizzle-kit generate --name add_dfe_tables
npx drizzle-kit migrate
npx dfe migrate doctor --adapter drizzle --database-url "$DATABASE_URL"
```

What each step does:

- `plan` inspects the project and tells you whether the DFE tables are already exposed through the schema entrypoint used by `drizzle.config.*`.
- `generate` scaffolds a DFE schema entrypoint such as `src/db/dfe-schema.ts` when the project does not expose one yet.
- `drizzle-kit generate` and `drizzle-kit migrate` remain the source of truth for applying the migration.
- `doctor` verifies local project wiring and, when `DATABASE_URL` is provided, checks the live PostgreSQL tables and columns too.

If `generate` creates a new schema file, export or reference it through the schema entrypoint configured in `drizzle.config.*` before running Drizzle migrations.

## Lower-Level Schema Options

Import the schema in your Drizzle config:

```ts
import {
  dfeForms, dfeFormVersions, dfeSteps, dfeFields,
  dfeFieldOptions, dfeSubmissions,
} from '@dmc--98/dfe-drizzle/schema'
```

Or scaffold a starter entrypoint directly:

```bash
npx dfe add drizzle-schema
```

## Usage

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { DrizzleDatabaseAdapter } from '@dmc--98/dfe-drizzle'

const db = drizzle(pool)
const adapter = new DrizzleDatabaseAdapter(db)
```

## Schema (PostgreSQL)

The schema defines the same tables as the Prisma adapter using `drizzle-orm/pg-core`:

- `dfe_forms` — form definitions
- `dfe_form_versions` — versioned configurations
- `dfe_steps` — step definitions
- `dfe_fields` — field definitions
- `dfe_field_options` — dynamic select options
- `dfe_submissions` — submission state

## Custom API Contract Execution

Same pattern as Prisma — provide your own executor:

```ts
const adapter = new DrizzleDatabaseAdapter(db, {
  executeApiContract: async (contract, body) => {
    if (contract.resourceName === 'Employee') {
      const [row] = await db.insert(employees).values(body).returning()
      return row
    }
    throw new Error(`Unknown resource: ${contract.resourceName}`)
  },
})
```


---

## Links

- Source: [packages/drizzle](https://github.com/dmc-98/dynamic-form-engine/tree/main/packages/drizzle)
- Docs source: [docs/packages/drizzle.md](https://github.com/dmc-98/dynamic-form-engine/blob/main/docs/packages/drizzle.md)
- Issues: [https://github.com/dmc-98/dynamic-form-engine/issues](https://github.com/dmc-98/dynamic-form-engine/issues)
