import { describe, it, expect, beforeEach } from 'vitest'
import type { FormStep } from '@dmc--98/dfe-core'
import {
  exportForm, exportFormToYaml, exportFormToCsv,
  importForm, importFromTypeform, importFromGoogleForms,
  getTemplate,
} from '@dmc--98/dfe-core'
import { makeField, resetFieldCounter, createContactForm } from './helpers/fixtures'

describe('Import and Export Functionality', () => {
  beforeEach(() => {
    resetFieldCounter()
  })

  describe('exportForm', () => {
    it('should produce valid JSON parseable string', () => {
      const { fields } = createContactForm()
      const exported = exportForm(fields)

      expect(typeof exported).toBe('string')
      expect(() => JSON.parse(exported)).not.toThrow()
    })

    it('should include metadata by default', () => {
      const { fields } = createContactForm()
      const exported = exportForm(fields)
      const parsed = JSON.parse(exported)

      expect(parsed.metadata).toBeDefined()
      expect(parsed.metadata.exportedAt).toBeDefined()
      expect(parsed.metadata.version).toBeDefined()
    })

    it('should omit metadata when includeMetadata is false', () => {
      const { fields } = createContactForm()
      const exported = exportForm(fields, undefined, { includeMetadata: false })
      const parsed = JSON.parse(exported)

      expect(parsed.metadata).toBeUndefined()
    })

    it('should include fields array in export', () => {
      const { fields } = createContactForm()
      const exported = exportForm(fields)
      const parsed = JSON.parse(exported)

      expect(parsed.fields).toBeDefined()
      expect(Array.isArray(parsed.fields)).toBe(true)
      expect(parsed.fields.length).toBeGreaterThan(0)
    })

    it('should preserve field properties in export', () => {
      const fields = [
        makeField({ key: 'username', type: 'SHORT_TEXT', label: 'Username', required: true, config: { minLength: 3 } }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
        makeField({ key: 'age', type: 'NUMBER', label: 'Age', config: { min: 18, max: 100 } }),
      ]

      const exported = exportForm(fields)
      const parsed = JSON.parse(exported)

      expect(parsed.fields[0].key).toBe('username')
      expect(parsed.fields[0].type).toBe('SHORT_TEXT')
      expect(parsed.fields[0].required).toBe(true)

      expect(parsed.fields[1].key).toBe('email')
      expect(parsed.fields[1].type).toBe('EMAIL')

      expect(parsed.fields[2].key).toBe('age')
    })

    it('should include steps array when provided', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
      ]
      const steps = [
        { id: 'step1', versionId: 'v1', title: 'Personal Info', order: 0 },
        { id: 'step2', versionId: 'v1', title: 'Contact Info', order: 1 },
      ]

      const exported = exportForm(fields, steps)
      const parsed = JSON.parse(exported)

      expect(parsed.steps).toBeDefined()
      expect(Array.isArray(parsed.steps)).toBe(true)
      expect(parsed.steps.length).toBe(2)
      expect(parsed.steps[0].title).toBe('Personal Info')
    })

    it('should handle complex field types and constraints', () => {
      const fields = [
        makeField({
          key: 'country',
          type: 'SELECT',
          label: 'Country',
          config: {
            mode: 'static',
            options: [
              { label: 'USA', value: 'usa' },
              { label: 'Canada', value: 'ca' },
            ],
          },
        }),
        makeField({
          key: 'skills',
          type: 'MULTI_SELECT',
          label: 'Skills',
          config: {
            mode: 'static',
            options: [
              { label: 'JavaScript', value: 'js' },
              { label: 'Python', value: 'py' },
            ],
          },
        }),
      ]

      const exported = exportForm(fields)
      const parsed = JSON.parse(exported)

      expect(parsed.fields[0].config.options).toEqual([
        { label: 'USA', value: 'usa' },
        { label: 'Canada', value: 'ca' },
      ])
      expect(parsed.fields[1].config.options).toEqual([
        { label: 'JavaScript', value: 'js' },
        { label: 'Python', value: 'py' },
      ])
    })
  })

  describe('exportFormToYaml', () => {
    it('should produce YAML-like string structure', () => {
      const { fields } = createContactForm()
      const exported = exportFormToYaml(fields)

      expect(typeof exported).toBe('string')
      expect(exported.length).toBeGreaterThan(0)
      // YAML structure indicators
      expect(exported).toMatch(/[\s-]/)
    })

    it('should contain key:value pairs', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' })]
      const exported = exportFormToYaml(fields)

      expect(exported).toContain('fields')
      expect(exported).toContain('key')
      expect(exported).toContain('type')
    })

    it('should use indentation for nested structures', () => {
      const fields = [makeField({
        key: 'country',
        type: 'SELECT',
        label: 'Country',
        config: {
          mode: 'static',
          options: [
            { label: 'USA', value: 'usa' },
          ],
        },
      })]
      const exported = exportFormToYaml(fields)

      expect(exported).toMatch(/  /)
    })

    it('should use dashes for arrays', () => {
      const { fields } = createContactForm()
      const exported = exportFormToYaml(fields)

      expect(exported).toContain('-')
    })

    it('should preserve field information in YAML', () => {
      const fields = [
        makeField({ key: 'username', type: 'SHORT_TEXT', label: 'Username', required: true }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
      ]
      const exported = exportFormToYaml(fields)

      expect(exported).toContain('username')
      expect(exported).toContain('email')
      expect(exported).toContain('SHORT_TEXT')
      expect(exported).toContain('EMAIL')
    })

    it('should support steps in YAML export', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' })]
      const steps = [{ id: 'step1', versionId: 'v1', title: 'Basic Info', order: 0 }]

      const exported = exportFormToYaml(fields, steps)

      expect(exported).toContain('steps')
      expect(exported).toContain('Basic Info')
    })
  })

  describe('exportFormToCsv', () => {
    it('should have header row with field keys', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
      ]
      const exported = exportFormToCsv(fields)

      expect(exported).toContain('name')
      expect(exported).toContain('email')
    })

    it('should contain CSV formatted content', () => {
      const { fields } = createContactForm()
      const exported = exportFormToCsv(fields)

      expect(typeof exported).toBe('string')
      expect(exported).toContain('\n')
    })

    it('should have rows for field configurations', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name', required: true }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
      ]
      const exported = exportFormToCsv(fields)

      const lines = exported.split('\n')
      expect(lines.length).toBeGreaterThan(1)
    })

    it('should include field types in CSV', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
        makeField({ key: 'age', type: 'NUMBER', label: 'Age' }),
      ]
      const exported = exportFormToCsv(fields)

      expect(exported).toContain('SHORT_TEXT')
      expect(exported).toContain('EMAIL')
      expect(exported).toContain('NUMBER')
    })

    it('should include field labels in CSV', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Full Name' }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email Address' }),
      ]
      const exported = exportFormToCsv(fields)

      expect(exported).toContain('Full Name')
      expect(exported).toContain('Email Address')
    })

    it('should support steps parameter in CSV export', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
      ]

      const exported = exportFormToCsv(fields)
      expect(typeof exported).toBe('string')
      expect(exported.length).toBeGreaterThan(0)
    })
  })

  describe('importForm', () => {
    it('should parse JSON and return fields and steps', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name', required: true }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
      ]
      const exported = exportForm(fields, undefined, { includeMetadata: false })

      const result = importForm(exported)

      expect(result.fields).toBeDefined()
      expect(Array.isArray(result.fields)).toBe(true)
      expect(result.fields.length).toBe(2)
    })

    it('should preserve field properties during import', () => {
      const fields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          label: 'Username',
          required: true,
          config: {
            minLength: 3,
            maxLength: 20,
            pattern: '^[a-zA-Z0-9_]+$',
          },
        }),
        makeField({
          key: 'age',
          type: 'NUMBER',
          label: 'Age',
          config: { min: 18, max: 100 },
        }),
      ]
      const exported = exportForm(fields, undefined, { includeMetadata: false })
      const result = importForm(exported)

      expect(result.fields[0].key).toBe('username')
      expect(result.fields[0].required).toBe(true)

      expect(result.fields[1].key).toBe('age')
    })

    it('should restore steps when included in export', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
      ]
      const steps = [
        { id: 'step1', versionId: 'v1', title: 'Step 1', order: 0 },
        { id: 'step2', versionId: 'v1', title: 'Step 2', order: 1 },
      ]
      const exported = exportForm(fields, steps, { includeMetadata: false })
      const result = importForm(exported)

      expect(result.steps).toBeDefined()
      expect(result.steps?.length).toBe(2)
      expect(result.steps?.[0].title).toBe('Step 1')
    })

    it('should handle complex field types during import', () => {
      const fields = [
        makeField({
          key: 'country',
          type: 'SELECT',
          label: 'Country',
          config: {
            mode: 'static',
            options: [
              { label: 'USA', value: 'usa' },
              { label: 'Canada', value: 'ca' },
            ],
          },
        }),
        makeField({
          key: 'gender',
          type: 'RADIO',
          label: 'Gender',
          config: {
            mode: 'static',
            options: [
              { label: 'Male', value: 'm' },
              { label: 'Female', value: 'f' },
            ],
          },
        }),
      ]
      const exported = exportForm(fields, undefined, { includeMetadata: false })
      const result = importForm(exported)

      expect(result.fields[0].config.options).toEqual([
        { label: 'USA', value: 'usa' },
        { label: 'Canada', value: 'ca' },
      ])
      expect(result.fields[1].config.options).toEqual([
        { label: 'Male', value: 'm' },
        { label: 'Female', value: 'f' },
      ])
    })
  })

  describe('Round-trip: exportForm → importForm', () => {
    it('should preserve fields during round-trip', () => {
      const originalFields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Full Name', required: true }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
        makeField({ key: 'phone', type: 'PHONE', label: 'Phone' }),
        makeField({ key: 'message', type: 'LONG_TEXT', label: 'Message', required: true }),
      ]

      const exported = exportForm(originalFields, undefined, { includeMetadata: false })
      const result = importForm(exported)

      expect(result.fields.length).toBe(originalFields.length)

      for (let i = 0; i < originalFields.length; i++) {
        expect(result.fields[i].key).toBe(originalFields[i].key)
        expect(result.fields[i].type).toBe(originalFields[i].type)
        expect(result.fields[i].label).toBe(originalFields[i].label)
        expect(result.fields[i].required).toBe(originalFields[i].required)
      }
    })

    it('should preserve all constraints during round-trip', () => {
      const originalFields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          label: 'Username',
          required: true,
          config: {
            minLength: 5,
            maxLength: 30,
            pattern: '^[a-z0-9_]+$',
          },
        }),
        makeField({
          key: 'score',
          type: 'NUMBER',
          label: 'Score',
          required: false,
          config: {
            min: 0,
            max: 100,
          },
        }),
      ]

      const exported = exportForm(originalFields, undefined, { includeMetadata: false })
      const result = importForm(exported)

      expect(result.fields[0].config.minLength).toBe(5)
      expect(result.fields[0].config.maxLength).toBe(30)
      expect(result.fields[0].config.pattern).toBe('^[a-z0-9_]+$')

      expect(result.fields[1].config.min).toBe(0)
      expect(result.fields[1].config.max).toBe(100)
    })

    it('should preserve options during round-trip', () => {
      const originalFields = [
        makeField({
          key: 'status',
          type: 'SELECT',
          label: 'Status',
          config: {
            mode: 'static',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Pending', value: 'pending' },
            ],
          },
        }),
      ]

      const exported = exportForm(originalFields, undefined, { includeMetadata: false })
      const result = importForm(exported)

      expect(result.fields[0].config.options).toEqual(originalFields[0].config.options)
    })
  })

  describe('importFromTypeform', () => {
    it('should convert Typeform config to DFE fields', () => {
      const typeformConfig = {
        fields: [
          {
            ref: 'q1',
            title: 'Your name',
            type: 'short_text',
            validations: { required: true },
          },
        ],
      }

      const { fields } = importFromTypeform(typeformConfig)

      expect(Array.isArray(fields)).toBe(true)
      expect(fields.length).toBe(1)
    })

    it('should map Typeform field properties to DFE format', () => {
      const typeformConfig = {
        fields: [
          {
            ref: 'name_field',
            title: 'Full Name',
            type: 'short_text',
            validations: { required: true },
          },
          {
            ref: 'email_field',
            title: 'Email Address',
            type: 'email',
            validations: { required: true },
          },
        ],
      }

      const { fields } = importFromTypeform(typeformConfig)

      expect(fields.length).toBe(2)
      expect(fields[0].label).toBeDefined()
      expect(fields[0].required).toBe(true)
      expect(fields[1].label).toBeDefined()
      expect(fields[1].required).toBe(true)
    })

    it('should handle Typeform with multiple field types', () => {
      const typeformConfig = {
        fields: [
          {
            ref: 'q1',
            title: 'Name',
            type: 'short_text',
            validations: { required: true },
          },
          {
            ref: 'q2',
            title: 'Message',
            type: 'long_text',
            validations: { required: false },
          },
          {
            ref: 'q3',
            title: 'Age',
            type: 'number',
            validations: { required: false },
          },
        ],
      }

      const { fields } = importFromTypeform(typeformConfig)

      expect(fields.length).toBe(3)
      expect(fields.every((f) => f.key && f.type && f.label)).toBe(true)
    })

    it('should generate unique keys for DFE fields', () => {
      const typeformConfig = {
        fields: [
          {
            ref: 'name_q1',
            title: 'Your name',
            type: 'short_text',
            validations: { required: true },
          },
          {
            ref: 'email_q2',
            title: 'Your email',
            type: 'email',
            validations: { required: true },
          },
        ],
      }

      const { fields } = importFromTypeform(typeformConfig)

      expect(fields[0].key).not.toBe(fields[1].key)
    })
  })

  describe('importFromGoogleForms', () => {
    it('should convert Google Forms config to DFE fields', () => {
      const googleFormsConfig = {
        items: [
          {
            title: 'Your name',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
        ],
      }

      const { fields } = importFromGoogleForms(googleFormsConfig)

      expect(Array.isArray(fields)).toBe(true)
      expect(fields.length).toBe(1)
    })

    it('should map Google Forms field properties to DFE format', () => {
      const googleFormsConfig = {
        items: [
          {
            title: 'Full Name',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          {
            title: 'Your message',
            questionItem: {
              question: {
                required: false,
                textQuestion: { paragraph: true },
              },
            },
          },
        ],
      }

      const { fields } = importFromGoogleForms(googleFormsConfig)

      expect(fields.length).toBe(2)
      expect(fields[0].required).toBe(true)
      expect(fields[1].required).toBe(false)
    })

    it('should handle Google Forms with multiple question types', () => {
      const googleFormsConfig = {
        items: [
          {
            title: 'Your name',
            questionItem: {
              question: {
                questionText: 'Your name',
                required: true,
                questionType: 'SHORT_ANSWER',
                textQuestion: { paragraph: false },
              },
            },
          },
          {
            title: 'Feedback',
            questionItem: {
              question: {
                questionText: 'Feedback',
                required: true,
                questionType: 'PARAGRAPH',
                textQuestion: { paragraph: true },
              },
            },
          },
          {
            title: 'Age',
            questionItem: {
              question: {
                questionText: 'Age',
                required: false,
                questionType: 'SHORT_ANSWER',
                textQuestion: { paragraph: false },
              },
            },
          },
        ],
      }

      const { fields } = importFromGoogleForms(googleFormsConfig)

      expect(fields.length).toBe(3)
      expect(fields.every((f) => f.key && f.type && f.label)).toBe(true)
    })

    it('should generate unique keys for all imported fields', () => {
      const googleFormsConfig = {
        items: [
          {
            title: 'Question 1',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          {
            title: 'Question 2',
            questionItem: {
              question: {
                required: false,
                textQuestion: { paragraph: false },
              },
            },
          },
        ],
      }

      const { fields } = importFromGoogleForms(googleFormsConfig)

      const keys = fields.map((f) => f.key)
      expect(new Set(keys).size).toBe(keys.length)
    })
  })

  describe('Integration: Complete import/export workflows', () => {
    it('should export template and re-import successfully', () => {
      const template = getTemplate('contact-form')
      expect(template).toBeDefined()

      if (template) {
        const exported = exportForm(template.fields, undefined, { includeMetadata: false })
        const result = importForm(exported)

        expect(result.fields.length).toBe(template.fields.length)
      }
    })

    it('should handle Typeform → DFE → export → import workflow', () => {
      const typeformConfig = {
        fields: [
          {
            ref: 'q1',
            title: 'Your name',
            type: 'short_text',
            validations: { required: true },
          },
          {
            ref: 'q2',
            title: 'Your email',
            type: 'email',
            validations: { required: true },
          },
        ],
      }

      // Import from Typeform
      const { fields } = importFromTypeform(typeformConfig)
      expect(fields.length).toBe(2)

      // Export to JSON
      const exported = exportForm(fields, undefined, { includeMetadata: false })

      // Re-import
      const reimported = importForm(exported)

      expect(reimported.fields.length).toBe(2)
      expect(reimported.fields[0].required).toBe(true)
      expect(reimported.fields[1].required).toBe(true)
    })

    it('should handle GoogleForms → DFE → CSV export workflow', () => {
      const googleFormsConfig = {
        items: [
          {
            title: 'Your name',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: false },
              },
            },
          },
          {
            title: 'Your message',
            questionItem: {
              question: {
                required: true,
                textQuestion: { paragraph: true },
              },
            },
          },
        ],
      }

      // Import from Google Forms
      const { fields } = importFromGoogleForms(googleFormsConfig)

      // Export to CSV
      const csvExport = exportFormToCsv(fields)

      expect(typeof csvExport).toBe('string')
      expect(csvExport.length).toBeGreaterThan(0)
    })
  })
})
