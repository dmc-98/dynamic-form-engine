import type { FormField, FormStep } from '@dmc-98/dfe-core'

export interface PlaygroundValidationIssue {
  severity: 'error' | 'warning'
  path: string
  message: string
}

export interface PlaygroundFormConfig {
  title?: string
  description?: string
  category?: string
  fields?: FormField[]
  steps?: FormStep[]
}

export function validateFormConfigData(
  config: PlaygroundFormConfig,
): { valid: boolean; issues: PlaygroundValidationIssue[] } {
  const issues: PlaygroundValidationIssue[] = []
  const fields = config.fields ?? []
  const steps = config.steps ?? []

  if (fields.length === 0 && steps.length === 0) {
    issues.push({
      severity: 'error',
      path: 'root',
      message: 'Configuration must have "fields" or "steps" array',
    })
  }

  const fieldKeys = new Set<string>()
  const fieldIds = new Set<string>()
  const stepIds = new Set<string>()

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    const path = `fields[${i}]`

    if (!field.key) issues.push({ severity: 'error', path, message: 'Field missing "key"' })
    if (!field.type) issues.push({ severity: 'error', path, message: 'Field missing "type"' })
    if (!field.label) issues.push({ severity: 'warning', path, message: 'Field missing "label"' })

    if (field.id && fieldIds.has(field.id)) {
      issues.push({ severity: 'error', path, message: `Duplicate field id: "${field.id}"` })
    }
    if (field.key && fieldKeys.has(field.key)) {
      issues.push({ severity: 'error', path, message: `Duplicate field key: "${field.key}"` })
    }

    if (field.id) fieldIds.add(field.id)
    if (field.key) fieldKeys.add(field.key)

    if (field.conditions?.rules) {
      for (const rule of field.conditions.rules) {
        if (rule.fieldKey === field.key) {
          issues.push({
            severity: 'error',
            path: `${path}.conditions`,
            message: `Self-referencing condition on field "${field.key}"`,
          })
        }
      }
    }

    if (field.parentFieldId && !fields.some(candidate => candidate.id === field.parentFieldId)) {
      issues.push({
        severity: 'error',
        path,
        message: `parentFieldId "${field.parentFieldId}" references non-existent field`,
      })
    }
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const path = `steps[${i}]`

    if (!step.id) issues.push({ severity: 'error', path, message: 'Step missing "id"' })
    if (!step.title) issues.push({ severity: 'warning', path, message: 'Step missing "title"' })

    if (step.id && stepIds.has(step.id)) {
      issues.push({ severity: 'error', path, message: `Duplicate step id: "${step.id}"` })
    }
    if (step.id) stepIds.add(step.id)

    if (step.branches) {
      for (let j = 0; j < step.branches.length; j++) {
        const branch = step.branches[j]
        if (branch.targetStepId && !steps.some(candidate => candidate.id === branch.targetStepId)) {
          issues.push({
            severity: 'error',
            path: `${path}.branches[${j}]`,
            message: `Branch targets unknown step: "${branch.targetStepId}"`,
          })
        }
      }
    }
  }

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    if (field.stepId && stepIds.size > 0 && !stepIds.has(field.stepId)) {
      issues.push({
        severity: 'error',
        path: `fields[${i}]`,
        message: `stepId "${field.stepId}" references non-existent step`,
      })
    }
  }

  const hasErrors = issues.some(issue => issue.severity === 'error')
  return { valid: !hasErrors, issues }
}
