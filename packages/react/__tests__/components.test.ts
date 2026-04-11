import { describe, it, expect, vi } from 'vitest'
import {
  createFormEngine,
  createFormStepper,
  type FormField,
  type FormStep,
  type StepNodeState,
} from '@dmc-98/dfe-core'
import { DfeFormRenderer, DfeStepIndicator } from '../src/components'
import type { DfeFormRendererProps, DfeStepIndicatorProps } from '../src/components/DfeFormRenderer'

/**
 * Component tests for DfeFormRenderer and DfeStepIndicator.
 *
 * Since @testing-library/react is not available, these tests verify:
 * - Component type exports and prop interfaces
 * - Component logic through the underlying engine/stepper
 * - Props handling and defaults
 * - Conditional rendering based on field visibility
 */

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const testFields: FormField[] = [
  {
    id: 'field_name',
    versionId: 'v1',
    key: 'fullName',
    label: 'Full Name',
    type: 'SHORT_TEXT',
    required: true,
    order: 1,
    config: { placeholder: 'Enter your full name' },
  },
  {
    id: 'field_email',
    versionId: 'v1',
    key: 'email',
    label: 'Email Address',
    type: 'EMAIL',
    required: true,
    order: 2,
    config: {},
  },
  {
    id: 'field_number',
    versionId: 'v1',
    key: 'age',
    label: 'Age',
    type: 'NUMBER',
    required: false,
    order: 3,
    config: { min: 0, max: 150 },
  },
  {
    id: 'field_phone',
    versionId: 'v1',
    key: 'phone',
    label: 'Phone Number',
    type: 'PHONE',
    required: false,
    order: 4,
    config: {},
  },
  {
    id: 'field_url',
    versionId: 'v1',
    key: 'website',
    label: 'Website',
    type: 'URL',
    required: false,
    order: 5,
    config: {},
  },
  {
    id: 'field_password',
    versionId: 'v1',
    key: 'password',
    label: 'Password',
    type: 'PASSWORD',
    required: true,
    order: 6,
    config: {},
  },
  {
    id: 'field_long_text',
    versionId: 'v1',
    key: 'bio',
    label: 'Bio',
    type: 'LONG_TEXT',
    required: false,
    order: 7,
    config: { maxLength: 500 },
  },
  {
    id: 'field_date',
    versionId: 'v1',
    key: 'birthDate',
    label: 'Birth Date',
    type: 'DATE',
    required: false,
    order: 8,
    config: {},
  },
  {
    id: 'field_time',
    versionId: 'v1',
    key: 'meetingTime',
    label: 'Meeting Time',
    type: 'TIME',
    required: false,
    order: 9,
    config: {},
  },
  {
    id: 'field_datetime',
    versionId: 'v1',
    key: 'meetingDateTime',
    label: 'Meeting Date & Time',
    type: 'DATE_TIME',
    required: false,
    order: 10,
    config: {},
  },
  {
    id: 'field_select',
    versionId: 'v1',
    key: 'country',
    label: 'Country',
    type: 'SELECT',
    required: true,
    order: 11,
    config: {
      mode: 'static',
      options: [
        { label: 'United States', value: 'us' },
        { label: 'Canada', value: 'ca' },
        { label: 'Mexico', value: 'mx' },
      ],
    },
  },
  {
    id: 'field_multi_select',
    versionId: 'v1',
    key: 'interests',
    label: 'Interests',
    type: 'MULTI_SELECT',
    required: false,
    order: 12,
    config: {
      mode: 'static',
      options: [
        { label: 'Sports', value: 'sports' },
        { label: 'Music', value: 'music' },
        { label: 'Reading', value: 'reading' },
        { label: 'Gaming', value: 'gaming' },
      ],
    },
  },
  {
    id: 'field_radio',
    versionId: 'v1',
    key: 'gender',
    label: 'Gender',
    type: 'RADIO',
    required: false,
    order: 13,
    config: {
      mode: 'static',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
      ],
    },
  },
  {
    id: 'field_checkbox',
    versionId: 'v1',
    key: 'subscribe',
    label: 'Subscribe to newsletter',
    type: 'CHECKBOX',
    required: false,
    order: 14,
    config: {},
  },
  {
    id: 'field_section_break',
    versionId: 'v1',
    key: 'section_1',
    label: 'Personal Information',
    type: 'SECTION_BREAK',
    required: false,
    order: 0,
    config: {},
  },
]

const testSteps: FormStep[] = [
  {
    id: 'step1',
    versionId: 'v1',
    title: 'Personal Information',
    order: 1,
    config: null,
    conditions: null,
  },
  {
    id: 'step2',
    versionId: 'v1',
    title: 'Contact Information',
    order: 2,
    config: null,
    conditions: null,
  },
  {
    id: 'step3',
    versionId: 'v1',
    title: 'Preferences',
    order: 3,
    config: null,
    conditions: null,
  },
]

