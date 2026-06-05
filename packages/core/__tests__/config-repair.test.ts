import { describe, it, expect } from 'vitest'
import { suggestConfigRepairs, autofixConfig } from '../src/config-repair'
import type { FormField, FormStep } from '../src/types'

function field(key: string, over: Partial<FormField> = {}): FormField {
  return {
    id: `id_${key}`,
    versionId: 'v1',
    key,
    label: key,
    type: 'SHORT_TEXT',
    required: false,
    order: 1,
    config: {},
    ...over,
  }
}

function step(id: string, over: Partial<FormStep> = {}): FormStep {
  return { id, versionId: 'v1', title: id, order: 1, ...over }
}

describe('suggestConfigRepairs', () => {
  it('returns ok for a clean config', () => {
    const result = suggestConfigRepairs({ fields: [field('a'), field('b')] })
    expect(result.ok).toBe(true)
    expect(result.suggestions).toEqual([])
  })

  it('flags duplicate field keys as errors', () => {
    const result = suggestConfigRepairs({ fields: [field('a'), field('a')] })
    expect(result.ok).toBe(false)
    expect(result.suggestions.some(s => s.code === 'duplicate-field-key')).toBe(true)
    expect(result.errorCount).toBe(1)
  })

  it('flags conditions referencing unknown fields', () => {
    const f = field('b', {
      conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'ghost', operator: 'eq', value: 'x' }] },
    })
    const result = suggestConfigRepairs({ fields: [field('a'), f] })
    expect(result.suggestions.some(s => s.code === 'dangling-condition-ref')).toBe(true)
  })

  it('flags self-referential conditions', () => {
    const f = field('a', {
      conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'a', operator: 'eq', value: 'x' }] },
    })
    const result = suggestConfigRepairs({ fields: [f] })
    expect(result.suggestions.some(s => s.code === 'self-referential-condition')).toBe(true)
  })

  it('warns about selection fields with no options', () => {
    const f = field('choice', { type: 'SELECT', config: {} })
    const result = suggestConfigRepairs({ fields: [f] })
    const sel = result.suggestions.find(s => s.code === 'missing-select-options')
    expect(sel).toBeDefined()
    expect(sel!.severity).toBe('warning')
    expect(result.warningCount).toBe(1)
  })

  it('does not warn when a selection field uses a dynamic data source', () => {
    const f = field('choice', { type: 'SELECT', config: { mode: 'dynamic' } })
    const result = suggestConfigRepairs({ fields: [f] })
    expect(result.suggestions.some(s => s.code === 'missing-select-options')).toBe(false)
  })

  it('flags computed fields depending on unknown fields', () => {
    const f = field('total', {
      type: 'NUMBER',
      computed: { expression: 'a + missing', dependsOn: ['a', 'missing'] },
    })
    const result = suggestConfigRepairs({ fields: [field('a', { type: 'NUMBER' }), f] })
    expect(result.suggestions.some(s => s.code === 'computed-missing-dependency')).toBe(true)
  })

  it('flags fields pointing at unknown steps', () => {
    const result = suggestConfigRepairs({
      fields: [field('a', { stepId: 'nope' })],
      steps: [step('real')],
    })
    expect(result.suggestions.some(s => s.code === 'dangling-step-ref')).toBe(true)
  })

  it('flags branches targeting unknown steps', () => {
    const s = step('s1', {
      branches: [{
        condition: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'a', operator: 'eq', value: 'x' }] },
        targetStepId: 'ghost',
      }],
    })
    const result = suggestConfigRepairs({ fields: [field('a')], steps: [s] })
    expect(result.suggestions.some(s => s.code === 'dangling-branch-target')).toBe(true)
  })

  it('does not flag step refs when no steps are supplied', () => {
    const result = suggestConfigRepairs({ fields: [field('a', { stepId: 'x' })] })
    expect(result.suggestions.some(s => s.code === 'dangling-step-ref')).toBe(false)
  })
})

describe('autofixConfig', () => {
  it('removes duplicate fields keeping the first occurrence', () => {
    const first = field('a', { label: 'First' })
    const dup = field('a', { label: 'Second' })
    const fixed = autofixConfig({ fields: [first, dup, field('b')] })
    expect(fixed.fields.map(f => f.key)).toEqual(['a', 'b'])
    expect(fixed.fields[0].label).toBe('First')
  })

  it('makes a previously-erroring config clean for duplicates', () => {
    const before = suggestConfigRepairs({ fields: [field('a'), field('a')] })
    expect(before.ok).toBe(false)
    const after = suggestConfigRepairs(autofixConfig({ fields: [field('a'), field('a')] }))
    expect(after.suggestions.some(s => s.code === 'duplicate-field-key')).toBe(false)
  })
})
