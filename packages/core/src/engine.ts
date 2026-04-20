import type {
  FormField, FormValues, FormEngine, FormStepper,
  FormStep, FormGraph, StepGraph, GraphPatch,
  FieldNodeState, StepNodeState, FieldKey, PermissionLevel,
  ComputedFieldConfig,
} from './types'
import {
  buildFormGraph, handleFieldChange, getCurrentValues,
  collectSubmissionValues, flattenFieldTree, getDefaultValue,
} from './dag'
import { buildStepGraph, getVisibleSteps, canProceedFromStep } from './stepper'
import { generateZodSchema, generateStepZodSchema } from './zod-generator'
import { compileCondition } from './condition-compiler'

// ─── Form Engine Factory ─────────────────────────────────────────────────────

/**
 * Create a new form engine instance.
 * This is the primary entry point for using the Dynamic Form Engine.
 *
 * The engine manages a dependency graph of form fields, handles conditional
 * visibility/requirement logic, generates Zod validation schemas, and
 * collects submission values.
 *
 * @param fields - Array of FormField definitions (flat or nested tree)
 * @param hydrationData - Optional pre-existing values to pre-fill the form
 * @returns A FormEngine instance with methods for field management and validation
 *
 * @example
 * ```ts
 * import { createFormEngine } from '@dmc--98/dfe-core'
 *
 * const engine = createFormEngine(formDefinition.fields, existingData)
 *
 * // Set a field value (triggers condition evaluation)
 * const patch = engine.setFieldValue('role', 'admin')
 * console.log(patch.visibilityChanges) // fields that became visible/hidden
 *
 * // Get visible fields for rendering
 * const visibleFields = engine.getVisibleFields()
 *
 * // Validate before submission
 * const { success, errors } = engine.validate()
 * if (success) {
 *   const values = engine.collectSubmissionValues()
 *   await submitToApi(values)
 * }
 * ```
 */
