import { describe, it, expect } from 'vitest'
import { createFormEngine, createFormStepper } from '../src'
import type { FormField, FormStep } from '../src/types'

/**
 * Tests for engine extension features:
 * - Computed fields with expression evaluation
 * - Undo/redo functionality
 * - Field permissions and role-based access
 * - i18n label localization
 * - Repeatable field groups
 * - Stepper branching logic
 */

// ─── Test Helpers ───────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField> & { key: string }): FormField {
  return {
    id: overrides.id ?? `field_${overrides.key}`,
    versionId: overrides.versionId ?? 'v1',
    key: overrides.key,
    label: overrides.label ?? overrides.key,
    type: overrides.type ?? 'SHORT_TEXT',
    required: overrides.required ?? false,
    order: overrides.order ?? 0,
    config: overrides.config ?? {},
    stepId: overrides.stepId ?? null,
    sectionId: overrides.sectionId ?? null,
    parentFieldId: overrides.parentFieldId ?? null,
    conditions: overrides.conditions ?? null,
    children: overrides.children,
    computed: (overrides as any).computed,
    permissions: (overrides as any).permissions,
    i18nLabels: (overrides as any).i18nLabels,
  }
}

function makeStep(overrides: Partial<FormStep> & { id: string; title: string }): FormStep {
  return {
    id: overrides.id,
    versionId: overrides.versionId ?? 'v1',
    title: overrides.title,
    order: overrides.order ?? 0,
    conditions: overrides.conditions ?? null,
    config: overrides.config ?? null,
    fields: overrides.fields,
    branches: (overrides as any).branches,
  }
}

// ─── Computed Fields Tests ───────────────────────────────────────────────────

