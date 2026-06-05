import { describe, it, expect } from 'vitest'
import { createFormEngine, createFormStepper } from '../src/engine'
import { makeField, makeStep } from './helpers'

describe('createFormEngine', () => {
  it('creates an engine with initial field states', () => {
    const fields = [
      makeField({ key: 'name', required: true }),
      makeField({ key: 'email', type: 'EMAIL', required: true }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getValues()).toEqual({ name: '', email: '' })
    expect(engine.getVisibleFields()).toHaveLength(2)
  })

  it('hydrates values from initial data', () => {
    const fields = [
      makeField({ key: 'name' }),
      makeField({ key: 'age', type: 'NUMBER' }),
    ]
    const engine = createFormEngine(fields, { name: 'Alice', age: 30 })

    expect(engine.getValues().name).toBe('Alice')
    expect(engine.getValues().age).toBe(30)
  })

  it('setFieldValue triggers condition propagation', () => {
    const fields = [
      makeField({ key: 'role' }),
      makeField({
        key: 'adminSecret',
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] }
      }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getFieldState('adminSecret')!.isVisible).toBe(false)

    const patch = engine.setFieldValue('role', 'admin')
    expect(engine.getFieldState('adminSecret')!.isVisible).toBe(true)
    expect(patch.visibilityChanges.get('adminSecret')).toBe(true)
  })

  it('getVisibleFields excludes hidden fields', () => {
    const fields = [
      makeField({ key: 'a', order: 1 }),
      makeField({
        key: 'b', order: 2,
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'a', operator: 'eq', value: 'show' }] }
      }),
    ]
    const engine = createFormEngine(fields)
    expect(engine.getVisibleFields().map(f => f.key)).toEqual(['a'])

    engine.setFieldValue('a', 'show')
    expect(engine.getVisibleFields().map(f => f.key)).toEqual(['a', 'b'])
  })

  it('validate returns errors for missing required fields', () => {
    const fields = [
      makeField({ key: 'name', required: true }),
      makeField({ key: 'email', type: 'EMAIL', required: true }),
    ]
    const engine = createFormEngine(fields)

    const result = engine.validate()
    expect(result.success).toBe(false)
    expect(result.errors).toHaveProperty('name')
    expect(result.errors).toHaveProperty('email')
  })

  it('validate succeeds with valid data', () => {
    const fields = [
      makeField({ key: 'name', required: true }),
      makeField({ key: 'email', type: 'EMAIL', required: true }),
    ]
    const engine = createFormEngine(fields, { name: 'Alice', email: 'alice@example.com' })

    const result = engine.validate()
    expect(result.success).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('validate skips hidden required fields', () => {
    const fields = [
      makeField({ key: 'show', type: 'CHECKBOX' }),
      makeField({
        key: 'required_but_hidden', required: true,
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'show', operator: 'eq', value: true }] }
      }),
    ]
    const engine = createFormEngine(fields)
    // required_but_hidden is hidden, so should not cause validation failure
    const result = engine.validate()
    expect(result.success).toBe(true)
  })

  it('validateStep validates only step fields', () => {
    const fields = [
      makeField({ key: 'step1_field', stepId: 'step1', required: true, order: 1 }),
      makeField({ key: 'step2_field', stepId: 'step2', required: true, order: 1 }),
    ]
    const engine = createFormEngine(fields, { step1_field: 'filled' })

    // Step 1 should pass (has value)
    const step1 = engine.validateStep('step1')
    expect(step1.success).toBe(true)

    // Step 2 should fail (empty required field)
    const step2 = engine.validateStep('step2')
    expect(step2.success).toBe(false)
    expect(step2.errors).toHaveProperty('step2_field')
  })

  it('collectSubmissionValues excludes hidden and layout fields', () => {
    const fields = [
      makeField({ key: 'name', order: 1 }),
      makeField({ key: 'section', type: 'SECTION_BREAK', order: 2 }),
      makeField({
        key: 'hidden',
        order: 3,
        conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'name', operator: 'eq', value: 'show' }] }
      }),
    ]
    const engine = createFormEngine(fields, { name: 'Alice', hidden: 'ghost' })

    const values = engine.collectSubmissionValues()
    expect(values).toHaveProperty('name')
    expect(values).not.toHaveProperty('section')
    expect(values).not.toHaveProperty('hidden')
  })

  it('handles nested field trees', () => {
    const fields = [
      makeField({
        key: 'group', type: 'FIELD_GROUP', id: 'g1', order: 1,
        children: [
          makeField({ key: 'child1', parentFieldId: 'g1', order: 2 }),
          makeField({ key: 'child2', parentFieldId: 'g1', order: 3 }),
        ]
      }),
    ]
    const engine = createFormEngine(fields)
    expect(engine.getValues()).toHaveProperty('child1')
    expect(engine.getValues()).toHaveProperty('child2')
  })
})

