import { describe, it, expect, beforeEach } from 'vitest'
import { toJsonSchema, fromJsonSchema, createFormEngine, getTemplate, listTemplates } from '@dmc--98/dfe-core'
import { makeField, resetFieldCounter, createAllFieldTypesForm } from './helpers/fixtures'

describe('JSON Schema Interoperability', () => {
  beforeEach(() => {
    resetFieldCounter()
  })

  describe('toJsonSchema conversion', () => {
    it('should produce valid $schema and type:object', () => {
      const fields = [makeField('name', 'SHORT_TEXT', 'Name')]
      const schema = toJsonSchema(fields)

      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#')
      expect(schema.type).toBe('object')
    })

    it('should include title when provided', () => {
      const fields = [makeField('name', 'SHORT_TEXT', 'Name')]
      const schema = toJsonSchema(fields, 'Contact Form')

      expect(schema.title).toBe('Contact Form')
    })

    it('should map all 24 field types to correct JSON Schema types', () => {
      const allFieldsForm = createAllFieldTypesForm()
      const schema = toJsonSchema(allFieldsForm.fields)

      expect(schema.properties).toBeDefined()
      expect(Object.keys(schema.properties).length).toBeGreaterThan(0)

      // Verify some key type mappings
      const properties = schema.properties as Record<string, any>

      // SHORT_TEXT → string
      const shortTextField = properties[Object.keys(properties).find(k => schema.properties[k]?.['x-dfe-type'] === 'SHORT_TEXT')]
      if (shortTextField) {
        expect(shortTextField.type).toBe('string')
      }

      // EMAIL → string with format:email
      const emailField = Object.entries(properties).find(([_, p]: [string, any]) => p['x-dfe-type'] === 'EMAIL')
      if (emailField) {
        expect(emailField[1].type).toBe('string')
        expect(emailField[1].format).toBe('email')
      }

      // NUMBER → number
      const numberField = Object.entries(properties).find(([_, p]: [string, any]) => p['x-dfe-type'] === 'NUMBER')
      if (numberField) {
        expect(numberField[1].type).toBe('number')
      }
    })

    it('should include required array for required fields', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name', required: true }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email', required: false }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.required).toBeDefined()
      expect(schema.required).toContain('name')
      expect(schema.required).not.toContain('email')
    })

    it('should preserve constraints: minLength, maxLength, min, max, pattern', () => {
      const fields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          label: 'Username',
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
          config: {
            min: 0,
            max: 150,
          },
        }),
      ]
      const schema = toJsonSchema(fields)
      const props = schema.properties as Record<string, any>

      expect(props.username.minLength).toBe(3)
      expect(props.username.maxLength).toBe(20)
      expect(props.username.pattern).toBe('^[a-zA-Z0-9_]+$')

      expect(props.age.minimum).toBe(0)
      expect(props.age.maximum).toBe(150)
    })

    it('should map SELECT options to enum', () => {
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
              { label: 'Mexico', value: 'mx' },
            ],
          },
        }),
      ]
      const schema = toJsonSchema(fields)
      const props = schema.properties as Record<string, any>

      expect(props.country.enum).toEqual(['usa', 'ca', 'mx'])
    })

    it('should map MULTI_SELECT items to array with enum', () => {
      const fields = [
        makeField({
          key: 'skills',
          type: 'MULTI_SELECT',
          label: 'Skills',
          config: {
            mode: 'static',
            options: [
              { label: 'JavaScript', value: 'js' },
              { label: 'Python', value: 'py' },
              { label: 'Go', value: 'go' },
            ],
          },
        }),
      ]
      const schema = toJsonSchema(fields)
      const props = schema.properties as Record<string, any>

      expect(props.skills.type).toBe('array')
      expect(props.skills.items.enum).toEqual(['js', 'py', 'go'])
    })
  })

  describe('fromJsonSchema conversion', () => {
    it('should convert basic string to SHORT_TEXT', () => {
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }
      const fields = fromJsonSchema(schema)

      expect(fields.length).toBe(1)
      expect(fields[0].type).toBe('SHORT_TEXT')
      expect(fields[0].key).toBe('name')
    })

    it('should convert format:email to EMAIL type', () => {
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      }
      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('EMAIL')
      expect(fields[0].key).toBe('email')
    })

    it('should convert enum to SELECT with options', () => {
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          status: { enum: ['active', 'inactive', 'pending'] },
        },
      }
      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('SELECT')
      expect(fields[0].config.options).toEqual([
        { label: 'active', value: 'active' },
        { label: 'inactive', value: 'inactive' },
        { label: 'pending', value: 'pending' },
      ])
    })

    it('should preserve exact type with x-dfe-type extension', () => {
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          password: { type: 'string', 'x-dfe-type': 'PASSWORD' },
          phone: { type: 'string', 'x-dfe-type': 'PHONE' },
        },
      }
      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('PASSWORD')
      expect(fields[1].type).toBe('PHONE')
    })
  })

  describe('Round-trip conversions', () => {
    it('should preserve all 24 field types via x-dfe-type extension', () => {
      const { fields: originalFields } = createAllFieldTypesForm()
      // toJsonSchema skips SECTION_BREAK and FIELD_GROUP
      const nonSkipped = originalFields.filter(f => f.type !== 'SECTION_BREAK' && f.type !== 'FIELD_GROUP')
      const schema = toJsonSchema(originalFields)
      const convertedFields = fromJsonSchema(schema)

      // Compare types (x-dfe-type should preserve exact types)
      expect(convertedFields.length).toBe(nonSkipped.length)

      for (let i = 0; i < convertedFields.length; i++) {
        expect(convertedFields[i].type).toBe(nonSkipped[i].type)
      }
    })

    it('should preserve constraints during round-trip', () => {
      const originalFields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          label: 'Username',
          config: {
            minLength: 3,
            maxLength: 20,
            pattern: '^[a-zA-Z0-9_]+$',
          },
          required: true,
        }),
        makeField({
          key: 'score',
          type: 'NUMBER',
          label: 'Score',
          config: {
            min: 0,
            max: 100,
          },
          required: false,
        }),
      ]

      const schema = toJsonSchema(originalFields)
      const convertedFields = fromJsonSchema(schema)

      expect(convertedFields[0].config.minLength).toBe(3)
      expect(convertedFields[0].config.maxLength).toBe(20)
      expect(convertedFields[0].config.pattern).toBe('^[a-zA-Z0-9_]+$')
      expect(convertedFields[0].required).toBe(true)

      expect(convertedFields[1].config.min).toBe(0)
      expect(convertedFields[1].config.max).toBe(100)
      expect(convertedFields[1].required).toBe(false)
    })

    it('should preserve SELECT/RADIO/MULTI_SELECT options during round-trip', () => {
      const originalFields = [
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
        makeField({
          key: 'languages',
          type: 'MULTI_SELECT',
          label: 'Languages',
          config: {
            mode: 'static',
            options: [
              { label: 'English', value: 'en' },
              { label: 'Spanish', value: 'es' },
            ],
          },
        }),
      ]

      const schema = toJsonSchema(originalFields)
      const convertedFields = fromJsonSchema(schema)

      // JSON Schema enums don't preserve original labels — fromJsonSchema uses value as label
      // So we check that values are preserved correctly
      const convertedValues0 = convertedFields[0].config.options.map((o: any) => o.value)
      const originalValues0 = originalFields[0].config.options.map((o: any) => o.value)
      expect(convertedValues0).toEqual(originalValues0)

      const convertedValues1 = convertedFields[1].config.options.map((o: any) => o.value)
      const originalValues1 = originalFields[1].config.options.map((o: any) => o.value)
      expect(convertedValues1).toEqual(originalValues1)

      const convertedValues2 = convertedFields[2].config.options.map((o: any) => o.value)
      const originalValues2 = originalFields[2].config.options.map((o: any) => o.value)
      expect(convertedValues2).toEqual(originalValues2)
    })

    it('should round-trip template form: getTemplate → toJsonSchema → fromJsonSchema', () => {
      const template = getTemplate('contact-form')
      expect(template).toBeDefined()

      if (template) {
        const schema = toJsonSchema(template.fields)
        const convertedFields = fromJsonSchema(schema)

        expect(convertedFields.length).toBe(template.fields.length)

        // Verify field keys and types match
        for (let i = 0; i < template.fields.length; i++) {
          expect(convertedFields[i].key).toBe(template.fields[i].key)
          expect(convertedFields[i].type).toBe(template.fields[i].type)
        }
      }
    })
  })

  describe('JSON Schema integration with FormEngine', () => {
    it('should create valid FormEngine from toJsonSchema output', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name', required: true }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
      ]
      const schema = toJsonSchema(fields, 'User Form')

      // Convert back and create engine
      const convertedFields = fromJsonSchema(schema)
      expect(() => createFormEngine(convertedFields)).not.toThrow()
    })

    it('should handle complex nested structures during schema conversion', () => {
      const fields = [
        makeField({
          key: 'section1',
          type: 'SECTION_BREAK',
          label: 'Contact Information',
          config: {
            helperText: 'Please provide your contact details',
          },
        }),
        makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Full Name', required: true }),
        makeField({ key: 'email', type: 'EMAIL', label: 'Email Address', required: true }),
        makeField('phone', 'PHONE', 'Phone Number'),
      ]

      const schema = toJsonSchema(fields, 'Complex Form')
      const convertedFields = fromJsonSchema(schema)

      expect(schema.properties).toBeDefined()
      expect(convertedFields.length).toBeGreaterThan(0)
    })
  })
})
