import { describe, it, expect } from 'vitest'
import { buildFlowModel } from '../src/flow-model'
import type { FormStep } from '../src/types'

function step(id: string, order: number, over: Partial<FormStep> = {}): FormStep {
  return { id, versionId: 'v1', title: id, order, ...over }
}

const branch = (targetStepId: string, fieldKey = 'decision', value: unknown = 'approve') => ({
  condition: { action: 'SHOW' as const, operator: 'and' as const, rules: [{ fieldKey, operator: 'eq' as const, value }] },
  targetStepId,
})

describe('buildFlowModel', () => {
  it('builds linear sequential edges for plain steps', () => {
    const model = buildFlowModel([step('a', 1), step('b', 2), step('c', 3)])
    expect(model.nodes.map(n => n.id)).toEqual(['a', 'b', 'c'])
    const seq = model.edges.filter(e => e.kind === 'sequential')
    expect(seq.map(e => [e.from, e.to])).toEqual([['a', 'b'], ['b', 'c']])
  })

  it('adds branch edges with labels from conditions', () => {
    const steps = [
      step('request', 1),
      step('decision', 2, { branches: [branch('summary')] }),
      step('reject', 3),
      step('summary', 4),
    ]
    const model = buildFlowModel(steps)
    const branchEdges = model.edges.filter(e => e.kind === 'branch')
    expect(branchEdges).toHaveLength(1)
    expect(branchEdges[0].from).toBe('decision')
    expect(branchEdges[0].to).toBe('summary')
    expect(branchEdges[0].label).toContain('decision')
  })

  it('marks skippable steps (those with skip conditions)', () => {
    const steps = [
      step('a', 1),
      step('b', 2, { conditions: { operator: 'and', rules: [{ fieldKey: 'x', operator: 'eq', value: 1 }] } as never }),
      step('c', 3),
    ]
    const model = buildFlowModel(steps)
    expect(model.nodes.find(n => n.id === 'b')?.skippable).toBe(true)
    expect(model.nodes.find(n => n.id === 'a')?.skippable).toBe(false)
  })

  it('flags review steps', () => {
    const steps = [
      step('a', 1),
      step('review', 2, { config: { review: { editMode: 'navigate' } } }),
    ]
    const model = buildFlowModel(steps)
    expect(model.nodes.find(n => n.id === 'review')?.isReview).toBe(true)
  })

  it('orders nodes by step.order regardless of input order', () => {
    const model = buildFlowModel([step('c', 3), step('a', 1), step('b', 2)])
    expect(model.nodes.map(n => n.id)).toEqual(['a', 'b', 'c'])
  })

  it('flags branch edges that target an unknown step (dangling)', () => {
    const steps = [step('a', 1, { branches: [branch('ghost')] }), step('b', 2)]
    const model = buildFlowModel(steps)
    const dangling = model.edges.find(e => e.kind === 'branch' && e.to === 'ghost')
    expect(dangling?.dangling).toBe(true)
  })

  it('handles an empty step list', () => {
    const model = buildFlowModel([])
    expect(model.nodes).toEqual([])
    expect(model.edges).toEqual([])
  })

  it('does not duplicate a sequential edge that also exists as a branch', () => {
    // decision → reject is both the natural next step AND not a branch target;
    // decision → summary is a branch. Sequential a→b stays; branch is separate.
    const steps = [
      step('request', 1),
      step('decision', 2, { branches: [branch('summary')] }),
      step('summary', 3),
    ]
    const model = buildFlowModel(steps)
    const seq = model.edges.filter(e => e.kind === 'sequential').map(e => [e.from, e.to])
    expect(seq).toEqual([['request', 'decision'], ['decision', 'summary']])
    expect(model.edges.filter(e => e.kind === 'branch')).toHaveLength(1)
  })
})
