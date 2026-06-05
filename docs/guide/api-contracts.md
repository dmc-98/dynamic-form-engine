# API Contracts

API Contracts define how form field values map to backend API requests when a step is submitted. They handle field mapping, context propagation, and endpoint resolution.

## Structure

```ts
interface StepApiContract {
  resourceName: string                      // Logical resource name
  endpoint: string                          // URL template with placeholders
  method: 'PUT' | 'POST'                   // HTTP method
  fieldMapping: Record<string, string>      // form field key → API body key
  responseToContext?: Record<string, string> // response key → context key
  contextToBody?: Record<string, string>    // context key → API body key
}
```

## Field Mapping

Maps form field keys to API request body keys:

```ts
{
  fieldMapping: {
    'first_name': 'firstName',   // form field → API body key
    'last_name': 'lastName',
    'email': 'email',            // same name? still map explicitly
  }
}
```

Given form values `{ first_name: 'Alice', last_name: 'Smith', email: 'alice@co.com' }`, the API body becomes:

```json
{ "firstName": "Alice", "lastName": "Smith", "email": "alice@co.com" }
```

## Endpoint Templates

Endpoints support `{placeholder}` syntax resolved from runtime context:

```ts
{
  endpoint: '/api/employees/{employeeId}',
  method: 'PUT',
}
```

If `context.employeeId = 'emp-42'`, the resolved URL is `/api/employees/emp-42`.

## Context Propagation

The `responseToContext` mapping captures values from API responses and stores them in the runtime context for use by subsequent steps:

```ts
// Step 1: Create employee
{
  resourceName: 'Employee',
  endpoint: '/api/employees',
  method: 'POST',
  fieldMapping: { name: 'name' },
  responseToContext: { id: 'employeeId' },
}
// API returns: { id: 'emp-42', name: 'Alice' }
// Context becomes: { userId: 'u1', employeeId: 'emp-42' }

// Step 2: Create assignment (uses employeeId from step 1)
{
  resourceName: 'Assignment',
  endpoint: '/api/assignments',
  method: 'POST',
  fieldMapping: { role: 'role' },
  contextToBody: { employeeId: 'employeeId' },
}
// API body: { role: 'Engineer', employeeId: 'emp-42' }
```

## Multiple Contracts Per Step

A single step can have multiple API contracts that execute in sequence:

```ts
{
  id: 'step3',
  config: {
    apiContracts: [
      { resourceName: 'Address', ... },
      { resourceName: 'EmergencyContact', ... },
    ],
  },
}
```

Contracts execute in order. If one fails, the pipeline stops and returns the error.

## Custom Execution

By default, the Prisma/Drizzle adapters use an in-memory store for API contract execution. For production, provide your own executor:

```ts
const db = new PrismaDatabaseAdapter(prisma, {
  executeApiContract: async (contract, body) => {
    // Route to your actual database tables
    if (contract.resourceName === 'Employee') {
      return prisma.employee.create({ data: body })
    }
    if (contract.resourceName === 'Assignment') {
      return prisma.assignment.create({ data: body })
    }
    throw new Error(`Unknown resource: ${contract.resourceName}`)
  },
})
```
