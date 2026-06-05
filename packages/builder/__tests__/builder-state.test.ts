import { describe, it, expect } from 'vitest'
import {
  createBuilderState,
  builderReducer,
  toFormConfig,
  makeField,
  deriveFieldKey,
} from '../src/builder-state'

describe('deriveFieldKey', () => {
  it('snake_cases a label', () => {
    expect(deriveFieldKey('First Name', new Set())).toBe('first_name')
  })
  it('disambiguates against existing keys', () => {
    expect(deriveFieldKey('Email', new Set(['email']))).toBe('email_2')
    expect(deriveFieldKey('Email', new Set(['email', 'email_2']))).toBe('email_3')
  })
  it('falls back to "field" for empty labels', () => {
    expect(deriveFieldKey('   ', new Set())).toBe('field')
  })
})

describe('makeField', () => {
  it('creates a field with defaults and a derived key', () => {
    const f = makeField('EMAIL', new Set(), 1)
    expect(f.type).toBe('EMAIL')
    expect(f.key).toBeTruthy()
    expect(f.required).toBe(false)
    expect(f.order).toBe(1)
  })
  it('seeds an option for selection fields', () => {
    const f = makeField('SELECT', new Set(), 1)
    expect((f.config as { options?: unknown[] }).options).toHaveLength(1)
  })
})

describe('builderReducer — fields', () => {
  it('adds a field and selects it', () => {
    const s1 = builderReducer(createBuilderState(), { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    expect(s1.fields).toHaveLength(1)
    expect(s1.selectedFieldId).toBe(s1.fields[0].id)
    expect(s1.fields[0].order).toBe(1)
  })

  it('gives added fields unique keys', () => {
    let s = createBuilderState()
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'EMAIL' })
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'EMAIL' })
    const keys = s.fields.map(f => f.key)
    expect(new Set(keys).size).toBe(2)
  })

  it('removes a field and renumbers order', () => {
    let s = createBuilderState()
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'NUMBER' })
    const firstId = s.fields[0].id
    s = builderReducer(s, { type: 'REMOVE_FIELD', id: firstId })
    expect(s.fields).toHaveLength(1)
    expect(s.fields[0].order).toBe(1)
  })

  it('clears selection when the selected field is removed', () => {
    let s = builderReducer(createBuilderState(), { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    const id = s.fields[0].id
    s = builderReducer(s, { type: 'REMOVE_FIELD', id })
    expect(s.selectedFieldId).toBeNull()
  })

  it('reorders fields via MOVE_FIELD and renumbers', () => {
    let s = createBuilderState()
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' }) // a
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'NUMBER' })     // b
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'EMAIL' })      // c
    const [a, b, c] = s.fields.map(f => f.id)
    s = builderReducer(s, { type: 'MOVE_FIELD', from: 0, to: 2 })
    expect(s.fields.map(f => f.id)).toEqual([b, c, a])
    expect(s.fields.map(f => f.order)).toEqual([1, 2, 3])
  })

  it('ignores out-of-range moves', () => {
    let s = builderReducer(createBuilderState(), { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    const before = s.fields.map(f => f.id)
    s = builderReducer(s, { type: 'MOVE_FIELD', from: 0, to: 5 })
    expect(s.fields.map(f => f.id)).toEqual(before)
  })

  it('updates field properties', () => {
    let s = builderReducer(createBuilderState(), { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    const id = s.fields[0].id
    s = builderReducer(s, { type: 'UPDATE_FIELD', id, patch: { label: 'Your Name', required: true } })
    expect(s.fields[0].label).toBe('Your Name')
    expect(s.fields[0].required).toBe(true)
  })

  it('refuses to set a blank key', () => {
    let s = builderReducer(createBuilderState(), { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    const id = s.fields[0].id
    const originalKey = s.fields[0].key
    s = builderReducer(s, { type: 'UPDATE_FIELD', id, patch: { key: '   ' } })
    expect(s.fields[0].key).toBe(originalKey)
  })

  it('does not mutate the previous state', () => {
    const s0 = createBuilderState()
    const s1 = builderReducer(s0, { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    expect(s0.fields).toHaveLength(0)
    expect(s1.fields).toHaveLength(1)
  })
})

describe('builderReducer — steps', () => {
  it('adds and removes steps', () => {
    let s = createBuilderState()
    s = builderReducer(s, { type: 'ADD_STEP', title: 'Personal' })
    s = builderReducer(s, { type: 'ADD_STEP' })
    expect(s.steps).toHaveLength(2)
    expect(s.steps[0].title).toBe('Personal')
    const id = s.steps[0].id
    s = builderReducer(s, { type: 'REMOVE_STEP', id })
    expect(s.steps).toHaveLength(1)
    expect(s.steps[0].order).toBe(1)
  })

  it('assigns a field to a step and detaches on step removal', () => {
    let s = createBuilderState()
    s = builderReducer(s, { type: 'ADD_STEP', title: 'S1' })
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    const stepId = s.steps[0].id
    const fieldId = s.fields[0].id
    s = builderReducer(s, { type: 'ASSIGN_FIELD_TO_STEP', id: fieldId, stepId })
    expect(s.fields[0].stepId).toBe(stepId)
    s = builderReducer(s, { type: 'REMOVE_STEP', id: stepId })
    expect(s.fields[0].stepId).toBeNull()
  })
})

describe('toFormConfig', () => {
  it('emits a DFE-shaped config with normalized order', () => {
    let s = createBuilderState()
    s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' })
    s = builderReducer(s, { type: 'ADD_STEP', title: 'Only Step' })
    const config = toFormConfig(s)
    expect(config.fields[0].order).toBe(1)
    expect(config.steps[0].order).toBe(1)
    expect(config.steps[0].title).toBe('Only Step')
  })
})
