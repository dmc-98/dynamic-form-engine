import { describe, it, expect } from 'vitest'
import { getTemplate, getTemplatesByCategory, listTemplates, type FormTemplate } from '../src/templates'
import { createFormEngine, createFormStepper } from '../src/engine'
import { flattenFieldTree } from '../src/dag'

// ─── M1 Starter Templates ──────────────────────────────────────────────────
// The three "first trust moment" starters. Each showcases a DFE differentiator
// and must be a valid, loadable, behaviour-correct configuration.

const STARTER_IDS = ['user-onboarding', 'loan-application', 'admin-approval-workflow'] as const

describe('M1 starter templates: registration & metadata', () => {
  it('registers all three starter templates', () => {
    for (const id of STARTER_IDS) {
      expect(getTemplate(id), `template "${id}" should be registered`).toBeDefined()
    }
  })

  it('exposes the starter templates from listTemplates()', () => {
    const ids = listTemplates().map(t => t.id)
    for (const id of STARTER_IDS) {
      expect(ids).toContain(id)
    }
  })

  it('assigns the expected categories', () => {
    expect(getTemplate('user-onboarding')?.category).toBe('onboarding')
    expect(getTemplate('loan-application')?.category).toBe('application')
    expect(getTemplate('admin-approval-workflow')?.category).toBe('workflow')
  })

  it('finds the onboarding starter by category', () => {
    const onboarding = getTemplatesByCategory('onboarding')
    expect(onboarding.map(t => t.id)).toContain('user-onboarding')
  })

  it('gives every starter a name and description', () => {
    for (const id of STARTER_IDS) {
      const t = getTemplate(id)!
      expect(t.name.length).toBeGreaterThan(0)
      expect(t.description.length).toBeGreaterThan(0)
    }
  })
})

describe('M1 starter templates: structural integrity', () => {
  const starters = STARTER_IDS.map(id => getTemplate(id)).filter(Boolean) as FormTemplate[]

  it('has unique, well-formed fields in each template', () => {
    for (const t of starters) {
      const fields = flattenFieldTree(t.fields)
      const keys = new Set<string>()
      for (const f of fields) {
        expect(f.id, `field in ${t.id} missing id`).toBeTruthy()
        expect(f.key, `field in ${t.id} missing key`).toBeTruthy()
        expect(f.type, `field ${f.key} in ${t.id} missing type`).toBeTruthy()
        expect(f.label, `field ${f.key} in ${t.id} missing label`).toBeTruthy()
        expect(typeof f.order).toBe('number')
        expect(f.config, `field ${f.key} in ${t.id} missing config`).toBeDefined()
        expect(keys.has(f.key), `duplicate key ${f.key} in ${t.id}`).toBe(false)
        keys.add(f.key)
      }
    }
  })

  it('only references existing fields/steps from stepId, conditions and branches', () => {
    for (const t of starters) {
      const fields = flattenFieldTree(t.fields)
      const fieldKeys = new Set(fields.map(f => f.key))
      const stepIds = new Set((t.steps ?? []).map(s => s.id))

      for (const f of fields) {
        if (f.stepId) {
          expect(stepIds.has(f.stepId), `field ${f.key} references unknown step ${f.stepId} in ${t.id}`).toBe(true)
        }
        for (const rule of f.conditions?.rules ?? []) {
          expect(fieldKeys.has(rule.fieldKey), `condition on ${f.key} references unknown field ${rule.fieldKey} in ${t.id}`).toBe(true)
        }
      }
      for (const step of t.steps ?? []) {
        for (const branch of step.branches ?? []) {
          expect(stepIds.has(branch.targetStepId), `branch target ${branch.targetStepId} missing in ${t.id}`).toBe(true)
          for (const rule of branch.condition.rules) {
            expect(fieldKeys.has(rule.fieldKey), `branch condition references unknown field ${rule.fieldKey} in ${t.id}`).toBe(true)
          }
        }
      }
    }
  })

  it('loads every starter template into the engine without throwing', () => {
    for (const t of starters) {
      expect(() => createFormEngine(t.fields), `${t.id} should build an engine`).not.toThrow()
    }
  })
})

describe('M1 starter templates: behaviour', () => {
  it('user-onboarding hides business-only fields until account type is business', () => {
    const t = getTemplate('user-onboarding')!
    const engine = createFormEngine(t.fields)

    const visibleBefore = new Set(engine.getVisibleFields().map(f => f.key))
    expect(visibleBefore.has('companyName')).toBe(false)

    engine.setFieldValue('accountType', 'business')

    const visibleAfter = new Set(engine.getVisibleFields().map(f => f.key))
    expect(visibleAfter.has('companyName')).toBe(true)
  })

  it('loan-application computes an estimated monthly payment from amount and term', () => {
    const t = getTemplate('loan-application')!
    const engine = createFormEngine(t.fields)

    engine.setFieldValue('loanAmount', 24000)
    engine.setFieldValue('loanTermYears', 2)

    // 24000 / (2 * 12) = 1000
    expect(engine.getComputedValue('estimatedMonthly')).toBe(1000)
  })

  it('admin-approval-workflow requires a rejection reason only when rejecting', () => {
    const t = getTemplate('admin-approval-workflow')!
    const engine = createFormEngine(t.fields)

    engine.setFieldValue('decision', 'approve')
    expect(engine.getFieldState('rejectionReason')?.isRequired).toBe(false)

    engine.setFieldValue('decision', 'reject')
    expect(engine.getFieldState('rejectionReason')?.isRequired).toBe(true)
  })

  it('admin-approval-workflow exposes a multi-step flow with a stepper', () => {
    const t = getTemplate('admin-approval-workflow')!
    const engine = createFormEngine(t.fields)
    const stepper = createFormStepper(t.steps ?? [], engine)

    expect(stepper.getVisibleSteps().length).toBeGreaterThanOrEqual(2)
    expect(stepper.getCurrentStep()).not.toBeNull()
  })
})
