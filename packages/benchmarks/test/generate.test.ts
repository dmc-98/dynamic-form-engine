import { describe, it, expect } from 'vitest'
import { createFormEngine } from '@dmc--98/dfe-core'
import { makeBenchmarkForm } from '../src/generate'

describe('makeBenchmarkForm', () => {
  it('produces exactly fieldCount fields with unique keys and stable order', () => {
    const fields = makeBenchmarkForm({ fieldCount: 100, chainDepth: 10 })
    expect(fields).toHaveLength(100)
    expect(new Set(fields.map((f) => f.key)).size).toBe(100)
    expect(fields.map((f) => f.order)).toEqual([...fields.map((f) => f.order)].sort((a, b) => a - b))
  })

  it('builds visibility chains of the requested depth', () => {
    const fields = makeBenchmarkForm({ fieldCount: 100, chainDepth: 10 })
    // Every field except chain heads depends on its predecessor.
    const conditioned = fields.filter((f) => f.conditions)
    expect(conditioned.length).toBe(100 - Math.ceil(100 / 10))
    for (const f of conditioned) {
      const rule = (f.conditions as { rules: Array<{ fieldKey: string }> }).rules[0]
      const dependsOn = fields.find((x) => x.key === rule.fieldKey)
      expect(dependsOn).toBeDefined()
      expect(dependsOn!.order).toBe(f.order - 1)
    }
  })

  it('chains actually drive engine visibility: filling a head reveals its successor', () => {
    const fields = makeBenchmarkForm({ fieldCount: 20, chainDepth: 10 })
    const engine = createFormEngine(fields, {})
    const before = engine.getVisibleFields().length
    engine.setFieldValue(fields[0].key, 'filled')
    const after = engine.getVisibleFields().length
    expect(after).toBe(before + 1)
  })

  it('rejects invalid scenarios', () => {
    expect(() => makeBenchmarkForm({ fieldCount: 0, chainDepth: 5 })).toThrow()
    expect(() => makeBenchmarkForm({ fieldCount: 10, chainDepth: 0 })).toThrow()
  })
})
