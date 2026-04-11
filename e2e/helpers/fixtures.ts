/**
 * Shared test fixtures for E2E tests.
 * Provides reusable form configurations, fields, and steps.
 */
import type { FormField, FormStep, FormValues, FieldType, ConditionSkipRule, StepBranch } from '@dmc-98/dfe-core'

// ─── Field Factory ──────────────────────────────────────────────────────────

let fieldCounter = 0

export function makeField(
  keyOrOverrides: string | (Partial<FormField> & { key: string; type?: FieldType }),
  type?: FieldType | string,
  label?: string,
  config?: Record<string, any>,
): FormField {
  // Support both old signature (positional args) and new signature (single object)
  let overrides: Partial<FormField> & { key: string; type?: FieldType }

  if (typeof keyOrOverrides === 'string') {
    // Old signature: makeField(key, type, label, config)
    overrides = {
      key: keyOrOverrides,
      type: type as FieldType,
      label,
      config,
    }
  } else {
    // New signature: makeField({...overrides})
    overrides = keyOrOverrides
  }

  const id = `field_${++fieldCounter}`
  return {
    id: overrides.id ?? id,
    versionId: overrides.versionId ?? 'v1',
    key: overrides.key,
    label: overrides.label ?? overrides.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type: overrides.type ?? 'SHORT_TEXT',
    required: overrides.required ?? false,
    order: overrides.order ?? fieldCounter,
    config: overrides.config ?? {},
    stepId: overrides.stepId ?? null,
    sectionId: overrides.sectionId ?? null,
    parentFieldId: overrides.parentFieldId ?? null,
    conditions: overrides.conditions ?? null,
    children: overrides.children,
    description: (overrides as any).description ?? null,
  }
}

export function makeStep(overrides: Partial<FormStep> & { id: string; title: string }): FormStep {
  return {
    versionId: overrides.versionId ?? 'v1',
    order: overrides.order ?? 0,
    ...overrides,
  }
}

export function resetFieldCounter() {
  fieldCounter = 0
}

// ─── Simple Contact Form ────────────────────────────────────────────────────

export function createContactForm(): { fields: FormField[]; steps: FormStep[] } {
  return {
    fields: [
      makeField({ key: 'firstName', type: 'SHORT_TEXT', required: true, stepId: 'step_info', config: { minLength: 1 } }),
      makeField({ key: 'lastName', type: 'SHORT_TEXT', required: true, stepId: 'step_info', config: { minLength: 1 } }),
      makeField({ key: 'email', type: 'EMAIL', required: true, stepId: 'step_info' }),
      makeField({ key: 'phone', type: 'PHONE', required: false, stepId: 'step_info' }),
      makeField({ key: 'message', type: 'LONG_TEXT', required: true, stepId: 'step_message', config: { minLength: 10, maxLength: 500 } }),
      makeField({ key: 'subscribe', type: 'CHECKBOX', required: false, stepId: 'step_message' }),
    ],
    steps: [
      makeStep({ id: 'step_info', title: 'Contact Information', order: 0 }),
      makeStep({ id: 'step_message', title: 'Your Message', order: 1 }),
    ],
  }
}

// ─── All Field Types Form ───────────────────────────────────────────────────

