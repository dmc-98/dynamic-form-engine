import React from 'react'
import type { FormField, SelectOption } from '@dmc--98/dfe-core'

export interface FieldRendererProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string | null
}

export interface DateRangeFieldValue {
  from?: string
  to?: string
}

export interface AddressFieldValue {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface FileUploadValueItem {
  name?: string
  size?: number
  type?: string
  url?: string
}

export interface FieldRenderModel {
  field: FormField
  value: unknown
  error?: string | null
  id: string
  labelId: string
  descriptionId?: string
  errorId?: string
  describedBy?: string
  isInvalid: boolean
  options: SelectOption[]
  placeholder?: string
  inputType: string
  controlProps: {
    id: string
    required: boolean
    'aria-invalid': boolean
    'aria-describedby'?: string
    'data-dfe-control': true
  }
}

export interface DfeFieldShellProps {
  model: FieldRenderModel
  children: React.ReactNode
  className?: string
  labelFor?: string | null
}

export function getFieldInputType(field: FormField): string {
  switch (field.type) {
    case 'EMAIL':
      return 'email'
    case 'PHONE':
      return 'tel'
    case 'URL':
      return 'url'
    case 'PASSWORD':
      return 'password'
    case 'DATE':
      return 'date'
    case 'TIME':
      return 'time'
    case 'DATE_TIME':
      return 'datetime-local'
    case 'NUMBER':
      return 'number'
    default:
      return 'text'
  }
}

export function getFieldPlaceholder(field: FormField): string | undefined {
  const config = field.config as { placeholder?: string } | undefined
  return config?.placeholder
}

export function getFieldOptions(field: FormField): SelectOption[] {
  const config = field.config as { options?: SelectOption[] } | undefined
  return config?.options ?? []
}

export function getTextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

export function getBooleanValue(value: unknown): boolean {
  return Boolean(value)
}

export function getStringArrayValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item))
  }

  if (value === null || value === undefined || value === '') {
    return []
  }

  return [String(value)]
}

export function getDateRangeValue(value: unknown): DateRangeFieldValue {
  if (!value || typeof value !== 'object') {
    return { from: '', to: '' }
  }

  const range = value as DateRangeFieldValue
  return {
    from: typeof range.from === 'string' ? range.from : '',
    to: typeof range.to === 'string' ? range.to : '',
  }
}

export function getAddressValue(value: unknown): AddressFieldValue {
  const emptyValue: AddressFieldValue = {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  }

  if (!value || typeof value !== 'object') {
    return emptyValue
  }

  const address = value as AddressFieldValue
  return {
    street: typeof address.street === 'string' ? address.street : '',
    city: typeof address.city === 'string' ? address.city : '',
    state: typeof address.state === 'string' ? address.state : '',
    zip: typeof address.zip === 'string' ? address.zip : '',
    country: typeof address.country === 'string' ? address.country : '',
  }
}

export function getFileUploadValue(value: unknown): FileUploadValueItem[] {
  const items = Array.isArray(value) ? value : value ? [value] : []

  return items.map(item => {
    if (typeof item === 'string') {
      return { name: item }
    }

    if (item && typeof item === 'object') {
      const fileLike = item as FileUploadValueItem
      return {
        name: typeof fileLike.name === 'string' ? fileLike.name : undefined,
        size: typeof fileLike.size === 'number' ? fileLike.size : undefined,
        type: typeof fileLike.type === 'string' ? fileLike.type : undefined,
        url: typeof fileLike.url === 'string' ? fileLike.url : undefined,
      }
    }

    return { name: String(item) }
  })
}

export function createFieldRenderModel(props: FieldRendererProps): FieldRenderModel {
  const id = `dfe-field-${props.field.key}`
  const labelId = `${id}-label`
  const descriptionId = props.field.description ? `${id}-desc` : undefined
  const errorId = props.error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return {
    field: props.field,
    value: props.value,
    error: props.error,
    id,
    labelId,
    descriptionId,
    errorId,
    describedBy,
    isInvalid: Boolean(props.error),
    options: getFieldOptions(props.field),
    placeholder: getFieldPlaceholder(props.field),
    inputType: getFieldInputType(props.field),
    controlProps: {
      id,
      required: props.field.required,
      'aria-invalid': Boolean(props.error),
      'aria-describedby': describedBy,
      'data-dfe-control': true,
    },
  }
}

