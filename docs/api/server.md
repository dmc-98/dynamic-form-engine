# Server API Reference

## Step Submission

### `executeStepSubmit(options)`

Execute the full step submission pipeline.

```ts
import { executeStepSubmit } from '@dmc--98/dfe-server'

const result = await executeStepSubmit({
  form: FormVersionRecord,      // full form definition
  stepId: string,               // step being submitted
  payload: StepSubmitPayload,   // { values, context }
  db: DatabaseAdapter,          // your adapter
  submissionId: string,         // submission ID
})
```

**Returns:** `StepSubmitResponse`
```ts
interface StepSubmitResponse {
  success: boolean
  context: FormRuntimeContext   // updated context
  errors?: Record<string, string>
}
```

**Pipeline:**
1. Find the step definition
2. Validate field values
3. Execute API contracts in order
4. Propagate context from responses
5. Update submission record

### `completeSubmission(db, submissionId, context)`

Mark a submission as `COMPLETED`.

---

## Utility Functions

### `resolveEndpoint(template, context)`

Replace `{placeholders}` in URL templates with context values.

```ts
resolveEndpoint('/api/employees/{employeeId}', { employeeId: '123' })
// → '/api/employees/123'
```

Throws if a placeholder value is missing.

### `buildContractBody(contract, values, context)`

Build the API request body from field mapping and context:

```ts
const body = buildContractBody(contract, formValues, runtimeContext)
```

### `propagateContext(contract, response, context)`

Extract values from an API response into the runtime context:

```ts
const newContext = propagateContext(contract, apiResponse, currentContext)
```

---

## DatabaseAdapter Interface

```ts
interface DatabaseAdapter {
  getFormBySlug(slug: string): Promise<FormVersionRecord | null>
  getFormById(id: string): Promise<FormVersionRecord | null>
  listForms(params?: PaginationParams): Promise<PaginatedResult<FormDefinitionRecord>>
  createSubmission(data: {...}): Promise<FormSubmissionRecord>
  getSubmission(id: string): Promise<FormSubmissionRecord | null>
  updateSubmission(id: string, data: {...}): Promise<FormSubmissionRecord>
  executeApiContract(contract: StepApiContract, body: Record<string, unknown>): Promise<Record<string, unknown>>
  fetchFieldOptions(fieldId: string, params: PaginationParams): Promise<PaginatedResult<SelectOption>>
}
```

## PaginationParams

```ts
interface PaginationParams {
  cursor?: string | null
  pageSize: number
  search?: string
  filters?: Record<string, unknown>
}
```

## PaginatedResult

```ts
interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
  total?: number
}
```
