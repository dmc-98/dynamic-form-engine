import { describe, it, expect } from 'vitest'
import { diffFormConfig, summarizeFormConfigDiff } from '../src/config-diff'
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

describe('diffFormConfig', () => {
  it('reports no changes for identical configs', () => {
    const cfg = { fields: [field('a'), field('b')], steps: [step('s1')] }
    const diff = diffFormConfig(cfg, structuredClone(cfg))
    expect(diff.unchanged).toBe(true)
    expect(diff.addedFields).toEqual([])
    expect(diff.removedFields).toEqual([])
    expect(diff.changedFields).toEqual([])
  })

  it('detects added and removed fields', () => {
    const prev = { fields: [field('a'), field('b')] }
    const next = { fields: [field('a'), field('c')] }
    const diff = diffFormConfig(prev, next)
    expect(diff.addedFields).toEqual(['c'])
    expect(diff.removedFields).toEqual(['b'])
    expect(diff.unchanged).toBe(false)
  })

  it('detects per-property field changes with before/after', () => {
    const prev = { fields: [field('a', { label: 'Old', required: false })] }
    const next = { fields: [field('a', { label: 'New', required: true })] }
    const diff = diffFormConfig(prev, next)
    expect(diff.changedFields).toHaveLength(1)
    const change = diff.changedFields[0]
    expect(change.key).toBe('a')
    expect(change.changes.label).toEqual({ before: 'Old', after: 'New' })
    expect(change.changes.required).toEqual({ before: false, after: true })
  })

  it('does not flag deep-equal config objects as changed', () => {
    const prev = { fields: [field('a', { config: { min: 1, max: 10 } })] }
    const next = { fields: [field('a', { config: { max: 10, min: 1 } })] }
    const diff = diffFormConfig(prev, next)
    expect(diff.unchanged).toBe(true)
  })

  it('detects added and removed steps', () => {
    const prev = { fields: [], steps: [step('s1'), step('s2')] }
    const next = { fields: [], steps: [step('s2'), step('s3')] }
    const diff = diffFormConfig(prev, next)
    expect(diff.addedSteps).toEqual(['s3'])
    expect(diff.removedSteps).toEqual(['s1'])
  })

  it('produces deterministic, sorted output', () => {
    const prev = { fields: [field('z'), field('a')] }
    const next = { fields: [field('m'), field('b')] }
    const diff = diffFormConfig(prev, next)
    expect(diff.addedFields).toEqual(['b', 'm'])
    expect(diff.removedFields).toEqual(['a', 'z'])
  })

  it('handles missing fields/steps arrays gracefully', () => {
    const diff = diffFormConfig({ fields: [] }, { fields: [field('a')] })
    expect(diff.addedFields).toEqual(['a'])
    expect(diff.removedSteps).toEqual([])
  })
})

describe('summarizeFormConfigDiff', () => {
  it('summarizes an unchanged diff', () => {
    const diff = diffFormConfig({ fields: [] }, { fields: [] })
    expect(summarizeFormConfigDiff(diff)).toBe('No changes.')
  })

  it('summarizes adds, removes and changes', () => {
    const prev = { fields: [field('a', { label: 'Old' }), field('gone')] }
    const next = { fields: [field('a', { label: 'New' }), field('fresh')] }
    const summary = summarizeFormConfigDiff(diffFormConfig(prev, next))
    expect(summary).toContain('+ field fresh')
    expect(summary).toContain('- field gone')
    expect(summary).toContain('~ field a (label)')
  })
})
