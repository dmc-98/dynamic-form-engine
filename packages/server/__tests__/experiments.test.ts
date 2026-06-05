import { describe, expect, it } from 'vitest'
import { selectExperimentVariant } from '../src/experiments'
import type { FormExperimentRecord } from '../src/adapters'

function createExperiment(
  variants: FormExperimentRecord['variants'],
): FormExperimentRecord {
  const now = new Date('2026-03-13T09:00:00.000Z')

  return {
    id: 'exp-onboarding',
    formId: 'form-1',
    tenantId: 'tenant-1',
    name: 'Onboarding Experiment',
    status: 'ACTIVE',
    variants,
    createdAt: now,
    updatedAt: now,
  }
}

describe('selectExperimentVariant', () => {
  it('assigns a deterministic variant for the same subject', () => {
    const experiment = createExperiment([
      {
        id: 'variant-guided',
        experimentId: 'exp-onboarding',
        key: 'guided',
        label: 'Guided',
        weight: 80,
      },
      {
        id: 'variant-control',
        experimentId: 'exp-onboarding',
        key: 'control',
        label: 'Control',
        weight: 20,
      },
    ])

    const first = selectExperimentVariant(experiment, 'user-42')
    const second = selectExperimentVariant(experiment, 'user-42')

    expect(first).toEqual(second)
    expect(['control', 'guided']).toContain(first.key)
  })

  it('distributes subjects across weighted variants', () => {
    const experiment = createExperiment([
      {
        id: 'variant-guided',
        experimentId: 'exp-onboarding',
        key: 'guided',
        label: 'Guided',
        weight: 70,
      },
      {
        id: 'variant-control',
        experimentId: 'exp-onboarding',
        key: 'control',
        label: 'Control',
        weight: 30,
      },
    ])

    const assignments = new Map<string, number>()

    for (let index = 0; index < 200; index++) {
      const variant = selectExperimentVariant(experiment, `user-${index}`)
      assignments.set(variant.key, (assignments.get(variant.key) ?? 0) + 1)
    }

    expect(assignments.get('guided')).toBeGreaterThan(0)
    expect(assignments.get('control')).toBeGreaterThan(0)
    expect(assignments.get('guided')).toBeGreaterThan(assignments.get('control') ?? 0)
  })

  it('throws when the experiment has no selectable weight', () => {
    const emptyExperiment = createExperiment([])
    const invalidWeightExperiment = createExperiment([
      {
        id: 'variant-zero',
        experimentId: 'exp-onboarding',
        key: 'control',
        label: 'Control',
        weight: 0,
      },
      {
        id: 'variant-negative',
        experimentId: 'exp-onboarding',
        key: 'guided',
        label: 'Guided',
        weight: -10,
      },
    ])

    expect(() => selectExperimentVariant(emptyExperiment, 'user-1')).toThrow(
      'does not have any selectable variants',
    )
    expect(() => selectExperimentVariant(invalidWeightExperiment, 'user-2')).toThrow(
      'does not have any selectable variants',
    )
  })
})
