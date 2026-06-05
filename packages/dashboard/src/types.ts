export interface DashboardConfig {
  baseUrl: string
  fetchFn?: typeof fetch
  headers?: Record<string, string>
  dfePrefix?: string
}

export interface FormSummary {
  id: string
  tenantId?: string | null
  slug: string
  title: string
  status: 'draft' | 'published' | 'archived'
  submissionCount: number
  completionRate: number
  createdAt: string
  updatedAt: string
}

export interface SubmissionSummary {
  id: string
  tenantId?: string | null
  formId: string
  userId: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  currentStepId?: string
  experimentId?: string | null
  variantId?: string | null
  variantKey?: string | null
  createdAt: string
  updatedAt: string
}

export interface AnalyticsData {
  totalForms: number
  totalSubmissions: number
  totalStarts: number
  totalCompletions: number
  completionRate: number
  abandonmentRate: number
  averageCompletionTimeMs: number
  stepFunnel: Array<{
    stepId: string
    stepTitle: string
    count: number
    dropOff: number
  }>
  fieldErrors: Array<{
    fieldKey: string
    fieldLabel: string
    errorCount: number
  }>
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
  variantComparison: Array<{
    variantId?: string
    variantKey: string
    variantLabel: string
    starts: number
    completions: number
    completionRate: number
    abandonmentRate: number
  }>
}

export type DashboardView = 'forms' | 'submissions' | 'analytics' | 'templates'
