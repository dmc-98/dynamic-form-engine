import type { FormRuntimeContext } from '@dmc-98/dfe-core'
import {
  buildAnalyticsSummary,
  completeSubmission,
  executeStepSubmit,
  selectExperimentVariant,
} from '@dmc-98/dfe-server'
import type {
  AccessContext,
  AnalyticsQuery,
  DatabaseAdapter,
  FormSubmissionRecord,
} from '@dmc-98/dfe-server'
import {
  buildSchema,
  GraphQLError,
  GraphQLScalarType,
  graphql,
  Kind,
  type ExecutionResult,
  type GraphQLSchema,
} from 'graphql'

export interface DfeGraphqlContext {
  userId?: string | null
  tenantId?: string | null
  req?: unknown
  [key: string]: unknown
}

export interface DfeGraphqlApiOptions {
  db: DatabaseAdapter
  getUserId?: (context: DfeGraphqlContext) => string | null | undefined
  getTenantId?: (context: DfeGraphqlContext) => string | null | undefined
  skipAuth?: boolean
  maxPageSize?: number
  allowedOptionFilterKeys?: string[]
}

export interface DfeGraphqlExecuteParams {
  source: string
  variableValues?: Record<string, unknown>
  contextValue?: DfeGraphqlContext
  operationName?: string
}

export interface DfeGraphqlApi {
  schema: GraphQLSchema
  rootValue: Record<string, (...args: any[]) => Promise<unknown> | unknown>
  execute(params: DfeGraphqlExecuteParams): Promise<ExecutionResult>
}

interface SubmissionAssignment {
  experimentId: string
  experimentName: string
  variantId: string
  variantKey: string
  variantLabel: string
  variantOverrides: Record<string, unknown> | null
}

const typeDefs = /* GraphQL */ `
  scalar JSON

  type FormSummary {
    id: ID!
    tenantId: String
    slug: String!
    title: String!
    description: String
    versionId: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    submissionCount: Int!
    completionRate: Float!
  }

  type FormStep {
    id: ID!
    versionId: String!
    title: String!
    description: String
    order: Int!
    conditions: JSON
    config: JSON
  }

  type FormField {
    id: ID!
    versionId: String!
    stepId: String
    sectionId: String
    parentFieldId: String
    key: String!
    label: String!
    description: String
    type: String!
    required: Boolean!
    order: Int!
    config: JSON
    conditions: JSON
  }

  type FormVersion {
    id: ID!
    tenantId: String
    slug: String!
    title: String!
    description: String
    versionId: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    steps: [FormStep!]!
    fields: [FormField!]!
  }

  type Submission {
    id: ID!
    tenantId: String
    formId: String!
    versionId: String!
    userId: String!
    status: String!
    currentStepId: String
    context: JSON
    experimentId: String
    variantId: String
    variantKey: String
    createdAt: String
    updatedAt: String
  }

  type StepSubmitResult {
    success: Boolean!
    context: JSON
    errors: JSON
  }

  type SelectOption {
    label: String!
    value: String!
    meta: JSON
  }

  type FormPage {
    items: [FormSummary!]!
    nextCursor: String
  }

  type OptionPage {
    items: [SelectOption!]!
    nextCursor: String
  }

  type StepFunnelEntry {
    stepId: String!
    stepTitle: String!
    count: Int!
    dropOff: Int!
  }

  type FieldErrorSummary {
    fieldKey: String!
    fieldLabel: String!
    errorCount: Int!
  }

  type AnalyticsRecentActivity {
    type: String!
    description: String!
    timestamp: String!
  }

  type VariantAnalyticsSummary {
    variantId: String
    variantKey: String!
    variantLabel: String!
    starts: Int!
    completions: Int!
    abandonmentRate: Float!
    completionRate: Float!
  }

  type AnalyticsSummary {
    totalForms: Int!
    totalSubmissions: Int!
    totalStarts: Int!
    totalCompletions: Int!
    completionRate: Float!
    abandonmentRate: Float!
    averageCompletionTimeMs: Int!
    stepFunnel: [StepFunnelEntry!]!
    fieldErrors: [FieldErrorSummary!]!
    recentActivity: [AnalyticsRecentActivity!]!
    variantComparison: [VariantAnalyticsSummary!]!
  }

  type CompleteSubmissionResult {
    success: Boolean!
    submission: Submission!
  }

  type Query {
    listForms(pageSize: Int = 20, cursor: String, search: String): FormPage!
    formBySlug(slug: String!): FormVersion
    formById(id: ID!): FormVersion
    submission(id: ID!): Submission
    submissions(formId: String, status: String, limit: Int = 100): [Submission!]!
    fieldOptions(fieldId: ID!, pageSize: Int = 20, cursor: String, search: String, filters: JSON): OptionPage!
    analytics(formId: String, from: Float, to: Float): AnalyticsSummary!
  }

  type Mutation {
    createSubmission(formId: ID!, versionId: String!): Submission!
    submitStep(submissionId: ID!, stepId: ID!, values: JSON!, context: JSON): StepSubmitResult!
    completeSubmission(submissionId: ID!): CompleteSubmissionResult!
  }
`

