/**
 * DFE Database Adapter Certification Kit
 *
 * `runDatabaseAdapterConformance` validates that a `DatabaseAdapter`
 * implementation satisfies the full DFE contract. Run it in your
 * integration test suite after wiring the adapter to a real database
 * (or an in-memory store for local dev):
 *
 * ```ts
 * import { runDatabaseAdapterConformance } from '@dmc--98/dfe-server/adapter-conformance'
 * import { DrizzleDatabaseAdapter } from '@dmc--98/dfe-drizzle'
 *
 * const adapter = new DrizzleDatabaseAdapter(db)
 * const report = await runDatabaseAdapterConformance(adapter, async (seed) => {
 *   // Insert seed.form rows into your database before the suite runs.
 *   await db.insert(dfeForms).values({ ... })
 * })
 * assert.ok(report.ok, report.summary)
 * ```
 *
 * The kit covers all required methods of `DatabaseAdapter`:
 * getFormBySlug, getFormById, listForms, createSubmission, getSubmission,
 * updateSubmission, executeApiContract, and fetchFieldOptions.
 */

import type {
  DatabaseAdapter,
  FormVersionRecord,
  FormSubmissionRecord,
} from './adapters'
import type { FormRuntimeContext, StepApiContract } from '@dmc--98/dfe-core'

// ─── Seed data ───────────────────────────────────────────────────────────────

/**
 * Canonical test data that the conformance suite will query.
 * Pass this to your seed function to pre-populate the database
 * before the suite runs.
 */
export interface ConformanceSeedData {
  /** The single published form that all adapter read-path tests use. */
  form: FormVersionRecord
}

/** Pre-built seed fixture. Pass it to your seed callback as-is. */
export const CONFORMANCE_SEED: ConformanceSeedData = {
  form: {
    id: 'cf-form-1',
    tenantId: null,
    slug: 'conformance-test-form',
    title: 'Conformance Test Form',
    description: 'Canonical form used by the adapter certification suite.',
    versionId: 'cf-version-1',
    status: 'PUBLISHED',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    steps: [
      {
        id: 'cf-step-1',
        versionId: 'cf-version-1',
        title: 'Personal Info',
        description: null,
        order: 1,
        conditions: null,
        config: null,
        fields: [
          {
            id: 'cf-field-1',
            versionId: 'cf-version-1',
            stepId: 'cf-step-1',
            key: 'full_name',
            label: 'Full Name',
            type: 'SHORT_TEXT',
            required: true,
            order: 1,
            config: { placeholder: 'Jane Doe' },
          },
          {
            id: 'cf-field-2',
            versionId: 'cf-version-1',
            stepId: 'cf-step-1',
            key: 'email',
            label: 'Email Address',
            type: 'EMAIL',
            required: true,
            order: 2,
            config: { placeholder: 'jane@example.com' },
          },
        ],
      },
    ],
    fields: [
      {
        id: 'cf-field-1',
        versionId: 'cf-version-1',
        stepId: 'cf-step-1',
        key: 'full_name',
        label: 'Full Name',
        type: 'SHORT_TEXT',
        required: true,
        order: 1,
        config: { placeholder: 'Jane Doe' },
      },
      {
        id: 'cf-field-2',
        versionId: 'cf-version-1',
        stepId: 'cf-step-1',
        key: 'email',
        label: 'Email Address',
        type: 'EMAIL',
        required: true,
        order: 2,
        config: { placeholder: 'jane@example.com' },
      },
    ],
  },
}

const CONFORMANCE_CONTRACT: StepApiContract = {
  resourceName: 'ConformanceResource',
  endpoint: '/api/conformance',
  method: 'POST',
  fieldMapping: { full_name: 'name', email: 'email' },
  responseToContext: { id: 'conformanceResourceId' },
}

const CONFORMANCE_CONTEXT: FormRuntimeContext = {
  userId: 'user-conformance-1',
  submissionId: 'cf-submission-1',
  formId: 'cf-form-1',
  versionId: 'cf-version-1',
  currentStepIndex: 0,
  values: { full_name: 'Jane Doe', email: 'jane@example.com' },
}