describe('Computed Fields', () => {
  it('should register and evaluate computed field', () => {
    const fields = [
      makeField({ key: 'quantity', type: 'NUMBER', required: true }),
      makeField({ key: 'price', type: 'NUMBER', required: true }),
      makeField({
        key: 'total',
        type: 'NUMBER',
        computed: {
          expression: 'quantity * price',
          dependsOn: ['quantity', 'price'],
        },
      }),
    ]

    const engine = createFormEngine(fields)
    engine.setFieldValue('quantity', 5)
    engine.setFieldValue('price', 10)

    const computed = engine.getComputedValue('total')
    expect(computed).toBe(50)
  })

  it('should auto-update computed field when dependencies change', () => {
    const fields = [
      makeField({ key: 'a', type: 'NUMBER' }),
      makeField({ key: 'b', type: 'NUMBER' }),
      makeField({
        key: 'sum',
        type: 'NUMBER',
        computed: {
          expression: 'a + b',
          dependsOn: ['a', 'b'],
        },
      }),
    ]

    const engine = createFormEngine(fields)

    engine.setFieldValue('a', 10)
    expect(engine.getComputedValue('sum')).toBe(10)

    engine.setFieldValue('b', 5)
    expect(engine.getComputedValue('sum')).toBe(15)

    engine.setFieldValue('a', 20)
    expect(engine.getComputedValue('sum')).toBe(25)
  })

  it('should handle complex mathematical expressions', () => {
    const fields = [
      makeField({ key: 'x', type: 'NUMBER' }),
      makeField({ key: 'y', type: 'NUMBER' }),
      makeField({
        key: 'result',
        type: 'NUMBER',
        computed: {
          expression: '(x * x) + (y * y)',
          dependsOn: ['x', 'y'],
        },
      }),
    ]

    const engine = createFormEngine(fields)
    engine.setFieldValue('x', 3)
    engine.setFieldValue('y', 4)

    const result = engine.getComputedValue('result')
    expect(result).toBe(25) // 3² + 4² = 9 + 16 = 25
  })

  it('should handle boolean conditions in computed fields', () => {
    const fields = [
      makeField({ key: 'age', type: 'NUMBER' }),
      makeField({
        key: 'isAdult',
        type: 'CHECKBOX',
        computed: {
          expression: 'age >= 18',
          dependsOn: ['age'],
        },
      }),
    ]

    const engine = createFormEngine(fields)

    engine.setFieldValue('age', 17)
    expect(engine.getComputedValue('isAdult')).toBe(false)

    engine.setFieldValue('age', 18)
    expect(engine.getComputedValue('isAdult')).toBe(true)

    engine.setFieldValue('age', 25)
    expect(engine.getComputedValue('isAdult')).toBe(true)
  })

  it('should handle ternary operators in computed fields', () => {
    const fields = [
      makeField({ key: 'score', type: 'NUMBER' }),
      makeField({
        key: 'grade',
        type: 'SHORT_TEXT',
        computed: {
          expression: 'score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F"',
          dependsOn: ['score'],
        },
      }),
    ]

    const engine = createFormEngine(fields)

    engine.setFieldValue('score', 95)
    expect(engine.getComputedValue('grade')).toBe('A')

    engine.setFieldValue('score', 85)
    expect(engine.getComputedValue('grade')).toBe('B')

    engine.setFieldValue('score', 75)
    expect(engine.getComputedValue('grade')).toBe('C')

    engine.setFieldValue('score', 50)
    expect(engine.getComputedValue('grade')).toBe('F')
  })

  it('should handle chained computed dependencies', () => {
    const fields = [
      makeField({ key: 'a', type: 'NUMBER' }),
      makeField({
        key: 'b',
        type: 'NUMBER',
        computed: {
          expression: 'a * 2',
          dependsOn: ['a'],
        },
      }),
      makeField({
        key: 'c',
        type: 'NUMBER',
        computed: {
          expression: 'b * 3',
          dependsOn: ['b'],
        },
      }),
    ]

    const engine = createFormEngine(fields)
    engine.setFieldValue('a', 5)

    // a = 5, b = a * 2 = 10, c = b * 3 = 30
    expect(engine.getComputedValue('b')).toBe(10)
    expect(engine.getComputedValue('c')).toBe(30)
  })

  it('should return undefined for non-computed fields', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    const computed = engine.getComputedValue('name')
    expect(computed).toBeUndefined()
  })

  it('should handle expression evaluation errors gracefully', () => {
    const fields = [
      makeField({ key: 'a', type: 'NUMBER' }),
      makeField({
        key: 'result',
        type: 'NUMBER',
        computed: {
          expression: 'undefined_variable * 2',
          dependsOn: ['a'],
        },
      }),
    ]

    const engine = createFormEngine(fields)
    engine.setFieldValue('a', 5)

    // Should return null on error
    const result = engine.getComputedValue('result')
    expect(result).toBeNull()
  })

  it('should dynamically register computed fields', () => {
    const fields = [
      makeField({ key: 'x', type: 'NUMBER' }),
      makeField({ key: 'y', type: 'NUMBER' }),
    ]

    const engine = createFormEngine(fields)

    // Register computed field after engine creation
    engine.registerComputed('sum', 'x + y', ['x', 'y'])

    engine.setFieldValue('x', 5)
    engine.setFieldValue('y', 3)

    expect(engine.getComputedValue('sum')).toBe(8)
  })
})

// ─── Undo/Redo Tests ─────────────────────────────────────────────────────────

