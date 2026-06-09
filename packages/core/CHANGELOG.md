# @dmc--98/dfe-core

## 0.3.0

### Minor Changes

- 8f1b13c: Builder editing + headless theming for the visual builder / playground:
  - **dfe-builder:** new reducer actions — `MOVE_FIELD_BY` (keyboard-accessible relative reorder, clamped), `ADD_OPTION` / `UPDATE_OPTION` / `REMOVE_OPTION` (selection-field option editing, keeps ≥1 option, dedupes values), and `SET_VALIDATION` (per-field validation rules in config, with rule-clearing).
  - **dfe-core:** new `exportTheme()` / `defaultTheme()` — export a form theme as both CSS custom properties and a token object, so styling is code the consumer owns. No runtime styling is imposed; DFE stays headless.

- 8f1b13c: Multi-step flow + review/redirect primitives:
  - `buildFlowModel(steps)` — a pure nodes/edges graph of a form's flow (sequential + conditional branch edges, with skippable/review flags and dangling-target detection). Powers a visual flow diagram as a thin renderer over verified data.
  - `buildReviewSummary(fields, values, steps?)` — a grouped, human-readable answer summary for a review/summary step (option labels resolved, arrays joined, layout fields excluded, per-item step id for edit navigation).
  - `resolveRedirect(steps, stepId)` — resolves the post-submit redirect from `ReviewConfig.redirectAfterSubmit`.

- 8f1b13c: Expand the template registry for the gallery: add `lead-generation`, `newsletter-signup`, `nps-survey`, `appointment-booking`, and `support-ticket` (16 templates total), plus a `lead-gen` category. A registry-wide test guarantees every template passes `suggestConfigRepairs` with zero errors and loads into the engine, so anything in the gallery is safe to open.
- 8f1b13c: Add `exportSubmissionsToCsv(fields, submissions)` — export form submissions as RFC-4180 CSV (ID, Status, optional Submitted, then one column per field by label; missing → empty, arrays joined). This is the "save as CSV" of a self-hosted submissions tracker. The existing `dfe-server` analytics summary already derives the core form metrics (visits, completion %, exit/abandonment %, average duration, validation-error counts); a test now pins that contract.

### Patch Changes

- 8f1b13c: Code-review hardening of the milestone work:
  - **core (CSV formula injection — critical):** `exportSubmissionsToCsv`/`exportFormToCsv` now neutralize spreadsheet formula injection (cells starting with `= + - @` tab/CR are prefixed with `'`) and render objects as JSON instead of `[object Object]`.
  - **core (review):** `buildReviewSummary` no longer crashes on a field with `undefined` config and resolves numeric SELECT values to their option labels (string coercion).
  - **core (theme):** `exportTheme` strips `;{}<>` from string values so a malformed theme can't break out of the CSS declaration or a `<style>` block.
  - **core (templates):** the NPS-survey follow-up now uses `not_empty` (show once scored) instead of an always-true `gte 0`. `flow-model` sorts deterministically (tie-break on id).
  - **builder:** `SET_VALIDATION` is restricted to an allow-list of validation keys so it can't corrupt structural config (`options`, `mode`).
  - **server (auth):** `requireRole` guards against a non-array `roles` shape (fails closed 403, never throws). **payment:** rejects non-integer amounts and compares currency case-insensitively; non-Error throws stringify safely. **notify:** documented that `notify` rejects on transport/template errors so callers don't fail the submission flow.

- f9159d7: Fix optional `MULTI_SELECT` fields incorrectly requiring at least one selection. The `.min(1)` constraint is now applied only when the field is `required`, so untouched optional multi-selects (whose default value is `[]`) no longer block form submission with an invisible validation error.

## 0.2.0

### Minor Changes

- f3c43c7: Add three M1 starter templates — `user-onboarding`, `loan-application`, and `admin-approval-workflow` — each showcasing a core DFE capability (conditional visibility, computed fields, conditional requirement, and step branching). Available via `getTemplate`, `listTemplates`, and `getTemplatesByCategory`.
- f3c43c7: Add Builder, migration, and AI tooling to the core:
  - `diffFormConfig` / `summarizeFormConfigDiff` — compare two form configs (added/removed/changed fields and steps) for the Builder's diff view.
  - `suggestConfigRepairs` / `autofixConfig` — static analysis that flags duplicate keys, dangling condition/step references, missing select options, and broken computed dependencies, with safe auto-fixes.
  - `applyFormMigration` / `migrateFormValues` / `validateMigrationChain` — versioned config migration for evolving stored submission values (renames, removals, additions, custom transforms).
  - `createAiFormBuilder` — a provider-agnostic, review-first AI form builder that generates and refines configs through an injected LLM provider, with a deterministic offline fallback.

### Patch Changes

- f3c43c7: Improve package docs and npm package pages, harden release publishing against npm throttling, and fix docs and release workflow reliability. No breaking API changes.
- f3c43c7: Security and quality hardening from a full code review:
  - **express:** deny-by-default tenant access (`requireTenantMatch` option) closing a cross-tenant IDOR; loud `skipAuth` warning; authentication required on the dynamic field-options endpoint; client-supplied step `context` no longer trusted (`allowedClientContextKeys` allowlist); per-form stats made opt-in (`includeFormStats`) to remove an N+1; rate limiter `failClosed` option, bucket eviction, and trust-proxy guidance.
  - **server:** fixed a webhook bug that broke the default `fetch` path (now with timeout + SSRF note); `encodeURIComponent` on resolved endpoint placeholders; step persistence failures no longer report success; generic downstream-error messages (no internal leakage); uniform FNV-1a experiment bucketing; HKDF-based field encryption that honors `keyId` for rotation.
  - **core:** hardened the computed-expression evaluator (scope-object binding + reserved-word handling so field keys like `default` no longer break evaluation; documented as trusted-config, not a sandbox); O(1) parent lookup in graph construction; no `console` noise in library code.
  - **react:** correct `useDynamicOptions` dependencies + abort-on-unmount + stable headers; stabilized `useFormSync` connect effect (no reconnect churn); stable keys in builder panels.
  - **prisma / drizzle:** field-option search + pagination pushed into SQL with explicit cursor handling; real `count()` for analytics; transactional collaboration reads/writes; typed row mappers.
