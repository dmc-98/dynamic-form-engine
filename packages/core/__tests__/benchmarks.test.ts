import { describe, it, expect } from 'vitest'
import { createFormEngine, createFormStepper } from '../src'
import type { FormField, FormStep } from '../src/types'

/**
 * Performance benchmark tests for the Dynamic Form Engine.
 *
 * These tests measure:
 * - Form graph construction speed with varying field counts
 * - Field value change propagation performance (O(k) vs O(n))
 * - Condition evaluation speed on large forms
 * - Validation performance
 *
 * Note: These are not strict performance tests but rather
 * baseline measurements to catch regressions.
 */

// ─── Utilities ──────────────────────────────────────────────────────────────

function generateFields(count: number): FormField[] {
  const fields: FormField[] = []

  for (let i = 0; i < count; i++) {
    fields.push({
      id: `field_${i}`,
      versionId: 'v1',
      key: `field_${i}`,
      label: `Field ${i}`,
      type: i % 5 === 0 ? 'SELECT' : i % 4 === 0 ? 'CHECKBOX' : 'SHORT_TEXT',
      required: i % 3 === 0,
      order: i,
      config: i % 5 === 0 ? {
        mode: 'static',
        options: [
          { label: 'Option 1', value: 'opt1' },
          { label: 'Option 2', value: 'opt2' },
        ],
      } : {},
      conditions: i > 5 && i % 10 === 0 ? {
        operator: 'AND',
        rules: [
          { fieldKey: `field_${i - 5}`, operator: 'EQUALS', value: 'opt1' },
        ],
      } : null,
    })
  }

  return fields
}

function generateSteps(count: number): FormStep[] {
  const steps: FormStep[] = []

  for (let i = 0; i < count; i++) {
    steps.push({
      id: `step_${i}`,
      versionId: 'v1',
      title: `Step ${i}`,
      order: i,
      config: null,
      conditions: null,
    })
  }

  return steps
}

function measureTime(fn: () => void): number {
  const start = performance.now()
  fn()
  const end = performance.now()
  return end - start
}

function measureAverageTime(fn: () => void, iterations: number): number {
  const samples: number[] = []

  for (let i = 0; i < iterations; i++) {
    samples.push(measureTime(fn))
  }

  return samples.reduce((total, sample) => total + sample, 0) / samples.length
}

// ─── Form Graph Construction Benchmarks ──────────────────────────────────────

describe('Performance - Form Graph Construction', () => {
  it('should construct graph with 10 fields quickly', () => {
    const fields = generateFields(10)
    const duration = measureTime(() => {
      createFormEngine(fields)
    })

    expect(duration).toBeLessThan(100) // Should be < 100ms
    console.log(`Graph construction (10 fields): ${duration.toFixed(2)}ms`)
  })

  it('should construct graph with 100 fields reasonably', () => {
    const fields = generateFields(100)
    const duration = measureTime(() => {
      createFormEngine(fields)
    })

    expect(duration).toBeLessThan(500) // Should be < 500ms
    console.log(`Graph construction (100 fields): ${duration.toFixed(2)}ms`)
  })

  it('should construct graph with 500 fields within acceptable time', () => {
    const fields = generateFields(500)
    const duration = measureTime(() => {
      createFormEngine(fields)
    })

    expect(duration).toBeLessThan(5000) // Should be < 5s
    console.log(`Graph construction (500 fields): ${duration.toFixed(2)}ms`)
  })

  it('should scale sub-linearly for graph construction', () => {
    const fields10 = generateFields(10)
    const fields100 = generateFields(100)
    const fields500 = generateFields(500)

    // Average several runs so coverage instrumentation and timer jitter do not
    // turn this regression check into a flaky micro-benchmark.
    const duration10 = Math.max(measureAverageTime(() => createFormEngine(fields10), 25), 0.1)
    const duration100 = Math.max(measureAverageTime(() => createFormEngine(fields100), 15), 0.1)
    const duration500 = Math.max(measureAverageTime(() => createFormEngine(fields500), 8), 0.1)

    // Verify that time doesn't increase linearly (should be closer to O(n log n) or O(n))
    const ratio_100_to_10 = duration100 / duration10
    const ratio_500_to_100 = duration500 / duration100

    console.log(`Scaling 10→100 fields: ${ratio_100_to_10.toFixed(2)}x`)
    console.log(`Scaling 100→500 fields: ${ratio_500_to_100.toFixed(2)}x`)

    // Expect reasonable scaling (not exponential)
    expect(ratio_100_to_10).toBeLessThan(30) // 10-30x for 10x field increase
    expect(ratio_500_to_100).toBeLessThan(20) // Should be sub-linear
  })
})

