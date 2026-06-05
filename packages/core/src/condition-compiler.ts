import type {
  ConditionRule, FieldConditions, CompiledCondition,
  FormValues, ConditionSkipRule,
} from './types'

// ─── Rule Evaluation ─────────────────────────────────────────────────────────

/**
 * Evaluate a single condition rule against current form values.
 * Uses strict equality with explicit string coercion for eq/neq
 * to prevent unexpected coercions (e.g., 0 == "" being true).
 */
function evaluateRule(rule: ConditionRule, values: FormValues): boolean {
  const fieldVal = values[rule.fieldKey]

  switch (rule.operator) {
    case 'eq':           return String(fieldVal) === String(rule.value)
    case 'neq':          return String(fieldVal) !== String(rule.value)
    case 'gt':           return Number(fieldVal) > Number(rule.value)
    case 'gte':          return Number(fieldVal) >= Number(rule.value)
    case 'lt':           return Number(fieldVal) < Number(rule.value)
    case 'lte':          return Number(fieldVal) <= Number(rule.value)
    case 'contains':     return String(fieldVal ?? '').includes(String(rule.value))
    case 'not_contains': return !String(fieldVal ?? '').includes(String(rule.value))
    case 'empty':        return fieldVal === null || fieldVal === undefined || fieldVal === '' || (Array.isArray(fieldVal) && fieldVal.length === 0)
    case 'not_empty':    return fieldVal !== null && fieldVal !== undefined && fieldVal !== '' && !(Array.isArray(fieldVal) && fieldVal.length === 0)
    case 'in':           return Array.isArray(rule.value) && rule.value.includes(fieldVal)
    case 'not_in':       return Array.isArray(rule.value) && !rule.value.includes(fieldVal)
    default:             return false
  }
}

/**
 * Evaluate multiple rules with a logical operator.
 * 'and' = all rules must match, 'or' = at least one rule must match.
 */
function evaluateRules(rules: ConditionRule[], logicalOp: 'and' | 'or', values: FormValues): boolean {
  if (logicalOp === 'and') return rules.every(r => evaluateRule(r, values))
  return rules.some(r => evaluateRule(r, values))
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compiles a FieldConditions (or ConditionSkipRule) into a reusable function.
 * The returned function accepts FormValues and returns true when the condition matches.
 *
 * @example
 * ```ts
 * const fn = compileCondition({ action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] })
 * fn({ role: 'admin' }) // true → field should be shown
 * fn({ role: 'user' })  // false → field should be hidden
 * ```
 */
export function compileCondition(conditions: FieldConditions | ConditionSkipRule): CompiledCondition {
  const { operator, rules } = conditions
  return (values: FormValues) => evaluateRules(rules, operator, values)
}

/**
 * Extract all field keys referenced in a condition's rules.
 * Used when building the dependency graph adjacency list.
 */
export function extractReferencedKeys(conditions: FieldConditions | ConditionSkipRule): Set<string> {
  return new Set(conditions.rules.map(r => r.fieldKey))
}

/**
 * Compute the effective visibility and required state of a field
 * based on its conditions, base required flag, current values, and parent visibility.
 *
 * @param conditions - The field's condition rules (null = unconditional)
 * @param baseRequired - The field's static 'required' flag
 * @param values - Current form values
 * @param parentIsVisible - Whether the parent FIELD_GROUP is visible
 */
export function computeFieldState(
  conditions: FieldConditions | null | undefined,
  baseRequired: boolean,
  values: FormValues,
  parentIsVisible: boolean,
): { isVisible: boolean; isRequired: boolean } {
  // If parent (FIELD_GROUP) is hidden, child is always hidden
  if (!parentIsVisible) {
    return { isVisible: false, isRequired: false }
  }

  if (!conditions) {
    return { isVisible: true, isRequired: baseRequired }
  }

  const result = compileCondition(conditions)(values)

  switch (conditions.action) {
    case 'SHOW':    return { isVisible: result,    isRequired: baseRequired }
    case 'HIDE':    return { isVisible: !result,   isRequired: baseRequired }
    case 'REQUIRE': return { isVisible: true,      isRequired: result }
    case 'DISABLE': return { isVisible: true,      isRequired: baseRequired }
    default:        return { isVisible: true,      isRequired: baseRequired }
  }
}
