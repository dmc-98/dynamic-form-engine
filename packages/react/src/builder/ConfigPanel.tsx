import React, { useCallback } from 'react'
import type {
  FormField, FieldType, FieldConfig,
  SelectFieldConfig, DynamicDataSource,
  TextFieldConfig, NumberFieldConfig,
  FileUploadConfig, RatingConfig, ScaleConfig,
} from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConfigPanelProps {
  /** The field being configured */
  field: FormField
  /** Callback when field properties change */
  onChange: (updates: Partial<FormField>) => void
  /** Available field types (subset can be passed for restricted builders) */
  allowedTypes?: FieldType[]
  /** Class name for the container */
  className?: string
}

// ─── All Field Types ────────────────────────────────────────────────────────

const ALL_FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'SHORT_TEXT', label: 'Short Text' },
  { value: 'LONG_TEXT', label: 'Long Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'DATE', label: 'Date' },
  { value: 'DATE_RANGE', label: 'Date Range' },
  { value: 'TIME', label: 'Time' },
  { value: 'DATE_TIME', label: 'Date & Time' },
  { value: 'SELECT', label: 'Dropdown' },
  { value: 'MULTI_SELECT', label: 'Multi-Select' },
  { value: 'RADIO', label: 'Radio Group' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'FILE_UPLOAD', label: 'File Upload' },
  { value: 'RATING', label: 'Rating' },
  { value: 'SCALE', label: 'Scale' },
  { value: 'URL', label: 'URL' },
  { value: 'PASSWORD', label: 'Password' },
  { value: 'HIDDEN', label: 'Hidden' },
  { value: 'SECTION_BREAK', label: 'Section Break' },
  { value: 'FIELD_GROUP', label: 'Field Group' },
]

// ─── Sub-Panels ─────────────────────────────────────────────────────────────

interface BasicsPanelProps {
  field: FormField
  onChange: (updates: Partial<FormField>) => void
  allowedTypes: { value: FieldType; label: string }[]
}

