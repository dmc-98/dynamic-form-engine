import React from 'react'
import type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core'

export interface DfeMantineFormPreviewProps {
  fields: FormField[]
  values: FormValues
  steps?: StepNodeState[]
  className?: string
}

/**
 * Styled read-only form preview using Mantine design patterns.
 */
export function DfeMantineFormPreview({
  fields,
  values,
  steps,
  className,
}: DfeMantineFormPreviewProps): React.ReactElement {
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
      style={{
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #dee2e6',
        backgroundColor: '#f8f9fa',
      }}
      data-dfe-preview-field={field.key}
    >
      <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
        {field.label}
      </div>
      <div style={{ fontSize: '14px', color: '#868e96' }}>
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
              style={{ marginBottom: '32px' }}
              data-dfe-preview-step={stepNode.step.id}
            >
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                  {stepNode.step.title}
                </h2>
                {stepNode.step.description && (
                  <p style={{ fontSize: '14px', color: '#868e96', margin: 0 }}>
                    {stepNode.step.description}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {fields.map(renderField)}
      </div>
    </div>
  )
}