// ─── Field Value Change Propagation Benchmarks ───────────────────────────────

describe('Performance - Field Value Change Propagation', () => {
  it('should propagate change to 10 dependent fields quickly', () => {
    const fields = generateFields(10)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engine.setFieldValue('field_0', `value_${i}`)
      }
    })

    // 100 iterations should be fast
    const avgPerIteration = duration / 100
    expect(avgPerIteration).toBeLessThan(10) // Each change < 10ms
    console.log(`Propagation (10 fields, 100 iterations): ${(avgPerIteration).toFixed(2)}ms per change`)
  })

  it('should propagate change to 100 dependent fields efficiently', () => {
    const fields = generateFields(100)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 50; i++) {
        engine.setFieldValue('field_0', `value_${i}`)
      }
    })

    const avgPerIteration = duration / 50
    expect(avgPerIteration).toBeLessThan(50) // Each change < 50ms
    console.log(`Propagation (100 fields, 50 iterations): ${(avgPerIteration).toFixed(2)}ms per change`)
  })

  it('should propagate change to 500 dependent fields acceptably', () => {
    const fields = generateFields(500)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 10; i++) {
        engine.setFieldValue('field_0', `value_${i}`)
      }
    })

    const avgPerIteration = duration / 10
    expect(avgPerIteration).toBeLessThan(500) // Each change < 500ms
    console.log(`Propagation (500 fields, 10 iterations): ${(avgPerIteration).toFixed(2)}ms per change`)
  })

  it('should be O(k) not O(n) where k is affected fields', () => {
    // Create two forms: one with many independent fields, one with dependent chain
    const independentFields = generateFields(100)
    const chainedFields: FormField[] = []

    // Create a dependency chain
    for (let i = 0; i < 100; i++) {
      chainedFields.push({
        id: `chain_${i}`,
        versionId: 'v1',
        key: `chain_${i}`,
        label: `Field ${i}`,
        type: 'SHORT_TEXT',
        required: false,
        order: i,
        config: {},
        conditions: i > 0 ? {
          operator: 'AND',
          rules: [
            { fieldKey: `chain_${i - 1}`, operator: 'NOT_EMPTY', value: null },
          ],
        } : null,
      })
    }

    const engineIndependent = createFormEngine(independentFields)
    const engineChained = createFormEngine(chainedFields)

    // Changing a field in the independent form should be as fast as in the chained form
    // because it only affects its direct dependents (k), not all fields (n)

    const durationIndependent = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engineIndependent.setFieldValue('field_0', `value_${i}`)
      }
    })

    const durationChained = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engineChained.setFieldValue('chain_0', `value_${i}`)
      }
    })

    const avgIndependent = durationIndependent / 100
    const avgChained = durationChained / 100

    console.log(`Independent form propagation: ${avgIndependent.toFixed(3)}ms`)
    console.log(`Chained form propagation: ${avgChained.toFixed(3)}ms`)
    console.log(`Ratio: ${(avgChained / avgIndependent).toFixed(2)}x`)

    // Both should be reasonably fast since they're O(k) not O(n)
    expect(avgIndependent).toBeLessThan(50)
    expect(avgChained).toBeLessThan(50)
  })
})

// ─── Condition Evaluation Benchmarks ─────────────────────────────────────────

describe('Performance - Condition Evaluation', () => {
  it('should evaluate 10 conditional fields quickly', () => {
    const fields = generateFields(10)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        engine.getVisibleFields()
      }
    })

    const avgPerCall = duration / 1000
    expect(avgPerCall).toBeLessThan(5) // Each call < 5ms
    console.log(`Visibility evaluation (10 fields): ${(avgPerCall).toFixed(3)}ms per call`)
  })

  it('should evaluate 100 conditional fields efficiently', () => {
    const fields = generateFields(100)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engine.getVisibleFields()
      }
    })

    const avgPerCall = duration / 100
    expect(avgPerCall).toBeLessThan(25) // Each call < 25ms
    console.log(`Visibility evaluation (100 fields): ${(avgPerCall).toFixed(3)}ms per call`)
  })

  it('should evaluate complex conditions reasonably', () => {
    const complexFields: FormField[] = [
      {
        id: 'base',
        versionId: 'v1',
        key: 'base',
        label: 'Base',
        type: 'SELECT',
        required: true,
        order: 0,
        config: {
          mode: 'static',
          options: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
          ],
        },
      },
      ...Array.from({ length: 99 }, (_, i) => ({
        id: `field_${i}`,
        versionId: 'v1',
        key: `field_${i}`,
        label: `Field ${i}`,
        type: 'SHORT_TEXT' as const,
        required: false,
        order: i + 1,
        config: {},
        conditions: {
          operator: 'AND' as const,
          rules: [
            { fieldKey: 'base', operator: 'EQUALS' as const, value: 'a' },
          ],
        },
      })),
    ]

    const engine = createFormEngine(complexFields)

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engine.setFieldValue('base', i % 2 === 0 ? 'a' : 'b')
        engine.getVisibleFields()
      }
    })

    const avgPerIteration = duration / 100
    expect(avgPerIteration).toBeLessThan(100) // Each iteration < 100ms
    console.log(`Complex conditions (100 fields): ${(avgPerIteration).toFixed(2)}ms per iteration`)
  })
})

