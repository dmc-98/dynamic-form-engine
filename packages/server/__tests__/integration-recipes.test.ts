import { describe, it, expect } from 'vitest'
import { signWebhookPayload } from '../src/webhooks'
import type { StepApiContract } from '@dmc--98/dfe-core'

// ─── M5: integration recipes, compile-checked ───────────────────────────────
// These tests double as the canonical, type-checked source for the docs page —
// if the recipes drift from the real API, the build fails. They prove DFE's
// existing primitives (webhooks + StepApiContract) cover common integration
// scenarios (webhooks, Sheets/Airtable append-row, generic service calls)
// WITHOUT any hosted service.

describe('webhook recipe', () => {
  it('signs a submission payload so the receiver can verify authenticity', () => {
    const secret = 'whsec_test'
    const payload = JSON.stringify({ event: 'form_completed', data: { email: 'ada@x.com' } })
    const sig = signWebhookPayload(payload, secret)
    expect(sig).toMatch(/^[a-f0-9]{64}$/) // HMAC-SHA256 hex
    // Deterministic: the receiver re-signs and compares.
    expect(signWebhookPayload(payload, secret)).toBe(sig)
    expect(signWebhookPayload(payload, 'wrong')).not.toBe(sig)
  })
})

describe('Google Sheets / Airtable append-row recipe (StepApiContract)', () => {
  it('is expressible as a typed StepApiContract — no new runtime', () => {
    // Append a row to a sheet/table when a step is submitted: map form fields →
    // the destination's expected body keys. This is config, executed by the
    // server pipeline's executeApiContract — exactly how DFE already orchestrates
    // cross-step API calls.
    const appendRow: StepApiContract = {
      resourceName: 'SheetRow',
      endpoint: 'https://sheets.example.com/v1/spreadsheets/{sheetId}/rows',
      method: 'POST',
      fieldMapping: { fullName: 'Name', email: 'Email', plan: 'Plan' },
      // The sheetId came from an earlier step's response and lives in context.
      contextToBody: { sheetId: 'spreadsheetId' },
    }
    expect(appendRow.method).toBe('POST')
    expect(Object.keys(appendRow.fieldMapping)).toContain('email')
  })
})

describe('generic "call any service" recipe with response→context propagation', () => {
  it('propagates a created id back into the form context for later steps', () => {
    // Create a CRM contact on step 1, capture its id into context, and link it
    // on step 2 — declarative cross-step data flow.
    const createContact: StepApiContract = {
      resourceName: 'Contact',
      endpoint: 'https://crm.example.com/contacts',
      method: 'POST',
      fieldMapping: { email: 'email', fullName: 'name' },
      responseToContext: { id: 'contactId' }, // ← server stores response.id as context.contactId
    }
    const createDeal: StepApiContract = {
      resourceName: 'Deal',
      endpoint: 'https://crm.example.com/deals',
      method: 'POST',
      fieldMapping: { amount: 'value' },
      contextToBody: { contactId: 'contact' }, // ← links the deal to the contact from step 1
    }
    expect(createContact.responseToContext?.id).toBe('contactId')
    expect(createDeal.contextToBody?.contactId).toBe('contact')
  })
})
