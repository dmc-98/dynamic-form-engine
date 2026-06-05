// ─── Stores ─────────────────────────────────────────────────────────────────
export { createFormEngineStore, createFormStepperStore } from './stores'
export type { FormEngineStores, FormStepperStores } from './stores'

// ─── Re-export core types for convenience ───────────────────────────────────
export type {
  FormField, FormStep, FormValues, FieldType, FieldKey,
  FormEngine, FormStepper, FormGraph, GraphPatch,
  FieldNodeState, StepNodeState,
  StepApiContract, StepConfig, ReviewConfig,
  FieldConditions, ConditionRule, ConditionAction, ConditionOperator,
  SelectOption, DynamicDataSource, OptionsPage,
  FormRuntimeContext, StepSubmitPayload, StepSubmitResponse,
} from '@dmc--98/dfe-core'