describe('Undo/Redo', () => {
  it('should track undo history', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    engine.setFieldValue('name', 'John')
    expect(engine.canUndo()).toBe(true)

    engine.setFieldValue('name', 'Jane')
    expect(engine.canUndo()).toBe(true)
  })

  it('should undo field changes', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    engine.setFieldValue('name', 'John')
    engine.setFieldValue('name', 'Jane')

    expect(engine.getValues().name).toBe('Jane')

    const previousValues = engine.undo()
    expect(previousValues?.name).toBe('John')
    expect(engine.getValues().name).toBe('John')
  })

  it('should redo field changes', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    engine.setFieldValue('name', 'John')
    engine.setFieldValue('name', 'Jane')

    engine.undo()
    expect(engine.getValues().name).toBe('John')
    expect(engine.canRedo()).toBe(true)

    const nextValues = engine.redo()
    expect(nextValues?.name).toBe('Jane')
    expect(engine.getValues().name).toBe('Jane')
  })

  it('should clear redo stack on new change after undo', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    engine.setFieldValue('name', 'John')
    engine.setFieldValue('name', 'Jane')
    engine.undo()

    expect(engine.canRedo()).toBe(true)

    engine.setFieldValue('name', 'Bob')
    expect(engine.canRedo()).toBe(false)
  })

  it('should respect max history limit', () => {
    const fields = [makeField({ key: 'counter', type: 'NUMBER' })]
    const engine = createFormEngine(fields)

    // Make 60 changes (should limit to 50)
    for (let i = 0; i < 60; i++) {
      engine.setFieldValue('counter', i)
    }

    // Should be able to undo at most 50 times
    let undoCount = 0
    while (engine.canUndo() && undoCount < 55) {
      engine.undo()
      undoCount++
    }

    // Should have undone at most 50 changes
    expect(undoCount).toBeLessThanOrEqual(50)
  })

  it('should handle undo/redo with multiple fields', () => {
    const fields = [
      makeField({ key: 'name' }),
      makeField({ key: 'email' }),
      makeField({ key: 'phone' }),
    ]
    const engine = createFormEngine(fields)

    engine.setFieldValue('name', 'John')
    engine.setFieldValue('email', 'john@example.com')
    engine.setFieldValue('phone', '555-1234')

    const snapshot1 = { name: 'John', email: 'john@example.com', phone: '555-1234' }
    expect(engine.getValues()).toEqual(expect.objectContaining(snapshot1))

    engine.undo()
    // After undo, phone reverts to its value before setFieldValue('phone', '555-1234')
    expect(engine.getValues().phone).toBe('')

    engine.undo()
    expect(engine.getValues().email).toBe('')

    engine.undo()
    expect(engine.getValues().name).toBe('')
  })

  it('should return null when cannot undo', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    expect(engine.canUndo()).toBe(false)
    expect(engine.undo()).toBeNull()
  })

  it('should return null when cannot redo', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    engine.setFieldValue('name', 'John')
    engine.undo()
    engine.redo()

    expect(engine.canRedo()).toBe(false)
    expect(engine.redo()).toBeNull()
  })
})

// ─── Field Permissions Tests ─────────────────────────────────────────────────

