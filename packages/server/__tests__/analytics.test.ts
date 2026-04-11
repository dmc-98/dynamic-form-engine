import { describe, expect, it, vi } from 'vitest'
import {
  buildAnalyticsSummary,
  createAnalyticsMiddleware,
  createAnalyticsStore,
} from '../src/analytics'
import type { ServerFormAnalyticsEvent } from '../src/adapters'

const baseTimestamp = Date.parse('2026-03-13T09:00:00.000Z')

function createEvent(
  overrides: Partial<ServerFormAnalyticsEvent> & Pick<ServerFormAnalyticsEvent, 'event' | 'timestamp'>,
): ServerFormAnalyticsEvent {
  return {
    formId: 'form-1',
    metadata: {},
    ...overrides,
  }
}

function createAnalyticsFixtures() {
  return [
    createEvent({
      submissionId: 'sub-1',
      event: 'variant_assigned',
      timestamp: baseTimestamp,
      experimentId: 'exp-1',
      variantId: 'var-control',
      variantKey: 'control',
      metadata: { variantLabel: 'Control' },
    }),
    createEvent({
      submissionId: 'sub-1',
      event: 'form_started',
      timestamp: baseTimestamp + 1_000,
      variantId: 'var-control',
      variantKey: 'control',
    }),
    createEvent({
      submissionId: 'sub-1',
      event: 'step_viewed',
      timestamp: baseTimestamp + 2_000,
      stepId: 'intro',
      metadata: { stepTitle: 'Introduction' },
    }),
    createEvent({
      submissionId: 'sub-1',
      event: 'field_error',
      timestamp: baseTimestamp + 3_000,
      fieldKey: 'email',
      metadata: { fieldLabel: 'Email address', error: 'Email is required' },
    }),
    createEvent({
      submissionId: 'sub-1',
      event: 'step_completed',
      timestamp: baseTimestamp + 4_000,
      stepId: 'intro',
    }),
    createEvent({
      submissionId: 'sub-1',
      event: 'step_viewed',
      timestamp: baseTimestamp + 5_000,
      stepId: 'details',
      metadata: { stepTitle: 'Details' },
    }),
    createEvent({
      submissionId: 'sub-1',
      event: 'form_abandoned',
      timestamp: baseTimestamp + 6_000,
      stepId: 'details',
      variantId: 'var-control',
      variantKey: 'control',
    }),
    createEvent({
      submissionId: 'sub-2',
      event: 'variant_assigned',
      timestamp: baseTimestamp + 7_000,
      experimentId: 'exp-1',
      variantId: 'var-guided',
      variantKey: 'guided',
      metadata: { variantLabel: 'Guided' },
    }),
    createEvent({
      submissionId: 'sub-2',
      event: 'form_started',
      timestamp: baseTimestamp + 8_000,
      variantId: 'var-guided',
      variantKey: 'guided',
    }),
    createEvent({
      submissionId: 'sub-2',
      event: 'step_viewed',
      timestamp: baseTimestamp + 9_000,
      stepId: 'intro',
      metadata: { stepTitle: 'Introduction' },
    }),
    createEvent({
      submissionId: 'sub-2',
      event: 'step_completed',
      timestamp: baseTimestamp + 12_000,
      stepId: 'intro',
    }),
    createEvent({
      submissionId: 'sub-2',
      event: 'form_completed',
      timestamp: baseTimestamp + 14_000,
      variantId: 'var-guided',
      variantKey: 'guided',
    }),
    createEvent({
      formId: 'form-2',
      submissionId: 'sub-3',
      event: 'form_started',
      timestamp: baseTimestamp + 15_000,
    }),
  ]
}

