import { describe, expect, it, vi } from 'vitest'
import { createDfeGraphqlApi } from '../src'
import type { DatabaseAdapter } from '@dmc--98/dfe-server'

const sampleForm = {
  id: 'form-1',
  tenantId: 'tenant-a',
  slug: 'employee-onboarding',
  title: 'Employee Onboarding',
  description: 'Collect employee details',
  versionId: 'version-1',
  status: 'PUBLISHED' as const,
  createdAt: new Date('2026-03-13T10:00:00.000Z'),
  updatedAt: new Date('2026-03-13T10:00:00.000Z'),
  steps: [
    {
      id: 'step-1',
      versionId: 'version-1',
      title: 'Profile',
      description: null,
      order: 1,
      conditions: null,
      config: null,
    },
  ],
  fields: [
    {
      id: 'field-name',
      versionId: 'version-1',
      stepId: 'step-1',
      sectionId: null,
      parentFieldId: null,
      key: 'full_name',
      label: 'Full Name',
      description: null,
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: {},
      conditions: null,
    },
  ],
}

function createMockDb(): DatabaseAdapter {
  return {
    listForms: vi.fn().mockResolvedValue({
      items: [sampleForm],
      nextCursor: null,
    }),
    getFormBySlug: vi.fn().mockImplementation(async (slug) => slug === sampleForm.slug ? sampleForm : null),
    getFormById: vi.fn().mockImplementation(async (id) => id === sampleForm.id ? sampleForm : null),
    createSubmission: vi.fn().mockImplementation(async ({ formId, versionId, userId, context, tenantId, experimentId, variantId, variantKey }) => ({
      id: 'sub-1',
      tenantId: tenantId ?? null,
      formId,
      versionId,
      userId,
      status: 'IN_PROGRESS',
      currentStepId: 'step-1',
      context,
      experimentId: experimentId ?? null,
      variantId: variantId ?? null,
      variantKey: variantKey ?? null,
      createdAt: new Date('2026-03-13T10:01:00.000Z'),
      updatedAt: new Date('2026-03-13T10:01:00.000Z'),
    })),
    getSubmission: vi.fn().mockImplementation(async (id) => {
      if (id !== 'sub-1') return null
      return {
        id,
        tenantId: 'tenant-a',
        formId: sampleForm.id,
        versionId: sampleForm.versionId,
        userId: 'user-1',
        status: 'IN_PROGRESS',
        currentStepId: 'step-1',
        context: {
          userId: 'user-1',
          tenantId: 'tenant-a',
          dfe: {
            variantLabel: 'Guided',
            variantKey: 'guided',
          },
        },
        experimentId: 'exp-1',
        variantId: 'var-1',
        variantKey: 'guided',
        createdAt: new Date('2026-03-13T10:01:00.000Z'),
        updatedAt: new Date('2026-03-13T10:01:00.000Z'),
      }
    }),
    updateSubmission: vi.fn().mockImplementation(async (id, data) => ({
      id,
      tenantId: 'tenant-a',
      formId: sampleForm.id,
      versionId: sampleForm.versionId,
      userId: 'user-1',
      status: data.status ?? 'IN_PROGRESS',
      currentStepId: data.currentStepId ?? 'step-1',
      context: data.context ?? {},
      experimentId: 'exp-1',
      variantId: 'var-1',
      variantKey: 'guided',
      createdAt: new Date('2026-03-13T10:01:00.000Z'),
      updatedAt: new Date('2026-03-13T10:05:00.000Z'),
    })),
    executeApiContract: vi.fn().mockResolvedValue({ id: 'employee-1' }),
    fetchFieldOptions: vi.fn().mockResolvedValue({
      items: [{ label: 'Platform Engineering', value: 'platform', meta: { department: 'eng' } }],
      nextCursor: null,
    }),
    trackAnalyticsEvent: vi.fn().mockResolvedValue(undefined),
    listAnalyticsEvents: vi.fn().mockResolvedValue([]),
    getAnalyticsSummary: vi.fn().mockResolvedValue({
      totalForms: 1,
      totalSubmissions: 1,
      totalStarts: 1,
      totalCompletions: 1,
      completionRate: 1,
      abandonmentRate: 0,
      averageCompletionTimeMs: 300000,
      stepFunnel: [],
      fieldErrors: [],
      recentActivity: [],
      variantComparison: [],
    }),
    listSubmissions: vi.fn().mockResolvedValue([
      {
        id: 'sub-1',
        tenantId: 'tenant-a',
        formId: sampleForm.id,
        versionId: sampleForm.versionId,
        userId: 'user-1',
        status: 'COMPLETED',
        currentStepId: 'step-1',
        context: {},
        experimentId: 'exp-1',
        variantId: 'var-1',
        variantKey: 'guided',
        createdAt: new Date('2026-03-13T10:01:00.000Z'),
        updatedAt: new Date('2026-03-13T10:05:00.000Z'),
      },
    ]),
    getActiveExperimentForForm: vi.fn().mockResolvedValue({
      id: 'exp-1',
      formId: sampleForm.id,
      tenantId: 'tenant-a',
      name: 'Guided onboarding',
      status: 'ACTIVE',
      createdAt: new Date('2026-03-13T09:59:00.000Z'),
      updatedAt: new Date('2026-03-13T09:59:00.000Z'),
      variants: [
        {
          id: 'var-1',
          experimentId: 'exp-1',
          key: 'guided',
          label: 'Guided',
          weight: 1,
          overrides: { headline: 'A guided experience' },
        },
      ],
    }),
  }
}

