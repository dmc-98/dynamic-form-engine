import type { FormField, FormStep } from './types'

// ─── Types ──────────────────────────────────────────────────────────────────

export type A11ySeverity = 'critical' | 'serious' | 'moderate' | 'minor'

export interface A11yIssue {
  severity: A11ySeverity
  rule: string
  message: string
  fieldKey?: string
  suggestion: string
}

// ─── WCAG 2.1 AA Compliance Rules ───────────────────────────────────────────

/**
 * Audits a form for WCAG 2.1 AA accessibility compliance issues.
 *
 * Checks for:
 * - Missing labels (WCAG 1.3.1 Info and Relationships)
 * - Missing descriptions for complex fields (WCAG 1.3.1)
 * - Color contrast guidance (WCAG 1.4.3)
 * - Keyboard navigation support (WCAG 2.1.1 Keyboard)
 * - Missing ARIA attributes (WCAG 4.1.2 Name, Role, Value)
 * - Form error announcement (WCAG 3.3.1 Error Identification)
 * - Step indicator semantics (WCAG 1.3.1)
 * - Empty field groups (WCAG 1.3.1)
 * - Missing required field indicators (WCAG 3.3.2 Labels or Instructions)
 *
 * @example
 * ```ts
 * const issues = auditFormAccessibility(fields, steps)
 * const criticalIssues = issues.filter(i => i.severity === 'critical')
 * ```
 */
