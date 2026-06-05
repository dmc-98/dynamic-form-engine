# DFE Integration (copy-paste)

The minimal wiring after scaffolding. Full guide: `docs/guide/five-minute-integration.md` in the repo.

## React (frontend)

```tsx
import { useFormEngine, useFormStepper } from '@dmc--98/dfe-react'
import { fields, steps } from './forms/onboarding'

export function MyForm() {
  const engine = useFormEngine({ fields })
  const stepper = useFormStepper({ steps, engine })
  const step = stepper.getCurrentStep()

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h2>{step?.step.title}</h2>
      {engine.getVisibleFields()
        .filter(f => f.stepId === step?.step.id)
        .map(f => (
          <label key={f.key}>
            {f.label}{f.required ? ' *' : ''}
            <input
              value={String(engine.getValues()[f.key] ?? '')}
              onChange={(e) => engine.setFieldValue(f.key, e.target.value)}
            />
            {engine.getFieldState(f.key)?.validationError && (
              <span>{engine.getFieldState(f.key)?.validationError}</span>
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

## Server (Express + Prisma)

```ts
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { PrismaDatabaseAdapter } from '@dmc--98/dfe-prisma'
import { createDfeRouter } from '@dmc--98/dfe-express'

const app = express()
app.use(express.json({ limit: '1mb' }))

const db = new PrismaDatabaseAdapter(new PrismaClient())
app.use(createDfeRouter({
  db,
  getUserId: (req) => req.user?.id ?? null,        // wire to your auth
  requireTenantMatch: true,                        // multi-tenant: deny-by-default
}))

app.listen(3001)
```

The server re-validates every submission against the stored form config — never trust client-side validation alone, and keep both sides on the same form definition.
