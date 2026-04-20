// ─── @dmc--98/dfe-core ──────────────────────────────────────────────────────
// Configuration-driven dynamic form engine
// Zero dependencies beyond Zod (peer)

// Factory functions (primary public API)
export { createFormEngine, createFormStepper } from './engine'

// Types (re-exported for consumers)
export type {
  // Field types
  FieldType, FieldKey, FormValues,
  FieldDataClassification, FieldComplianceConfig,
  BaseFieldConfig, TextFieldConfig, NumberFieldConfig,
  SelectOption, DynamicDataSource, SelectFieldConfig,
  FileUploadConfig, RatingConfig, ScaleConfig, FieldGroupConfig,
  RichTextFieldConfig, SignatureFieldConfig, AddressFieldConfig,
  FieldConfig,

  // Computed fields
  ComputedFieldConfig, RepeatableGroupConfig,

  // Async validation
  AsyncValidationRule,

  // Undo/Redo
  UndoRedoState,

  // Permissions
  PermissionLevel, FieldPermission,

  // i18n
  LocalizedString, I18nConfig,

  // Conditions
  ConditionAction, ConditionOperator, ConditionRule, FieldConditions,

  // Form field
  FormField,

  // Steps
  ConditionSkipRule, StepApiContract, ReviewConfig, StepConfig, FormStep,
  StepBranch,

  // Form versioning
  FormVersion, FormMigration,

  // Autosave
  AutosaveConfig,

  // Webhooks
  WebhookEvent, WebhookConfig,

  // Plugins
  PluginDefinition,

  // Analytics
  FormAnalyticsEvent,

  // Graph
  CompiledCondition, FieldNodeState,
  FormGraph, GraphPatch,
  StepNodeState, StepGraph,

  // Hydration
  HydrationResult,

  // Options
  OptionsPage,

  // Runtime
  FormRuntimeContext, StepSubmitPayload, StepSubmitResponse,

  // Sync
  SyncConnectionState, SyncFieldVersion, SyncFieldOperation,
  SyncPresenceState, SyncPresence,
  SyncPendingMutationType, SyncPendingMutation,
  SyncDocumentState, SyncDocumentSnapshot, SyncOperationApplyResult,

  // Engine interfaces
  FormEngine, FormStepper,
} from './types'

// DAG utilities (for advanced use cases)
export {
  buildFormGraph, handleFieldChange,
  flattenFieldTree, getDefaultValue,
  getCurrentValues, collectSubmissionValues,
  topologicalSort,
} from './dag'

// Stepper utilities (for advanced use cases)
export {
  buildStepGraph, canProceedFromStep,
  getNextVisibleStep, getPrevVisibleStep,
  getVisibleSteps, collectAllStepValues,
} from './stepper'

// Validation
export {
  generateZodSchema, generateStepZodSchema,
  generateStrictSubmissionSchema, registerSchemaBuilder,
} from './zod-generator'

// Condition compiler
export {
  compileCondition, extractReferencedKeys, computeFieldState,
} from './condition-compiler'

// Hydration
export { mergeHydrationData, resolveEndpointTemplate } from './hydration'

// JSON Schema import/export
export { toJsonSchema, fromJsonSchema } from './json-schema'
export type { JsonSchema } from './json-schema'

// Form Templates
export {
  getTemplate,
  getTemplatesByCategory,
  listTemplates,
  TEMPLATES,
} from './templates'
export type { FormTemplate } from './templates'

// Import/Export
export {
  exportForm,
  exportFormToYaml,
  exportFormToCsv,
  importForm,
  importFromTypeform,
  importFromGoogleForms,
} from './import-export'
export type { ExportOptions, FormExportData } from './import-export'

// AI Integration & Assistants
export {
  generateFormFromDescription,
  buildLlmPrompt,
  suggestValidationRules,
  suggestAdditionalFields,
  detectFormType,
  groupSuggestionsByCategory,
  generateAutofillDraft,
  type FormGenerationPrompt,
  type GeneratedFormConfig,
  type ValidationSuggestion,
  type FieldSuggestion,
  type AutofillDraftRequest,
  type AutofillDraftMatch,
  type AutofillDraftResult,
} from './ai'

// Accessibility Audit
export {
  auditFormAccessibility,
  summarizeA11yAudit,
} from './accessibility'
export type { A11yIssue, A11ySeverity } from './accessibility'

// PDF Rendering
export {
  generatePdfLayout,
  generatePrintableHtml,
} from './pdf-renderer'
export type { PdfFormLayout, PdfPage, PdfFieldLayout } from './pdf-renderer'

// Sync runtime
export {
  acknowledgeSyncMutation,
  applySyncOperation,
  createSyncDocument,
  createSyncFieldOperation,
  createSyncSnapshot,
  hydrateSyncDocument,
  markSyncMutationFailed,
  mergeSyncOperations,
  pruneInactiveSyncParticipants,
  queueSyncMutation,
  removeSyncPresence,
  replaceSyncMutationSubmissionId,
  upsertSyncPresence,
} from './sync'
