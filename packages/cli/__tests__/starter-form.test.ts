import { describe, it, expect } from 'vitest'
import {
  listStarterForms,
  resolveStarterTemplateId,
  getStarterFormScaffold,
} from '../src/starter-form'

describe('listStarterForms', () => {
  it('exposes the three starter aliases', () => {
    const aliases = listStarterForms().map(s => s.alias)
    expect(aliases).toEqual(expect.arrayContaining(['onboarding', 'application', 'workflow']))
  })

  it('maps each alias to a known dfe-core template id', () => {
    for (const s of listStarterForms()) {
      expect(s.templateId.length).toBeGreaterThan(0)
    }
  })
})

describe('resolveStarterTemplateId', () => {
  it('resolves a friendly alias to its template id', () => {
    expect(resolveStarterTemplateId('onboarding')).toBe('user-onboarding')
    expect(resolveStarterTemplateId('application')).toBe('loan-application')
    expect(resolveStarterTemplateId('workflow')).toBe('admin-approval-workflow')
  })

  it('accepts a full template id directly', () => {
    expect(resolveStarterTemplateId('admin-approval-workflow')).toBe('admin-approval-workflow')
  })

  it('is case-insensitive on aliases', () => {
    expect(resolveStarterTemplateId('Onboarding')).toBe('user-onboarding')
  })

  it('returns null for an unknown choice', () => {
    expect(resolveStarterTemplateId('does-not-exist')).toBeNull()
  })
})

describe('getStarterFormScaffold', () => {
  it('returns null for an unknown template', () => {
    expect(getStarterFormScaffold('nope')).toBeNull()
  })

  it('produces a TypeScript module that imports from dfe-core', () => {
    const scaffold = getStarterFormScaffold('onboarding')!
    expect(scaffold).not.toBeNull()
    expect(scaffold.filename.endsWith('.ts')).toBe(true)
    expect(scaffold.code).toContain("@dmc--98/dfe-core")
    expect(scaffold.code).toContain('FormField')
  })

  it('embeds the real template fields as exported config', () => {
    const scaffold = getStarterFormScaffold('application')!
    // The loan template's signature fields must appear in the generated source
    expect(scaffold.code).toContain('loanAmount')
    expect(scaffold.code).toContain('estimatedMonthly')
    expect(scaffold.code).toMatch(/export const \w+Fields/)
  })

  it('embeds steps when the template is multi-step', () => {
    const scaffold = getStarterFormScaffold('workflow')!
    expect(scaffold.code).toContain('export const')
    expect(scaffold.code).toContain('Steps')
    expect(scaffold.code).toContain('step_decision')
  })

  it('generates valid JSON-serializable field data (round-trips)', () => {
    const scaffold = getStarterFormScaffold('onboarding')!
    // The embedded payload must be parseable back into objects
    const match = scaffold.code.match(/JSON\.parse\(`(.+?)`\)/s)
    expect(match, 'scaffold should embed a JSON payload').not.toBeNull()
    const parsed = JSON.parse(match![1])
    expect(Array.isArray(parsed.fields)).toBe(true)
    expect(parsed.fields.length).toBeGreaterThan(0)
  })
})