export function auditFormAccessibility(
  fields: FormField[],
  steps?: FormStep[]
): A11yIssue[] {
  const issues: A11yIssue[] = []
  const fieldKeyMap = new Map(fields.map((f) => [f.key, f]))

  // ─── Rule 1: Missing Labels (WCAG 1.3.1) ─────────────────────────────────

  for (const field of fields) {
    if (!field.label || field.label.trim() === '') {
      issues.push({
        severity: 'critical',
        rule: 'WCAG 1.3.1 - Missing Label',
        message: `Field "${field.key}" has no label. All inputs must be associated with a label.`,
        fieldKey: field.key,
        suggestion: `Add a descriptive label to field "${field.key}". Labels must be meaningful and identify the purpose of the field.`,
      })
    }
  }

  // ─── Rule 2: Complex Fields Without Descriptions (WCAG 1.3.1) ──────────────

  const complexFieldTypes = [
    'FIELD_GROUP',
    'RICH_TEXT',
    'DATE_RANGE',
    'ADDRESS',
    'RATING',
    'SCALE',
  ]

  for (const field of fields) {
    if (
      complexFieldTypes.includes(field.type) &&
      (!field.description || field.description.trim() === '')
    ) {
      issues.push({
        severity: 'serious',
        rule: 'WCAG 1.3.1 - Missing Description for Complex Field',
        message: `${field.type} field "${field.key}" lacks a description to explain its purpose.`,
        fieldKey: field.key,
        suggestion: `Add a descriptive text to explain how to use the ${field.type} field. Use "field.description" to provide context.`,
      })
    }
  }

  // ─── Rule 3: Color-Only Instructions (WCAG 1.4.1 Use of Color) ────────────

  for (const field of fields) {
    const helpText = (field.config as any)?.helpText || ''
    if (helpText && /color|red|blue|green|yellow/i.test(helpText)) {
      issues.push({
        severity: 'moderate',
        rule: 'WCAG 1.4.1 - Color-Only Information',
        message: `Field "${field.key}" help text relies on color to convey information.`,
        fieldKey: field.key,
        suggestion: `Avoid using color alone to convey information. Use text labels, icons, or patterns in addition to color.`,
      })
    }
  }

  // ─── Rule 4: Keyboard Navigation (WCAG 2.1.1 Keyboard) ───────────────────

  const nonKeyboardAccessibleTypes = ['SIGNATURE', 'FILE_UPLOAD']

  for (const field of fields) {
    if (nonKeyboardAccessibleTypes.includes(field.type)) {
      issues.push({
        severity: 'serious',
        rule: 'WCAG 2.1.1 - Limited Keyboard Navigation',
        message: `${field.type} field "${field.key}" may have limited keyboard accessibility.`,
        fieldKey: field.key,
        suggestion: `Ensure the ${field.type} field has keyboard-accessible alternatives or clear instructions for keyboard users.`,
      })
    }
  }

  // ─── Rule 5: Missing ARIA Attributes (WCAG 4.1.2 Name, Role, Value) ───────

  for (const field of fields) {
    // Check for required fields without visual/aria indicator
    if (
      field.required &&
      (!field.label.includes('*') && !field.description?.includes('required'))
    ) {
      issues.push({
        severity: 'serious',
        rule: 'WCAG 3.3.2 - Required Field Not Indicated',
        message: `Required field "${field.key}" does not have a visual indicator (e.g., asterisk).`,
        fieldKey: field.key,
        suggestion: `Add a required field indicator (* or "required") to the label or description of field "${field.key}".`,
      })
    }

    // Check for fields that need aria-describedby
    if (field.description && field.type === 'RICH_TEXT') {
      issues.push({
        severity: 'moderate',
        rule: 'WCAG 4.1.2 - Missing aria-describedby',
        message: `${field.type} field "${field.key}" should have aria-describedby linking to description.`,
        fieldKey: field.key,
        suggestion: `Ensure the field renderer includes aria-describedby attribute linking to the description element.`,
      })
    }
  }

  // ─── Rule 6: Error Announcement (WCAG 3.3.1 Error Identification) ────────

  for (const field of fields) {
    if (field.type === 'EMAIL' || field.type === 'URL') {
      issues.push({
        severity: 'moderate',
        rule: 'WCAG 3.3.1 - Error Prevention',
        message: `${field.type} field "${field.key}" requires clear error messaging.`,
        fieldKey: field.key,
        suggestion: `Ensure validation errors for "${field.key}" are announced to screen readers using role="alert" and aria-live="polite".`,
      })
    }
  }

  // ─── Rule 7: Step Indicator Semantics (WCAG 1.3.1) ───────────────────────

  if (steps && steps.length > 0) {
    for (const step of steps) {
      if (!step.title || step.title.trim() === '') {
        issues.push({
          severity: 'serious',
          rule: 'WCAG 1.3.1 - Missing Step Title',
          message: `Step "${step.id}" has no title to identify its purpose.`,
          suggestion: `Add a descriptive title to step "${step.id}" to help users understand the form flow.`,
        })
      }
    }
  }

  // ─── Rule 8: Field Groups Must Have Fields (WCAG 1.3.1) ──────────────────

  for (const field of fields) {
    if (field.type === 'FIELD_GROUP') {
      const hasChildren =
        (field.children && field.children.length > 0) ||
        fields.some((f) => f.parentFieldId === field.id)

      if (!hasChildren) {
        issues.push({
          severity: 'moderate',
          rule: 'WCAG 1.3.1 - Empty Field Group',
          message: `Field group "${field.key}" is empty and serves no semantic purpose.`,
          fieldKey: field.key,
          suggestion: `Either add fields to this group or remove it if not needed.`,
        })
      }
    }
  }

  // ─── Rule 9: Form Structure (WCAG 1.3.1) ──────────────────────────────────

  if (!steps || steps.length === 0) {
    if (fields.length > 15) {
      issues.push({
        severity: 'moderate',
        rule: 'WCAG 2.4.8 - Form Structure',
        message: `Form has ${fields.length} fields without step grouping, which may overwhelm users.`,
        suggestion: `Consider breaking the form into logical steps using FormStep definitions for better user experience and accessibility.`,
      })
    }
  }

  // ─── Rule 10: Placeholder Not Substituting Label (WCAG 1.3.5) ────────────

  for (const field of fields) {
    const config = field.config as any
    if (config?.placeholder && !field.label) {
      issues.push({
        severity: 'critical',
        rule: 'WCAG 1.3.5 - Placeholder Instead of Label',
        message: `Field "${field.key}" uses placeholder as label, which disappears when user starts typing.`,
        fieldKey: field.key,
        suggestion: `Add an explicit label to field "${field.key}". Placeholders should only be used as hints, not as labels.`,
      })
    }
  }

  // ─── Rule 11: Radio Button Grouping (WCAG 1.3.1) ───────────────────────

  const radioFields = fields.filter((f) => f.type === 'RADIO')
  for (const field of radioFields) {
    if (!field.description) {
      issues.push({
        severity: 'moderate',
        rule: 'WCAG 1.3.1 - Radio Button Group Not Labeled',
        message: `Radio button group "${field.key}" lacks a group label/legend.`,
        fieldKey: field.key,
        suggestion: `Add a descriptive label or legend to the radio button group to identify its purpose.`,
      })
    }
  }

  // ─── Rule 12: Conditional Fields (WCAG 4.1.2) ──────────────────────────

  for (const field of fields) {
    if (field.conditions) {
      issues.push({
        severity: 'minor',
        rule: 'WCAG 4.1.2 - Conditional Field Visibility',
        message: `Field "${field.key}" has conditional visibility that may confuse screen reader users.`,
        fieldKey: field.key,
        suggestion: `Ensure field visibility changes are announced dynamically using aria-live regions or dynamic form notifications.`,
      })
    }
  }

  return issues
}

/**
 * Summarize accessibility audit results by severity level.
 */
export function summarizeA11yAudit(issues: A11yIssue[]): Record<A11ySeverity, number> {
  return {
    critical: issues.filter((i) => i.severity === 'critical').length,
    serious: issues.filter((i) => i.severity === 'serious').length,
    moderate: issues.filter((i) => i.severity === 'moderate').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
  }
}
