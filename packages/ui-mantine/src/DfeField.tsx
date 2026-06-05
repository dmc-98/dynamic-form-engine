import React from 'react'
import type { FieldRendererProps } from '@dmc--98/dfe-react'

/**
 * Styled field renderer using Mantine components.
 * Renders all 24 field types with Mantine's design system.
 */
export function MantineFieldRenderer({
  field,
  value,
  onChange,
  error,
}: FieldRendererProps): React.ReactElement {
  const id = `dfe-field-${field.key}`

  const renderInput = () => {
    switch (field.type) {
      case 'SHORT_TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
      case 'PASSWORD': {
        const inputType =
          field.type === 'EMAIL'
            ? 'email'
            : field.type === 'PHONE'
              ? 'tel'
              : field.type === 'URL'
                ? 'url'
                : field.type === 'PASSWORD'
                  ? 'password'
                  : 'text'

        return (
          <input
            id={id}
            type={inputType}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={(field.config as any)?.placeholder}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            style={{
              padding: '8px 12px',
              border: error ? '1px solid #f76707' : '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#1971c2'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 113, 194, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? '#f76707' : '#ced4da'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        )
      }

      case 'LONG_TEXT': {
        return (
          <textarea
            id={id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={(field.config as any)?.placeholder}
            required={field.required}
            rows={4}
            aria-invalid={!!error}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            style={{
              padding: '8px 12px',
              border: error ? '1px solid #f76707' : '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#1971c2'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 113, 194, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? '#f76707' : '#ced4da'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        )
      }

      case 'NUMBER': {
        const config = field.config as any
        return (
          <div style={{ position: 'relative' }}>
            {config?.prefix && (
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#868e96',
                  fontSize: '14px',
                }}
              >
                {config.prefix}
              </span>
            )}
            <input
              id={id}
              type="number"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : undefined)
              }
              min={config?.min}
              max={config?.max}
              step={config?.step}
              placeholder={(field.config as any)?.placeholder}
              required={field.required}
              aria-invalid={!!error}
              aria-describedby={field.description ? `${id}-desc` : undefined}
              style={{
                padding: `8px ${config?.suffix ? '32px' : '12px'} 8px ${config?.prefix ? '32px' : '12px'}`,
                border: error ? '1px solid #f76707' : '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
                width: '100%',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1971c2'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 113, 194, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#f76707' : '#ced4da'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            {config?.suffix && (
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#868e96',
                  fontSize: '14px',
                }}
              >
                {config.suffix}
              </span>
            )}
          </div>
        )
      }

      case 'DATE':
      case 'TIME':
      case 'DATE_TIME': {
        const inputType =
          field.type === 'DATE'
            ? 'date'
            : field.type === 'TIME'
              ? 'time'
              : 'datetime-local'

        return (
          <input
            id={id}
            type={inputType}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            style={{
              padding: '8px 12px',
              border: error ? '1px solid #f76707' : '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        )
      }

      case 'DATE_RANGE': {
        const range = (value as any) ?? {}
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              id={`${id}-from`}
              type="date"
              value={range.from ?? ''}
              onChange={(e) =>
                onChange({
                  ...range,
                  from: e.target.value || undefined,
                })
              }
              placeholder="From"
              aria-label="Start date"
              aria-invalid={!!error}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: error ? '1px solid #f76707' : '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <span style={{ color: '#868e96' }}>→</span>
            <input
              id={`${id}-to`}
              type="date"
              value={range.to ?? ''}
              onChange={(e) =>
                onChange({
                  ...range,
                  to: e.target.value || undefined,
                })
              }
              placeholder="To"
              aria-label="End date"
              aria-invalid={!!error}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: error ? '1px solid #f76707' : '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        )
      }

      case 'SELECT':
      case 'RADIO': {
        const options = (field.config as any)?.options ?? []
        return (
          <select
            id={id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            style={{
              padding: '8px 12px',
              border: error ? '1px solid #f76707' : '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              width: '100%',
              boxSizing: 'border-box',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23495057' d='M2 4l4 4 4-4z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '32px',
            }}
          >
            <option value="">Select an option...</option>
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      }

      case 'MULTI_SELECT': {
        const options = (field.config as any)?.options ?? []
        const selected = Array.isArray(value) ? value : []

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {options.map((opt: any) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => {
                    const newSelected = e.target.checked
                      ? [...selected, opt.value]
                      : selected.filter((v) => v !== opt.value)
                    onChange(newSelected)
                  }}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '14px' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        )
      }

      case 'CHECKBOX': {
        return (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <input
              id={id}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              aria-invalid={!!error}
              aria-describedby={field.description ? `${id}-desc` : undefined}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {field.label}
            </span>
            {field.required && (
              <span style={{ color: '#f76707', marginLeft: '4px' }}>*</span>
            )}
          </label>
        )
      }

      case 'RATING': {
        const config = field.config as any
        const max = config?.max ?? 5
        const rating = (value as number) ?? 0

        return (
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: max }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                aria-label={`Rate ${i + 1} out of ${max}`}
                aria-pressed={rating === i + 1}
                style={{
                  fontSize: '24px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: rating >= i + 1 ? '#fcc419' : '#ccc',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fcc419'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = rating >= i + 1 ? '#fcc419' : '#ccc'
                }}
              >
                ★
              </button>
            ))}
          </div>
        )
      }

      case 'SCALE': {
        const config = field.config as any
        const min = config?.min ?? 0
        const max = config?.max ?? 10

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              id={id}
              type="range"
              min={min}
              max={max}
              value={value ?? min}
              onChange={(e) => onChange(Number(e.target.value))}
              aria-invalid={!!error}
              aria-describedby={field.description ? `${id}-desc` : undefined}
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#868e96',
              }}
            >
              <span>{config?.minLabel || min}</span>
              <span style={{ fontWeight: 600, color: '#333' }}>
                {value ?? min}
              </span>
              <span>{config?.maxLabel || max}</span>
            </div>
          </div>
        )
      }

      case 'FILE_UPLOAD': {
        const config = field.config as any
        const files = Array.isArray(value) ? value : value ? [value] : []

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              id={id}
              type="file"
              multiple={config?.maxFiles !== 1}
              accept={config?.allowedMimeTypes?.join(',')}
              onChange={(e) => {
                const newFiles = Array.from(e.target.files ?? []).map((f) => ({
                  name: f.name,
                  size: f.size,
                  type: f.type,
                }))
                onChange(newFiles)
              }}
              aria-invalid={!!error}
              aria-describedby={field.description ? `${id}-desc` : undefined}
              style={{
                padding: '8px 12px',
                border: '2px dashed #ced4da',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
            {files.length > 0 && (
              <ul style={{ fontSize: '12px', color: '#868e96', margin: 0, padding: 0 }}>
                {files.map((f: any, idx) => (
                  <li key={idx} style={{ listStyle: 'none' }}>
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      }

      case 'RICH_TEXT': {
        return (
          <textarea
            id={id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={(field.config as any)?.placeholder}
            required={field.required}
            rows={6}
            aria-invalid={!!error}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            style={{
              padding: '8px 12px',
              border: error ? '1px solid #f76707' : '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              resize: 'vertical',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        )
      }

      case 'SIGNATURE': {
        const config = field.config as any
        const width = config?.canvasWidth ?? 400
        const height = config?.canvasHeight ?? 100

        return (
          <div style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}>
            <canvas
              id={id}
              width={width}
              height={height}
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: config?.backgroundColor ?? 'white',
                display: 'block',
                width: '100%',
                maxWidth: '100%',
              }}
            />
            <button
              type="button"
              onClick={() => {
                const canvas = document.getElementById(id) as HTMLCanvasElement
                if (canvas) {
                  const ctx = canvas.getContext('2d')
                  if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    onChange(null)
                  }
                }
              }}
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#868e96',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        )
      }

      case 'ADDRESS': {
        const addr = (value as any) ?? {}

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Street"
              value={addr.street ?? ''}
              onChange={(e) =>
                onChange({
                  ...addr,
                  street: e.target.value,
                })
              }
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              placeholder="City"
              value={addr.city ?? ''}
              onChange={(e) =>
                onChange({
                  ...addr,
                  city: e.target.value,
                })
              }
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              placeholder="State"
              value={addr.state ?? ''}
              onChange={(e) =>
                onChange({
                  ...addr,
                  state: e.target.value,
                })
              }
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              placeholder="ZIP"
              value={addr.zip ?? ''}
              onChange={(e) =>
                onChange({
                  ...addr,
                  zip: e.target.value,
                })
              }
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              placeholder="Country"
              value={addr.country ?? ''}
              onChange={(e) =>
                onChange({
                  ...addr,
                  country: e.target.value,
                })
              }
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        )
      }

      case 'SECTION_BREAK':
        return <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ced4da' }} />

      case 'FIELD_GROUP':
      case 'HIDDEN':
      default:
        return null
    }
  }

  if (field.type === 'SECTION_BREAK') {
    return (
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          {field.label}
        </h3>
        {field.description && (
          <p style={{ fontSize: '14px', color: '#868e96', margin: 0 }}>
            {field.description}
          </p>
        )}
      </div>
    )
  }

  if (field.type === 'FIELD_GROUP' || field.type === 'HIDDEN') {
    return <></>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {field.type !== 'CHECKBOX' && (
        <label htmlFor={id} style={{ fontSize: '14px', fontWeight: 500 }}>
          {field.label}
          {field.required && (
            <span style={{ color: '#f76707', marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}

      {field.description && field.type !== 'CHECKBOX' && (
        <p
          id={`${id}-desc`}
          style={{
            fontSize: '12px',
            color: '#868e96',
            margin: 0,
          }}
        >
          {field.description}
        </p>
      )}

      {renderInput()}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          style={{
            fontSize: '12px',
            color: '#f76707',
            fontWeight: 500,
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
