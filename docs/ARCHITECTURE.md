# Dynamic Form Engine — Architecture

This document explains how Dynamic Form Engine (DFE) is built: the monorepo layout, the core engine internals, the server-side submission pipeline, the persistence and framework adapters, and the data flow that ties them together. It is written for contributors and for engineers evaluating DFE for production. For usage instructions see the [guide](./guide/getting-started.md); for the public API see the [API reference](./api/core.md).

## What DFE Is

DFE is a framework-agnostic, configuration-driven form engine for TypeScript. You describe a form as a typed configuration object — fields, conditions, validation, multi-step structure, and cross-step API calls — and the engine turns that configuration into a live, reactive form model. The same configuration drives frontend rendering, backend validation, and persistence, so there is one typed contract across the stack.

DFE targets forms that behave like workflow systems rather than simple input screens: onboarding, applications, approvals, internal admin tools, and server-backed multi-step flows. The deliberate non-goals are equally important — DFE is not a hosted form SaaS, not merely a JSON-Schema renderer, and not a replacement for lightweight form-state libraries.

## Design Principles

The codebase is organized around a few consistent decisions. The core is pure TypeScript with no runtime services and no framework dependencies, so it can run in a browser, on a server, or inside a serverless function unchanged. Every reactive behavior is expressed as data — conditions, dependencies, and API contracts are configuration, not imperative code — which makes forms serializable, diffable, and migratable. Performance comes from a dependency graph that recomputes only what changed rather than re-evaluating the whole form. And capability is layered: a small stable core plus optional adapters for frameworks, servers, databases, and UI kits, each shipped as a separate package so consumers install only what they use.

## Monorepo Layout

The repository is a pnpm + Turborepo monorepo. Packages live under `packages/*`, the canonical full-stack example under `examples/fullstack`, end-to-end tests under `e2e`, and the VitePress documentation site under `docs`.

The packages fall into clear layers:

| Layer | Packages | Role |
|-------|----------|------|
| Engine | `dfe-core` | DAG, conditions, validation, stepper, AI, accessibility, sync — zero runtime deps |
| Server runtime | `dfe-server` | `DatabaseAdapter` interface and the step-submission pipeline |
| HTTP adapters | `dfe-express`, `dfe-fastify`, `dfe-hono`, `dfe-trpc`, `dfe-graphql` | Expose the pipeline over a transport |
| Persistence adapters | `dfe-prisma`, `dfe-drizzle`, `dfe-sqlite`, `dfe-mongoose` | Implement `DatabaseAdapter` for a datastore |
| Framework bindings | `dfe-react`, `dfe-vue`, `dfe-svelte`, `dfe-solid`, `dfe-angular`, `dfe-vanilla` | Bind the engine to a UI runtime |
| UI kits | `dfe-ui-mui`, `dfe-ui-antd`, `dfe-ui-chakra`, `dfe-ui-mantine`, `dfe-ui-shadcn` | Themed component sets |
| Authoring & tooling | `dfe-playground`, `dfe-builder`, `dfe-dashboard`, `dfe-cli`, `dfe-vscode`, `dfe-docusaurus` | Visual authoring, scaffolding, editor support |

Maturity is tracked explicitly in the README and should be treated as part of the architecture: `dfe-core`, `dfe-react`, `dfe-server`, `dfe-express`, `dfe-prisma`, `dfe-drizzle`, `dfe-cli`, the three stable UI kits, and `dfe-playground` are the verified adoption lane. Beta and Experimental packages are buildable but carry lighter validation and documentation, and should not be presented as the main path.

## The Core Engine

Everything of substance lives in `packages/core/src`. The package exports two factory functions as its primary API — `createFormEngine` and `createFormStepper` — plus a set of lower-level utilities (DAG, stepper, validation, conditions, hydration, templates, import/export, AI, accessibility, PDF, and sync) for advanced use.

### Field Model

