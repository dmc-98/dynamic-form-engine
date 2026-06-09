---
"@dmc--98/dfe-server": minor
---

Add auth + email-notification adapters (bring your own provider; DFE hosts neither):

- `createAuthGate({ resolve, requireRole? })` — gate submissions behind the host app's existing auth (NextAuth/Auth.js, Clerk, JWT, session). Enforces authentication and an optional role; fails closed on resolver errors (401/403 decisions, never a crash).
- `createEmailNotifier({ transport, from, templates })` — fire per-phase templated emails (submitted / step_completed / abandoned / …) through an injected transport (Resend, SES, Nodemailer, Postmark). No-ops on unknown phase or empty recipient; surfaces transport errors to the caller.
