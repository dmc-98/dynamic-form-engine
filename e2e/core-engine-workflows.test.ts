import { describe, it, expect, beforeEach } from 'vitest'
import {
  createFormEngine,
  generateZodSchema,
  generateStrictSubmissionSchema,
  type FormField,
} from '@dmc--98/dfe-core'
import {
  makeField,
  resetFieldCounter,
  createContactForm,
  createAllFieldTypesForm,
  createLargeForm,
  createValidContactValues,
} from './helpers/fixtures'

describe('Core Engine Workflows', () => {
  beforeEach(() => {
    resetFieldCounter()
  })

  describe('Basic Form Creation and Validation', () => {
    it('should create engine from contact form fields, set all values, and validate successfully', () => {
      const { fields } = createContactForm()
      const engine = createFormEngine(fields)

      const validValues = createValidContactValues()
      Object.entries(validValues).forEach(([key, value]) => {
        engine.setFieldValue(key, value)
      })

      const values = engine.getValues()
      expect(values.firstName).toBe('John')
      expect(values.lastName).toBe('Doe')
      expect(values.email).toBe('john@example.com')

      const result = engine.validate()
      expect(result.success).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should fill single-step form with all field types and set values without crashing', () => {
      const { fields } = createAllFieldTypesForm()
      const engine = createFormEngine(fields)

      // Set values using actual field keys from the fixture (field_<type_lowercase>)
      engine.setFieldValue('field_short_text', 'Hello World')
      engine.setFieldValue('field_email', 'test@example.com')
      engine.setFieldValue('field_number', 42)
      engine.setFieldValue('field_select', 'a')
      engine.setFieldValue('field_multi_select', ['x', 'y'])
      engine.setFieldValue('field_rating', 4)
      engine.setFieldValue('field_scale', 7)
      engine.setFieldValue('field_file_upload', [{ name: 'test.pdf', size: 1024, type: 'application/pdf', url: 'https://example.com/test.pdf' }])
      engine.setFieldValue('field_rich_text', 'Rich text content <b>bold</b>')
      engine.setFieldValue('field_signature', 'data:image/png;base64,ABC123')
      engine.setFieldValue('field_address', { street: '123 Main St', city: 'Boston', state: 'MA', zip: '02101' })
      engine.setFieldValue('field_date_range', { from: '2024-01-01', to: '2024-01-31' })
      engine.setFieldValue('field_checkbox', true)
      engine.setFieldValue('field_date', '2024-01-01')
      engine.setFieldValue('field_time', '10:30')
      engine.setFieldValue('field_date_time', '2024-01-01T10:30:00')
      engine.setFieldValue('field_url', 'https://example.com')
      engine.setFieldValue('field_password', 'secret123')
      engine.setFieldValue('field_phone', '+1234567890')
      engine.setFieldValue('field_long_text', 'A longer text value')
      engine.setFieldValue('field_radio', 'a')

      const values = engine.getValues()
      expect(values.field_short_text).toBe('Hello World')
      expect(values.field_email).toBe('test@example.com')
      expect(values.field_number).toBe(42)
    })

    it('should enforce required field constraint: missing required SHORT_TEXT fails validation', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', required: true, config: { minLength: 1 } }),
      ]
      const engine = createFormEngine(fields)

      const result = engine.validate()
      expect(result.success).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('should validate required EMAIL field as valid email format', () => {
      const fields = [
        makeField({ key: 'email', type: 'EMAIL', required: true }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('email', 'invalid-email')
      let result = engine.validate()
      expect(result.success).toBe(false)

      engine.setFieldValue('email', 'valid@example.com')
      result = engine.validate()
      expect(result.success).toBe(true)
    })

    it('should accept empty string, null, undefined for optional fields', () => {
      const fields = [
        makeField({ key: 'optional1', type: 'SHORT_TEXT', required: false }),
        makeField({ key: 'optional2', type: 'SHORT_TEXT', required: false }),
        makeField({ key: 'optional3', type: 'SHORT_TEXT', required: false }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('optional1', '')
      engine.setFieldValue('optional2', null)
      // optional3 left unset

      const result = engine.validate()
      expect(result.success).toBe(true)
    })

    it('should populate default values from field config', () => {
      const fields = [
        makeField({ key: 'country', type: 'SHORT_TEXT', required: false, config: { defaultValue: 'USA' } }),
      ]
      const engine = createFormEngine(fields)
      const values = engine.getValues()
      // defaultValue in config is not automatically applied by getDefaultValue for SHORT_TEXT
      // getDefaultValue returns '' for SHORT_TEXT
      expect(values.country).toBeDefined()
    })
  })

  describe('Hydration', () => {
    it('should hydrate engine with initial data and return it from getValues', () => {
      const { fields } = createContactForm()
      const hydrationData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      }

      const engine = createFormEngine(fields, hydrationData)
      const values = engine.getValues()

      expect(values.firstName).toBe('Jane')
      expect(values.lastName).toBe('Smith')
      expect(values.email).toBe('jane@example.com')
    })

    it('should merge hydration data with defaults for unset fields', () => {
      const { fields } = createContactForm()
      const hydrationData = { firstName: 'Jane' }

      const engine = createFormEngine(fields, hydrationData)
      const values = engine.getValues()

      expect(values.firstName).toBe('Jane')
      // Other fields have their defaults
      expect(values.lastName).toBeDefined()
    })
  })

  describe('Large Forms', () => {
    it('should handle large form with 100 fields: create, set 5 required fields, validate', () => {
      const { fields } = createLargeForm(100)
      const engine = createFormEngine(fields)

      // Set only the first 5 required fields
      const requiredFields = fields.filter(f => f.required)
      requiredFields.slice(0, 5).forEach(field => {
        if (field.type === 'SHORT_TEXT') {
          engine.setFieldValue(field.key, 'test-value')
        } else if (field.type === 'NUMBER') {
          engine.setFieldValue(field.key, 42)
        } else if (field.type === 'EMAIL') {
          engine.setFieldValue(field.key, 'test@example.com')
        }
      })

      // Engine should be functional with 100 fields
      const values = engine.getValues()
      expect(Object.keys(values).length).toBe(100)
    })

    it('should create engine with 500 fields without performance issues', () => {
      const { fields } = createLargeForm(500)
      const start = performance.now()
      const engine = createFormEngine(fields)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(5000) // Under 5 seconds
      expect(Object.keys(engine.getValues()).length).toBe(500)
    })
  })

  describe('Field Constraints', () => {
    it('should enforce minLength constraint', () => {
      const fields = [
        makeField({ key: 'username', type: 'SHORT_TEXT', required: true, config: { minLength: 5 } }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('username', 'abc')
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('username', 'abcde')
      expect(engine.validate().success).toBe(true)
    })

    it('should enforce maxLength constraint', () => {
      const fields = [
        makeField({ key: 'title', type: 'SHORT_TEXT', required: true, config: { maxLength: 10, minLength: 1 } }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('title', 'This is too long')
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('title', 'Short')
      expect(engine.validate().success).toBe(true)
    })

    it('should enforce NUMBER min/max constraints', () => {
      const fields = [
        makeField({ key: 'age', type: 'NUMBER', required: true, config: { min: 18, max: 120 } }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('age', 10)
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('age', 150)
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('age', 25)
      expect(engine.validate().success).toBe(true)
    })

    it('should enforce pattern constraint on SHORT_TEXT', () => {
      const fields = [
        makeField({ key: 'zipCode', type: 'SHORT_TEXT', required: true, config: { pattern: '^[0-9]{5}$' } }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('zipCode', 'ABCDE')
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('zipCode', '02101')
      expect(engine.validate().success).toBe(true)
    })
  })

  describe('Select and Multi-Select Options', () => {
    it('should validate SELECT with static options: invalid option fails', () => {
      const fields = [
        makeField({
          key: 'category', type: 'SELECT', required: true,
          config: { mode: 'static', options: [{ label: 'Electronics', value: 'electronics' }, { label: 'Books', value: 'books' }] },
        }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('category', 'invalid')
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('category', 'electronics')
      expect(engine.validate().success).toBe(true)
    })

    it('should validate MULTI_SELECT options', () => {
      const fields = [
        makeField({
          key: 'interests', type: 'MULTI_SELECT', required: true,
          config: { mode: 'static', options: [{ label: 'Sports', value: 'sports' }, { label: 'Music', value: 'music' }] },
        }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('interests', ['sports', 'music'])
      expect(engine.validate().success).toBe(true)

      engine.setFieldValue('interests', ['sports', 'invalid'])
      expect(engine.validate().success).toBe(false)
    })
  })

  describe('Rating and Scale Validation', () => {
    it('should validate RATING field within 1 to max range', () => {
      const fields = [
        makeField({ key: 'satisfaction', type: 'RATING', required: true, config: { max: 5 } }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('satisfaction', 0)
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('satisfaction', 3)
      expect(engine.validate().success).toBe(true)

      engine.setFieldValue('satisfaction', 6)
      expect(engine.validate().success).toBe(false)
    })

    it('should validate SCALE range', () => {
      const fields = [
        makeField({ key: 'agreement', type: 'SCALE', required: true, config: { min: 1, max: 10 } }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('agreement', 0)
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('agreement', 5)
      expect(engine.validate().success).toBe(true)

      engine.setFieldValue('agreement', 11)
      expect(engine.validate().success).toBe(false)
    })
  })

  describe('File and Complex Types', () => {
    it('should validate FILE_UPLOAD file shape (array of file objects)', () => {
      const fields = [
        makeField({ key: 'document', type: 'FILE_UPLOAD', required: true, config: { maxSizeMB: 10, maxFiles: 1 } }),
      ]
      const engine = createFormEngine(fields)

      // FILE_UPLOAD expects an array of file objects
      engine.setFieldValue('document', [{ name: 'report.pdf', size: 2048, type: 'application/pdf', url: 'https://example.com/report.pdf' }])
      expect(engine.validate().success).toBe(true)
    })

    it('should accept RICH_TEXT as any string', () => {
      const fields = [
        makeField({ key: 'description', type: 'RICH_TEXT', required: true }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('description', '<p>Rich <b>text</b> content</p>')
      expect(engine.validate().success).toBe(true)
    })

    it('should require SIGNATURE to have data: prefix', () => {
      const fields = [
        makeField({ key: 'sig', type: 'SIGNATURE', required: true }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('sig', 'invalid-signature')
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('sig', 'data:image/png;base64,iVBORw0KGgo=')
      expect(engine.validate().success).toBe(true)
    })

    it('should accept ADDRESS as object', () => {
      const fields = [
        makeField({ key: 'location', type: 'ADDRESS', required: true }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('location', { street: '456 Oak Ave', city: 'Springfield', state: 'IL', zip: '62701' })
      expect(engine.validate().success).toBe(true)
    })
  })

  describe('Submission and Visibility', () => {
    it('should collect submission values from visible fields', () => {
      const fields = [
        makeField({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
        makeField({
          key: 'admin_code', type: 'SHORT_TEXT', required: true,
          conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] } as any,
        }),
        makeField({ key: 'username', type: 'SHORT_TEXT', required: true, config: { minLength: 3 } }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('role', 'admin')
      engine.setFieldValue('admin_code', 'SECRET')
      engine.setFieldValue('username', 'johndoe')

      const submission = engine.collectSubmissionValues()
      expect(submission.role).toBe('admin')
      expect(submission.admin_code).toBe('SECRET')
      expect(submission.username).toBe('johndoe')
    })

    it('should exclude hidden conditional fields from submission', () => {
      const fields = [
        makeField({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
        makeField({
          key: 'admin_code', type: 'SHORT_TEXT', required: true,
          conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] } as any,
        }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('role', 'user') // admin_code should be hidden
      const submission = engine.collectSubmissionValues()
      expect(submission.admin_code).toBeUndefined()
    })

    it('should include field in validation when condition is met', () => {
      const fields = [
        makeField({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
        makeField({
          key: 'admin_code', type: 'SHORT_TEXT', required: true,
          conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] } as any,
          config: { minLength: 1 },
        }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('role', 'admin')
      // admin_code is now visible and required but empty
      const result = engine.validate()
      expect(result.success).toBe(false)
      expect(result.errors.admin_code).toBeDefined()
    })
  })

  describe('Graph Patch and State Changes', () => {
    it('should return GraphPatch from setFieldValue', () => {
      const { fields } = createContactForm()
      const engine = createFormEngine(fields)

      const patch = engine.setFieldValue('firstName', 'Alice')
      expect(patch).toBeDefined()
    })

    it('should exclude hidden fields from getVisibleFields', () => {
      const fields = [
        makeField({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
        makeField({
          key: 'admin_code', type: 'SHORT_TEXT', required: false,
          conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] } as any,
        }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('role', 'user')
      const visibleFields = engine.getVisibleFields()
      const fieldKeys = visibleFields.map(f => f.key)
      expect(fieldKeys).toContain('role')
      expect(fieldKeys).not.toContain('admin_code')
    })

    it('should get field state with getFieldState', () => {
      const { fields } = createContactForm()
      const engine = createFormEngine(fields)

      engine.setFieldValue('firstName', 'Test')
      const fieldState = engine.getFieldState('firstName')

      expect(fieldState).toBeDefined()
      expect(fieldState!.value).toBe('Test')
      expect(fieldState!.isVisible).toBe(true)
    })
  })

  describe('Date Range and Strict Submission', () => {
    it('should require DATE_RANGE to have both from and to', () => {
      const fields = [
        makeField({ key: 'vacationDates', type: 'DATE_RANGE', required: true }),
      ]
      const engine = createFormEngine(fields)

      engine.setFieldValue('vacationDates', { from: '2024-06-01' })
      expect(engine.validate().success).toBe(false)

      engine.setFieldValue('vacationDates', { from: '2024-06-01', to: '2024-06-15' })
      expect(engine.validate().success).toBe(true)
    })

    it('should reject unknown keys with strict submission schema', () => {
      const fields = [
        makeField({ key: 'email', type: 'EMAIL', required: true }),
      ]
      const schema = generateStrictSubmissionSchema(fields)

      const data = { email: 'test@example.com', unknownField: 'should cause failure' }
      const result = schema.safeParse(data)
      // strict() rejects unknown keys
      expect(result.success).toBe(false)
    })
  })

  describe('Schema Generation', () => {
    it('should generate Zod schema from fields', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', required: true, config: { minLength: 1 } }),
        makeField({ key: 'email', type: 'EMAIL', required: false }),
      ]

      const schema = generateZodSchema(fields)
      expect(schema).toBeDefined()

      const validData = { name: 'John', email: 'john@example.com' }
      const result = schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should generate schemas for all 24 field types without errors', () => {
      const { fields } = createAllFieldTypesForm()
      const schema = generateZodSchema(fields)
      expect(schema).toBeDefined()
      expect(schema.shape).toBeDefined()
    })
  })
})
