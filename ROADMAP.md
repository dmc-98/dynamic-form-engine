# DFE Open Source Roadmap

Things to add to make Dynamic Form Engine a production-ready, community-driven open source project.

For the execution-oriented completion plan covering all remaining features, see [FEATURE_COMPLETION_PLAN.md](./FEATURE_COMPLETION_PLAN.md).
For the backend serverless audit and remote-collaboration gap analysis, see [SERVERLESS_FEASIBILITY_AUDIT.md](./SERVERLESS_FEASIBILITY_AUDIT.md).

## Status Key

- `[x]` implemented in the repo and currently passing either the root verification flow or a dedicated example verification flow
- `[ ]` not implemented yet, or not implemented at the level claimed by the label

## Current Reality Check

Verified locally on March 13, 2026:

- Root `pnpm install`, `pnpm build`, `pnpm test`, and `pnpm typecheck` are all passing.
- `@dmc--98/dfe-ui-mui`, `@dmc--98/dfe-ui-antd`, and `@dmc--98/dfe-ui-chakra` now ship real themed renderer, step-indicator, and preview surfaces on top of the shared React renderer contract and are now documented as stable themed wrapper packages.
- `dfe migrate` now detects Prisma and Drizzle projects, scaffolds DFE schema assets, and verifies migration readiness while delegating execution to each ORM's native migration command.
- `dfe migrate doctor` now supports optional live PostgreSQL table and column verification when `DATABASE_URL` or `--database-url` is provided.
- The `e2e/` area now includes browser-driven Playwright coverage for the canonical example app, including validation and back-navigation regressions, and CI runs that flow against Postgres.
- `examples/fullstack/` now has Prisma wiring, migrations, Docker assets, browser-driven E2E, and runtime CI smoke coverage for the canonical React + Express + Prisma lane.
- `@dmc--98/dfe-express` already exports `createRateLimiter()`.
- The current collaboration implementation is a browser-local baseline built on the shared sync substrate. It is not yet a remote multi-device collaboration backend.
- Some backend conveniences are intentionally still process-local and should not be mistaken for serverless-safe production primitives:
  - `@dmc--98/dfe-express` rate limiting is in-memory today
  - the default trace exporter is in-memory today
  - ORM adapter default dynamic-resource execution is in-memory unless overridden
  - the canonical Express example is a Node server, not a serverless reference
- Stable package coverage thresholds are now enforced for `core`, `react`, `server`, `express`, `prisma`, `drizzle`, `cli`, `ui-mui`, `ui-antd`, and `ui-chakra`.
- Wrapper-package smoke checks now cover Fastify, Hono, tRPC, Angular, Vanilla, Vue, Svelte, and Solid built artifacts.
- Release readiness now includes Changesets config, package `npm pack --dry-run` checks, and a GitHub release workflow.
- Turbo remote-cache env wiring is now present in CI and documented for local opt-in.
- The stable server lane now includes OTel-shaped tracing, tenant-aware identity, persisted analytics aggregation, and deterministic A/B assignment through the canonical example stack.

## Package Maturity Snapshot

### Stable

- `@dmc--98/dfe-core`
- `@dmc--98/dfe-react`
- `@dmc--98/dfe-server`
- `@dmc--98/dfe-express`
- `@dmc--98/dfe-prisma`
- `@dmc--98/dfe-drizzle`
- `@dmc--98/dfe-cli`
- `@dmc--98/dfe-ui-mui`
- `@dmc--98/dfe-ui-antd`
- `@dmc--98/dfe-ui-chakra`

### Beta

- `@dmc--98/dfe-builder`
- `@dmc--98/dfe-playground`
- `@dmc--98/dfe-dashboard`
- `@dmc--98/dfe-fastify`
- `@dmc--98/dfe-trpc`
- `@dmc--98/dfe-hono`
- `dfe-vscode`

### Experimental

