// ─── Payment Step (provider-agnostic) ────────────────────────────────────────
// DFE does not host payments and ships no payment SDK. This helper turns a
// "payment step" into a server-side PaymentIntent flow through a client YOU
// inject — in production a thin wrapper over the real Stripe SDK, in tests a
// mock. Secret keys stay on your server; nothing is hosted by DFE.
//
// See docs/guide/payments.md and docs/adr/0001-payment-step-vs-field.md.

export interface PaymentIntentResult {
  id: string
  clientSecret: string
  amount: number
  currency: string
  status: string
}

/** The minimal payment-provider surface DFE needs. Wrap your provider's SDK. */
export interface PaymentClient {
  createPaymentIntent(params: {
    amount: number
    currency: string
    metadata?: Record<string, string>
  }): Promise<PaymentIntentResult>
  retrievePaymentIntent(id: string): Promise<PaymentIntentResult>
}

export interface CreateIntentInput {
  /** Smallest currency unit (e.g. cents). Must be > 0. */
  amount: number
  currency?: string
  metadata?: Record<string, string>
}

export interface VerifyOptions {
  /** If set, the retrieved intent's amount must match exactly. */
  expectAmount?: number
  /** If set, the retrieved intent's currency must match. */
  expectCurrency?: string
}

export interface VerifyResult {
  paid: boolean
  status: string
  /** Why it isn't paid (mismatch, provider error, or non-succeeded status). */
  reason?: string
}

export interface PaymentStepHandler {
  createIntent(input: CreateIntentInput): Promise<PaymentIntentResult>
  verify(paymentIntentId: string, options?: VerifyOptions): Promise<VerifyResult>
}

/**
 * Create a payment-step handler bound to an injected provider client.
 *
 * @example
 * ```ts
 * // production: wrap Stripe
 * import Stripe from 'stripe'
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
 * const handler = createPaymentStepHandler({
 *   client: {
 *     createPaymentIntent: (p) => stripe.paymentIntents.create(p).then(toResult),
 *     retrievePaymentIntent: (id) => stripe.paymentIntents.retrieve(id).then(toResult),
 *   },
 * })
 * ```
 */
export function createPaymentStepHandler(opts: { client: PaymentClient }): PaymentStepHandler {
  const { client } = opts

  return {
    async createIntent(input) {
      if (!(input.amount > 0) || !Number.isInteger(input.amount)) {
        throw new Error('Payment amount must be a positive integer (smallest currency unit).')
      }
      return client.createPaymentIntent({
        amount: input.amount,
        currency: input.currency ?? 'usd',
        metadata: input.metadata,
      })
    },

    async verify(paymentIntentId, options = {}) {
      let intent: PaymentIntentResult
      try {
        intent = await client.retrievePaymentIntent(paymentIntentId)
      } catch (e) {
        return { paid: false, status: 'error', reason: `Provider error: ${e instanceof Error ? e.message : String(e)}` }
      }

      if (intent.status !== 'succeeded') {
        return { paid: false, status: intent.status, reason: `Intent status is "${intent.status}"` }
      }
      if (options.expectAmount !== undefined && intent.amount !== options.expectAmount) {
        return { paid: false, status: intent.status, reason: `Amount mismatch: expected ${options.expectAmount}, got ${intent.amount}` }
      }
      if (options.expectCurrency !== undefined && intent.currency.toLowerCase() !== options.expectCurrency.toLowerCase()) {
        return { paid: false, status: intent.status, reason: `Currency mismatch: expected ${options.expectCurrency}, got ${intent.currency}` }
      }
      return { paid: true, status: intent.status }
    },
  }
}
