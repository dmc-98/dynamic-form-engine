# @dmc--98/dfe-core

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
