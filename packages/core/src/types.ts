// ─── Field Types ─────────────────────────────────────────────────────────────

/**
 * All supported field types in the Dynamic Form Engine.
 * Covers text, numeric, date, selection, media, and layout field types.
 */
export type FieldType =
  | 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMBER' | 'EMAIL' | 'PHONE'
  | 'DATE' | 'DATE_RANGE' | 'TIME' | 'DATE_TIME'
  | 'SELECT' | 'MULTI_SELECT' | 'RADIO' | 'CHECKBOX'
  | 'FILE_UPLOAD' | 'RATING' | 'SCALE'
  | 'URL' | 'PASSWORD' | 'HIDDEN'
  | 'SECTION_BREAK' | 'FIELD_GROUP'
  | 'RICH_TEXT' | 'SIGNATURE' | 'ADDRESS'

/** String-keyed identifier for a form field */
export type FieldKey = string

/** Record of field key → value for the entire form */
export type FormValues = Record<FieldKey, unknown>

// ─── Field Configuration (per type) ─────────────────────────────────────────

/** Base configuration shared by all field types */
export interface BaseFieldConfig {
  placeholder?: string
  defaultValue?: unknown
  helpText?: string
  /** Layout width hint: full (100%), half (50%), third (33%) */
  width?: 'full' | 'half' | 'third'
  /** Optional data-classification hint for downstream compliance policies */
  dataClassification?: FieldDataClassification
  /** Optional storage, logging, and analytics controls for this field */
  compliance?: FieldComplianceConfig
}

export type FieldDataClassification =
  | 'public'
  | 'internal'
  | 'pii'
  | 'phi'
  | 'financial'
  | 'credential'
  | 'restricted'

export interface FieldComplianceConfig {
  classification?: FieldDataClassification
  protected?: boolean
  encryptAtRest?: boolean
  allowAnalytics?: boolean
  redactInAuditLogs?: boolean
  retentionDays?: number
}

export interface TextFieldConfig extends BaseFieldConfig {
  minLength?: number
  maxLength?: number
  /** Regex pattern for validation */
  pattern?: string
  inputMode?: 'text' | 'url' | 'search'
}

export interface NumberFieldConfig extends BaseFieldConfig {
  min?: number
  max?: number
  step?: number
  format?: 'integer' | 'decimal' | 'currency' | 'percentage'
  prefix?: string
  suffix?: string
}

/** A single option in a SELECT, MULTI_SELECT, or RADIO field */
export interface SelectOption {
  label: string
  value: string
  meta?: unknown
}

/**
 * Configuration for API-backed dynamic SELECT fields.
 * Supports cursor-based pagination, search, and dependent field filtering.
 */
export interface DynamicDataSource {
  /** API endpoint for fetching options (e.g., "/api/fields/:id/options") */
  endpoint: string
  /** Query parameter name for cursor-based pagination (e.g., "cursor") */
  cursorParam: string
  /** Number of items per page */
  pageSize: number
  /** Query parameter name for search (e.g., "q") */
  searchParam?: string
  /** Response field to use as the option label. Use "+" to concatenate (e.g., "firstName + lastName") */
  labelKey: string
  /** Response field to use as the option value */
  valueKey: string
  /** Field key whose value parameterizes this query (dependent dropdown) */
  dependsOnField?: string
  /** Query parameter name for the dependency value */
  dependsOnParam?: string
}

export interface SelectFieldConfig extends BaseFieldConfig {
  /** 'static' for hardcoded options, 'dynamic' for API-backed options */
  mode: 'static' | 'dynamic'
  options?: SelectOption[]
  dataSource?: DynamicDataSource
  allowOther?: boolean
}

export interface FileUploadConfig extends BaseFieldConfig {
  maxSizeMB?: number
  allowedMimeTypes?: string[]
  maxFiles?: number
}

export interface RatingConfig extends BaseFieldConfig {
  max?: number
  labels?: { low: string; high: string }
}

export interface ScaleConfig extends BaseFieldConfig {
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
}

export interface FieldGroupConfig extends BaseFieldConfig {
  collapsible?: boolean
  defaultExpanded?: boolean
}

export interface RichTextFieldConfig extends BaseFieldConfig {
  /** Editor toolbar options */
  toolbar?: ('bold' | 'italic' | 'underline' | 'link' | 'heading' | 'list' | 'image' | 'code')[]
  /** Max character count */
  maxLength?: number
}

