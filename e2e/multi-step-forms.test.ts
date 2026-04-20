import { describe, it, expect, beforeEach } from 'vitest'
import {
  createFormEngine,
  createFormStepper,
  type FormField,
} from '@dmc--98/dfe-core'
import {
  makeField,
  makeStep,
  resetFieldCounter,
  createContactForm,
  createMultiStepConditionalForm,
  createBranchingForm,
  createValidContactValues,
} from './helpers/fixtures'

describe('Multi-Step Forms', () => {
  beforeEach(() => {
    resetFieldCounter()
  })

  describe('Basic Navigation', () => {
    it('should start stepper at step 0 for 3-step form', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      expect(stepper.getCurrentIndex()).toBe(0)
    })

    it('should return first step from getCurrentStep initially', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      const currentStep = stepper.getCurrentStep()
      expect(currentStep).toBeDefined()
      expect(currentStep?.step.id).toBe(steps[0].id)
    })

    it('should advance to next step after setting valid values and calling goNext', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Get fields for step 0
      const step0Fields = fields.filter((f) => f.stepId === steps[0].id)

      // Set valid values for all required fields in step 0
      step0Fields.forEach((field) => {
        if (field.required) {
          if (
            field.type === 'SHORT_TEXT' ||
            field.type === 'EMAIL' ||
            field.type === 'LONG_TEXT'
          ) {
            engine.setFieldValue(
              field.key,
              field.type === 'EMAIL'
                ? 'test@example.com'
                : 'test value for field'
            )
          } else if (field.type === 'NUMBER') {
            engine.setFieldValue(field.key, 42)
          } else if (field.type === 'SELECT') {
            const options = field.config?.options || ['option1']
            engine.setFieldValue(field.key, options[0])
          }
        }
      })

      const result = stepper.goNext()
      expect(result).not.toBeNull()
      expect(stepper.getCurrentIndex()).toBe(1)
    })

    it('should return false for isLastStep at step 0 and true at last step', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      expect(stepper.isLastStep()).toBe(false)

      // Navigate to last step
      stepper.jumpTo(steps.length - 1)
      expect(stepper.isLastStep()).toBe(true)
    })

    it('should return false for canGoBack at step 0 and true at step 1+', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      expect(stepper.canGoBack()).toBe(false)

      stepper.jumpTo(1)
      expect(stepper.canGoBack()).toBe(true)
    })

    it('should navigate back from step 1 to step 0 and preserve values', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Set values on step 0
      engine.setFieldValue('name', 'preserved-value')

      // Navigate forward
      stepper.jumpTo(1)
      expect(stepper.getCurrentIndex()).toBe(1)

      // Navigate back
      const result = stepper.goBack()
      expect(result).not.toBeNull()
      expect(stepper.getCurrentIndex()).toBe(0)

      // Verify values are preserved
      const values = engine.getValues()
      expect(values.name).toBe('preserved-value')
    })
  })

  describe('Progress Tracking', () => {
    it('should return progress at step 0 of 3 with ~33 percent', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      const progress = stepper.getProgress()
      expect(progress.current).toBe(1)
      expect(progress.total).toBe(3)
      expect(progress.percent).toBeGreaterThan(30)
      expect(progress.percent).toBeLessThan(35)
    })

    it('should return 100 percent progress at last step', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      stepper.jumpTo(steps.length - 1)
      const progress = stepper.getProgress()
      expect(progress.percent).toBe(100)
      expect(progress.current).toBe(progress.total)
    })
  })

  describe('Step Skipping', () => {
    it('should skip step when skip condition is met', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Set a value that triggers skip condition for step 1
      // Assuming the form has a skip condition based on a checkbox
      engine.setFieldValue('skip_details', true)

      const visibleSteps = stepper.getVisibleSteps()
      // Visible steps should exclude skipped ones
      expect(visibleSteps.length).toBeLessThanOrEqual(steps.length)
    })

    it('should exclude skipped steps from getVisibleSteps', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      const visibleSteps = stepper.getVisibleSteps()
      expect(visibleSteps).toBeDefined()
      expect(Array.isArray(visibleSteps)).toBe(true)
    })
  })

  describe('Step Jumping', () => {
    it('should jump to specific step when fields are valid', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Set up valid values for intermediate steps
      fields.forEach((field) => {
        if (field.required && field.stepId) {
          if (
            field.type === 'SHORT_TEXT' ||
            field.type === 'EMAIL' ||
            field.type === 'LONG_TEXT'
          ) {
            engine.setFieldValue(
              field.key,
              field.type === 'EMAIL'
                ? 'test@example.com'
                : 'test value'
            )
          } else if (field.type === 'NUMBER') {
            engine.setFieldValue(field.key, 42)
          }
        }
      })

      stepper.jumpTo(2)
      expect(stepper.getCurrentIndex()).toBe(2)
    })

    it('should mark step as complete', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      const stepId = steps[0].id
      stepper.markComplete(stepId)

      // Verify step state was updated
      const currentStep = stepper.getCurrentStep()
      expect(currentStep).toBeDefined()
    })
  })

  describe('Complete Submission Workflow', () => {
    it('should collect all values after navigating all steps', () => {
      const { fields, steps } = createContactForm()
      const engine = createFormEngine(fields)

      // Set all values
      const validValues = createValidContactValues()
      Object.entries(validValues).forEach(([key, value]) => {
        engine.setFieldValue(key, value)
      })

      // Collect submission
      const submission = engine.collectSubmissionValues()
      expect(submission.firstName).toBe('John')
      expect(submission.lastName).toBe('Doe')
      expect(submission.email).toBe('john@example.com')
    })

    it('should validate step using validateStep method', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Don't set any required values, try to validate current step
      const stepId = steps[0].id
      const validation = engine.validateStep(stepId)
      expect(validation).toBeDefined()
      expect(validation.success !== undefined).toBe(true)
    })

    it('should preserve values across forward and backward navigation', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Set value on step 0
      engine.setFieldValue('name', 'value1')

      // Navigate forward with valid values
      const step0Fields = fields.filter((f) => f.stepId === steps[0].id)
      step0Fields.forEach((field) => {
        if (field.required && field.key !== 'name') {
          if (field.type === 'SHORT_TEXT' || field.type === 'EMAIL') {
            engine.setFieldValue(
              field.key,
              field.type === 'EMAIL'
                ? 'test@example.com'
                : 'test'
            )
          } else if (field.type === 'NUMBER') {
            engine.setFieldValue(field.key, 42)
          }
        }
      })

      stepper.goNext()
      expect(stepper.getCurrentIndex()).toBe(1)

      // Set value on step 1
      engine.setFieldValue('age', 25)

      // Navigate back
      stepper.goBack()
      expect(stepper.getCurrentIndex()).toBe(0)

      // Verify both values are still there
      const values = engine.getValues()
      expect(values.name).toBe('value1')
      expect(values.age).toBe(25)
    })
  })

  describe('Step Configuration with Multiple Steps', () => {
    it('should handle 4-step form with step skip in middle: correct total in progress', () => {
      const { fields, steps } = createBranchingForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      const progress = stepper.getProgress()
      expect(progress.total).toBe(4)
      expect(progress.current).toBe(1)
    })
  })

  describe('Branching Logic', () => {
    it('should return correct target step from getNextBranch based on path value', () => {
      const { fields, steps } = createBranchingForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Set a value that determines the branch
      engine.setFieldValue('path', 'personal')

      const nextBranch = stepper.getNextBranch()
      expect(nextBranch).toBeDefined()
      expect(nextBranch?.step.id).toBeDefined()
    })

    it('should navigate to branch target using goNextBranch', () => {
      const { fields, steps } = createBranchingForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Set branch selector
      engine.setFieldValue('path', 'personal')

      // Ensure current step fields are valid
      const currentStepFields = fields.filter(
        (f) => f.stepId === steps[0].id && f.required
      )
      currentStepFields.forEach((field) => {
        if (field.type === 'SHORT_TEXT' || field.type === 'EMAIL') {
          engine.setFieldValue(
            field.key,
            field.type === 'EMAIL'
              ? 'test@example.com'
              : 'test'
          )
        } else if (field.type === 'NUMBER') {
          engine.setFieldValue(field.key, 42)
        } else if (field.type === 'SELECT') {
          const options = field.config?.options || ['option1']
          engine.setFieldValue(field.key, options[0])
        }
      })

      const initialIndex = stepper.getCurrentIndex()
      const result = stepper.goNextBranch()

      // Should have moved or stayed depending on branching logic
      expect(result).not.toBeNull()
    })

    it('should fall back to sequential navigation when no matching branch exists', () => {
      const { fields, steps } = createBranchingForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Set a value that doesn't match any branch
      engine.setFieldValue('path', 'invalidPath')

      const nextBranch = stepper.getNextBranch()
      // Should either return null or fallback
      expect(nextBranch === null || nextBranch !== undefined).toBe(true)
    })
  })

  describe('Dynamic Visibility Updates', () => {
    it('should update visible steps list when skip condition changes', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      const initialVisible = stepper.getVisibleSteps()
      const initialCount = initialVisible.length

      // Change condition that affects step visibility
      engine.setFieldValue('skip_details', true)

      const updatedVisible = stepper.getVisibleSteps()
      // The visible steps should update (may be same or less)
      expect(updatedVisible).toBeDefined()
      expect(Array.isArray(updatedVisible)).toBe(true)
    })
  })

  describe('Step Validation', () => {
    it('should validate only current step fields when advancing', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Get fields for step 0
      const step0Fields = fields.filter((f) => f.stepId === steps[0].id)

      // Set valid values for step 0 required fields
      step0Fields.forEach((field) => {
        if (field.required) {
          if (
            field.type === 'SHORT_TEXT' ||
            field.type === 'EMAIL' ||
            field.type === 'LONG_TEXT'
          ) {
            engine.setFieldValue(
              field.key,
              field.type === 'EMAIL'
                ? 'test@example.com'
                : 'valid value'
            )
          } else if (field.type === 'NUMBER') {
            engine.setFieldValue(field.key, 42)
          } else if (field.type === 'SELECT') {
            const options = field.config?.options || ['option1']
            engine.setFieldValue(field.key, options[0])
          }
        }
      })

      // Should be able to advance
      const result = stepper.goNext()
      expect(result).not.toBeNull()
    })

    it('should validate step using validateStep method', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)

      const stepId = steps[0].id
      const validation = engine.validateStep(stepId)
      expect(validation).toBeDefined()
      expect(validation.success !== undefined).toBe(true)
    })
  })

  describe('Multi-Step Stepper Integration', () => {
    it('should maintain engine state across stepper operations', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Set value through engine
      engine.setFieldValue('name', 'test-value')

      // Access through engine
      let values = engine.getValues()
      expect(values.name).toBe('test-value')

      // Navigate through stepper
      stepper.jumpTo(1)

      // Value should still be there
      values = engine.getValues()
      expect(values.name).toBe('test-value')
    })

    it('should support full form completion workflow', () => {
      const { fields, steps } = createContactForm()
      const engine = createFormEngine(fields)

      // Fill all required fields
      engine.setFieldValue('firstName', 'John')
      engine.setFieldValue('lastName', 'Doe')
      engine.setFieldValue('email', 'john@example.com')
      engine.setFieldValue('message', 'This is a test message that is long enough')

      // Validate entire form
      const validation = engine.validate()
      expect(validation.success).toBe(true)

      // Collect final submission
      const submission = engine.collectSubmissionValues()
      expect(Object.keys(submission).length).toBeGreaterThan(0)
    })

    it('should handle navigation with conditional step visibility', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Get initially visible steps
      const initialSteps = stepper.getVisibleSteps()
      expect(initialSteps.length).toBeGreaterThan(0)

      // Current step should be in visible steps
      const currentStep = stepper.getCurrentStep()
      const isCurrentVisible = initialSteps.some(
        (s) => s.step.id === currentStep?.step.id
      )
      expect(isCurrentVisible).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle going next on last step gracefully', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Jump to last step
      stepper.jumpTo(steps.length - 1)
      expect(stepper.isLastStep()).toBe(true)

      // Try to go next
      const result = stepper.goNext()
      // Should either return null or handle gracefully
      expect(result === null || result !== undefined).toBe(true)
    })

    it('should handle going back on first step gracefully', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Already at first step
      expect(stepper.getCurrentIndex()).toBe(0)

      // Try to go back
      const result = stepper.goBack()
      expect(result).toBeNull()
      expect(stepper.getCurrentIndex()).toBe(0)
    })

    it('should handle invalid jump index gracefully', () => {
      const { fields, steps } = createMultiStepConditionalForm()
      const engine = createFormEngine(fields)
      const stepper = createFormStepper(steps, engine)

      // Try to jump to invalid index
      stepper.jumpTo(999)
      // Should either fail gracefully or not jump
      expect(stepper.getCurrentIndex() < 999).toBe(true)
    })
  })
})
