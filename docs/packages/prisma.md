# @dmc-98/dfe-prisma

Prisma ORM adapter for the Dynamic Form Engine.

## Install

```bash
npm install @dmc-98/dfe-prisma @dmc-98/dfe-server @prisma/client
npm install -D prisma
```

## Recommended Migration Flow

Use the adapter-aware CLI first, then hand off to Prisma's normal migration command:

```bash
npx dfe migrate plan --adapter prisma
npx dfe migrate generate --adapter prisma
npx prisma migrate dev --schema prisma/schema.prisma --name add_dfe_tables
npx dfe migrate doctor --adapter prisma --database-url "$DATABASE_URL"
```

What each step does:

- `plan` inspects the project and tells you whether DFE models are already wired into `prisma/schema.prisma`.
- `generate` scaffolds `prisma/dfe-schema.prisma` when the DFE models are not merged yet.
- `prisma migrate dev` remains the source of truth for creating or applying the actual migration.
- `doctor` verifies local project wiring and, when `DATABASE_URL` is provided, checks the live PostgreSQL tables and columns too.

If `generate` creates `prisma/dfe-schema.prisma`, merge that fragment into your main `prisma/schema.prisma` before running Prisma migrations.

## Lower-Level Schema Options

Option A: scaffold the fragment directly:

```bash
npx dfe add prisma-schema
```

Option B: copy from the package:

```bash
cat node_modules/@dmc-98/dfe-prisma/schema/schema.prisma >> prisma/schema.prisma
```

## Tables Created

| Table | Purpose |
|-------|---------|
| `dfe_forms` | Form definitions (slug, title, description) |
| `dfe_form_versions` | Versioned form configs (draft/published/archived) |
| `dfe_steps` | Step definitions with config (API contracts, review) |
| `dfe_fields` | Field definitions (type, config, conditions) |
| `dfe_field_options` | Dynamic SELECT options |
| `dfe_submissions` | Form submission state (progress, context) |

## Usage

```ts
import { PrismaClient } from '@prisma/client'
import { PrismaDatabaseAdapter } from '@dmc-98/dfe-prisma'

const prisma = new PrismaClient()
const db = new PrismaDatabaseAdapter(prisma)
```

## Custom API Contract Execution

By default, API contracts use an in-memory store. For production, provide your own:

```ts
const db = new PrismaDatabaseAdapter(prisma, {
  executeApiContract: async (contract, body) => {
    switch (contract.resourceName) {
      case 'Employee':
        return prisma.employee.create({ data: body as any })
      case 'Assignment':
        return prisma.assignment.create({ data: body as any })
      default:
        throw new Error(`Unknown resource: ${contract.resourceName}`)
    }
  },
})
```

This maps the logical `resourceName` in the API contract to your actual Prisma models.
