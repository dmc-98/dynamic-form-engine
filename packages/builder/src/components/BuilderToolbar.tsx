import React, { useRef } from 'react'
import type { FormField, FormStep, FieldType } from '@dmc-98/dfe-core'
import type { BuilderAction } from '../types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BuilderToolbarProps {
  /** All fields to export */
  fields: FormField[]
  /** All steps to export */
  steps: FormStep[]
  /** Callback to dispatch builder actions */
  dispatch: React.Dispatch<BuilderAction>
  /** Whether undo is available */
  canUndo?: boolean
  /** Whether redo is available */
  canRedo?: boolean
  /** Class name for the container */
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Top toolbar with actions like export/import, preview, undo/redo, and add step.
 */
export function BuilderToolbar({
  fields,
  steps,
  dispatch,
  className,
}: BuilderToolbarProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const config = {
      fields,
      steps,
      exportedAt: new Date().toISOString(),
    }

    const json = JSON.stringify(config, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `form-config-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      try {
        const content = event.target?.result as string
        const config = JSON.parse(content)

        if (config.fields && Array.isArray(config.fields)) {
          dispatch({
            type: 'IMPORT_CONFIG',
            fields: config.fields,
            steps: config.steps ?? [],
          })
        } else {
          alert('Invalid form configuration format')
        }
      } catch (error) {
        alert(`Failed to import: ${(error as Error).message}`)
      }
    }
    reader.readAsText(file)
  }

  const handleAddStep = () => {
    const title = prompt('Enter step title:')
    if (title) {
      dispatch({ type: 'ADD_STEP', title })
    }
  }

  return (
    <div className={className} data-dfe-toolbar>
      <div data-dfe-toolbar-section>
        <button type="button" onClick={handleExport} data-dfe-toolbar-action>
          Export JSON
        </button>

        <button type="button" onClick={() => fileInputRef.current?.click()} data-dfe-toolbar-action>
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
          aria-label="Import form configuration"
        />
      </div>

      <div data-dfe-toolbar-section>
        <button type="button" onClick={handleAddStep} data-dfe-toolbar-action>
          + Add Step
        </button>
      </div>

      <div data-dfe-toolbar-info>
        <span>
          {fields.length} field{fields.length !== 1 ? 's' : ''}
          {steps.length > 0 && ` • ${steps.length} step${steps.length !== 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  )
}
