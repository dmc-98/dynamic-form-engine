import type {
  AnalyticsRecentActivity,
  AnalyticsSummary,
  ServerFormAnalyticsEvent,
  VariantAnalyticsSummary,
} from './adapters'
import type {
  ComplianceAnalyticsOptions,
  ProtectedFieldPolicy,
} from './compliance'
import {
  sanitizeAnalyticsEventForCompliance,
} from './compliance'

export interface AnalyticsStore {
  track(event: ServerFormAnalyticsEvent): void | Promise<void>
  getEvents(formId: string, options?: { from?: number; to?: number; event?: string }): ServerFormAnalyticsEvent[]
  getFormStats(formId: string): FormStats
  getStepStats(formId: string): StepStats[]
  getFieldErrorStats(formId: string): FieldErrorStats[]
  getAnalyticsSummary(formId?: string): AnalyticsSummary
  clear(formId: string): void
}

export interface FormStats {
  totalStarts: number
  totalCompletions: number
  completionRate: number
  averageTimeMs: number
  abandonmentRate: number
  topAbandonmentSteps: Array<{ stepId: string; count: number }>
}

export interface StepStats {
  stepId: string
  views: number
  completions: number
  averageTimeMs: number
  dropOffRate: number
}

export interface FieldErrorStats {
  fieldKey: string
  errorCount: number
  errorRate: number
  topErrors: Array<{ message: string; count: number }>
}

function getSubmissionGroups(events: ServerFormAnalyticsEvent[]) {
  const groups = new Map<string, ServerFormAnalyticsEvent[]>()

  for (const event of events) {
    if (!event.submissionId) continue
    if (!groups.has(event.submissionId)) {
      groups.set(event.submissionId, [])
    }
    groups.get(event.submissionId)!.push(event)
  }

  for (const group of groups.values()) {
    group.sort((a, b) => a.timestamp - b.timestamp)
  }

  return groups
}

function describeActivity(event: ServerFormAnalyticsEvent): string {
  switch (event.event) {
    case 'form_started':
      return `Form started${event.variantKey ? ` (${event.variantKey})` : ''}`
    case 'step_viewed':
      return `Viewed step ${event.stepId ?? 'unknown'}`
    case 'step_completed':
      return `Completed step ${event.stepId ?? 'unknown'}`
    case 'field_error':
      return `Field error on ${event.fieldKey ?? 'unknown'}`
    case 'form_completed':
      return `Form completed${event.variantKey ? ` (${event.variantKey})` : ''}`
    case 'form_abandoned':
      return `Form abandoned${event.stepId ? ` at ${event.stepId}` : ''}`
    case 'variant_assigned':
      return `Variant assigned: ${event.variantKey ?? 'unknown'}`
    default:
      return event.event
  }
}

function buildRecentActivity(events: ServerFormAnalyticsEvent[]): AnalyticsRecentActivity[] {
  return [...events]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
    .map((event) => ({
      type: event.event,
      description: describeActivity(event),
      timestamp: new Date(event.timestamp).toISOString(),
    }))
}

function buildVariantComparison(events: ServerFormAnalyticsEvent[]): VariantAnalyticsSummary[] {
  const grouped = new Map<string, {
    variantId?: string
    variantKey: string
    variantLabel: string
    starts: number
    completions: number
    abandonments: number
  }>()

  for (const event of events) {
    if (!event.variantKey) continue

    const key = event.variantKey
    if (!grouped.has(key)) {
      grouped.set(key, {
        variantId: event.variantId,
        variantKey: key,
        variantLabel: String(event.metadata?.variantLabel ?? key),
        starts: 0,
        completions: 0,
        abandonments: 0,
      })
    }

    const stats = grouped.get(key)!
    if (event.event === 'form_started') stats.starts++
    if (event.event === 'form_completed') stats.completions++
    if (event.event === 'form_abandoned') stats.abandonments++
  }

  return Array.from(grouped.values())
    .map((stats) => ({
      variantId: stats.variantId,
      variantKey: stats.variantKey,
      variantLabel: stats.variantLabel,
      starts: stats.starts,
      completions: stats.completions,
      completionRate: stats.starts > 0 ? stats.completions / stats.starts : 0,
      abandonmentRate: stats.starts > 0 ? stats.abandonments / stats.starts : 0,
    }))
    .sort((a, b) => b.starts - a.starts)
}