- `@dmc--98/dfe-vue`
- `@dmc--98/dfe-svelte`
- `@dmc--98/dfe-solid`
- `@dmc--98/dfe-angular`
- `@dmc--98/dfe-vanilla`
- `@dmc--98/dfe-sqlite`
- `@dmc--98/dfe-mongoose`
- `@dmc--98/dfe-ui-shadcn`
- `@dmc--98/dfe-ui-mantine`

---

## P0 — Must Have Before Launch

### Security & Correctness Fixes
- [x] **Authorization middleware** — Add ownership checks on all submission endpoints (express package)
- [x] **Query param sanitization** — Prevent injection via dynamic options endpoint filter passthrough
- [x] **ReDoS protection** — Validate/sandbox user-supplied regex patterns in field config
- [x] **Fix silent catch** — Log or surface errors when submission DB update fails in step-submit
- [x] **Stale closure fix** — Use `useRef` for context in `useFormRuntime` to prevent race conditions

### OSS Essentials
- [x] **LICENSE** file (MIT)
- [x] **CONTRIBUTING.md** — Dev setup, PR process, commit conventions, code style
- [x] **CODE_OF_CONDUCT.md** — Contributor Covenant
- [x] **CHANGELOG.md** — Initialize with changesets
- [x] **SECURITY.md** — Responsible disclosure policy
- [x] **Issue templates** — Bug report, feature request, question
- [x] **PR template** — Checklist with test/docs/changeset reminders
- [x] **`"files"` field** in all package.json to control npm publish contents

---

## P1 — High Impact Additions

### Developer Experience
- [x] **Visual Form Builder GUI** — Drag-and-drop form designer that outputs DFE JSON config (`@dmc--98/dfe-builder` package using React DnD)
- [x] **Playground / Sandbox** — Interactive website where devs write DFE config and see the form live (`@dmc--98/dfe-playground`)
- [x] **JSON Schema import/export** — `toJsonSchema()` / `fromJsonSchema()` with `x-dfe-type` extension for lossless round-trips
- [x] **Form config validator** — CLI command (`dfe validate myform.json`) checks for errors, circular deps, missing references, type mismatches
- [x] **VS Code extension** — IntelliSense for DFE config objects (`@dmc--98/dfe-vscode` with JSON Schema validation, snippets, diagnostics)

### Framework Bindings
- [x] **Vue.js package** (`@dmc--98/dfe-vue`) — Composables: `useFormEngine()`, `useFormStepper()`, `useFormRuntime()`
- [x] **Svelte package** (`@dmc--98/dfe-svelte`) — Stores-based bindings
- [x] **Angular package** (`@dmc--98/dfe-angular`) — Service + directive approach
- [x] **Solid.js package** (`@dmc--98/dfe-solid`) — Signal-based bindings
- [x] **Vanilla JS adapter** (`@dmc--98/dfe-vanilla`) — Framework-free with DOM rendering

### Server & Database
- [x] **tRPC adapter** (`@dmc--98/dfe-trpc`) — Type-safe API layer for Next.js/full-stack TS
- [x] **Fastify plugin** (`@dmc--98/dfe-fastify`) — Alternative to Express router
- [x] **Hono adapter** (`@dmc--98/dfe-hono`) — Edge-ready HTTP framework support
- [x] **MongoDB adapter** (`@dmc--98/dfe-mongoose`) — For teams not using SQL
- [x] **SQLite adapter** (`@dmc--98/dfe-sqlite`) — For local development and embedded use cases
- [x] **Adapter-aware database migrations CLI** — `dfe migrate plan`, `generate`, and `doctor` now support Prisma and Drizzle migration scaffolding

### Testing
- [x] **Integration tests** — Full Express + Prisma + Core test suite across all packages
- [x] **React component tests** — Component and hook tests for DfeFormRenderer, DfeStepIndicator, useFormEngine, useFormStepper
- [x] **Browser E2E tests** — Playwright tests for the example fullstack app
- [x] **Performance benchmarks** — O(k) propagation benchmarks with 50, 100, 500, 1000 field forms
- [x] **Snapshot tests** — Zod schema generation output for all 24 field types