export interface SignatureFieldConfig extends BaseFieldConfig {
  /** Canvas width in px */
  canvasWidth?: number
  /** Canvas height in px */
  canvasHeight?: number
  /** Pen color */
  penColor?: string
  /** Background color */
  backgroundColor?: string
}

export interface AddressFieldConfig extends BaseFieldConfig {
  /** Provider: 'google' | 'mapbox' | 'manual' */
  provider?: 'google' | 'mapbox' | 'manual'
  /** API key for the provider */
  apiKey?: string
  /** Which address components to show */
  components?: ('street' | 'city' | 'state' | 'zip' | 'country')[]
}

/** Union of all per-type field configurations */
export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | FileUploadConfig
  | RatingConfig
  | ScaleConfig
  | FieldGroupConfig
  | RichTextFieldConfig
  | SignatureFieldConfig
  | AddressFieldConfig
  | BaseFieldConfig

// ─── Computed Fields ─────────────────────────────────────────────────────────

export interface ComputedFieldConfig extends BaseFieldConfig {
  /** Expression to compute value, e.g., "price * quantity" */
  expression: string
  /** Field keys this computed field depends on */
  dependsOn: FieldKey[]
  /** Whether the user can override the computed value */
  allowOverride?: boolean
}

// ─── Repeatable Groups ───────────────────────────────────────────────────────

export interface RepeatableGroupConfig extends FieldGroupConfig {
  /** Minimum number of repetitions */
  minRepeat?: number
  /** Maximum number of repetitions */
  maxRepeat?: number
  /** Label for the "Add another" button */
  addLabel?: string
  /** Template fields for each repetition */
  templateFields: FormField[]
}

// ─── Async Validation ────────────────────────────────────────────────────────

export interface AsyncValidationRule {
  /** Unique identifier for this validation */
  id: string
  /** API endpoint to call for validation */
  endpoint: string
  /** HTTP method */
  method: 'GET' | 'POST'
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number
  /** Error message to display when validation fails */
  errorMessage: string
  /** Field key to send as the value */
  fieldKey: FieldKey
}

// ─── Undo/Redo ───────────────────────────────────────────────────────────────

export interface UndoRedoState {
  past: FormValues[]
  present: FormValues
  future: FormValues[]
  maxHistory?: number
}

// ─── Field Permissions ───────────────────────────────────────────────────────

export type PermissionLevel = 'hidden' | 'readonly' | 'editable'

export interface FieldPermission {
  /** Role name */
  role: string
  /** Permission level for this role */
  level: PermissionLevel
}

// ─── Internationalization ────────────────────────────────────────────────────

export interface LocalizedString {
  [locale: string]: string
}

export interface I18nConfig {
  /** Default locale */
  defaultLocale: string
  /** Supported locales */
  supportedLocales: string[]
}

// ─── Branching Steps ─────────────────────────────────────────────────────────

export interface StepBranch {
  /** Condition that determines if this branch is taken */
  condition: FieldConditions
  /** Target step ID to navigate to when condition is met */
  targetStepId: string
}

// ─── Form Versioning ─────────────────────────────────────────────────────────

export interface FormVersion {
  id: string
  version: number
  createdAt: string
  fields: FormField[]
  steps: FormStep[]
}

export interface FormMigration {
  fromVersion: number
  toVersion: number
  /** Field key renames */
  renames: Record<FieldKey, FieldKey>
  /** Field keys removed */
  removals: FieldKey[]
  /** New fields added with default values */
  additions: Array<{ field: FormField; defaultValue: unknown }>
  /** Custom transform function for complex migrations */
  transform?: (values: FormValues) => FormValues
}

// ─── Autosave ────────────────────────────────────────────────────────────────

