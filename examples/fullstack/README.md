# DFE Fullstack Example

This folder captures the canonical React + Express + Prisma architecture for DFE.

As of March 12, 2026, it is a runnable local example with Prisma schema and migrations, Docker assets, Playwright browser E2E, and a dedicated CI job that boots Postgres and verifies the flow end to end.

## Current Status

Available today:

- React example UI using `@dmc-98/dfe-react`
- Express API example using `@dmc-98/dfe-express`
- Prisma schema, initial migration, and seed data for an Employee Onboarding workflow
- Dockerfiles and Docker Compose for local PostgreSQL and app services
- root workspace `build` and `typecheck` verification coverage
- Playwright browser E2E via `pnpm test:e2e:example`
- CI smoke coverage that boots Postgres and runs the example browser flow
- browser-verified cross-tab collaboration and presence in the React example
- browser-verified offline queueing with IndexedDB persistence and service-worker-backed app-shell caching
- adapter-aware CLI migration planning/scaffolding for the stable lane, plus optional live PostgreSQL verification through `dfe migrate doctor --database-url`
- HIPAA-supporting backend mode with protected-field classification, encrypted submission-vault hooks, audited submission export routes, and restricted analytics for protected fields

Still missing before this becomes a fully hardened canonical app:

- broader browser and scenario coverage beyond the current canonical happy-path lane
- broader CI hardening beyond the current canonical browser lane
- broader deployment recipes beyond the current Node and serverless local reference paths

## Recommended Use Today

Use this directory as:

- the canonical example for the supported React + Express + Prisma lane
- a serverless collaboration reference via Hono + Prisma for remote multi-user editing
- a guide for route shape, package composition, and seed data
- a local Playground route at `/playground` for config authoring and review-first AI draft fill, including browser verification through `pnpm test:e2e:playground`
- a concrete Prisma target for `npx dfe migrate doctor --adapter prisma --database-url "$DATABASE_URL"` after migrations have been applied

If you are adopting DFE right now, start with the supported package lane documented in:

- `README.md`
- `docs/guide/supported-stack.md`

## Local Development

### Run with local processes

```bash
pnpm install
pnpm build
pnpm --dir examples/fullstack/api db:migrate:deploy
pnpm --dir examples/fullstack/api db:seed
pnpm --dir examples/fullstack/api dev
pnpm --dir examples/fullstack/web dev
```

The API expects PostgreSQL at the `DATABASE_URL` in `examples/fullstack/api/prisma/schema.prisma`.

Open:

- `http://localhost:5173/` for the canonical onboarding runtime
- `http://localhost:5173/playground` for the Playground authoring surface

### Run browser E2E

With PostgreSQL available at the configured `DATABASE_URL`, run from the repo root:

```bash
pnpm test:e2e:example
pnpm test:e2e:playground
```

### Run with Docker Compose

```bash
cd examples/fullstack
docker compose up --build
```

This starts:

- PostgreSQL on `localhost:5432`
- the API on `http://localhost:3001`
- the web app on `http://localhost:5173`

## Architecture

```
┌──────────────┐     ┌───────────────┐     ┌───────────────┐
│  React App   │────▶│  Express API  │────▶│  PostgreSQL   │
│  (dfe-react) │     │ (dfe-express) │     │  (dfe-prisma) │
└──────────────┘     └───────────────┘     └───────────────┘
       │                     │
       └─── @dmc-98/dfe-core ──┘
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dfe/forms` | List published forms |
| GET | `/api/dfe/forms/:slug` | Get form by slug |
| POST | `/api/dfe/submissions` | Create submission |
| GET | `/api/dfe/submissions/:id` | Get submission |
| POST | `/api/dfe/submissions/:id/steps/:stepId` | Submit a step |
| POST | `/api/dfe/submissions/:id/complete` | Complete submission |
| GET | `/api/dfe/analytics` | Analytics summary |
| GET | `/api/dfe/fields/:id/options` | Dynamic field options |
| GET | `/api/compliance/audit-log` | Example audit log feed |
| GET | `/api/compliance/submissions/:id/export` | Example authorized export route for protected submission data |
