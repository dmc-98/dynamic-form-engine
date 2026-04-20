import React from 'react'
import type { FieldType } from '@dmc--98/dfe-core'

// ─── Field Type Categories ──────────────────────────────────────────────────

interface FieldTypeGroup {
  category: string
  types: Array<{ type: FieldType; label: string }>
}

const FIELD_TYPE_GROUPS: FieldTypeGroup[] = [
  {
    category: 'Text',
    types: [
      { type: 'SHORT_TEXT', label: 'Short Text' },
      { type: 'LONG_TEXT', label: 'Long Text' },
      { type: 'EMAIL', label: 'Email' },
      { type: 'PHONE', label: 'Phone' },
      { type: 'URL', label: 'URL' },
      { type: 'PASSWORD', label: 'Password' },
      { type: 'RICH_TEXT', label: 'Rich Text' },
    ],
  },
  {
    category: 'Number',
    types: [
      { type: 'NUMBER', label: 'Number' },
      { type: 'RATING', label: 'Rating' },
      { type: 'SCALE', label: 'Scale' },
    ],
  },
  {
    category: 'Date & Time',
    types: [
      { type: 'DATE', label: 'Date' },
      { type: 'DATE_RANGE', label: 'Date Range' },
      { type: 'TIME', label: 'Time' },
      { type: 'DATE_TIME', label: 'Date & Time' },
    ],
  },
  {
    category: 'Selection',
    types: [
      { type: 'SELECT', label: 'Dropdown' },
      { type: 'MULTI_SELECT', label: 'Multi-Select' },
      { type: 'RADIO', label: 'Radio Group' },
      { type: 'CHECKBOX', label: 'Checkbox' },
    ],
  },
  {
    category: 'Media',
    types: [
      { type: 'FILE_UPLOAD', label: 'File Upload' },
      { type: 'SIGNATURE', label: 'Signature' },
    ],
  },
  {
    category: 'Layout',
    types: [
      { type: 'SECTION_BREAK', label: 'Section Break' },
      { type: 'FIELD_GROUP', label: 'Field Group' },
    ],
  },
  {
    category: 'Special',
    types: [
      { type: 'HIDDEN', label: 'Hidden' },
      { type: 'ADDRESS', label: 'Address' },
    ],
  },
]

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FieldPaletteProps {
  /** Callback when a field type is selected for dragging */
  onFieldTypeSelect?: (fieldType: FieldType) => void
  /** Class name for the container */
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Sidebar palette showing all available field types grouped by category.
 * Supports HTML5 drag-and-drop with field types.
 */
export function FieldPalette({ onFieldTypeSelect, className }: FieldPaletteProps): React.ReactElement {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, fieldType: FieldType) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-dfe-field-type', fieldType)
    onFieldTypeSelect?.(fieldType)
  }

  return (
    <div className={className} data-dfe-palette>
      <div data-dfe-palette-header>
        <h3>Field Types</h3>
      </div>

      <div data-dfe-palette-content>
        {FIELD_TYPE_GROUPS.map(group => (
          <div key={group.category} data-dfe-palette-group>
            <h4 data-dfe-palette-group-title>{group.category}</h4>

            <div data-dfe-palette-items>
              {group.types.map(field => (
                <div
                  key={field.type}
                  draggable
                  onDragStart={e => handleDragStart(e, field.type)}
                  data-dfe-palette-item
                  data-dfe-field-type={field.type}
                >
                  {field.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