A form is an array of `FormField` objects. DFE ships 21 built-in field types, including `TEXT`, `NUMBER`, `EMAIL`, `TEXTAREA`, `SELECT`, `MULTI_SELECT`, `RADIO`, `CHECKBOX`, `DATE`, `TIME`, `FILE`, `RATING`, `SCALE`, `SLIDER`, `TOGGLE`, `PHONE`, `SIGNATURE`, `ADDRESS`, `RICH_TEXT`, and the structural types `SECTION_BREAK` and `FIELD_GROUP`. Fields can be nested into a tree (groups, repeatable groups); the engine flattens that tree before building its graph. Beyond the type and value, a field can carry conditions, validation rules, computed expressions, role-based permissions, localized labels, and data-classification/compliance metadata.

### The Dependency Graph (DAG)

The heart of the engine is the form graph built in `dag.ts`. `buildFormGraph` runs in two passes. The first pass creates a node per field, seeding each node's value from hydration data or the field default and pre-compiling its conditions into closures. The second pass walks every field's conditions, extracts the field keys they reference, and records edges: for each referenced key it adds the dependent field to that key's `dependents` set and the referenced key to the field's `dependencies` set. A topological sort of the resulting graph gives a stable evaluation order.

The payoff is propagation cost. When a value changes, `handleFieldChange` does a breadth-first traversal starting from the changed key, following only the `dependents` edges, and recomputes visibility, required, and disabled state for the fields actually affected. A patch object describing exactly what changed is returned, so a UI can update the minimum set of fields. Propagation is therefore O(k) in the number of affected fields rather than O(n) in the size of the form — the property that lets DFE stay responsive on large workflow forms.

### Conditions

Conditional logic (`condition-compiler.ts`) is declarative. A `ConditionRule` pairs an action — `SHOW`, `HIDE`, `REQUIRE`, or `DISABLE` — with operators over other fields' values. `compileCondition` turns a rule into a closure that takes the current form values and returns a boolean, and `extractReferencedKeys` reports which fields the rule reads so the DAG can wire up the right edges. Compiling to closures once at graph-build time means each value change is a cheap function call, not a re-parse of the rule.

### Validation

Validation (`zod-generator.ts`) is derived, not hand-written. `generateZodSchema` inspects the visible, non-structural fields and produces a Zod schema; `generateStepZodSchema` does the same scoped to a single step, and `generateStrictSubmissionSchema` produces the server-side contract. Because the engine validates only currently visible fields, hidden conditional branches never block submission. Teams can extend type coverage with `registerSchemaBuilder` for custom field types.

### Multi-Step Workflows

`createFormStepper` layers navigation on top of an engine instance. `buildStepGraph` builds a graph of steps with their own visibility (steps can be skipped by condition), and the stepper tracks the current index, completion state, and progress. It supports linear navigation (`goNext`/`goBack`/`jumpTo`) and conditional branching (`getNextBranch`/`goNextBranch`), where a step declares branches whose conditions — either a string expression or a structured `FieldConditions` object — decide the next step at runtime. The stepper never owns rendering, so it works identically across frameworks.

### Additional Core Capabilities

The engine instance also manages computed fields (expressions re-evaluated when their declared dependencies change), an undo/redo history (bounded to 50 states), repeatable group instances, role-based field permissions, and localized labels. Around the engine, the core package provides a JSON-Schema import/export bridge (`json-schema.ts`), importers for Typeform and Google Forms (`import-export.ts`), a template library (`templates.ts`), an accessibility auditor (`accessibility.ts`), a PDF layout/printable-HTML renderer (`pdf-renderer.ts`), AI authoring helpers (`ai/`), and a CRDT-style collaborative sync runtime (`sync.ts`).

A note on the computed-field and branch evaluators: they use the `Function` constructor to evaluate expressions against form values. This is acceptable for trusted, author-controlled configuration but is not a sandbox. Treat form configuration as code, and never evaluate untrusted end-user-authored expressions without an additional sandboxing layer.

## Server Runtime

`packages/server` defines how a submission is processed on the backend, independent of both HTTP transport and database. Its three pieces are the `DatabaseAdapter` interface (`adapter.ts`), the submission pipeline (`pipeline.ts` / `submission.ts`), and a hook system (`hooks.ts`).

The pipeline takes a step-submission payload, re-validates it server-side against the strict schema generated from the form config (the client is never trusted), executes any API contracts declared on the step, runs lifecycle hooks, and persists the result through the injected adapter. Because validation is regenerated from the same configuration the client used, the frontend and backend can never silently drift out of contract.

### API Contracts

