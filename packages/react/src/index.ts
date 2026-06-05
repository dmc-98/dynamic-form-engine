// ─── Hooks ──────────────────────────────────────────────────────────────────
export { useFormEngine } from './useFormEngine'
export type { UseFormEngineOptions, UseFormEngineReturn } from './useFormEngine'

export { useFormStepper } from './useFormStepper'
export type { UseFormStepperOptions, UseFormStepperReturn } from './useFormStepper'

export { useFormRuntime } from './useFormRuntime'
export type { UseFormRuntimeOptions, UseFormRuntimeReturn } from './useFormRuntime'

export { useOfflineFormRuntime } from './useOfflineFormRuntime'
export type { UseOfflineFormRuntimeOptions, UseOfflineFormRuntimeReturn } from './useOfflineFormRuntime'

export { useFormSync } from './useFormSync'
export type { UseFormSyncOptions, UseFormSyncReturn } from './useFormSync'

export { useDynamicOptions } from './useDynamicOptions'
export type { UseDynamicOptionsConfig, UseDynamicOptionsReturn } from './useDynamicOptions'

export { useStepUrl } from './useStepUrl'
export type { UseStepUrlOptions, UseStepUrlReturn } from './useStepUrl'

export {
  buildSyncStorageKey,
  createBroadcastChannelSyncTransport,
  createIndexedDbPersistenceAdapter,
  createMemoryPersistenceAdapter,
  createRemoteSyncTransport,
  createOfflineRuntimeState,
  createOfflineSubmissionId,
  enqueueOfflineCompleteSubmission,
  enqueueOfflineCreateSubmission,
  enqueueOfflineStepSubmit,
  flushOfflineRuntimeState,
} from './sync'
export type {
  BrowserPersistenceAdapter,
  EventSourceLike,
  IndexedDbPersistenceOptions,
  OfflineRuntimeApiClient,
  OfflineRuntimeState,
  RemoteSyncTransportOptions,
  SyncTransport,
  SyncTransportConnection,
  SyncTransportEvent,
} from './sync'

export { DefaultFieldRenderer } from './components/DfeFormRenderer'
export type { DfeFormRendererProps } from './components/DfeFormRenderer'
export type { FieldRendererProps } from './renderers'

// ─── Re-export core types for convenience ───────────────────────────────────
export type {
  FormField, FormStep, FormValues, FieldType, FieldKey,
  FormEngine, FormStepper, FormGraph, GraphPatch,
  FieldNodeState, StepNodeState,
  StepApiContract, StepConfig, ReviewConfig,
  FieldConditions, ConditionRule, ConditionAction, ConditionOperator,
  SelectOption, DynamicDataSource, OptionsPage,
  FormRuntimeContext, StepSubmitPayload, StepSubmitResponse,
  SyncConnectionState, SyncDocumentSnapshot, SyncDocumentState,
  SyncFieldOperation, SyncPresence, SyncPendingMutation,
} from '@dmc--98/dfe-core'
