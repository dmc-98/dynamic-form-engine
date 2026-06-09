---
"@dmc--98/dfe-core": patch
"@dmc--98/dfe-builder": patch
"@dmc--98/dfe-server": patch
---

Code-review hardening of the milestone work:

- **core (CSV formula injection — critical):** `exportSubmissionsToCsv`/`exportFormToCsv` now neutralize spreadsheet formula injection (cells starting with `= + - @` tab/CR are prefixed with `'`) and render objects as JSON instead of `[object Object]`.
- **core (review):** `buildReviewSummary` no longer crashes on a field with `undefined` config and resolves numeric SELECT values to their option labels (string coercion).
- **core (theme):** `exportTheme` strips `;{}<>` from string values so a malformed theme can't break out of the CSS declaration or a `<style>` block.
- **core (templates):** the NPS-survey follow-up now uses `not_empty` (show once scored) instead of an always-true `gte 0`. `flow-model` sorts deterministically (tie-break on id).
- **builder:** `SET_VALIDATION` is restricted to an allow-list of validation keys so it can't corrupt structural config (`options`, `mode`).
- **server (auth):** `requireRole` guards against a non-array `roles` shape (fails closed 403, never throws). **payment:** rejects non-integer amounts and compares currency case-insensitively; non-Error throws stringify safely. **notify:** documented that `notify` rejects on transport/template errors so callers don't fail the submission flow.
