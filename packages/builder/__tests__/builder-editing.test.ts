import { describe, it, expect } from 'vitest'
import { createBuilderState, builderReducer, type DndBuilderState } from '../src/builder-state'

// ─── M1a: keyboard reorder + options/validation editing ─────────────────────
// RED-first tests for the new editing actions that the playground and the
// DnD builder both need: accessible (keyboard) moves, option list editing for
// selection fields, and per-field validation-rule editing.

function seeded(): DndBuilderState {
  let s = createBuilderState()
  s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'SHORT_TEXT' }) // idx 0
  s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'SELECT' })     // idx 1
  s = builderReducer(s, { type: 'ADD_FIELD', fieldType: 'EMAIL' })      // idx 2
  return s
}

describe('MOVE_FIELD_BY (keyboard reorder)', () => {
  it('moves a field up by one', () => {
    const s = seeded()
    const emailId = s.fields[2].id
    const next = builderReducer(s, { type: 'MOVE_FIELD_BY', id: emailId, delta: -1 })
    expect(next.fields[1].id).toBe(emailId)
    expect(next.fields.map(f => f.order)).toEqual([1, 2, 3]) // renumbered
  })

  it('moves a field down by one', () => {
    const s = seeded()
    const textId = s.fields[0].id
    const next = builderReducer(s, { type: 'MOVE_FIELD_BY', id: textId, delta: 1 })
    expect(next.fields[1].id).toBe(textId)
  })

  it('clamps at the top and bottom (no-op, same reference)', () => {
    const s = seeded()
    const topId = s.fields[0].id
    const bottomId = s.fields[2].id
    expect(builderReducer(s, { type: 'MOVE_FIELD_BY', id: topId, delta: -1 }).fields[0].id).toBe(topId)
    expect(builderReducer(s, { type: 'MOVE_FIELD_BY', id: bottomId, delta: 1 }).fields[2].id).toBe(bottomId)
  })

  it('ignores unknown ids', () => {
    const s = seeded()
    const next = builderReducer(s, { type: 'MOVE_FIELD_BY', id: 'nope', delta: 1 })
    expect(next.fields.map(f => f.id)).toEqual(s.fields.map(f => f.id))
  })
})

describe('option editing for selection fields', () => {
  it('ADD_OPTION appends with a derived unique value', () => {
    const s = seeded()
    const sel = s.fields[1]
    const next = builderReducer(s, { type: 'ADD_OPTION', id: sel.id, label: 'Second' })
    const cfg = next.fields[1].config as { options: Array<{ label: string; value: string }> }
    expect(cfg.options).toHaveLength(2)
    expect(cfg.options[1].label).toBe('Second')
    expect(cfg.options[1].value).toBe('second')
  })

  it('ADD_OPTION disambiguates duplicate values', () => {
    let s = seeded()
    const sel = s.fields[1]
    s = builderReducer(s, { type: 'ADD_OPTION', id: sel.id, label: 'Option 1' }) // value option_1 exists
    const cfg = s.fields[1].config as { options: Array<{ value: string }> }
    expect(new Set(cfg.options.map(o => o.value)).size).toBe(cfg.options.length)
  })

  it('UPDATE_OPTION edits label and value by index', () => {
    const s = seeded()
    const sel = s.fields[1]
    const next = builderReducer(s, { type: 'UPDATE_OPTION', id: sel.id, index: 0, patch: { label: 'Hello', value: 'hello' } })
    const cfg = next.fields[1].config as { options: Array<{ label: string; value: string }> }
    expect(cfg.options[0]).toEqual({ label: 'Hello', value: 'hello' })
  })

  it('REMOVE_OPTION removes by index but never empties the list', () => {
    let s = seeded()
    const sel = s.fields[1]
    s = builderReducer(s, { type: 'ADD_OPTION', id: sel.id, label: 'Second' })
    s = builderReducer(s, { type: 'REMOVE_OPTION', id: sel.id, index: 0 })
    let cfg = s.fields[1].config as { options: Array<{ label: string }> }
    expect(cfg.options).toHaveLength(1)
    expect(cfg.options[0].label).toBe('Second')
    // Removing the last option is refused (selection fields need ≥1 option).
    s = builderReducer(s, { type: 'REMOVE_OPTION', id: sel.id, index: 0 })
    cfg = s.fields[1].config as { options: Array<{ label: string }> }
    expect(cfg.options).toHaveLength(1)
  })

  it('option actions on non-selection fields are no-ops', () => {
    const s = seeded()
    const text = s.fields[0]
    const next = builderReducer(s, { type: 'ADD_OPTION', id: text.id, label: 'X' })
    expect(next.fields[0].config).toEqual(text.config)
  })
})

describe('SET_VALIDATION (per-field validation rules)', () => {
  it('sets text length and pattern rules into config', () => {
    const s = seeded()
    const text = s.fields[0]
    const next = builderReducer(s, {
      type: 'SET_VALIDATION', id: text.id,
      validation: { minLength: 2, maxLength: 50, pattern: '^[a-z]+$' },
    })
    const cfg = next.fields[0].config as { minLength?: number; maxLength?: number; pattern?: string }
    expect(cfg.minLength).toBe(2)
    expect(cfg.maxLength).toBe(50)
    expect(cfg.pattern).toBe('^[a-z]+$')
  })

  it('clears a rule when set to undefined', () => {
    let s = seeded()
    const text = s.fields[0]
    s = builderReducer(s, { type: 'SET_VALIDATION', id: text.id, validation: { minLength: 2 } })
    s = builderReducer(s, { type: 'SET_VALIDATION', id: text.id, validation: { minLength: undefined } })
    const cfg = s.fields[0].config as { minLength?: number }
    expect('minLength' in cfg).toBe(false)
  })

  it('preserves unrelated config (e.g. options) when setting validation', () => {
    const s = seeded()
    const sel = s.fields[1]
    const next = builderReducer(s, { type: 'SET_VALIDATION', id: sel.id, validation: { } })
    const cfg = next.fields[1].config as { options?: unknown[] }
    expect(cfg.options).toHaveLength(1)
  })

  it('ignores non-validation keys (cannot corrupt structural config)', () => {
    const s = seeded()
    const sel = s.fields[1] // SELECT with options + mode
    const next = builderReducer(s, {
      type: 'SET_VALIDATION', id: sel.id,
      validation: { options: 42, mode: 'hacked', minLength: 3 } as never,
    })
    const cfg = next.fields[1].config as { options?: unknown[]; mode?: string; minLength?: number }
    expect(Array.isArray(cfg.options)).toBe(true) // not clobbered to 42
    expect(cfg.mode).toBe('static')               // not clobbered
    expect(cfg.minLength).toBe(3)                  // the real validation key applied
  })
})