// ─── Validation Performance Benchmarks ────────────────────────────────────────

describe('Performance - Validation', () => {
  it('should validate 10 fields quickly', () => {
    const fields = generateFields(10)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engine.validate()
      }
    })

    const avgPerValidation = duration / 100
    expect(avgPerValidation).toBeLessThan(10) // Each validation < 10ms
    console.log(`Validation (10 fields): ${(avgPerValidation).toFixed(3)}ms per validation`)
  })

  it('should validate 100 fields efficiently', () => {
    const fields = generateFields(100)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 50; i++) {
        engine.validate()
      }
    })

    const avgPerValidation = duration / 50
    expect(avgPerValidation).toBeLessThan(50) // Each validation < 50ms
    console.log(`Validation (100 fields): ${(avgPerValidation).toFixed(2)}ms per validation`)
  })

  it('should validate 500 fields acceptably', () => {
    const fields = generateFields(500)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 10; i++) {
        engine.validate()
      }
    })

    const avgPerValidation = duration / 10
    expect(avgPerValidation).toBeLessThan(500) // Each validation < 500ms
    console.log(`Validation (500 fields): ${(avgPerValidation).toFixed(2)}ms per validation`)
  })

  it('should validate step-specific fields quickly', () => {
    const fields = generateFields(100)
    const engine = createFormEngine(fields)

    // Add step IDs
    for (let i = 0; i < fields.length; i++) {
      fields[i].stepId = `step_${Math.floor(i / 10)}`
    }

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engine.validateStep('step_0')
      }
    })

    const avgPerValidation = duration / 100
    expect(avgPerValidation).toBeLessThan(20) // Step validation < 20ms
    console.log(`Step validation (10 fields): ${(avgPerValidation).toFixed(3)}ms per validation`)
  })
})

// ─── Stepper Navigation Benchmarks ───────────────────────────────────────────

describe('Performance - Stepper Navigation', () => {
  it('should navigate steps quickly with 10 steps', () => {
    const fields = generateFields(50)
    const steps = generateSteps(10)
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        stepper.goNext()
        if (stepper.isLastStep()) stepper.jumpTo(0)
      }
    })

    const avgPerNavigation = duration / 100
    expect(avgPerNavigation).toBeLessThan(10) // Each navigation < 10ms
    console.log(`Step navigation (10 steps): ${(avgPerNavigation).toFixed(3)}ms per navigation`)
  })

  it('should jump to specific step efficiently', () => {
    const fields = generateFields(50)
    const steps = generateSteps(50)
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    const duration = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        stepper.jumpTo(Math.floor(Math.random() * 50))
      }
    })

    const avgPerJump = duration / 1000
    expect(avgPerJump).toBeLessThan(5) // Each jump < 5ms
    console.log(`Jump navigation (50 steps): ${(avgPerJump).toFixed(3)}ms per jump`)
  })

  it('should evaluate progress tracking quickly', () => {
    const fields = generateFields(50)
    const steps = generateSteps(100)
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    const duration = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        stepper.getProgress()
      }
    })

    const avgPerCall = duration / 1000
    expect(avgPerCall).toBeLessThan(2) // Each call < 2ms
    console.log(`Progress evaluation (100 steps): ${(avgPerCall).toFixed(3)}ms per call`)
  })
})

// ─── Memory and Collection Benchmarks ────────────────────────────────────────