export function buildAnalyticsSummary(
  events: ServerFormAnalyticsEvent[],
  options?: {
    totalForms?: number
    stepTitles?: Record<string, string>
    fieldLabels?: Record<string, string>
  },
): AnalyticsSummary {
  const orderedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const submissionGroups = getSubmissionGroups(orderedEvents)

  const totalForms = options?.totalForms ?? new Set(orderedEvents.map((event) => event.formId)).size
  const totalSubmissions = submissionGroups.size
  const totalStarts = orderedEvents.filter((event) => event.event === 'form_started').length
  const totalCompletions = orderedEvents.filter((event) => event.event === 'form_completed').length
  const totalAbandonments = orderedEvents.filter((event) => event.event === 'form_abandoned').length

  const completionTimes: number[] = []
  const topAbandonmentSteps = new Map<string, number>()
  const stepAggregation = new Map<string, {
    title: string
    views: number
    completions: number
    times: number[]
    firstSeen: number
  }>()
  const fieldErrors = new Map<string, {
    label: string
    count: number
    errors: Map<string, number>
  }>()

  for (const submissionEvents of submissionGroups.values()) {
    const startEvent = submissionEvents.find((event) => event.event === 'form_started')
    const endEvent = submissionEvents.find((event) =>
      event.event === 'form_completed' || event.event === 'form_abandoned'
    )

    if (startEvent && endEvent) {
      completionTimes.push(endEvent.timestamp - startEvent.timestamp)
    }

    const stepStartTimes = new Map<string, number>()

    for (const event of submissionEvents) {
      if (event.stepId) {
        if (!stepAggregation.has(event.stepId)) {
          stepAggregation.set(event.stepId, {
            title: options?.stepTitles?.[event.stepId]
              ?? String(event.metadata?.stepTitle ?? event.stepId),
            views: 0,
            completions: 0,
            times: [],
            firstSeen: event.timestamp,
          })
        }
      }

      if (event.event === 'step_viewed' && event.stepId) {
        const step = stepAggregation.get(event.stepId)!
        step.views++
        step.firstSeen = Math.min(step.firstSeen, event.timestamp)
        stepStartTimes.set(event.stepId, event.timestamp)
      }

      if (event.event === 'step_completed' && event.stepId) {
        const step = stepAggregation.get(event.stepId)!
        step.completions++
        step.firstSeen = Math.min(step.firstSeen, event.timestamp)
        if ((step.views === 0)) {
          step.views = step.completions
        }

        const startedAt = stepStartTimes.get(event.stepId)
        if (startedAt) {
          step.times.push(event.timestamp - startedAt)
        }
      }

      if (event.event === 'field_error' && event.fieldKey) {
        if (!fieldErrors.has(event.fieldKey)) {
          fieldErrors.set(event.fieldKey, {
            label: options?.fieldLabels?.[event.fieldKey]
              ?? String(event.metadata?.fieldLabel ?? event.fieldKey),
            count: 0,
            errors: new Map<string, number>(),
          })
        }

        const fieldStats = fieldErrors.get(event.fieldKey)!
        fieldStats.count++
        const errorMessage = String(event.metadata?.error ?? 'Unknown error')
        fieldStats.errors.set(errorMessage, (fieldStats.errors.get(errorMessage) ?? 0) + 1)
      }

      if (event.event === 'form_abandoned' && event.stepId) {
        topAbandonmentSteps.set(event.stepId, (topAbandonmentSteps.get(event.stepId) ?? 0) + 1)
      }
    }
  }

  const orderedSteps = Array.from(stepAggregation.entries())
    .sort((a, b) => a[1].firstSeen - b[1].firstSeen)
    .map(([stepId, stats], index, array) => {
      const count = stats.views > 0 ? stats.views : stats.completions
      const nextCount = array[index + 1]?.[1]
      const dropOff = nextCount ? Math.max(count - (nextCount.views || nextCount.completions), 0) : 0

      return {
        stepId,
        stepTitle: stats.title,
        count,
        dropOff,
      }
    })

  const orderedFieldErrors = Array.from(fieldErrors.entries())
    .map(([fieldKey, stats]) => ({
      fieldKey,
      fieldLabel: stats.label,
      errorCount: stats.count,
    }))
    .sort((a, b) => b.errorCount - a.errorCount)

  const averageCompletionTimeMs = completionTimes.length > 0
    ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
    : 0

  return {
    totalForms,
    totalSubmissions,
    totalStarts,
    totalCompletions,
    completionRate: totalStarts > 0 ? totalCompletions / totalStarts : 0,
    abandonmentRate: totalStarts > 0 ? totalAbandonments / totalStarts : 0,
    averageCompletionTimeMs,
    stepFunnel: orderedSteps,
    fieldErrors: orderedFieldErrors,
    recentActivity: buildRecentActivity(orderedEvents),
    variantComparison: buildVariantComparison(orderedEvents),
  }
}

