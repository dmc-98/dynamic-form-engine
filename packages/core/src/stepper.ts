import type {
  FormStep, FormGraph, FormValues,
  StepGraph, StepNodeState, CompiledCondition,
} from './types'
import { compileCondition } from './condition-compiler'
import { collectSubmissionValues, getCurrentValues } from './dag'
import { generateStepZodSchema } from './zod-generator'

// ─── Build Step Graph ────────────────────────────────────────────────────────

/**
 * Build the step execution graph from ordered steps + the field graph.
 * Compiles step skip conditions and computes initial step visibility.
 */
export function buildStepGraph(
  steps: FormStep[],
  formGraph: FormGraph,
): StepGraph {
  const stepNodes = new Map<string, StepNodeState>()
  const compiledSkipConditions = new Map<string, CompiledCondition>()
  const orderedStepIds: string[] = []

  const currentValues = getCurrentValues(formGraph)

  for (const step of steps) {
    // Collect field keys that belong to this step
    const fieldKeys: string[] = []
    for (const [key, node] of formGraph.nodes) {
      if (node.field.stepId === step.id) fieldKeys.push(key)
    }
    fieldKeys.sort((a, b) => {
      const orderA = formGraph.nodes.get(a)!.field.order
      const orderB = formGraph.nodes.get(b)!.field.order
      return orderA - orderB
    })

    // Compile skip condition
    let isVisible = true
    if (step.conditions) {
      const compiledSkip = compileCondition(step.conditions)
      compiledSkipConditions.set(step.id, compiledSkip)
      isVisible = !compiledSkip(currentValues)
    }

    stepNodes.set(step.id, {
      step,
      fieldKeys,
      isVisible,
      isComplete: false,
    })
    orderedStepIds.push(step.id)
  }

  return { steps: stepNodes, orderedStepIds, compiledSkipConditions }
}

// ─── Step Validation ─────────────────────────────────────────────────────────

/**
 * Check if all visible, required fields in a step have valid values.
 * Uses the Zod schema generated from the step's field configurations.
 */
export function canProceedFromStep(
  stepGraph: StepGraph,
  formGraph: FormGraph,
  stepId: string,
): boolean {
  const stepNode = stepGraph.steps.get(stepId)
  if (!stepNode || !stepNode.isVisible) return true

  const { fieldKeys } = stepNode

  const stepFields = fieldKeys
    .map(k => formGraph.nodes.get(k)!)
    .filter(n => n.isVisible && n.field.stepId === stepId)
    .map(n => n.field)

  if (stepFields.length === 0) return true

  const stepSchema = generateStepZodSchema(stepFields)
  const stepValues: FormValues = {}
  for (const key of fieldKeys) {
    const node = formGraph.nodes.get(key)
    if (node?.isVisible) stepValues[key] = node.value
  }

  const result = stepSchema.safeParse(stepValues)
  stepNode.isComplete = result.success
  return result.success
}

// ─── Navigation ──────────────────────────────────────────────────────────────

/**
 * Find the next visible step after the given index.
 * Re-evaluates skip conditions with current form values.
 */
export function getNextVisibleStep(
  stepGraph: StepGraph,
  currentIndex: number,
  currentValues: FormValues,
): StepNodeState | null {
  const { orderedStepIds, steps, compiledSkipConditions } = stepGraph

  for (let i = currentIndex + 1; i < orderedStepIds.length; i++) {
    const stepId = orderedStepIds[i]
    const stepNode = steps.get(stepId)!
    const skipFn = compiledSkipConditions.get(stepId)

    const shouldSkip = skipFn ? skipFn(currentValues) : false
    stepNode.isVisible = !shouldSkip

    if (stepNode.isVisible) return stepNode
  }

  return null
}

/**
 * Find the previous visible step before the given index.
 */
export function getPrevVisibleStep(
  stepGraph: StepGraph,
  currentIndex: number,
): StepNodeState | null {
  const { orderedStepIds, steps } = stepGraph
  for (let i = currentIndex - 1; i >= 0; i--) {
    const stepId = orderedStepIds[i]
    const stepNode = steps.get(stepId)!
    if (stepNode.isVisible) return stepNode
  }
  return null
}

/**
 * Get all visible steps in order (for rendering a step indicator).
 */
export function getVisibleSteps(stepGraph: StepGraph): StepNodeState[] {
  return stepGraph.orderedStepIds
    .map(id => stepGraph.steps.get(id)!)
    .filter(s => s.isVisible)
}

/**
 * Collect values from ALL visible steps for final submission.
 */
export function collectAllStepValues(formGraph: FormGraph): FormValues {
  return collectSubmissionValues(formGraph)
}
