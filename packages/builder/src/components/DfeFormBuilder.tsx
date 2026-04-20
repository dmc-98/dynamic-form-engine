import React from 'react'
import type { FieldType } from '@dmc--98/dfe-core'
import { useBuilderState } from '../useBuilderState'
import { FieldPalette } from './FieldPalette'
import { FormCanvas } from './FormCanvas'
import { PropertyEditor } from './PropertyEditor'
import { BuilderToolbar } from './BuilderToolbar'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeFormBuilderProps {
  /** Class name for the builder container */
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Main form builder component with a 3-panel layout:
 * - Left: Field palette
 * - Center: Form canvas with field cards
 * - Right: Property editor
 *
 * Includes a top toolbar for export/import and other actions.
 */
export function DfeFormBuilder({ className }: DfeFormBuilderProps): React.ReactElement {
  const [state, dispatch] = useBuilderState()

  const selectedField = state.fields.find(f => f.id === state.selectedFieldId) ?? null
  const selectedStep = state.steps.find(s => s.id === state.selectedStepId) ?? null

  const handleSelectField = (fieldId: string) => {
    dispatch({ type: 'SELECT_FIELD', fieldId })
  }

  const handleReorderField = (fieldId: string, newOrder: number) => {
    dispatch({ type: 'REORDER_FIELD', fieldId, newOrder })
  }

  const handleDropField = (fieldType: FieldType, order: number) => {
    dispatch({ type: 'ADD_FIELD', fieldType })
  }

  const handleUpdateField = (fieldId: string, updates: any) => {
    dispatch({ type: 'UPDATE_FIELD', fieldId, updates })
  }

  const handleUpdateStep = (stepId: string, updates: any) => {
    dispatch({ type: 'UPDATE_STEP', stepId, updates })
  }

  return (
    <div className={className} data-dfe-builder>
      <div data-dfe-builder-header>
        <BuilderToolbar
          fields={state.fields}
          steps={state.steps}
          dispatch={dispatch}
          canUndo={false}
          canRedo={false}
        />
      </div>

      <div data-dfe-builder-main>
        <div data-dfe-builder-sidebar-left>
          <FieldPalette />
        </div>

        <div data-dfe-builder-center>
          <FormCanvas
            fields={state.fields}
            selectedFieldId={state.selectedFieldId}
            onSelectField={handleSelectField}
            onReorderField={handleReorderField}
            onDropField={handleDropField}
            dispatch={dispatch}
          />
        </div>

        <div data-dfe-builder-sidebar-right>
          <PropertyEditor
            selectedField={selectedField}
            selectedStep={selectedStep}
            onUpdateField={handleUpdateField}
            onUpdateStep={handleUpdateStep}
          />
        </div>
      </div>
    </div>
  )
}