---

## P2 — Differentiation Features

### Advanced Form Capabilities
- [x] **Field-level async validation** — `AsyncValidationRule` type with debounced server-side validation support
- [x] **Computed / derived fields** — `ComputedFieldConfig` with expression evaluation (`total = price * quantity`) and dependency tracking
- [x] **Repeatable field groups** — `addRepeatInstance()` / `removeRepeatInstance()` / `getRepeatInstances()` on FormEngine
- [x] **Branching / conditional steps** — `StepBranch` with string expressions and FieldConditions; `getNextBranch()` / `goNextBranch()` on FormStepper
- [x] **Form versioning & migration** — `FormVersion` / `FormMigration` types with rename, remove, add, transform operations
- [x] **Autosave / draft recovery** — `AutosaveConfig` type with pluggable storage backends (localStorage, sessionStorage, custom)
- [x] **Undo/redo** — Value stack pattern with `undo()` / `redo()` / `canUndo()` / `canRedo()` on FormEngine (50-entry max history)
- [x] **Field-level permissions** — `FieldPermission` with role-based `hidden` / `readonly` / `editable` levels via `getFieldPermission()`
- [x] **i18n / localization** — `LocalizedString` / `I18nConfig` types with `getLocalizedLabel()` and per-field/per-step translations
- [x] **Rich text field** — `RICH_TEXT` field type with `RichTextFieldConfig` and Zod validation
- [x] **Signature field** — `SIGNATURE` field type with `SignatureFieldConfig` and data-URL validation
- [x] **Address autocomplete** — `ADDRESS` field type with `AddressFieldConfig` (structured street/city/state/zip/country)
- [x] **Cascading dropdowns** — `DynamicDataSource` with `dependsOnField` for parent-child SELECT dependencies

### AI Integration
- [x] **LLM form generation** — `generateFormFromDescription()` with template-based + `buildLlmPrompt()` for LLM-assisted generation
- [x] **AI-assisted validation rules** — `suggestValidationRules()` based on field labels, types, and common patterns
- [x] **Smart field suggestions** — `suggestAdditionalFields()` with `groupSuggestionsByCategory()` based on form purpose
- [x] **Form analytics** — `FormAnalyticsEvent` type for tracking completion rates, drop-offs, and field errors

Note: these authoring-time AI helpers are now productized through the browser-verified Playground. End-user draft fill ships as an explicit consent + review workflow and never auto-submits.

### Rendering & UI
- [x] **Pre-built UI kits (implemented today)** — Styled form components for:
  - `@dmc--98/dfe-ui-shadcn`
  - `@dmc--98/dfe-ui-mantine`
- [x] **Material UI kit** — `@dmc--98/dfe-ui-mui` now provides a themed field renderer, step indicator, preview surface, Storybook stories, and smoke coverage
- [x] **Ant Design UI kit** — `@dmc--98/dfe-ui-antd` now provides a themed field renderer, step indicator, preview surface, Storybook stories, and smoke coverage
- [x] **Chakra UI kit** — `@dmc--98/dfe-ui-chakra` now provides a themed field renderer, step indicator, preview surface, Storybook stories, and smoke coverage
- [x] **PDF form rendering** — `generatePdfLayout()` / `generatePrintableHtml()` for PDF output from DFE config
- [x] **Form preview mode** — Read-only rendering with `DfeFormRenderer` in preview mode
- [x] **Accessibility audit** — `auditFormAccessibility()` / `summarizeA11yAudit()` for WCAG 2.1 AA compliance
- [x] **Responsive layout engine** — Grid-based layout with `width: 'full' | 'half' | 'third'` breakpoint-aware field widths

