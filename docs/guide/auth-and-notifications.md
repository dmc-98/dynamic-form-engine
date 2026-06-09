# Authentication & Email Notifications

DFE provides authentication and email notifications as **adapters over your own providers** — it builds no identity service and sends no email itself. Your auth stays your auth; your mail stays your mail.

## Gate submissions behind your existing auth

DFE doesn't reinvent login. Supply a resolver that turns a request into a principal using whatever you already run:

```ts
import { createAuthGate } from '@dmc--98/dfe-server'

const gate = createAuthGate({
  resolve: async (req) => {
    const session = await getServerSession(req) // NextAuth / Auth.js / Clerk / your JWT check
    return session ? { userId: session.user.id, roles: session.user.roles } : null
  },
  requireRole: 'member', // optional
})

const decision = await gate.authorize(req)
if (!decision.ok) return res.status(decision.status!).json({ error: decision.reason })
// decision.principal.userId is now trusted, server-side
```

It returns `401` when unauthenticated, `403` when a required role is missing, and **fails closed** if your resolver throws — a resolver error is never treated as authenticated.

## Email notifications at any phase

Fire templated emails through your provider's SDK via an injected transport:

```ts
import { Resend } from 'resend'
import { createEmailNotifier } from '@dmc--98/dfe-server'

const resend = new Resend(process.env.RESEND_API_KEY)

const notifier = createEmailNotifier({
  from: 'forms@acme.com',
  transport: { send: (m) => resend.emails.send({ from: m.from, to: m.to, subject: m.subject, html: m.body }) },
  templates: {
    submitted: {
      to: (c) => String(c.values.email),
      subject: () => 'Thanks for your submission',
      body: (c) => `Hi ${c.values.name}, we received your form.`,
    },
    step_completed: {
      to: () => 'ops@acme.com',
      subject: (c) => `Step ${c.stepId} completed`,
      body: (c) => `Submission ${c.submissionId} finished ${c.stepId}.`,
    },
  },
})

// Call from your submit/step pipeline:
await notifier.notify('submitted', { values, submissionId })
await notifier.notify('step_completed', { values, stepId: 'review', submissionId })
```

Unknown phases and empty recipients are silently skipped; transport errors propagate so you can retry/log.

## Why adapters instead of hosted auth/email

- **No new identity surface** — you don't trust DFE with passwords or OAuth secrets; it trusts *your* session.
- **No email vendor lock-in** — swap Resend for SES/Postmark by changing one `send` function.
- **Self-hosted & private** — recipients and credentials never touch DFE.

Trade-off vs. a SaaS: you wire your auth library and email provider once. In return there's no third party in your auth or mail path, and no per-seat pricing.
