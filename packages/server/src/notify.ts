// ─── Email Notifications (adapter, not an email service) ─────────────────────
// DFE doesn't send email. It provides a NOTIFIER that renders per-phase
// templates and dispatches them through an injected transport (Resend, SES,
// Nodemailer, Postmark — your choice). Send templated emails at any phase of a
// form without DFE hosting anything.

export interface EmailMessage {
  from: string
  to: string
  subject: string
  body: string
}

/** The minimal transport DFE needs. Wrap your email provider. */
export interface EmailTransport {
  send(message: EmailMessage): Promise<{ id: string } | void>
}

/** Context passed to a template's renderers. */
export interface NotifyContext {
  values: Record<string, unknown>
  stepId?: string
  submissionId?: string
  [key: string]: unknown
}

export interface EmailTemplate {
  to: (ctx: NotifyContext) => string
  subject: (ctx: NotifyContext) => string
  body: (ctx: NotifyContext) => string
}

export interface EmailNotifierOptions {
  transport: EmailTransport
  from: string
  /** Keyed by phase, e.g. 'submitted', 'step_completed', 'abandoned'. */
  templates: Record<string, EmailTemplate>
}

export interface EmailNotifier {
  /**
   * Render and send the template for `phase`. No-op (resolves) when there's no
   * template for the phase or the resolved recipient is empty.
   *
   * The returned promise **rejects** if the transport or a template renderer
   * throws. Notifications are usually a side effect of submission — callers
   * should `await … .catch(...)` (or fire-and-forget) so an email failure does
   * not fail the submission flow.
   */
  notify(phase: string, ctx: NotifyContext): Promise<void>
}

/**
 * Create an email notifier over an injected transport and a set of per-phase
 * templates.
 *
 * @example
 * ```ts
 * import { Resend } from 'resend'
 * const resend = new Resend(process.env.RESEND_API_KEY)
 * const notifier = createEmailNotifier({
 *   from: 'forms@acme.com',
 *   transport: { send: (m) => resend.emails.send({ from: m.from, to: m.to, subject: m.subject, html: m.body }) },
 *   templates: {
 *     submitted: {
 *       to: (c) => String(c.values.email),
 *       subject: () => 'Thanks!',
 *       body: (c) => `Hi ${c.values.name}, we got your form.`,
 *     },
 *   },
 * })
 * await notifier.notify('submitted', { values })
 * ```
 */
export function createEmailNotifier(options: EmailNotifierOptions): EmailNotifier {
  return {
    async notify(phase, ctx) {
      const template = options.templates[phase]
      if (!template) return // unknown phase → no-op

      const to = template.to(ctx)
      if (!to) return // no recipient → skip silently

      await options.transport.send({
        from: options.from,
        to,
        subject: template.subject(ctx),
        body: template.body(ctx),
      })
    },
  }
}
