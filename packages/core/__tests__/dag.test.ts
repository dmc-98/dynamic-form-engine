import { describe, it, expect } from 'vitest'
import { buildFormGraph, handleFieldChange, getCurrentValues, collectSubmissionValues, topologicalSort, flattenFieldTree } from '../src/dag'
import { makeField } from './helpers'

describe('flattenFieldTree', () => {
  it('flattens nested fields', () => {
    const fields = [
      makeField({
        key: 'group1', type: 'FIELD_GROUP',
        children: [
          makeField({ key: 'child1', parentFieldId: 'field_group1' }),
          makeField({ key: 'child2', parentFieldId: 'field_group1' }),
        ]
      }),
      makeField({ key: 'standalone' }),
    ]
    const flat = flattenFieldTree(fields)
    expect(flat.map(f => f.key)).toEqual(['group1', 'child1', 'child2', 'standalone'])
  })

  it('handles empty arrays', () => {
    expect(flattenFieldTree([])).toEqual([])
  })
})

describe('topologicalSort', () => {
  it('sorts independent fields in stable order', () => {
    const keys = ['c', 'a', 'b']
    const deps = new Map([['a', new Set<string>()], ['b', new Set<string>()], ['c', new Set<string>()]])
    expect(topologicalSort(keys, deps)).toEqual(['a', 'b', 'c'])
  })

  it('respects dependency order', () => {
    const keys = ['a', 'b', 'c']
    const deps = new Map([
      ['a', new Set(['b'])],   // b depends on a
      ['b', new Set(['c'])],   // c depends on b
      ['c', new Set<string>()],
    ])
    const order = topologicalSort(keys, deps)
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'))
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'))
  })

  it('throws on circular dependencies', () => {
    const keys = ['a', 'b']
    const deps = new Map([
      ['a', new Set(['b'])],
      ['b', new Set(['a'])],
    ])
    expect(() => topologicalSort(keys, deps)).toThrow('circular')
  })
})

describe('buildFormGraph', () => {
  it('initializes nodes with default values', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT' }),
      makeField({ key: 'age', type: 'NUMBER' }),
      makeField({ key: 'agree', type: 'CHECKBOX' }),
    ]
    const graph = buildFormGraph(fields)

    expect(graph.nodes.get('name')!.value).toBe('')
    expect(graph.nodes.get('age')!.value).toBe(null)
    expect(graph.nodes.get('agree')!.value).toBe(false)
  })

  it('hydrates values from initial data', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT' }),
      makeField({ key: 'age', type: 'NUMBER' }),
    ]
    const graph = buildFormGraph(fields, { name: 'Alice', age: 30 })

    expect(graph.nodes.get('name')!.value).toBe('Alice')
    expect(graph.nodes.get('age')!.value).toBe(30)
    expect(graph.nodes.get('name')!.isDirty).toBe(true)
  })

  it('all fields are visible by default', () => {
    const fields = [
      makeField({ key: 'a' }),
      makeField({ key: 'b' }),
    ]
    const graph = buildFormGraph(fields)

    expect(graph.nodes.get('a')!.isVisible).toBe(true)
    expect(graph.nodes.get('b')!.isVisible).toBe(true)
  })

  it('applies SHOW condition on initial build', () => {
    const fields = [
      makeField({ key: 'role', type: 'SELECT', config: { mode: 'static', options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }] } }),
      makeField({
        key: 'adminPanel',
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] }
      }),
    ]

    // With no hydration → role is '', adminPanel should be hidden
    const graph = buildFormGraph(fields)
    expect(graph.nodes.get('adminPanel')!.isVisible).toBe(false)

    // With admin role → adminPanel should be visible
    const graph2 = buildFormGraph(fields, { role: 'admin' })
    expect(graph2.nodes.get('adminPanel')!.isVisible).toBe(true)
  })

  it('applies HIDE condition on initial build', () => {
    const fields = [
      makeField({ key: 'hasDiscount', type: 'CHECKBOX' }),
      makeField({
        key: 'fullPrice',
        conditions: { action: 'HIDE', operator: 'and', rules: [{ fieldKey: 'hasDiscount', operator: 'eq', value: true }] }
      }),
    ]

    const graph = buildFormGraph(fields, { hasDiscount: true })
    expect(graph.nodes.get('fullPrice')!.isVisible).toBe(false)
  })

  it('applies REQUIRE condition on initial build', () => {
    const fields = [
      makeField({ key: 'wantsNewsletter', type: 'CHECKBOX' }),
      makeField({
        key: 'email',
        required: false,
        conditions: { action: 'REQUIRE', operator: 'and', rules: [{ fieldKey: 'wantsNewsletter', operator: 'eq', value: true }] }
      }),
    ]

    const graph = buildFormGraph(fields, { wantsNewsletter: true })
    expect(graph.nodes.get('email')!.isRequired).toBe(true)

    const graph2 = buildFormGraph(fields, { wantsNewsletter: false })
    expect(graph2.nodes.get('email')!.isRequired).toBe(false)
  })

  it('handles parent-child visibility cascade', () => {
    const parent = makeField({ key: 'group', type: 'FIELD_GROUP', id: 'group_id' })
    const child = makeField({ key: 'nested', parentFieldId: 'group_id' })
    const trigger = makeField({ key: 'showGroup', type: 'CHECKBOX' })

    parent.conditions = {
      action: 'SHOW', operator: 'and',
      rules: [{ fieldKey: 'showGroup', operator: 'eq', value: true }]
    }

    const graph = buildFormGraph([trigger, parent, child])
    // showGroup is false → group is hidden → child is hidden
    expect(graph.nodes.get('group')!.isVisible).toBe(false)
    expect(graph.nodes.get('nested')!.isVisible).toBe(false)
  })

  it('builds dependency edges from conditions', () => {
    const fields = [
      makeField({ key: 'trigger' }),
      makeField({
        key: 'dependent',
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'trigger', operator: 'not_empty' }] }
      }),
    ]
    const graph = buildFormGraph(fields)
    expect(graph.dependents.get('trigger')!.has('dependent')).toBe(true)
  })
})

