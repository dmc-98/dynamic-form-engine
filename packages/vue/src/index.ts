// ─── Composables ────────────────────────────────────────────────────────────
export { useFormEngine } from './useFormEngine'
export type { UseFormEngineOptions, UseFormEngineReturn } from './useFormEngine'

export { useFormStepper } from './useFormStepper'
export type { UseFormStepperOptions, UseFormStepperReturn } from './useFormStepper'

// ─── Re-export core types for convenience ───────────────────────────────────
export type {
  FormField, FormStep, FormValues, FieldType, FieldKey,
  FormEngine, FormStepper, FormGraph, GraphPatch,
  FieldNodeState, StepNodeState,
  StepApiContract, StepConfig, ReviewConfig,
  FieldConditions, ConditionRule, ConditionAction, ConditionOperator,
  SelectOption, DynamicDataSource, OptionsPage,
  FormRuntimeContext, StepSubmitPayload, StepSubmitResponse,
} from '@dmc-98/dfe-core'
