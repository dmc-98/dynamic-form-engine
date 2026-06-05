import { useCallback } from 'react'
import type { AnalyticsData, DashboardConfig, FormSummary, SubmissionSummary } from '../types'

interface ApiResponse<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
  total?: number
}

interface DfeFormListItem {
  id: string
  tenantId?: string | null
  slug: string
  title: string
  description?: string | null
  versionId: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  submissionCount?: number
  completionRate?: number
  createdAt: string
  updatedAt: string
}

function toFormSummary(item: DfeFormListItem): FormSummary {
  return {
    id: item.id,
    tenantId: item.tenantId ?? null,
    slug: item.slug,
    title: item.title,
    status: item.status.toLowerCase() as FormSummary['status'],
    submissionCount: item.submissionCount ?? 0,
    completionRate: item.completionRate ?? 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

/**
 * Hook for interacting with the Dynamic Form Engine dashboard API.
 * Provides methods to fetch forms, submissions, and analytics data.
 */
export function useDashboardApi(config: DashboardConfig) {
  const fetchFn = config.fetchFn || (typeof fetch !== 'undefined' ? fetch : undefined)
  const dfePrefix = config.dfePrefix ?? '/dfe'

  const makeRequest = useCallback(
    async <T,>(endpoint: string): Promise<T | null> => {
      if (!fetchFn) throw new Error('fetch is not available')

      const url = new URL(endpoint, config.baseUrl).toString()
      const response = await fetchFn(url, {
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      return response.json() as Promise<T>
    },
    [config.baseUrl, config.headers, fetchFn],
  )

  const listForms = useCallback(async (): Promise<ApiResponse<FormSummary[]>> => {
    try {
      const result = await makeRequest<PaginatedResult<DfeFormListItem>>(`${dfePrefix}/forms`)
      return {
        data: (result?.items ?? []).map(toFormSummary),
        loading: false,
        error: null,
      }
    } catch (err) {
      return { data: null, loading: false, error: err as Error }
    }
  }, [dfePrefix, makeRequest])

  const getForm = useCallback(
    async (formId: string): Promise<ApiResponse<FormSummary>> => {
      try {
        const result = await makeRequest<DfeFormListItem>(`${dfePrefix}/forms/id/${formId}`)
        return {
          data: result ? toFormSummary(result) : null,
          loading: false,
          error: null,
        }
      } catch (err) {
        return { data: null, loading: false, error: err as Error }
      }
    },
    [dfePrefix, makeRequest],
  )

  const listSubmissions = useCallback(
    async (formId?: string): Promise<ApiResponse<SubmissionSummary[]>> => {
      try {
        const endpoint = formId
          ? `${dfePrefix}/submissions?formId=${encodeURIComponent(formId)}`
          : `${dfePrefix}/submissions`
        const result = await makeRequest<SubmissionSummary[]>(endpoint)
        return { data: result ?? [], loading: false, error: null }
      } catch (err) {
        return { data: null, loading: false, error: err as Error }
      }
    },
    [dfePrefix, makeRequest],
  )

  const getSubmission = useCallback(
    async (submissionId: string): Promise<ApiResponse<SubmissionSummary>> => {
      try {
        const result = await makeRequest<SubmissionSummary>(`${dfePrefix}/submissions/${submissionId}`)
        return { data: result, loading: false, error: null }
      } catch (err) {
        return { data: null, loading: false, error: err as Error }
      }
    },
    [dfePrefix, makeRequest],
  )

  const getAnalytics = useCallback(
    async (formId?: string): Promise<ApiResponse<AnalyticsData>> => {
      try {
        const endpoint = formId
          ? `${dfePrefix}/analytics?formId=${encodeURIComponent(formId)}`
          : `${dfePrefix}/analytics`
        const result = await makeRequest<AnalyticsData>(endpoint)
        return { data: result, loading: false, error: null }
      } catch (err) {
        return { data: null, loading: false, error: err as Error }
      }
    },
    [dfePrefix, makeRequest],
  )

  return {
    listForms,
    getForm,
    listSubmissions,
    getSubmission,
    getAnalytics,
  }
}
