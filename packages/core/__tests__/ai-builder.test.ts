import { describe, it, expect } from 'vitest'
import { createAiFormBuilder } from '../src/ai/builder'
import type { FormConfig } from '../src/ai/builder'

describe('createAiFormBuilder — generate', () => {
  it('falls back to heuristics with no provider and returns a usable config', async () => {
    const builder = createAiFormBuilder()
    const result = await builder.generate('Contact form with name, email and message')
    expect(result.usedProvider).toBe(false)
    expect(result.config.fields.length).toBeGreaterThan(0)
    expect(result.repair).toBeDefined()
  })

  it('uses an injected provider when it returns valid JSON', async () => {
    const provider = async () =>
      JSON.stringify({
        fields: [
          { id: 'f1', versionId: 'v1', key: 'name', label: 'Name', type: 'SHORT_TEXT', required: true, order: 1, config: {} },
        ],
        title: 'From Provider',
      })
    const builder = createAiFormBuilder({ provider })
    const result = await builder.generate('anything')
    expect(result.usedProvider).toBe(true)
    expect(result.config.fields).toHaveLength(1)
    expect(result.config.fields[0].key).toBe('name')
  })

  it('tolerates a provider that wraps JSON in prose / code fences', async () => {
    const provider = async () =>
      'Sure! Here is your form:\n```json\n{ "fields": [ { "id":"f1","versionId":"v1","key":"email","label":"Email","type":"EMAIL","required":true,"order":1,"config":{} } ] }\n```\nHope that helps!'
    const builder = createAiFormBuilder({ provider })
    const result = await builder.generate('an email capture form')
    expect(result.usedProvider).toBe(true)
    expect(result.config.fields[0].key).toBe('email')
  })

  it('falls back to heuristics when the provider returns junk', async () => {
    const provider = async () => 'I cannot do that.'
    const builder = createAiFormBuilder({ provider })
    const result = await builder.generate('a registration form with email and password')
    expect(result.usedProvider).toBe(false)
    expect(result.config.fields.length).toBeGreaterThan(0)
  })

  it('reports repair findings for a generated config', async () => {
    const provider = async () =>
      JSON.stringify({
        fields: [
          { id: 'f1', versionId: 'v1', key: 'dup', label: 'A', type: 'SHORT_TEXT', required: false, order: 1, config: {} },
          { id: 'f2', versionId: 'v1', key: 'dup', label: 'B', type: 'SHORT_TEXT', required: false, order: 2, config: {} },
        ],
      })
    const builder = createAiFormBuilder({ provider })
    const result = await builder.generate('x')
    expect(result.repair.ok).toBe(false)
    expect(result.repair.suggestions.some(s => s.code === 'duplicate-field-key')).toBe(true)
  })
})

describe('createAiFormBuilder — refine', () => {
  const base: FormConfig = {
    fields: [
      { id: 'f1', versionId: 'v1', key: 'name', label: 'Name', type: 'SHORT_TEXT', required: true, order: 1, config: {} },
    ],
  }

  it('is a no-op without a provider (review-first; never invents changes)', async () => {
    const builder = createAiFormBuilder()
    const result = await builder.refine(base, 'add a phone field')
    expect(result.usedProvider).toBe(false)
    expect(result.config).toEqual(base)
    expect(result.changes).toContain('No changes')
  })

  it('applies provider output and summarizes the diff', async () => {
    const provider = async () =>
      JSON.stringify({
        fields: [
          ...base.fields,
          { id: 'f2', versionId: 'v1', key: 'phone', label: 'Phone', type: 'PHONE', required: false, order: 2, config: {} },
        ],
      })
    const builder = createAiFormBuilder({ provider })
    const result = await builder.refine(base, 'add a phone field')
    expect(result.usedProvider).toBe(true)
    expect(result.config.fields.map(f => f.key)).toContain('phone')
    expect(result.changes).toContain('+ field phone')
  })

  it('keeps the original config when the provider returns junk', async () => {
    const provider = async () => 'nope'
    const builder = createAiFormBuilder({ provider })
    const result = await builder.refine(base, 'do something')
    expect(result.usedProvider).toBe(false)
    expect(result.config).toEqual(base)
  })
})
