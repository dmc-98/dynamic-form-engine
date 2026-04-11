import type { FormField, FormStep, StepNodeState } from '@dmc-98/dfe-core'

export const sampleFields: FormField[] = [
  {
    id: 'first-name',
    versionId: 'v1',
    stepId: 'step-personal',
    key: 'first_name',
    label: 'First Name',
    type: 'SHORT_TEXT',
    required: true,
    order: 1,
    config: { placeholder: 'Ada' },
  },
  {
    id: 'bio',
    versionId: 'v1',
    stepId: 'step-personal',
    key: 'bio',
    label: 'Short Bio',
    type: 'LONG_TEXT',
    required: false,
    order: 2,
    config: { placeholder: 'A little context for your team' },
  },
  {
    id: 'department',
    versionId: 'v1',
    stepId: 'step-role',
    key: 'department',
    label: 'Department',
    type: 'SELECT',
    required: true,
    order: 3,
    config: {
      mode: 'static',
      options: [
        { label: 'Engineering', value: 'eng' },
        { label: 'Design', value: 'design' },
        { label: 'Operations', value: 'ops' },
      ],
    },
  },
  {
    id: 'equipment',
    versionId: 'v1',
    stepId: 'step-role',
    key: 'needs_equipment',
    label: 'Needs Equipment?',
    type: 'CHECKBOX',
    required: false,
    order: 4,
    config: {},
  },
  {
    id: 'equipment-notes',
    versionId: 'v1',
    stepId: 'step-role',
    key: 'equipment_notes',
    label: 'Equipment Notes',
    type: 'LONG_TEXT',
    required: false,
    order: 5,
    config: { placeholder: 'Laptop, monitor, keyboard' },
    conditions: {
      action: 'SHOW',
      operator: 'and',
      rules: [{ fieldKey: 'needs_equipment', operator: 'eq', value: true }],
    },
  },
]

export const sampleSteps: FormStep[] = [
  {
    id: 'step-personal',
    versionId: 'v1',
    title: 'Personal Information',
    order: 1,
    config: null,
    conditions: null,
  },
  {
    id: 'step-role',
    versionId: 'v1',
    title: 'Role Setup',
    order: 2,
    config: null,
    conditions: null,
  },
]

export const sampleStepStates: StepNodeState[] = [
  {
    step: sampleSteps[0],
    fieldKeys: ['first_name', 'bio'],
    isVisible: true,
    isComplete: true,
  },
  {
    step: sampleSteps[1],
    fieldKeys: ['department', 'needs_equipment', 'equipment_notes'],
    isVisible: true,
    isComplete: false,
  },
]