export function createFormEngine(
  fields: FormField[],
  hydrationData?: FormValues,
): FormEngine {
  // Validate input fields have required properties
  for (const field of fields) {
    if (!field.key) {
      throw new Error(`FormEngine: field "${field.id}" is missing a "key" property`)
    }
    if (!field.type) {
      throw new Error(`FormEngine: field "${field.key}" is missing a "type" property`)
    }
    if (field.config === undefined || field.config === null) {
      // Auto-fix: default to empty config instead of crashing downstream
      ;(field as any).config = {}
    }
  }

  // Flatten field tree if nested
  const flatFields = flattenFieldTree(fields)

  // Build the dependency graph
  const graph = buildFormGraph(flatFields, hydrationData)

  // Initialize computed field tracking
  const computedExpressions = new Map<FieldKey, { expression: string; dependsOn: FieldKey[] }>()
  const fieldKeyToField = new Map<FieldKey, FormField>(flatFields.map(f => [f.key, f]))

  // Scan fields for computed config and register them
  for (const field of flatFields) {
    if (field.computed) {
      computedExpressions.set(field.key, {
        expression: field.computed.expression,
        dependsOn: field.computed.dependsOn,
      })
    }
  }

  // Initialize undo/redo stacks
  const undoStack: FormValues[] = []
  const redoStack: FormValues[] = []
  const maxHistory = 50

  // Initialize repeat instances tracker
  const repeatInstances = new Map<FieldKey, FormValues[]>()

  return {
    graph,

    getFields(): FormField[] {
      return fields
    },

    setFieldValue(key, value): GraphPatch {
      // Push current values to undoStack before changing
      undoStack.push(getCurrentValues(graph))
      if (undoStack.length > maxHistory) {
        undoStack.shift()
      }
      redoStack.length = 0 // Clear redo stack on new change

      const patch = handleFieldChange(graph, key, value)

      // Re-evaluate computed fields whose dependencies changed
      for (const [computedKey, config] of computedExpressions) {
        const dependencyChanged = config.dependsOn.some(dep => patch.updatedKeys.has(dep))
        if (dependencyChanged) {
          const computedValue = evaluateSafeExpression(
            config.expression,
            getCurrentValues(graph),
          )
          const computedNode = graph.nodes.get(computedKey)
          if (computedNode) {
            computedNode.value = computedValue
          }
        }
      }

      return patch
    },

    getValues(): FormValues {
      return getCurrentValues(graph)
    },

    getVisibleFields(): FormField[] {
      const visible: FormField[] = []
      for (const [, node] of graph.nodes) {
        if (node.isVisible) {
          visible.push(node.field)
        }
      }
      return visible.sort((a, b) => a.order - b.order)
    },

    getFieldState(key): FieldNodeState | undefined {
      return graph.nodes.get(key)
    },

    validate() {
      const visibleFields = this.getVisibleFields().filter(
        f => f.type !== 'SECTION_BREAK' && f.type !== 'FIELD_GROUP'
      )
      const schema = generateZodSchema(visibleFields)
      const values = this.getValues()
      const result = schema.safeParse(values)

      if (result.success) {
        return { success: true, errors: {} }
      }

      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const fieldKey = issue.path.join('.')
        errors[fieldKey] = issue.message
      }
      return { success: false, errors }
    },

    validateStep(stepId: string) {
      const stepFields: FormField[] = []
      for (const [, node] of graph.nodes) {
        if (node.field.stepId === stepId && node.isVisible &&
            node.field.type !== 'SECTION_BREAK' && node.field.type !== 'FIELD_GROUP') {
          stepFields.push(node.field)
        }
      }

      if (stepFields.length === 0) {
        return { success: true, errors: {} }
      }

      const schema = generateStepZodSchema(stepFields)
      const values = this.getValues()
      const stepValues: FormValues = {}
      for (const f of stepFields) {
        stepValues[f.key] = values[f.key]
      }

      const result = schema.safeParse(stepValues)
      if (result.success) {
        return { success: true, errors: {} }
      }

      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const fieldKey = issue.path.join('.')
        errors[fieldKey] = issue.message
      }
      return { success: false, errors }
    },

    collectSubmissionValues(): FormValues {
      return collectSubmissionValues(graph)
    },

    getComputedValue(key: FieldKey): unknown {
      const config = computedExpressions.get(key)
      if (!config) {
        return undefined
      }
      return evaluateSafeExpression(config.expression, getCurrentValues(graph))
    },

    registerComputed(key: FieldKey, expression: string, dependsOn: FieldKey[]): void {
      computedExpressions.set(key, { expression, dependsOn })
      // Add dependency edges to the graph
      for (const depKey of dependsOn) {
        if (graph.dependents.has(depKey)) {
          graph.dependents.get(depKey)!.add(key)
        }
      }
    },

    undo(): FormValues | null {
      if (undoStack.length === 0) {
        return null
      }
      const previousValues = undoStack.pop()!
      const currentValues = getCurrentValues(graph)
      redoStack.push(currentValues)

      // Restore all values from the previous state
      for (const [key, value] of Object.entries(previousValues)) {
        const node = graph.nodes.get(key)
        if (node) {
          node.value = value
        }
      }

      return previousValues
    },

    redo(): FormValues | null {
      if (redoStack.length === 0) {
        return null
      }
      const nextValues = redoStack.pop()!
      const currentValues = getCurrentValues(graph)
      undoStack.push(currentValues)

      // Restore all values from the next state
      for (const [key, value] of Object.entries(nextValues)) {
        const node = graph.nodes.get(key)
        if (node) {
          node.value = value
        }
      }

      return nextValues
    },

    canUndo(): boolean {
      return undoStack.length > 0
    },

    canRedo(): boolean {
      return redoStack.length > 0
    },

    getFieldPermission(key: FieldKey, role: string): PermissionLevel {
      const field = fieldKeyToField.get(key)
      if (!field || !field.permissions) {
        return 'editable'
      }

      const permission = field.permissions.find(p => p.role === role)
      return permission?.level ?? 'editable'
    },

    getLocalizedLabel(key: FieldKey, locale: string): string {
      const field = fieldKeyToField.get(key)
      if (!field) {
        return ''
      }
      return field.i18nLabels?.[locale] ?? field.label
    },

    addRepeatInstance(groupKey: FieldKey): void {
      const groupField = fieldKeyToField.get(groupKey)
      if (!groupField) {
        return
      }

      const repeatConfig = groupField.config as any
      if (!repeatConfig.templateFields) {
        return
      }

      // Clone template fields' default values
      const newInstance: FormValues = {}
      for (const templateField of repeatConfig.templateFields) {
        newInstance[templateField.key] = getCurrentValues(graph)[templateField.key] ?? getDefaultValue(templateField)
      }

      if (!repeatInstances.has(groupKey)) {
        repeatInstances.set(groupKey, [])
      }
      repeatInstances.get(groupKey)!.push(newInstance)
    },

    removeRepeatInstance(groupKey: FieldKey, index: number): void {
      const instances = repeatInstances.get(groupKey)
      if (instances && index >= 0 && index < instances.length) {
        instances.splice(index, 1)
      }
    },

    getRepeatInstances(groupKey: FieldKey): FormValues[] {
      return repeatInstances.get(groupKey) ?? []
    },
  }
}

/**
 * Safely evaluate a mathematical/logical expression with field values as context.
 * Uses Function constructor to create a scoped evaluator.
 */
