import { useReducer } from 'react'
import type { FormField, FormStep, FieldType } from '@dmc--98/dfe-core'
import type { BuilderState, BuilderAction } from './types'

// ─── UUID Generator ─────────────────────────────────────────────────────────

function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// ─── Default Field Generator ────────────────────────────────────────────────

function createDefaultField(type: FieldType, stepId?: string | null): FormField {
  return {
    id: generateUUID(),
    versionId: 'v1',
    stepId: stepId ?? null,
    key: `field_${generateUUID().slice(0, 8)}`,
    label: `${type.replace(/_/g, ' ')} Field`,
    type,
    required: false,
    order: 0,
    config: {},
  }
}

// ─── Default Step Generator ─────────────────────────────────────────────────

function createDefaultStep(title: string): FormStep {
  return {
    id: generateUUID(),
    versionId: 'v1',
    title,
    order: 0,
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'ADD_FIELD': {
      const newField = createDefaultField(action.fieldType, action.stepId)
      const maxOrder = Math.max(...state.fields.map(f => f.order), -1)
      newField.order = maxOrder + 1
      return {
        ...state,
        fields: [...state.fields, newField],
        selectedFieldId: newField.id,
      }
    }

    case 'UPDATE_FIELD': {
      return {
        ...state,
        fields: state.fields.map(f =>
          f.id === action.fieldId ? { ...f, ...action.updates } : f
        ),
      }
    }

    case 'REMOVE_FIELD': {
      return {
        ...state,
        fields: state.fields.filter(f => f.id !== action.fieldId),
        selectedFieldId: state.selectedFieldId === action.fieldId ? null : state.selectedFieldId,
      }
    }

    case 'REORDER_FIELD': {
      const field = state.fields.find(f => f.id === action.fieldId)
      if (!field) return state

      const filtered = state.fields.filter(f => f.id !== action.fieldId)
      const updated = [...filtered]
      updated.splice(action.newOrder, 0, field)

      // Recalculate order
      const reordered = updated.map((f, i) => ({
        ...f,
        order: i,
      }))

      return {
        ...state,
        fields: reordered,
      }
    }

    case 'SELECT_FIELD': {
      return {
        ...state,
        selectedFieldId: action.fieldId,
        selectedStepId: null,
      }
    }

    case 'ADD_STEP': {
      const newStep = createDefaultStep(action.title)
      const maxOrder = Math.max(...state.steps.map(s => s.order), -1)
      newStep.order = maxOrder + 1
      return {
        ...state,
        steps: [...state.steps, newStep],
        selectedStepId: newStep.id,
        selectedFieldId: null,
      }
    }

    case 'UPDATE_STEP': {
      return {
        ...state,
        steps: state.steps.map(s =>
          s.id === action.stepId ? { ...s, ...action.updates } : s
        ),
      }
    }

    case 'REMOVE_STEP': {
      return {
        ...state,
        steps: state.steps.filter(s => s.id !== action.stepId),
        fields: state.fields.filter(f => f.stepId !== action.stepId),
        selectedStepId: state.selectedStepId === action.stepId ? null : state.selectedStepId,
      }
    }

    case 'SELECT_STEP': {
      return {
        ...state,
        selectedStepId: action.stepId,
        selectedFieldId: null,
      }
    }

    case 'COPY_FIELD': {
      const field = state.fields.find(f => f.id === action.fieldId)
      return {
        ...state,
        clipboard: field ?? null,
      }
    }

    case 'PASTE_FIELD': {
      if (!state.clipboard) return state

      const clonedField: FormField = {
        ...JSON.parse(JSON.stringify(state.clipboard)),
        id: generateUUID(),
        key: `field_${generateUUID().slice(0, 8)}`,
        stepId: action.stepId ?? null,
      }

      const maxOrder = Math.max(...state.fields.map(f => f.order), -1)
      clonedField.order = maxOrder + 1

      return {
        ...state,
        fields: [...state.fields, clonedField],
        selectedFieldId: clonedField.id,
      }
    }

    case 'SET_DRAGGING': {
      return {
        ...state,
        isDragging: action.isDragging,
      }
    }

    case 'IMPORT_CONFIG': {
      return {
        ...state,
        fields: action.fields,
        steps: action.steps,
        selectedFieldId: null,
        selectedStepId: null,
        clipboard: null,
      }
    }

    case 'EXPORT_CONFIG': {
      return state
    }

    default:
      return state
  }
}

// ─── Initial State ──────────────────────────────────────────────────────────

const initialState: BuilderState = {
  fields: [],
  steps: [],
  selectedFieldId: null,
  selectedStepId: null,
  isDragging: false,
  clipboard: null,
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Hook that manages the builder state with a reducer.
 * Returns [state, dispatch] tuple.
 */
export function useBuilderState(): [BuilderState, React.Dispatch<BuilderAction>] {
  return useReducer(builderReducer, initialState)
}

export type { BuilderState, BuilderAction }