function BasicsPanel({ field, onChange, allowedTypes }: BasicsPanelProps) {
  return (
    <div data-dfe-builder-basics>
      <div data-dfe-builder-field>
        <label htmlFor="field-label">Label</label>
        <input
          id="field-label"
          type="text"
          value={field.label}
          onChange={e => onChange({ label: e.target.value })}
        />
      </div>

      <div data-dfe-builder-field>
        <label htmlFor="field-key">Field key</label>
        <small>Unique identifier used in form values</small>
        <input
          id="field-key"
          type="text"
          value={field.key}
          onChange={e => onChange({ key: e.target.value })}
        />
      </div>

      <div data-dfe-builder-field>
        <label htmlFor="field-type">Field type</label>
        <select
          id="field-type"
          value={field.type}
          onChange={e => onChange({ type: e.target.value as FieldType })}
        >
          {allowedTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div data-dfe-builder-field>
        <label htmlFor="field-description">Description</label>
        <textarea
          id="field-description"
          value={field.description ?? ''}
          onChange={e => onChange({ description: e.target.value || null })}
          rows={2}
        />
      </div>

      <label data-dfe-builder-checkbox>
        <input
          type="checkbox"
          checked={field.required}
          onChange={e => onChange({ required: e.target.checked })}
        />
        Required
      </label>

      {/*
        NOTE: No "Model Binding" section here.
        Field-to-API mapping is configured at the STEP level via StepConfigPanel's
        "Request Body Mapping" — that is the single source of truth.
      */}
    </div>
  )
}

// ─── Text Config ────────────────────────────────────────────────────────────

interface TextConfigPanelProps {
  config: TextFieldConfig
  onChange: (config: TextFieldConfig) => void
}

function TextConfigPanel({ config, onChange }: TextConfigPanelProps) {
  return (
    <div data-dfe-builder-type-config>
      <div data-dfe-builder-field>
        <label htmlFor="text-placeholder">Placeholder</label>
        <input
          id="text-placeholder"
          type="text"
          value={config.placeholder ?? ''}
          onChange={e => onChange({ ...config, placeholder: e.target.value || undefined })}
        />
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="text-min">Min length</label>
        <input
          id="text-min"
          type="number"
          value={config.minLength ?? ''}
          onChange={e => onChange({ ...config, minLength: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="text-max">Max length</label>
        <input
          id="text-max"
          type="number"
          value={config.maxLength ?? ''}
          onChange={e => onChange({ ...config, maxLength: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="text-pattern">Validation pattern (regex)</label>
        <input
          id="text-pattern"
          type="text"
          value={config.pattern ?? ''}
          onChange={e => onChange({ ...config, pattern: e.target.value || undefined })}
          placeholder="e.g., ^[A-Z]{2,3}$"
        />
      </div>
    </div>
  )
}

// ─── Number Config ──────────────────────────────────────────────────────────

interface NumberConfigPanelProps {
  config: NumberFieldConfig
  onChange: (config: NumberFieldConfig) => void
}

function NumberConfigPanel({ config, onChange }: NumberConfigPanelProps) {
  return (
    <div data-dfe-builder-type-config>
      <div data-dfe-builder-field>
        <label htmlFor="num-min">Minimum</label>
        <input
          id="num-min"
          type="number"
          value={config.min ?? ''}
          onChange={e => onChange({ ...config, min: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="num-max">Maximum</label>
        <input
          id="num-max"
          type="number"
          value={config.max ?? ''}
          onChange={e => onChange({ ...config, max: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="num-format">Format</label>
        <select
          id="num-format"
          value={config.format ?? 'decimal'}
          onChange={e => onChange({ ...config, format: e.target.value as NumberFieldConfig['format'] })}
        >
          <option value="integer">Integer</option>
          <option value="decimal">Decimal</option>
          <option value="currency">Currency</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>
    </div>
  )
}

// ─── Select Config (API-centric labels) ─────────────────────────────────────

interface SelectConfigPanelProps {
  config: SelectFieldConfig
  onChange: (config: SelectFieldConfig) => void
}

function SelectConfigPanel({ config, onChange }: SelectConfigPanelProps) {
  const dataSource = config.dataSource

  const updateDataSource = (partial: Partial<DynamicDataSource>) => {
    onChange({
      ...config,
      dataSource: {
        ...(dataSource ?? {
          endpoint: '',
          cursorParam: 'cursor',
          pageSize: 20,
          labelKey: 'label',
          valueKey: 'value',
        }),
        ...partial,
      } as DynamicDataSource,
    })
  }

  return (
    <div data-dfe-builder-type-config>
      <div data-dfe-builder-field>
        <label htmlFor="select-mode">Data source</label>
        <select
          id="select-mode"
          value={config.mode}
          onChange={e => onChange({ ...config, mode: e.target.value as 'static' | 'dynamic' })}
        >
          <option value="static">Static options</option>
          <option value="dynamic">Dynamic (API-backed)</option>
        </select>
      </div>

      {config.mode === 'static' && (
        <div data-dfe-builder-section>
          <h4>Options</h4>
          {(config.options ?? []).map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={opt.label}
                onChange={e => {
                  const updated = [...(config.options ?? [])]
                  updated[i] = { ...opt, label: e.target.value }
                  onChange({ ...config, options: updated })
                }}
                placeholder="Label"
                aria-label="Option label"
              />
              <input
                type="text"
                value={opt.value}
                onChange={e => {
                  const updated = [...(config.options ?? [])]
                  updated[i] = { ...opt, value: e.target.value }
                  onChange({ ...config, options: updated })
                }}
                placeholder="Value"
                aria-label="Option value"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = (config.options ?? []).filter((_, j) => j !== i)
                  onChange({ ...config, options: updated })
                }}
                aria-label="Remove option"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              onChange({
                ...config,
                options: [...(config.options ?? []), { label: '', value: '' }],
              })
            }}
          >
            + Add option
          </button>
        </div>
      )}

      {config.mode === 'dynamic' && dataSource && (
        <div data-dfe-builder-section>
          <h4>Dynamic Data Source</h4>

          <div data-dfe-builder-field>
            <label htmlFor="ds-resource">Resource name</label>
            <small>Internal identifier for the API resource</small>
            <input
              id="ds-resource"
              type="text"
              value={dataSource.endpoint}
              onChange={e => updateDataSource({ endpoint: e.target.value })}
              placeholder="/api/fields/:id/options"
            />
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-label-key">Display field</label>
            <small>API response field to show as label (use + to combine, e.g., "firstName + lastName")</small>
            <input
              id="ds-label-key"
              type="text"
              value={dataSource.labelKey}
              onChange={e => updateDataSource({ labelKey: e.target.value })}
              placeholder="name"
            />
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-value-key">ID field</label>
            <small>API response field to use as value</small>
            <input
              id="ds-value-key"
              type="text"
              value={dataSource.valueKey}
              onChange={e => updateDataSource({ valueKey: e.target.value })}
              placeholder="id"
            />
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-page-size">Page size</label>
            <input
              id="ds-page-size"
              type="number"
              value={dataSource.pageSize}
              onChange={e => updateDataSource({ pageSize: Number(e.target.value) || 20 })}
            />
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-depends-on">Depends on field</label>
            <small>Field key for cascading dropdown (parent field)</small>
            <input
              id="ds-depends-on"
              type="text"
              value={dataSource.dependsOnField ?? ''}
              onChange={e => updateDataSource({ dependsOnField: e.target.value || undefined })}
              placeholder="countryId"
            />
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="ds-depends-param">Dependency parameter</label>
            <small>Query parameter name sent to the API</small>
            <input
              id="ds-depends-param"
              type="text"
              value={dataSource.dependsOnParam ?? ''}
              onChange={e => updateDataSource({ dependsOnParam: e.target.value || undefined })}
              placeholder="countryId"
            />
          </div>
        </div>
      )}

      <label data-dfe-builder-checkbox>
        <input
          type="checkbox"
          checked={config.allowOther ?? false}
          onChange={e => onChange({ ...config, allowOther: e.target.checked })}
        />
        Allow "Other" option
      </label>
    </div>
  )
}

// ─── File Upload Config ─────────────────────────────────────────────────────

interface FileUploadConfigPanelProps {
  config: FileUploadConfig
  onChange: (config: FileUploadConfig) => void
}

function FileUploadConfigPanel({ config, onChange }: FileUploadConfigPanelProps) {
  return (
    <div data-dfe-builder-type-config>
      <div data-dfe-builder-field>
        <label htmlFor="file-max-size">Max size (MB)</label>
        <input
          id="file-max-size"
          type="number"
          value={config.maxSizeMB ?? ''}
          onChange={e => onChange({ ...config, maxSizeMB: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="file-max-files">Max files</label>
        <input
          id="file-max-files"
          type="number"
          value={config.maxFiles ?? ''}
          onChange={e => onChange({ ...config, maxFiles: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <div data-dfe-builder-field>
        <label htmlFor="file-types">Allowed MIME types</label>
        <small>Comma-separated, e.g., image/png, application/pdf</small>
        <input
          id="file-types"
          type="text"
          value={(config.allowedMimeTypes ?? []).join(', ')}
          onChange={e => onChange({
            ...config,
            allowedMimeTypes: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined,
          })}
        />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

/**
 * Builder panel for configuring a single form field.
 *
 * Renders a "Basics" section (label, key, type, required) and a
 * type-specific configuration panel.
 *
 * **Intentionally omits field-level "Model Binding"** — the step-level
 * StepConfigPanel's "Request Body Mapping" is the single source of truth
 * for mapping field values to API request bodies.
 *
 * For SELECT fields, uses API-centric labels:
 * - "Resource name" (not "Model name")
 * - "Display field" (not "Label key")
 * - "ID field" (not "Value key")
 *
 * @example
 * ```tsx
 * <ConfigPanel
 *   field={selectedField}
 *   onChange={(updates) => updateField(selectedField.id, updates)}
 * />
 * ```
 */
export function ConfigPanel({ field, onChange, allowedTypes, className }: ConfigPanelProps) {
  const types = allowedTypes
    ? ALL_FIELD_TYPES.filter(t => allowedTypes.includes(t.value))
    : ALL_FIELD_TYPES

  const updateConfig = useCallback((config: FieldConfig) => {
    onChange({ config })
  }, [onChange])

  const renderTypeConfig = () => {
    switch (field.type) {
      case 'SHORT_TEXT':
      case 'LONG_TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
      case 'PASSWORD':
        return (
          <TextConfigPanel
            config={field.config as TextFieldConfig}
            onChange={updateConfig}
          />
        )

      case 'NUMBER':
        return (
          <NumberConfigPanel
            config={field.config as NumberFieldConfig}
            onChange={updateConfig}
          />
        )

      case 'SELECT':
      case 'MULTI_SELECT':
      case 'RADIO':
        return (
          <SelectConfigPanel
            config={(field.config as SelectFieldConfig) ?? { mode: 'static', options: [] }}
            onChange={updateConfig}
          />
        )

      case 'FILE_UPLOAD':
        return (
          <FileUploadConfigPanel
            config={field.config as FileUploadConfig}
            onChange={updateConfig}
          />
        )

      case 'RATING':
        return (
          <div data-dfe-builder-type-config>
            <div data-dfe-builder-field>
              <label htmlFor="rating-max">Max rating</label>
              <input
                id="rating-max"
                type="number"
                value={(field.config as RatingConfig).max ?? 5}
                onChange={e => updateConfig({ ...field.config, max: Number(e.target.value) || 5 } as RatingConfig)}
              />
            </div>
          </div>
        )

      case 'SCALE':
        return (
          <div data-dfe-builder-type-config>
            <div data-dfe-builder-field>
              <label htmlFor="scale-min">Min</label>
              <input
                id="scale-min"
                type="number"
                value={(field.config as ScaleConfig).min ?? 1}
                onChange={e => updateConfig({ ...field.config, min: Number(e.target.value) } as ScaleConfig)}
              />
            </div>
            <div data-dfe-builder-field>
              <label htmlFor="scale-max">Max</label>
              <input
                id="scale-max"
                type="number"
                value={(field.config as ScaleConfig).max ?? 10}
                onChange={e => updateConfig({ ...field.config, max: Number(e.target.value) } as ScaleConfig)}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={className} data-dfe-builder-config-panel>
      <BasicsPanel field={field} onChange={onChange} allowedTypes={types} />
      {renderTypeConfig()}
    </div>
  )
}
