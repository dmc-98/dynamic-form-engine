import React, { useCallback } from 'react'
import type { FormField, FormStep, FieldType } from '@dmc-98/dfe-core'
import type { BuilderAction } from '../types'

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
  { value: 'RICH_TEXT', label: 'Rich Text' },
  { value: 'SIGNATURE', label: 'Signature' },
  { value: 'ADDRESS', label: 'Address' },
]

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PropertyEditorProps {
  /** Selected field to edit, or null */
  selectedField: FormField | null
  /** Selected step to edit, or null */
  selectedStep: FormStep | null
  /** Callback when field is updated */
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void
  /** Callback when step is updated */
  onUpdateStep: (stepId: string, updates: Partial<FormStep>) => void
  /** Class name for the container */
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Right panel for editing properties of selected field or step.
 * Shows type-specific configuration options.
 */
export function PropertyEditor({
  selectedField,
  selectedStep,
  onUpdateField,
  onUpdateStep,
  className,
}: PropertyEditorProps): React.ReactElement {
  const renderFieldEditor = useCallback(() => {
    if (!selectedField) return null

    return (
      <div data-dfe-editor-section>
        <h3>Field Properties</h3>

        <div data-dfe-editor-field>
          <label htmlFor="editor-label">Label</label>
          <input
            id="editor-label"
            type="text"
            value={selectedField.label}
            onChange={e => onUpdateField(selectedField.id, { label: e.target.value })}
          />
        </div>

        <div data-dfe-editor-field>
          <label htmlFor="editor-key">Field Key</label>
          <small>Unique identifier used in form values</small>
          <input
            id="editor-key"
            type="text"
            value={selectedField.key}
            onChange={e => onUpdateField(selectedField.id, { key: e.target.value })}
          />
        </div>

        <div data-dfe-editor-field>
          <label htmlFor="editor-type">Field Type</label>
          <select
            id="editor-type"
            value={selectedField.type}
            onChange={e => onUpdateField(selectedField.id, { type: e.target.value as FieldType })}
          >
            {ALL_FIELD_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div data-dfe-editor-field>
          <label htmlFor="editor-description">Description</label>
          <textarea
            id="editor-description"
            value={selectedField.description ?? ''}
            onChange={e =>
              onUpdateField(selectedField.id, { description: e.target.value || null })
            }
            rows={2}
          />
        </div>

        <label data-dfe-editor-checkbox>
          <input
            type="checkbox"
            checked={selectedField.required}
            onChange={e => onUpdateField(selectedField.id, { required: e.target.checked })}
          />
          Required
        </label>

        <div data-dfe-editor-section>
          <h4>Type-Specific Config</h4>
          <div data-dfe-editor-notice>
            Type-specific configuration (placeholders, options, validation rules, etc.) is stored
            in the field's config object.
          </div>
        </div>
      </div>
    )
  }, [selectedField, onUpdateField])

  const renderStepEditor = useCallback(() => {
    if (!selectedStep) return null

    return (
      <div data-dfe-editor-section>
        <h3>Step Properties</h3>

        <div data-dfe-editor-field>
          <label htmlFor="editor-step-title">Title</label>
          <input
            id="editor-step-title"
            type="text"
            value={selectedStep.title}
            onChange={e => onUpdateStep(selectedStep.id, { title: e.target.value })}
          />
        </div>

        <div data-dfe-editor-field>
          <label htmlFor="editor-step-description">Description</label>
          <textarea
            id="editor-step-description"
            value={selectedStep.description ?? ''}
            onChange={e =>
              onUpdateStep(selectedStep.id, { description: e.target.value || null })
            }
            rows={3}
          />
        </div>

        <div data-dfe-editor-section>
          <h4>API Contracts</h4>
          <div data-dfe-editor-notice>
            Configure API contracts in the step's config.apiContracts array to map field values
            to backend API requests.
          </div>
        </div>

        <div data-dfe-editor-section>
          <h4>Review Configuration</h4>
          <div data-dfe-editor-notice>
            Set config.review to make this a review/summary step with edit capabilities.
          </div>
        </div>
      </div>
    )
  }, [selectedStep, onUpdateStep])

  const renderDefaultView = useCallback(() => {
    return (
      <div data-dfe-editor-section>
        <h3>Form Settings</h3>
        <div data-dfe-editor-notice>
          Select a field or step to edit its properties. Changes are reflected immediately.
        </div>
      </div>
    )
  }, [])

  return (
    <div className={className} data-dfe-editor>
      <div data-dfe-editor-header>
        <h2>Properties</h2>
      </div>

      <div data-dfe-editor-content>
        {selectedField ? renderFieldEditor() : selectedStep ? renderStepEditor() : renderDefaultView()}
      </div>
    </div>
  )
}
