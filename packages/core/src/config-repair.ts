import type { FormField, FormStep, FieldKey } from './types'
import { flattenFieldTree } from './dag'

// ─── Config Repair Suggestions ───────────────────────────────────────────────
// Static analysis of a form configuration that surfaces likely mistakes and,
// where safe, an automatic fix. Powers the Playground/Builder "validation
// repair" experience and the CLI `validate` command.

export type RepairSeverity = 'error' | 'warning'

export type RepairCode =
  | 'duplicate-field-key'
  | 'dangling-condition-ref'
  | 'self-referential-condition'
  | 'missing-select-options'
  | 'computed-missing-dependency'
  | 'dangling-step-ref'
  | 'dangling-branch-target'

export interface RepairSuggestion {
  code: RepairCode
  severity: RepairSeverity
  /** Field key or step id the issue is attached to. */
  target: string
  message: string
  /** True when `autofix` can resolve the issue without human input. */
  fixable: boolean
}

export interface RepairResult {
  ok: boolean
  errorCount: number
  warningCount: number
  suggestions: RepairSuggestion[]
}

export interface RepairInput {
  fields: FormField[]
  steps?: FormStep[]
}

const SELECTION_TYPES = new Set(['SELECT', 'MULTI_SELECT', 'RADIO'])

/**
 * Analyze a form configuration and return repair suggestions.
 *
 * Detects duplicate field keys, conditions referencing unknown or self fields,
 * selection fields without options, computed fields with missing dependencies,
 * fields pointing at unknown steps, and branches targeting unknown steps.
 */
export function suggestConfigRepairs(input: RepairInput): RepairResult {
  const suggestions: RepairSuggestion[] = []
  const fields = flattenFieldTree(input.fields ?? [])
  const steps = input.steps ?? []

  const seenKeys = new Set<FieldKey>()
  const knownKeys = new Set<FieldKey>(fields.map(f => f.key))
  const knownStepIds = new Set<string>(steps.map(s => s.id))

  for (const field of fields) {
    // Duplicate keys
    if (seenKeys.has(field.key)) {
      suggestions.push({
        code: 'duplicate-field-key',
        severity: 'error',
        target: field.key,
        message: `Duplicate field key "${field.key}". Field keys must be unique.`,
        fixable: false,
      })
    }
    seenKeys.add(field.key)

    // Condition references
    for (const rule of field.conditions?.rules ?? []) {
      if (rule.fieldKey === field.key) {
        suggestions.push({
          code: 'self-referential-condition',
          severity: 'error',
          target: field.key,
          message: `Field "${field.key}" has a condition that references itself.`,
          fixable: false,
        })
      } else if (!knownKeys.has(rule.fieldKey)) {
        suggestions.push({
          code: 'dangling-condition-ref',
          severity: 'error',
          target: field.key,
          message: `Field "${field.key}" has a condition referencing unknown field "${rule.fieldKey}".`,
          fixable: false,
        })
      }
    }

    // Selection fields need options (unless dynamic data source)
    if (SELECTION_TYPES.has(field.type)) {
      const cfg = field.config as { options?: unknown[]; dataSource?: unknown; mode?: string }
      const hasOptions = Array.isArray(cfg.options) && cfg.options.length > 0
      const hasDataSource = cfg.dataSource != null || cfg.mode === 'dynamic'
      if (!hasOptions && !hasDataSource) {
        suggestions.push({
          code: 'missing-select-options',
          severity: 'warning',
          target: field.key,
          message: `Selection field "${field.key}" has no options and no dynamic data source.`,
          fixable: false,
        })
      }
    }

    // Computed dependencies must exist
    if (field.computed) {
      for (const dep of field.computed.dependsOn ?? []) {
        if (!knownKeys.has(dep)) {
          suggestions.push({
            code: 'computed-missing-dependency',
            severity: 'error',
            target: field.key,
            message: `Computed field "${field.key}" depends on unknown field "${dep}".`,
            fixable: false,
          })
        }
      }
    }

    // stepId must reference a real step (only when steps are provided)
    if (steps.length > 0 && field.stepId && !knownStepIds.has(field.stepId)) {
      suggestions.push({
        code: 'dangling-step-ref',
        severity: 'error',
        target: field.key,
        message: `Field "${field.key}" references unknown step "${field.stepId}".`,
        fixable: false,
      })
    }
  }

  // Branch targets must exist
  for (const step of steps) {
    for (const branch of step.branches ?? []) {
      if (!knownStepIds.has(branch.targetStepId)) {
        suggestions.push({
          code: 'dangling-branch-target',
          severity: 'error',
          target: step.id,
          message: `Step "${step.id}" has a branch targeting unknown step "${branch.targetStepId}".`,
          fixable: false,
        })
      }
    }
  }

  const errorCount = suggestions.filter(s => s.severity === 'error').length
  const warningCount = suggestions.filter(s => s.severity === 'warning').length

  return { ok: errorCount === 0, errorCount, warningCount, suggestions }
}

/**
 * Apply the safe, automatic repairs to a configuration.
 *
 * Currently this removes duplicate fields (keeping the first occurrence by key),
 * which is the one transformation we can perform without losing author intent.
 * All other issues are reported by {@link suggestConfigRepairs} for manual review.
 */
export function autofixConfig(input: RepairInput): RepairInput {
  const seen = new Set<FieldKey>()
  const fields: FormField[] = []
  for (const field of input.fields ?? []) {
    if (seen.has(field.key)) {
      continue
    }
    seen.add(field.key)
    fields.push(field)
  }
  return { fields, steps: input.steps }
}