function parseJsonAst(ast: any): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value
    case Kind.INT:
      return Number.parseInt(ast.value, 10)
    case Kind.FLOAT:
      return Number.parseFloat(ast.value)
    case Kind.NULL:
      return null
    case Kind.LIST:
      return ast.values.map(parseJsonAst)
    case Kind.OBJECT:
      return Object.fromEntries(ast.fields.map((field: any) => [field.name.value, parseJsonAst(field.value)]))
    default:
      return null
  }
}

function installJsonScalar(schema: GraphQLSchema) {
  const jsonType = schema.getType('JSON')
  if (!(jsonType instanceof GraphQLScalarType)) {
    return schema
  }

  ;(jsonType as GraphQLScalarType & {
    serialize?: (value: unknown) => unknown
    parseValue?: (value: unknown) => unknown
    parseLiteral?: (ast: unknown) => unknown
  }).serialize = (value) => value
  ;(jsonType as GraphQLScalarType & {
    serialize?: (value: unknown) => unknown
    parseValue?: (value: unknown) => unknown
    parseLiteral?: (ast: unknown) => unknown
  }).parseValue = (value) => value
  ;(jsonType as GraphQLScalarType & {
    serialize?: (value: unknown) => unknown
    parseValue?: (value: unknown) => unknown
    parseLiteral?: (ast: unknown) => unknown
  }).parseLiteral = (ast) => parseJsonAst(ast)

  return schema
}

function clampPageSize(raw: number | null | undefined, maxPageSize: number): number {
  if (!Number.isFinite(raw)) return 20
  const parsed = Math.trunc(raw as number)
  if (parsed < 1) return 20
  return Math.min(parsed, maxPageSize)
}

function serializeDate(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return String(value)
}

function serializeSubmission(submission: FormSubmissionRecord) {
  return {
    ...submission,
    tenantId: submission.tenantId ?? null,
    currentStepId: submission.currentStepId ?? null,
    context: submission.context ?? null,
    experimentId: submission.experimentId ?? null,
    variantId: submission.variantId ?? null,
    variantKey: submission.variantKey ?? null,
    createdAt: serializeDate(submission.createdAt),
    updatedAt: serializeDate(submission.updatedAt),
  }
}