export function createAnalyticsStore(options?: {
  compliance?: ComplianceAnalyticsOptions & {
    fieldPolicies?: ProtectedFieldPolicy[]
  }
}): AnalyticsStore {
  const eventsByForm = new Map<string, ServerFormAnalyticsEvent[]>()
  const complianceOptions = options?.compliance

  return {
    track(event: ServerFormAnalyticsEvent): void {
      const nextEvent = complianceOptions?.fieldPolicies
        ? sanitizeAnalyticsEventForCompliance(event, complianceOptions.fieldPolicies, complianceOptions)
        : event

      if (!nextEvent) {
        return
      }

      if (!eventsByForm.has(nextEvent.formId)) {
        eventsByForm.set(nextEvent.formId, [])
      }
      eventsByForm.get(nextEvent.formId)!.push(nextEvent)
    },

    getEvents(formId: string, options?: { from?: number; to?: number; event?: string }): ServerFormAnalyticsEvent[] {
      const events = eventsByForm.get(formId) ?? []

      return events.filter((event) => {
        if (options?.from && event.timestamp < options.from) return false
        if (options?.to && event.timestamp > options.to) return false
        if (options?.event && event.event !== options.event) return false
        return true
      })
    },

    getFormStats(formId: string): FormStats {
      const events = eventsByForm.get(formId) ?? []
      const summary = buildAnalyticsSummary(events, { totalForms: events.length > 0 ? 1 : 0 })
      const abandonmentMap = new Map<string, number>()

      for (const event of events) {
        if (event.event === 'form_abandoned' && event.stepId) {
          abandonmentMap.set(event.stepId, (abandonmentMap.get(event.stepId) ?? 0) + 1)
        }
      }

      return {
        totalStarts: summary.totalStarts,
        totalCompletions: summary.totalCompletions,
        completionRate: summary.completionRate,
        averageTimeMs: summary.averageCompletionTimeMs,
        abandonmentRate: summary.abandonmentRate,
        topAbandonmentSteps: Array.from(abandonmentMap.entries())
          .map(([stepId, count]) => ({ stepId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      }
    },

    getStepStats(formId: string): StepStats[] {
      const events = eventsByForm.get(formId) ?? []
      const submissionGroups = getSubmissionGroups(events)
      const stepStats = new Map<string, StepStats>()

      for (const submissionEvents of submissionGroups.values()) {
        const stepStartTimes = new Map<string, number>()

        for (const event of submissionEvents) {
          if (!event.stepId) continue

          if (!stepStats.has(event.stepId)) {
            stepStats.set(event.stepId, {
              stepId: event.stepId,
              views: 0,
              completions: 0,
              averageTimeMs: 0,
              dropOffRate: 0,
            })
          }

          const stats = stepStats.get(event.stepId)!

          if (event.event === 'step_viewed') {
            stats.views++
            stepStartTimes.set(event.stepId, event.timestamp)
          }

          if (event.event === 'step_completed') {
            stats.completions++
            if (stats.views === 0) {
              stats.views = stats.completions
            }

            const startedAt = stepStartTimes.get(event.stepId)
            if (startedAt) {
              const duration = event.timestamp - startedAt
              stats.averageTimeMs = stats.averageTimeMs === 0
                ? duration
                : Math.round((stats.averageTimeMs + duration) / 2)
            }
          }
        }
      }

      return Array.from(stepStats.values()).map((stats) => ({
        ...stats,
        dropOffRate: stats.views > 0 ? 1 - (stats.completions / stats.views) : 0,
      }))
    },

    getFieldErrorStats(formId: string): FieldErrorStats[] {
      const events = eventsByForm.get(formId) ?? []
      const totalEvents = events.length || 1
      const grouped = new Map<string, FieldErrorStats>()

      for (const event of events) {
        if (event.event !== 'field_error' || !event.fieldKey) continue

        if (!grouped.has(event.fieldKey)) {
          grouped.set(event.fieldKey, {
            fieldKey: event.fieldKey,
            errorCount: 0,
            errorRate: 0,
            topErrors: [],
          })
        }

        const stats = grouped.get(event.fieldKey)!
        stats.errorCount++

        const errorMessage = String(event.metadata?.error ?? 'Unknown error')
        const existing = stats.topErrors.find((item) => item.message === errorMessage)
        if (existing) {
          existing.count++
        } else {
          stats.topErrors.push({ message: errorMessage, count: 1 })
        }
      }

      return Array.from(grouped.values())
        .map((stats) => ({
          ...stats,
          errorRate: stats.errorCount / totalEvents,
          topErrors: [...stats.topErrors].sort((a, b) => b.count - a.count).slice(0, 5),
        }))
        .sort((a, b) => b.errorCount - a.errorCount)
    },

    getAnalyticsSummary(formId?: string): AnalyticsSummary {
      const events = formId
        ? (eventsByForm.get(formId) ?? [])
        : Array.from(eventsByForm.values()).flat()

      return buildAnalyticsSummary(events, {
        totalForms: formId ? (events.length > 0 ? 1 : 0) : eventsByForm.size,
      })
    },

    clear(formId: string): void {
      eventsByForm.delete(formId)
    },
  }
}

export function createAnalyticsMiddleware(
  tracker: Pick<AnalyticsStore, 'track'>,
  options?: {
    compliance?: ComplianceAnalyticsOptions & {
      fieldPolicies?: ProtectedFieldPolicy[]
    }
  },
) {
  return async (req: any, res: any, next: any) => {
    const event: ServerFormAnalyticsEvent = {
      tenantId: req.body.tenantId ?? req.headers['x-tenant-id'],
      formId: req.params.formId || req.body.formId || 'unknown',
      submissionId: req.body.submissionId,
      event: req.body.event,
      stepId: req.body.stepId,
      fieldKey: req.body.fieldKey,
      timestamp: req.body.timestamp || Date.now(),
      experimentId: req.body.experimentId,
      variantId: req.body.variantId,
      variantKey: req.body.variantKey,
      metadata: req.body.metadata,
    }

    try {
      const nextEvent = options?.compliance?.fieldPolicies
        ? sanitizeAnalyticsEventForCompliance(event, options.compliance.fieldPolicies, options.compliance)
        : event

      if (nextEvent) {
        await tracker.track(nextEvent)
      }
      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Failed to track analytics event:', error)
      res.status(500).json({ success: false, error: 'Failed to track event' })
    }

    next?.()
  }
}
