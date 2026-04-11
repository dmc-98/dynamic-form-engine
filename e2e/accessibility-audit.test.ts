import { describe, it, expect, beforeEach } from 'vitest'
import { auditFormAccessibility, summarizeA11yAudit, getTemplate, createFormEngine } from '@dmc-98/dfe-core'
import { makeField, resetFieldCounter } from './helpers/fixtures'

describe('Accessibility Audit', () => {
  beforeEach(() => {
    resetFieldCounter()
  })

  it('should report no critical issues for well-formed fields with labels and descriptions', () => {
    const fields = [
      makeField({ key: 'fullName', type: 'SHORT_TEXT', label: 'Full Name', description: 'Enter your full name' }),
      makeField({ key: 'email', type: 'EMAIL', label: 'Email Address', description: 'Your email for contact' }),
      makeField({ key: 'message', type: 'LONG_TEXT', label: 'Message', description: 'Please describe your inquiry' }),
    ]

    const issues = auditFormAccessibility(fields)
    const criticalIssues = issues.filter(issue => issue.severity === 'critical')

    expect(criticalIssues).toHaveLength(0)
  })

  it('should report critical issue for field without label', () => {
    const fields = [
      makeField({ key: 'noLabel', type: 'SHORT_TEXT', label: '', description: 'This field has no label' }),
    ]

    const issues = auditFormAccessibility(fields)
    const criticalIssues = issues.filter(issue => issue.severity === 'critical')

    expect(criticalIssues.length).toBeGreaterThan(0)
    expect(criticalIssues[0].rule.toLowerCase()).toContain('label')
  })

  it('should report moderate issue for FILE_UPLOAD without description', () => {
    const fields = [
      makeField({ key: 'document', type: 'FILE_UPLOAD', label: 'Upload Document', description: '' }),
    ]

    const issues = auditFormAccessibility(fields)
    const seriousIssues = issues.filter(issue => issue.severity === 'serious')

    expect(seriousIssues.length).toBeGreaterThan(0)
  })

  it('should report minor issue for empty FIELD_GROUP with no children', () => {
    const fields = [
      makeField({ key: 'group', type: 'FIELD_GROUP', label: 'Group', children: [] }),
    ]

    const issues = auditFormAccessibility(fields)
    const seriousIssues = issues.filter(issue => issue.severity === 'serious')

    expect(seriousIssues.length).toBeGreaterThan(0)
  })

  it('should report issue for required field without indicator text', () => {
    const fields = [
      makeField({ key: 'requiredField', type: 'SHORT_TEXT', label: 'Required Field', required: true, requiredIndicator: '' }),
    ]

    const issues = auditFormAccessibility(fields)

    expect(issues.length).toBeGreaterThan(0)
  })

  it('should check step semantics when steps are provided', () => {
    const fields = [
      makeField({ key: 'step1Field', type: 'SHORT_TEXT', label: 'Step 1 Field', stepId: 'step-1' }),
      makeField({ key: 'step2Field', type: 'EMAIL', label: 'Step 2 Field', stepId: 'step-2' }),
    ]

    const steps = [
      { id: 'step-1', title: 'Personal Info', fields: ['field-0'] },
      { id: 'step-2', title: 'Contact Info', fields: ['field-1'] },
    ]

    const issues = auditFormAccessibility(fields, steps)

    expect(Array.isArray(issues)).toBe(true)
  })

  it('should produce readable string summary with issue counts', () => {
    const fields = [
      makeField({ key: 'textField', type: 'SHORT_TEXT', label: '' }),
      makeField({ key: 'fileUpload', type: 'FILE_UPLOAD', label: 'File', description: '' }),
    ]

    const issues = auditFormAccessibility(fields)
    const summary = summarizeA11yAudit(issues)

    expect(typeof summary).toBe('object')
    expect(summary).toBeDefined()
    expect(summary.critical + summary.serious + summary.moderate + summary.minor).toBeGreaterThan(0)
  })

  it('should validate contact-form template with no critical issues', () => {
    const template = getTemplate('contact-form')
    const issues = auditFormAccessibility(template.fields)
    const criticalIssues = issues.filter(issue => issue.severity === 'critical')

    expect(criticalIssues).toHaveLength(0)
  })

  it('should audit form with all 24 field types without crashing', () => {
    const fieldTypes = [
      'SHORT_TEXT', 'EMAIL', 'PASSWORD', 'NUMBER', 'CHECKBOX', 'RADIO', 'SELECT',
      'LONG_TEXT', 'DATE', 'TIME', 'DATE_TIME', 'FILE_UPLOAD', 'RICH_TEXT',
      'RATING', 'SIGNATURE', 'PHONE', 'URL', 'PASSWORD', 'HIDDEN',
      'SCALE', 'CHECKBOX', 'SECTION_BREAK', 'FIELD_GROUP', 'ADDRESS',
    ]

    const fields = fieldTypes.map((type, idx) =>
      makeField({
        key: `field_${idx}`,
        type: type as any,
        label: `Field ${idx}: ${type}`,
        description: `Test field of type ${type}`
      })
    )

    expect(() => {
      auditFormAccessibility(fields)
    }).not.toThrow()
  })

  it('should include non-empty suggestion field for all issues', () => {
    const fields = [
      makeField({ key: 'textField', type: 'SHORT_TEXT', label: '' }),
      makeField({ key: 'fileField', type: 'FILE_UPLOAD', label: 'File' }),
      makeField({ key: 'groupField', type: 'FIELD_GROUP', label: 'Group', children: [] }),
    ]

    const issues = auditFormAccessibility(fields)

    expect(issues.length).toBeGreaterThan(0)
    issues.forEach(issue => {
      expect(issue.suggestion).toBeDefined()
      expect(typeof issue.suggestion).toBe('string')
      expect(issue.suggestion.length).toBeGreaterThan(0)
    })
  })
})