describe('Field Permissions', () => {
  it('should return editable as default permission', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    const permission = engine.getFieldPermission('name', 'user')
    expect(permission).toBe('editable')
  })

  it('should return permission level for role', () => {
    const fields = [
      makeField({
        key: 'salary',
        permissions: [
          { role: 'admin', level: 'editable' },
          { role: 'manager', level: 'readonly' },
          { role: 'employee', level: 'hidden' },
        ],
      }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getFieldPermission('salary', 'admin')).toBe('editable')
    expect(engine.getFieldPermission('salary', 'manager')).toBe('readonly')
    expect(engine.getFieldPermission('salary', 'employee')).toBe('hidden')
  })

  it('should return default when role not found', () => {
    const fields = [
      makeField({
        key: 'field',
        permissions: [{ role: 'admin', level: 'editable' }],
      }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getFieldPermission('field', 'unknown')).toBe('editable')
  })

  it('should handle permission changes across multiple roles', () => {
    const fields = [
      makeField({
        key: 'email',
        permissions: [
          { role: 'user', level: 'readonly' },
          { role: 'admin', level: 'editable' },
          { role: 'guest', level: 'hidden' },
        ],
      }),
    ]
    const engine = createFormEngine(fields)

    const roles = ['user', 'admin', 'guest', 'other']
    const permissions = roles.map(role => engine.getFieldPermission('email', role))

    expect(permissions[0]).toBe('readonly') // user
    expect(permissions[1]).toBe('editable') // admin
    expect(permissions[2]).toBe('hidden') // guest
    expect(permissions[3]).toBe('editable') // other (default)
  })

  it('should return editable for non-existent fields', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    expect(engine.getFieldPermission('nonexistent', 'user')).toBe('editable')
  })

  it('should support permission levels: editable, readonly, hidden', () => {
    const fields = [
      makeField({
        key: 'field1',
        permissions: [{ role: 'role1', level: 'editable' }],
      }),
      makeField({
        key: 'field2',
        permissions: [{ role: 'role1', level: 'readonly' }],
      }),
      makeField({
        key: 'field3',
        permissions: [{ role: 'role1', level: 'hidden' }],
      }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getFieldPermission('field1', 'role1')).toBe('editable')
    expect(engine.getFieldPermission('field2', 'role1')).toBe('readonly')
    expect(engine.getFieldPermission('field3', 'role1')).toBe('hidden')
  })
})

// ─── i18n Label Tests ────────────────────────────────────────────────────────

describe('Internationalization (i18n)', () => {
  it('should return localized label for supported locale', () => {
    const fields = [
      makeField({
        key: 'name',
        label: 'Name',
        i18nLabels: {
          es: 'Nombre',
          fr: 'Nom',
          de: 'Name',
        },
      }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getLocalizedLabel('name', 'es')).toBe('Nombre')
    expect(engine.getLocalizedLabel('name', 'fr')).toBe('Nom')
    expect(engine.getLocalizedLabel('name', 'de')).toBe('Name')
  })

  it('should fall back to default label for unsupported locale', () => {
    const fields = [
      makeField({
        key: 'email',
        label: 'Email Address',
        i18nLabels: { es: 'Correo Electrónico' },
      }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getLocalizedLabel('email', 'fr')).toBe('Email Address')
    expect(engine.getLocalizedLabel('email', 'de')).toBe('Email Address')
  })

  it('should handle multiple languages', () => {
    const fields = [
      makeField({
        key: 'firstName',
        label: 'First Name',
        i18nLabels: {
          es: 'Nombre',
          fr: 'Prénom',
          de: 'Vorname',
          ja: '名前',
        },
      }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getLocalizedLabel('firstName', 'es')).toBe('Nombre')
    expect(engine.getLocalizedLabel('firstName', 'fr')).toBe('Prénom')
    expect(engine.getLocalizedLabel('firstName', 'de')).toBe('Vorname')
    expect(engine.getLocalizedLabel('firstName', 'ja')).toBe('名前')
  })

  it('should return empty string for non-existent field', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    expect(engine.getLocalizedLabel('nonexistent', 'en')).toBe('')
  })

  it('should handle field without i18n labels', () => {
    const fields = [makeField({ key: 'name', label: 'Name' })]
    const engine = createFormEngine(fields)

    expect(engine.getLocalizedLabel('name', 'es')).toBe('Name')
    expect(engine.getLocalizedLabel('name', 'fr')).toBe('Name')
  })

  it('should support common locales', () => {
    const fields = [
      makeField({
        key: 'city',
        label: 'City',
        i18nLabels: {
          'en-US': 'City',
          'es-ES': 'Ciudad',
          'fr-FR': 'Ville',
          'de-DE': 'Stadt',
          'zh-CN': '城市',
        },
      }),
    ]
    const engine = createFormEngine(fields)

    expect(engine.getLocalizedLabel('city', 'en-US')).toBe('City')
    expect(engine.getLocalizedLabel('city', 'es-ES')).toBe('Ciudad')
    expect(engine.getLocalizedLabel('city', 'fr-FR')).toBe('Ville')
  })
})

// ─── Repeatable Groups Tests ─────────────────────────────────────────────────

describe('Repeatable Field Groups', () => {
  it('should add repeat instance', () => {
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
            makeField({ key: 'name' }),
          ],
        },
      },
    ]

    const engine = createFormEngine(fields)
    engine.addRepeatInstance('group_1')

    const instances = engine.getRepeatInstances('group_1')
    expect(instances.length).toBe(1)
  })

  it('should add multiple repeat instances', () => {
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
          templateFields: [makeField({ key: 'name' })],
        },
      },
    ]

    const engine = createFormEngine(fields)
    engine.addRepeatInstance('group_1')
    engine.addRepeatInstance('group_1')
    engine.addRepeatInstance('group_1')

    const instances = engine.getRepeatInstances('group_1')
    expect(instances.length).toBe(3)
  })

  it('should remove repeat instance', () => {
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
          templateFields: [makeField({ key: 'name' })],
        },
      },
    ]

    const engine = createFormEngine(fields)
    engine.addRepeatInstance('group_1')
    engine.addRepeatInstance('group_1')
    engine.addRepeatInstance('group_1')

    expect(engine.getRepeatInstances('group_1').length).toBe(3)

    engine.removeRepeatInstance('group_1', 1)
    expect(engine.getRepeatInstances('group_1').length).toBe(2)
  })

  it('should handle invalid index on remove', () => {
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
          templateFields: [makeField({ key: 'name' })],
        },
      },
    ]

    const engine = createFormEngine(fields)
    engine.addRepeatInstance('group_1')

    // Should not crash on invalid index
    engine.removeRepeatInstance('group_1', 10)
    expect(engine.getRepeatInstances('group_1').length).toBe(1)

    engine.removeRepeatInstance('group_1', -1)
    expect(engine.getRepeatInstances('group_1').length).toBe(1)
  })

  it('should return empty array for non-existent group', () => {
    const fields = [makeField({ key: 'name' })]
    const engine = createFormEngine(fields)

    const instances = engine.getRepeatInstances('nonexistent')
    expect(instances).toEqual([])
  })

  it('should populate repeat instances with template defaults', () => {
    const fields: FormField[] = [
      {
        id: 'group_1',
        versionId: 'v1',
        key: 'group_1',
        label: 'Contact Group',
        type: 'FIELD_GROUP',
        required: false,
        order: 0,
        config: {
          templateFields: [
            makeField({ key: 'firstName' }),
            makeField({ key: 'lastName' }),
          ],
        },
      },
    ]

    const engine = createFormEngine(fields)
    engine.addRepeatInstance('group_1')

    const instances = engine.getRepeatInstances('group_1')
    expect(instances[0]).toHaveProperty('firstName')
    expect(instances[0]).toHaveProperty('lastName')
  })

  it('should handle group without template fields', () => {
    const fields: FormField[] = [
      {
        id: 'group_1',
        versionId: 'v1',
        key: 'group_1',
        label: 'Group',
        type: 'FIELD_GROUP',
        required: false,
        order: 0,
        config: {},
      },
    ]

    const engine = createFormEngine(fields)
    // Should not crash
    engine.addRepeatInstance('group_1')

    const instances = engine.getRepeatInstances('group_1')
    expect(instances.length).toBe(0) // No instances added if no template
  })
})

