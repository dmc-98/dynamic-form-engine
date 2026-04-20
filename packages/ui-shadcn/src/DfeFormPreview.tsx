import React from 'react'
import type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core'

export interface DfeShadcnFormPreviewProps {
  fields: FormField[]
  values: FormValues
  steps?: StepNodeState[]
  className?: string
}

/**
 * Styled read-only form preview using shadcn/ui design patterns.
 */
export function DfeShadcnFormPreview({
  fields,
  values,
  steps,
  className,
}: DfeShadcnFormPreviewProps): React.ReactElement {
  function formatValue(field: FormField, value: unknown): string {
    if (value === null || value === undefined) return '—'

    switch (field.type) {
      case 'CHECKBOX':
        return value ? 'Yes' : 'No'

      case 'DATE':
        return value instanceof Date
          ? value.toLocaleDateString()
          : new Date(value as string).toLocaleDateString()

      case 'DATE_TIME':
        return value instanceof Date
          ? value.toLocaleString()
          : new Date(value as string).toLocaleString()

      case 'MULTI_SELECT':
        return Array.isArray(value) ? value.join(', ') : String(value)

      case 'ADDRESS': {
        const addr = value as any
        return addr && typeof addr === 'object'
          ? [addr.street, addr.city, addr.state, addr.zip, addr.country]
              .filter(Boolean)
              .join(', ')
          : String(value)
      }

      default:
        return String(value)
    }
  }

  const renderField = (field: FormField) => (
    <div
      key={field.key}
      className="p-3 rounded-lg border border-input bg-card"
      data-dfe-preview-field={field.key}
    >
      <div className="font-medium text-sm text-foreground">
        {field.label}
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {formatValue(field, values[field.key])}
      </div>
    </div>
  )

  if (steps && steps.length > 0) {
    return (
      <div className={className} data-dfe-form-preview>
        {steps.map((stepNode) => {
          const stepFields = fields.filter((f) => f.stepId === stepNode.step.id)
          if (stepFields.length === 0) return null

          return (
            <section
              key={stepNode.step.id}
              className="mb-8"
              data-dfe-preview-step={stepNode.step.id}
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {stepNode.step.title}
                </h2>
                {stepNode.step.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {stepNode.step.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stepFields.map(renderField)}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div className={className} data-dfe-form-preview>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map(renderField)}
      </div>
    </div>
  )
}
