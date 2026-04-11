<p align="center">
  <img src="docs/public/logo.svg" width="80" alt="DFE Logo" />
</p>

<h1 align="center">Dynamic Form Engine</h1>

<p align="center">
  <strong>Configuration-driven forms with DAG-based dependency resolution</strong>
</p>

<p align="center">
  <a href="https://github.com/snarjun98/dynamic-form-engine/actions"><img src="https://github.com/snarjun98/dynamic-form-engine/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@dmc-98/dfe-core"><img src="https://img.shields.io/npm/v/@dmc-98/dfe-core" alt="npm" /></a>
  <a href="https://github.com/snarjun98/dynamic-form-engine/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <a href="https://snarjun98.github.io/dynamic-form-engine/"><img src="https://img.shields.io/badge/docs-vitepress-646cff" alt="Docs" /></a>
</p>

---

## What is DFE?

**Dynamic Form Engine (DFE)** is a framework-agnostic, configuration-driven form engine for TypeScript. Define your forms as JSON/config objects and DFE handles validation, multi-step workflows, field dependencies, conditional visibility, and cross-step API orchestration — all with zero UI lock-in.

### Key Features

- **DAG-Based Dependencies** — Fields form a directed acyclic graph. When a value changes, only affected fields recompute (O(k) propagation, not O(n)).
- **21 Built-in Field Types** — Text, number, date, select, file upload, rich text, address, and more.
- **Compiled Conditions** — `SHOW` / `HIDE` / `REQUIRE` / `DISABLE` rules compiled to closures for fast evaluation.
- **Multi-Step Workflows** — Stepper with skip conditions, per-step validation, and step-level API contracts.
- **API Contracts** — Declare HTTP calls between steps with field mapping, context propagation, and endpoint templates.
- **Zod Validation** — Auto-generates Zod schemas from field config. Extend with `registerSchemaBuilder()`.
- **Framework Agnostic** — Core is pure TypeScript. Bind to React, Vue, Svelte, or vanilla JS.
- **Adapter Pattern** — Swap Prisma ↔ Drizzle with a single interface change.

---

## Recommended Packages

| Package | Description |
|---------|-------------|
| [`@dmc-98/dfe-core`](packages/core) | Engine, DAG, validation, conditions — zero dependencies |
| [`@dmc-98/dfe-server`](packages/server) | DatabaseAdapter interface, step-submission pipeline |
| [`@dmc-98/dfe-express`](packages/express) | Express router factory with all REST endpoints |
| [`@dmc-98/dfe-prisma`](packages/prisma) | Prisma adapter + schema |
| [`@dmc-98/dfe-drizzle`](packages/drizzle) | Drizzle adapter + schema |
| [`@dmc-98/dfe-react`](packages/react) | React hooks (`useFormEngine`, `useFormStepper`, `useFormRuntime`, `useOfflineFormRuntime`, `useFormSync`) + headless components |
| [`@dmc-98/dfe-cli`](packages/cli) | CLI scaffolding tool (`dfe init`, `dfe add`) |

---

## Package Maturity

Verified locally on March 13, 2026:

- `pnpm install`
- `pnpm build`
- `pnpm test`
- `pnpm typecheck`

Use the following maturity levels when choosing packages:

| Status | Packages | Notes |
|--------|----------|-------|
| Stable | `@dmc-98/dfe-core`, `@dmc-98/dfe-react`, `@dmc-98/dfe-server`, `@dmc-98/dfe-express`, `@dmc-98/dfe-prisma`, `@dmc-98/dfe-drizzle`, `@dmc-98/dfe-cli`, `@dmc-98/dfe-ui-mui`, `@dmc-98/dfe-ui-antd`, `@dmc-98/dfe-ui-chakra`, `@dmc-98/dfe-playground` | Primary verified path for adoption today, plus stable optional themed wrappers and the browser-verified authoring playground |
| Beta | `@dmc-98/dfe-builder`, `@dmc-98/dfe-dashboard`, `@dmc-98/dfe-fastify`, `@dmc-98/dfe-trpc`, `@dmc-98/dfe-hono`, `@dmc-98/dfe-graphql`, `@dmc-98/dfe-docusaurus`, `dfe-vscode` | Implemented and buildable, but not yet the main supported lane |
| Experimental | `@dmc-98/dfe-vue`, `@dmc-98/dfe-svelte`, `@dmc-98/dfe-solid`, `@dmc-98/dfe-angular`, `@dmc-98/dfe-vanilla`, `@dmc-98/dfe-sqlite`, `@dmc-98/dfe-mongoose`, `@dmc-98/dfe-ui-shadcn`, `@dmc-98/dfe-ui-mantine` | Usable packages with lighter validation and documentation coverage |

If you are evaluating DFE for production, start with the Stable lane and treat the rest as opt-in.

`@dmc-98/dfe-playground` is now a browser-verified stable authoring surface with JSON editing, live preview, AI-assisted config generation, validation suggestions, field suggestions, and a consent-based review-first draft-fill flow. The draft-fill workflow never auto-submits and should be treated as assisted review, not autonomous submission.

---

## Stable Adoption Path

If you are starting fresh, use this package combination first:

- React: `@dmc-98/dfe-react`
- Server runtime: `@dmc-98/dfe-server`
- HTTP adapter: `@dmc-98/dfe-express`
- Persistence: `@dmc-98/dfe-prisma` or `@dmc-98/dfe-drizzle`
- Scaffolding: `@dmc-98/dfe-cli`

This is the package lane currently verified from the repo root.

Optional presentation packages in the stable set:

- `@dmc-98/dfe-ui-mui`
- `@dmc-98/dfe-ui-antd`
- `@dmc-98/dfe-ui-chakra`
- `@dmc-98/dfe-playground`

The UI kits are stable themed wrappers over `@dmc-98/dfe-react`, not direct bindings to native `@mui/material`, `antd`, or `@chakra-ui/react` components. `@dmc-98/dfe-playground` is the stable browser-verified authoring surface.

Optional Beta adoption surfaces:

- API alternative: `@dmc-98/dfe-graphql`
- Docs/site integration: `@dmc-98/dfe-docusaurus`
- Visual builder: `@dmc-98/dfe-builder`

Start here:

- docs: `docs/guide/supported-stack.md`
- packages: `@dmc-98/dfe-core`, `@dmc-98/dfe-react`, `@dmc-98/dfe-server`, `@dmc-98/dfe-express`, `@dmc-98/dfe-prisma`, `@dmc-98/dfe-drizzle`, `@dmc-98/dfe-cli`

The `examples/fullstack` directory now includes Prisma schema and migrations, Docker assets, a Playwright browser E2E lane (`pnpm test:e2e:example`), cross-tab collaboration, offline queueing with service-worker-backed app-shell caching, and a dedicated CI job that boots Postgres and runs the example end to end. Treat it as the browser-verified canonical example stack for the stable lane.

The stable backend lane also now includes a HIPAA-supporting mode: protected-field classification, encrypted-at-rest submission vault hooks, audit logging hooks, analytics redaction, and example export/audit routes. It is a compliance-supporting feature set, not a legal certification claim by itself.

For backend schema setup, the CLI now includes adapter-aware migration helpers:

```bash
npx dfe migrate plan --adapter prisma
npx dfe migrate generate --adapter prisma
npx dfe migrate doctor --adapter prisma --database-url "$DATABASE_URL"
npx prisma migrate dev --schema prisma/schema.prisma --name add_dfe_tables
```

For Drizzle projects, swap `prisma` for `drizzle`, expose the generated schema entrypoint through your `drizzle.config.*`, and then run your normal `drizzle-kit generate` / `drizzle-kit migrate` flow.

---

## Quick Start

```bash
# Install core + React bindings
pnpm add @dmc-98/dfe-core @dmc-98/dfe-react
```

```tsx
import { useFormEngine } from '@dmc-98/dfe-react'

const { fields, values, errors, setValue, validate } = useFormEngine({
  fields: [
    { id: 'name', type: 'SHORT_TEXT', label: 'Full Name', required: true },
    { id: 'email', type: 'EMAIL', label: 'Email', required: true },
    {
      id: 'role',
      type: 'SELECT',
      label: 'Role',
      config: { options: [
        { value: 'dev', label: 'Developer' },
        { value: 'pm', label: 'Product Manager' },
      ]},
    },
  ],
})
```

### Server-Side

```bash
pnpm add @dmc-98/dfe-server @dmc-98/dfe-express @dmc-98/dfe-prisma
```

```ts
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { PrismaDatabaseAdapter } from '@dmc-98/dfe-prisma'
import { createDfeRouter } from '@dmc-98/dfe-express'

const app = express()
const db = new PrismaDatabaseAdapter(new PrismaClient())
app.use(createDfeRouter({ db }))
app.listen(3001)
```

---

## Development

```bash
# Clone and install
git clone https://github.com/snarjun98/dynamic-form-engine.git
cd dynamic-form-engine
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type-check
pnpm typecheck

# Dev docs
cd docs && npx vitepress dev
```

### Centralized Config

The monorepo uses `dfe.config.ts` at the root to store the org scope, GitHub org, and other identifiers. To change the org name everywhere:

1. Edit `dfe.config.ts`
2. Run `pnpm run sync-config`

This updates every `package.json`, source file, doc, and GitHub Action.

---

## Documentation

Full documentation is available at **[snarjun98.github.io/dynamic-form-engine](https://snarjun98.github.io/dynamic-form-engine/)**.

- [Getting Started](https://snarjun98.github.io/dynamic-form-engine/guide/getting-started)
- [Choose Your Package](https://snarjun98.github.io/dynamic-form-engine/guide/choose-your-package)
- [Comparison](https://snarjun98.github.io/dynamic-form-engine/guide/comparison)
- [Acknowledgements](https://snarjun98.github.io/dynamic-form-engine/guide/acknowledgements)
- [Production Checklist](https://snarjun98.github.io/dynamic-form-engine/guide/production-checklist)
- [Field Types](https://snarjun98.github.io/dynamic-form-engine/guide/field-types)
- [DAG Architecture](https://snarjun98.github.io/dynamic-form-engine/guide/dag)
- [Multi-Step Forms](https://snarjun98.github.io/dynamic-form-engine/guide/multi-step)
- [API Contracts](https://snarjun98.github.io/dynamic-form-engine/guide/api-contracts)
- [API Reference](https://snarjun98.github.io/dynamic-form-engine/api/core)

---

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

```bash
# Create a changeset for your PR
pnpm changeset

# Optional: use Turbo remote caching if you have maintainer credentials
export TURBO_TEAM=your-team
export TURBO_TOKEN=your-token
pnpm build

# Maintainers can verify release readiness locally
pnpm test:smoke:wrappers
pnpm release:check
```

The repo falls back to local Turbo caching automatically when the cache env vars are not set.

Maintainers should also use:

- [Release Guide](RELEASE.md)
- [Deploy Checklist](DEPLOY_CHECKLIST.md)
- [Maintainer Guide](MAINTAINER_GUIDE.md)

---

## License

[MIT](LICENSE) © dmc-98