describe('@dmc--98/dfe-graphql', () => {
  it('lists forms through GraphQL', async () => {
    const api = createDfeGraphqlApi({
      db: createMockDb(),
      getTenantId: (context) => context.tenantId as string,
      skipAuth: true,
    })

    const result = await api.execute({
      source: `
        query {
          listForms {
            items {
              id
              slug
              submissionCount
              completionRate
            }
            nextCursor
          }
        }
      `,
      contextValue: { tenantId: 'tenant-a' },
    })

    expect(result.errors).toBeUndefined()
    expect(result.data).toEqual({
      listForms: {
        items: [
          {
            id: 'form-1',
            slug: 'employee-onboarding',
            submissionCount: 1,
            completionRate: 1,
          },
        ],
        nextCursor: null,
      },
    })
  })

  it('creates submissions with deterministic experiment assignment and analytics tracking', async () => {
    const db = createMockDb()
    const api = createDfeGraphqlApi({
      db,
      getUserId: (context) => context.userId as string,
      getTenantId: (context) => context.tenantId as string,
    })

    const result = await api.execute({
      source: `
        mutation CreateSubmission($formId: ID!, $versionId: String!) {
          createSubmission(formId: $formId, versionId: $versionId) {
            id
            tenantId
            variantKey
            experimentId
            context
          }
        }
      `,
      variableValues: {
        formId: 'form-1',
        versionId: 'version-1',
      },
      contextValue: {
        userId: 'user-1',
        tenantId: 'tenant-a',
      },
    })

    expect(result.errors).toBeUndefined()
    expect(result.data).toMatchObject({
      createSubmission: {
        id: 'sub-1',
        tenantId: 'tenant-a',
        variantKey: 'guided',
        experimentId: 'exp-1',
        context: {
          userId: 'user-1',
          tenantId: 'tenant-a',
        },
      },
    })
    expect(db.trackAnalyticsEvent).toHaveBeenCalled()
  })

  it('submits a step and completes the submission through GraphQL mutations', async () => {
    const db = createMockDb()
    const api = createDfeGraphqlApi({
      db,
      getUserId: (context) => context.userId as string,
      getTenantId: (context) => context.tenantId as string,
    })

    const submitResult = await api.execute({
      source: `
        mutation SubmitStep($submissionId: ID!, $stepId: ID!, $values: JSON!) {
          submitStep(submissionId: $submissionId, stepId: $stepId, values: $values) {
            success
            context
            errors
          }
        }
      `,
      variableValues: {
        submissionId: 'sub-1',
        stepId: 'step-1',
        values: {
          full_name: 'Ada Lovelace',
        },
      },
      contextValue: {
        userId: 'user-1',
        tenantId: 'tenant-a',
      },
    })

    expect(submitResult.errors).toBeUndefined()
    expect(submitResult.data).toMatchObject({
      submitStep: {
        success: true,
      },
    })

    const completeResult = await api.execute({
      source: `
        mutation CompleteSubmission($submissionId: ID!) {
          completeSubmission(submissionId: $submissionId) {
            success
            submission {
              id
              status
            }
          }
        }
      `,
      variableValues: {
        submissionId: 'sub-1',
      },
      contextValue: {
        userId: 'user-1',
        tenantId: 'tenant-a',
      },
    })

    expect(completeResult.errors).toBeUndefined()
    expect(completeResult.data).toMatchObject({
      completeSubmission: {
        success: true,
        submission: {
          id: 'sub-1',
          status: 'IN_PROGRESS',
        },
      },
    })
  })

  it('serves analytics and dynamic field options through GraphQL queries', async () => {
    const db = createMockDb()
    const api = createDfeGraphqlApi({
      db,
      getUserId: (context) => context.userId as string,
      getTenantId: (context) => context.tenantId as string,
      allowedOptionFilterKeys: ['department'],
    })

    const analyticsResult = await api.execute({
      source: `
        query Analytics($formId: String!) {
          analytics(formId: $formId) {
            totalForms
            totalStarts
            totalCompletions
            completionRate
          }
        }
      `,
      variableValues: {
        formId: 'form-1',
      },
      contextValue: {
        userId: 'user-1',
        tenantId: 'tenant-a',
      },
    })

    expect(analyticsResult.errors).toBeUndefined()
    expect(analyticsResult.data).toEqual({
      analytics: {
        totalForms: 1,
        totalStarts: 1,
        totalCompletions: 1,
        completionRate: 1,
      },
    })

    const optionsResult = await api.execute({
      source: `
        query Options($filters: JSON) {
          fieldOptions(fieldId: "field-team", filters: $filters) {
            items {
              label
              value
              meta
            }
            nextCursor
          }
        }
      `,
      variableValues: {
        filters: {
          department: 'eng',
          ignored: 'value',
        },
      },
    })

    expect(optionsResult.errors).toBeUndefined()
    expect(optionsResult.data).toEqual({
      fieldOptions: {
        items: [
          {
            label: 'Platform Engineering',
            value: 'platform',
            meta: { department: 'eng' },
          },
        ],
        nextCursor: null,
      },
    })
    expect(db.fetchFieldOptions).toHaveBeenCalledWith('field-team', expect.objectContaining({
      filters: {
        department: 'eng',
      },
    }))
  })
})