export function DfeFieldShell({
  model,
  children,
  className,
  labelFor,
}: DfeFieldShellProps): React.ReactElement {
  const labelContent = (
    <>
      {model.field.label}
      {model.field.required && <span aria-hidden="true"> *</span>}
    </>
  )

  return (
    <div
      className={className}
      data-dfe-field={model.field.key}
      data-dfe-type={model.field.type}
      data-dfe-invalid={model.isInvalid ? 'true' : undefined}
      style={{
        display: 'grid',
        gap: 'var(--dfe-space-sm, 0.625rem)',
      }}
    >
      {labelFor === null ? (
        <div
          id={model.labelId}
          data-dfe-label
          style={{
            color: 'var(--dfe-color-text, #0f172a)',
            fontSize: 'var(--dfe-label-size, 0.95rem)',
            fontWeight: 600,
          }}
        >
          {labelContent}
        </div>
      ) : (
        <label
          id={model.labelId}
          htmlFor={labelFor ?? model.id}
          data-dfe-label
          style={{
            color: 'var(--dfe-color-text, #0f172a)',
            fontSize: 'var(--dfe-label-size, 0.95rem)',
            fontWeight: 600,
          }}
        >
          {labelContent}
        </label>
      )}
      {model.field.description && (
        <p
          id={model.descriptionId}
          data-dfe-description
          style={{
            margin: 0,
            color: 'var(--dfe-color-text-muted, #475569)',
            fontSize: 'var(--dfe-helper-size, 0.9rem)',
          }}
        >
          {model.field.description}
        </p>
      )}
      {children}
      {model.field.type !== 'SECTION_BREAK' && model.error && (
        <p
          id={model.errorId}
          role="alert"
          data-dfe-error
          style={{
            margin: 0,
            borderRadius: 'var(--dfe-radius-sm, 0.5rem)',
            background: 'var(--dfe-color-error-surface, #fef2f2)',
            color: 'var(--dfe-color-error, #b91c1c)',
            padding: 'var(--dfe-space-xs, 0.375rem) var(--dfe-space-sm, 0.625rem)',
            fontSize: 'var(--dfe-helper-size, 0.9rem)',
          }}
        >
          {model.error}
        </p>
      )}
    </div>
  )
}

const controlStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--dfe-space-sm, 0.625rem) var(--dfe-space-md, 0.875rem)',
  borderRadius: 'var(--dfe-radius-md, 0.75rem)',
  border: '1px solid var(--dfe-color-border, #cbd5e1)',
  background: 'var(--dfe-color-surface, #ffffff)',
  color: 'var(--dfe-color-text, #0f172a)',
  boxShadow: 'var(--dfe-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06))',
  font: 'inherit',
}

const groupStyle: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--dfe-space-sm, 0.625rem)',
}

function renderLayoutField(field: FormField): React.ReactElement {
  if (field.type === 'SECTION_BREAK') {
    return (
      <div data-dfe-section>
        <h3 style={{ marginBottom: 'var(--dfe-space-xs, 0.375rem)' }}>{field.label}</h3>
        {field.description && <p data-dfe-description>{field.description}</p>}
        <hr />
      </div>
    )
  }

  return (
    <section
      data-dfe-field-group={field.key}
      style={{
        border: '1px solid var(--dfe-color-border, #cbd5e1)',
        borderRadius: 'var(--dfe-radius-lg, 1.25rem)',
        background: 'var(--dfe-color-surface, #ffffff)',
        padding: 'var(--dfe-space-lg, 1.25rem)',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 'var(--dfe-space-xs, 0.375rem)' }}>{field.label}</h3>
      {field.description && <p data-dfe-description>{field.description}</p>}
    </section>
  )
}

