import { describe, it, expect, vi } from 'vitest'
import { createAuthGate, type AuthResolver } from '../src/auth'
import { createEmailNotifier, type EmailTransport } from '../src/notify'

// ─── M7: auth gate + email notifications (adapters, not a hosted service) ─────
// DFE doesn't build an identity provider or an email service. It provides:
//  • an auth GATE that defers to the host app's existing auth (NextAuth/Clerk/…)
//  • an email NOTIFIER that fires templated mail through an injected transport
//    (Resend/SES/Nodemailer). Both are tested here with mocks.

describe('createAuthGate', () => {
  const allow: AuthResolver = async () => ({ userId: 'u1', roles: ['user'] })
  const deny: AuthResolver = async () => null

  it('permits a request when the resolver returns a principal', async () => {
    const gate = createAuthGate({ resolve: allow })
    const res = await gate.authorize({ headers: {} })
    expect(res.ok).toBe(true)
    expect(res.principal?.userId).toBe('u1')
  })

  it('denies when the resolver returns null', async () => {
    const gate = createAuthGate({ resolve: deny })
    const res = await gate.authorize({ headers: {} })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(401)
  })

  it('enforces a required role (403 when missing)', async () => {
    const gate = createAuthGate({ resolve: allow, requireRole: 'admin' })
    const res = await gate.authorize({ headers: {} })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(403)
  })

  it('passes when the principal has the required role', async () => {
    const gate = createAuthGate({ resolve: async () => ({ userId: 'u1', roles: ['admin'] }), requireRole: 'admin' })
    const res = await gate.authorize({ headers: {} })
    expect(res.ok).toBe(true)
  })

  it('treats a resolver throw as denied (fail-closed), not a crash', async () => {
    const gate = createAuthGate({ resolve: async () => { throw new Error('boom') } })
    const res = await gate.authorize({ headers: {} })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(401)
  })
})

describe('createEmailNotifier', () => {
  function mockTransport(): EmailTransport {
    return { send: vi.fn(async () => ({ id: 'msg_1' })) }
  }

  it('renders a template and sends through the transport', async () => {
    const transport = mockTransport()
    const notifier = createEmailNotifier({
      transport,
      from: 'forms@acme.com',
      templates: {
        submitted: {
          to: (ctx) => String(ctx.values.email),
          subject: () => 'Thanks for your submission',
          body: (ctx) => `Hi ${ctx.values.name}, we received your form.`,
        },
      },
    })
    await notifier.notify('submitted', { values: { email: 'ada@x.com', name: 'Ada' } })
    expect(transport.send).toHaveBeenCalledWith(expect.objectContaining({
      from: 'forms@acme.com',
      to: 'ada@x.com',
      subject: 'Thanks for your submission',
      body: expect.stringContaining('Ada'),
    }))
  })

  it('is a no-op for an unknown template (no throw)', async () => {
    const transport = mockTransport()
    const notifier = createEmailNotifier({ transport, from: 'x@y.com', templates: {} })
    await expect(notifier.notify('nope', { values: {} })).resolves.toBeUndefined()
    expect(transport.send).not.toHaveBeenCalled()
  })

  it('skips sending when the resolved recipient is empty', async () => {
    const transport = mockTransport()
    const notifier = createEmailNotifier({
      transport, from: 'x@y.com',
      templates: { submitted: { to: () => '', subject: () => 'S', body: () => 'B' } },
    })
    await notifier.notify('submitted', { values: {} })
    expect(transport.send).not.toHaveBeenCalled()
  })

  it('surfaces transport errors as a rejected result the caller can handle', async () => {
    const transport: EmailTransport = { send: vi.fn(async () => { throw new Error('smtp down') }) }
    const notifier = createEmailNotifier({
      transport, from: 'x@y.com',
      templates: { submitted: { to: () => 'a@b.com', subject: () => 'S', body: () => 'B' } },
    })
    await expect(notifier.notify('submitted', { values: {} })).rejects.toThrow(/smtp/)
  })

  it('supports per-phase templates (e.g. step_completed vs submitted)', async () => {
    const transport = mockTransport()
    const notifier = createEmailNotifier({
      transport, from: 'x@y.com',
      templates: {
        step_completed: { to: () => 'ops@acme.com', subject: (c) => `Step ${c.stepId} done`, body: () => 'b' },
      },
    })
    await notifier.notify('step_completed', { values: {}, stepId: 'review' })
    expect(transport.send).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Step review done' }))
  })
})