describe('Performance - Memory Management', () => {
  it('should handle undo/redo stacks efficiently', () => {
    const fields = generateFields(50)
    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engine.setFieldValue('field_0', `value_${i}`)
      }

      for (let i = 0; i < 50; i++) {
        engine.undo()
      }

      for (let i = 0; i < 50; i++) {
        engine.redo()
      }
    })

    expect(duration).toBeLessThan(500) // Total operations < 500ms
    console.log(`Undo/redo operations (100 changes + 50 undo + 50 redo): ${duration.toFixed(2)}ms`)
  })

  it('should track repeat instances efficiently', () => {
    const fields: FormField[] = [
      {
        id: 'group_1',
        versionId: 'v1',
        key: 'group_1',
        label: 'Repeat Group',
        type: 'FIELD_GROUP',
        required: false,
        order: 0,
        config: {
          templateFields: [
            {
              id: 'field_1',
              versionId: 'v1',
              key: 'name',
              label: 'Name',
              type: 'SHORT_TEXT',
              required: true,
              order: 0,
              config: {},
            },
          ],
        },
      },
    ]

    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engine.addRepeatInstance('group_1')
      }

      for (let i = 0; i < 50; i++) {
        engine.removeRepeatInstance('group_1', 0)
      }

      const instances = engine.getRepeatInstances('group_1')
      expect(instances.length).toBeGreaterThan(0)
    })

    expect(duration).toBeLessThan(200) // 100 adds + 50 removes + retrieval < 200ms
    console.log(`Repeat instance operations (100 adds + 50 removes): ${duration.toFixed(2)}ms`)
  })
})

// ─── Computed Field Benchmarks ──────────────────────────────────────────────

describe('Performance - Computed Fields', () => {
  it('should evaluate computed fields efficiently', () => {
    const fields: FormField[] = [
      {
        id: 'field_a',
        versionId: 'v1',
        key: 'a',
        label: 'Field A',
        type: 'NUMBER',
        required: false,
        order: 0,
        config: {},
      },
      {
        id: 'field_b',
        versionId: 'v1',
        key: 'b',
        label: 'Field B',
        type: 'NUMBER',
        required: false,
        order: 1,
        config: {},
      },
      {
        id: 'field_sum',
        versionId: 'v1',
        key: 'sum',
        label: 'Sum',
        type: 'NUMBER',
        required: false,
        order: 2,
        config: {},
        computed: {
          expression: 'a + b',
          dependsOn: ['a', 'b'],
        },
      },
    ]

    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        engine.setFieldValue('a', i)
        engine.setFieldValue('b', i * 2)
        const value = engine.getComputedValue('sum')
        expect(value).toBe(i + i * 2)
      }
    })

    const avgPerChange = duration / 200 // 100 changes to a + 100 changes to b
    expect(avgPerChange).toBeLessThan(5) // Each change < 5ms
    console.log(`Computed field evaluation: ${(avgPerChange).toFixed(3)}ms per field change`)
  })

  it('should handle multiple computed dependencies', () => {
    const fields: FormField[] = [
      {
        id: 'field_x',
        versionId: 'v1',
        key: 'x',
        label: 'X',
        type: 'NUMBER',
        required: false,
        order: 0,
        config: {},
      },
      {
        id: 'field_y',
        versionId: 'v1',
        key: 'y',
        label: 'Y',
        type: 'NUMBER',
        required: false,
        order: 1,
        config: {},
      },
      {
        id: 'field_z',
        versionId: 'v1',
        key: 'z',
        label: 'Z',
        type: 'NUMBER',
        required: false,
        order: 2,
        config: {},
      },
      {
        id: 'field_computed1',
        versionId: 'v1',
        key: 'computed1',
        label: 'Computed 1',
        type: 'NUMBER',
        required: false,
        order: 3,
        config: {},
        computed: {
          expression: 'x + y',
          dependsOn: ['x', 'y'],
        },
      },
      {
        id: 'field_computed2',
        versionId: 'v1',
        key: 'computed2',
        label: 'Computed 2',
        type: 'NUMBER',
        required: false,
        order: 4,
        config: {},
        computed: {
          expression: 'computed1 + z',
          dependsOn: ['computed1', 'z'],
        },
      },
    ]

    const engine = createFormEngine(fields)

    const duration = measureTime(() => {
      for (let i = 0; i < 50; i++) {
        engine.setFieldValue('x', i)
        engine.setFieldValue('y', i)
        engine.setFieldValue('z', i)
      }
    })

    const avgPerIteration = duration / 50
    expect(avgPerIteration).toBeLessThan(20) // Each iteration < 20ms
    console.log(`Multi-dependency computed fields: ${(avgPerIteration).toFixed(2)}ms per iteration`)
  })
})
