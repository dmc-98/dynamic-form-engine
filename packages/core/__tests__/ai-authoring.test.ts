import { describe, expect, it } from 'vitest'
import type { FormField } from '../src/types'
import {
  buildLlmPrompt,
  detectFormType,
  generateFormFromDescription,
  groupSuggestionsByCategory,
  suggestAdditionalFields,
  suggestValidationRules,
} from '../src/ai'

describe('AI authoring helpers', () => {
  it('detects form types and builds an LLM prompt with defaults', () => {
    expect(detectFormType('Please create a customer feedback survey for our app')).toBe('survey')
    expect(detectFormType('A simple form for collecting miscellaneous details')).toBe('general')

    const prompt = buildLlmPrompt({
      description: 'Create a registration form for an event attendee portal',
      category: 'registration',
      maxFields: 8,
    })

    expect(prompt).toContain('CATEGORY: registration')
    expect(prompt).toContain('MAX FIELDS: 8')
    expect(prompt).toContain('MULTI-STEP: yes')
    expect(prompt).toContain('Available field types: SHORT_TEXT')
  })

  it('falls back to detected categories and default limits in the LLM prompt', () => {
    const prompt = buildLlmPrompt({
      description: 'Create a support ticket form for customer issues',
      multiStep: false,
    })

    expect(prompt).toContain('CATEGORY: support')
    expect(prompt).toContain('MAX FIELDS: 15')
    expect(prompt).toContain('MULTI-STEP: no')
  })

  it('generates template-based form configs for single-step and multi-step flows', () => {
    const multiStep = generateFormFromDescription({
      description: 'onboarding form for a new engineering hire',
      multiStep: true,
    })

    expect(multiStep.category).toBe('onboarding')
    expect(multiStep.fields.length).toBeGreaterThan(4)
    expect(multiStep.steps.length).toBeGreaterThan(1)
    expect(multiStep.fields[0]?.stepId).toBe('step_1')

    const singleStep = generateFormFromDescription({
      description: 'contact form for a product demo request',
      multiStep: false,
      maxFields: 3,
    })

    expect(singleStep.category).toBe('contact')
    expect(singleStep.fields).toHaveLength(3)
    expect(singleStep.steps).toEqual([])
    expect(singleStep.fields.every((field) => field.stepId === undefined)).toBe(true)
  })

  it('falls back to contact templates and generated step titles for unknown categories', () => {
    const generated = generateFormFromDescription({
      description:
        'This is a very long custom workflow description intended to exercise fallback templates and generated step titles for verification coverage.',
      category: 'custom',
      multiStep: true,
    })

    expect(generated.category).toBe('custom')
    expect(generated.fields[0]?.key).toBe('full_name')
    expect(generated.steps[0]?.title).toBe('Step 1')
    expect(generated.title.endsWith('...')).toBe(true)
  })

  it('suggests validation rules and sorts them by priority', () => {
    const fields: FormField[] = [
      {
        id: 'field_email',
        versionId: 'v1',
        key: 'email',
        label: 'Email Address',
        type: 'EMAIL',
        required: true,
        order: 0,
        config: {},
      },
      {
        id: 'field_age',
        versionId: 'v1',
        key: 'age',
        label: 'Age',
        type: 'NUMBER',
        required: false,
        order: 1,
        config: {},
      },
      {
        id: 'field_zip',
        versionId: 'v1',
        key: 'zip_code',
        label: 'ZIP Code',
        type: 'SHORT_TEXT',
        required: false,
        order: 2,
        config: {},
      },
      {
        id: 'field_confirm_password',
        versionId: 'v1',
        key: 'confirm_password',
        label: 'Confirm Password',
        type: 'PASSWORD',
        required: true,
        order: 3,
        config: {},
      },
    ]

    const suggestions = suggestValidationRules(fields)

    expect(suggestions[0]).toMatchObject({
      fieldKey: 'email',
      rule: 'format:email',
      priority: 'high',
    })
    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'age', rule: 'range:0-150' }),
        expect.objectContaining({ fieldKey: 'zip_code', rule: 'pattern:zip' }),
        expect.objectContaining({ fieldKey: 'confirm_password', rule: 'match:original' }),
      ]),
    )
  })

  it('suggests additional fields and groups them by category', () => {
    const existingFields: FormField[] = [
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
        label: 'Work Email',
        type: 'EMAIL',
        required: true,
        order: 2,
        config: {},
      },
    ]

    const suggestions = suggestAdditionalFields(existingFields, 'onboarding')
    const grouped = groupSuggestionsByCategory(suggestions)

    expect(suggestions.map((suggestion) => suggestion.key)).toContain('preferred_name')
    expect(grouped.personal?.length).toBeGreaterThan(0)
    expect(grouped.financial?.map((suggestion) => suggestion.key)).toEqual(
      expect.arrayContaining(['bank_account', 'tax_id']),
    )
  })

  it('returns no additional suggestions for unsupported detected categories', () => {
    const fields: FormField[] = [
      {
        id: 'field_notes',
        versionId: 'v1',
        key: 'notes',
        label: 'Miscellaneous Notes',
        type: 'LONG_TEXT',
        required: false,
        order: 0,
        config: {},
      },
    ]

    expect(suggestAdditionalFields(fields)).toEqual([])
  })
})