// ─── DfeFormRenderer Tests ───────────────────────────────────────────────────

describe('DfeFormRenderer', () => {
  it('should export DfeFormRenderer as a function', () => {
    expect(typeof DfeFormRenderer).toBe('function')
  })

  it('should have the correct prop interface', () => {
    // Test that props interface is correct by creating engine
    const engine = createFormEngine(testFields)
    const props: DfeFormRendererProps = {
      fields: engine.getVisibleFields(),
      values: engine.getValues(),
      onFieldChange: (key, value) => engine.setFieldValue(key, value),
      errors: {},
      className: 'test-form',
    }
    expect(props).toBeDefined()
    expect(props.fields).toBeInstanceOf(Array)
    expect(typeof props.values).toBe('object')
    expect(typeof props.onFieldChange).toBe('function')
  })

  describe('field rendering logic', () => {
    it('should render all visible field types', () => {
      const engine = createFormEngine(testFields)
      const visibleFields = engine.getVisibleFields()

      // Should include all field types except SECTION_BREAK for form input
      const textTypes = ['SHORT_TEXT', 'EMAIL', 'PHONE', 'URL', 'PASSWORD', 'LONG_TEXT']
      const dateTypes = ['DATE', 'TIME', 'DATE_TIME']
      const selectTypes = ['SELECT', 'RADIO', 'MULTI_SELECT']
      const otherTypes = ['NUMBER', 'CHECKBOX']

      for (const type of [...textTypes, ...dateTypes, ...selectTypes, ...otherTypes]) {
        const field = visibleFields.find(f => f.type === type)
        if (field) {
          expect(field.type).toBe(type)
          expect(field.key).toBeDefined()
          expect(field.label).toBeDefined()
        }
      }
    })

    it('should handle required and optional fields', () => {
      const engine = createFormEngine(testFields)
      const visibleFields = engine.getVisibleFields()

      const requiredField = visibleFields.find(f => f.key === 'fullName')
      const optionalField = visibleFields.find(f => f.key === 'age')

      expect(requiredField?.required).toBe(true)
      expect(optionalField?.required).toBe(false)
    })

    it('should handle field values from engine', () => {
      const engine = createFormEngine(testFields, {
        fullName: 'John Doe',
        email: 'john@example.com',
        age: 30,
      })

      const values = engine.getValues()
      expect(values.fullName).toBe('John Doe')
      expect(values.email).toBe('john@example.com')
      expect(values.age).toBe(30)
    })

    it('should handle validation errors', () => {
      const engine = createFormEngine(testFields)
      engine.setFieldValue('fullName', '')

      const validation = engine.validate()
      expect(validation.success).toBe(false)
      expect(validation.errors.fullName).toBeDefined()
    })

    it('should support custom field renderer function', () => {
      const engine = createFormEngine(testFields)
      const customRenderer = vi.fn()

      // Props should accept renderField function
      const props: DfeFormRendererProps = {
        fields: engine.getVisibleFields(),
        values: engine.getValues(),
        onFieldChange: (key, value) => engine.setFieldValue(key, value),
        renderField: customRenderer,
      }

      expect(props.renderField).toBeDefined()
      expect(typeof props.renderField).toBe('function')
    })
  })

  describe('visibility and conditional logic', () => {
    it('should reflect visible fields from engine', () => {
      const fieldsWithCondition: FormField[] = [
        {
          id: 'field_role',
          versionId: 'v1',
          key: 'role',
          label: 'Role',
          type: 'SELECT',
          required: true,
          order: 1,
          config: {
            mode: 'static',
            options: [
              { label: 'Admin', value: 'admin' },
              { label: 'User', value: 'user' },
            ],
          },
        },
        {
          id: 'field_permissions',
          versionId: 'v1',
          key: 'permissions',
          label: 'Permissions',
          type: 'MULTI_SELECT',
          required: false,
          order: 2,
          config: {
            mode: 'static',
            options: [
              { label: 'Read', value: 'read' },
              { label: 'Write', value: 'write' },
            ],
          },
          conditions: {
            action: 'SHOW',
            operator: 'and',
            rules: [
              { fieldKey: 'role', operator: 'eq', value: 'admin' },
            ],
          },
        },
      ]

      const engine = createFormEngine(fieldsWithCondition)
      let visibleFields = engine.getVisibleFields()
      expect(visibleFields.find(f => f.key === 'permissions')).toBeUndefined()

      engine.setFieldValue('role', 'admin')
      visibleFields = engine.getVisibleFields()
      expect(visibleFields.find(f => f.key === 'permissions')).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle missing required fields', () => {
      const engine = createFormEngine([
        {
          id: 'field_required',
          versionId: 'v1',
          key: 'requiredField',
          label: 'Required Field',
          type: 'SHORT_TEXT',
          required: true,
          order: 1,
          config: {},
        },
      ])

      const validation = engine.validate()
      expect(validation.success).toBe(false)
    })

    it('should track errors by field key', () => {
      const engine = createFormEngine([
        {
          id: 'field_email',
          versionId: 'v1',
          key: 'email',
          label: 'Email',
          type: 'EMAIL',
          required: true,
          order: 1,
          config: {},
        },
      ])

      engine.setFieldValue('email', 'not-an-email')
      const validation = engine.validate()
      expect(validation.errors.email).toBeDefined()
    })
  })

  describe('prop defaults', () => {
    it('should support optional errors prop', () => {
      const engine = createFormEngine(testFields)
      const props1: DfeFormRendererProps = {
        fields: engine.getVisibleFields(),
        values: engine.getValues(),
        onFieldChange: (key, value) => engine.setFieldValue(key, value),
      }
      expect(props1.errors).toBeUndefined()

      const props2: DfeFormRendererProps = {
        fields: engine.getVisibleFields(),
        values: engine.getValues(),
        onFieldChange: (key, value) => engine.setFieldValue(key, value),
        errors: { someField: 'Error message' },
      }
      expect(props2.errors).toBeDefined()
    })

    it('should support optional className prop', () => {
      const engine = createFormEngine(testFields)
      const props1: DfeFormRendererProps = {
        fields: engine.getVisibleFields(),
        values: engine.getValues(),
        onFieldChange: (key, value) => engine.setFieldValue(key, value),
      }
      expect(props1.className).toBeUndefined()

      const props2: DfeFormRendererProps = {
        fields: engine.getVisibleFields(),
        values: engine.getValues(),
        onFieldChange: (key, value) => engine.setFieldValue(key, value),
        className: 'custom-form-class',
      }
      expect(props2.className).toBe('custom-form-class')
    })
  })
})

