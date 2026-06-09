# @dmc--98/dfe-server

## 0.2.0

### Minor Changes

- 8f1b13c: Add `createPaymentStepHandler` — a provider-agnostic, server-side payment-step helper (bring your own Stripe). It creates PaymentIntents through an injected `PaymentClient`, verifies them server-side (requires `succeeded`, optional amount/currency match to defeat tampering), and surfaces provider errors as clean failures. DFE hosts nothing and ships no payment SDK; secrets and card data stay with your provider. See ADR 0001 for the payment-step-vs-field decision.
- 8f1b13c: Add auth + email-notification adapters (bring your own provider; DFE hosts neither):
  - `createAuthGate({ resolve, requireRole? })` — gate submissions behind the host app's existing auth (NextAuth/Auth.js, Clerk, JWT, session). Enforces authentication and an optional role; fails closed on resolver errors (401/403 decisions, never a crash).
  - `createEmailNotifier({ transport, from, templates })` — fire per-phase templated emails (submitted / step_completed / abandoned / …) through an injected transport (Resend, SES, Nodemailer, Postmark). No-ops on unknown phase or empty recipient; surfaces transport errors to the caller.

### Patch Changes

- 8f1b13c: Code-review hardening of the milestone work:
  - **core (CSV formula injection — critical):** `exportSubmissionsToCsv`/`exportFormToCsv` now neutralize spreadsheet formula injection (cells starting with `= + - @` tab/CR are prefixed with `'`) and render objects as JSON instead of `[object Object]`.
  - **core (review):** `buildReviewSummary` no longer crashes on a field with `undefined` config and resolves numeric SELECT values to their option labels (string coercion).
  - **core (theme):** `exportTheme` strips `;{}<>` from string values so a malformed theme can't break out of the CSS declaration or a `<style>` block.
  - **core (templates):** the NPS-survey follow-up now uses `not_empty` (show once scored) instead of an always-true `gte 0`. `flow-model` sorts deterministically (tie-break on id).
  - **builder:** `SET_VALIDATION` is restricted to an allow-list of validation keys so it can't corrupt structural config (`options`, `mode`).
  - **server (auth):** `requireRole` guards against a non-array `roles` shape (fails closed 403, never throws). **payment:** rejects non-integer amounts and compares currency case-insensitively; non-Error throws stringify safely. **notify:** documented that `notify` rejects on transport/template errors so callers don't fail the submission flow.

- 8f1b13c: Add type-checked integration recipes (docs + tests) covering common integration scenarios on DFE's existing primitives — signed webhooks, Google Sheets / Airtable append-row via `StepApiContract`, and generic service calls with response→context propagation — with no hosted middleman. The recipes are pinned by `integration-recipes.test.ts` so they can't drift from the API.
- Updated dependencies [8f1b13c]
- Updated dependencies [f9159d7]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
  - @dmc--98/dfe-core@0.3.0

## 0.1.1

### Patch Changes

- f3c43c7: Improve package docs and npm package pages, harden release publishing against npm throttling, and fix docs and release workflow reliability. No breaking API changes.
- f3c43c7: Security and quality hardening from a full code review:
  - **express:** deny-by-default tenant access (`requireTenantMatch` option) closing a cross-tenant IDOR; loud `skipAuth` warning; authentication required on the dynamic field-options endpoint; client-supplied step `context` no longer trusted (`allowedClientContextKeys` allowlist); per-form stats made opt-in (`includeFormStats`) to remove an N+1; rate limiter `failClosed` option, bucket eviction, and trust-proxy guidance.
  - **server:** fixed a webhook bug that broke the default `fetch` path (now with timeout + SSRF note); `encodeURIComponent` on resolved endpoint placeholders; step persistence failures no longer report success; generic downstream-error messages (no internal leakage); uniform FNV-1a experiment bucketing; HKDF-based field encryption that honors `keyId` for rotation.
  - **core:** hardened the computed-expression evaluator (scope-object binding + reserved-word handling so field keys like `default` no longer break evaluation; documented as trusted-config, not a sandbox); O(1) parent lookup in graph construction; no `console` noise in library code.
  - **react:** correct `useDynamicOptions` dependencies + abort-on-unmount + stable headers; stabilized `useFormSync` connect effect (no reconnect churn); stable keys in builder panels.
  - **prisma / drizzle:** field-option search + pagination pushed into SQL with explicit cursor handling; real `count()` for analytics; transactional collaboration reads/writes; typed row mappers.

- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
  - @dmc--98/dfe-core@0.2.0
