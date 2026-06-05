import { describe, it, expect } from 'vitest'
import { generateZodSchema } from '../src/zod-generator'
import { createFormEngine } from '../src/engine'
import type { FormField } from '../src/types'

function field(key: string, over: Partial<FormField> = {}): FormField {
  return {
    id: `id_${key}`, versionId: 'v1', key, label: key,
    type: 'SHORT_TEXT', required: false, order: 1, config: {},
    ...over,
  }
}

const options = {
  mode: 'static',
  options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }],
}

describe('optional MULTI_SELECT validation (regression)', () => {
  it('accepts an empty array when the field is NOT required', () => {
    const schema = generateZodSchema([
      field('tags', { type: 'MULTI_SELECT', required: false, config: options }),
    ])
    const result = schema.safeParse({ tags: [] })
    expect(result.success).toBe(true)
  })

  it('still rejects an empty array when the field IS required', () => {
    const schema = generateZodSchema([
      field('tags', { type: 'MULTI_SELECT', required: true, config: options }),
    ])
    const result = schema.safeParse({ tags: [] })
    expect(result.success).toBe(false)
  })

  it('still rejects values outside the static options', () => {
    const schema = generateZodSchema([
      field('tags', { type: 'MULTI_SELECT', required: false, config: options }),
    ])
    expect(schema.safeParse({ tags: ['nope'] }).success).toBe(false)
    expect(schema.safeParse({ tags: ['a'] }).success).toBe(true)
  })

  it('a fresh engine with an optional MULTI_SELECT validates clean (the demo bug)', () => {
    const engine = createFormEngine([
      field('name', { required: true }),
      field('tags', { type: 'MULTI_SELECT', required: false, config: options }),
    ])
    engine.setFieldValue('name', 'Ada')
    const { success, errors } = engine.validate()
    expect(errors.tags).toBeUndefined()
    expect(success).toBe(true)
  })
})