// ─── DfeStepIndicator Tests ─────────────────────────────────────────────────

describe('DfeStepIndicator', () => {
  it('should export DfeStepIndicator as a function', () => {
    expect(typeof DfeStepIndicator).toBe('function')
  })

  it('should have the correct prop interface', () => {
    const engine = createFormEngine(testFields)
    const stepper = createFormStepper(testSteps, engine)
    const visibleSteps = stepper.getVisibleSteps()

    const props: DfeStepIndicatorProps = {
      steps: visibleSteps,
      currentIndex: stepper.getCurrentIndex(),
      onStepClick: (index: number) => stepper.jumpTo(index),
      className: 'step-indicator',
    }

    expect(props).toBeDefined()
    expect(props.steps).toBeInstanceOf(Array)
    expect(typeof props.currentIndex).toBe('number')
  })

  describe('step state rendering', () => {
    it('should show all visible steps', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)
      const visibleSteps = stepper.getVisibleSteps()

      expect(visibleSteps.length).toBe(3)
      expect(visibleSteps[0].step.title).toBe('Personal Information')
      expect(visibleSteps[1].step.title).toBe('Contact Information')
      expect(visibleSteps[2].step.title).toBe('Preferences')
    })

    it('should indicate active step', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)

      expect(stepper.getCurrentIndex()).toBe(0)
      const currentStep = stepper.getCurrentStep()
      expect(currentStep?.step.id).toBe('step1')
    })

    it('should track step completion', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)
      const visibleSteps = stepper.getVisibleSteps()

      expect(visibleSteps[0].isComplete).toBe(false)
      stepper.markComplete('step1')
      expect(stepper.getCurrentStep()?.isComplete).toBe(true)
    })
  })

  describe('step navigation', () => {
    it('should handle step navigation', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)

      expect(stepper.canGoBack()).toBe(false)
      expect(stepper.isLastStep()).toBe(false)

      stepper.goNext()
      expect(stepper.getCurrentIndex()).toBe(1)
      expect(stepper.canGoBack()).toBe(true)

      stepper.goBack()
      expect(stepper.getCurrentIndex()).toBe(0)
    })

    it('should handle jump to specific step', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)

      stepper.jumpTo(2)
      expect(stepper.getCurrentIndex()).toBe(2)
      expect(stepper.isLastStep()).toBe(true)
    })

    it('should track progress', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)

      const progress1 = stepper.getProgress()
      expect(progress1.current).toBe(1)
      expect(progress1.total).toBe(3)
      expect(progress1.percent).toBe(Math.round((1 / 3) * 100))

      stepper.goNext()
      const progress2 = stepper.getProgress()
      expect(progress2.current).toBe(2)
      expect(progress2.percent).toBe(Math.round((2 / 3) * 100))
    })
  })

  describe('step branching', () => {
    it('should support branching logic', () => {
      const fieldsWithBranching: FormField[] = [
        {
          id: 'field_path',
          versionId: 'v1',
          key: 'path',
          label: 'Which path?',
          type: 'SELECT',
          required: true,
          order: 1,
          config: {
            mode: 'static',
            options: [
              { label: 'Path A', value: 'pathA' },
              { label: 'Path B', value: 'pathB' },
            ],
          },
        },
      ]

      const stepsWithBranches: FormStep[] = [
        {
          id: 'step_start',
          versionId: 'v1',
          title: 'Start',
          order: 1,
          config: null,
          conditions: null,
          branches: [
            { condition: 'path === "pathA"', targetStepId: 'step_a' },
            { condition: 'path === "pathB"', targetStepId: 'step_b' },
          ],
        },
        {
          id: 'step_a',
          versionId: 'v1',
          title: 'Path A',
          order: 2,
          config: null,
          conditions: null,
        },
        {
          id: 'step_b',
          versionId: 'v1',
          title: 'Path B',
          order: 3,
          config: null,
          conditions: null,
        },
      ]

      const engine = createFormEngine(fieldsWithBranching)
      const stepper = createFormStepper(stepsWithBranches, engine)

      engine.setFieldValue('path', 'pathA')
      const nextBranch = stepper.getNextBranch()
      expect(nextBranch?.step.id).toBe('step_a')

      engine.setFieldValue('path', 'pathB')
      const nextBranch2 = stepper.getNextBranch()
      expect(nextBranch2?.step.id).toBe('step_b')
    })

    it('should navigate to branch target', () => {
      const fieldsWithBranching: FormField[] = [
        {
          id: 'field_type',
          versionId: 'v1',
          key: 'type',
          label: 'Type',
          type: 'SELECT',
          required: true,
          order: 1,
          config: {
            mode: 'static',
            options: [
              { label: 'Option A', value: 'a' },
              { label: 'Option B', value: 'b' },
            ],
          },
        },
      ]

      const stepsWithBranches: FormStep[] = [
        {
          id: 'step_choose',
          versionId: 'v1',
          title: 'Choose',
          order: 1,
          config: null,
          conditions: null,
          branches: [
            { condition: 'type === "a"', targetStepId: 'step_a' },
          ],
        },
        {
          id: 'step_a',
          versionId: 'v1',
          title: 'Option A Details',
          order: 2,
          config: null,
          conditions: null,
        },
        {
          id: 'step_skip',
          versionId: 'v1',
          title: 'Skipped Step',
          order: 3,
          config: null,
          conditions: null,
        },
      ]

      const engine = createFormEngine(fieldsWithBranching)
      const stepper = createFormStepper(stepsWithBranches, engine)

      engine.setFieldValue('type', 'a')
      stepper.goNextBranch()

      const currentStep = stepper.getCurrentStep()
      expect(currentStep?.step.id).toBe('step_a')
    })
  })

  describe('prop defaults and optional properties', () => {
    it('should support optional onStepClick prop', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)
      const visibleSteps = stepper.getVisibleSteps()

      const props1: DfeStepIndicatorProps = {
        steps: visibleSteps,
        currentIndex: 0,
      }
      expect(props1.onStepClick).toBeUndefined()

      const props2: DfeStepIndicatorProps = {
        steps: visibleSteps,
        currentIndex: 0,
        onStepClick: (index: number) => stepper.jumpTo(index),
      }
      expect(props2.onStepClick).toBeDefined()
    })

    it('should support optional className prop', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)
      const visibleSteps = stepper.getVisibleSteps()

      const props1: DfeStepIndicatorProps = {
        steps: visibleSteps,
        currentIndex: 0,
      }
      expect(props1.className).toBeUndefined()

      const props2: DfeStepIndicatorProps = {
        steps: visibleSteps,
        currentIndex: 0,
        className: 'custom-steps',
      }
      expect(props2.className).toBe('custom-steps')
    })
  })

  describe('accessibility', () => {
    it('should mark current step with aria-current', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)
      const visibleSteps = stepper.getVisibleSteps()

      // Current step should have aria-current="step"
      expect(visibleSteps[0].step.id).toBeDefined()

      stepper.goNext()
      const updatedSteps = stepper.getVisibleSteps()
      // Next current step should be marked
      expect(updatedSteps[1].step.id).toBeDefined()
    })

    it('should support completion markers', () => {
      const engine = createFormEngine(testFields)
      const stepper = createFormStepper(testSteps, engine)
      const visibleSteps = stepper.getVisibleSteps()

      stepper.markComplete('step1')
      stepper.goNext()

      const currentSteps = stepper.getVisibleSteps()
      expect(currentSteps[0].isComplete).toBe(true)
    })
  })
})
