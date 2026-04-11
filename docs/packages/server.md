# @dmc-98/dfe-server

Framework-agnostic backend logic: adapter interfaces, the step submission pipeline, analytics, collaboration contracts, and compliance-supporting controls.

## Install

```bash
npm install @dmc-98/dfe-server @dmc-98/dfe-core zod
```

## DatabaseAdapter Interface

The core abstraction for connecting DFE to your database:

```ts
interface DatabaseAdapter {
  // Form definitions
  getFormBySlug(slug: string): Promise<FormVersionRecord | null>
  getFormById(id: string): Promise<FormVersionRecord | null>
  listForms(params?: PaginationParams): Promise<PaginatedResult<FormDefinitionRecord>>

  // Submissions
  createSubmission(data: {...}): Promise<FormSubmissionRecord>
  getSubmission(id: string): Promise<FormSubmissionRecord | null>
  updateSubmission(id: string, data: {...}): Promise<FormSubmissionRecord>

  // Dynamic resources (API contract execution)
  executeApiContract(contract: StepApiContract, body: Record<string, unknown>): Promise<Record<string, unknown>>

  // Dynamic options
  fetchFieldOptions(fieldId: string, params: PaginationParams): Promise<PaginatedResult<SelectOption>>
}
```

Implement this interface for your ORM, or use the built-in adapters:
- [`@dmc-98/dfe-prisma`](/packages/prisma)
- [`@dmc-98/dfe-drizzle`](/packages/drizzle)

## Step Submission Pipeline

```ts
import { executeStepSubmit, completeSubmission } from '@dmc-98/dfe-server'

// Submit a step
const result = await executeStepSubmit({
  form,           // FormVersionRecord
  stepId,         // which step
  payload,        // { values, context }
  db,             // DatabaseAdapter
  submissionId,   // submission ID
})

if (result.success) {
  // result.context has updated runtime context
}

// Complete the form
await completeSubmission(db, submissionId, context)
```

### Pipeline Steps

1. Find the step definition
2. Validate field values against Zod schema
3. Execute each API contract in order
4. Propagate response values into runtime context
5. Update the submission record

## Utility Functions

| Function | Description |
|----------|-------------|
| `resolveEndpoint(template, context)` | Replace `{placeholders}` in URL templates |
| `buildContractBody(contract, values, context)` | Build API request body from field mapping |
| `propagateContext(contract, response, context)` | Extract response values into context |

## HIPAA-Supporting Controls

`@dmc-98/dfe-server` now also exposes:

- protected-field policy derivation from field config metadata
- encrypted-at-rest submission vault helpers via `createAesGcmFieldProtector()` and `storeProtectedValuesInContext()`
- audit log interfaces plus `createInMemoryAuditLogStore()` for local and example use
- analytics redaction helpers via `sanitizeAnalyticsEventForCompliance()` and `sanitizeAnalyticsEventsForCompliance()`

Use these as compliance-supporting building blocks. They help you implement stricter handling for sensitive fields, but they do not by themselves certify your deployment as HIPAA compliant.
