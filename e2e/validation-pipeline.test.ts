import { describe, it, expect, beforeEach } from 'vitest'
import { generateZodSchema, generateStepZodSchema, generateStrictSubmissionSchema, registerSchemaBuilder, createFormEngine } from '@dmc--98/dfe-core'
import { z } from 'zod'
import { makeField, resetFieldCounter, createAllFieldTypesForm, createConditionalVisibilityForm } from './helpers/fixtures'

describe('Validation Pipeline E2E Tests', () => {
  beforeEach(() => {
    resetFieldCounter()
  })

  describe('SHORT_TEXT field validation', () => {
    it('should fail validation when required SHORT_TEXT is empty string', async () => {
      const field = makeField({ key: 'field_1', type: 'SHORT_TEXT', required: true })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: '' })
      expect(result.success).toBe(false)
    })

    it('should pass validation with valid SHORT_TEXT value', async () => {
      const field = makeField({ key: 'field_2', type: 'SHORT_TEXT', required: true })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'valid text' })
      expect(result.success).toBe(true)
    })

    it('should enforce minLength constraint', async () => {
      const field = makeField({ key: 'field_3', type: 'SHORT_TEXT', config: { minLength: 3 } })
      const schema = generateZodSchema([field])

      const tooShort = schema.safeParse({ [field.key]: 'ab' })
      expect(tooShort.success).toBe(false)

      const valid = schema.safeParse({ [field.key]: 'abc' })
      expect(valid.success).toBe(true)
    })

    it('should enforce maxLength constraint', async () => {
      const field = makeField({ key: 'field_4', type: 'SHORT_TEXT', config: { maxLength: 5 } })
      const schema = generateZodSchema([field])

      const tooLong = schema.safeParse({ [field.key]: 'abcdef' })
      expect(tooLong.success).toBe(false)

      const valid = schema.safeParse({ [field.key]: 'abcd' })
      expect(valid.success).toBe(true)
    })

    it('should validate against pattern regex', async () => {
      const field = makeField({
        key: 'field_5',
        type: 'SHORT_TEXT',
        config: { pattern: '^[A-Z][a-z]+$' }
      })
      const schema = generateZodSchema([field])

      const invalid = schema.safeParse({ [field.key]: 'invalid123' })
      expect(invalid.success).toBe(false)

      const valid = schema.safeParse({ [field.key]: 'Hello' })
      expect(valid.success).toBe(true)
    })
  })

  describe('NUMBER field validation', () => {
    it('should fail when NUMBER is below min value', async () => {
      const field = makeField({ key: 'field_6', type: 'NUMBER', config: { min: 0 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: -1 })
      expect(result.success).toBe(false)
    })

    it('should fail when NUMBER is above max value', async () => {
      const field = makeField({ key: 'field_7', type: 'NUMBER', config: { max: 100 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 101 })
      expect(result.success).toBe(false)
    })

    it('should pass when NUMBER is within valid range', async () => {
      const field = makeField({ key: 'field_8', type: 'NUMBER', config: { min: 0, max: 100 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 50 })
      expect(result.success).toBe(true)
    })

    it('should enforce integer format when specified', async () => {
      const field = makeField({ key: 'field_9', type: 'NUMBER', config: { format: 'integer' } })
      const schema = generateZodSchema([field])

      const decimal = schema.safeParse({ [field.key]: 3.5 })
      expect(decimal.success).toBe(false)

      const integer = schema.safeParse({ [field.key]: 3 })
      expect(integer.success).toBe(true)
    })
  })

  describe('EMAIL field validation', () => {
    it('should fail validation with invalid email format', async () => {
      const field = makeField({ key: 'field_10', type: 'EMAIL' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'not-email' })
      expect(result.success).toBe(false)
    })

    it('should pass validation with valid email format', async () => {
      const field = makeField({ key: 'field_11', type: 'EMAIL' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'a@b.com' })
      expect(result.success).toBe(true)
    })

    it('should pass validation with complex valid email', async () => {
      const field = makeField({ key: 'field_12', type: 'EMAIL' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'user.name+tag@example.co.uk' })
      expect(result.success).toBe(true)
    })
  })

  describe('URL field validation', () => {
    it('should fail validation with invalid URL format', async () => {
      const field = makeField({ key: 'field_13', type: 'URL' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'not-url' })
      expect(result.success).toBe(false)
    })

    it('should pass validation with valid HTTPS URL', async () => {
      const field = makeField({ key: 'field_14', type: 'URL' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'https://example.com' })
      expect(result.success).toBe(true)
    })

    it('should pass validation with HTTP URL', async () => {
      const field = makeField({ key: 'field_15', type: 'URL' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'http://example.com/path' })
      expect(result.success).toBe(true)
    })
  })

  describe('PHONE field validation', () => {
    it('should pass validation with valid phone number', async () => {
      const field = makeField({ key: 'field_16', type: 'PHONE' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: '+1234567890' })
      expect(result.success).toBe(true)
    })

    it('should pass validation with various phone formats', async () => {
      const field = makeField({ key: 'field_17', type: 'PHONE' })
      const schema = generateZodSchema([field])

      const formats = [
        '+1 (555) 123-4567',
        '555-123-4567',
        '5551234567',
        '+441234567890'
      ]

      formats.forEach(phone => {
        const result = schema.safeParse({ [field.key]: phone })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('SELECT field validation', () => {
    it('should fail when selected value is not in static options', async () => {
      const field = makeField({
        key: 'field_18',
        type: 'SELECT',
        config: {
          mode: 'static',
          options: [
            { id: 'opt1', label: 'Option A', value: 'a' },
            { id: 'opt2', label: 'Option B', value: 'b' }
          ]
        }
      })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'c' })
      expect(result.success).toBe(false)
    })

    it('should pass when selected value is in static options', async () => {
      const field = makeField({
        key: 'field_19',
        type: 'SELECT',
        config: {
          mode: 'static',
          options: [
            { id: 'opt1', label: 'Option A', value: 'a' },
            { id: 'opt2', label: 'Option B', value: 'b' }
          ]
        }
      })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'a' })
      expect(result.success).toBe(true)
    })
  })

  describe('MULTI_SELECT field validation', () => {
    it('should pass with valid selected options', async () => {
      const field = makeField({
        key: 'field_20',
        type: 'MULTI_SELECT',
        config: {
          mode: 'static',
          options: [
            { id: 'opt1', label: 'Option A', value: 'a' },
            { id: 'opt2', label: 'Option B', value: 'b' },
            { id: 'opt3', label: 'Option C', value: 'c' }
          ]
        }
      })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: ['a', 'b'] })
      expect(result.success).toBe(true)
    })

    it('should fail when any selected value is not in options', async () => {
      const field = makeField({
        key: 'field_21',
        type: 'MULTI_SELECT',
        config: {
          mode: 'static',
          options: [
            { id: 'opt1', label: 'Option A', value: 'a' },
            { id: 'opt2', label: 'Option B', value: 'b' }
          ]
        }
      })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: ['c'] })
      expect(result.success).toBe(false)
    })
  })

  describe('RATING field validation', () => {
    it('should fail when rating is 0', async () => {
      const field = makeField({ key: 'field_22', type: 'RATING', config: { max: 5 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 0 })
      expect(result.success).toBe(false)
    })

    it('should pass when rating is within valid range', async () => {
      const field = makeField({ key: 'field_23', type: 'RATING', config: { max: 5 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 3 })
      expect(result.success).toBe(true)
    })

    it('should fail when rating exceeds max value', async () => {
      const field = makeField({ key: 'field_24', type: 'RATING', config: { max: 5 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 6 })
      expect(result.success).toBe(false)
    })
  })

  describe('SCALE field validation', () => {
    it('should fail when scale is below min value', async () => {
      const field = makeField({ key: 'field_25', type: 'SCALE', config: { min: 1, max: 10 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 0 })
      expect(result.success).toBe(false)
    })

    it('should pass when scale is within valid range', async () => {
      const field = makeField({ key: 'field_26', type: 'SCALE', config: { min: 1, max: 10 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 5 })
      expect(result.success).toBe(true)
    })

    it('should fail when scale exceeds max value', async () => {
      const field = makeField({ key: 'field_27', type: 'SCALE', config: { min: 1, max: 10 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 11 })
      expect(result.success).toBe(false)
    })
  })

  describe('CHECKBOX field validation', () => {
    it('should pass validation with boolean true', async () => {
      const field = makeField({ key: 'field_28', type: 'CHECKBOX' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: true })
      expect(result.success).toBe(true)
    })

    it('should pass validation with boolean false', async () => {
      const field = makeField({ key: 'field_29', type: 'CHECKBOX' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: false })
      expect(result.success).toBe(true)
    })

    it('should fail validation with non-boolean value', async () => {
      const field = makeField({ key: 'field_30', type: 'CHECKBOX' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'string' })
      expect(result.success).toBe(false)
    })
  })

  describe('FILE_UPLOAD field validation', () => {
    it('should pass validation with valid file array', async () => {
      const field = makeField({ key: 'field_31', type: 'FILE_UPLOAD', config: { maxSizeMB: 5, maxFiles: 1, allowedMimeTypes: ['application/pdf'] } })
      const schema = generateZodSchema([field])

      const fileData = [{
        name: 'document.pdf',
        size: 1000000,
        type: 'application/pdf',
        url: 'https://example.com/doc.pdf'
      }]

      const result = schema.safeParse({ [field.key]: fileData })
      expect(result.success).toBe(true)
    })

    it('should fail validation when file exceeds maxFileSize', async () => {
      const field = makeField({ key: 'field_32', type: 'FILE_UPLOAD', config: { maxSizeMB: 1, maxFiles: 1, allowedMimeTypes: ['application/pdf'] } })
      const schema = generateZodSchema([field])

      const largeFile = [{
        name: 'large.pdf',
        size: 5000000,
        type: 'application/pdf',
        url: 'https://example.com/large.pdf'
      }]

      const result = schema.safeParse({ [field.key]: largeFile })
      expect(result.success).toBe(false)
    })
  })

  describe('DATE_RANGE field validation', () => {
    it('should pass with valid date range object', async () => {
      const field = makeField({ key: 'field_33', type: 'DATE_RANGE' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({
        [field.key]: { from: '2024-01-01', to: '2024-01-31' }
      })
      expect(result.success).toBe(true)
    })

    it('should fail when from date is missing', async () => {
      const field = makeField({ key: 'field_34', type: 'DATE_RANGE' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({
        [field.key]: { to: '2024-01-31' }
      })
      expect(result.success).toBe(false)
    })

    it('should fail when to date is missing', async () => {
      const field = makeField({ key: 'field_35', type: 'DATE_RANGE' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({
        [field.key]: { from: '2024-01-01' }
      })
      expect(result.success).toBe(false)
    })
  })

  describe('ADDRESS field validation', () => {
    it('should pass with complete address object', async () => {
      const field = makeField({ key: 'field_36', type: 'ADDRESS' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({
        [field.key]: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          country: 'US'
        }
      })
      expect(result.success).toBe(true)
    })

    it('should pass with partial address object', async () => {
      const field = makeField({ key: 'field_37', type: 'ADDRESS' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({
        [field.key]: {
          street: '123 Main St',
          city: 'Springfield'
        }
      })
      expect(result.success).toBe(true)
    })
  })

  describe('SIGNATURE field validation', () => {
    it('should pass with valid data URL signature', async () => {
      const field = makeField({ key: 'field_38', type: 'SIGNATURE' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({
        [field.key]: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      })
      expect(result.success).toBe(true)
    })

    it('should fail with non-data URL', async () => {
      const field = makeField({ key: 'field_39', type: 'SIGNATURE' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'not-data-url' })
      expect(result.success).toBe(false)
    })
  })

  describe('RICH_TEXT field validation', () => {
    it('should pass with any string value', async () => {
      const field = makeField({ key: 'field_40', type: 'RICH_TEXT' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({
        [field.key]: '<h1>Hello</h1><p>World</p>'
      })
      expect(result.success).toBe(true)
    })

    it('should pass with empty rich text', async () => {
      const field = makeField({ key: 'field_41', type: 'RICH_TEXT' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: '' })
      expect(result.success).toBe(true)
    })
  })

  describe('Optional field handling', () => {
    it('should accept undefined for optional field', async () => {
      const field = makeField({ key: 'field_42', type: 'SHORT_TEXT', required: false })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: undefined })
      expect(result.success).toBe(true)
    })

    it('should accept empty string for optional field', async () => {
      const field = makeField({ key: 'field_43', type: 'SHORT_TEXT', required: false })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: '' })
      expect(result.success).toBe(true)
    })

    it('should accept null for optional field', async () => {
      const field = makeField({ key: 'field_44', type: 'SHORT_TEXT', required: false })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: null })
      expect(result.success).toBe(true)
    })
  })

  describe('Schema generation and building', () => {
    it('should generate step schema from step fields', async () => {
      const form = createAllFieldTypesForm()
      const fields = form.fields

      const schema = generateStepZodSchema(fields)
      expect(schema).toBeDefined()
      expect(schema instanceof z.ZodSchema).toBe(true)
    })

    it('should reject unknown keys in strict submission schema', async () => {
      const field = makeField({ key: 'field_45', type: 'SHORT_TEXT' })
      const schema = generateStrictSubmissionSchema([field])

      const result = schema.safeParse({
        [field.key]: 'valid',
        unknownKey: 'should be rejected'
      })

      expect(result.success).toBe(false)
    })

    it('should register custom schema builder', async () => {
      const customType = 'CUSTOM_TYPE'

      registerSchemaBuilder(customType, (field: any) => {
        return z.string().startsWith('CUSTOM_')
      })

      const field = makeField({ key: 'field_46', type: customType })
      const schema = generateZodSchema([field])

      const validResult = schema.safeParse({ [field.key]: 'CUSTOM_value' })
      expect(validResult.success).toBe(true)

      const invalidResult = schema.safeParse({ [field.key]: 'INVALID' })
      expect(invalidResult.success).toBe(false)
    })
  })

  describe('Conditional visibility in validation', () => {
    it('should include all fields in schema regardless of conditions', async () => {
      const form = createConditionalVisibilityForm()
      const fields = form.fields
      const schema = generateStepZodSchema(fields)

      // generateStepZodSchema doesn't handle conditions — all required fields must be provided
      // Provide all required field values
      const result = schema.safeParse({
        role: 'admin',
        admin_code: 'secret123',
        username: 'johndoe',
      })
      expect(result.success).toBe(true)
    })

    it('should fail validation when required fields are missing', async () => {
      const form = createConditionalVisibilityForm()
      const fields = form.fields
      const schema = generateStepZodSchema(fields)

      // Omitting required fields should cause validation failure
      const result = schema.safeParse({ role: 'user' })
      expect(result.success).toBe(false)
    })

    it('should validate only visible fields when filtered before schema generation', async () => {
      const form = createConditionalVisibilityForm()
      // Filter out conditionally hidden fields (simulating runtime behavior)
      const visibleFields = form.fields.filter((f: any) => !f.conditions)
      const schema = generateStepZodSchema(visibleFields)

      const result = schema.safeParse({ role: 'user', username: 'johndoe' })
      expect(result.success).toBe(true)
    })
  })

  describe('Complex validation scenarios', () => {
    it('should validate form with all field types', async () => {
      const form = createAllFieldTypesForm()
      const fields = form.fields
      const schema = generateStepZodSchema(fields)

      const validData: Record<string, any> = {}

      fields.forEach((field: any) => {
        if (field.type === 'SHORT_TEXT') {
          validData[field.key] = 'valid text'
        } else if (field.type === 'NUMBER') {
          validData[field.key] = 42
        } else if (field.type === 'EMAIL') {
          validData[field.key] = 'test@example.com'
        } else if (field.type === 'CHECKBOX') {
          validData[field.key] = true
        } else if (field.type === 'SELECT' || field.type === 'RADIO') {
          validData[field.key] = field.config?.options?.[0]?.value || 'option'
        } else if (field.type === 'MULTI_SELECT') {
          validData[field.key] = field.config?.options?.slice(0, 1).map((o: any) => o.value) || []
        } else if (field.type === 'RATING') {
          validData[field.key] = 3
        } else if (field.type === 'SCALE') {
          validData[field.key] = 5
        } else if (field.type === 'DATE_RANGE') {
          validData[field.key] = { from: '2024-01-01', to: '2024-01-31' }
        } else if (field.type === 'ADDRESS') {
          validData[field.key] = { street: '123 St', city: 'City' }
        } else if (field.type === 'FILE_UPLOAD') {
          validData[field.key] = [{ name: 'file.pdf', size: 1000, type: 'application/pdf', url: 'https://example.com/file.pdf' }]
        } else if (field.type === 'SIGNATURE') {
          validData[field.key] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        } else if (field.type === 'PHONE') {
          validData[field.key] = '+1234567890'
        } else if (field.type === 'URL') {
          validData[field.key] = 'https://example.com'
        } else {
          validData[field.key] = 'default value'
        }
      })

      const result = schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should handle nested validation errors with clear messages', async () => {
      const field = makeField({ key: 'field_47', type: 'SHORT_TEXT', config: { minLength: 5 } })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'ab' })
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    it('should validate partial data with optional fields', async () => {
      const requiredField = makeField({ key: 'field_48', type: 'SHORT_TEXT', required: true })
      const optionalField = makeField({ key: 'field_49', type: 'SHORT_TEXT', required: false })

      const schema = generateZodSchema([requiredField, optionalField])

      const result = schema.safeParse({ [requiredField.key]: 'required value' })
      expect(result.success).toBe(true)
    })
  })

  describe('Edge cases and special characters', () => {
    it('should handle SHORT_TEXT with special characters', async () => {
      const field = makeField({ key: 'field_50', type: 'SHORT_TEXT' })
      const schema = generateZodSchema([field])

      const specialChars = '@#$%^&*(){}[]|:;<>?,./~`'
      const result = schema.safeParse({ [field.key]: specialChars })
      expect(result.success).toBe(true)
    })

    it('should handle EMAIL with international characters', async () => {
      const field = makeField({ key: 'field_51', type: 'EMAIL' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'user+tag@example.co.uk' })
      expect(result.success).toBe(true)
    })

    it('should handle very long SHORT_TEXT without maxLength', async () => {
      const field = makeField({ key: 'field_52', type: 'SHORT_TEXT' })
      const schema = generateZodSchema([field])

      const longText = 'a'.repeat(10000)
      const result = schema.safeParse({ [field.key]: longText })
      expect(result.success).toBe(true)
    })

    it('should handle NUMBER with scientific notation', async () => {
      const field = makeField({ key: 'field_53', type: 'NUMBER' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 1e5 })
      expect(result.success).toBe(true)
    })
  })

  describe('Type coercion and validation', () => {
    it('should fail when NUMBER receives string value', async () => {
      const field = makeField({ key: 'field_54', type: 'NUMBER' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: '123' })
      expect(result.success).toBe(false)
    })

    it('should fail when CHECKBOX receives non-boolean', async () => {
      const field = makeField({ key: 'field_55', type: 'CHECKBOX' })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 1 })
      expect(result.success).toBe(false)
    })

    it('should fail when MULTI_SELECT receives non-array', async () => {
      const field = makeField({
        key: 'field_56',
        type: 'MULTI_SELECT',
        config: {
          mode: 'static',
          options: [{ id: 'opt1', label: 'A', value: 'a' }]
        }
      })
      const schema = generateZodSchema([field])

      const result = schema.safeParse({ [field.key]: 'a' })
      expect(result.success).toBe(false)
    })
  })
})