// ─── Report types ─────────────────────────────────────────────────────────────

export interface ConformanceCaseResult {
  name: string
  ok: boolean
  error?: string
}

export interface ConformanceReport {
  ok: boolean
  passed: number
  failed: number
  total: number
  results: ConformanceCaseResult[]
  /** One-line summary, ready for assertion messages. */
  summary: string
}

// ─── Runner ───────────────────────────────────────────────────────────────────

/**
 * Run the full conformance suite against `adapter`.
 *
 * @param adapter - The adapter under test.
 * @param seed    - Called once before any tests. Use it to insert
 *                  `CONFORMANCE_SEED.form` into the database so the
 *                  read-path tests can find it.
 */
export async function runDatabaseAdapterConformance(
  adapter: DatabaseAdapter,
  seed: (data: ConformanceSeedData) => Promise<void>,
): Promise<ConformanceReport> {
  const results: ConformanceCaseResult[] = []

  async function run(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn()
      results.push({ name, ok: true })
    } catch (err) {
      results.push({ name, ok: false, error: (err as Error).message })
    }
  }

  // Seed the database before any tests.
  await seed(CONFORMANCE_SEED)

  const { form } = CONFORMANCE_SEED
  let createdSubmissionId = ''

  // ── Read-path: form lookup ─────────────────────────────────────────────────

  await run('getFormBySlug — returns seeded form', async () => {
    const result = await adapter.getFormBySlug(form.slug)
    if (!result) throw new Error('Expected a form, got null')
    if (result.id !== form.id) throw new Error(`Wrong form id: ${result.id}`)
    if (result.slug !== form.slug) throw new Error(`Wrong slug: ${result.slug}`)
    if (result.status !== 'PUBLISHED') throw new Error(`Wrong status: ${result.status}`)
  })

  await run('getFormBySlug — returns null for unknown slug', async () => {
    const result = await adapter.getFormBySlug('__nonexistent_slug__')
    if (result !== null) throw new Error(`Expected null, got form ${result?.id}`)
  })

  await run('getFormById — returns seeded form', async () => {
    const result = await adapter.getFormById(form.id)
    if (!result) throw new Error('Expected a form, got null')
    if (result.id !== form.id) throw new Error(`Wrong form id: ${result.id}`)
  })

  await run('getFormById — returns null for unknown id', async () => {
    const result = await adapter.getFormById('__nonexistent_id__')
    if (result !== null) throw new Error(`Expected null, got form ${result?.id}`)
  })

  await run('getFormBySlug — steps array is populated', async () => {
    const result = await adapter.getFormBySlug(form.slug)
    if (!result) throw new Error('Form not found')
    if (!Array.isArray(result.steps)) throw new Error('steps must be an array')
    if (result.steps.length === 0) throw new Error('Expected at least one step')
  })

  await run('getFormBySlug — fields array is populated', async () => {
    const result = await adapter.getFormBySlug(form.slug)
    if (!result) throw new Error('Form not found')
    if (!Array.isArray(result.fields)) throw new Error('fields must be an array')
    if (result.fields.length === 0) throw new Error('Expected at least one field')
  })

  await run('listForms — seeded form appears in results', async () => {
    const result = await adapter.listForms({ pageSize: 100 })
    if (!Array.isArray(result.items)) throw new Error('items must be an array')
    const found = result.items.find((f) => f.id === form.id)
    if (!found) throw new Error(`Form ${form.id} not found in listForms result`)
  })

  await run('listForms — returns paginated shape', async () => {
    const result = await adapter.listForms({ pageSize: 1 })
    if (!('items' in result)) throw new Error('Missing items property')
    if (!('nextCursor' in result)) throw new Error('Missing nextCursor property')
  })

  // ── Write-path: submissions ────────────────────────────────────────────────

  await run('createSubmission — returns record with correct shape', async () => {
    const record = await adapter.createSubmission({
      tenantId: null,
      formId: form.id,
      versionId: form.versionId,
      userId: 'user-conformance-1',
      context: CONFORMANCE_CONTEXT,
    })
    assertSubmissionShape(record, form.id)
    if (record.status !== 'IN_PROGRESS') throw new Error(`Expected IN_PROGRESS, got ${record.status}`)
    createdSubmissionId = record.id
  })

  await run('getSubmission — retrieves previously created submission', async () => {
    if (!createdSubmissionId) throw new Error('No submission to retrieve (createSubmission failed)')
    const record = await adapter.getSubmission(createdSubmissionId)
    if (!record) throw new Error('getSubmission returned null')
    if (record.id !== createdSubmissionId) throw new Error('Wrong submission id')
    if (record.formId !== form.id) throw new Error(`Wrong formId: ${record.formId}`)
  })

  await run('getSubmission — returns null for unknown id', async () => {
    const result = await adapter.getSubmission('__nonexistent_submission__')
    if (result !== null) throw new Error(`Expected null, got submission ${result?.id}`)
  })

  await run('updateSubmission — status update persists', async () => {
    if (!createdSubmissionId) throw new Error('No submission to update (createSubmission failed)')
    const updated = await adapter.updateSubmission(createdSubmissionId, { status: 'COMPLETED' })
    assertSubmissionShape(updated, form.id)
    if (updated.status !== 'COMPLETED') throw new Error(`Expected COMPLETED, got ${updated.status}`)
  })

  await run('updateSubmission — currentStepId update persists', async () => {
    if (!createdSubmissionId) throw new Error('No submission to update (createSubmission failed)')
    const updated = await adapter.updateSubmission(createdSubmissionId, {
      currentStepId: 'cf-step-1',
    })
    assertSubmissionShape(updated, form.id)
    if (updated.currentStepId !== 'cf-step-1') {
      throw new Error(`Expected cf-step-1, got ${updated.currentStepId}`)
    }
  })

  // ── Dynamic resource ops ───────────────────────────────────────────────────

  await run('executeApiContract — returns an object', async () => {
    const result = await adapter.executeApiContract(CONFORMANCE_CONTRACT, {
      name: 'Jane Doe',
      email: 'jane@example.com',
    })
    if (typeof result !== 'object' || result === null) {
      throw new Error(`Expected an object, got ${typeof result}`)
    }
  })

  // ── Dynamic options ────────────────────────────────────────────────────────

  await run('fetchFieldOptions — returns paginated shape', async () => {
    const result = await adapter.fetchFieldOptions('cf-field-2', { pageSize: 10 })
    if (!('items' in result)) throw new Error('Missing items property')
    if (!Array.isArray(result.items)) throw new Error('items must be an array')
    if (!('nextCursor' in result)) throw new Error('Missing nextCursor property')
  })

  // ── Summary ───────────────────────────────────────────────────────────────

  const passed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length
  const ok = failed === 0

  const summary = ok
    ? `DatabaseAdapter conformance: ${passed}/${results.length} checks passed`
    : `DatabaseAdapter conformance FAILED: ${failed} of ${results.length} checks failed — ` +
      results
        .filter((r) => !r.ok)
        .map((r) => `[${r.name}] ${r.error}`)
        .join('; ')

  return { ok, passed, failed, total: results.length, results, summary }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertSubmissionShape(record: FormSubmissionRecord, expectedFormId: string): void {
  if (!record.id) throw new Error('Submission missing id')
  if (record.formId !== expectedFormId) throw new Error(`formId mismatch: ${record.formId}`)
  if (!record.versionId) throw new Error('Submission missing versionId')
  if (!record.userId) throw new Error('Submission missing userId')
  if (!record.status) throw new Error('Submission missing status')
  if (!record.createdAt) throw new Error('Submission missing createdAt')
  if (!record.updatedAt) throw new Error('Submission missing updatedAt')
}
