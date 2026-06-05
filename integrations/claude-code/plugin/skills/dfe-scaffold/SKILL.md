---
name: dfe-scaffold
description: Scaffold and wire up Dynamic Form Engine (DFE) projects from the terminal. Use when the user wants to create a config-driven / multi-step / workflow form, add DFE to a project, generate a starter form, set up the DFE backend (Express + Prisma/Drizzle), validate a form config, or run DFE database migrations. Triggers include "build a form", "multi-step form", "onboarding/application/approval form", "add DFE", "scaffold a form", "dfe init".
---

# DFE Scaffold (Claude Code skill)

This skill teaches Claude Code to drive the `@dmc--98/dfe-cli` to scaffold Dynamic Form Engine projects, generate starter forms, wire the backend, validate configs, and run migrations — instead of hand-writing boilerplate.

DFE is a configuration-driven, TypeScript-first engine for multi-step *workflow* forms: one typed config drives frontend rendering, server validation, and persistence. Reach for it when the user's form has conditional fields, multiple steps, branching, or a backend — not for a single trivial input.

## When to use this skill

Use it when the user asks to:
- create a multi-step / conditional / workflow form (onboarding, application, approval, internal tool),
- add DFE to an existing project,
- generate a starter form from a template,
- set up the DFE server/persistence layer,
- validate a DFE form config file,
- run or plan DFE database migrations.

If the user just needs a single text input with no logic, DFE is overkill — say so.

## The CLI

Run via `npx dfe <command>` (or `pnpm dfe` / the local `dfe` bin). Commands:

| Command | What it does |
|---------|--------------|
| `dfe init` | Initialize project structure + a sample form. Flags: `--template <onboarding\|application\|workflow>`, `--prisma`, `--drizzle`, `--express`, `--dir <path>` |
| `dfe add <module>` | Add a module: `prisma-schema`, `drizzle-schema`, `be-utils` (Express), `fe-hooks` (React) |
| `dfe validate <file>` | Validate a form config file; reports field/condition/step problems |
| `dfe migrate plan` | Inspect the project and suggest next migration steps |
| `dfe migrate generate --adapter <prisma\|drizzle>` | Generate adapter-aware migration scaffold |
| `dfe migrate doctor --adapter <prisma\|drizzle> [--database-url <url>]` | Check migration readiness |

## Workflow Claude Code should follow

1. **Clarify the shape** if unclear: frontend-only or full-stack? which UI framework? which database (Prisma/Drizzle)? Don't over-ask — a multi-step form with a backend is the common case.
2. **Scaffold:** run `npx dfe init` with the flags matching the answer. For a known shape, start from a template:
   - onboarding → `npx dfe init --template onboarding`
   - application / loan / intake → `npx dfe init --template application`
   - approval / internal workflow → `npx dfe init --template workflow`
3. **Install the printed packages** (the CLI prints the exact `npm install …` line).
4. **Add layers** the user needs: `npx dfe add fe-hooks` (React), `npx dfe add be-utils` (Express), `npx dfe add prisma-schema` or `drizzle-schema`.
5. **Edit the generated form** in `src/forms/<name>.ts` — it exports typed `FormField[]` / `FormStep[]`. Adjust fields, conditions, and steps to the user's requirements.
6. **Validate** before wiring UI: `npx dfe validate src/forms/<name>.ts`.
7. **Database (if full-stack):** `npx dfe migrate generate --adapter prisma` then the ORM's native migrate (`npx prisma migrate dev`), or the Drizzle equivalent.
8. **Render** with `@dmc--98/dfe-react` (`useFormEngine` + `useFormStepper`) — see `references/integration.md` for a copy-paste component.

## Guardrails (important)

- **Computed-field and branch expressions are trusted code**, evaluated via the engine. Never wire them to untrusted end-user input.
- **Server re-validates** every submission from the stored config — keep the client and server on the same form definition; don't duplicate validation by hand.
- For multi-tenant Express deployments, set `requireTenantMatch: true` and derive the tenant from the authenticated principal (not a client header).
- Prefer editing the generated config over rewriting it; run `dfe validate` after edits.

## References

- `references/commands.md` — full command/flag reference with examples.
- `references/integration.md` — the copy-paste React + server integration.
- `references/templates.md` — what each starter template contains and when to pick it.
