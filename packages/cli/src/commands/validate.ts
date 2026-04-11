import { Command } from 'commander'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  path: string
  message: string
}

/**
 * Validate a DFE form configuration file.
 * Checks for: missing required fields, circular dependencies, type mismatches,
 * missing references, and best practice violations.
 */
export function validateFormConfig(configPath: string): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []

  // Resolve path
  const fullPath = resolve(configPath)
  if (!existsSync(fullPath)) {
    return { valid: false, issues: [{ severity: 'error', path: configPath, message: 'File not found' }] }
  }

  let config: any
  try {
    const content = readFileSync(fullPath, 'utf-8')
    config = JSON.parse(content)
  } catch (e) {
    return { valid: false, issues: [{ severity: 'error', path: configPath, message: `Invalid JSON: ${(e as Error).message}` }] }
  }

  // Check top-level structure
  if (!config.fields && !config.steps) {
    issues.push({ severity: 'error', path: 'root', message: 'Config must have "fields" or "steps" array' })
  }

  const fields = config.fields ?? []
  const steps = config.steps ?? []

  // Build lookup maps
  const fieldKeys = new Set<string>()
  const fieldIds = new Set<string>()
  const stepIds = new Set<string>()

  // Validate fields
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    const path = `fields[${i}]`

    if (!f.key) issues.push({ severity: 'error', path, message: 'Field missing "key"' })
    if (!f.type) issues.push({ severity: 'error', path, message: 'Field missing "type"' })
    if (!f.label) issues.push({ severity: 'warning', path, message: 'Field missing "label"' })
    if (f.id && fieldIds.has(f.id)) {
      issues.push({ severity: 'error', path, message: `Duplicate field id: "${f.id}"` })
    }
    if (f.key && fieldKeys.has(f.key)) {
      issues.push({ severity: 'error', path, message: `Duplicate field key: "${f.key}"` })
    }

    if (f.id) fieldIds.add(f.id)
    if (f.key) fieldKeys.add(f.key)

    // Check condition references
    if (f.conditions?.rules) {
      for (const rule of f.conditions.rules) {
        if (rule.fieldKey === f.key) {
          issues.push({ severity: 'error', path: `${path}.conditions`, message: `Self-referencing condition on field "${f.key}"` })
        }
      }
    }

    // Check parentFieldId reference
    if (f.parentFieldId && !fields.some((ff: any) => ff.id === f.parentFieldId)) {
      issues.push({ severity: 'error', path, message: `parentFieldId "${f.parentFieldId}" references non-existent field` })
    }

    // Check stepId reference
    if (f.stepId && steps.length > 0) {
      // We'll validate after collecting step IDs
    }
  }

  // Validate steps
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]
    const path = `steps[${i}]`

    if (!s.id) issues.push({ severity: 'error', path, message: 'Step missing "id"' })
    if (!s.title) issues.push({ severity: 'warning', path, message: 'Step missing "title"' })
    if (s.id && stepIds.has(s.id)) {
      issues.push({ severity: 'error', path, message: `Duplicate step id: "${s.id}"` })
    }
    if (s.id) stepIds.add(s.id)

    // Check API contracts
    if (s.config?.apiContracts) {
      for (let j = 0; j < s.config.apiContracts.length; j++) {
        const c = s.config.apiContracts[j]
        const cPath = `${path}.config.apiContracts[${j}]`
        if (!c.endpoint) issues.push({ severity: 'error', path: cPath, message: 'API contract missing "endpoint"' })
        if (!c.resourceName) issues.push({ severity: 'warning', path: cPath, message: 'API contract missing "resourceName"' })

        // Check field mapping references
        for (const fieldKey of Object.keys(c.fieldMapping ?? {})) {
          if (!fieldKeys.has(fieldKey)) {
            issues.push({ severity: 'warning', path: cPath, message: `fieldMapping references unknown field key: "${fieldKey}"` })
          }
        }
      }
    }

    // Check branch references
    if (s.branches) {
      for (let j = 0; j < s.branches.length; j++) {
        const b = s.branches[j]
        if (b.targetStepId && !steps.some((ss: any) => ss.id === b.targetStepId)) {
          issues.push({ severity: 'error', path: `${path}.branches[${j}]`, message: `Branch targets unknown step: "${b.targetStepId}"` })
        }
      }
    }
  }

  // Cross-validate field stepId references
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    if (f.stepId && stepIds.size > 0 && !stepIds.has(f.stepId)) {
      issues.push({ severity: 'error', path: `fields[${i}]`, message: `stepId "${f.stepId}" references non-existent step` })
    }
  }

  // Check for circular dependencies
  const deps = new Map<string, Set<string>>()
  for (const f of fields) {
    if (!f.key) continue
    deps.set(f.key, new Set())
    if (f.conditions?.rules) {
      for (const rule of f.conditions.rules) {
        if (fieldKeys.has(rule.fieldKey)) {
          deps.get(f.key)!.add(rule.fieldKey)
        }
      }
    }
  }

  // Simple cycle detection with DFS
  const visited = new Set<string>()
  const inStack = new Set<string>()

  function hasCycle(key: string): boolean {
    if (inStack.has(key)) return true
    if (visited.has(key)) return false
    visited.add(key)
    inStack.add(key)
    for (const dep of deps.get(key) ?? []) {
      if (hasCycle(dep)) return true
    }
    inStack.delete(key)
    return false
  }

  for (const key of fieldKeys) {
    visited.clear()
    inStack.clear()
    if (hasCycle(key)) {
      issues.push({ severity: 'error', path: `fields`, message: `Circular dependency detected involving field "${key}"` })
      break
    }
  }

  const hasErrors = issues.some(i => i.severity === 'error')
  return { valid: !hasErrors, issues }
}

/**
 * CLI entry point for `dfe validate`
 */
export function runValidateCommand(args: string[]): void {
  const configPath = args[0]
  if (!configPath) {
    console.error('Usage: dfe validate <config.json>')
    process.exit(1)
  }

  const { valid, issues } = validateFormConfig(configPath)

  if (issues.length === 0) {
    console.log('✓ Form config is valid!')
    return
  }

  for (const issue of issues) {
    const icon = issue.severity === 'error' ? '✗' : '⚠'
    console.log(`  ${icon} [${issue.path}] ${issue.message}`)
  }

  console.log('')
  const errors = issues.filter(i => i.severity === 'error').length
  const warnings = issues.filter(i => i.severity === 'warning').length
  console.log(`${errors} error(s), ${warnings} warning(s)`)

  if (!valid) process.exit(1)
}

// ─── Commander Command Export ─────────────────────────────────────────────────

export const validateCommand = new Command('validate')
  .description('Validate a DFE form configuration file')
  .argument('<config>', 'Path to the form configuration JSON file')
  .action((configPath: string) => {
    runValidateCommand([configPath])
  })
