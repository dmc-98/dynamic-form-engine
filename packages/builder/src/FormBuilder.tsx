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
//
// Styling: token-driven (Graphite & Teal). The component stays self-contained —
// it reads `--dfe-*` custom properties (with safe fallbacks) and injects a small
// scoped stylesheet for hover/press/focus/selected motion, so it looks polished
// with or without @dmc--98/dfe-tokens loaded. Wrap a parent in `[data-dfe-theme]`
// (or rely on the one applied here) to theme it.

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
  const [overIndex, setOverIndex] = React.useState<number | null>(null)

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
    setOverIndex(null)
  }

  return (
    <div className="dfe-builder" data-dfe-theme data-testid="dfe-builder" style={wrap}>
      <style>{FB_CSS}</style>

      <aside style={palette} aria-label="Field palette">
        <h3 style={heading}>Add field</h3>
        {PALETTE.map(item => (
          <button
            key={item.type}
            type="button"
            className="dfe-fb-add"
            style={paletteBtn}
            onClick={() => dispatch({ type: 'ADD_FIELD', fieldType: item.type })}
            data-testid={`palette-${item.type}`}
          >
            <span aria-hidden style={addPlus}>+</span> {item.label}
          </button>
        ))}
      </aside>

      <main style={canvas} aria-label="Form canvas">
        <h3 style={heading}>Form</h3>
        {state.fields.length === 0 && (
          <p style={empty} data-testid="builder-empty">No fields yet — add one from the palette.</p>
        )}
        <ul style={list}>
          {state.fields.map((field, index) => {
            const isSelected = field.id === state.selectedFieldId
            return (
              <li
                key={field.id}
                className="dfe-fb-row"
                draggable
                onDragStart={() => { dragIndex.current = index }}
                onDragOver={(e) => { e.preventDefault(); setOverIndex(index) }}
                onDragLeave={() => setOverIndex(prev => (prev === index ? null : prev))}
                onDrop={() => handleDrop(index)}
                onClick={() => dispatch({ type: 'SELECT_FIELD', id: field.id })}
                data-testid={`field-row-${field.id}`}
                data-selected={isSelected ? 'true' : undefined}
                data-dropover={overIndex === index ? 'true' : undefined}
                style={row}
              >
                <span aria-hidden style={grip}>⋮⋮</span>
                <span style={rowLabel}>{field.label}</span>
                <span style={rowType}>{field.type}</span>
                <button
                  type="button"
                  className="dfe-fb-remove"
                  aria-label={`Remove ${field.label}`}
                  style={removeBtn}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_FIELD', id: field.id }) }}
                  data-testid={`remove-${field.id}`}
                >
                  ×
                </button>
              </li>
            )
          })}
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
                className="dfe-fb-input"
                style={input}
                value={selected.label}
                data-testid="prop-label"
                onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: selected.id, patch: { label: e.target.value } })}
              />
            </label>
            <label style={lbl}>
              Key
              <input
                className="dfe-fb-input"
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

// ─── Token-driven styles ──────────────────────────────────────────────────────
// Base layout/appearance via inline styles reading `--dfe-*` (with fallbacks).
// Interactive states + motion live in the injected stylesheet below.

