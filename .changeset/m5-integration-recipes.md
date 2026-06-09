---
"@dmc--98/dfe-server": patch
---

Add type-checked integration recipes (docs + tests) covering common integration scenarios on DFE's existing primitives — signed webhooks, Google Sheets / Airtable append-row via `StepApiContract`, and generic service calls with response→context propagation — with no hosted middleman. The recipes are pinned by `integration-recipes.test.ts` so they can't drift from the API.
