import React from 'react'
import type { FormField, FormValues } from '@dmc-98/dfe-core'
import { DefaultFieldRenderer, type FieldRendererProps } from '../renderers'

export interface DfeFormRendererProps {
  fields: FormField[]
  values: FormValues
  onFieldChange: (key: string, value: unknown) => void
  errors?: Record<string, string>
  renderField?: React.ComponentType<FieldRendererProps>
  className?: string
}

export function DfeFormRenderer({
  fields,
  values,
  onFieldChange,
  errors = {},
  renderField,
  className,
}: DfeFormRendererProps): React.ReactElement {
  const Renderer = renderField ?? DefaultFieldRenderer

  return (
    <div className={className} data-dfe-form>
      {fields.map(field => (
        <Renderer
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(nextValue: unknown) => onFieldChange(field.key, nextValue)}
          error={errors[field.key] ?? null}
        />
      ))}
    </div>
  )
}

export { DefaultFieldRenderer } from '../renderers'
export type { FieldRendererProps } from '../renderers'