A distinctive feature is that steps can declare HTTP calls as configuration. A `StepApiContract` describes an endpoint (with templated URL segments resolved from field values via `resolveEndpointTemplate` in the core's `hydration.ts`), the field mapping for the request, and how the response is merged back into form values. This is what lets DFE orchestrate cross-step server interactions — look up an address, validate a tax ID, fetch a quote — without the application writing bespoke glue for each one.

## Adapters

Two adapter seams keep DFE portable.

The persistence seam is the `DatabaseAdapter` interface. `dfe-prisma` and `dfe-drizzle` are the stable implementations and ship their own schemas; `dfe-sqlite` and `dfe-mongoose` are experimental. Swapping persistence is a single interface change, so the rest of the stack is unaffected by the choice of datastore.

The transport seam is the set of HTTP adapters. `dfe-express` is the stable router factory exposing the REST endpoints; `dfe-fastify`, `dfe-hono`, `dfe-trpc`, and `dfe-graphql` wrap the same pipeline for other servers. `dfe-hono` in particular is the path for serverless and edge runtimes.

## Framework Bindings

The core is pure logic, so each UI framework gets a thin binding. `dfe-react` (stable) exposes hooks — `useFormEngine`, `useFormStepper`, `useFormRuntime`, `useOfflineFormRuntime`, and `useFormSync` — plus headless components, leaving styling to the application or a UI kit. `dfe-vue`, `dfe-svelte`, `dfe-solid`, `dfe-angular`, and `dfe-vanilla` provide equivalent bindings at experimental maturity. The UI-kit packages (`dfe-ui-mui`, `dfe-ui-antd`, `dfe-ui-chakra`, and the experimental `dfe-ui-mantine`/`dfe-ui-shadcn`) supply themed renderers on top of the React binding.

## Authoring, Tooling, and Docs

`dfe-playground` (stable) is the public, browser-verified authoring surface: JSON editing, live preview, AI-assisted config generation, validation and field suggestions, and a consent-based, review-first draft-fill flow that never auto-submits. `dfe-builder` and `dfe-dashboard` (beta) extend this toward visual drag-and-drop authoring and management. `dfe-cli` scaffolds projects, and `dfe-vscode` and `dfe-docusaurus` provide editor and docs integrations. The documentation site itself is VitePress under `docs`.

## End-to-End Data Flow

A typical full-stack request moves through the layers like this:

1. The application loads a form configuration and optional hydration data and calls `createFormEngine` (and `createFormStepper` for multi-step flows).
2. The framework binding renders the visible fields. As the user edits, `setFieldValue` runs DAG propagation and returns a patch; the binding re-renders only the affected fields and re-evaluates computed fields.
3. On step submit, the binding validates the step with the generated Zod schema and sends the payload to the server through an HTTP adapter.
4. The server pipeline re-validates against the strict schema, runs the step's API contracts and hooks, and persists via the `DatabaseAdapter`.
5. The response is merged back into form values and the stepper advances — sequentially or along a matching branch.

## Build, Test, and Release Pipeline

Builds are orchestrated by Turborepo (`turbo.json`) and most packages bundle with `tsup`. CI (`.github/workflows/ci.yml`) runs install, build, artifact and wrapper smoke tests, the full test suite, stable-package coverage enforcement, release-readiness checks, and typecheck on Node 20, plus a canonical Postgres-backed example E2E job and a Node 18/22 compatibility matrix. Releases use Changesets (`.github/workflows/release.yml`): a changeset in a PR drives version bumps, per-package changelog generation, and npm publishing, while the two private example apps are explicitly excluded from versioning by a guard script. See `RELEASE.md` and `MAINTAINER_GUIDE.md` for the operational details.

## Where to Go Next

- Getting started and package selection: `docs/guide/getting-started.md`, `docs/guide/choose-your-package.md`
- Core concepts in depth: `docs/guide/dag.md`, `docs/guide/conditions.md`, `docs/guide/validation.md`, `docs/guide/multi-step.md`, `docs/guide/api-contracts.md`
- API reference: `docs/api/core.md`, `docs/api/react.md`, `docs/api/server.md`, `docs/api/types.md`
- Production and release: `docs/guide/production-checklist.md`, `RELEASE.md`, `DEPLOY_CHECKLIST.md`
