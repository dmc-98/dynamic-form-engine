# @dmc--98/dfe-cli

CLI scaffolding tool for the Dynamic Form Engine.

## Install

The CLI is available via npx (no global install required):

```bash
npx dfe init
npx dfe add prisma-schema
npx dfe migrate plan --adapter prisma
```

Or install globally:

```bash
npm install -g @dmc--98/dfe-cli
```

## Commands

### `dfe init`

Initialize a new DFE project:

```bash
npx dfe init --prisma --express
```

**Options:**
- `--prisma` — include Prisma adapter
- `--drizzle` — include Drizzle adapter
- `--express` — include Express route handlers
- `-d, --dir <path>` — target directory (default: current)

**Creates:**
- `src/forms/sample-form.ts` — example form definition
- Install instructions for required packages

### `dfe add <module>`

Add a DFE module to your project:

```bash
npx dfe add prisma-schema   # Prisma schema for DFE tables
npx dfe add drizzle-schema  # Drizzle schema for DFE tables
npx dfe add be-utils        # Express route handler setup
npx dfe add fe-hooks        # React hooks + example component
```

**Options:**
- `-p, --path <path>` — target directory for generated files (default: current)

### Available Modules

| Module | Files Created | Packages Required |
|--------|--------------|-------------------|
| `prisma-schema` | `prisma/dfe-schema.prisma` | `@dmc--98/dfe-prisma`, `@dmc--98/dfe-server` |
| `drizzle-schema` | `src/db/dfe-schema.ts` | `@dmc--98/dfe-drizzle`, `@dmc--98/dfe-server` |
| `be-utils` | `src/routes/dfe.ts` | `@dmc--98/dfe-server`, `@dmc--98/dfe-express` |
| `fe-hooks` | `src/hooks/useDfe.ts`, `src/components/DfeForm.tsx` | `@dmc--98/dfe-react`, `@dmc--98/dfe-core` |

### `dfe migrate <command>`

Inspect, scaffold, and verify the DFE migration flow while still handing off to Prisma or Drizzle for the actual migration files and execution.

```bash
npx dfe migrate plan --adapter prisma
npx dfe migrate generate --adapter prisma
npx dfe migrate doctor --adapter prisma --database-url "$DATABASE_URL"
```

#### `dfe migrate plan`

- Detects the active adapter (`prisma` or `drizzle`)
- Reports whether the expected DFE schema assets are already wired in
- Suggests the next ORM-native migration command to run

#### `dfe migrate generate`

- Scaffolds `prisma/dfe-schema.prisma` for Prisma projects when the DFE models are not merged yet
- Scaffolds a DFE schema entrypoint such as `src/db/dfe-schema.ts` for Drizzle projects when the DFE tables are not yet exposed
- Does not replace Prisma Migrate or Drizzle Kit; it prepares the project for them

#### `dfe migrate doctor`

- Re-runs the project wiring checks from `plan`
- Optionally verifies the live PostgreSQL tables and columns when `--database-url` or `DATABASE_URL` is provided
- Exits non-zero on blocking problems and keeps skipped live DB checks visible as warnings

## Example Workflow

```bash
# 1. Start a new project
mkdir my-app && cd my-app
npm init -y

# 2. Initialize DFE with Prisma + Express
npx dfe init --prisma --express

# 3. Add schema and utilities
npx dfe add prisma-schema
npx dfe add be-utils
npx dfe add fe-hooks
npx dfe migrate plan --adapter prisma
npx dfe migrate generate --adapter prisma

# 4. Install packages
npm install @dmc--98/dfe-core @dmc--98/dfe-server @dmc--98/dfe-express \
  @dmc--98/dfe-prisma @dmc--98/dfe-react zod express @prisma/client react

# 5. Run migrations
npx prisma migrate dev --schema prisma/schema.prisma --name add_dfe_tables
npx dfe migrate doctor --adapter prisma --database-url "$DATABASE_URL"

# 6. Start building!
```


---

## Links

- Source: [packages/cli](https://github.com/dmc-98/dynamic-form-engine/tree/main/packages/cli)
- Docs source: [docs/packages/cli.md](https://github.com/dmc-98/dynamic-form-engine/blob/main/docs/packages/cli.md)
- Issues: [https://github.com/dmc-98/dynamic-form-engine/issues](https://github.com/dmc-98/dynamic-form-engine/issues)
