import type { FormField, FormStep, FieldType } from '@dmc--98/dfe-core'

// ─── Builder State ──────────────────────────────────────────────────────────

export interface BuilderState {
  /** All fields in the current form */
  fields: FormField[]
  /** All steps in the current form (for multi-step forms) */
  steps: FormStep[]
  /** ID of the currently selected field */
  selectedFieldId: string | null
  /** ID of the currently selected step */
  selectedStepId: string | null
  /** Whether a field is currently being dragged */
  isDragging: boolean
  /** Clipboard for copy/paste operations */
  clipboard: FormField | null
}

// ─── Builder Actions ────────────────────────────────────────────────────────

export type BuilderAction =
  | {
      type: 'ADD_FIELD'
      fieldType: FieldType
      stepId?: string | null
    }
  | {
      type: 'UPDATE_FIELD'
      fieldId: string
      updates: Partial<FormField>
    }
  | {
      type: 'REMOVE_FIELD'
      fieldId: string
    }
  | {
      type: 'REORDER_FIELD'
      fieldId: string
      newOrder: number
    }
  | {
      type: 'SELECT_FIELD'
      fieldId: string | null
    }
  | {
      type: 'ADD_STEP'
      title: string
    }
  | {
      type: 'UPDATE_STEP'
      stepId: string
      updates: Partial<FormStep>
    }
  | {
      type: 'REMOVE_STEP'
      stepId: string
    }
  | {
      type: 'SELECT_STEP'
      stepId: string | null
    }
  | {
      type: 'COPY_FIELD'
      fieldId: string
    }
  | {
      type: 'PASTE_FIELD'
      stepId?: string | null
    }
  | {
      type: 'SET_DRAGGING'
      isDragging: boolean
    }
  | {
      type: 'IMPORT_CONFIG'
      fields: FormField[]
      steps: FormStep[]
    }
  | {
      type: 'EXPORT_CONFIG'
    }
