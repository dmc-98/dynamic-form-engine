import { describe, expect, it } from 'vitest'
import type { FormField } from '../src/types'
import { generateAutofillDraft } from '../src/ai'

const registrationFields: FormField[] = [
  {
    id: 'field_first_name',
    versionId: 'v1',
    key: 'first_name',
    label: 'First Name',
    type: 'SHORT_TEXT',
    required: true,
    order: 0,
    config: {},
  },
  {
    id: 'field_last_name',
    versionId: 'v1',
    key: 'last_name',
    label: 'Last Name',
    type: 'SHORT_TEXT',
    required: true,
    order: 1,
    config: {},
  },
  {
    id: 'field_email',
    versionId: 'v1',
    key: 'email',
    label: 'Email',
    type: 'EMAIL',
    required: true,
    order: 2,
    config: {},
  },
  {
    id: 'field_department',
    versionId: 'v1',
    key: 'department',
    label: 'Department',
    type: 'SELECT',
    required: false,
    order: 3,
    config: {
      mode: 'static',
      options: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'Design', value: 'design' },
      ],
    },
  },
  {
    id: 'field_agree_terms',
    versionId: 'v1',
    key: 'agree_terms',
    label: 'I agree to the Terms and Conditions',
    type: 'CHECKBOX',
    required: true,
    order: 4,
    config: {},
  },
]

describe('generateAutofillDraft', () => {
  it('builds a review-first draft from structured profile text', () => {
    const result = generateAutofillDraft({
      fields: registrationFields,
      sourceText: [
        'Name: Ada Lovelace',
        'Email: ada.lovelace@example.com',
        'Department: Engineering',
        'Agree Terms: yes',
      ].join('\n'),
    })

    expect(result.requiresReview).toBe(true)
    expect(result.values.first_name).toBe('Ada')
    expect(result.values.last_name).toBe('Lovelace')
    expect(result.values.email).toBe('ada.lovelace@example.com')
    expect(result.values.department).toBe('engineering')
    expect(result.values.agree_terms).toBe(true)
    expect(result.matches).toHaveLength(5)
    expect(result.warnings).toEqual([])
  })

  it('warns when draft values target sensitive fields', () => {
    const sensitiveField: FormField = {
      id: 'field_tax_id',
      versionId: 'v1',
      key: 'tax_id',
      label: 'Tax ID / SSN',
      type: 'SHORT_TEXT',
      required: true,
      order: 0,
      config: {
        compliance: {
          protected: true,
          classification: 'financial',
        },
      },
    }

    const result = generateAutofillDraft({
      fields: [sensitiveField],
      sourceText: 'Tax ID: 123-45-6789',
    })

    expect(result.values.tax_id).toBe('123-45-6789')
    expect(result.warnings).toContain(
      '"Tax ID / SSN" may contain sensitive data. Review it before applying the draft.',
    )
  })

  it('returns unmatched fields and a warning when nothing can be inferred', () => {
    const result = generateAutofillDraft({
      fields: registrationFields,
      sourceText: 'This text does not contain any profile details.',
    })

    expect(result.matches).toHaveLength(0)
    expect(result.unmatchedFieldKeys).toEqual(
      registrationFields.map((field) => field.key),
    )
    expect(result.warnings).toContain(
      'No draft answers could be inferred from the provided text.',
    )
  })
})