describe('createFormStepper', () => {
  it('creates a stepper with visible steps', () => {
    const fields = [
      makeField({ key: 'f1', stepId: 's1', order: 1 }),
      makeField({ key: 'f2', stepId: 's2', order: 1 }),
    ]
    const steps = [
      makeStep({ id: 's1', title: 'Step 1', order: 0 }),
      makeStep({ id: 's2', title: 'Step 2', order: 1 }),
    ]
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    expect(stepper.getVisibleSteps()).toHaveLength(2)
    expect(stepper.getCurrentStep()?.step.title).toBe('Step 1')
    expect(stepper.getCurrentIndex()).toBe(0)
  })

  it('navigates forward and backward', () => {
    const fields = [
      makeField({ key: 'f1', stepId: 's1' }),
      makeField({ key: 'f2', stepId: 's2' }),
      makeField({ key: 'f3', stepId: 's3' }),
    ]
    const steps = [
      makeStep({ id: 's1', title: 'Step 1', order: 0 }),
      makeStep({ id: 's2', title: 'Step 2', order: 1 }),
      makeStep({ id: 's3', title: 'Step 3', order: 2 }),
    ]
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    expect(stepper.canGoBack()).toBe(false)
    expect(stepper.isLastStep()).toBe(false)

    stepper.goNext()
    expect(stepper.getCurrentIndex()).toBe(1)
    expect(stepper.canGoBack()).toBe(true)

    stepper.goNext()
    expect(stepper.getCurrentIndex()).toBe(2)
    expect(stepper.isLastStep()).toBe(true)

    stepper.goBack()
    expect(stepper.getCurrentIndex()).toBe(1)
  })

  it('jumpTo navigates to specific step', () => {
    const fields = [
      makeField({ key: 'f1', stepId: 's1' }),
      makeField({ key: 'f2', stepId: 's2' }),
      makeField({ key: 'f3', stepId: 's3' }),
    ]
    const steps = [
      makeStep({ id: 's1', title: 'Step 1', order: 0 }),
      makeStep({ id: 's2', title: 'Step 2', order: 1 }),
      makeStep({ id: 's3', title: 'Step 3', order: 2 }),
    ]
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    stepper.jumpTo(2)
    expect(stepper.getCurrentIndex()).toBe(2)
    expect(stepper.getCurrentStep()?.step.title).toBe('Step 3')
  })

  it('respects step skip conditions', () => {
    const fields = [
      makeField({ key: 'skipStep2', stepId: 's1', type: 'CHECKBOX' }),
      makeField({ key: 'f2', stepId: 's2' }),
      makeField({ key: 'f3', stepId: 's3' }),
    ]
    const steps = [
      makeStep({ id: 's1', title: 'Step 1', order: 0 }),
      makeStep({
        id: 's2', title: 'Step 2', order: 1,
        conditions: { action: 'SKIP', operator: 'and', rules: [{ fieldKey: 'skipStep2', operator: 'eq', value: true }] }
      }),
      makeStep({ id: 's3', title: 'Step 3', order: 2 }),
    ]

    // With skipStep2 = true → step 2 should be hidden
    const engine = createFormEngine(fields, { skipStep2: true })
    const stepper = createFormStepper(steps, engine)

    const visible = stepper.getVisibleSteps()
    expect(visible).toHaveLength(2)
    expect(visible.map(s => s.step.title)).toEqual(['Step 1', 'Step 3'])
  })

  it('markComplete marks a step as done', () => {
    const fields = [makeField({ key: 'f1', stepId: 's1' })]
    const steps = [makeStep({ id: 's1', title: 'Step 1', order: 0 })]
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    expect(stepper.getVisibleSteps()[0].isComplete).toBe(false)
    stepper.markComplete('s1')
    expect(stepper.getVisibleSteps()[0].isComplete).toBe(true)
  })

  it('getProgress returns correct percentages', () => {
    const fields = [
      makeField({ key: 'f1', stepId: 's1' }),
      makeField({ key: 'f2', stepId: 's2' }),
      makeField({ key: 'f3', stepId: 's3' }),
      makeField({ key: 'f4', stepId: 's4' }),
    ]
    const steps = [
      makeStep({ id: 's1', title: 'Step 1', order: 0 }),
      makeStep({ id: 's2', title: 'Step 2', order: 1 }),
      makeStep({ id: 's3', title: 'Step 3', order: 2 }),
      makeStep({ id: 's4', title: 'Step 4', order: 3 }),
    ]
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    expect(stepper.getProgress()).toEqual({ current: 1, total: 4, percent: 25 })
    stepper.goNext()
    expect(stepper.getProgress()).toEqual({ current: 2, total: 4, percent: 50 })
  })

  it('initializes at specified index', () => {
    const fields = [
      makeField({ key: 'f1', stepId: 's1' }),
      makeField({ key: 'f2', stepId: 's2' }),
    ]
    const steps = [
      makeStep({ id: 's1', title: 'Step 1', order: 0 }),
      makeStep({ id: 's2', title: 'Step 2', order: 1 }),
    ]
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine, 1)

    expect(stepper.getCurrentIndex()).toBe(1)
    expect(stepper.getCurrentStep()?.step.title).toBe('Step 2')
  })
})
