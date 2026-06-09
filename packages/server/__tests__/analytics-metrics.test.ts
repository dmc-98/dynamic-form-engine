import { describe, it, expect } from 'vitest'
import { buildAnalyticsSummary } from '../src/analytics'
import type { ServerFormAnalyticsEvent } from '../src/adapters'

// ─── M4: the five core form-analytics metrics must all be derivable ──────────
// Visits, Average Duration, Complete %, Exit %, and Validation Error count.
// This test pins that the summary yields all five.

let t = 1_000
const at = () => (t += 1000)

function ev(over: Partial<ServerFormAnalyticsEvent>): ServerFormAnalyticsEvent {
  return { formId: 'f1', event: 'form_started', timestamp: at(), ...over } as ServerFormAnalyticsEvent
}

describe('buildAnalyticsSummary — core form metrics', () => {
  it('derives visits, completion, exit, duration, and validation errors', () => {
    const events: ServerFormAnalyticsEvent[] = [
      // submission 1: started → completed (clean), ~3s
      ev({ submissionId: 's1', event: 'form_started', timestamp: 1000 }),
      ev({ submissionId: 's1', event: 'step_viewed', stepId: 'step1', timestamp: 1500 }),
      ev({ submissionId: 's1', event: 'step_completed', stepId: 'step1', timestamp: 3000 }),
      ev({ submissionId: 's1', event: 'form_completed', timestamp: 4000 }),
      // submission 2: started → abandoned at step1, with a field error
      ev({ submissionId: 's2', event: 'form_started', timestamp: 2000 }),
      ev({ submissionId: 's2', event: 'field_error', fieldKey: 'email', timestamp: 2500, metadata: { error: 'Invalid email' } }),
      ev({ submissionId: 's2', event: 'form_abandoned', stepId: 'step1', timestamp: 3000 }),
    ]
    const s = buildAnalyticsSummary(events)

    // Visit (starts)
    expect(s.totalStarts).toBe(2)
    // Complete %
    expect(s.totalCompletions).toBe(1)
    expect(s.completionRate).toBeCloseTo(0.5)
    // Exit % (abandonment)
    expect(s.abandonmentRate).toBeCloseTo(0.5)
    // Average duration = time on form across finished sessions, completed OR
    // abandoned (duration is counted regardless of outcome):
    //   s1: completed 4000-1000 = 3000ms; s2: abandoned 3000-2000 = 1000ms → avg 2000.
    expect(s.averageCompletionTimeMs).toBe(2000)
    // Validation errors
    expect(s.fieldErrors.find(f => f.fieldKey === 'email')?.errorCount).toBe(1)
  })

  it('zero-safe on no events', () => {
    const s = buildAnalyticsSummary([])
    expect(s.totalStarts).toBe(0)
    expect(s.completionRate).toBe(0)
    expect(s.abandonmentRate).toBe(0)
    expect(s.averageCompletionTimeMs).toBe(0)
  })

  it('builds a step funnel for drop-off analysis', () => {
    const events: ServerFormAnalyticsEvent[] = [
      ev({ submissionId: 'a', event: 'step_viewed', stepId: 'step1', timestamp: 1000 }),
      ev({ submissionId: 'a', event: 'step_completed', stepId: 'step1', timestamp: 2000 }),
      ev({ submissionId: 'a', event: 'step_viewed', stepId: 'step2', timestamp: 2500 }),
    ]
    const s = buildAnalyticsSummary(events)
    expect(s.stepFunnel.length).toBeGreaterThanOrEqual(2)
  })
})
