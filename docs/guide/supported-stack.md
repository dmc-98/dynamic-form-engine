# Supported Stack

As of March 13, 2026, the recommended DFE adoption lane is:

- `@dmc-98/dfe-core`
- `@dmc-98/dfe-react`
- `@dmc-98/dfe-server`
- `@dmc-98/dfe-express`
- `@dmc-98/dfe-prisma` or `@dmc-98/dfe-drizzle`
- `@dmc-98/dfe-cli`

This is the package lane that is currently verified from the monorepo root with:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

If you are evaluating DFE for production, start here before reaching for the wider ecosystem.

## Why This Stack

- It matches the packages with the strongest implementation depth and the best current repo verification.
- It keeps the UI flexible: React bindings are provided, but the engine stays configuration-driven and headless.
- It gives you one clear backend path: `dfe-server` for submission orchestration, `dfe-express` for HTTP routes, and Prisma or Drizzle for persistence.
- It includes the CLI so you can scaffold the common pieces instead of wiring everything by hand.

## Recommended Setup Flow

### 1. Scaffold the backend lane

::: code-group

```bash [Prisma]
npx dfe init --prisma --express
npx dfe add prisma-schema
npx dfe add be-utils
```

```bash [Drizzle]
npx dfe init --drizzle --express
npx dfe add drizzle-schema
npx dfe add be-utils
```

:::

### 2. Scaffold the React lane

```bash
npx dfe add fe-hooks
```

That gives you a practical starting point for:

- form definitions
- Express router wiring
- React hooks and example components

### 3. Scaffold the migration flow

```bash
npx dfe migrate plan --adapter prisma
npx dfe migrate generate --adapter prisma
npx dfe migrate doctor --adapter prisma --database-url "$DATABASE_URL"
npx prisma migrate dev --schema prisma/schema.prisma --name add_dfe_tables
```

For Drizzle projects, swap `prisma` for `drizzle`. The CLI now detects adapter-specific project structure, scaffolds the DFE schema assets you need, hands off to the ORM-native migration command, and can optionally verify the live PostgreSQL tables and columns after migration.

## Package Roles

| Package | Role |
|--------|------|
| `@dmc-98/dfe-core` | field engine, conditions, DAG propagation, validation |
| `@dmc-98/dfe-react` | React hooks and headless render helpers |
| `@dmc-98/dfe-server` | step submission orchestration and adapter contracts |
| `@dmc-98/dfe-express` | REST router factory for DFE endpoints |
| `@dmc-98/dfe-prisma` | Prisma adapter and schema building blocks |
| `@dmc-98/dfe-drizzle` | Drizzle adapter and schema building blocks |
| `@dmc-98/dfe-cli` | scaffolding and config validation |

## What Is Verified Today

- The stable package lane builds, tests, and typechecks from the repo root.
- Prisma and Drizzle adapters both exist and have package-level coverage.
- React and Express are the clearest supported frontend/backend pairing today.
- `examples/fullstack` now builds and typechecks from the repo root, includes Prisma migrations plus Docker assets for local bring-up, and has Playwright browser E2E via `pnpm test:e2e:example`, including offline queueing and cross-tab collaboration coverage.
- `examples/fullstack` also exposes a browser-verified authoring route at `/playground`, covered by `pnpm test:e2e:playground`.
- `examples/fullstack` also includes a serverless collaboration reference path using Hono + Prisma, verified through `pnpm test:e2e:serverless`.
- The stable backend lane now includes a HIPAA-supporting mode with protected-field classification, encrypted submission vault hooks, audit logging hooks, and restricted analytics behavior across the Express and Hono reference surfaces.
- CI boots Postgres and runs the canonical example browser flow as a dedicated verification job.

## What Is Not Yet Part of the Verified Lane

- Builder, dashboard, and alternative wrappers should still be treated as secondary until they reach the same verification depth as the canonical lane.
- The stable UI kits are optional presentation layers, not the canonical adoption path, and they do not provide native `@mui/material`, `antd`, or `@chakra-ui/react` component bindings.
- The remote collaboration path is verified for the Hono + Prisma serverless reference lane, but broader serverless adapter coverage is still follow-on work.
- Broader browser coverage across the non-canonical ecosystem is still follow-on work.

## Stable Optional UI Kits

The following packages are now stable themed wrappers on top of `@dmc-98/dfe-react`:

- `@dmc-98/dfe-ui-mui`
- `@dmc-98/dfe-ui-antd`
- `@dmc-98/dfe-ui-chakra`
- `@dmc-98/dfe-playground`

Use the UI kits when you want a ready-made visual layer without giving up the shared renderer contract. Use `@dmc-98/dfe-playground` when you want the stable browser-verified authoring surface.

## Recommended Next Reads

- [Getting Started](/guide/getting-started)
- [Choose Your Package](/guide/choose-your-package)
- [Production Checklist](/guide/production-checklist)
- [Quick Start](/guide/quick-start)
- [Examples](/guide/examples)
- [@dmc-98/dfe-react](/packages/react)
- [@dmc-98/dfe-express](/packages/express)
- [@dmc-98/dfe-prisma](/packages/prisma)
- [@dmc-98/dfe-drizzle](/packages/drizzle)