// ─── Stepper Branching Tests ─────────────────────────────────────────────────

describe('Stepper Branching', () => {
  it('should get next branch when condition matches', () => {
    const fields = [
      makeField({
        key: 'type',
        type: 'SELECT',
        required: true,
        config: {
          mode: 'static',
          options: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
          ],
        },
      }),
    ]

    const steps = [
      makeStep({
        id: 'step1',
        title: 'Choose Type',
        branches: [
          { condition: 'type === "a"', targetStepId: 'step_a' },
        ],
      }),
      makeStep({ id: 'step_a', title: 'Path A' }),
      makeStep({ id: 'step_b', title: 'Path B' }),
    ]

    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    engine.setFieldValue('type', 'a')
    const nextBranch = stepper.getNextBranch()

    expect(nextBranch?.step.id).toBe('step_a')
  })

  it('should evaluate multiple branch conditions', () => {
    const fields = [
      makeField({
        key: 'option',
        type: 'SELECT',
        config: {
          mode: 'static',
          options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
            { label: 'C', value: 'c' },
          ],
        },
      }),
    ]

    const steps = [
      makeStep({
        id: 'step_start',
        title: 'Start',
        branches: [
          { condition: 'option === "a"', targetStepId: 'step_a' },
          { condition: 'option === "b"', targetStepId: 'step_b' },
          { condition: 'option === "c"', targetStepId: 'step_c' },
        ],
      }),
      makeStep({ id: 'step_a', title: 'A' }),
      makeStep({ id: 'step_b', title: 'B' }),
      makeStep({ id: 'step_c', title: 'C' }),
    ]

    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    engine.setFieldValue('option', 'a')
    expect(stepper.getNextBranch()?.step.id).toBe('step_a')

    engine.setFieldValue('option', 'b')
    expect(stepper.getNextBranch()?.step.id).toBe('step_b')

    engine.setFieldValue('option', 'c')
    expect(stepper.getNextBranch()?.step.id).toBe('step_c')
  })

  it('should return null when no branch matches', () => {
    const fields = [
      makeField({
        key: 'type',
        type: 'SELECT',
        config: {
          mode: 'static',
          options: [{ label: 'A', value: 'a' }],
        },
      }),
    ]

    const steps = [
      makeStep({
        id: 'step1',
        title: 'Choose',
        branches: [
          { condition: 'type === "a"', targetStepId: 'step_a' },
        ],
      }),
      makeStep({ id: 'step_a', title: 'Path A' }),
    ]

    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    engine.setFieldValue('type', 'x')
    const nextBranch = stepper.getNextBranch()

    expect(nextBranch).toBeNull()
  })

  it('should navigate to branch target', () => {
    const fields = [
      makeField({
        key: 'useBasic',
        type: 'CHECKBOX',
      }),
    ]

    const steps = [
      makeStep({
        id: 'config',
        title: 'Configuration',
        branches: [
          { condition: 'useBasic === true', targetStepId: 'basic' },
          { condition: 'useBasic === false', targetStepId: 'advanced' },
        ],
      }),
      makeStep({ id: 'basic', title: 'Basic Setup' }),
      makeStep({ id: 'advanced', title: 'Advanced Setup' }),
    ]

    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    engine.setFieldValue('useBasic', true)
    stepper.goNextBranch()

    expect(stepper.getCurrentStep()?.step.id).toBe('basic')
  })

  it('should fall back to sequential navigation if no branch matches', () => {
    const fields = [makeField({ key: 'skip', type: 'CHECKBOX' })]

    const steps = [
      makeStep({
        id: 'step1',
        title: 'Step 1',
        branches: [
          { condition: 'skip === true', targetStepId: 'step3' },
        ],
      }),
      makeStep({ id: 'step2', title: 'Step 2' }),
      makeStep({ id: 'step3', title: 'Step 3' }),
    ]

    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    engine.setFieldValue('skip', false)
    stepper.goNextBranch()

    // Should go to step2 (next sequential step)
    expect(stepper.getCurrentStep()?.step.id).toBe('step2')
  })

  it('should handle complex branch conditions', () => {
    const fields = [
      makeField({ key: 'age', type: 'NUMBER' }),
      makeField({ key: 'hasLicense', type: 'CHECKBOX' }),
    ]

    const steps = [
      makeStep({
        id: 'verify',
        title: 'Verification',
        branches: [
          { condition: 'age >= 18 && hasLicense === true', targetStepId: 'approved' },
          { condition: 'age >= 18', targetStepId: 'getLicense' },
          { condition: 'age < 18', targetStepId: 'denied' },
        ],
      }),
      makeStep({ id: 'approved', title: 'Approved' }),
      makeStep({ id: 'getLicense', title: 'Get License' }),
      makeStep({ id: 'denied', title: 'Denied' }),
    ]

    const engine = createFormEngine(fields)
    const stepper = createFormStepper(steps, engine)

    // Case 1: Age >= 18 && has license
    engine.setFieldValue('age', 25)
    engine.setFieldValue('hasLicense', true)
    expect(stepper.getNextBranch()?.step.id).toBe('approved')

    // Case 2: Age >= 18 && no license
    engine.setFieldValue('hasLicense', false)
    expect(stepper.getNextBranch()?.step.id).toBe('getLicense')

    // Case 3: Age < 18
    engine.setFieldValue('age', 16)
    expect(stepper.getNextBranch()?.step.id).toBe('denied')
  })
})
