# DFE CLI — Command Reference

All commands run via `npx dfe <command>` (or the local `dfe` bin after install).

## `dfe init`

Initializes project structure (`src/`, `src/forms/`), a sample form, and prints the packages to install.

```bash
npx dfe init                          # core only, sample form
npx dfe init --template onboarding    # scaffold the user-onboarding starter
npx dfe init --template application   # loan/application starter (computed + review)
npx dfe init --template workflow      # admin approval workflow (branching)
npx dfe init --prisma                 # include Prisma adapter in the install line
npx dfe init --drizzle                # include Drizzle adapter
npx dfe init --express                # include Express server + route handlers
npx dfe init --dir ./apps/web         # target a subdirectory
```

Flags combine: `npx dfe init --template application --express --prisma`.

After init, run the printed `npm install …` line.

## `dfe add <module>`

Adds a layer to an existing DFE project and prints its packages.

```bash
npx dfe add fe-hooks         # React hooks + components (@dmc--98/dfe-react, dfe-core)
npx dfe add be-utils         # Express server utils (dfe-server, dfe-express)
npx dfe add prisma-schema    # Prisma adapter + schema (dfe-prisma, dfe-server)
npx dfe add drizzle-schema   # Drizzle adapter + schema (dfe-drizzle, dfe-server)
```

## `dfe validate <file>`

Validates a form config module and reports problems (duplicate keys, dangling condition/step references, missing select options, broken computed dependencies).

```bash
npx dfe validate src/forms/onboarding.ts
```

## `dfe migrate`

Adapter-aware migration scaffolding for Prisma and Drizzle.

```bash
npx dfe migrate plan                              # suggest next steps
npx dfe migrate generate --adapter prisma         # generate migration scaffold
npx dfe migrate doctor --adapter prisma \
  --database-url "$DATABASE_URL"                  # readiness check
npx dfe migrate status                            # alias for plan
```

Then run the ORM's native flow, e.g.:

```bash
npx prisma migrate dev --schema prisma/schema.prisma --name add_dfe_tables
# or for Drizzle: drizzle-kit generate && drizzle-kit migrate
```
