// ─── Adapter Interfaces ──────────────────────────────────────────────────────
export type {
  DatabaseAdapter,
  PersistenceAdapter,
  PaginationParams,
  PaginatedResult,
  FormDefinitionRecord,
  FormVersionRecord,
  FormSubmissionRecord,
} from './adapters'

// ─── Step Submission Pipeline ────────────────────────────────────────────────
export {
  executeStepSubmit,
  completeSubmission,
  resolveEndpoint,
  buildContractBody,
  propagateContext,
} from './step-submit'
export type { StepSubmitOptions } from './step-submit'

// ─── UUIDv7 ────────────────────────────────────────────────────────────────
export { generateId } from './uuid'

// ─── Webhooks ─────────────────────────────────────────────────────────────────
export {
  signWebhookPayload,
  fireWebhooks,
} from './webhooks'
export type { WebhookPayload, WebhookResult } from './webhooks'

// ─── Plugins ──────────────────────────────────────────────────────────────────
export {
  createPluginRegistry,
} from './plugins'
export type { PluginRegistry } from './plugins'

// ─── Experiments ─────────────────────────────────────────────────────────────
export { selectExperimentVariant } from './experiments'

// ─── Observability ────────────────────────────────────────────────────────────
export {
  createTracer,
  createOpenTelemetryTracer,
  createInMemorySpanExporter,
  createTracingMiddleware,
} from './observability'
export type { DfeSpan, DfeSpanEvent, DfeSpanExporter, DfeTracer } from './observability'

// ─── Collaboration ───────────────────────────────────────────────────────────
export {
  CollaborationStoreError,
  InMemoryCollaborationStore,
} from './collaboration'
export type {
  CollaborationAccessContext,
  CollaborationEventPayload,
  CollaborationEventRecord,
  CollaborationJoinSessionInput,
  CollaborationJoinSessionResult,
  CollaborationListEventsOptions,
  CollaborationSessionRecord,
  CollaborationStore,
} from './collaboration'

// ─── Compliance / HIPAA-Supporting Controls ─────────────────────────────────
export {
  buildProtectedFieldVault,
  createAesGcmFieldProtector,
  createAuditLogEntry,
  createInMemoryAuditLogStore,
  deriveProtectedFieldPolicies,
  getProtectedFieldVault,
  isEncryptedFieldValue,
  mergeProtectedFieldPolicies,
  redactProtectedFieldVault,
  revealProtectedFieldValues,
  sanitizeAnalyticsEventForCompliance,
  sanitizeAnalyticsEventsForCompliance,
  storeProtectedFieldVault,
  storeProtectedValuesInContext,
} from './compliance'
export type {
  AuditLogEntry,
  AuditLogQuery,
  AuditLogStore,
  ComplianceAnalyticsOptions,
  EncryptedFieldValue,
  FieldValueProtector,
  ProtectedFieldPolicy,
  ProtectedFieldVault,
  ProtectedFieldVaultEntry,
  RedactedProtectedFieldVault,
} from './compliance'

// ─── Analytics ────────────────────────────────────────────────────────────────
export {
  createAnalyticsStore,
  buildAnalyticsSummary,
  createAnalyticsMiddleware,
  type AnalyticsStore,
  type FormStats,
  type StepStats,
  type FieldErrorStats,
} from './analytics'
export type {
  AccessContext,
  AnalyticsQuery,
  AnalyticsSummary,
  AnalyticsRecentActivity,
  FormExperimentRecord,
  FormExperimentVariantRecord,
  ServerFormAnalyticsEvent,
  VariantAnalyticsSummary,
} from './adapters'
