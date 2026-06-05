import { describe, it, expect } from 'vitest'
import { toJsonSchema, fromJsonSchema } from '../src/json-schema'
import type { FormField, JsonSchema } from '../src/json-schema'

/**
 * Round-trip tests for JSON Schema conversion.
 *
 * These tests verify that:
 * - DFE fields can be converted to JSON Schema
 * - JSON Schema can be converted back to DFE fields
 * - Round-trip conversions preserve essential information
 * - All field types map correctly
 * - Constraints and options are preserved
 */

// ─── Test Helpers ───────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField> & { key: string }): FormField {
  return {
    id: overrides.id ?? `field_${overrides.key}`,
    versionId: overrides.versionId ?? 'v1',
    key: overrides.key,
    label: overrides.label ?? overrides.key,
    description: overrides.description ?? null,
    type: overrides.type ?? 'SHORT_TEXT',
    required: overrides.required ?? false,
    order: overrides.order ?? 0,
    config: overrides.config ?? {},
    stepId: overrides.stepId ?? null,
    sectionId: overrides.sectionId ?? null,
    parentFieldId: overrides.parentFieldId ?? null,
    conditions: overrides.conditions ?? null,
    children: overrides.children,
  }
}

// ─── toJsonSchema Tests ──────────────────────────────────────────────────────

