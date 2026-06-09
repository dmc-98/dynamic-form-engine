---
"@dmc--98/dfe-core": minor
---

Multi-step flow + review/redirect primitives:

- `buildFlowModel(steps)` — a pure nodes/edges graph of a form's flow (sequential + conditional branch edges, with skippable/review flags and dangling-target detection). Powers a visual flow diagram as a thin renderer over verified data.
- `buildReviewSummary(fields, values, steps?)` — a grouped, human-readable answer summary for a review/summary step (option labels resolved, arrays joined, layout fields excluded, per-item step id for edit navigation).
- `resolveRedirect(steps, stepId)` — resolves the post-submit redirect from `ReviewConfig.redirectAfterSubmit`.
