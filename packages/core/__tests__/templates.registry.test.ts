import { describe, it, expect } from 'vitest'
import { TEMPLATES, getTemplate, listTemplates } from '../src/templates'
import { suggestConfigRepairs } from '../src/config-repair'
import { createFormEngine } from '../src/engine'

// ─── M3: registry-wide quality gate ──────────────────────────────────────────
// Every template in the registry must be a valid, loadable configuration with
// zero repair errors. This is the test that makes the /templates gallery safe:
// anything listed is guaranteed to open cleanly in the playground.

describe('template registry quality gate', () => {
  it('has at least 12 templates (gallery-worthy)', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(12)
  })

  it('every template has unique id, name, description, category', () => {
    const ids = new Set<string>()
    for (const t of TEMPLATES) {
      expect(t.id, 'template missing id').toBeTruthy()
      expect(ids.has(t.id), `duplicate template id ${t.id}`).toBe(false)
      ids.add(t.id)
      expect(t.name.length).toBeGreaterThan(0)
      expect(t.description.length).toBeGreaterThan(0)
      expect(t.category.length).toBeGreaterThan(0)
    }
  })

  it('every template passes suggestConfigRepairs with zero errors', () => {
    for (const t of TEMPLATES) {
      const result = suggestConfigRepairs({ fields: t.fields, steps: t.steps })
      expect(result.errorCount, `${t.id}: ${JSON.stringify(result.suggestions)}`).toBe(0)
    }
  })

  it('every template loads into the engine without throwing', () => {
    for (const t of TEMPLATES) {
      expect(() => createFormEngine(t.fields), t.id).not.toThrow()
    }
  })

  it('multi-step templates have ≥2 steps and all fields point at real steps', () => {
    for (const t of TEMPLATES.filter(x => (x.steps?.length ?? 0) > 0)) {
      expect(t.steps!.length).toBeGreaterThanOrEqual(2)
      const stepIds = new Set(t.steps!.map(s => s.id))
      for (const f of t.fields) {
        if (f.stepId) expect(stepIds.has(f.stepId), `${t.id}/${f.key} → ${f.stepId}`).toBe(true)
      }
    }
  })

  it('new M3 templates are present', () => {
    for (const id of ['lead-generation', 'nps-survey', 'appointment-booking', 'support-ticket', 'newsletter-signup']) {
      expect(getTemplate(id), `missing template ${id}`).toBeDefined()
    }
  })

  it('listTemplates returns gallery metadata for all', () => {
    expect(listTemplates().length).toBe(TEMPLATES.length)
  })
})
