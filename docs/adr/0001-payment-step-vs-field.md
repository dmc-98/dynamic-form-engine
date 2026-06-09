# ADR 0001 — Payments: a payment *step*, not a payment *field*

- Status: Accepted
- Date: 2026-06

## Context

DFE needs payment support that fits its OSS, self-hosted, headless model. Two designs were considered:

1. **Payment field** — a `PAYMENT` field type rendered inline like any other input.
2. **Payment step** — a dedicated step whose submission creates/confirms a PaymentIntent server-side.

## Decision

Implement payments as a **server-side payment *step***, via a provider-agnostic `createPaymentStepHandler` (`@dmc--98/dfe-server`) into which the consumer injects a payment client (a thin wrapper over the real Stripe SDK). DFE ships no payment SDK and hosts nothing.

## Why not a payment field

- **Secrets & trust boundary.** Charging money requires a secret key and server-side confirmation. A "field" lives in the headless client layer where DFE deliberately has no server trust. Forcing payment logic into a field would either leak secrets or smuggle a server dependency into the core.
- **Validation semantics.** A field's value is validated by a Zod schema; "did this charge actually succeed?" is not a schema check — it's a server round-trip to the provider. That's step-submission behavior, not field validation.
- **Amount integrity.** The charged amount must be computed and verified server-side (DFE already verifies the intent's amount/currency on completion). A client field can't be the source of truth for money.
- **Headless promise.** Keeping payments as an injected server handler preserves "DFE owns no runtime services and no UI."

## Consequences

- Consumers wire Stripe (or another provider) themselves: implement `PaymentClient` (`createPaymentIntent`, `retrievePaymentIntent`), pass it in, and DFE handles intent creation, server-side verification (status + amount/currency match), and clean error surfacing.
- The frontend uses the returned `clientSecret` with the provider's own Elements/Checkout — DFE doesn't render card inputs.
- No PCI surface is added to DFE itself; the provider handles card data.
- Trade-off: not a one-click hosted node — you bring keys and wire the client. In exchange, no platform fees and no third party in your payment path.

## Future

If a UI convenience is wanted later, a thin `PAYMENT` *presentation* component (in a UI-kit package) could wrap the provider's Elements and call this same server handler — without moving any trust or secrets into core.