function evaluateSafeExpression(expression: string, values: FormValues): unknown {
  try {
    // Create a safe evaluator function with field values as parameters
    const keys = Object.keys(values)
    const args = keys.map(k => values[k])
    // eslint-disable-next-line no-new-func
    const evaluator = new Function(...keys, `return (${expression})`)
    return evaluator(...args)
  } catch (e) {
    console.error(`Failed to evaluate computed expression: ${expression}`, e)
    return null
  }
}

// ─── Form Stepper Factory ────────────────────────────────────────────────────

/**
 * Create a form stepper instance for multi-step form navigation.
 *
 * The stepper manages step ordering, skip conditions, completion tracking,
 * and navigation (next/back/jump). It works independently of any framework.
 *
 * @param steps - Array of FormStep definitions in order
 * @param engine - A FormEngine instance (for field graph access)
 * @param initialIndex - Starting step index (default: 0)
 *
 * @example
 * ```ts
 * import { createFormEngine, createFormStepper } from '@dmc--98/dfe-core'
 *
 * const engine = createFormEngine(fields, data)
 * const stepper = createFormStepper(steps, engine)
 *
 * console.log(stepper.getCurrentStep()?.step.title) // "Personal Info"
 *
 * const nextStep = stepper.goNext()
 * if (nextStep) {
 *   console.log(nextStep.step.title) // "Job Details"
 * }
 * ```
 */
export function createFormStepper(
  steps: FormStep[],
  engine: FormEngine,
  initialIndex: number = 0,
): FormStepper {
  const stepGraph = buildStepGraph(steps, engine.graph)
  let currentIndex = initialIndex

  return {
    stepGraph,

    getCurrentStep(): StepNodeState | null {
      const visible = getVisibleSteps(stepGraph)
      return visible[currentIndex] ?? null
    },

    getVisibleSteps(): StepNodeState[] {
      return getVisibleSteps(stepGraph)
    },

    getCurrentIndex(): number {
      return currentIndex
    },

    canGoBack(): boolean {
      return currentIndex > 0
    },

    isLastStep(): boolean {
      const visible = getVisibleSteps(stepGraph)
      return currentIndex === visible.length - 1
    },

    goNext(): StepNodeState | null {
      const visible = getVisibleSteps(stepGraph)
      if (currentIndex < visible.length - 1) {
        currentIndex++
        return visible[currentIndex]
      }
      return null
    },

    goBack(): StepNodeState | null {
      if (currentIndex > 0) {
        currentIndex--
        const visible = getVisibleSteps(stepGraph)
        return visible[currentIndex]
      }
      return null
    },

    jumpTo(index: number): void {
      const visible = getVisibleSteps(stepGraph)
      if (index >= 0 && index < visible.length) {
        currentIndex = index
      }
    },

    markComplete(stepId: string): void {
      const stepNode = stepGraph.steps.get(stepId)
      if (stepNode) {
        stepNode.isComplete = true
      }
    },

    getProgress() {
      const visible = getVisibleSteps(stepGraph)
      return {
        current: currentIndex + 1,
        total: visible.length,
        percent: visible.length > 0
          ? Math.round(((currentIndex + 1) / visible.length) * 100)
          : 0,
      }
    },

    getNextBranch(): StepNodeState | null {
      const currentStep = this.getCurrentStep()
      if (!currentStep || !currentStep.step.branches) {
        return null
      }

      const values = engine.getValues()

      // Evaluate each branch condition in order
      for (const branch of currentStep.step.branches) {
        let matches = false
        if (typeof branch.condition === 'string') {
          // String expression: evaluate as a safe expression
          try {
            matches = !!evaluateSafeExpression(branch.condition, values)
          } catch {
            matches = false
          }
        } else {
          // FieldConditions object: compile and evaluate
          const compiledCondition = compileCondition(branch.condition)
          matches = compiledCondition(values)
        }
        if (matches) {
          // Find the target step in the stepGraph
          const targetStep = stepGraph.steps.get(branch.targetStepId)
          if (targetStep && targetStep.isVisible) {
            return targetStep
          }
        }
      }

      return null
    },

    goNextBranch(): StepNodeState | null {
      const branchTarget = this.getNextBranch()
      if (branchTarget) {
        // Find the visible step index of the target
        const visible = getVisibleSteps(stepGraph)
        const targetIndex = visible.findIndex(s => s.step.id === branchTarget.step.id)
        if (targetIndex >= 0) {
          currentIndex = targetIndex
          return visible[targetIndex]
        }
      }

      // Fall back to sequential navigation if no branch matches
      return this.goNext()
    },
  }
}
