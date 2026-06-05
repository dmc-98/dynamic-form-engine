import type { FormField, FormStep, StepApiContract } from '../src/types'

/** Create a minimal field definition for testing */
export function makeField(overrides: Partial<FormField> & { key: string }): FormField {
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
  }
}

/** Create a minimal step definition for testing */
export function makeStep(overrides: Partial<FormStep> & { id: string; title: string }): FormStep {
  return {
    id: overrides.id,
    versionId: overrides.versionId ?? 'v1',
    title: overrides.title,
    order: overrides.order ?? 0,
    conditions: overrides.conditions ?? null,
    config: overrides.config ?? null,
    fields: overrides.fields,
  }
}

/** Create a step API contract for testing */
export function makeApiContract(overrides: Partial<StepApiContract>): StepApiContract {
  return {
    resourceName: overrides.resourceName ?? 'TestResource',
    endpoint: overrides.endpoint ?? '/api/test/{id}',
    method: overrides.method ?? 'PUT',
    fieldMapping: overrides.fieldMapping ?? {},
    responseToContext: overrides.responseToContext,
    contextToBody: overrides.contextToBody,
  }
}
