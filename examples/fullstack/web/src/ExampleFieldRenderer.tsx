import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FormValues, SelectFieldConfig } from '@dmc-98/dfe-core'
import type { FieldRendererProps } from '@dmc-98/dfe-react'
import { useDynamicOptions } from '@dmc-98/dfe-react'

interface ExampleFieldRendererProps extends FieldRendererProps {
  apiBaseUrl: string
  values: FormValues
}

function ExampleFallbackFieldRenderer({ field, value, onChange, error }: FieldRendererProps): React.ReactElement {
  const inputId = useId().replace(/:/g, '')

  if (field.type === 'SECTION_BREAK') {
    return (
      <div data-dfe-section>
        <h3>{field.label}</h3>
        {field.description && <p>{field.description}</p>}
        <hr />
      </div>
    )
  }

  const renderInput = () => {
    switch (field.type) {
      case 'SHORT_TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
      case 'PASSWORD':
        return (
          <input
            id={inputId}
            type={field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' ? 'tel' : field.type === 'URL' ? 'url' : field.type === 'PASSWORD' ? 'password' : 'text'}
            value={(value as string) ?? ''}
            onChange={event => onChange(event.target.value)}
            required={field.required}
            aria-invalid={!!error}
          />
        )

      case 'LONG_TEXT':
        return (
          <textarea
            id={inputId}
            value={(value as string) ?? ''}
            onChange={event => onChange(event.target.value)}
            required={field.required}
            rows={4}
            aria-invalid={!!error}
          />
        )

      case 'NUMBER':
        return (
          <input
            id={inputId}
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={event => onChange(event.target.value ? Number(event.target.value) : undefined)}
            required={field.required}
            aria-invalid={!!error}
          />
        )

      case 'DATE':
      case 'TIME':
      case 'DATE_TIME':
        return (
          <input
            id={inputId}
            type={field.type === 'DATE' ? 'date' : field.type === 'TIME' ? 'time' : 'datetime-local'}
            value={(value as string) ?? ''}
            onChange={event => onChange(event.target.value)}
            required={field.required}
            aria-invalid={!!error}
          />
        )

      case 'SELECT':
      case 'RADIO': {
        const options = (field.config as SelectFieldConfig | undefined)?.options ?? []
        return (
          <select
            id={inputId}
            value={(value as string) ?? ''}
            onChange={event => onChange(event.target.value)}
            required={field.required}
            aria-invalid={!!error}
          >
            <option value="">Select...</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      }

      case 'CHECKBOX':
        return (
          <input
            id={inputId}
            type="checkbox"
            checked={!!value}
            onChange={event => onChange(event.target.checked)}
            aria-invalid={!!error}
          />
        )

      default:
        return (
          <input
            id={inputId}
            type="text"
            value={(value as string) ?? ''}
            onChange={event => onChange(event.target.value)}
            required={field.required}
            aria-invalid={!!error}
          />
        )
    }
  }

  return (
    <div data-dfe-field={field.key} data-dfe-type={field.type}>
      <label htmlFor={inputId}>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </label>
      {field.description && <p id={`${inputId}-desc`}>{field.description}</p>}
      {renderInput()}
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

function resolveEndpoint(endpoint: string, apiBaseUrl: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }

  return `${apiBaseUrl}${endpoint}`
}

function humanizeFieldKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, letter => letter.toUpperCase())
}

function ExampleDynamicSelectField({
  field,
  value,
  onChange,
  error,
  apiBaseUrl,
  values,
}: ExampleFieldRendererProps): React.ReactElement {
  const inputId = useId().replace(/:/g, '')
  const config = (field.config ?? {}) as SelectFieldConfig
  const dataSource = config.dataSource

  if (!dataSource) {
    return <ExampleFallbackFieldRenderer field={field} value={value} onChange={onChange} error={error} />
  }

  const dependsOnField = dataSource.dependsOnField
  const dependsOnValue = dependsOnField ? values[dependsOnField] : undefined
  const isEnabled = !dependsOnField || Boolean(dependsOnValue)
  const dependencyLabel = dependsOnField ? humanizeFieldKey(dependsOnField) : null
  const endpoint = useMemo(
    () => resolveEndpoint(dataSource.endpoint, apiBaseUrl),
    [apiBaseUrl, dataSource.endpoint],
  )

  const {
    options,
    isLoading,
    error: loadError,
    search,
  } = useDynamicOptions({
    endpoint,
    pageSize: dataSource.pageSize,
    dependsOnParam: dataSource.dependsOnParam,
    dependsOnValue,
    enabled: isEnabled,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const previousDependencyValueRef = useRef(dependsOnValue)

  useEffect(() => {
    if (previousDependencyValueRef.current !== dependsOnValue) {
      previousDependencyValueRef.current = dependsOnValue
      setSearchQuery('')
      onChange('')
    }
  }, [dependsOnValue, onChange])

  const helperText = !isEnabled && dependencyLabel
    ? `Select ${dependencyLabel} first to load ${field.label.toLowerCase()} options.`
    : loadError
      ? `Failed to load options: ${loadError}`
      : field.description

  return (
    <div data-dfe-field={field.key} data-dfe-type={field.type}>
      <label htmlFor={inputId} style={styles.label}>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </label>
      {helperText && (
        <p id={`${inputId}-desc`} style={styles.helper}>
          {helperText}
        </p>
      )}

      {isEnabled && dataSource.searchParam && (
        <input
          aria-label={`${field.label} Search`}
          type="search"
          value={searchQuery}
          onChange={event => {
            const nextQuery = event.target.value
            setSearchQuery(nextQuery)
            search(nextQuery)
          }}
          placeholder={`Search ${field.label.toLowerCase()}`}
          style={styles.searchInput}
        />
      )}

      <select
        id={inputId}
        value={(value as string) ?? ''}
        onChange={event => onChange(event.target.value)}
        required={field.required}
        aria-invalid={!!error}
        aria-describedby={helperText ? `${inputId}-desc` : undefined}
        disabled={!isEnabled || isLoading}
        style={styles.select}
      >
        <option value="">
          {!isEnabled && dependencyLabel
            ? `Select ${dependencyLabel} first`
            : isLoading
              ? 'Loading options...'
              : 'Select...'}
        </option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p role="alert" style={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}

export function ExampleFieldRenderer(props: ExampleFieldRendererProps): React.ReactElement {
  const config = (props.field.config ?? {}) as Partial<SelectFieldConfig>

  if (props.field.type === 'SELECT' && config.mode === 'dynamic') {
    return <ExampleDynamicSelectField {...props} />
  }

  return (
    <ExampleFallbackFieldRenderer
      field={props.field}
      value={props.value}
      onChange={props.onChange}
      error={props.error}
    />
  )
}

const styles: Record<string, React.CSSProperties> = {
  label: {
    display: 'block',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  helper: {
    color: 'var(--dfe-color-text-muted, #475569)',
    fontSize: '0.95rem',
    marginTop: 0,
    marginBottom: '0.75rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.65rem 0.75rem',
    marginBottom: '0.75rem',
    border: '1px solid var(--dfe-color-border, #cbd5e1)',
    borderRadius: 'var(--dfe-radius-md, 0.75rem)',
    fontSize: '0.95rem',
    color: 'var(--dfe-color-text, #0f172a)',
    background: 'var(--dfe-color-surface, #ffffff)',
  },
  select: {
    width: '100%',
    padding: '0.75rem 0.875rem',
    border: '1px solid var(--dfe-color-border, #cbd5e1)',
    borderRadius: 'var(--dfe-radius-md, 0.75rem)',
    fontSize: '1rem',
    background: 'var(--dfe-color-surface, #ffffff)',
    color: 'var(--dfe-color-text, #0f172a)',
  },
  error: {
    color: 'var(--dfe-color-error, #b91c1c)',
    marginTop: '0.5rem',
  },
}