describe('buildAnalyticsSummary', () => {
  it('aggregates funnel, field, activity, and experiment metrics', () => {
    const summary = buildAnalyticsSummary(createAnalyticsFixtures(), {
      stepTitles: {
        intro: 'Introduction',
        details: 'Details',
      },
      fieldLabels: {
        email: 'Email address',
      },
    })

    expect(summary.totalForms).toBe(2)
    expect(summary.totalSubmissions).toBe(3)
    expect(summary.totalStarts).toBe(3)
    expect(summary.totalCompletions).toBe(1)
    expect(summary.completionRate).toBeCloseTo(1 / 3, 5)
    expect(summary.abandonmentRate).toBeCloseTo(1 / 3, 5)
    expect(summary.averageCompletionTimeMs).toBe(5_500)
    expect(summary.stepFunnel).toEqual([
      {
        stepId: 'intro',
        stepTitle: 'Introduction',
        count: 2,
        dropOff: 1,
      },
      {
        stepId: 'details',
        stepTitle: 'Details',
        count: 1,
        dropOff: 0,
      },
    ])
    expect(summary.fieldErrors).toEqual([
      {
        fieldKey: 'email',
        fieldLabel: 'Email address',
        errorCount: 1,
      },
    ])
    expect(summary.recentActivity[0]).toEqual({
      type: 'form_started',
      description: 'Form started',
      timestamp: new Date(baseTimestamp + 15_000).toISOString(),
    })
    expect(summary.recentActivity.map((item) => item.description)).toEqual(
      expect.arrayContaining([
        'Variant assigned: guided',
        'Form abandoned at details',
        'Form completed (guided)',
        'Field error on email',
      ]),
    )
    expect(summary.variantComparison).toEqual([
      {
        variantId: 'var-control',
        variantKey: 'control',
        variantLabel: 'Control',
        starts: 1,
        completions: 0,
        completionRate: 0,
        abandonmentRate: 1,
      },
      {
        variantId: 'var-guided',
        variantKey: 'guided',
        variantLabel: 'Guided',
        starts: 1,
        completions: 1,
        completionRate: 1,
        abandonmentRate: 0,
      },
    ])
  })
})

describe('createAnalyticsStore', () => {
  it('tracks, filters, summarizes, and clears form analytics', () => {
    const store = createAnalyticsStore()
    const events = createAnalyticsFixtures()

    for (const event of events) {
      store.track(event)
    }

    expect(store.getEvents('form-1')).toHaveLength(12)
    expect(
      store.getEvents('form-1', {
        from: baseTimestamp + 2_500,
        to: baseTimestamp + 5_500,
      }),
    ).toHaveLength(3)
    expect(store.getEvents('form-1', { event: 'field_error' })).toEqual([
      expect.objectContaining({
        fieldKey: 'email',
        event: 'field_error',
      }),
    ])

    expect(store.getFormStats('form-1')).toEqual({
      totalStarts: 2,
      totalCompletions: 1,
      completionRate: 0.5,
      averageTimeMs: 5_500,
      abandonmentRate: 0.5,
      topAbandonmentSteps: [{ stepId: 'details', count: 1 }],
    })

    expect(store.getStepStats('form-1')).toEqual([
      {
        stepId: 'intro',
        views: 2,
        completions: 2,
        averageTimeMs: 2_500,
        dropOffRate: 0,
      },
      {
        stepId: 'details',
        views: 1,
        completions: 0,
        averageTimeMs: 0,
        dropOffRate: 1,
      },
    ])

    expect(store.getFieldErrorStats('form-1')).toEqual([
      {
        fieldKey: 'email',
        errorCount: 1,
        errorRate: 1 / 12,
        topErrors: [{ message: 'Email is required', count: 1 }],
      },
    ])

    expect(store.getAnalyticsSummary('form-1')).toMatchObject({
      totalForms: 1,
      totalSubmissions: 2,
      totalStarts: 2,
      totalCompletions: 1,
    })
    expect(store.getAnalyticsSummary()).toMatchObject({
      totalForms: 2,
      totalSubmissions: 3,
    })

    store.clear('form-1')
    expect(store.getEvents('form-1')).toEqual([])
  })
})

describe('createAnalyticsMiddleware', () => {
  it('tracks analytics events and returns a success response', async () => {
    const tracker = { track: vi.fn().mockResolvedValue(undefined) }
    const req = {
      params: { formId: 'form-1' },
      headers: { 'x-tenant-id': 'tenant-header' },
      body: {
        submissionId: 'sub-1',
        event: 'form_started',
        stepId: 'intro',
        metadata: { source: 'playwright' },
      },
    }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const next = vi.fn()

    await createAnalyticsMiddleware(tracker)(req, res, next)

    expect(tracker.track).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-header',
      formId: 'form-1',
      submissionId: 'sub-1',
      event: 'form_started',
      stepId: 'intro',
      metadata: { source: 'playwright' },
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
    expect(next).toHaveBeenCalled()
  })

  it('returns an error response when tracking fails', async () => {
    const tracker = { track: vi.fn().mockRejectedValue(new Error('storage unavailable')) }
    const req = {
      params: {},
      headers: {},
      body: {
        tenantId: 'tenant-body',
        formId: 'form-9',
        event: 'field_error',
        fieldKey: 'email',
      },
    }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const next = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await createAnalyticsMiddleware(tracker)(req, res, next)

    expect(consoleError).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Failed to track event',
    })
    expect(next).toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
