import React from 'react'
import type { FieldRendererProps } from '@dmc-98/dfe-react'

/**
 * Styled field renderer using shadcn/ui components.
 * Renders all 24 field types with shadcn's design system.
 */
export function ShadcnFieldRenderer({
  field,
  value,
  onChange,
  error,
}: FieldRendererProps): React.ReactElement {
  const id = `dfe-field-${field.key}`
  const showError = !!error

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
            aria-invalid={showError}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            className={`
              w-full px-3 py-2 border rounded-md text-sm
              border-input bg-background placeholder-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors
              ${showError ? 'border-destructive focus:ring-destructive' : ''}
            `}
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
            aria-invalid={showError}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            className={`
              w-full px-3 py-2 border rounded-md text-sm font-mono
              border-input bg-background placeholder-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              resize-none transition-colors
              ${showError ? 'border-destructive focus:ring-destructive' : ''}
            `}
          />
        )
      }

      case 'NUMBER': {
        const config = field.config as any
        return (
          <div className="relative">
            {config?.prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
              aria-invalid={showError}
              aria-describedby={field.description ? `${id}-desc` : undefined}
              className={`
                w-full px-3 py-2 border rounded-md text-sm
                border-input bg-background placeholder-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
                transition-colors
                ${config?.prefix ? 'pl-7' : ''}
                ${config?.suffix ? 'pr-7' : ''}
                ${showError ? 'border-destructive focus:ring-destructive' : ''}
              `}
            />
            {config?.suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
            aria-invalid={showError}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            className={`
              w-full px-3 py-2 border rounded-md text-sm
              border-input bg-background placeholder-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors
              ${showError ? 'border-destructive focus:ring-destructive' : ''}
            `}
          />
        )
      }

      case 'DATE_RANGE': {
        const range = (value as any) ?? {}
        return (
          <div className="flex gap-2">
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
              aria-invalid={showError}
              className={`
                flex-1 px-3 py-2 border rounded-md text-sm
                border-input bg-background placeholder-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
                transition-colors
                ${showError ? 'border-destructive focus:ring-destructive' : ''}
              `}
            />
            <span className="flex items-center text-muted-foreground">→</span>
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
              aria-invalid={showError}
              className={`
                flex-1 px-3 py-2 border rounded-md text-sm
                border-input bg-background placeholder-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
                transition-colors
                ${showError ? 'border-destructive focus:ring-destructive' : ''}
              `}
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
            aria-invalid={showError}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            className={`
              w-full px-3 py-2 border rounded-md text-sm
              border-input bg-background text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors
              ${showError ? 'border-destructive focus:ring-destructive' : ''}
            `}
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
          <div className="space-y-2">
            {options.map((opt: any) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => {
                    const newSelected = e.target.checked
                      ? [...selected, opt.value]
                      : selected.filter((v) => v !== opt.value)
                    onChange(newSelected)
                  }}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        )
      }

      case 'CHECKBOX': {
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id={id}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              aria-invalid={showError}
              aria-describedby={field.description ? `${id}-desc` : undefined}
              className="w-4 h-4 rounded border-input"
            />
            <span className="text-sm font-medium">{field.label}</span>
            {field.required && <span className="text-destructive">*</span>}
          </label>
        )
      }

      case 'RATING': {
        const config = field.config as any
        const max = config?.max ?? 5
        const rating = (value as number) ?? 0

        return (
          <div className="flex gap-1">
            {Array.from({ length: max }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                aria-label={`Rate ${i + 1} out of ${max}`}
                aria-pressed={rating === i + 1}
                className={`
                  text-2xl transition-colors
                  ${rating >= i + 1 ? 'text-yellow-400' : 'text-gray-300'}
                  hover:text-yellow-400
                `}
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
          <div className="space-y-2">
            <input
              id={id}
              type="range"
              min={min}
              max={max}
              value={value ?? min}
              onChange={(e) => onChange(Number(e.target.value))}
              aria-invalid={showError}
              aria-describedby={field.description ? `${id}-desc` : undefined}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{config?.minLabel || min}</span>
              <span className="font-semibold text-foreground">{value ?? min}</span>
              <span>{config?.maxLabel || max}</span>
            </div>
          </div>
        )
      }

      case 'FILE_UPLOAD': {
        const config = field.config as any
        const files = Array.isArray(value) ? value : value ? [value] : []

        return (
          <div className="space-y-2">
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
              aria-invalid={showError}
              aria-describedby={field.description ? `${id}-desc` : undefined}
              className={`
                block w-full text-sm text-muted-foreground
                file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0
                file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
              `}
            />
            {files.length > 0 && (
              <ul className="text-sm space-y-1">
                {files.map((f: any, idx) => (
                  <li key={idx} className="text-muted-foreground">
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
            aria-invalid={showError}
            aria-describedby={field.description ? `${id}-desc` : undefined}
            className={`
              w-full px-3 py-2 border rounded-md text-sm
              border-input bg-background placeholder-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              resize-none transition-colors
              ${showError ? 'border-destructive focus:ring-destructive' : ''}
            `}
          />
        )
      }

      case 'SIGNATURE': {
        const config = field.config as any
        const width = config?.canvasWidth ?? 400
        const height = config?.canvasHeight ?? 100

        return (
          <div className="border rounded-md p-2 bg-muted">
            <canvas
              id={id}
              width={width}
              height={height}
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: config?.backgroundColor ?? 'white',
              }}
              className="w-full max-w-full"
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
              className="mt-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )
      }

      case 'ADDRESS': {
        const addr = (value as any) ?? {}

        return (
          <div className="space-y-2">
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
              className="w-full px-3 py-2 border rounded-md text-sm border-input"
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
              className="w-full px-3 py-2 border rounded-md text-sm border-input"
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
              className="w-full px-3 py-2 border rounded-md text-sm border-input"
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
              className="w-full px-3 py-2 border rounded-md text-sm border-input"
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
              className="w-full px-3 py-2 border rounded-md text-sm border-input"
            />
          </div>
        )
      }

      case 'SECTION_BREAK':
        return <hr className="my-4 border-border" />

      case 'FIELD_GROUP':
      case 'HIDDEN':
      default:
        return null
    }
  }

  if (field.type === 'SECTION_BREAK') {
    return (
      <div className="my-6">
        <h3 className="text-lg font-semibold text-foreground">{field.label}</h3>
        {field.description && (
          <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
        )}
      </div>
    )
  }

  if (field.type === 'FIELD_GROUP' || field.type === 'HIDDEN') {
    return <></>
  }

  return (
    <div className="space-y-2">
      {field.type !== 'CHECKBOX' && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {field.description && field.type !== 'CHECKBOX' && (
        <p
          id={`${id}-desc`}
          className="text-xs text-muted-foreground"
        >
          {field.description}
        </p>
      )}

      {renderInput()}

      {showError && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-sm text-destructive font-medium"
        >
          {error}
        </p>
      )}
    </div>
  )
}
