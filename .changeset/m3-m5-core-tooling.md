---
"@dmc--98/dfe-core": minor
---

Add Builder, migration, and AI tooling to the core:

- `diffFormConfig` / `summarizeFormConfigDiff` — compare two form configs (added/removed/changed fields and steps) for the Builder's diff view.
- `suggestConfigRepairs` / `autofixConfig` — static analysis that flags duplicate keys, dangling condition/step references, missing select options, and broken computed dependencies, with safe auto-fixes.
- `applyFormMigration` / `migrateFormValues` / `validateMigrationChain` — versioned config migration for evolving stored submission values (renames, removals, additions, custom transforms).
- `createAiFormBuilder` — a provider-agnostic, review-first AI form builder that generates and refines configs through an injected LLM provider, with a deterministic offline fallback.