function renderRadioLikeButtons(
  field: FormField,
  value: unknown,
  onChange: (value: unknown) => void,
  isInvalid: boolean,
  describedBy?: string
): React.ReactElement {
  const options = (field.config as { options?: Array<{ label: string; value: string }> } | undefined)?.options ?? []

  return (
    <div
      role="radiogroup"
      aria-invalid={isInvalid}
      aria-describedby={describedBy}
      style={groupStyle}
    >
      {options.map(option => {
        const isSelected = value === option.value

        return (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--dfe-space-sm, 0.625rem)',
            }}
          >
            <input
              type="radio"
              name={field.key}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              data-dfe-control
              style={{ accentColor: 'var(--dfe-color-primary, #0f766e)' }}
            />
            <span>{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}

function renderRatingField(
  field: FormField,
  value: unknown,
  onChange: (value: unknown) => void,
  isInvalid: boolean,
  describedBy?: string
): React.ReactElement {
  const config = field.config as { max?: number } | undefined
  const max = Math.max(1, config?.max ?? 5)

  return (
    <div
      role="radiogroup"
      aria-invalid={isInvalid}
      aria-describedby={describedBy}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
    >
      {Array.from({ length: max }, (_, index) => {
        const score = index + 1
        const selected = Number(value) === score

        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            data-dfe-control
            aria-pressed={selected}
            style={{
              ...controlStyle,
              width: '3rem',
              padding: '0.55rem',
              textAlign: 'center',
              border: selected
                ? '1px solid var(--dfe-color-primary, #0f766e)'
                : '1px solid var(--dfe-color-border, #cbd5e1)',
              background: selected ? 'var(--dfe-color-surface-muted, #eef2ff)' : controlStyle.background,
            }}
          >
            {score}
          </button>
        )
      })}
    </div>
  )
}

export function DefaultFieldRenderer(props: FieldRendererProps): React.ReactElement {
  const { field, value, onChange } = props
  const model = createFieldRenderModel(props)
  const usesGroupedControls = [
    'DATE_RANGE',
    'RADIO',
    'FILE_UPLOAD',
    'RATING',
    'SCALE',
    'ADDRESS',
  ].includes(field.type)

  if (field.type === 'SECTION_BREAK' || field.type === 'FIELD_GROUP') {
    return renderLayoutField(field)
  }

  if (field.type === 'HIDDEN') {
    return <input id={model.id} type="hidden" value={getTextValue(value)} />
  }

  const renderControl = (): React.ReactElement => {
    switch (field.type) {
      case 'SHORT_TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
      case 'PASSWORD':
        return (
          <input
            {...model.controlProps}
            type={model.inputType}
            value={getTextValue(value)}
            onChange={event => onChange(event.target.value)}
            placeholder={model.placeholder}
            style={controlStyle}
          />
        )

      case 'LONG_TEXT':
      case 'RICH_TEXT':
      case 'SIGNATURE':
        return (
          <textarea
            {...model.controlProps}
            value={getTextValue(value)}
            onChange={event => onChange(event.target.value)}
            placeholder={model.placeholder ?? (field.type === 'SIGNATURE' ? 'Paste signature data or draw with a custom renderer' : undefined)}
            rows={field.type === 'LONG_TEXT' ? 4 : 6}
            spellCheck={field.type !== 'SIGNATURE'}
            style={controlStyle}
          />
        )

      case 'NUMBER':
        return (
          <input
            {...model.controlProps}
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={event => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
            style={controlStyle}
          />
        )

      case 'DATE':
      case 'TIME':
      case 'DATE_TIME':
        return (
          <input
            {...model.controlProps}
            type={model.inputType}
            value={getTextValue(value)}
            onChange={event => onChange(event.target.value)}
            style={controlStyle}
          />
        )

      case 'DATE_RANGE': {
        const range = getDateRangeValue(value)

        return (
          <div
            role="group"
            aria-labelledby={model.labelId}
            aria-describedby={model.describedBy}
            style={{
              display: 'grid',
              gap: 'var(--dfe-space-sm, 0.625rem)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            <input
              id={model.id}
              type="date"
              value={range.from ?? ''}
              onChange={event => onChange({ ...range, from: event.target.value })}
              aria-invalid={model.isInvalid}
              data-dfe-control
              style={controlStyle}
            />
            <input
              type="date"
              value={range.to ?? ''}
              onChange={event => onChange({ ...range, to: event.target.value })}
              aria-invalid={model.isInvalid}
              aria-describedby={model.describedBy}
              data-dfe-control
              style={controlStyle}
            />
          </div>
        )
      }

      case 'SELECT':
        return (
          <select
            {...model.controlProps}
            value={getTextValue(value)}
            onChange={event => onChange(event.target.value)}
            style={controlStyle}
          >
            <option value="">{model.placeholder ?? 'Select an option'}</option>
            {model.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'MULTI_SELECT':
        return (
          <select
            {...model.controlProps}
            multiple
            value={getStringArrayValue(value)}
            onChange={event =>
              onChange(
                Array.from(event.target.selectedOptions).map(option => option.value)
              )
            }
            style={{ ...controlStyle, minHeight: '8rem' }}
          >
            {model.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'RADIO':
        return renderRadioLikeButtons(field, value, onChange, model.isInvalid, model.describedBy)

      case 'CHECKBOX':
        return (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--dfe-space-sm, 0.625rem)',
            }}
          >
            <input
              {...model.controlProps}
              type="checkbox"
              checked={getBooleanValue(value)}
              onChange={event => onChange(event.target.checked)}
              style={{
                width: '1.1rem',
                height: '1.1rem',
                accentColor: 'var(--dfe-color-primary, #0f766e)',
              }}
            />
            <span>{getBooleanValue(value) ? 'Selected' : 'Select this option'}</span>
          </label>
        )

      case 'FILE_UPLOAD': {
        const config = field.config as { maxFiles?: number } | undefined
        const files = getFileUploadValue(value)

        return (
          <div style={groupStyle}>
            <input
              {...model.controlProps}
              type="file"
              multiple={!config?.maxFiles || config.maxFiles > 1}
              onChange={event => onChange(Array.from(event.target.files ?? []))}
              style={controlStyle}
            />
            {files.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {files.map(file => (
                  <li key={`${file.name ?? 'file'}-${file.size ?? 0}`}>
                    {file.name ?? 'Unnamed file'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      }

      case 'RATING':
        return renderRatingField(field, value, onChange, model.isInvalid, model.describedBy)

      case 'SCALE': {
        const config = field.config as { min?: number; max?: number; minLabel?: string; maxLabel?: string } | undefined
        const min = config?.min ?? 0
        const max = config?.max ?? 10
        const currentValue = typeof value === 'number' ? value : min

        return (
          <div style={groupStyle}>
            <input
              {...model.controlProps}
              type="range"
              min={min}
              max={max}
              value={currentValue}
              onChange={event => onChange(Number(event.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--dfe-color-text-muted, #475569)',
                fontSize: 'var(--dfe-helper-size, 0.9rem)',
              }}
            >
              <span>{config?.minLabel ?? min}</span>
              <strong>{currentValue}</strong>
              <span>{config?.maxLabel ?? max}</span>
            </div>
          </div>
        )
      }

      case 'ADDRESS': {
        const address = getAddressValue(value)
        const updateAddress = (key: keyof typeof address, nextValue: string) =>
          onChange({ ...address, [key]: nextValue })

        return (
          <div
            role="group"
            aria-labelledby={model.labelId}
            aria-describedby={model.describedBy}
            style={{
              display: 'grid',
              gap: 'var(--dfe-space-sm, 0.625rem)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            <input
              id={model.id}
              type="text"
              value={address.street ?? ''}
              onChange={event => updateAddress('street', event.target.value)}
              placeholder="Street"
              aria-invalid={model.isInvalid}
              data-dfe-control
              style={controlStyle}
            />
            <input
              type="text"
              value={address.city ?? ''}
              onChange={event => updateAddress('city', event.target.value)}
              placeholder="City"
              aria-invalid={model.isInvalid}
              aria-describedby={model.describedBy}
              data-dfe-control
              style={controlStyle}
            />
            <input
              type="text"
              value={address.state ?? ''}
              onChange={event => updateAddress('state', event.target.value)}
              placeholder="State"
              aria-invalid={model.isInvalid}
              data-dfe-control
              style={controlStyle}
            />
            <input
              type="text"
              value={address.zip ?? ''}
              onChange={event => updateAddress('zip', event.target.value)}
              placeholder="ZIP / Postal code"
              aria-invalid={model.isInvalid}
              data-dfe-control
              style={controlStyle}
            />
            <input
              type="text"
              value={address.country ?? ''}
              onChange={event => updateAddress('country', event.target.value)}
              placeholder="Country"
              aria-invalid={model.isInvalid}
              data-dfe-control
              style={controlStyle}
            />
          </div>
        )
      }

      default:
        return (
          <input
            {...model.controlProps}
            type="text"
            value={getTextValue(value)}
            onChange={event => onChange(event.target.value)}
            placeholder={model.placeholder}
            style={controlStyle}
          />
        )
    }
  }

  return (
    <DfeFieldShell model={model} labelFor={usesGroupedControls ? null : undefined}>
      {renderControl()}
    </DfeFieldShell>
  )
}
