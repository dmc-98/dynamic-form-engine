import React, { useRef, useState } from 'react'
import type { FormField, FieldType } from '@dmc--98/dfe-core'
import type { BuilderAction } from '../types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FormCanvasProps {
  /** All fields to display */
  fields: FormField[]
  /** Currently selected field ID */
  selectedFieldId: string | null
  /** Callback when field is selected */
  onSelectField: (fieldId: string) => void
  /** Callback when field is dragged to new position */
  onReorderField: (fieldId: string, newOrder: number) => void
  /** Callback when a field type is dropped */
  onDropField: (fieldType: FieldType, order: number) => void
  /** Callback to dispatch builder actions */
  dispatch: React.Dispatch<BuilderAction>
  /** Class name for the container */
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Central canvas area where form fields are displayed and can be reordered.
 * Accepts dropped field types from the palette.
 */
export function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onReorderField,
  onDropField,
  dispatch,
  className,
}: FormCanvasProps): React.ReactElement {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const fieldType = e.dataTransfer.getData('application/x-dfe-field-type') as FieldType
    if (fieldType) {
      const newOrder = fields.length
      onDropField(fieldType, newOrder)
    }
  }

  const handleFieldDragStart = (e: React.DragEvent<HTMLDivElement>, fieldId: string) => {
    setDraggedFieldId(fieldId)
    dispatch({ type: 'SET_DRAGGING', isDragging: true })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-dfe-field-id', fieldId)
  }

  const handleFieldDragEnd = () => {
    setDraggedFieldId(null)
    setDragOverIndex(null)
    dispatch({ type: 'SET_DRAGGING', isDragging: false })
  }

  const handleFieldDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    const fieldId = e.dataTransfer.getData('application/x-dfe-field-id')
    if (fieldId) {
      setDragOverIndex(index)
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleFieldDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    const fieldId = e.dataTransfer.getData('application/x-dfe-field-id')
    if (fieldId) {
      onReorderField(fieldId, index)
    }
    setDragOverIndex(null)
  }

  return (
    <div
      ref={canvasRef}
      className={className}
      data-dfe-canvas
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div data-dfe-canvas-header>
        <h2>Form Fields</h2>
        <small>Drag fields from the left, or reorder here</small>
      </div>

      <div data-dfe-canvas-content>
        {fields.length === 0 ? (
          <div data-dfe-canvas-empty>
            <p>Drag field types from the palette to get started</p>
          </div>
        ) : (
          <div data-dfe-canvas-fields>
            {fields.map((field, index) => (
              <div
                key={field.id}
                data-dfe-canvas-drop-zone
                data-dfe-drop-over={dragOverIndex === index}
                onDragOver={e => handleFieldDragOver(e, index)}
                onDrop={e => handleFieldDrop(e, index)}
              >
                <div
                  draggable
                  onDragStart={e => handleFieldDragStart(e, field.id)}
                  onDragEnd={handleFieldDragEnd}
                  data-dfe-field-card
                  data-dfe-selected={selectedFieldId === field.id}
                  data-dfe-dragging={draggedFieldId === field.id}
                  onClick={() => onSelectField(field.id)}
                >
                  <div data-dfe-field-card-handle>
                    <span data-dfe-handle-icon>≡</span>
                  </div>

                  <div data-dfe-field-card-content>
                    <div data-dfe-field-card-title>
                      {field.label || field.key}
                    </div>
                    <div data-dfe-field-card-meta>
                      <span data-dfe-field-type-badge>{field.type}</span>
                      {field.required && <span data-dfe-required-badge>Required</span>}
                    </div>
                  </div>

                  <div data-dfe-field-card-actions>
                    <button
                      type="button"
                      data-dfe-field-card-remove
                      onClick={e => {
                        e.stopPropagation()
                        dispatch({ type: 'REMOVE_FIELD', fieldId: field.id })
                      }}
                      aria-label="Remove field"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
