# Validation

DFE generates [Zod](https://zod.dev) schemas dynamically from your field definitions. Validation runs against visible fields only — hidden fields are automatically excluded.

## How It Works

1. Engine iterates over visible fields (excluding layout types)
2. Each field type maps to a Zod schema builder
3. Required fields get strict validation; optional fields accept empty/null
4. Schema is assembled into a `z.object()` and parsed against current values

```ts
const engine = createFormEngine(fields, data)
const { success, errors } = engine.validate()

if (!success) {
  // errors: { fieldKey: "error message", ... }
  console.log(errors)
}
```

## Per-Step Validation

For multi-step forms, validate only the current step:

```ts
const stepResult = engine.validateStep('step1')
if (stepResult.success) {
  stepper.goNext()
}
```

## Built-in Validation Rules

| Field Type | Validation |
|-----------|-----------|
| `SHORT_TEXT` | `z.string()`, `.min(1)` if required, `.min(N)` / `.max(N)` from config |
| `EMAIL` | `z.string().email()` |
| `PHONE` | Regex: `^\+?[\d\s\-().]{7,}$` |
| `URL` | `z.string().url()` |
| `NUMBER` | `z.number()`, `.min()` / `.max()` from config, `.int()` if integer format |
| `DATE` | `z.string().min(1)` |
| `SELECT` | `z.enum()` from static options, or `z.string().min(1)` for dynamic |
| `CHECKBOX` | `z.boolean()` |
| `FILE_UPLOAD` | Array of `{ name, size, type, url }` with size/type validation |

## Custom Field Type Validation

Register your own Zod schema builder for custom types:

```ts
import { registerSchemaBuilder } from '@dmc--98/dfe-core'
import { z } from 'zod'

// Color picker that validates hex format
registerSchemaBuilder('COLOR_PICKER', (field) =>
  z.string().regex(/^#[0-9a-f]{6}$/i, 'Must be a hex color like #ff0000')
)

// JSON editor
registerSchemaBuilder('JSON_EDITOR', (field) =>
  z.string().refine((val) => {
    try { JSON.parse(val); return true }
    catch { return false }
  }, 'Must be valid JSON')
)
```

## Server-Side Validation

The step submission pipeline also validates on the backend:

```ts
import { executeStepSubmit } from '@dmc--98/dfe-server'

const result = await executeStepSubmit({
  form, stepId, payload, db, submissionId,
})

if (!result.success) {
  // result.errors contains per-field validation errors
  res.status(422).json(result)
}
```

This ensures validation happens both client-side (for UX) and server-side (for security).
