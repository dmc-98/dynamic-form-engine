import React from 'react'
import type { FormField, FormValues, FormStep, StepNodeState } from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeFormPreviewProps {
  fields: FormField[]
  values: FormValues
  steps?: StepNodeState[]
  className?: string
  renderValue?: (field: FormField, value: unknown) => React.ReactNode
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function formatValue(field: FormField, value: unknown): string {
  if (value === null || value === undefined) {
    return '—'
  }

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

    case 'TIME':
      return String(value)

    case 'DATE_RANGE': {
      const range = value as { from?: unknown; to?: unknown }
      const from = range?.from
        ? new Date(range.from as string).toLocaleDateString()
        : null
      const to = range?.to ? new Date(range.to as string).toLocaleDateString() : null
      return [from, to].filter(Boolean).join(' → ') || '—'
    }

    case 'MULTI_SELECT': {
      const arr = Array.isArray(value) ? value : [value]
      return arr.length > 0 ? arr.join(', ') : '—'
    }

    case 'FILE_UPLOAD': {
      const files = Array.isArray(value) ? value : [value]
      return files
        .filter((f) => f)
        .map((f: any) => f.name || String(f))
        .join(', ') || '—'
    }

    case 'RATING':
    case 'SCALE':
      return String(value)

    case 'NUMBER': {
      const config = field.config as any
      if (config.format === 'currency' && typeof value === 'number') {
        return `${config.prefix || '$'}${value.toFixed(2)}${config.suffix || ''}`
      }
      if (config.format === 'percentage' && typeof value === 'number') {
        return `${value}%`
      }
      return String(value)
    }

    case 'ADDRESS': {
      const addr = value as any
      if (typeof addr === 'object' && addr) {
        const parts = [
          addr.street,
          addr.city,
          addr.state,
          addr.zip,
          addr.country,
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(', ') : '—'
      }
      return String(value)
    }

    case 'RICH_TEXT':
      // Strip HTML tags for preview
      return String(value).replace(/<[^>]*>/g, '')

    case 'SIGNATURE':
      return value ? '[Signature provided]' : '—'

    default:
      return String(value)
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Read-only form preview component that displays form values in a formatted view.
 * Automatically groups fields by steps if steps are provided.
 * Handles proper formatting for all field types (dates, booleans, multiselects, etc.)
 *
 * @example
 * ```tsx
 * <DfeFormPreview
 *   fields={engine.allFields}
 *   values={engine.values}
 *   steps={stepper.allSteps}
 *   renderValue={(field, value) => (
 *     field.type === 'CHECKBOX' ? (value ? '✓' : '✗') : undefined
 *   )}
 * />
 * ```
 */
export function DfeFormPreview({
  fields,
  values,
  steps,
  className,
  renderValue,
}: DfeFormPreviewProps): React.ReactElement {
  // Group fields by step if steps provided
  const fieldsByStep = steps
    ? new Map(
        steps.map((stepNode) => [
          stepNode.step.id,
          fields.filter((f) => f.stepId === stepNode.step.id),
        ])
      )
    : null

  const renderField = (field: FormField) => {
    const value = values[field.key]
    const displayValue =
      renderValue?.(field, value) ?? formatValue(field, value)

    return (
      <div
        key={field.key}
        data-dfe-preview-field={field.key}
        data-dfe-type={field.type}
        style={{
          padding: 'var(--dfe-space-md, 0.875rem)',
          borderRadius: 'var(--dfe-radius-md, 0.75rem)',
          border: '1px solid var(--dfe-color-border, #cbd5e1)',
          background: 'var(--dfe-color-surface, #ffffff)',
          boxShadow: 'var(--dfe-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06))',
        }}
      >
        <div
          data-dfe-preview-label
          style={{
            marginBottom: 'var(--dfe-space-xs, 0.375rem)',
            color: 'var(--dfe-color-text, #0f172a)',
            fontSize: 'var(--dfe-label-size, 0.95rem)',
            fontWeight: 600,
          }}
        >
          {field.label}
        </div>
        <div
          data-dfe-preview-value
          style={{ color: 'var(--dfe-color-text-muted, #475569)' }}
        >
          {displayValue}
        </div>
      </div>
    )
  }

  if (fieldsByStep && steps && steps.length > 0) {
    return (
      <div className={className} data-dfe-form-preview>
        {steps.map((stepNode) => {
          const stepFields = fieldsByStep.get(stepNode.step.id) ?? []
          if (stepFields.length === 0) return null

          return (
            <section
              key={stepNode.step.id}
              data-dfe-preview-step={stepNode.step.id}
              style={{ marginBottom: 'var(--dfe-space-2xl, 2.5rem)' }}
            >
              <h2
                data-dfe-preview-title
                style={{
                  marginTop: 0,
                  marginBottom: 'var(--dfe-space-md, 0.875rem)',
                  fontSize: 'var(--dfe-title-size, 1.35rem)',
                }}
              >
                {stepNode.step.title}
              </h2>
              {stepNode.step.description && (
                <p data-dfe-description style={{ marginBottom: 'var(--dfe-space-md, 0.875rem)' }}>
                  {stepNode.step.description}
                </p>
              )}
              <div
                data-dfe-preview-grid
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 'var(--dfe-space-lg, 1.25rem)',
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

  // No steps: render all fields in a flat grid
  return (
    <div className={className} data-dfe-form-preview>
      <div
        data-dfe-preview-grid
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--dfe-space-lg, 1.25rem)',
        }}
      >
        {fields.map(renderField)}
      </div>
    </div>
  )
}
