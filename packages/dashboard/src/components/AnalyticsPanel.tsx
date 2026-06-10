import React, { useEffect, useState } from 'react'
import type { AnalyticsData, DashboardConfig } from '../types'
import { useDashboardApi } from '../hooks/useDashboardApi'

export interface AnalyticsPanelProps {
  config: DashboardConfig
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0m'
  }

  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 60) {
    return `${totalMinutes}m`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

/**
 * Analytics dashboard showing forms, submissions, completion rate, step funnel,
 * field errors, recent activity, and variant performance.
 */
export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ config }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { getAnalytics } = useDashboardApi(config)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      const response = await getAnalytics()
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setAnalytics(response.data)
      }
      setLoading(false)
    }

    fetchAnalytics()
  }, [getAnalytics])

  if (loading) {
    return <div style={{ textAlign: 'center', color: 'var(--dfe-color-text-muted)' }}>Loading analytics...</div>
  }

  if (error) {
    return (
      <div style={{ color: 'var(--dfe-color-danger)', padding: '10px', backgroundColor: 'var(--dfe-color-danger-surface)', borderRadius: '4px' }}>
        Error loading analytics: {error.message}
      </div>
    )
  }

  if (!analytics) {
    return <div style={{ textAlign: 'center', color: 'var(--dfe-color-text-subtle)' }}>No analytics data available</div>
  }

  const maxFunnelCount = Math.max(...analytics.stepFunnel.map((step) => step.count), 1)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard label="Total Forms" value={String(analytics.totalForms)} accent="var(--dfe-color-text)" />
        <StatCard label="Starts" value={String(analytics.totalStarts)} accent="var(--dfe-color-primary)" />
        <StatCard label="Completions" value={String(analytics.totalCompletions)} accent="var(--dfe-color-success)" />
        <StatCard label="Completion Rate" value={formatPercent(analytics.completionRate)} accent="var(--dfe-color-success)" />
        <StatCard label="Abandonment Rate" value={formatPercent(analytics.abandonmentRate)} accent="var(--dfe-color-danger)" />
        <StatCard label="Avg Completion Time" value={formatDuration(analytics.averageCompletionTimeMs)} accent="var(--dfe-data-5)" />
      </div>

      <section style={panelStyle}>
        <h3 style={headingStyle}>Submission Funnel</h3>

        {analytics.stepFunnel.length === 0 ? (
          <div style={{ color: 'var(--dfe-color-text-subtle)' }}>No step data available</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {analytics.stepFunnel.map((step) => (
              <div key={step.stepId}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ fontWeight: '500' }}>{step.stepTitle}</span>
                  <span style={{ color: 'var(--dfe-color-text-muted)' }}>
                    {step.count} visits
                    {step.dropOff > 0 && <span style={{ color: 'var(--dfe-color-danger)', marginLeft: '8px' }}>(-{step.dropOff})</span>}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '24px',
                    backgroundColor: 'var(--dfe-color-surface-muted)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(step.count / maxFunnelCount) * 100}%`,
                      backgroundColor: 'var(--dfe-color-primary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <h3 style={headingStyle}>Variant Performance</h3>

        {analytics.variantComparison.length === 0 ? (
          <div style={{ color: 'var(--dfe-color-text-subtle)' }}>No active experiments recorded yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--dfe-color-border)' }}>
                <TableHeading>Variant</TableHeading>
                <TableHeading align="right">Starts</TableHeading>
                <TableHeading align="right">Completions</TableHeading>
                <TableHeading align="right">Completion</TableHeading>
                <TableHeading align="right">Abandonment</TableHeading>
              </tr>
            </thead>
            <tbody>
              {analytics.variantComparison.map((variant) => (
                <tr key={variant.variantId ?? variant.variantKey} style={{ borderBottom: '1px solid var(--dfe-color-surface-muted)' }}>
                  <td style={{ padding: '12px 0' }}>
                    <div style={{ fontWeight: 600 }}>{variant.variantLabel}</div>
                    <div style={{ fontSize: '12px', color: 'var(--dfe-color-text-muted)' }}>{variant.variantKey}</div>
                  </td>
                  <TableCell align="right">{variant.starts}</TableCell>
                  <TableCell align="right">{variant.completions}</TableCell>
                  <TableCell align="right">{formatPercent(variant.completionRate)}</TableCell>
                  <TableCell align="right">{formatPercent(variant.abandonmentRate)}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={panelStyle}>
        <h3 style={headingStyle}>Field Error Frequency</h3>

        {analytics.fieldErrors.length === 0 ? (
          <div style={{ color: 'var(--dfe-color-text-subtle)' }}>No field errors</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--dfe-color-border)' }}>
                <TableHeading>Field</TableHeading>
                <TableHeading align="right">Error Count</TableHeading>
              </tr>
            </thead>
            <tbody>
              {analytics.fieldErrors.map((field) => (
                <tr key={field.fieldKey} style={{ borderBottom: '1px solid var(--dfe-color-surface-muted)' }}>
                  <td style={{ padding: '10px 0', fontSize: '14px' }}>{field.fieldLabel}</td>
                  <TableCell align="right" color="var(--dfe-color-danger)">{field.errorCount}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={panelStyle}>
        <h3 style={headingStyle}>Recent Activity</h3>

        {analytics.recentActivity.length === 0 ? (
          <div style={{ color: 'var(--dfe-color-text-subtle)' }}>No recent activity</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.recentActivity.map((activity, index) => (
              <div
                key={`${activity.timestamp}-${index}`}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--dfe-color-surface-muted)',
                  borderLeft: '3px solid var(--dfe-color-primary)',
                  borderRadius: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px', color: 'var(--dfe-color-text)' }}>
                      {activity.type}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--dfe-color-text-muted)', marginTop: '4px' }}>
                      {activity.description}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dfe-color-text-subtle)', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--dfe-color-surface)',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  marginBottom: '40px',
}

const headingStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: '20px',
  fontSize: '16px',
  fontWeight: 600,
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--dfe-color-surface)',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ fontSize: '12px', color: 'var(--dfe-color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '30px', fontWeight: 'bold', color: accent }}>
        {value}
      </div>
    </div>
  )
}

function TableHeading({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      style={{
        padding: '10px 0',
        textAlign: align,
        fontWeight: 600,
        fontSize: '13px',
        color: 'var(--dfe-color-text-muted)',
      }}
    >
      {children}
    </th>
  )
}

function TableCell({
  children,
  align = 'left',
  color = 'var(--dfe-color-text)',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
  color?: string
}) {
  return (
    <td
      style={{
        padding: '10px 0',
        textAlign: align,
        fontSize: '14px',
        color,
        fontWeight: align === 'right' ? 600 : 400,
      }}
    >
      {children}
    </td>
  )
}