function serializeFormVersion(form: Awaited<ReturnType<DatabaseAdapter['getFormById']>>) {
  if (!form) return null

  return {
    ...form,
    tenantId: form.tenantId ?? null,
    description: form.description ?? null,
    createdAt: serializeDate(form.createdAt),
    updatedAt: serializeDate(form.updatedAt),
    steps: form.steps.map((step) => ({
      ...step,
      description: step.description ?? null,
      conditions: step.conditions ?? null,
      config: step.config ?? null,
    })),
    fields: form.fields.map((field) => ({
      ...field,
      stepId: field.stepId ?? null,
      sectionId: field.sectionId ?? null,
      parentFieldId: field.parentFieldId ?? null,
      description: field.description ?? null,
      config: field.config ?? null,
      conditions: field.conditions ?? null,
    })),
  }
}

function createAuthError(message: string, code: string) {
  return new GraphQLError(message, {
    extensions: { code },
  })
}

function createNotFoundError(message: string) {
  return new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  })
}

function createConflictError(message: string) {
  return new GraphQLError(message, {
    extensions: { code: 'CONFLICT' },
  })
}

function createValidationError(message: string) {
  return new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT' },
  })
}

function sanitizeFilterValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (/[{}\[\]$]/.test(value)) return null
  if (value.length > 200) return null
  return value
}

function buildSubmissionContext(
  userId: string,
  tenantId: string | undefined,
  assignment?: SubmissionAssignment,
): FormRuntimeContext {
  const dfe: Record<string, unknown> = {
    tenantId: tenantId ?? null,
    experimentId: assignment?.experimentId ?? null,
    experimentName: assignment?.experimentName ?? null,
    variantId: assignment?.variantId ?? null,
    variantKey: assignment?.variantKey ?? null,
    variantLabel: assignment?.variantLabel ?? null,
    variantOverrides: assignment?.variantOverrides ?? null,
  }

  return {
    userId,
    ...(tenantId ? { tenantId } : {}),
    dfe,
  }
}

async function trackEvent(
  db: DatabaseAdapter,
  event: Parameters<NonNullable<DatabaseAdapter['trackAnalyticsEvent']>>[0],
) {
  if (!db.trackAnalyticsEvent) return
  await db.trackAnalyticsEvent(event)
}

function normalizeAccess(context: DfeGraphqlContext, options: DfeGraphqlApiOptions): AccessContext {
  const tenantId = options.getTenantId?.(context)
  const userId = options.getUserId?.(context)

  return {
    tenantId: tenantId === undefined ? undefined : tenantId,
    userId: userId === undefined ? undefined : userId,
  }
}

function requireUser(context: DfeGraphqlContext, options: DfeGraphqlApiOptions): string {
  const userId = options.getUserId?.(context)
  if (options.skipAuth) {
    return userId ?? 'anonymous'
  }
  if (!userId) {
    throw createAuthError('Authentication required', 'UNAUTHENTICATED')
  }
  return userId
}

function requireSubmissionAccess(
  submission: FormSubmissionRecord,
  userId: string,
  access: AccessContext,
  options: DfeGraphqlApiOptions,
) {
  if (!options.skipAuth && submission.userId !== userId) {
    throw createAuthError('You do not have permission to access this submission', 'FORBIDDEN')
  }

  if (access.tenantId !== undefined && submission.tenantId !== (access.tenantId ?? null)) {
    throw createAuthError('You do not have permission to access this tenant', 'FORBIDDEN')
  }
}

function createAssignment(
  experiment: Awaited<ReturnType<NonNullable<DatabaseAdapter['getActiveExperimentForForm']>>>,
  tenantId: string | undefined,
  userId: string,
): SubmissionAssignment | undefined {
  if (!experiment) return undefined

  const variant = selectExperimentVariant(experiment, `${tenantId ?? 'public'}:${userId}`)

  return {
    experimentId: experiment.id,
    experimentName: experiment.name,
    variantId: variant.id,
    variantKey: variant.key,
    variantLabel: variant.label,
    variantOverrides: (variant.overrides as Record<string, unknown> | null) ?? null,
  }
}