const wrap: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--dfe-space-4, 1rem)',
  fontFamily: 'var(--dfe-font-sans, "IBM Plex Sans", system-ui, sans-serif)',
  color: 'var(--dfe-color-text, #0f172a)',
}
const palette: React.CSSProperties = { width: 168, display: 'flex', flexDirection: 'column', gap: 'var(--dfe-space-2, 0.5rem)' }
const canvas: React.CSSProperties = { flex: 1, minWidth: 240 }
const inspector: React.CSSProperties = { width: 228 }
const heading: React.CSSProperties = {
  fontSize: 'var(--dfe-text-xs, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.06em',
  color: 'var(--dfe-color-text-subtle, #64748b)', fontWeight: 600, margin: '0 0 var(--dfe-space-2, 0.5rem)',
}
const paletteBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
  padding: 'var(--dfe-space-2, 0.5rem) var(--dfe-space-3, 0.75rem)',
  border: '1px solid var(--dfe-color-border, #e2e8f0)', borderRadius: 'var(--dfe-radius-md, 0.5rem)',
  background: 'var(--dfe-color-surface, #fff)', color: 'inherit', cursor: 'grab',
  font: 'inherit', fontSize: 'var(--dfe-text-sm, 0.875rem)',
}
const addPlus: React.CSSProperties = { color: 'var(--dfe-color-primary, #0f766e)', fontWeight: 700 }
const list: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--dfe-space-2, 0.5rem)' }
const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 'var(--dfe-space-2, 0.5rem)',
  padding: 'var(--dfe-space-2, 0.5rem) var(--dfe-space-3, 0.75rem)',
  border: '1px solid var(--dfe-color-border, #e2e8f0)', borderRadius: 'var(--dfe-radius-md, 0.5rem)',
  background: 'var(--dfe-color-surface, #fff)', cursor: 'grab',
  boxShadow: 'var(--dfe-shadow-xs, 0 1px 2px rgba(15,23,42,.06))',
}
const grip: React.CSSProperties = { color: 'var(--dfe-color-text-subtle, #94a3b8)', cursor: 'grab' }
const rowLabel: React.CSSProperties = { flex: 1 }
const rowType: React.CSSProperties = { fontSize: 'var(--dfe-text-xs, 0.75rem)', color: 'var(--dfe-color-text-muted, #475569)', fontFamily: 'var(--dfe-font-mono, ui-monospace, monospace)' }
const removeBtn: React.CSSProperties = { border: 'none', background: 'transparent', color: 'var(--dfe-color-text-subtle, #94a3b8)', fontSize: 18, cursor: 'pointer', lineHeight: 1, borderRadius: 'var(--dfe-radius-sm, 0.375rem)' }
const empty: React.CSSProperties = { color: 'var(--dfe-color-text-muted, #475569)', fontSize: 'var(--dfe-text-sm, 0.875rem)' }
const form: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--dfe-space-3, 0.75rem)' }
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--dfe-space-1, 0.25rem)', fontSize: 'var(--dfe-text-sm, 0.875rem)', fontWeight: 600 }
const input: React.CSSProperties = {
  padding: 'var(--dfe-space-2, 0.5rem) var(--dfe-space-3, 0.75rem)',
  border: '1px solid var(--dfe-color-border, #e2e8f0)', borderRadius: 'var(--dfe-radius-md, 0.5rem)',
  background: 'var(--dfe-color-surface, #fff)', color: 'inherit', font: 'inherit', fontWeight: 400,
}
const checkboxRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--dfe-space-2, 0.5rem)', fontSize: 'var(--dfe-text-sm, 0.875rem)' }

// Interaction + motion. Scoped to .dfe-builder so it never leaks to the host.
const FB_CSS = `
.dfe-builder .dfe-fb-add,
.dfe-builder .dfe-fb-row,
.dfe-builder .dfe-fb-input,
.dfe-builder .dfe-fb-remove {
  transition: border-color var(--dfe-duration-fast, 120ms) var(--dfe-ease-standard, ease),
              box-shadow var(--dfe-duration-base, 160ms) var(--dfe-ease-out, ease),
              background var(--dfe-duration-fast, 120ms) var(--dfe-ease-standard, ease),
              transform var(--dfe-duration-fast, 120ms) var(--dfe-ease-spring, ease);
}
.dfe-builder .dfe-fb-add:hover {
  border-color: var(--dfe-color-primary-border, #99f6e4);
  background: var(--dfe-color-primary-subtle, #f0fdfa);
  color: var(--dfe-color-primary, #0f766e);
  transform: translateY(-1px);
}
.dfe-builder .dfe-fb-add:active { transform: scale(0.97); }
.dfe-builder .dfe-fb-add:focus-visible,
.dfe-builder .dfe-fb-input:focus-visible,
.dfe-builder .dfe-fb-remove:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--dfe-color-focus, rgba(13,148,136,.28));
}
.dfe-builder .dfe-fb-row:hover {
  border-color: var(--dfe-color-border-strong, #cbd5e1);
  box-shadow: var(--dfe-shadow-sm, 0 1px 3px rgba(15,23,42,.08));
  transform: translateY(-1px);
}
.dfe-builder .dfe-fb-row[data-selected="true"] {
  border-color: var(--dfe-color-primary, #0f766e);
  box-shadow: 0 0 0 1px var(--dfe-color-primary, #0f766e), var(--dfe-shadow-sm, 0 1px 3px rgba(15,23,42,.08));
  background: var(--dfe-color-primary-subtle, #f0fdfa);
}
.dfe-builder .dfe-fb-row[data-dropover="true"] {
  border-color: var(--dfe-color-primary, #0f766e);
  border-style: dashed;
  transform: scale(1.01);
}
.dfe-builder .dfe-fb-row:active { cursor: grabbing; }
.dfe-builder .dfe-fb-input:focus-visible { border-color: var(--dfe-color-primary, #0f766e); }
.dfe-builder .dfe-fb-remove:hover { background: var(--dfe-color-danger-surface, #fee2e2); color: var(--dfe-color-danger, #b91c1c); }
@media (prefers-reduced-motion: reduce) {
  .dfe-builder .dfe-fb-add,
  .dfe-builder .dfe-fb-row,
  .dfe-builder .dfe-fb-input,
  .dfe-builder .dfe-fb-remove { transition-duration: 0.001ms; }
}
`
