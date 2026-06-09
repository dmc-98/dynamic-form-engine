import { describe, it, expect, vi } from 'vitest'
import { createPaymentStepHandler, type PaymentClient } from '../src/payment'

// ─── M6: Stripe-style payment step (provider-agnostic, you bring keys) ───────
// DFE doesn't host payments. It provides a server-side helper that turns a
// payment step into a PaymentIntent via a client YOU inject (a thin wrapper over
// the real Stripe SDK in production, a mock here). This keeps secret keys on
// your server and avoids any hosted billing dependency.

function mockClient(overrides: Partial<PaymentClient> = {}): PaymentClient {
  return {
    createPaymentIntent: vi.fn(async ({ amount, currency }) => ({
      id: 'pi_123', clientSecret: 'pi_123_secret', amount, currency, status: 'requires_payment_method',
    })),
    retrievePaymentIntent: vi.fn(async (id) => ({
      id, clientSecret: `${id}_secret`, amount: 5000, currency: 'usd', status: 'succeeded',
    })),
    ...overrides,
  }
}

describe('createPaymentStepHandler — intent creation', () => {
  it('creates a PaymentIntent and returns the client secret for the frontend', async () => {
    const client = mockClient()
    const handler = createPaymentStepHandler({ client })
    const res = await handler.createIntent({ amount: 5000, currency: 'usd', metadata: { submissionId: 's1' } })
    expect(res.clientSecret).toBe('pi_123_secret')
    expect(client.createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({ amount: 5000, currency: 'usd' }))
  })

  it('rejects a non-positive amount before calling the provider', async () => {
    const client = mockClient()
    const handler = createPaymentStepHandler({ client })
    await expect(handler.createIntent({ amount: 0, currency: 'usd' })).rejects.toThrow(/amount/i)
    expect(client.createPaymentIntent).not.toHaveBeenCalled()
  })

  it('defaults currency to usd when omitted', async () => {
    const client = mockClient()
    const handler = createPaymentStepHandler({ client })
    await handler.createIntent({ amount: 1000 })
    expect(client.createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({ currency: 'usd' }))
  })
})

describe('createPaymentStepHandler — verifying the result before completing the step', () => {
  it('confirms a succeeded intent (server-side, never trusting the client)', async () => {
    const handler = createPaymentStepHandler({ client: mockClient() })
    const result = await handler.verify('pi_123')
    expect(result.paid).toBe(true)
    expect(result.status).toBe('succeeded')
  })

  it('reports unpaid for a non-succeeded intent', async () => {
    const client = mockClient({
      retrievePaymentIntent: vi.fn(async (id) => ({ id, clientSecret: 's', amount: 5000, currency: 'usd', status: 'requires_payment_method' })),
    })
    const handler = createPaymentStepHandler({ client })
    const result = await handler.verify('pi_x')
    expect(result.paid).toBe(false)
  })

  it('optionally enforces the expected amount/currency to prevent tampering', async () => {
    const client = mockClient({
      retrievePaymentIntent: vi.fn(async (id) => ({ id, clientSecret: 's', amount: 100, currency: 'usd', status: 'succeeded' })),
    })
    const handler = createPaymentStepHandler({ client })
    const result = await handler.verify('pi_x', { expectAmount: 5000 })
    expect(result.paid).toBe(false)
    expect(result.reason).toMatch(/amount/i)
  })

  it('surfaces provider errors as a clean failure, not a throw', async () => {
    const client = mockClient({
      retrievePaymentIntent: vi.fn(async () => { throw new Error('network') }),
    })
    const handler = createPaymentStepHandler({ client })
    const result = await handler.verify('pi_x')
    expect(result.paid).toBe(false)
    expect(result.reason).toBeTruthy()
  })
})
