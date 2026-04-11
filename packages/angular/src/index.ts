// ─── Services ───────────────────────────────────────────────────────────────
export { DfeFormEngineService } from './form-engine.service'
export type { DfeFormEngineServiceConfig } from './form-engine.service'

export { DfeFormStepperService } from './form-stepper.service'
export type { DfeFormStepperServiceConfig } from './form-stepper.service'

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