describe('toJsonSchema', () => {
  describe('basic structure', () => {
    it('should create valid JSON Schema object', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: true })]
      const schema = toJsonSchema(fields)

      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#')
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.required).toBeDefined()
    })

    it('should include title when provided', () => {
      const fields = [makeField({ key: 'name' })]
      const schema = toJsonSchema(fields, 'User Form')

      expect(schema.title).toBe('User Form')
    })

    it('should omit title when not provided', () => {
      const fields = [makeField({ key: 'name' })]
      const schema = toJsonSchema(fields)

      expect(schema.title).toBeUndefined()
    })
  })

  describe('field type mapping', () => {
    it('should map SHORT_TEXT to string', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.name.type).toBe('string')
    })

    it('should map LONG_TEXT to string', () => {
      const fields = [makeField({ key: 'bio', type: 'LONG_TEXT' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.bio.type).toBe('string')
    })

    it('should map NUMBER to number', () => {
      const fields = [makeField({ key: 'age', type: 'NUMBER' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.age.type).toBe('number')
    })

    it('should map EMAIL with format', () => {
      const fields = [makeField({ key: 'email', type: 'EMAIL' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.email.type).toBe('string')
      expect(schema.properties.email.format).toBe('email')
    })

    it('should map PHONE with format', () => {
      const fields = [makeField({ key: 'phone', type: 'PHONE' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.phone.type).toBe('string')
      expect(schema.properties.phone.format).toBe('phone')
    })

    it('should map URL with uri format', () => {
      const fields = [makeField({ key: 'website', type: 'URL' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.website.type).toBe('string')
      expect(schema.properties.website.format).toBe('uri')
    })

    it('should map DATE with date format', () => {
      const fields = [makeField({ key: 'birthDate', type: 'DATE' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.birthDate.type).toBe('string')
      expect(schema.properties.birthDate.format).toBe('date')
    })

    it('should map TIME with time format', () => {
      const fields = [makeField({ key: 'meetingTime', type: 'TIME' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.meetingTime.type).toBe('string')
      expect(schema.properties.meetingTime.format).toBe('time')
    })

    it('should map DATE_TIME with date-time format', () => {
      const fields = [makeField({ key: 'meetingDateTime', type: 'DATE_TIME' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.meetingDateTime.type).toBe('string')
      expect(schema.properties.meetingDateTime.format).toBe('date-time')
    })

    it('should map DATE_RANGE to object', () => {
      const fields = [makeField({ key: 'dateRange', type: 'DATE_RANGE' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.dateRange.type).toBe('object')
    })

    it('should map CHECKBOX to boolean', () => {
      const fields = [makeField({ key: 'subscribe', type: 'CHECKBOX' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.subscribe.type).toBe('boolean')
    })

    it('should map SELECT to string', () => {
      const fields = [makeField({ key: 'country', type: 'SELECT' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.country.type).toBe('string')
    })

    it('should map RADIO to string', () => {
      const fields = [makeField({ key: 'gender', type: 'RADIO' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.gender.type).toBe('string')
    })

    it('should map MULTI_SELECT to array', () => {
      const fields = [makeField({ key: 'interests', type: 'MULTI_SELECT' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.interests.type).toBe('array')
    })

    it('should map RATING to integer', () => {
      const fields = [makeField({ key: 'rating', type: 'RATING' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.rating.type).toBe('integer')
    })

    it('should map SCALE to integer', () => {
      const fields = [makeField({ key: 'scale', type: 'SCALE' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.scale.type).toBe('integer')
    })

    it('should map PASSWORD to string', () => {
      const fields = [makeField({ key: 'password', type: 'PASSWORD' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.password.type).toBe('string')
    })

    it('should map HIDDEN to string', () => {
      const fields = [makeField({ key: 'sessionId', type: 'HIDDEN' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.sessionId.type).toBe('string')
    })

    it('should map FILE_UPLOAD with uri format', () => {
      const fields = [makeField({ key: 'document', type: 'FILE_UPLOAD' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.document.type).toBe('string')
      expect(schema.properties.document.format).toBe('uri')
    })

    it('should map RICH_TEXT to string', () => {
      const fields = [makeField({ key: 'content', type: 'RICH_TEXT' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.content.type).toBe('string')
    })

    it('should map SIGNATURE with data-url format', () => {
      const fields = [makeField({ key: 'signature', type: 'SIGNATURE' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.signature.type).toBe('string')
      expect(schema.properties.signature.format).toBe('data-url')
    })

    it('should map ADDRESS to object', () => {
      const fields = [makeField({ key: 'address', type: 'ADDRESS' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.address.type).toBe('object')
    })
  })

  describe('constraints mapping', () => {
    it('should include minLength constraint', () => {
      const fields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          config: { minLength: 3 },
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.username.minLength).toBe(3)
    })

    it('should include maxLength constraint', () => {
      const fields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          config: { maxLength: 20 },
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.username.maxLength).toBe(20)
    })

    it('should include min constraint as minimum', () => {
      const fields = [
        makeField({
          key: 'age',
          type: 'NUMBER',
          config: { min: 0 },
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.age.minimum).toBe(0)
    })

    it('should include max constraint as maximum', () => {
      const fields = [
        makeField({
          key: 'age',
          type: 'NUMBER',
          config: { max: 150 },
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.age.maximum).toBe(150)
    })

    it('should include pattern constraint', () => {
      const fields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          config: { pattern: '^[a-z0-9_]+$' },
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.username.pattern).toBe('^[a-z0-9_]+$')
    })
  })

  describe('options mapping', () => {
    it('should map SELECT options to enum', () => {
      const fields = [
        makeField({
          key: 'country',
          type: 'SELECT',
          config: {
            mode: 'static',
            options: [
              { label: 'USA', value: 'us' },
              { label: 'Canada', value: 'ca' },
            ],
          },
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.country.enum).toEqual(['us', 'ca'])
    })

    it('should map RADIO options to enum', () => {
      const fields = [
        makeField({
          key: 'gender',
          type: 'RADIO',
          config: {
            mode: 'static',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ],
          },
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.gender.enum).toEqual(['male', 'female'])
    })

    it('should map MULTI_SELECT options to array items enum', () => {
      const fields = [
        makeField({
          key: 'interests',
          type: 'MULTI_SELECT',
          config: {
            mode: 'static',
            options: [
              { label: 'Sports', value: 'sports' },
              { label: 'Music', value: 'music' },
            ],
          },
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.interests.items.enum).toEqual(['sports', 'music'])
    })
  })

  describe('required fields', () => {
    it('should mark required fields', () => {
      const fields = [
        makeField({ key: 'name', type: 'SHORT_TEXT', required: true }),
        makeField({ key: 'age', type: 'NUMBER', required: false }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.required).toContain('name')
      expect(schema.required).not.toContain('age')
    })
  })

  describe('field metadata', () => {
    it('should include field label as title', () => {
      const fields = [makeField({ key: 'email', label: 'Email Address' })]
      const schema = toJsonSchema(fields)

      expect(schema.properties.email.title).toBe('Email Address')
    })

    it('should include field description', () => {
      const fields = [
        makeField({
          key: 'email',
          description: 'Your primary email address',
        }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.email.description).toBe('Your primary email address')
    })
  })

  describe('excluded field types', () => {
    it('should exclude SECTION_BREAK', () => {
      const fields = [
        makeField({ key: 'section', type: 'SECTION_BREAK' }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.section).toBeUndefined()
    })

    it('should exclude FIELD_GROUP', () => {
      const fields = [
        makeField({ key: 'group', type: 'FIELD_GROUP' }),
      ]
      const schema = toJsonSchema(fields)

      expect(schema.properties.group).toBeUndefined()
    })
  })
})

// ─── fromJsonSchema Tests ────────────────────────────────────────────────────

describe('fromJsonSchema', () => {
  describe('basic conversion', () => {
    it('should convert basic JSON Schema to fields', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
        },
        required: ['name'],
      }

      const fields = fromJsonSchema(schema)

      expect(fields.length).toBe(1)
      expect(fields[0].key).toBe('name')
      expect(fields[0].required).toBe(true)
    })

    it('should set field order sequentially', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          field1: { type: 'string' },
          field2: { type: 'string' },
          field3: { type: 'string' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      fields.forEach((field, index) => {
        expect(field.order).toBe(index)
      })
    })
  })

  describe('type inference', () => {
    it('should infer SHORT_TEXT for basic string', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          text: { type: 'string' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('SHORT_TEXT')
    })

    it('should infer LONG_TEXT for string with maxLength > 255', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          bio: { type: 'string', maxLength: 500 },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('LONG_TEXT')
    })

    it('should infer EMAIL from format', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('EMAIL')
    })

    it('should infer URL from uri format', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          website: { type: 'string', format: 'uri' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('URL')
    })

    it('should infer PHONE from phone format', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          phone: { type: 'string', format: 'phone' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('PHONE')
    })

    it('should infer DATE from date format', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('DATE')
    })

    it('should infer TIME from time format', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          time: { type: 'string', format: 'time' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('TIME')
    })

    it('should infer DATE_TIME from date-time format', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          datetime: { type: 'string', format: 'date-time' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('DATE_TIME')
    })

    it('should infer SIGNATURE from data-url format', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          sig: { type: 'string', format: 'data-url' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('SIGNATURE')
    })

    it('should infer NUMBER from number type', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          price: { type: 'number' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('NUMBER')
    })

    it('should infer NUMBER from integer type', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          count: { type: 'integer' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('NUMBER')
    })

    it('should infer CHECKBOX from boolean type', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          agree: { type: 'boolean' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('CHECKBOX')
    })

    it('should infer SELECT from enum', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          country: { enum: ['us', 'ca'] },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('SELECT')
    })

    it('should infer MULTI_SELECT from array with enum items', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          interests: { type: 'array', items: { enum: ['sports', 'music'] } },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('MULTI_SELECT')
    })

    it('should infer FIELD_GROUP from object type', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          address: { type: 'object' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].type).toBe('FIELD_GROUP')
    })
  })

  describe('constraints preservation', () => {
    it('should preserve minLength constraint', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3 },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].config.minLength).toBe(3)
    })

    it('should preserve maxLength constraint', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          username: { type: 'string', maxLength: 20 },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].config.maxLength).toBe(20)
    })

    it('should preserve min constraint', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          age: { type: 'integer', minimum: 0 },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].config.min).toBe(0)
    })

    it('should preserve max constraint', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          age: { type: 'integer', maximum: 150 },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].config.max).toBe(150)
    })

    it('should preserve pattern constraint', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          username: { type: 'string', pattern: '^[a-z0-9_]+$' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].config.pattern).toBe('^[a-z0-9_]+$')
    })
  })

  describe('options preservation', () => {
    it('should convert enum to SELECT options', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          country: { enum: ['us', 'ca', 'mx'] },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].config.options?.length).toBe(3)
      expect(fields[0].config.options?.[0]).toEqual({ label: 'us', value: 'us' })
    })

    it('should convert array items enum to MULTI_SELECT options', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          interests: { type: 'array', items: { enum: ['sports', 'music', 'reading'] } },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].config.options?.length).toBe(3)
      expect(fields[0].config.options?.[0]).toEqual({ label: 'sports', value: 'sports' })
    })
  })

  describe('metadata preservation', () => {
    it('should use JSON Schema title as label', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          email: { type: 'string', title: 'Email Address' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].label).toBe('Email Address')
    })

    it('should use key as fallback label', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          email: { type: 'string' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].label).toBe('email')
    })

    it('should preserve description', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Your email address' },
        },
        required: [],
      }

      const fields = fromJsonSchema(schema)

      expect(fields[0].description).toBe('Your email address')
    })
  })
})

// ─── Round-Trip Tests ────────────────────────────────────────────────────────

describe('Round-trip conversion', () => {
  it('should preserve required fields in round-trip', () => {
    const originalFields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', required: true }),
      makeField({ key: 'email', type: 'EMAIL', required: true }),
      makeField({ key: 'phone', type: 'PHONE', required: false }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    expect(reconstructed[0].required).toBe(true)
    expect(reconstructed[1].required).toBe(true)
    expect(reconstructed[2].required).toBe(false)
  })

  it('should preserve field types in round-trip', () => {
    const originalFields = [
      makeField({ key: 'email', type: 'EMAIL' }),
      makeField({ key: 'phone', type: 'PHONE' }),
      makeField({ key: 'website', type: 'URL' }),
      makeField({ key: 'date', type: 'DATE' }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    // Types should match or be inferred correctly
    expect(reconstructed.find(f => f.key === 'email')?.type).toBe('EMAIL')
    expect(reconstructed.find(f => f.key === 'phone')?.type).toBe('PHONE')
    expect(reconstructed.find(f => f.key === 'website')?.type).toBe('URL')
    expect(reconstructed.find(f => f.key === 'date')?.type).toBe('DATE')
  })

  it('should preserve text constraints in round-trip', () => {
    const originalFields = [
      makeField({
        key: 'username',
        type: 'SHORT_TEXT',
        config: { minLength: 3, maxLength: 20, pattern: '^[a-z0-9_]+$' },
      }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    expect(reconstructed[0].config.minLength).toBe(3)
    expect(reconstructed[0].config.maxLength).toBe(20)
    expect(reconstructed[0].config.pattern).toBe('^[a-z0-9_]+$')
  })

  it('should preserve number constraints in round-trip', () => {
    const originalFields = [
      makeField({
        key: 'age',
        type: 'NUMBER',
        config: { min: 0, max: 150 },
      }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    expect(reconstructed[0].config.min).toBe(0)
    expect(reconstructed[0].config.max).toBe(150)
  })

  it('should preserve select options in round-trip', () => {
    const originalFields = [
      makeField({
        key: 'country',
        type: 'SELECT',
        config: {
          mode: 'static',
          options: [
            { label: 'USA', value: 'us' },
            { label: 'Canada', value: 'ca' },
          ],
        },
      }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    const reconstructedOptions = reconstructed[0].config.options
    expect(reconstructedOptions?.length).toBe(2)
    expect(reconstructedOptions?.[0].value).toBe('us')
    expect(reconstructedOptions?.[1].value).toBe('ca')
  })

  it('should preserve multi-select options in round-trip', () => {
    const originalFields = [
      makeField({
        key: 'interests',
        type: 'MULTI_SELECT',
        config: {
          mode: 'static',
          options: [
            { label: 'Sports', value: 'sports' },
            { label: 'Music', value: 'music' },
            { label: 'Reading', value: 'reading' },
          ],
        },
      }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    const reconstructedOptions = reconstructed[0].config.options
    expect(reconstructedOptions?.length).toBe(3)
    expect(reconstructedOptions?.map(o => o.value)).toEqual(['sports', 'music', 'reading'])
  })

  it('should maintain field order in round-trip', () => {
    const originalFields = [
      makeField({ key: 'field_a', order: 0 }),
      makeField({ key: 'field_b', order: 1 }),
      makeField({ key: 'field_c', order: 2 }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    expect(reconstructed[0].key).toBe('field_a')
    expect(reconstructed[1].key).toBe('field_b')
    expect(reconstructed[2].key).toBe('field_c')
  })
})

// ─── Complex Field Type Round-Trip Tests ─────────────────────────────────────

describe('Complex field type round-trips', () => {
  it('should handle all text field variants', () => {
    const originalFields = [
      makeField({ key: 'name', type: 'SHORT_TEXT' }),
      makeField({ key: 'bio', type: 'LONG_TEXT', config: { maxLength: 500 } }),
      makeField({ key: 'email', type: 'EMAIL' }),
      makeField({ key: 'phone', type: 'PHONE' }),
      makeField({ key: 'website', type: 'URL' }),
      makeField({ key: 'password', type: 'PASSWORD' }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    expect(reconstructed.length).toBe(6)
    expect(reconstructed.some(f => f.type === 'EMAIL')).toBe(true)
    expect(reconstructed.some(f => f.type === 'PHONE')).toBe(true)
    expect(reconstructed.some(f => f.type === 'URL')).toBe(true)
  })

  it('should handle all date/time field variants', () => {
    const originalFields = [
      makeField({ key: 'date', type: 'DATE' }),
      makeField({ key: 'time', type: 'TIME' }),
      makeField({ key: 'datetime', type: 'DATE_TIME' }),
      makeField({ key: 'daterange', type: 'DATE_RANGE' }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    expect(reconstructed.find(f => f.key === 'date')?.type).toBe('DATE')
    expect(reconstructed.find(f => f.key === 'time')?.type).toBe('TIME')
    expect(reconstructed.find(f => f.key === 'datetime')?.type).toBe('DATE_TIME')
    expect(reconstructed.find(f => f.key === 'daterange')?.type).toBe('DATE_RANGE')
  })

  it('should handle all selection field variants', () => {
    const originalFields = [
      makeField({
        key: 'select',
        type: 'SELECT',
        config: {
          mode: 'static',
          options: [{ label: 'Option', value: 'opt' }],
        },
      }),
      makeField({
        key: 'radio',
        type: 'RADIO',
        config: {
          mode: 'static',
          options: [{ label: 'Option', value: 'opt' }],
        },
      }),
      makeField({
        key: 'multi',
        type: 'MULTI_SELECT',
        config: {
          mode: 'static',
          options: [{ label: 'Option', value: 'opt' }],
        },
      }),
    ]

    const schema = toJsonSchema(originalFields)
    const reconstructed = fromJsonSchema(schema)

    expect(reconstructed.find(f => f.key === 'select')?.type).toBe('SELECT')
    expect(reconstructed.find(f => f.key === 'radio')?.type).toBe('RADIO')
    expect(reconstructed.find(f => f.key === 'multi')?.type).toBe('MULTI_SELECT')
  })
})
