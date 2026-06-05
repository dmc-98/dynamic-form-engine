# Integrate DFE in 5 Minutes

This guide takes you from nothing to a working, validated, multi-step form — frontend, server, and database — by copy-pasting. Every snippet is real; nothing is pseudo-code.

If you only want the frontend, stop after Step 3.

## Step 0 — Install (30 seconds)

```bash
# Frontend
pnpm add @dmc--98/dfe-core @dmc--98/dfe-react

# Server + persistence (optional — only if you want a backend)
pnpm add @dmc--98/dfe-server @dmc--98/dfe-express @dmc--98/dfe-prisma
```

## Step 1 — Define the form as config (1 minute)

A form is plain data. Here's a two-step signup that reveals company fields only for business accounts.

```ts
// form.ts
import type { FormField, FormStep } from '@dmc--98/dfe-core'

export const steps: FormStep[] = [
  { id: 'account', versionId: 'v1', title: 'Account', order: 1 },
  { id: 'profile', versionId: 'v1', title: 'Profile', order: 2 },
]

export const fields: FormField[] = [
  { id: 'name', versionId: 'v1', stepId: 'account', key: 'fullName', label: 'Full Name',
    type: 'SHORT_TEXT', required: true, order: 1, config: {} },
  { id: 'email', versionId: 'v1', stepId: 'account', key: 'email', label: 'Email',
    type: 'EMAIL', required: true, order: 2, config: {} },
  { id: 'type', versionId: 'v1', stepId: 'account', key: 'accountType', label: 'Account Type',
    type: 'SELECT', required: true, order: 3,
    config: { mode: 'static', options: [
      { label: 'Personal', value: 'personal' }, { label: 'Business', value: 'business' },
    ] } },
  { id: 'company', versionId: 'v1', stepId: 'profile', key: 'companyName', label: 'Company Name',
    type: 'SHORT_TEXT', required: true, order: 1, config: {},
    conditions: { action: 'SHOW', operator: 'and',
      rules: [{ fieldKey: 'accountType', operator: 'eq', value: 'business' }] } },
]
```

> Don't want to hand-write this? Run `npx dfe init --template onboarding` to scaffold a starter, or use `getTemplate('user-onboarding')` from `@dmc--98/dfe-core`.

## Step 2 — Render it in React (2 minutes)

```tsx
// SignupForm.tsx
import { useFormEngine, useFormStepper } from '@dmc--98/dfe-react'
import { fields, steps } from './form'

export function SignupForm() {
  const engine = useFormEngine({ fields })
  const stepper = useFormStepper({ steps, engine })
  const step = stepper.getCurrentStep()

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h2>{step?.step.title}</h2>

      {engine.getVisibleFields()
        .filter(f => f.stepId === step?.step.id)
        .map(f => (
          <label key={f.key} style={{ display: 'block', margin: '8px 0' }}>
            {f.label}{f.required ? ' *' : ''}
            <input
              value={String(engine.getValues()[f.key] ?? '')}
              onChange={(e) => engine.setFieldValue(f.key, e.target.value)}
            />
            {engine.getFieldState(f.key)?.validationError && (
              <span style={{ color: 'crimson' }}>
                {engine.getFieldState(f.key)?.validationError}
              </span>
            )}
          </label>
        ))}

      {stepper.canGoBack() && <button onClick={() => stepper.goBack()}>Back</button>}
      {!stepper.isLastStep()
        ? <button onClick={() => stepper.goNext()}>Next</button>
        : <button onClick={() => console.log(engine.collectSubmissionValues())}>Submit</button>}
    </form>
  )
}
```

That's a working multi-step form with conditional fields and validation. The `companyName` field appears only when `accountType` is `business` — no `if` statements in your component; the engine handles it.

## Step 3 — Validate before submit

```ts
const { success, errors } = engine.validate()
if (!success) {
  console.log(errors) // { fieldKey: 'message', ... } — generated from your config
  return
}
const values = engine.collectSubmissionValues() // excludes hidden fields automatically
```

The Zod schema is generated from your field config, so client and server validate against the same contract — they can't drift.

## Step 4 — Add a backend (optional, ~2 minutes)

```ts
// server.ts
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { PrismaDatabaseAdapter } from '@dmc--98/dfe-prisma'
import { createDfeRouter } from '@dmc--98/dfe-express'

const app = express()
app.use(express.json())

const db = new PrismaDatabaseAdapter(new PrismaClient())
app.use(createDfeRouter({ db }))   // mounts REST endpoints for forms + submissions

app.listen(3001, () => console.log('DFE API on :3001'))
```

Generate the database schema with the CLI:

```bash
npx dfe migrate generate --adapter prisma
npx prisma migrate dev --name add_dfe_tables
```

The server re-validates every submission against the same generated schema before persisting, so a tampered client can't write invalid data.

## What you just got

In five minutes: a config-driven, multi-step form with conditional logic, generated validation, a typed submission payload, and an optional backend that re-validates and persists — with one form definition shared across all of it.

## Next steps

- Swap Prisma for Drizzle: change one adapter import (`@dmc--98/dfe-drizzle`).
- Deploy serverless: use `@dmc--98/dfe-hono` on Cloudflare Workers / Vercel.
- Try it live in the [Playground](/packages/playground), or the in-browser [StackBlitz demo](https://stackblitz.com/github/dmc-98/dynamic-form-engine/tree/main/examples/stackblitz).
- Build forms visually with [`@dmc--98/dfe-builder`](https://github.com/dmc-98/dynamic-form-engine/tree/main/packages/builder).
