import type {
  StepApiContract, FormRuntimeContext, FormValues,
  StepSubmitPayload, StepSubmitResponse,
} from '@dmc--98/dfe-core'
import { generateZodSchema } from '@dmc--98/dfe-core'
import type { DatabaseAdapter, FormVersionRecord } from './adapters'

// ─── Endpoint Template Resolution ───────────────────────────────────────────

/**
 * Resolve placeholders in an endpoint template using context values.
 * e.g., "/api/employees/{employeeId}" + { employeeId: "123" } → "/api/employees/123"
 */
export function resolveEndpoint(template: string, context: FormRuntimeContext): string {
  return template.replace(/{(\w+)}/g, (_, key) => {
    const val = context[key]
    if (val === undefined || val === null) {
      throw new Error(`Missing context value for endpoint placeholder: {${key}}`)
    }
    return String(val)
  })
}

// ─── Body Builder ───────────────────────────────────────────────────────────

/**
 * Build the request body for an API contract.
 * 1. Maps form field values → API body keys via fieldMapping
 * 2. Injects context values via contextToBody
 */
export function buildContractBody(
  contract: StepApiContract,
  values: FormValues,
  context: FormRuntimeContext,
): Record<string, unknown> {
  const body: Record<string, unknown> = {}

  // Map form field values to API body keys
  for (const [fieldKey, bodyKey] of Object.entries(contract.fieldMapping)) {
    if (values[fieldKey] !== undefined) {
      body[bodyKey] = values[fieldKey]
    }
  }

  // Inject context values into the body (e.g., foreign keys)
  if (contract.contextToBody) {
    for (const [contextKey, bodyKey] of Object.entries(contract.contextToBody)) {
      if (context[contextKey] !== undefined) {
        body[bodyKey] = context[contextKey]
      }
    }
  }

  return body
}

// ─── Context Propagation ────────────────────────────────────────────────────

/**
 * Extract values from an API response and merge them into the runtime context.
 * Used for propagating generated IDs across steps (e.g., employeeId from step 1 → step 2).
 */
export function propagateContext(
  contract: StepApiContract,
  response: Record<string, unknown>,
  context: FormRuntimeContext,
): FormRuntimeContext {
  const updated = { ...context }

  if (contract.responseToContext) {
    for (const [responseKey, contextKey] of Object.entries(contract.responseToContext)) {
      if (response[responseKey] !== undefined) {
        updated[contextKey] = response[responseKey]
      }
    }
  }

  return updated
}

// ─── Step Submission Pipeline ───────────────────────────────────────────────

export interface StepSubmitOptions {
  /** The form definition (for validation schema generation) */
  form: FormVersionRecord
  /** The step ID being submitted */
  stepId: string
  /** Submission payload from the client */
  payload: StepSubmitPayload
  /** Database adapter for executing API contracts */
  db: DatabaseAdapter
  /** Submission ID (for updating progress) */
  submissionId: string
  /**
   * Optional list of field keys that are currently visible on the client.
   * When provided, only these fields are validated (hidden fields are skipped).
   * This prevents requiring values for conditionally hidden fields.
   */
  visibleFieldKeys?: string[]
}

/**
 * Execute the step submission pipeline:
 * 1. Find the step definition
 * 2. Validate field values against Zod schema
 * 3. Execute each API contract in order
 * 4. Propagate response values into the context
 * 5. Update the submission record
 *
 * @returns StepSubmitResponse with updated context (or errors)
 */
export async function executeStepSubmit(
  opts: StepSubmitOptions,
): Promise<StepSubmitResponse> {
  const { form, stepId, payload, db, submissionId, visibleFieldKeys } = opts
  const { values, context } = payload

  // 1. Find the step definition
  const step = form.steps.find(s => s.id === stepId)
  if (!step) {
    return {
      success: false,
      context,
      errors: { _step: `Step "${stepId}" not found` },
    }
  }

  // 2. Get fields for this step and validate
  // If visibleFieldKeys is provided, only validate visible fields
  // to avoid requiring values for conditionally hidden fields.
  let stepFields = form.fields.filter(f => f.stepId === stepId)
  if (visibleFieldKeys) {
    stepFields = stepFields.filter(f => visibleFieldKeys.includes(f.key))
  }
  if (stepFields.length > 0) {
    const schema = generateZodSchema(stepFields)
    const stepValues: FormValues = {}
    for (const f of stepFields) {
      stepValues[f.key] = values[f.key]
    }

    const validation = schema.safeParse(stepValues)
    if (!validation.success) {
      const errors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        errors[issue.path.join('.')] = issue.message
      }
      return { success: false, context, errors }
    }
  }

  // 3. Execute API contracts in order
  let updatedContext = { ...context }
  const contracts = step.config?.apiContracts ?? []

  for (const contract of contracts) {
    try {
      const body = buildContractBody(contract, values, updatedContext)
      const response = await db.executeApiContract(contract, body)
      updatedContext = propagateContext(contract, response, updatedContext)
    } catch (err) {
      return {
        success: false,
        context: updatedContext,
        errors: {
          _api: `Failed to execute contract for ${contract.resourceName}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
      }
    }
  }

  // 4. Update submission record
  try {
    await db.updateSubmission(submissionId, {
      currentStepId: stepId,
      context: updatedContext,
    })
  } catch (err) {
    // Log the error but don't fail the step — context was already propagated.
    // Callers should monitor for these warnings in production.
    console.warn(
      `[DFE] Failed to update submission ${submissionId} after step ${stepId}:`,
      err instanceof Error ? err.message : String(err),
    )
  }

  return { success: true, context: updatedContext }
}

// ─── Complete Submission ────────────────────────────────────────────────────

/**
 * Mark a form submission as complete.
 */
export async function completeSubmission(
  db: DatabaseAdapter,
  submissionId: string,
  context: FormRuntimeContext,
): Promise<void> {
  await db.updateSubmission(submissionId, {
    status: 'COMPLETED',
    context,
  })
}
