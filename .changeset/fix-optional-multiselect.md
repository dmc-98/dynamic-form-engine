---
"@dmc--98/dfe-core": patch
---

Fix optional `MULTI_SELECT` fields incorrectly requiring at least one selection. The `.min(1)` constraint is now applied only when the field is `required`, so untouched optional multi-selects (whose default value is `[]`) no longer block form submission with an invisible validation error.