function createRootValue(options: DfeGraphqlApiOptions) {
  const { db, maxPageSize = 100, allowedOptionFilterKeys = [] } = options

  return {
    async listForms(args: { pageSize?: number | null; cursor?: string | null; search?: string | null }, context: DfeGraphqlContext) {
      const access = normalizeAccess(context, options)
      const result = await db.listForms({
        pageSize: clampPageSize(args.pageSize, maxPageSize),
        cursor: args.cursor ?? null,
        search: args.search ?? undefined,
      }, access)

      const items = await Promise.all(result.items.map(async (item) => {
        const submissions = await db.listSubmissions?.({
          tenantId: access.tenantId,
          formId: item.id,
          limit: 500,
        }) ?? []
        const summary = db.getAnalyticsSummary
          ? await db.getAnalyticsSummary({ tenantId: access.tenantId, formId: item.id })
          : undefined
        const completed = submissions.filter((submission) => submission.status === 'COMPLETED').length

        return {
          ...item,
          tenantId: item.tenantId ?? null,
          description: item.description ?? null,
          createdAt: serializeDate(item.createdAt),
          updatedAt: serializeDate(item.updatedAt),
          submissionCount: submissions.length,
          completionRate: summary?.completionRate ?? (submissions.length > 0 ? completed / submissions.length : 0),
        }
      }))

      return {
        items,
        nextCursor: result.nextCursor,
      }
    },

    async formBySlug(args: { slug: string }, context: DfeGraphqlContext) {
      const access = normalizeAccess(context, options)
      const form = await db.getFormBySlug(args.slug, access)
      return serializeFormVersion(form)
    },

    async formById(args: { id: string }, context: DfeGraphqlContext) {
      const access = normalizeAccess(context, options)
      const form = await db.getFormById(args.id, access)
      return serializeFormVersion(form)
    },

    async submission(args: { id: string }, context: DfeGraphqlContext) {
      const access = normalizeAccess(context, options)
      const userId = requireUser(context, options)
      const submission = await db.getSubmission(args.id)
      if (!submission) return null
      requireSubmissionAccess(submission, userId, access, options)
      return serializeSubmission(submission)
    },

    async submissions(
      args: { formId?: string | null; status?: string | null; limit?: number | null },
      context: DfeGraphqlContext,
    ) {
      const access = normalizeAccess(context, options)
      const userId = requireUser(context, options)

      if (!db.listSubmissions) {
        throw createValidationError('Submission listing is not supported by this adapter')
      }

      const submissions = await db.listSubmissions({
        tenantId: access.tenantId,
        formId: args.formId ?? undefined,
        status: (args.status as FormSubmissionRecord['status'] | null | undefined) ?? undefined,
        limit: clampPageSize(args.limit, maxPageSize),
      })

      return submissions
        .filter((submission) => options.skipAuth || submission.userId === userId)
        .map(serializeSubmission)
    },

    async fieldOptions(
      args: {
        fieldId: string
        pageSize?: number | null
        cursor?: string | null
        search?: string | null
        filters?: Record<string, unknown> | null
      },
    ) {
      const filters = Object.fromEntries(
        Object.entries(args.filters ?? {})
          .filter(([key]) => allowedOptionFilterKeys.length === 0 || allowedOptionFilterKeys.includes(key))
          .map(([key, value]) => [key, sanitizeFilterValue(value)])
          .filter(([, value]) => value !== null),
      )

      return db.fetchFieldOptions(args.fieldId, {
        cursor: args.cursor ?? null,
        pageSize: clampPageSize(args.pageSize, maxPageSize),
        search: args.search ? args.search.slice(0, 200) : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      })
    },

    async analytics(args: { formId?: string | null; from?: number | null; to?: number | null }, context: DfeGraphqlContext) {
      const access = normalizeAccess(context, options)
      requireUser(context, options)

      const query: AnalyticsQuery = {
        tenantId: access.tenantId,
        formId: args.formId ?? undefined,
        from: args.from ?? undefined,
        to: args.to ?? undefined,
      }

      if (db.getAnalyticsSummary) {
        return db.getAnalyticsSummary(query)
      }

      if (db.listAnalyticsEvents) {
        const events = await db.listAnalyticsEvents(query)
        return buildAnalyticsSummary(events, {
          totalForms: query.formId ? 1 : new Set(events.map((event) => event.formId)).size,
        })
      }

      throw createValidationError('Analytics are not supported by this adapter')
    },

    async createSubmission(args: { formId: string; versionId: string }, context: DfeGraphqlContext) {
      const access = normalizeAccess(context, options)
      const userId = requireUser(context, options)
      const form = await db.getFormById(args.formId, access)
      if (!form) {
        throw createNotFoundError('Form not found')
      }

      const assignment = createAssignment(
        await db.getActiveExperimentForForm?.(args.formId, access) ?? null,
        access.tenantId ?? undefined,
        userId,
      )
      const runtimeContext = buildSubmissionContext(userId, access.tenantId ?? undefined, assignment)

      const submission = await db.createSubmission({
        tenantId: access.tenantId ?? null,
        formId: args.formId,
        versionId: args.versionId,
        userId,
        context: runtimeContext,
        experimentId: assignment?.experimentId ?? null,
        variantId: assignment?.variantId ?? null,
        variantKey: assignment?.variantKey ?? null,
      })

      if (assignment) {
        await trackEvent(db, {
          tenantId: access.tenantId ?? undefined,
          formId: args.formId,
          submissionId: submission.id,
          event: 'variant_assigned',
          experimentId: assignment.experimentId,
          variantId: assignment.variantId,
          variantKey: assignment.variantKey,
          metadata: {
            experimentName: assignment.experimentName,
            variantLabel: assignment.variantLabel,
            variantOverrides: assignment.variantOverrides,
          },
          timestamp: Date.now(),
        })
      }

      await trackEvent(db, {
        tenantId: access.tenantId ?? undefined,
        formId: args.formId,
        submissionId: submission.id,
        event: 'form_started',
        experimentId: assignment?.experimentId,
        variantId: assignment?.variantId,
        variantKey: assignment?.variantKey,
        metadata: {
          variantLabel: assignment?.variantLabel,
        },
        timestamp: Date.now(),
      })

      const firstStep = form.steps[0]
      if (firstStep) {
        await trackEvent(db, {
          tenantId: access.tenantId ?? undefined,
          formId: args.formId,
          submissionId: submission.id,
          event: 'step_viewed',
          stepId: firstStep.id,
          experimentId: assignment?.experimentId,
          variantId: assignment?.variantId,
          variantKey: assignment?.variantKey,
          metadata: {
            stepTitle: firstStep.title,
            variantLabel: assignment?.variantLabel,
          },
          timestamp: Date.now(),
        })
      }

      return serializeSubmission(submission)
    },

    async submitStep(
      args: {
        submissionId: string
        stepId: string
        values: Record<string, unknown>
        context?: FormRuntimeContext | null
      },
      context: DfeGraphqlContext,
    ) {
      const access = normalizeAccess(context, options)
      const userId = requireUser(context, options)
      const submission = await db.getSubmission(args.submissionId)

      if (!submission) {
        throw createNotFoundError('Submission not found')
      }

      requireSubmissionAccess(submission, userId, access, options)

      if (submission.status === 'COMPLETED') {
        throw createConflictError('Submission is already completed')
      }

      const form = await db.getFormById(submission.formId, {
        tenantId: submission.tenantId ?? undefined,
        userId,
      })

      if (!form) {
        throw createNotFoundError('Form not found')
      }

      const result = await executeStepSubmit({
        form,
        stepId: args.stepId,
        payload: {
          values: args.values ?? {},
          context: args.context ?? submission.context,
        },
        db,
        submissionId: args.submissionId,
      })

      if (result.success) {
        const submittedStep = form.steps.find((step) => step.id === args.stepId)
        const nextStep = form.steps.find((step) => step.order > (submittedStep?.order ?? -1))

        await trackEvent(db, {
          tenantId: submission.tenantId ?? undefined,
          formId: submission.formId,
          submissionId: args.submissionId,
          event: 'step_completed',
          stepId: args.stepId,
          experimentId: submission.experimentId ?? undefined,
          variantId: submission.variantId ?? undefined,
          variantKey: submission.variantKey ?? undefined,
          metadata: {
            stepTitle: submittedStep?.title ?? args.stepId,
            variantLabel: (result.context as any)?.dfe?.variantLabel,
          },
          timestamp: Date.now(),
        })

        if (nextStep) {
          await trackEvent(db, {
            tenantId: submission.tenantId ?? undefined,
            formId: submission.formId,
            submissionId: args.submissionId,
            event: 'step_viewed',
            stepId: nextStep.id,
            experimentId: submission.experimentId ?? undefined,
            variantId: submission.variantId ?? undefined,
            variantKey: submission.variantKey ?? undefined,
            metadata: {
              stepTitle: nextStep.title,
              variantLabel: (result.context as any)?.dfe?.variantLabel,
            },
            timestamp: Date.now(),
          })
        }

        return result
      }

      const fieldErrors = Object.entries(result.errors ?? {})
        .filter(([key]) => !key.startsWith('_'))

      await Promise.all(fieldErrors.map(async ([fieldKey, error]) => {
        const field = form.fields.find((candidate) => candidate.key === fieldKey)
        await trackEvent(db, {
          tenantId: submission.tenantId ?? undefined,
          formId: submission.formId,
          submissionId: args.submissionId,
          event: 'field_error',
          stepId: args.stepId,
          fieldKey,
          experimentId: submission.experimentId ?? undefined,
          variantId: submission.variantId ?? undefined,
          variantKey: submission.variantKey ?? undefined,
          metadata: {
            fieldLabel: field?.label ?? fieldKey,
            error,
            variantLabel: (submission.context as any)?.dfe?.variantLabel,
          },
          timestamp: Date.now(),
        })
      }))

      return result
    },

    async completeSubmission(args: { submissionId: string }, context: DfeGraphqlContext) {
      const access = normalizeAccess(context, options)
      const userId = requireUser(context, options)
      const submission = await db.getSubmission(args.submissionId)

      if (!submission) {
        throw createNotFoundError('Submission not found')
      }

      requireSubmissionAccess(submission, userId, access, options)

      if (submission.status === 'COMPLETED') {
        throw createConflictError('Submission is already completed')
      }

      await completeSubmission(db, args.submissionId, submission.context)
      await trackEvent(db, {
        tenantId: submission.tenantId ?? undefined,
        formId: submission.formId,
        submissionId: args.submissionId,
        event: 'form_completed',
        experimentId: submission.experimentId ?? undefined,
        variantId: submission.variantId ?? undefined,
        variantKey: submission.variantKey ?? undefined,
        metadata: {
          variantLabel: (submission.context as any)?.dfe?.variantLabel,
        },
        timestamp: Date.now(),
      })

      const updated = await db.getSubmission(args.submissionId)
      if (!updated) {
        throw createNotFoundError('Submission not found after completion')
      }

      return {
        success: true,
        submission: serializeSubmission(updated),
      }
    },
  }
}

export function createDfeGraphqlSchema() {
  return installJsonScalar(buildSchema(typeDefs))
}

export function createDfeGraphqlApi(options: DfeGraphqlApiOptions): DfeGraphqlApi {
  const schema = createDfeGraphqlSchema()
  const rootValue = createRootValue(options)

  return {
    schema,
    rootValue,
    execute({ source, variableValues, contextValue, operationName }) {
      return graphql({
        schema,
        source,
        rootValue,
        variableValues,
        contextValue,
        operationName,
      })
    },
  }
}
