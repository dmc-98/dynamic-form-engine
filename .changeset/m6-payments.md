---
"@dmc--98/dfe-server": minor
---

Add `createPaymentStepHandler` — a provider-agnostic, server-side payment-step helper (bring your own Stripe). It creates PaymentIntents through an injected `PaymentClient`, verifies them server-side (requires `succeeded`, optional amount/currency match to defeat tampering), and surfaces provider errors as clean failures. DFE hosts nothing and ships no payment SDK; secrets and card data stay with your provider. See ADR 0001 for the payment-step-vs-field decision.