export function createAllFieldTypesForm(): { fields: FormField[] } {
  const types: FieldType[] = [
    'SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'EMAIL', 'PHONE',
    'DATE', 'DATE_RANGE', 'TIME', 'DATE_TIME',
    'SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX',
    'FILE_UPLOAD', 'RATING', 'SCALE',
    'URL', 'PASSWORD', 'HIDDEN',
    'SECTION_BREAK', 'FIELD_GROUP',
    'RICH_TEXT', 'SIGNATURE', 'ADDRESS',
  ]

  const fields = types.map((type, i) => {
    const key = `field_${type.toLowerCase()}`
    const config: any = {}

    // Add type-specific configs
    if (type === 'SELECT' || type === 'RADIO') {
      config.mode = 'static'
      config.options = [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
    }
    if (type === 'MULTI_SELECT') {
      config.mode = 'static'
      config.options = [{ label: 'X', value: 'x' }, { label: 'Y', value: 'y' }, { label: 'Z', value: 'z' }]
    }
    if (type === 'RATING') config.max = 5
    if (type === 'SCALE') { config.min = 1; config.max = 10 }
    if (type === 'FILE_UPLOAD') { config.maxSizeMB = 5; config.maxFiles = 1; config.allowedMimeTypes = ['application/pdf'] }
    if (type === 'NUMBER') { config.min = 0; config.max = 100 }

    return makeField({
      key,
      type,
      required: !['SECTION_BREAK', 'FIELD_GROUP', 'HIDDEN', 'CHECKBOX'].includes(type),
      order: i,
      config,
    })
  })

  return { fields }
}

// ─── Multi-Step Form with Conditions ────────────────────────────────────────

export function createMultiStepConditionalForm(): { fields: FormField[]; steps: FormStep[] } {
  const skipCondition: ConditionSkipRule = {
    operator: 'and',
    rules: [{ fieldKey: 'skip_details', operator: 'eq', value: 'true' }],
  }

  return {
    fields: [
      makeField({ key: 'name', type: 'SHORT_TEXT', required: true, stepId: 'step_1', config: { minLength: 1 } }),
      makeField({ key: 'skip_details', type: 'CHECKBOX', required: false, stepId: 'step_1' }),
      makeField({ key: 'age', type: 'NUMBER', required: true, stepId: 'step_2', config: { min: 0, max: 150 } }),
      makeField({ key: 'bio', type: 'LONG_TEXT', required: false, stepId: 'step_2' }),
      makeField({ key: 'confirm', type: 'CHECKBOX', required: true, stepId: 'step_3' }),
    ],
    steps: [
      makeStep({ id: 'step_1', title: 'Basics', order: 0 }),
      makeStep({ id: 'step_2', title: 'Details', order: 1, conditions: skipCondition }),
      makeStep({ id: 'step_3', title: 'Confirm', order: 2 }),
    ],
  }
}

// ─── Branching Form ─────────────────────────────────────────────────────────

export function createBranchingForm(): { fields: FormField[]; steps: FormStep[] } {
  const branches: StepBranch[] = [
    { targetStepId: 'step_personal', condition: 'path === "personal"', label: 'Personal' },
    { targetStepId: 'step_business', condition: 'path === "business"', label: 'Business' },
  ]

  return {
    fields: [
      makeField({ key: 'path', type: 'SELECT', required: true, stepId: 'step_choice', config: { mode: 'static', options: [{ label: 'Personal', value: 'personal' }, { label: 'Business', value: 'business' }] } }),
      makeField({ key: 'personal_name', type: 'SHORT_TEXT', required: true, stepId: 'step_personal', config: { minLength: 1 } }),
      makeField({ key: 'business_name', type: 'SHORT_TEXT', required: true, stepId: 'step_business', config: { minLength: 1 } }),
      makeField({ key: 'business_tax_id', type: 'SHORT_TEXT', required: true, stepId: 'step_business' }),
      makeField({ key: 'done', type: 'CHECKBOX', required: false, stepId: 'step_final' }),
    ],
    steps: [
      makeStep({ id: 'step_choice', title: 'Choose Path', order: 0, branches }),
      makeStep({ id: 'step_personal', title: 'Personal Info', order: 1 }),
      makeStep({ id: 'step_business', title: 'Business Info', order: 2 }),
      makeStep({ id: 'step_final', title: 'Done', order: 3 }),
    ],
  }
}

// ─── Form with Conditional Visibility ───────────────────────────────────────

export function createConditionalVisibilityForm(): { fields: FormField[] } {
  return {
    fields: [
      makeField({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
      makeField({
        key: 'admin_code',
        type: 'SHORT_TEXT',
        required: true,
        conditions: {
          action: 'SHOW',
          operator: 'and',
          rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }],
        } as any,
      }),
      makeField({ key: 'username', type: 'SHORT_TEXT', required: true, config: { minLength: 3 } }),
    ],
  }
}

// ─── Large Form for Performance ─────────────────────────────────────────────

export function createLargeForm(count: number): { fields: FormField[] } {
  const fields: FormField[] = []
  for (let i = 0; i < count; i++) {
    fields.push(makeField({
      key: `field_${i}`,
      type: i % 3 === 0 ? 'SHORT_TEXT' : i % 3 === 1 ? 'NUMBER' : 'EMAIL',
      required: i < 5,
      order: i,
      config: i % 3 === 0 ? { minLength: 1 } : i % 3 === 1 ? { min: 0 } : {},
    }))
  }
  return { fields }
}

// ─── Valid Form Values ──────────────────────────────────────────────────────

export function createValidContactValues(): FormValues {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    message: 'This is a test message that is long enough',
    subscribe: true,
  }
}

// ─── i18n Form ──────────────────────────────────────────────────────────────

export function createI18nForm(): { fields: FormField[] } {
  return {
    fields: [
      makeField({
        key: 'name',
        type: 'SHORT_TEXT',
        required: true,
        label: 'Name',
        config: { minLength: 1 },
        i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
      } as any),
      makeField({
        key: 'email',
        type: 'EMAIL',
        required: true,
        label: 'Email',
        i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
      } as any),
    ],
  }
}

// ─── Permissions Form ───────────────────────────────────────────────────────

export function createPermissionsForm(): { fields: FormField[] } {
  return {
    fields: [
      makeField({
        key: 'public_name',
        type: 'SHORT_TEXT',
        required: true,
        config: { minLength: 1 },
        permissions: [
          { role: 'admin', level: 'editable' },
          { role: 'user', level: 'editable' },
        ],
      } as any),
      makeField({
        key: 'secret_code',
        type: 'SHORT_TEXT',
        required: false,
        permissions: [
          { role: 'admin', level: 'editable' },
          { role: 'user', level: 'hidden' },
        ],
      } as any),
      makeField({
        key: 'readonly_field',
        type: 'SHORT_TEXT',
        required: false,
        permissions: [
          { role: 'admin', level: 'editable' },
          { role: 'user', level: 'readonly' },
        ],
      } as any),
    ],
  }
}