export interface AutosaveConfig {
  /** Interval in ms (default: 30000) */
  intervalMs?: number
  /** Storage key prefix */
  storageKey: string
  /** Storage backend: 'localStorage' | 'sessionStorage' | 'custom' */
  backend: 'localStorage' | 'sessionStorage' | 'custom'
  /** Custom save function (when backend is 'custom') */
  onSave?: (key: string, values: FormValues) => Promise<void>
  /** Custom load function (when backend is 'custom') */
  onLoad?: (key: string) => Promise<FormValues | null>
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export type WebhookEvent = 'submission.created' | 'submission.completed' | 'step.submitted' | 'form.published'

export interface WebhookConfig {
  id: string
  url: string
  events: WebhookEvent[]
  secret?: string
  headers?: Record<string, string>
  retryCount?: number
}

// ─── Plugins ─────────────────────────────────────────────────────────────────

export interface PluginDefinition {
  id: string
  name: string
  version: string
  /** Custom field types provided by this plugin */
  fieldTypes?: Array<{
    type: string
    label: string
    configSchema: Record<string, unknown>
  }>
  /** Custom validators provided by this plugin */
  validators?: Array<{
    id: string
    name: string
    validate: (value: unknown, config: unknown) => { valid: boolean; error?: string }
  }>
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface FormAnalyticsEvent {
  tenantId?: string
  formId: string
  submissionId?: string
  event:
    | 'form_started'
    | 'step_viewed'
    | 'step_completed'
    | 'field_error'
    | 'form_completed'
    | 'form_abandoned'
    | 'variant_assigned'
  stepId?: string
  fieldKey?: FieldKey
  timestamp: number
  experimentId?: string
  variantId?: string
  variantKey?: string
  metadata?: Record<string, unknown>
}

// ─── Condition System ────────────────────────────────────────────────────────

/** What to do when a condition matches */
export type ConditionAction = 'SHOW' | 'HIDE' | 'REQUIRE' | 'DISABLE'

/** Comparison operators for condition rules */
export type ConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte'
  | 'lt' | 'lte'
  | 'contains' | 'not_contains'
  | 'empty' | 'not_empty'
  | 'in' | 'not_in'

/** A single condition rule comparing a field value */
export interface ConditionRule {
  fieldKey: FieldKey
  operator: ConditionOperator
  value?: unknown
}

/** Conditions that control a field's visibility, required state, or disabled state */
export interface FieldConditions {
  action: ConditionAction
  /** Logical operator: 'and' = all rules must match, 'or' = any rule matches */
  operator: 'and' | 'or'
  rules: ConditionRule[]
}

// ─── Form Field ──────────────────────────────────────────────────────────────

/** Complete definition of a single form field */
export interface FormField {
  id: string
  versionId: string
  stepId?: string | null
  sectionId?: string | null
  parentFieldId?: string | null
  /** Unique key used as the field name in form values */
  key: FieldKey
  label: string
  description?: string | null
  type: FieldType
  required: boolean
  /** Display order within the step/section */
  order: number
  /** Type-specific configuration */
  config: FieldConfig
  /** Conditional logic rules */
  conditions?: FieldConditions | null
  /** Populated when returned as tree from API */
  children?: FormField[]
  /** Computed field expression (when type is a computed field) */
  computed?: ComputedFieldConfig
  /** Async validation rules */
  asyncValidation?: AsyncValidationRule[]
  /** Role-based permissions */
  permissions?: FieldPermission[]
  /** Localized labels */
  i18nLabels?: LocalizedString
  /** Localized descriptions */
  i18nDescriptions?: LocalizedString
  /** Localized placeholder texts */
  i18nPlaceholders?: LocalizedString
}

// ─── Form Step ───────────────────────────────────────────────────────────────

/** Skip condition for an entire step */
export interface ConditionSkipRule {
  action: 'SKIP'
  operator: 'and' | 'or'
  rules: ConditionRule[]
}

/**
 * API contract configuration for persisting step data.
 * Defines how form field values map to a backend API request.
 */
export interface StepApiContract {
  /** Internal identifier for the API resource (e.g., "Employee") */
  resourceName: string
  /** URL template with placeholders (e.g., "/api/employees/{employeeId}") */
  endpoint: string
  /** HTTP method */
  method: 'PUT' | 'POST'
  /** Maps form field keys → API request body keys */
  fieldMapping: Record<string, string>
  /** Maps API response keys → runtime context keys (for propagating generated IDs) */
  responseToContext?: Record<string, string>
  /** Maps runtime context keys → API request body keys (for FK linking) */
  contextToBody?: Record<string, string>
}

/** Configuration for a review/summary step */
export interface ReviewConfig {
  editMode: 'modal' | 'navigate' | 'both'
  redirectAfterSubmit?: string
}

/** Complete configuration for a form step */
export interface StepConfig {
  /** API contracts for persisting data when this step is submitted */
  apiContracts?: StepApiContract[]
  /** Review step configuration (if this step is a review/summary) */
  review?: ReviewConfig
  /** Autosave configuration for this step */
  autosave?: AutosaveConfig
  /** Webhooks to fire when this step is submitted */
  webhooks?: WebhookConfig[]
}

/** Complete definition of a form step */
export interface FormStep {
  id: string
  versionId: string
  title: string
  description?: string | null
  order: number
  /** Skip conditions for conditionally bypassing this step */
  conditions?: ConditionSkipRule | null
  /** Step-level configuration (API contracts, review) */
  config?: StepConfig | null
  /** Fields belonging to this step (populated by API) */
  fields?: FormField[]
  /** Branching logic: navigate to different steps based on values */
  branches?: StepBranch[]
  /** Localized titles */
  i18nTitles?: LocalizedString
  /** Localized descriptions */
  i18nDescriptions?: LocalizedString
}

// ─── Compiled Condition ──────────────────────────────────────────────────────

/** A pre-compiled condition function for fast evaluation */
export type CompiledCondition = (values: FormValues) => boolean

// ─── Graph Node ──────────────────────────────────────────────────────────────

/** State of a single field node in the dependency graph */
export interface FieldNodeState {
  field: FormField
  value: unknown
  isVisible: boolean
  isRequired: boolean
  isDirty: boolean
  validationError?: string | null
}

// ─── Form Graph ──────────────────────────────────────────────────────────────

/** The complete dependency graph for all fields in a form */
export interface FormGraph {
  /** All field nodes indexed by field key */
  nodes: Map<FieldKey, FieldNodeState>
  /** Adjacency list: key → set of keys that depend on it */
  dependents: Map<FieldKey, Set<FieldKey>>
  /** Fields in topological order (dependencies before dependents) */
  topoOrder: FieldKey[]
  /** Pre-compiled condition functions indexed by field key */
  compiledConditions: Map<FieldKey, CompiledCondition>
  /** Lookup: field.id → field.key for O(1) parent resolution */
  fieldIdToKey: Map<string, FieldKey>
}

/** Delta produced by a field value change */
export interface GraphPatch {
  /** All field keys whose state was updated */
  updatedKeys: Set<FieldKey>
  /** Fields whose visibility changed (key → new visibility) */
  visibilityChanges: Map<FieldKey, boolean>
  /** Fields whose required state changed (key → new required state) */
  requiredChanges: Map<FieldKey, boolean>
}

// ─── Step Graph ──────────────────────────────────────────────────────────────

/** State of a single step in the step graph */
export interface StepNodeState {
  step: FormStep
  fieldKeys: FieldKey[]
  isVisible: boolean
  isComplete: boolean
}

/** The complete step execution graph */
export interface StepGraph {
  steps: Map<string, StepNodeState>
  orderedStepIds: string[]
  compiledSkipConditions: Map<string, CompiledCondition>
}

// ─── Hydration ───────────────────────────────────────────────────────────────

export interface HydrationResult {
  values: FormValues
  warnings: string[]
}

// ─── Options Pagination ──────────────────────────────────────────────────────

export interface OptionsPage {
  items: SelectOption[]
  nextCursor: string | null
  total?: number
}

// ─── Form Runtime Context ────────────────────────────────────────────────────

/**
 * Runtime context object that accumulates data across form steps.
 * Used for cross-step references (e.g., propagating entity IDs as foreign keys).
 */
export interface FormRuntimeContext {
  userId: string
  [key: string]: unknown
}

// ─── Step Submission ─────────────────────────────────────────────────────────

export interface StepSubmitPayload {
  values: FormValues
  context: FormRuntimeContext
}

export interface StepSubmitResponse {
  success: boolean
  context: FormRuntimeContext
  errors?: Record<string, string>
}

// ─── Sync Model ─────────────────────────────────────────────────────────────

export type SyncConnectionState = 'idle' | 'online' | 'offline' | 'syncing' | 'error'

export interface SyncFieldVersion {
  fieldKey: FieldKey
  operationId: string
  actorId: string
  lamport: number
  clientTimestamp: number
}

export interface SyncFieldOperation {
  id: string
  sessionId: string
  actorId: string
  type: 'field:set'
  fieldKey: FieldKey
  value: unknown
  lamport: number
  clientTimestamp: number
  metadata?: Record<string, unknown>
}

export type SyncPresenceState = 'active' | 'idle' | 'offline'

export interface SyncPresence {
  actorId: string
  sessionId: string
  displayName: string
  color?: string
  activeFieldKey?: FieldKey | null
  state: SyncPresenceState
  updatedAt: number
  metadata?: Record<string, unknown>
}

export type SyncPendingMutationType =
  | 'submission:create'
  | 'step:submit'
  | 'submission:complete'

export interface SyncPendingMutation {
  id: string
  type: SyncPendingMutationType
  submissionId: string
  formId?: string
  versionId?: string
  stepId?: string
  values?: FormValues
  context?: FormRuntimeContext
  enqueuedAt: number
  attempts: number
  status: 'pending' | 'failed'
  lastError?: string
  metadata?: Record<string, unknown>
}

export interface SyncDocumentState {
  sessionId: string
  actorId: string
  lamport: number
  values: FormValues
  fieldVersions: Record<FieldKey, SyncFieldVersion>
  operations: SyncFieldOperation[]
  appliedOperationIds: string[]
  participants: Record<string, SyncPresence>
  pendingMutations: SyncPendingMutation[]
  lastSyncedAt?: number
}

export interface SyncDocumentSnapshot {
  sessionId: string
  actorId: string
  lamport: number
  values: FormValues
  fieldVersions: Record<FieldKey, SyncFieldVersion>
  operations: SyncFieldOperation[]
  participants: Record<string, SyncPresence>
  pendingMutations: SyncPendingMutation[]
  lastSyncedAt?: number
}

export interface SyncOperationApplyResult {
  state: SyncDocumentState
  applied: boolean
  valueChanged: boolean
}

// ─── Form Engine (public API) ────────────────────────────────────────────────

/** The primary form engine instance returned by createFormEngine() */
export interface FormEngine {
  /** The underlying dependency graph */
  graph: FormGraph
  /** Get the original field definitions used to create the engine */
  getFields: () => FormField[]
  /** Set a field's value and propagate changes through the DAG */
  setFieldValue: (key: FieldKey, value: unknown) => GraphPatch
  /** Get current values for all fields */
  getValues: () => FormValues
  /** Get all currently visible fields */
  getVisibleFields: () => FormField[]
  /** Get the state of a specific field */
  getFieldState: (key: FieldKey) => FieldNodeState | undefined
  /** Validate all visible, required fields. Returns per-field errors. */
  validate: () => { success: boolean; errors: Record<string, string> }
  /** Validate only the fields belonging to a specific step */
  validateStep: (stepId: string) => { success: boolean; errors: Record<string, string> }
  /** Collect values for submission (excludes hidden fields and layout fields) */
  collectSubmissionValues: () => FormValues
  /** Get a field's computed value */
  getComputedValue: (key: FieldKey) => unknown
  /** Register a computed field expression */
  registerComputed: (key: FieldKey, expression: string, dependsOn: FieldKey[]) => void
  /** Undo last change */
  undo: () => FormValues | null
  /** Redo last undone change */
  redo: () => FormValues | null
  /** Check if undo is available */
  canUndo: () => boolean
  /** Check if redo is available */
  canRedo: () => boolean
  /** Get field permission level for a role */
  getFieldPermission: (key: FieldKey, role: string) => PermissionLevel
  /** Get localized label for a field */
  getLocalizedLabel: (key: FieldKey, locale: string) => string
  /** Add a repeatable group instance */
  addRepeatInstance: (groupKey: FieldKey) => void
  /** Remove a repeatable group instance */
  removeRepeatInstance: (groupKey: FieldKey, index: number) => void
  /** Get repeat instances for a group */
  getRepeatInstances: (groupKey: FieldKey) => FormValues[]
}

/** The form stepper instance returned by createFormStepper() */
export interface FormStepper {
  stepGraph: StepGraph
  getCurrentStep: () => StepNodeState | null
  getVisibleSteps: () => StepNodeState[]
  getCurrentIndex: () => number
  canGoBack: () => boolean
  isLastStep: () => boolean
  /** Advance to the next visible step. Returns the new step or null if at end. */
  goNext: () => StepNodeState | null
  /** Go back to the previous visible step. Returns the new step or null if at start. */
  goBack: () => StepNodeState | null
  /** Jump to a specific step index */
  jumpTo: (index: number) => void
  /** Mark a step as complete */
  markComplete: (stepId: string) => void
  /** Get progress info */
  getProgress: () => { current: number; total: number; percent: number }
  /** Get the next step based on branching logic */
  getNextBranch: () => StepNodeState | null
  /** Navigate using branch logic instead of sequential */
  goNextBranch: () => StepNodeState | null
}
