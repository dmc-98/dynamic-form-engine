import * as React from 'react'
import type { FieldType } from '@dmc--98/dfe-core'
import {
  type DndBuilderState,
  type BuilderFormConfig,
  builderReducer,
  createBuilderState,
  toFormConfig,
} from './builder-state'

// ─── FormBuilder ──────────────────────────────────────────────────────────────
// A drag-and-drop visual form builder. Uses native HTML5 drag-and-drop (no extra
// dependency). All logic lives in the headless reducer (builder-state.ts); this
// component is the view + interaction layer.

const PALETTE: Array<{ type: FieldType; label: string }> = [
  { type: 'SHORT_TEXT', label: 'Text' },
  { type: 'LONG_TEXT', label: 'Paragraph' },
  { type: 'NUMBER', label: 'Number' },
  { type: 'EMAIL', label: 'Email' },
  { type: 'PHONE', label: 'Phone' },
  { type: 'DATE', label: 'Date' },
  { type: 'SELECT', label: 'Dropdown' },
  { type: 'MULTI_SELECT', label: 'Multi-select' },
  { type: 'RADIO', label: 'Choice' },
  { type: 'CHECKBOX', label: 'Checkbox' },
  { type: 'FILE_UPLOAD', label: 'File upload' },
  { type: 'RATING', label: 'Rating' },
]

export interface FormBuilderProps {
  /** Optional starting state (fields/steps). */
  initialState?: Partial<DndBuilderState>
  /** Called with the emitted DFE config whenever the form changes. */
  onChange?: (config: BuilderFormConfig) => void
}

export function FormBuilder({ initialState, onChange }: FormBuilderProps): React.ReactElement {
  const [state, dispatch] = React.useReducer(builderReducer, initialState, createBuilderState)
  const dragIndex = React.useRef<number | null>(null)

  React.useEffect(() => {
    onChange?.(toFormConfig(state))
  }, [state, onChange])

  const selected = state.fields.find(f => f.id === state.selectedFieldId) ?? null

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current
    if (from !== null && from !== targetIndex) {
      dispatch({ type: 'MOVE_FIELD', from, to: targetIndex })
    }
    dragIndex.current = null
  }

  return (
    <div className="dfe-builder" data-testid="dfe-builder" style={wrap}>
      <aside style={palette} aria-label="Field palette">
        <h3 style={heading}>Add field</h3>
        {PALETTE.map(item => (
          <button
            key={item.type}
            type="button"
            style={paletteBtn}
            onClick={() => dispatch({ type: 'ADD_FIELD', fieldType: item.type })}
            data-testid={`palette-${item.type}`}
          >
            + {item.label}
          </button>
        ))}
      </aside>

      <main style={canvas} aria-label="Form canvas">
        <h3 style={heading}>Form</h3>
        {state.fields.length === 0 && (
          <p style={empty} data-testid="builder-empty">No fields yet — add one from the palette.</p>
        )}
        <ul style={list}>
          {state.fields.map((field, index) => (
            <li
              key={field.id}
              draggable
              onDragStart={() => { dragIndex.current = index }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              onClick={() => dispatch({ type: 'SELECT_FIELD', id: field.id })}
              data-testid={`field-row-${field.id}`}
              style={{ ...row, ...(field.id === state.selectedFieldId ? rowSelected : null) }}
            >
              <span aria-hidden style={grip}>⋮⋮</span>
              <span style={rowLabel}>{field.label}</span>
              <span style={rowType}>{field.type}</span>
              <button
                type="button"
                aria-label={`Remove ${field.label}`}
                style={removeBtn}
                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_FIELD', id: field.id }) }}
                data-testid={`remove-${field.id}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </main>

      <aside style={inspector} aria-label="Field properties">
        <h3 style={heading}>Properties</h3>
        {!selected && <p style={empty}>Select a field to edit.</p>}
        {selected && (
          <div style={form}>
            <label style={lbl}>
              Label
              <input
                style={input}
                value={selected.label}
                data-testid="prop-label"
                onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: selected.id, patch: { label: e.target.value } })}
              />
            </label>
            <label style={lbl}>
              Key
              <input
                style={input}
                value={selected.key}
                data-testid="prop-key"
                onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: selected.id, patch: { key: e.target.value } })}
              />
            </label>
            <label style={checkboxRow}>
              <input
                type="checkbox"
                checked={selected.required}
                data-testid="prop-required"
                onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: selected.id, patch: { required: e.target.checked } })}
              />
              Required
            </label>
          </div>
        )}
      </aside>
    </div>
  )
}

// ─── Inline styles (kept minimal; consumers can restyle via the class names) ───
const wrap: React.CSSProperties = { display: 'flex', gap: 16, fontFamily: 'system-ui, sans-serif' }
const palette: React.CSSProperties = { width: 160, display: 'flex', flexDirection: 'column', gap: 6 }
const canvas: React.CSSProperties = { flex: 1, minWidth: 240 }
const inspector: React.CSSProperties = { width: 220 }
const heading: React.CSSProperties = { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 }
const paletteBtn: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', border: '1px solid #d0d0d8', borderRadius: 6, background: '#fff', cursor: 'pointer' }
const list: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid #d0d0d8', borderRadius: 6, background: '#fff', cursor: 'grab' }
const rowSelected: React.CSSProperties = { borderColor: '#6366f1', boxShadow: '0 0 0 1px #6366f1' }
const grip: React.CSSProperties = { opacity: 0.4 }
const rowLabel: React.CSSProperties = { flex: 1 }
const rowType: React.CSSProperties = { fontSize: 11, opacity: 0.6 }
const removeBtn: React.CSSProperties = { border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', lineHeight: 1 }
const empty: React.CSSProperties = { opacity: 0.6, fontSize: 14 }
const form: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 }
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }
const input: React.CSSProperties = { padding: '6px 8px', border: '1px solid #d0d0d8', borderRadius: 6 }
const checkboxRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }
