# Integrations

DFE takes the open approach to integrations: two primitives — **webhooks** and **API contracts** — let you wire a form to *any* service you control, with no hosted middleman and no per-integration pricing. Every snippet below is type-checked in the test suite (`packages/server/__tests__/integration-recipes.test.ts`), so it can't drift from the real API.

## Webhooks — notify any endpoint on submit

```ts
import { signWebhookPayload } from '@dmc--98/dfe-server'

// On submission, POST the data to your endpoint with an HMAC signature your
// receiver can verify (so it knows the call really came from you):
const payload = JSON.stringify({ event: 'form_completed', data: values })
const signature = signWebhookPayload(payload, process.env.WEBHOOK_SECRET!)

await fetch('https://your-app.example.com/hooks/dfe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-DFE-Signature': signature },
  body: payload,
})
```

Configure webhooks per step via `StepConfig.webhooks` (`WebhookConfig` supports `events`, `secret`, custom `headers`, and `retryCount`). Multiple webhooks per flow and conditional firing are just config.

## Google Sheets / Airtable — append a row on submit

This is an **API contract** — config the server pipeline executes, no new code:

```ts
import type { StepApiContract } from '@dmc--98/dfe-core'

const appendRow: StepApiContract = {
  resourceName: 'SheetRow',
  endpoint: 'https://sheets.example.com/v1/spreadsheets/{sheetId}/rows',
  method: 'POST',
  fieldMapping: { fullName: 'Name', email: 'Email', plan: 'Plan' },
  contextToBody: { sheetId: 'spreadsheetId' },
}
// Attach to a step: step.config.apiContracts = [appendRow]
```

The same shape targets Airtable, a data warehouse, or any REST endpoint — change the URL and field mapping.

## Any service, with data flowing between steps

DFE's contracts can **propagate a response value into the form context** for use by a later step — something a purely declarative SaaS can't express:

```ts
import type { StepApiContract } from '@dmc--98/dfe-core'

// Step 1: create a CRM contact, capture its id into context
const createContact: StepApiContract = {
  resourceName: 'Contact',
  endpoint: 'https://crm.example.com/contacts',
  method: 'POST',
  fieldMapping: { email: 'email', fullName: 'name' },
  responseToContext: { id: 'contactId' },
}

// Step 2: create a deal linked to the contact from step 1
const createDeal: StepApiContract = {
  resourceName: 'Deal',
  endpoint: 'https://crm.example.com/deals',
  method: 'POST',
  fieldMapping: { amount: 'value' },
  contextToBody: { contactId: 'contact' },
}
```

## Payments

Stripe payment steps are documented separately — see [Payments](./payments.md).

## Why this beats a hosted marketplace

- **No vendor in the middle** — your server calls the service directly; no third party sees your data.
- **No per-integration billing** — it's an HTTP call you own.
- **Versioned & testable** — integrations are config in your repo, type-checked and diffable, not clicks in someone's dashboard.

The honest trade-off: there's no point-and-click "5,000 apps" gallery. You wire the endpoints. In exchange you keep full control and incur no platform fees.
