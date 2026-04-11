import { describe, it, expect } from 'vitest'
import {
  createFormEngine,
  createFormStepper,
  type FormField,
  type FormStep,
} from '@dmc-98/dfe-core'

/**
 * These tests verify the core logic that useFormEngine and useFormStepper
 * hooks rely on. The hooks are thin React wrappers around createFormEngine
 * and createFormStepper, so testing the factory functions validates the
 * underlying behavior.
 */

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const fields: FormField[] = [
  {
    id: 'field_name',
    versionId: 'v1',
    key: 'name',
    label: 'Full Name',
    type: 'SHORT_TEXT',
    required: true,
    order: 1,
    stepId: 'step1',
    config: { placeholder: 'Enter name' },
  },
  {
    id: 'field_email',
    versionId: 'v1',
    key: 'email',
    label: 'Email',
    type: 'EMAIL',
    required: true,
    order: 2,
    stepId: 'step1',
    config: {},
  },
  {
    id: 'field_role',
    versionId: 'v1',
    key: 'role',
    label: 'Role',
    type: 'SELECT',
    required: true,
    order: 3,
    stepId: 'step2',
    config: {
      mode: 'static',
      options: [
        { label: 'Engineer', value: 'engineer' },
        { label: 'Designer', value: 'designer' },
      ],
    },
  },
  {
    id: 'field_bio',
    versionId: 'v1',
    key: 'bio',
    label: 'Bio',
    type: 'LONG_TEXT',
    required: false,
    order: 4,
    stepId: 'step2',
    config: {},
  },
]

const steps: FormStep[] = [
  { id: 'step1', versionId: 'v1', title: 'Personal Info', order: 1 },
  { id: 'step2', versionId: 'v1', title: 'Role Details', order: 2 },
]

// ─── Engine Tests (used by useFormEngine) ───────────────────────────────────

describe('createFormEngine (useFormEngine underlying logic)', () => {
  it('should create an engine with fields', () => {
    const engine = createFormEngine(fields)
    expect(engine).toBeDefined()
    expect(engine.getValues()).toBeDefined()
  })

  it('should initialize with empty values', () => {
    const engine = createFormEngine(fields)
    const values = engine.getValues()
    // Engine initializes fields with empty string defaults
    expect(values.name).toBe('')
    expect(values.email).toBe('')
  })

  it('should hydrate initial values', () => {
    const engine = createFormEngine(fields, { name: 'Alice', email: 'alice@test.com' })
    const values = engine.getValues()
    expect(values.name).toBe('Alice')
    expect(values.email).toBe('alice@test.com')
  })

  it('should set a field value and return a patch', () => {
    const engine = createFormEngine(fields)
    const patch = engine.setFieldValue('name', 'Bob')
    expect(patch).toBeDefined()
    expect(engine.getValues().name).toBe('Bob')
  })

  it('should return all visible fields', () => {
    const engine = createFormEngine(fields)
    const visible = engine.getVisibleFields()
    expect(visible.length).toBe(fields.length)
  })

  it('should get field state', () => {
    const engine = createFormEngine(fields)
    const state = engine.getFieldState('name')
    expect(state).toBeDefined()
    expect(state?.field.label).toBe('Full Name')
  })

  it('should validate required fields', () => {
    const engine = createFormEngine(fields)
    const result = engine.validate()
    expect(result.success).toBe(false)
    expect(Object.keys(result.errors).length).toBeGreaterThan(0)
  })

  it('should pass validation when required fields are filled', () => {
    const engine = createFormEngine(fields, {
      name: 'Alice',
      email: 'alice@test.com',
      role: 'engineer',
    })
    const result = engine.validate()
    expect(result.success).toBe(true)
  })

  it('should validate a specific step', () => {
    const engine = createFormEngine(fields)
    engine.setFieldValue('name', 'Alice')
    engine.setFieldValue('email', 'alice@test.com')

    const step1Result = engine.validateStep('step1')
    expect(step1Result.success).toBe(true)

    const step2Result = engine.validateStep('step2')
    expect(step2Result.success).toBe(false) // role is required
  })

  it('should collect submission values', () => {
    const engine = createFormEngine(fields)
    engine.setFieldValue('name', 'Alice')
    engine.setFieldValue('email', 'alice@test.com')
    engine.setFieldValue('role', 'designer')

    const submission = engine.collectSubmissionValues()
    expect(submission.name).toBe('Alice')
    expect(submission.email).toBe('alice@test.com')
    expect(submission.role).toBe('designer')
  })
})

// ─── Stepper Tests (used by useFormStepper) ─────────────────────────────────

describe('createFormStepper (useFormStepper underlying logic)', () => {
  it('should create a stepper with steps', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)
    expect(stepper).toBeDefined()
  })

  it('should start at the first step', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)
    const current = stepper.getCurrentStep()
    expect(current).not.toBeNull()
    expect(current!.step.title).toBe('Personal Info')
  })

  it('should start at a custom initial index', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine, 1)
    const current = stepper.getCurrentStep()
    expect(current!.step.title).toBe('Role Details')
  })

  it('should navigate to next step', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    stepper.goNext()
    const current = stepper.getCurrentStep()
    expect(current!.step.title).toBe('Role Details')
  })

  it('should navigate back', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    stepper.goNext()
    expect(stepper.canGoBack()).toBe(true)

    stepper.goBack()
    const current = stepper.getCurrentStep()
    expect(current!.step.title).toBe('Personal Info')
  })

  it('should not go back from first step', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)
    expect(stepper.canGoBack()).toBe(false)
  })

  it('should detect last step', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)
    expect(stepper.isLastStep()).toBe(false)

    stepper.goNext()
    expect(stepper.isLastStep()).toBe(true)
  })

  it('should report progress', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)
    const progress = stepper.getProgress()

    expect(progress.current).toBe(1)
    expect(progress.total).toBe(2)
    expect(progress.percent).toBe(50)
  })

  it('should jump to a specific step', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    stepper.jumpTo(1)
    expect(stepper.getCurrentStep()!.step.title).toBe('Role Details')
  })

  it('should mark a step as complete', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    stepper.markComplete('step1')
    const visibleSteps = stepper.getVisibleSteps()
    const step1 = visibleSteps.find(s => s.step.id === 'step1')
    expect(step1?.isComplete).toBe(true)
  })

  it('should return visible steps', () => {
    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)
    const visible = stepper.getVisibleSteps()
    expect(visible.length).toBe(2)
  })
})
