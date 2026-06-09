---
"@dmc--98/dfe-core": minor
---

Add `exportSubmissionsToCsv(fields, submissions)` — export form submissions as RFC-4180 CSV (ID, Status, optional Submitted, then one column per field by label; missing → empty, arrays joined). This is the "save as CSV" of a self-hosted submissions tracker. The existing `dfe-server` analytics summary already derives the core form metrics (visits, completion %, exit/abandonment %, average duration, validation-error counts); a test now pins that contract.
