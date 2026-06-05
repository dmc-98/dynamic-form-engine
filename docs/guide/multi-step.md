# Multi-Step Forms

DFE supports multi-step form workflows with step navigation, skip conditions, per-step validation, and API contracts for backend persistence.

## Defining Steps

```ts
import type { FormStep, FormField } from '@dmc--98/dfe-core'

const steps: FormStep[] = [
  {
    id: 'personal', versionId: 'v1',
    title: 'Personal Information', order: 1,
    config: {
      apiContracts: [{
        resourceName: 'Employee',
        endpoint: '/api/employees',
        method: 'POST',
        fieldMapping: { first_name: 'firstName', email: 'email' },
        responseToContext: { id: 'employeeId' },
      }],
    },
  },
  {
    id: 'job', versionId: 'v1',
    title: 'Job Details', order: 2,
    config: {
      apiContracts: [{
        resourceName: 'JobAssignment',
        endpoint: '/api/assignments',
        method: 'POST',
        fieldMapping: { role: 'role', start_date: 'startDate' },
        contextToBody: { employeeId: 'employeeId' }, // FK from step 1
      }],
    },
  },
  {
    id: 'review', versionId: 'v1',
    title: 'Review & Submit', order: 3,
    config: { review: { editMode: 'navigate' } },
  },
]
```

## Using the Stepper

### Plain TypeScript

```ts
import { createFormEngine, createFormStepper } from '@dmc--98/dfe-core'

const engine = createFormEngine(fields)
const stepper = createFormStepper(steps, engine)

console.log(stepper.getCurrentStep()?.step.title) // "Personal Information"
console.log(stepper.getProgress()) // { current: 1, total: 3, percent: 33 }

stepper.goNext()
console.log(stepper.getCurrentStep()?.step.title) // "Job Details"

stepper.goBack()
stepper.jumpTo(2) // Jump to "Review & Submit"
```

### React

```tsx
import { useFormEngine, useFormStepper } from '@dmc--98/dfe-react'

function MultiStepForm({ fields, steps }) {
  const engine = useFormEngine({ fields })
  const stepper = useFormStepper({ steps, engine: engine.engine })

  return (
    <div>
      <h2>{stepper.currentStep?.step.title}</h2>
      <p>Step {stepper.progress.current} of {stepper.progress.total}</p>

      {/* Render fields for current step */}
      {engine.visibleFields
        .filter(f => f.stepId === stepper.currentStep?.step.id)
        .map(field => (
          <input
            key={field.key}
            value={(engine.values[field.key] as string) ?? ''}
            onChange={e => engine.setFieldValue(field.key, e.target.value)}
          />
        ))}

      <div>
        {stepper.canGoBack && <button onClick={stepper.goBack}>Back</button>}
        {stepper.isLastStep
          ? <button onClick={handleSubmit}>Submit</button>
          : <button onClick={stepper.goNext}>Next</button>
        }
      </div>
    </div>
  )
}
```

## Skip Conditions

Steps can be conditionally skipped:

```ts
{
  id: 'equipment',
  title: 'Equipment Request',
  order: 3,
  conditions: {
    action: 'SKIP',
    operator: 'and',
    rules: [
      { fieldKey: 'employment_type', operator: 'eq', value: 'remote' },
    ],
  },
}
```

Remote employees skip the equipment step entirely. `stepper.getVisibleSteps()` automatically filters them out.

## API Contracts

Each step can define API contracts that run when the step is submitted:

```ts
interface StepApiContract {
  resourceName: string                          // e.g., "Employee"
  endpoint: string                              // e.g., "/api/employees/{employeeId}"
  method: 'PUT' | 'POST'
  fieldMapping: Record<string, string>          // form key → API body key
  responseToContext?: Record<string, string>     // API response → runtime context
  contextToBody?: Record<string, string>         // runtime context → API body
}
```

### Context Propagation

The `responseToContext` / `contextToBody` mechanism lets data flow across steps:

```
Step 1: POST /api/employees
  fieldMapping: { first_name: "firstName" }
  responseToContext: { id: "employeeId" }    ← captures generated ID
  Response: { id: "emp-42", firstName: "Alice" }
  Context: { employeeId: "emp-42" }

Step 2: POST /api/assignments
  fieldMapping: { role: "role" }
  contextToBody: { employeeId: "employeeId" }  ← injects as FK
  Body: { role: "Engineer", employeeId: "emp-42" }
```

This is how DFE handles relational data across multi-step forms without client-side workarounds.
