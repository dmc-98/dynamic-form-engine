import { describe, it, expect } from 'vitest'
import {
  applyFormMigration,
  migrateFormValues,
  validateMigrationChain,
  migrationAffectedKeys,
} from '../src/migration'
import type { FormField, FormMigration } from '../src/types'

function field(key: string): FormField {
  return { id: `id_${key}`, versionId: 'v1', key, label: key, type: 'SHORT_TEXT', required: false, order: 1, config: {} }
}

function migration(over: Partial<FormMigration>): FormMigration {
  return { fromVersion: 1, toVersion: 2, renames: {}, removals: [], additions: [], ...over }
}

describe('applyFormMigration', () => {
  it('renames a key and preserves its value', () => {
    const result = applyFormMigration({ firstName: 'Ada' }, migration({ renames: { firstName: 'givenName' } }))
    expect(result.givenName).toBe('Ada')
    expect(result.firstName).toBeUndefined()
  })

  it('removes keys', () => {
    const result = applyFormMigration({ a: 1, b: 2 }, migration({ removals: ['b'] }))
    expect(result).toEqual({ a: 1 })
  })

  it('adds new keys with defaults only when absent', () => {
    const result = applyFormMigration({ a: 1 }, migration({ additions: [{ field: field('country'), defaultValue: 'US' }] }))
    expect(result.country).toBe('US')
  })

  it('does not clobber an existing value with an addition default', () => {
    const result = applyFormMigration({ country: 'CA' }, migration({ additions: [{ field: field('country'), defaultValue: 'US' }] }))
    expect(result.country).toBe('CA')
  })

  it('applies renames before the custom transform', () => {
    const result = applyFormMigration(
      { full: 'Ada Lovelace' },
      migration({
        renames: { full: 'name' },
        transform: (v) => ({ ...v, upper: String(v.name).toUpperCase() }),
      }),
    )
    expect(result.name).toBe('Ada Lovelace')
    expect(result.upper).toBe('ADA LOVELACE')
  })

  it('does not mutate the input values', () => {
    const input = { a: 1 }
    applyFormMigration(input, migration({ removals: ['a'] }))
    expect(input).toEqual({ a: 1 })
  })
})

describe('migrateFormValues', () => {
  it('applies a contiguous chain in order', () => {
    const migrations: FormMigration[] = [
      migration({ fromVersion: 1, toVersion: 2, renames: { a: 'b' } }),
      migration({ fromVersion: 2, toVersion: 3, additions: [{ field: field('c'), defaultValue: 0 }] }),
    ]
    const result = migrateFormValues({ a: 'x' }, 1, migrations)
    expect(result.values).toEqual({ b: 'x', c: 0 })
    expect(result.toVersion).toBe(3)
    expect(result.applied).toEqual(['v1 → v2', 'v2 → v3'])
  })

  it('sorts migrations regardless of input order', () => {
    const migrations: FormMigration[] = [
      migration({ fromVersion: 2, toVersion: 3, removals: ['tmp'] }),
      migration({ fromVersion: 1, toVersion: 2, additions: [{ field: field('tmp'), defaultValue: 1 }] }),
    ]
    const result = migrateFormValues({}, 1, migrations)
    expect(result.toVersion).toBe(3)
    expect(result.values.tmp).toBeUndefined()
  })

  it('skips migrations that do not match the current version', () => {
    const migrations: FormMigration[] = [
      migration({ fromVersion: 5, toVersion: 6, removals: ['x'] }),
    ]
    const result = migrateFormValues({ x: 1 }, 1, migrations)
    expect(result.toVersion).toBe(1)
    expect(result.values).toEqual({ x: 1 })
    expect(result.applied).toEqual([])
  })
})

describe('validateMigrationChain', () => {
  it('returns no problems for a clean chain', () => {
    const migrations: FormMigration[] = [
      migration({ fromVersion: 1, toVersion: 2 }),
      migration({ fromVersion: 2, toVersion: 3 }),
    ]
    expect(validateMigrationChain(1, migrations)).toEqual([])
  })

  it('reports a gap in the chain', () => {
    const migrations: FormMigration[] = [
      migration({ fromVersion: 1, toVersion: 2 }),
      migration({ fromVersion: 3, toVersion: 4 }),
    ]
    const problems = validateMigrationChain(1, migrations)
    expect(problems.length).toBeGreaterThan(0)
    expect(problems[0]).toContain('v2')
  })

  it('reports a migration that does not advance the version', () => {
    const problems = validateMigrationChain(1, [migration({ fromVersion: 1, toVersion: 1 })])
    expect(problems.some(p => p.includes('does not advance'))).toBe(true)
  })
})

describe('migrationAffectedKeys', () => {
  it('collects keys from renames, removals and additions', () => {
    const keys = migrationAffectedKeys(migration({
      renames: { a: 'b' },
      removals: ['c'],
      additions: [{ field: field('d'), defaultValue: null }],
    }))
    expect([...keys].sort()).toEqual(['a', 'b', 'c', 'd'])
  })
})
