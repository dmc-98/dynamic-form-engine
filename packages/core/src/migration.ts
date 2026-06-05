import type { FormValues, FormMigration, FieldKey } from './types'

// ─── Config Migration Engine ─────────────────────────────────────────────────
// Apply versioned migrations to stored form submission values so saved data
// keeps working as a form's schema evolves (renamed keys, removed fields,
// new fields with defaults, and custom transforms).

export interface MigrationResult {
  values: FormValues
  /** Human-readable notes about what each migration did. */
  applied: string[]
  /** The version the values are at after migration. */
  toVersion: number
}

/**
 * Apply a single migration to a set of form values.
 *
 * Order of operations: renames → removals → additions → custom transform.
 * This ordering means a renamed key can subsequently be removed or used by the
 * transform, and additions never clobber an existing (possibly renamed) value.
 */
export function applyFormMigration(values: FormValues, migration: FormMigration): FormValues {
  let next: FormValues = { ...values }

  // 1. Renames: move oldKey → newKey (preserves value, drops old key)
  for (const [from, to] of Object.entries(migration.renames ?? {})) {
    if (from === to) continue
    if (Object.prototype.hasOwnProperty.call(next, from)) {
      next[to] = next[from]
      delete next[from]
    }
  }

  // 2. Removals: drop keys entirely
  for (const key of migration.removals ?? []) {
    delete next[key]
  }

  // 3. Additions: add new keys with defaults, only if absent
  for (const addition of migration.additions ?? []) {
    const key = addition.field.key
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      next[key] = addition.defaultValue
    }
  }

  // 4. Custom transform for anything the declarative steps can't express
  if (migration.transform) {
    next = migration.transform(next)
  }

  return next
}

/**
 * Apply a chain of migrations in order to bring stored values from their
 * current version up to the latest. Migrations must form a contiguous chain
 * (each `fromVersion` equal to the running version); out-of-order or gapped
 * migrations are skipped and reported.
 *
 * @param values - stored submission values
 * @param fromVersion - the version the values are currently at
 * @param migrations - available migrations (any order; sorted internally)
 */
export function migrateFormValues(
  values: FormValues,
  fromVersion: number,
  migrations: FormMigration[],
): MigrationResult {
  const sorted = [...migrations].sort((a, b) => a.fromVersion - b.fromVersion)
  let current = fromVersion
  let next: FormValues = { ...values }
  const applied: string[] = []

  for (const migration of sorted) {
    if (migration.fromVersion !== current) {
      // Not the next contiguous step — skip (e.g. already applied, or a gap).
      continue
    }
    next = applyFormMigration(next, migration)
    applied.push(`v${migration.fromVersion} → v${migration.toVersion}`)
    current = migration.toVersion
  }

  return { values: next, applied, toVersion: current }
}

/**
 * Validate that a set of migrations forms a clean, contiguous chain from a
 * starting version. Returns the list of problems (empty when valid).
 */
export function validateMigrationChain(
  fromVersion: number,
  migrations: FormMigration[],
): string[] {
  const problems: string[] = []
  const sorted = [...migrations].sort((a, b) => a.fromVersion - b.fromVersion)
  let expected = fromVersion

  for (const migration of sorted) {
    if (migration.fromVersion !== expected) {
      problems.push(
        `Expected a migration from v${expected} but found one from v${migration.fromVersion}.`,
      )
      // Resync to keep reporting useful subsequent gaps.
      expected = migration.toVersion
      continue
    }
    if (migration.toVersion <= migration.fromVersion) {
      problems.push(
        `Migration v${migration.fromVersion} → v${migration.toVersion} does not advance the version.`,
      )
    }
    expected = migration.toVersion
  }

  return problems
}

/** Collect the set of field keys a migration touches (renames, removals, additions). */
export function migrationAffectedKeys(migration: FormMigration): Set<FieldKey> {
  const keys = new Set<FieldKey>()
  for (const [from, to] of Object.entries(migration.renames ?? {})) {
    keys.add(from)
    keys.add(to)
  }
  for (const key of migration.removals ?? []) keys.add(key)
  for (const addition of migration.additions ?? []) keys.add(addition.field.key)
  return keys
}