### Platform & Ecosystem
- [x] **Admin dashboard** — `@dmc--98/dfe-dashboard` package for form management and submission viewing
- [x] **Webhook support** — `WebhookConfig` / `WebhookEvent` types for form events (submission, step completion)
- [x] **Plugin system** — `PluginDefinition` type with `registerSchemaBuilder()` for custom field types and validators
- [x] **Form templates library** — `getTemplate()` / `listTemplates()` / `TEMPLATES` with pre-built configs (contact, onboarding, survey, feedback, registration)
- [x] **Import from other platforms** — `importFromTypeform()` / `importFromGoogleForms()` migration tools
- [x] **Export to other formats** — `exportForm()` / `exportFormToYaml()` / `exportFormToCsv()` with multiple output formats
- [x] **Rate limiting middleware** — `createRateLimiter()` exists in `@dmc--98/dfe-express`
- [x] **OpenTelemetry observability** — The stable server lane now exposes OTel-shaped tracing helpers, request spans, and canonical-example trace inspection
- [x] **Browser-local collaboration baseline** — Shared sync substrate, IndexedDB/offline queues, presence, and cross-tab collaboration now exist in the React/example lane
- [x] **Remote server-backed collaboration** — Durable multi-user collaboration across devices now exists via the Hono + Prisma serverless reference path with shared presence, operation streaming, and authorization checks
- [x] **Serverless backend hardening** — The serverless reference lane now documents and uses durable collaboration state plus pluggable rate-limit storage, with browser verification against the serverless backend

---

## P3 — Nice to Have / Community Driven

- [x] **GraphQL API** — `@dmc--98/dfe-graphql` now provides a Beta GraphQL surface for forms, submissions, field options, analytics, and completion while reusing the stable server orchestration
- [x] **Browser-local collaboration baseline** — Browser-verified collaborative draft sync now exists in the React/example lane with BroadcastChannel transport, participant presence, and deterministic last-write-wins conflict handling
- [x] **Offline support** — The React/example lane now ships service-worker-backed app-shell caching, IndexedDB draft persistence, queued submission replay, and browser-verified reconnect sync
- [x] **Form analytics dashboard** — Persisted analytics, aggregation endpoints, and dashboard-ready data now cover completion, drop-off, errors, timing, and recent activity
- [x] **A/B testing** — Stable-lane variants now support deterministic assignment plus completion and abandonment comparison
- [x] **Multi-tenant support** — Org-scoped form access, submissions, analytics, and example requests now support tenant isolation
- [x] **HIPAA-supporting mode** — Protected-field classification, encrypted-at-rest submission vault hooks, audit logging hooks for read/write/export actions, restricted analytics behavior, and operational guidance without overstating legal compliance
- [x] **Custom CSS theming** — Shared theme tokens and CSS custom properties now power the shared renderer contract and themed UI kits
- [x] **Storybook integration** — Storybook stories now cover the shared renderer surfaces and supported themed UI kits
- [x] **Docusaurus plugin** — `@dmc--98/dfe-docusaurus` now provides a Beta plugin/preset path for embedding live DFE forms in Docusaurus sites
- [x] **Playground hardening** — `@dmc--98/dfe-playground` is now browser-verified, documented, and promoted to the Stable lane as the supported authoring playground
- [x] **AI authoring workflow** — `@dmc--98/dfe-playground` now exposes prompt-based config generation, validation-rule suggestions, and additional-field suggestions with browser verification and docs
- [x] **AI-assisted form fill** — `generateAutofillDraft()` plus the Playground review-first UX now support explicit-consent draft answers without auto-submit behavior
- [x] **Turborepo remote caching** — CI and contributor opt-in wiring are now in place; remaining work is operational backend hookup

---

## Prioritization Rationale

The roadmap is ordered by **impact on adoption**:

1. **P0 (Security + OSS essentials)** — Without these, no serious developer will trust or contribute to the project.
2. **P1 (DX + Framework bindings + Tests)** — The visual builder alone could 10x adoption. Framework bindings unlock 70%+ of the frontend market. Comprehensive tests build trust.
3. **P2 (Advanced features + AI + UI kits)** — These differentiate DFE from competitors and create stickiness. Repeatable groups and computed fields are the most-requested features in form libraries.
4. **P3 (Platform features)** — These transform DFE from a library into a platform. Only pursue after strong community traction.
