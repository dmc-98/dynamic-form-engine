import { describe, it, expect, beforeEach } from 'vitest'
import { createFormEngine, createFormStepper } from '@dmc-98/dfe-core'
import {
  makeField,
  makeStep,
  resetFieldCounter,
  createBranchingForm,
  createI18nForm,
  createPermissionsForm,
} from './helpers/fixtures'

describe('Advanced Form Engine Features', () => {
  // ============================================================================
  // COMPUTED FIELDS (~6 tests)
  // ============================================================================
  describe('Computed Fields', () => {
    beforeEach(() => {
      resetFieldCounter()
    })

    it('should register and compute simple arithmetic expression', () => {
      const fields = [
        makeField({ key: 'price', type: 'NUMBER' }),
        makeField({ key: 'quantity', type: 'NUMBER' }),
        makeField({ key: 'total', type: 'NUMBER', required: false }),
      ]
      const engine = createFormEngine(fields)
      engine.registerComputed('total', 'price * quantity', ['price', 'quantity'])

      engine.setFieldValue('price', 10)
      engine.setFieldValue('quantity', 3)

      expect(engine.getComputedValue('total')).toBe(30)
    })

    it('should recalculate when dependency changes', () => {
      const fields = [
        makeField({ key: 'price', type: 'NUMBER' }),
        makeField({ key: 'quantity', type: 'NUMBER' }),
        makeField({ key: 'total', type: 'NUMBER', required: false }),
      ]
      const engine = createFormEngine(fields)
      engine.registerComputed('total', 'price * quantity', ['price', 'quantity'])

      engine.setFieldValue('price', 10)
      engine.setFieldValue('quantity', 3)
      expect(engine.getComputedValue('total')).toBe(30)

      engine.setFieldValue('quantity', 5)
      expect(engine.getComputedValue('total')).toBe(50)
    })

    it('should support chained computed fields', () => {
      const fields = [
        makeField({ key: 'price', type: 'NUMBER' }),
        makeField({ key: 'quantity', type: 'NUMBER' }),
        makeField({ key: 'total', type: 'NUMBER', required: false }),
        makeField({ key: 'double', type: 'NUMBER', required: false }),
      ]
      const engine = createFormEngine(fields)
      engine.registerComputed('total', 'price * quantity', ['price', 'quantity'])
      engine.registerComputed('double', 'total * 2', ['total'])

      engine.setFieldValue('price', 10)
      engine.setFieldValue('quantity', 2)

      expect(engine.getComputedValue('total')).toBe(20)
      expect(engine.getComputedValue('double')).toBe(40)
    })

    it('should return null for invalid expression without crashing', () => {
      const fields = [
        makeField({ key: 'price', type: 'NUMBER' }),
        makeField({ key: 'total', type: 'NUMBER', required: false }),
      ]
      const engine = createFormEngine(fields)
      engine.registerComputed('total', 'price * invalidField', ['price', 'invalidField'])

      engine.setFieldValue('price', 10)

      const result = engine.getComputedValue('total')
      expect(result === null || result === undefined).toBe(true)
    })

    it('should compute string concatenation', () => {
      const fields = [
        makeField({ key: 'firstName', type: 'SHORT_TEXT' }),
        makeField({ key: 'lastName', type: 'SHORT_TEXT' }),
        makeField({ key: 'fullName', type: 'SHORT_TEXT', required: false }),
      ]
      const engine = createFormEngine(fields)
      engine.registerComputed('fullName', 'firstName + " " + lastName', ['firstName', 'lastName'])

      engine.setFieldValue('firstName', 'John')
      engine.setFieldValue('lastName', 'Doe')

      expect(engine.getComputedValue('fullName')).toBe('John Doe')
    })

    it('should return null for non-existent computed field key', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })]
      const engine = createFormEngine(fields)

      const result = engine.getComputedValue('nonExistent')
      expect(result === null || result === undefined).toBe(true)
    })
  })

  // ============================================================================
  // UNDO/REDO (~6 tests)
  // ============================================================================
  describe('Undo/Redo Functionality', () => {
    beforeEach(() => {
      resetFieldCounter()
    })

    it('should undo a field value change to default', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })]
      const engine = createFormEngine(fields)

      engine.setFieldValue('name', 'John')
      expect(engine.getValues().name).toBe('John')

      const undoResult = engine.undo()
      expect(undoResult).not.toBeNull()
      expect(engine.getValues().name).toBe('')
    })

    it('should undo and redo to restore value', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })]
      const engine = createFormEngine(fields)

      engine.setFieldValue('name', 'John')
      expect(engine.getValues().name).toBe('John')

      engine.undo()
      expect(engine.getValues().name).toBe('')

      const redoResult = engine.redo()
      expect(redoResult).not.toBeNull()
      expect(engine.getValues().name).toBe('John')
    })

    it('should handle multiple undo operations correctly', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })]
      const engine = createFormEngine(fields)

      engine.setFieldValue('name', 'First')
      engine.setFieldValue('name', 'Second')
      engine.setFieldValue('name', 'Third')
      expect(engine.getValues().name).toBe('Third')

      engine.undo()
      expect(engine.getValues().name).toBe('Second')

      engine.undo()
      expect(engine.getValues().name).toBe('First')

      const undoResult = engine.undo()
      expect(undoResult).not.toBeNull()
      expect(engine.getValues().name).toBe('')
    })

    it('should report canUndo false initially and true after change', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })]
      const engine = createFormEngine(fields)

      expect(engine.canUndo()).toBe(false)

      engine.setFieldValue('name', 'John')
      expect(engine.canUndo()).toBe(true)
    })

    it('should report canRedo correctly', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })]
      const engine = createFormEngine(fields)

      expect(engine.canRedo()).toBe(false)

      engine.setFieldValue('name', 'John')
      expect(engine.canRedo()).toBe(false)

      engine.undo()
      expect(engine.canRedo()).toBe(true)
    })

    it('should clear redo stack when new change made after undo', () => {
      const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })]
      const engine = createFormEngine(fields)

      engine.setFieldValue('name', 'First')
      engine.undo()
      expect(engine.canRedo()).toBe(true)

      engine.setFieldValue('name', 'Second')
      expect(engine.canRedo()).toBe(false)
      expect(engine.getValues().name).toBe('Second')
    })
  })

  // ============================================================================
  // STEP BRANCHING (~6 tests)
  // ============================================================================
  describe('Step Branching', () => {
    beforeEach(() => {
      resetFieldCounter()
    })

    it('should branch to personal step when path is personal', () => {
      const form = createBranchingForm()
      const engine = createFormEngine(form.fields)
      const stepper = createFormStepper(form.steps, engine)

      engine.setFieldValue('path', 'personal')

      const nextBranch = stepper.getNextBranch()
      expect(nextBranch).not.toBeNull()
      expect(nextBranch?.step.id).toBe('step_personal')
    })

    it('should branch to business step when path is business', () => {
      const form = createBranchingForm()
      const engine = createFormEngine(form.fields)
      const stepper = createFormStepper(form.steps, engine)

      engine.setFieldValue('path', 'business')

      const nextBranch = stepper.getNextBranch()
      expect(nextBranch).not.toBeNull()
      expect(nextBranch?.step.id).toBe('step_business')
    })

    it('should navigate to branched step with goNextBranch', () => {
      const form = createBranchingForm()
      const engine = createFormEngine(form.fields)
      const stepper = createFormStepper(form.steps, engine)

      engine.setFieldValue('path', 'personal')
      stepper.goNextBranch()

      const currentStep = stepper.getCurrentStep?.()
      expect(currentStep?.step.id).toBe('step_personal')
    })

    it('should return null when no value set for branch condition', () => {
      const form = createBranchingForm()
      const engine = createFormEngine(form.fields)
      const stepper = createFormStepper(form.steps, engine)

      const nextBranch = stepper.getNextBranch()
      expect(nextBranch).toBeNull()
    })

    it('should have correct current step after branching', () => {
      const form = createBranchingForm()
      const engine = createFormEngine(form.fields)
      const stepper = createFormStepper(form.steps, engine)

      engine.setFieldValue('path', 'business')
      stepper.goNextBranch()

      const currentStep = stepper.getCurrentStep?.()
      expect(currentStep?.step.id).toBe('step_business')
    })

    it('should fallback to sequential navigation when no matching branch', () => {
      const form = createBranchingForm()
      const engine = createFormEngine(form.fields)
      const stepper = createFormStepper(form.steps, engine)

      engine.setFieldValue('path', 'invalid_value')
      stepper.goNextBranch()

      const currentStep = stepper.getCurrentStep?.()
      expect(currentStep).not.toBeNull()
    })
  })

  // ============================================================================
  // FIELD PERMISSIONS (~5 tests)
  // ============================================================================
  describe('Field Permissions', () => {
    beforeEach(() => {
      resetFieldCounter()
    })

    it('should return editable for admin role on public field', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'public_name',
          type: 'SHORT_TEXT' as const,
          label: 'Public Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'editable' as const },
          ],
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'secret_code',
          type: 'SHORT_TEXT' as const,
          label: 'Secret Code',
          required: false,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'hidden' as const },
          ],
        },
        {
          id: 'f3',
          versionId: 'v1',
          key: 'readonly_field',
          type: 'SHORT_TEXT' as const,
          label: 'Readonly Field',
          required: false,
          order: 2,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'readonly' as const },
          ],
        },
      ] as any
      const engine = createFormEngine(fields)

      const permission = engine.getFieldPermission('public_name', 'admin')
      expect(permission).toBe('editable')
    })

    it('should return hidden for user role on secret field', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'public_name',
          type: 'SHORT_TEXT' as const,
          label: 'Public Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'editable' as const },
          ],
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'secret_code',
          type: 'SHORT_TEXT' as const,
          label: 'Secret Code',
          required: false,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'hidden' as const },
          ],
        },
        {
          id: 'f3',
          versionId: 'v1',
          key: 'readonly_field',
          type: 'SHORT_TEXT' as const,
          label: 'Readonly Field',
          required: false,
          order: 2,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'readonly' as const },
          ],
        },
      ] as any
      const engine = createFormEngine(fields)

      const permission = engine.getFieldPermission('secret_code', 'user')
      expect(permission).toBe('hidden')
    })

    it('should return readonly for user role on readonly field', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'public_name',
          type: 'SHORT_TEXT' as const,
          label: 'Public Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'editable' as const },
          ],
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'secret_code',
          type: 'SHORT_TEXT' as const,
          label: 'Secret Code',
          required: false,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'hidden' as const },
          ],
        },
        {
          id: 'f3',
          versionId: 'v1',
          key: 'readonly_field',
          type: 'SHORT_TEXT' as const,
          label: 'Readonly Field',
          required: false,
          order: 2,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'readonly' as const },
          ],
        },
      ] as any
      const engine = createFormEngine(fields)

      const permission = engine.getFieldPermission('readonly_field', 'user')
      expect(permission).toBe('readonly')
    })

    it('should return editable for user role on public field', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'public_name',
          type: 'SHORT_TEXT' as const,
          label: 'Public Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'editable' as const },
          ],
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'secret_code',
          type: 'SHORT_TEXT' as const,
          label: 'Secret Code',
          required: false,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'hidden' as const },
          ],
        },
        {
          id: 'f3',
          versionId: 'v1',
          key: 'readonly_field',
          type: 'SHORT_TEXT' as const,
          label: 'Readonly Field',
          required: false,
          order: 2,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          permissions: [
            { role: 'admin', level: 'editable' as const },
            { role: 'user', level: 'readonly' as const },
          ],
        },
      ] as any
      const engine = createFormEngine(fields)

      const permission = engine.getFieldPermission('public_name', 'user')
      expect(permission).toBe('editable')
    })

    it('should return editable by default for field with no permissions', () => {
      const fields = [makeField({ key: 'unprotected', type: 'SHORT_TEXT' })]
      const engine = createFormEngine(fields)

      const permission = engine.getFieldPermission('unprotected', 'admin')
      expect(permission).toBe('editable')
    })
  })

  // ============================================================================
  // INTERNATIONALIZATION (i18n) (~5 tests)
  // ============================================================================
  describe('Internationalization (i18n)', () => {
    beforeEach(() => {
      resetFieldCounter()
    })

    it('should return English label', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'name',
          type: 'SHORT_TEXT' as const,
          label: 'Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'email',
          type: 'EMAIL' as const,
          label: 'Email',
          required: true,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
        },
      ] as any
      const engine = createFormEngine(fields)

      const label = engine.getLocalizedLabel('name', 'en')
      expect(label).toBe('Name')
    })

    it('should return Spanish label', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'name',
          type: 'SHORT_TEXT' as const,
          label: 'Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'email',
          type: 'EMAIL' as const,
          label: 'Email',
          required: true,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
        },
      ] as any
      const engine = createFormEngine(fields)

      const label = engine.getLocalizedLabel('name', 'es')
      expect(label).toBe('Nombre')
    })

    it('should return French label', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'name',
          type: 'SHORT_TEXT' as const,
          label: 'Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'email',
          type: 'EMAIL' as const,
          label: 'Email',
          required: true,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
        },
      ] as any
      const engine = createFormEngine(fields)

      const label = engine.getLocalizedLabel('name', 'fr')
      expect(label).toBe('Nom')
    })

    it('should fallback to default label for unsupported locale', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'name',
          type: 'SHORT_TEXT' as const,
          label: 'Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'email',
          type: 'EMAIL' as const,
          label: 'Email',
          required: true,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
        },
      ] as any
      const engine = createFormEngine(fields)

      const label = engine.getLocalizedLabel('name', 'de')
      expect(label).toBe('Name')
    })

    it('should return localized label for email field', () => {
      const fields = [
        {
          id: 'f1',
          versionId: 'v1',
          key: 'name',
          type: 'SHORT_TEXT' as const,
          label: 'Name',
          required: true,
          order: 0,
          config: { minLength: 1 },
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
        },
        {
          id: 'f2',
          versionId: 'v1',
          key: 'email',
          type: 'EMAIL' as const,
          label: 'Email',
          required: true,
          order: 1,
          config: {},
          stepId: null,
          sectionId: null,
          parentFieldId: null,
          conditions: null,
          i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
        },
      ] as any
      const engine = createFormEngine(fields)

      const label = engine.getLocalizedLabel('email', 'es')
      expect(label).toBe('Correo electrónico')
    })
  })

  // ============================================================================
  // REPEATABLE GROUPS (~5 tests)
  // ============================================================================
  describe('Repeatable Groups', () => {
    beforeEach(() => {
      resetFieldCounter()
    })

    it('should start with empty repeat instances', () => {
      const fields = [
        makeField({
          key: 'addresses',
          type: 'FIELD_GROUP',
          config: {
            templateFields: [
              { key: 'street', type: 'SHORT_TEXT', config: {} },
              { key: 'city', type: 'SHORT_TEXT', config: {} },
            ],
          },
        }),
      ]
      const engine = createFormEngine(fields)

      const instances = engine.getRepeatInstances('addresses')
      expect(Array.isArray(instances)).toBe(true)
      expect(instances.length).toBe(0)
    })

    it('should add repeat instance', () => {
      const fields = [
        makeField({
          key: 'addresses',
          type: 'FIELD_GROUP',
          config: {
            templateFields: [
              { key: 'street', type: 'SHORT_TEXT', config: {} },
              { key: 'city', type: 'SHORT_TEXT', config: {} },
            ],
          },
        }),
      ]
      const engine = createFormEngine(fields)

      engine.addRepeatInstance('addresses')
      const instances = engine.getRepeatInstances('addresses')
      expect(instances.length).toBe(1)
    })

    it('should handle multiple repeat instances', () => {
      const fields = [
        makeField({
          key: 'addresses',
          type: 'FIELD_GROUP',
          config: {
            templateFields: [
              { key: 'street', type: 'SHORT_TEXT', config: {} },
              { key: 'city', type: 'SHORT_TEXT', config: {} },
            ],
          },
        }),
      ]
      const engine = createFormEngine(fields)

      engine.addRepeatInstance('addresses')
      engine.addRepeatInstance('addresses')
      engine.addRepeatInstance('addresses')

      const instances = engine.getRepeatInstances('addresses')
      expect(instances.length).toBe(3)
    })

    it('should remove repeat instance at specific index', () => {
      const fields = [
        makeField({
          key: 'addresses',
          type: 'FIELD_GROUP',
          config: {
            templateFields: [
              { key: 'street', type: 'SHORT_TEXT', config: {} },
              { key: 'city', type: 'SHORT_TEXT', config: {} },
            ],
          },
        }),
      ]
      const engine = createFormEngine(fields)

      engine.addRepeatInstance('addresses')
      engine.addRepeatInstance('addresses')
      engine.addRepeatInstance('addresses')
      expect(engine.getRepeatInstances('addresses').length).toBe(3)

      engine.removeRepeatInstance('addresses', 1)
      expect(engine.getRepeatInstances('addresses').length).toBe(2)
    })

    it('should handle removal from empty repeat group gracefully', () => {
      const fields = [
        makeField({
          key: 'addresses',
          type: 'FIELD_GROUP',
          config: {
            templateFields: [
              { key: 'street', type: 'SHORT_TEXT', config: {} },
              { key: 'city', type: 'SHORT_TEXT', config: {} },
            ],
          },
        }),
      ]
      const engine = createFormEngine(fields)

      expect(() => {
        engine.removeRepeatInstance('addresses', 0)
      }).not.toThrow()

      const instances = engine.getRepeatInstances('addresses')
      expect(instances.length).toBe(0)
    })
  })
})
