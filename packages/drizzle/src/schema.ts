/**
 * Drizzle ORM schema for the Dynamic Form Engine.
 *
 * Usage:
 * ```ts
 * import { dfeForms, dfeFormVersions, dfeSteps, dfeFields } from '@dmc--98/dfe-drizzle/schema'
 * ```
 *
 * Compatible with PostgreSQL via drizzle-orm/pg-core.
 * For MySQL or SQLite, copy and adapt the column types.
 */

import {
  pgTable, text, integer, boolean, timestamp, json, uuid, unique, index,
} from 'drizzle-orm/pg-core'

// ─── Form Definitions ───────────────────────────────────────────────────────

export const dfeForms = pgTable('dfe_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id'),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantSlugUnique: unique().on(table.tenantId, table.slug),
  tenantUpdatedIdx: index('dfe_forms_tenant_updated_idx').on(table.tenantId, table.updatedAt),
}))

export const dfeFormVersions = pgTable('dfe_form_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull().references(() => dfeForms.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  status: text('status').notNull().default('DRAFT'), // DRAFT, PUBLISHED, ARCHIVED
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  formVersionUnique: unique().on(table.formId, table.version),
}))

// ─── Steps ──────────────────────────────────────────────────────────────────

export const dfeSteps = pgTable('dfe_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').notNull().references(() => dfeFormVersions.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  conditions: json('conditions'), // ConditionSkipRule
  config: json('config'),         // StepConfig
})

// ─── Fields ─────────────────────────────────────────────────────────────────

export const dfeFields = pgTable('dfe_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').notNull().references(() => dfeFormVersions.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id').references(() => dfeSteps.id),
  sectionId: text('section_id'),
  parentFieldId: uuid('parent_field_id'),
  key: text('key').notNull(),
  label: text('label').notNull(),
  description: text('description'),
  type: text('type').notNull(),     // FieldType enum value
  required: boolean('required').notNull().default(false),
  order: integer('order').notNull().default(0),
  config: json('config').notNull().default({}),   // FieldConfig
  conditions: json('conditions'),  // FieldConditions
}, (table) => ({
  versionKeyUnique: unique().on(table.versionId, table.key),
}))

// ─── Dynamic Options ────────────────────────────────────────────────────────

export const dfeFieldOptions = pgTable('dfe_field_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldId: uuid('field_id').notNull().references(() => dfeFields.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  value: text('value').notNull(),
  meta: json('meta'),
  order: integer('order').notNull().default(0),
})

// ─── Submissions ────────────────────────────────────────────────────────────

export const dfeSubmissions = pgTable('dfe_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id'),
  formId: uuid('form_id').notNull().references(() => dfeForms.id),
  versionId: uuid('version_id').notNull(),
  userId: text('user_id').notNull(),
  status: text('status').notNull().default('IN_PROGRESS'),
  currentStepId: uuid('current_step_id'),
  context: json('context').notNull().default({}),
  experimentId: uuid('experiment_id'),
  variantId: uuid('variant_id'),
  variantKey: text('variant_key'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  formUserIdx: index('dfe_submissions_form_user_idx').on(table.formId, table.userId),
  tenantCreatedIdx: index('dfe_submissions_tenant_created_idx').on(table.tenantId, table.createdAt),
  experimentIdx: index('dfe_submissions_experiment_idx').on(table.experimentId, table.variantId),
}))

// ─── Experiments ────────────────────────────────────────────────────────────

export const dfeExperiments = pgTable('dfe_experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull().references(() => dfeForms.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id'),
  name: text('name').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  formStatusIdx: index('dfe_experiments_form_status_idx').on(table.formId, table.status),
  tenantStatusIdx: index('dfe_experiments_tenant_status_idx').on(table.tenantId, table.status),
}))

export const dfeExperimentVariants = pgTable('dfe_experiment_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id').notNull().references(() => dfeExperiments.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  label: text('label').notNull(),
  weight: integer('weight').notNull().default(1),
  overrides: json('overrides'),
}, (table) => ({
  experimentKeyUnique: unique().on(table.experimentId, table.key),
}))

// ─── Analytics ──────────────────────────────────────────────────────────────

export const dfeAnalyticsEvents = pgTable('dfe_analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id'),
  formId: uuid('form_id').notNull().references(() => dfeForms.id, { onDelete: 'cascade' }),
  submissionId: uuid('submission_id'),
  event: text('event').notNull(),
  stepId: uuid('step_id'),
  fieldKey: text('field_key'),
  experimentId: uuid('experiment_id').references(() => dfeExperiments.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => dfeExperimentVariants.id, { onDelete: 'set null' }),
  variantKey: text('variant_key'),
  metadata: json('metadata'),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
}, (table) => ({
  tenantFormOccurredIdx: index('dfe_analytics_events_tenant_form_occurred_idx').on(
    table.tenantId,
    table.formId,
    table.occurredAt,
  ),
  submissionOccurredIdx: index('dfe_analytics_events_submission_occurred_idx').on(
    table.submissionId,
    table.occurredAt,
  ),
  eventOccurredIdx: index('dfe_analytics_events_event_occurred_idx').on(
    table.event,
    table.occurredAt,
  ),
}))
