# Payments

DFE supports payments as a **server-side payment step** — provider-agnostic, you bring your own Stripe (or other) keys. DFE hosts nothing and ships no payment SDK, so card data and secret keys never touch DFE's code. (Why a step and not a field: [ADR 0001](../adr/0001-payment-step-vs-field.md).)

## Server: wire your provider

Implement the small `PaymentClient` interface over your provider's SDK and hand it to the handler:

```ts
import Stripe from 'stripe'
import { createPaymentStepHandler, type PaymentIntentResult } from '@dmc--98/dfe-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const toResult = (pi: Stripe.PaymentIntent): PaymentIntentResult => ({
  id: pi.id, clientSecret: pi.client_secret!, amount: pi.amount, currency: pi.currency, status: pi.status,
})

const payments = createPaymentStepHandler({
  client: {
    createPaymentIntent: (p) => stripe.paymentIntents.create(p).then(toResult),
    retrievePaymentIntent: (id) => stripe.paymentIntents.retrieve(id).then(toResult),
  },
})
```

## Create the intent (when the user reaches the payment step)

```ts
// amount is in the smallest currency unit (e.g. cents). Compute it server-side.
const intent = await payments.createIntent({ amount: 5000, currency: 'usd', metadata: { submissionId } })
res.json({ clientSecret: intent.clientSecret })
```

The frontend uses `clientSecret` with Stripe Elements / Checkout — DFE does not render card fields.

## Verify before completing the step (never trust the client)

```ts
const result = await payments.verify(paymentIntentId, { expectAmount: 5000, expectCurrency: 'usd' })
if (!result.paid) {
  return res.status(402).json({ error: result.reason }) // amount mismatch, not succeeded, or provider error
}
// safe to mark the step complete and persist
```

`verify` re-fetches the intent from the provider, requires `status === 'succeeded'`, and (optionally) enforces the expected amount/currency to defeat client tampering. Provider errors come back as a clean `{ paid: false, reason }` rather than a throw.

## One-time vs. subscription

The same handler covers both — for subscriptions, create the subscription/intent in your `createPaymentIntent` wrapper and verify the resulting intent. The pattern is identical; only your provider call changes.

## Honest trade-off

There's no one-click hosted payment node like a SaaS offers — you bring keys and wire the client. In return: no platform fees, no third party in your payment path, and PCI scope stays with your payment provider, not DFE.