describe('handleFieldChange', () => {
  it('updates the changed field value', () => {
    const fields = [makeField({ key: 'name' })]
    const graph = buildFormGraph(fields)

    handleFieldChange(graph, 'name', 'Alice')
    expect(graph.nodes.get('name')!.value).toBe('Alice')
    expect(graph.nodes.get('name')!.isDirty).toBe(true)
  })

  it('returns empty patch for unknown field', () => {
    const fields = [makeField({ key: 'name' })]
    const graph = buildFormGraph(fields)
    const patch = handleFieldChange(graph, 'unknown', 'x')
    expect(patch.updatedKeys.size).toBe(0)
  })

  it('propagates visibility change to dependents', () => {
    const fields = [
      makeField({ key: 'role' }),
      makeField({
        key: 'adminPanel',
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] }
      }),
    ]
    const graph = buildFormGraph(fields)
    expect(graph.nodes.get('adminPanel')!.isVisible).toBe(false)

    const patch = handleFieldChange(graph, 'role', 'admin')
    expect(graph.nodes.get('adminPanel')!.isVisible).toBe(true)
    expect(patch.visibilityChanges.get('adminPanel')).toBe(true)
  })

  it('resets hidden field value to default (prevents ghost data)', () => {
    const fields = [
      makeField({ key: 'showExtra', type: 'CHECKBOX' }),
      makeField({
        key: 'extraInfo',
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'showExtra', operator: 'eq', value: true }] }
      }),
    ]
    const graph = buildFormGraph(fields, { showExtra: true, extraInfo: 'secret' })
    expect(graph.nodes.get('extraInfo')!.value).toBe('secret')

    handleFieldChange(graph, 'showExtra', false)
    expect(graph.nodes.get('extraInfo')!.isVisible).toBe(false)
    expect(graph.nodes.get('extraInfo')!.value).toBe('') // reset to default
  })

  it('propagates through multi-level dependencies', () => {
    const fields = [
      makeField({ key: 'a' }),
      makeField({
        key: 'b',
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'a', operator: 'eq', value: 'yes' }] }
      }),
      makeField({
        key: 'c',
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'b', operator: 'not_empty' }] }
      }),
    ]
    const graph = buildFormGraph(fields)

    // a is empty → b hidden → c hidden
    expect(graph.nodes.get('b')!.isVisible).toBe(false)
    expect(graph.nodes.get('c')!.isVisible).toBe(false)

    handleFieldChange(graph, 'a', 'yes')
    expect(graph.nodes.get('b')!.isVisible).toBe(true)
    // c depends on b being not_empty, but b was just shown with default value ''
    expect(graph.nodes.get('c')!.isVisible).toBe(false)

    handleFieldChange(graph, 'b', 'hello')
    expect(graph.nodes.get('c')!.isVisible).toBe(true)
  })

  it('handles OR conditions', () => {
    const fields = [
      makeField({ key: 'x' }),
      makeField({ key: 'y' }),
      makeField({
        key: 'z',
        conditions: {
          action: 'SHOW', operator: 'or',
          rules: [
            { fieldKey: 'x', operator: 'eq', value: 'go' },
            { fieldKey: 'y', operator: 'eq', value: 'go' },
          ]
        }
      }),
    ]
    const graph = buildFormGraph(fields)
    expect(graph.nodes.get('z')!.isVisible).toBe(false)

    handleFieldChange(graph, 'x', 'go')
    expect(graph.nodes.get('z')!.isVisible).toBe(true)

    handleFieldChange(graph, 'x', 'stop')
    expect(graph.nodes.get('z')!.isVisible).toBe(false)

    handleFieldChange(graph, 'y', 'go')
    expect(graph.nodes.get('z')!.isVisible).toBe(true)
  })

  it('tracks required state changes in patch', () => {
    const fields = [
      makeField({ key: 'premium', type: 'CHECKBOX' }),
      makeField({
        key: 'billingEmail',
        required: false,
        conditions: { action: 'REQUIRE', operator: 'and', rules: [{ fieldKey: 'premium', operator: 'eq', value: true }] }
      }),
    ]
    const graph = buildFormGraph(fields)
    expect(graph.nodes.get('billingEmail')!.isRequired).toBe(false)

    const patch = handleFieldChange(graph, 'premium', true)
    expect(graph.nodes.get('billingEmail')!.isRequired).toBe(true)
    expect(patch.requiredChanges.get('billingEmail')).toBe(true)
  })
})

describe('collectSubmissionValues', () => {
  it('excludes hidden fields', () => {
    const fields = [
      makeField({ key: 'visible' }),
      makeField({
        key: 'hidden',
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'visible', operator: 'eq', value: 'show' }] }
      }),
    ]
    const graph = buildFormGraph(fields, { visible: 'nope', hidden: 'ghost' })
    const values = collectSubmissionValues(graph)
    expect(values).toHaveProperty('visible')
    expect(values).not.toHaveProperty('hidden')
  })

  it('excludes layout fields', () => {
    const fields = [
      makeField({ key: 'section', type: 'SECTION_BREAK' }),
      makeField({ key: 'group', type: 'FIELD_GROUP' }),
      makeField({ key: 'name' }),
    ]
    const graph = buildFormGraph(fields)
    const values = collectSubmissionValues(graph)
    expect(values).not.toHaveProperty('section')
    expect(values).not.toHaveProperty('group')
    expect(values).toHaveProperty('name')
  })
})
