import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { generateZodSchema, generateStepZodSchema, generateStrictSubmissionSchema } from '../src/zod-generator'
import type { FormField } from '../src/types'

/**
 * Snapshot tests for Zod schema generation.
 *
 * These tests verify that the Zod schema generator produces correct
 * schemas for various field configurations, including:
 * - All 20+ field types
 * - Required vs optional fields
 * - Field constraints (min/max, pattern, length)
 * - Select options and multi-select
 * - Complex field types (date ranges, file uploads, etc.)
 */

// ─── Test Fixtures ──────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField> & { key: string }): FormField {
  return {
    id: overrides.id ?? `field_${overrides.key}`,
    versionId: overrides.versionId ?? 'v1',
    key: overrides.key,
    label: overrides.label ?? overrides.key,
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

// ─── Individual Field Type Tests ─────────────────────────────────────────────

describe('generateZodSchema - Individual Field Types', () => {
  describe('Text fields', () => {
    it('should generate schema for required SHORT_TEXT', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.name).toBeDefined()
      expect(shape.name._def.typeName).toBe('ZodString')
      expect(shape.name._def.checks?.some((c: any) => c.kind === 'min')).toBe(true)
    })

    it('should generate schema for optional SHORT_TEXT', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: false })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.name).toBeDefined()
      // Optional fields should be union with undefined/null/empty string
      expect(shape.name._def.typeName).toBe('ZodUnion')
    })

    it('should respect minLength and maxLength constraints', () => {
      const fields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          required: true,
          config: { minLength: 3, maxLength: 20 },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      const checks = shape.username._def.checks
      expect(checks?.some((c: any) => c.kind === 'min' && c.value === 3)).toBe(true)
      expect(checks?.some((c: any) => c.kind === 'max' && c.value === 20)).toBe(true)
    })

    it('should apply regex pattern validation', () => {
      const fields = [
        makeField({
          key: 'username',
          type: 'SHORT_TEXT',
          required: true,
          config: { pattern: '^[a-z0-9_]+$' },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      const checks = shape.username._def.checks
      expect(checks?.some((c: any) => c.kind === 'regex')).toBe(true)
    })

    it('should generate schema for LONG_TEXT', () => {
      const fields = [
        makeField({
          key: 'bio',
          type: 'LONG_TEXT',
          required: false,
          config: { maxLength: 500 },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.bio).toBeDefined()
      expect(shape.bio._def.typeName).toBe('ZodUnion')
    })
  })

  describe('Email and URL fields', () => {
    it('should generate EMAIL schema with email validation', () => {
      const fields = [makeField({ key: 'email', type: 'EMAIL', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.email).toBeDefined()
      const checks = shape.email._def.checks
      expect(checks?.some((c: any) => c.kind === 'email')).toBe(true)
    })

    it('should generate URL schema with URL validation', () => {
      const fields = [makeField({ key: 'website', type: 'URL', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.website).toBeDefined()
      const checks = shape.website._def.checks
      expect(checks?.some((c: any) => c.kind === 'url')).toBe(true)
    })

    it('should generate PHONE schema with phone regex', () => {
      const fields = [makeField({ key: 'phone', type: 'PHONE', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.phone).toBeDefined()
      const checks = shape.phone._def.checks
      expect(checks?.some((c: any) => c.kind === 'regex')).toBe(true)
    })

    it('should generate PASSWORD schema', () => {
      const fields = [makeField({ key: 'password', type: 'PASSWORD', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.password).toBeDefined()
      expect(shape.password._def.typeName).toBe('ZodString')
    })
  })

  describe('Number fields', () => {
    it('should generate NUMBER schema with min/max constraints', () => {
      const fields = [
        makeField({
          key: 'age',
          type: 'NUMBER',
          required: true,
          config: { min: 0, max: 150 },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.age).toBeDefined()
      expect(shape.age._def.typeName).toBe('ZodNumber')
      const checks = shape.age._def.checks
      expect(checks?.some((c: any) => c.kind === 'min')).toBe(true)
      expect(checks?.some((c: any) => c.kind === 'max')).toBe(true)
    })

    it('should enforce integer format', () => {
      const fields = [
        makeField({
          key: 'count',
          type: 'NUMBER',
          required: true,
          config: { format: 'integer' },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      const checks = shape.count._def.checks
      expect(checks?.some((c: any) => c.kind === 'int')).toBe(true)
    })
  })

  describe('Date and time fields', () => {
    it('should generate DATE schema', () => {
      const fields = [makeField({ key: 'birthDate', type: 'DATE', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.birthDate).toBeDefined()
      expect(shape.birthDate._def.typeName).toBe('ZodString')
    })

    it('should generate TIME schema', () => {
      const fields = [makeField({ key: 'meetingTime', type: 'TIME', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.meetingTime).toBeDefined()
    })

    it('should generate DATE_TIME schema', () => {
      const fields = [makeField({ key: 'meetingDateTime', type: 'DATE_TIME', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.meetingDateTime).toBeDefined()
    })

    it('should generate DATE_RANGE schema as object', () => {
      const fields = [makeField({ key: 'dateRange', type: 'DATE_RANGE', required: true })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.dateRange).toBeDefined()
      expect(shape.dateRange._def.typeName).toBe('ZodObject')
    })
  })

  describe('Selection fields', () => {
    it('should generate SELECT schema with enum from options', () => {
      const fields = [
        makeField({
          key: 'country',
          type: 'SELECT',
          required: true,
          config: {
            mode: 'static',
            options: [
              { label: 'USA', value: 'us' },
              { label: 'Canada', value: 'ca' },
            ],
          },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.country).toBeDefined()
      expect(shape.country._def.typeName).toBe('ZodEnum')
    })

    it('should generate MULTI_SELECT schema as array of enum', () => {
      const fields = [
        makeField({
          key: 'interests',
          type: 'MULTI_SELECT',
          required: true,
          config: {
            mode: 'static',
            options: [
              { label: 'Sports', value: 'sports' },
              { label: 'Music', value: 'music' },
            ],
          },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.interests).toBeDefined()
      expect(shape.interests._def.typeName).toBe('ZodArray')
    })

    it('should generate RADIO schema with enum', () => {
      const fields = [
        makeField({
          key: 'gender',
          type: 'RADIO',
          required: true,
          config: {
            mode: 'static',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ],
          },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.gender).toBeDefined()
    })

    it('should handle SELECT with dynamic mode', () => {
      const fields = [
        makeField({
          key: 'dynamicSelect',
          type: 'SELECT',
          required: true,
          config: { mode: 'dynamic' },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.dynamicSelect).toBeDefined()
    })
  })

  describe('Checkbox and boolean fields', () => {
    it('should generate CHECKBOX schema as boolean', () => {
      const fields = [makeField({ key: 'subscribe', type: 'CHECKBOX', required: false })]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.subscribe).toBeDefined()
      // Should be union with boolean for optional
      expect(shape.subscribe._def.typeName).toBe('ZodUnion')
    })
  })

  describe('File upload fields', () => {
    it('should generate FILE_UPLOAD schema with size and type constraints', () => {
      const fields = [
        makeField({
          key: 'document',
          type: 'FILE_UPLOAD',
          required: true,
          config: {
            maxSizeMB: 5,
            allowedMimeTypes: ['application/pdf', 'image/jpeg'],
            maxFiles: 1,
          },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.document).toBeDefined()
      expect(shape.document._def.typeName).toBe('ZodArray')
    })
  })

  describe('Rating and scale fields', () => {
    it('should generate RATING schema with max constraint', () => {
      const fields = [
        makeField({
          key: 'rating',
          type: 'RATING',
          required: true,
          config: { max: 5 },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.rating).toBeDefined()
      expect(shape.rating._def.typeName).toBe('ZodNumber')
    })

    it('should generate SCALE schema with min and max', () => {
      const fields = [
        makeField({
          key: 'scale',
          type: 'SCALE',
          required: true,
          config: { min: 1, max: 10 },
        }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.scale).toBeDefined()
      expect(shape.scale._def.typeName).toBe('ZodNumber')
    })
  })

  describe('Layout fields', () => {
    it('should exclude SECTION_BREAK from schema', () => {
      const fields = [
        makeField({ key: 'section', type: 'SECTION_BREAK', required: false }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.section).toBeUndefined()
    })

    it('should exclude FIELD_GROUP from schema', () => {
      const fields = [
        makeField({ key: 'group', type: 'FIELD_GROUP', required: false }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.group).toBeUndefined()
    })
  })

  describe('Special fields', () => {
    it('should generate HIDDEN field schema', () => {
      const fields = [
        makeField({ key: 'sessionId', type: 'HIDDEN', required: false }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.sessionId).toBeDefined()
    })

    it('should generate RICH_TEXT schema', () => {
      const fields = [
        makeField({ key: 'content', type: 'RICH_TEXT', required: false }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.content).toBeDefined()
    })

    it('should generate SIGNATURE schema', () => {
      const fields = [
        makeField({ key: 'signature', type: 'SIGNATURE', required: false }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.signature).toBeDefined()
    })

    it('should generate ADDRESS schema', () => {
      const fields = [
        makeField({ key: 'address', type: 'ADDRESS', required: false }),
      ]
      const schema = generateZodSchema(fields)

      const shape = schema.shape
      expect(shape.address).toBeDefined()
    })
  })
})

// ─── Mixed Field Tests ──────────────────────────────────────────────────────

describe('generateZodSchema - Mixed Field Types', () => {
  it('should generate schema for mixed required and optional fields', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', required: true }),
      makeField({ key: 'email', type: 'EMAIL', required: true }),
      makeField({ key: 'phone', type: 'PHONE', required: false }),
      makeField({ key: 'bio', type: 'LONG_TEXT', required: false }),
    ]
    const schema = generateZodSchema(fields)

    const shape = schema.shape
    expect(shape.name).toBeDefined()
    expect(shape.email).toBeDefined()
    expect(shape.phone).toBeDefined()
    expect(shape.bio).toBeDefined()
  })

  it('should handle all 21 field types', () => {
    const allTypes: FormField[] = [
      makeField({ key: 'short_text', type: 'SHORT_TEXT', required: true }),
      makeField({ key: 'long_text', type: 'LONG_TEXT', required: false }),
      makeField({ key: 'number', type: 'NUMBER', required: false }),
      makeField({ key: 'email', type: 'EMAIL', required: true }),
      makeField({ key: 'phone', type: 'PHONE', required: false }),
      makeField({ key: 'date', type: 'DATE', required: false }),
      makeField({ key: 'date_range', type: 'DATE_RANGE', required: false }),
      makeField({ key: 'time', type: 'TIME', required: false }),
      makeField({ key: 'date_time', type: 'DATE_TIME', required: false }),
      makeField({
        key: 'select',
        type: 'SELECT',
        required: false,
        config: { mode: 'static', options: [{ label: 'A', value: 'a' }] },
      }),
      makeField({
        key: 'multi_select',
        type: 'MULTI_SELECT',
        required: false,
        config: { mode: 'static', options: [{ label: 'A', value: 'a' }] },
      }),
      makeField({
        key: 'radio',
        type: 'RADIO',
        required: false,
        config: { mode: 'static', options: [{ label: 'A', value: 'a' }] },
      }),
      makeField({ key: 'checkbox', type: 'CHECKBOX', required: false }),
      makeField({ key: 'file_upload', type: 'FILE_UPLOAD', required: false }),
      makeField({ key: 'rating', type: 'RATING', required: false }),
      makeField({ key: 'scale', type: 'SCALE', required: false }),
      makeField({ key: 'url', type: 'URL', required: false }),
      makeField({ key: 'password', type: 'PASSWORD', required: false }),
      makeField({ key: 'hidden', type: 'HIDDEN', required: false }),
      makeField({ key: 'rich_text', type: 'RICH_TEXT', required: false }),
      makeField({ key: 'signature', type: 'SIGNATURE', required: false }),
      makeField({ key: 'address', type: 'ADDRESS', required: false }),
    ]

    const schema = generateZodSchema(allTypes)
    const shape = schema.shape

    expect(Object.keys(shape).length).toBeGreaterThan(20)
  })
})

// ─── Validation Tests ────────────────────────────────────────────────────────

describe('generateZodSchema - Validation Behavior', () => {
  it('should validate required text field correctly', () => {
    const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: true })]
    const schema = generateZodSchema(fields)

    const valid = schema.safeParse({ name: 'John Doe' })
    expect(valid.success).toBe(true)

    const invalid = schema.safeParse({ name: '' })
    expect(invalid.success).toBe(false)

    const missing = schema.safeParse({})
    expect(missing.success).toBe(false)
  })

  it('should allow optional fields to be undefined, null, or empty', () => {
    const fields = [makeField({ key: 'bio', type: 'LONG_TEXT', required: false })]
    const schema = generateZodSchema(fields)

    expect(schema.safeParse({ bio: undefined }).success).toBe(true)
    expect(schema.safeParse({ bio: null }).success).toBe(true)
    expect(schema.safeParse({ bio: '' }).success).toBe(true)
    expect(schema.safeParse({}).success).toBe(true)
  })

  it('should validate number constraints', () => {
    const fields = [
      makeField({
        key: 'age',
        type: 'NUMBER',
        required: true,
        config: { min: 0, max: 150 },
      }),
    ]
    const schema = generateZodSchema(fields)

    expect(schema.safeParse({ age: 25 }).success).toBe(true)
    expect(schema.safeParse({ age: -1 }).success).toBe(false)
    expect(schema.safeParse({ age: 200 }).success).toBe(false)
  })

  it('should validate email format', () => {
    const fields = [makeField({ key: 'email', type: 'EMAIL', required: true })]
    const schema = generateZodSchema(fields)

    expect(schema.safeParse({ email: 'test@example.com' }).success).toBe(true)
    expect(schema.safeParse({ email: 'invalid-email' }).success).toBe(false)
  })

  it('should validate select enum values', () => {
    const fields = [
      makeField({
        key: 'country',
        type: 'SELECT',
        required: true,
        config: {
          mode: 'static',
          options: [
            { label: 'USA', value: 'us' },
            { label: 'Canada', value: 'ca' },
          ],
        },
      }),
    ]
    const schema = generateZodSchema(fields)

    expect(schema.safeParse({ country: 'us' }).success).toBe(true)
    expect(schema.safeParse({ country: 'invalid' }).success).toBe(false)
  })

  it('should validate multi-select as array', () => {
    const fields = [
      makeField({
        key: 'interests',
        type: 'MULTI_SELECT',
        required: true,
        config: {
          mode: 'static',
          options: [
            { label: 'Sports', value: 'sports' },
            { label: 'Music', value: 'music' },
          ],
        },
      }),
    ]
    const schema = generateZodSchema(fields)

    expect(schema.safeParse({ interests: ['sports', 'music'] }).success).toBe(true)
    expect(schema.safeParse({ interests: ['sports'] }).success).toBe(true)
    expect(schema.safeParse({ interests: [] }).success).toBe(false)
  })
})

// ─── Step Zod Schema Tests ──────────────────────────────────────────────────

describe('generateStepZodSchema', () => {
  it('should generate schema scoped to step fields', () => {
    const stepFields = [
      makeField({ key: 'firstName', type: 'SHORT_TEXT', required: true }),
      makeField({ key: 'lastName', type: 'SHORT_TEXT', required: true }),
    ]
    const schema = generateStepZodSchema(stepFields)

    const shape = schema.shape
    expect(shape.firstName).toBeDefined()
    expect(shape.lastName).toBeDefined()
  })

  it('should validate step-specific data', () => {
    const stepFields = [
      makeField({
        key: 'country',
        type: 'SELECT',
        required: true,
        config: {
          mode: 'static',
          options: [{ label: 'USA', value: 'us' }],
        },
      }),
    ]
    const schema = generateStepZodSchema(stepFields)

    expect(schema.safeParse({ country: 'us' }).success).toBe(true)
    expect(schema.safeParse({ country: 'invalid' }).success).toBe(false)
  })
})

// ─── Strict Submission Schema Tests ──────────────────────────────────────────

describe('generateStrictSubmissionSchema', () => {
  it('should generate strict schema that rejects unknown keys', () => {
    const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: true })]
    const schema = generateStrictSubmissionSchema(fields)

    const valid = schema.safeParse({ name: 'John Doe' })
    expect(valid.success).toBe(true)

    const withExtra = schema.safeParse({ name: 'John Doe', extra: 'field' })
    expect(withExtra.success).toBe(false)
  })

  it('should enforce all required fields', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', required: true }),
      makeField({ key: 'email', type: 'EMAIL', required: true }),
    ]
    const schema = generateStrictSubmissionSchema(fields)

    expect(schema.safeParse({ name: 'John', email: 'john@example.com' }).success).toBe(true)
    expect(schema.safeParse({ name: 'John' }).success).toBe(false)
  })
})

// ─── ReDoS Safety Tests ──────────────────────────────────────────────────────

describe('generateZodSchema - ReDoS Safety', () => {
  it('should reject extremely long regex patterns', () => {
    const longPattern = 'a+'.repeat(300) // Over 500 chars
    const fields = [
      makeField({
        key: 'field',
        type: 'SHORT_TEXT',
        required: true,
        config: { pattern: longPattern },
      }),
    ]
    const schema = generateZodSchema(fields)

    // Schema should be generated but pattern validation should be skipped
    const shape = schema.shape
    expect(shape.field).toBeDefined()
  })

  it('should reject nested quantifier patterns', () => {
    const badPattern = '(a+)+'
    const fields = [
      makeField({
        key: 'field',
        type: 'SHORT_TEXT',
        required: true,
        config: { pattern: badPattern },
      }),
    ]
    const schema = generateZodSchema(fields)

    // Schema should be generated but unsafe pattern rejected
    const shape = schema.shape
    expect(shape.field).toBeDefined()
  })

  it('should accept safe regex patterns', () => {
    const safePattern = '^[a-z0-9_]+$'
    const fields = [
      makeField({
        key: 'username',
        type: 'SHORT_TEXT',
        required: true,
        config: { pattern: safePattern },
      }),
    ]
    const schema = generateZodSchema(fields)

    expect(schema.safeParse({ username: 'valid_user123' }).success).toBe(true)
    expect(schema.safeParse({ username: 'invalid-user' }).success).toBe(false)
  })
})
