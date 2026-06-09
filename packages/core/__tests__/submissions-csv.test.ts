import { describe, it, expect } from 'vitest'
import { exportSubmissionsToCsv } from '../src/import-export'
import type { FormField } from '../src/types'

function field(key: string, label: string): FormField {
  return { id: `id_${key}`, versionId: 'v1', key, label, type: 'SHORT_TEXT', required: false, order: 1, config: {} }
}

describe('exportSubmissionsToCsv', () => {
  const fields = [field('name', 'Full Name'), field('email', 'Email')]
  const rows = [
    { id: 'a', status: 'COMPLETE', values: { name: 'Ada', email: 'ada@x.com' } },
    { id: 'b', status: 'DRAFT', values: { name: 'Logan', email: 'logan@x.com' } },
  ]

  it('emits a header row of meta + field labels', () => {
    const csv = exportSubmissionsToCsv(fields, rows)
    const header = csv.split('\n')[0]
    expect(header).toContain('ID')
    expect(header).toContain('Status')
    expect(header).toContain('Full Name')
    expect(header).toContain('Email')
  })

  it('emits one row per submission with values in field order', () => {
    const csv = exportSubmissionsToCsv(fields, rows)
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(3) // header + 2
    expect(lines[1]).toContain('Ada')
    expect(lines[1]).toContain('COMPLETE')
  })

  it('escapes commas, quotes, and newlines (RFC 4180)', () => {
    const csv = exportSubmissionsToCsv([field('note', 'Note')], [
      { id: 'x', status: 'DRAFT', values: { note: 'a, "b"\nc' } },
    ])
    // The cell with comma/quote/newline must be quoted and inner quotes doubled.
    expect(csv).toContain('"a, ""b""\nc"')
  })

  it('renders missing values as empty and arrays as joined', () => {
    const csv = exportSubmissionsToCsv(
      [field('a', 'A'), field('tags', 'Tags')],
      [{ id: '1', status: 'DRAFT', values: { tags: ['x', 'y'] } }],
    )
    const dataRow = csv.trim().split('\n')[1]
    expect(dataRow).toContain('x, y')
  })

  it('handles an empty submission list (header only)', () => {
    const csv = exportSubmissionsToCsv(fields, [])
    expect(csv.trim().split('\n')).toHaveLength(1)
  })

  it('neutralizes CSV formula injection (=, +, -, @)', () => {
    const csv = exportSubmissionsToCsv([field('payload', 'Payload')], [
      { id: '1', status: 'DRAFT', values: { payload: '=1+2' } },
      { id: '2', status: 'DRAFT', values: { payload: '+SUM(A1)' } },
      { id: '3', status: 'DRAFT', values: { payload: '-2' } },
      { id: '4', status: 'DRAFT', values: { payload: '@cmd' } },
    ])
    // Each dangerous cell must be prefixed with a single quote so spreadsheets
    // treat it as text, not a formula.
    expect(csv).toContain("'=1+2")
    expect(csv).toContain("'+SUM(A1)")
    expect(csv).toContain("'-2")
    expect(csv).toContain("'@cmd")
    // A formula combined with a comma is BOTH guarded and quoted.
    const csv2 = exportSubmissionsToCsv([field('p', 'P')], [{ id: 'x', status: 'D', values: { p: '=A1,B1' } }])
    expect(csv2).toContain(`"'=A1,B1"`)
  })

  it('renders object values as JSON, not [object Object]', () => {
    const csv = exportSubmissionsToCsv([field('meta', 'Meta')], [
      { id: '1', status: 'DRAFT', values: { meta: { a: 1 } } },
    ])
    expect(csv).not.toContain('[object Object]')
    expect(csv).toContain('a')
  })
})
