import React, { useState, useEffect } from 'react'
import type { DashboardConfig, SubmissionSummary } from '../types'
import { useDashboardApi } from '../hooks/useDashboardApi'

export interface SubmissionsListProps {
  config: DashboardConfig
}

/**
 * Table component displaying form submissions with filtering and detail view.
 */
export const SubmissionsList: React.FC<SubmissionsListProps> = ({ config }) => {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionSummary | null>(null)

  const { listSubmissions } = useDashboardApi(config)

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true)
      const response = await listSubmissions()
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setSubmissions(response.data)
      }
      setLoading(false)
    }

    fetchSubmissions()
  }, [listSubmissions])

  // Filter submissions based on status
  useEffect(() => {
    let filtered = submissions

    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter)
    }

    setFilteredSubmissions(filtered)
  }, [submissions, statusFilter])

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return '#ff9800'
      case 'COMPLETED':
        return '#4caf50'
      case 'ABANDONED':
        return '#d32f2f'
      default:
        return '#666'
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', color: '#666' }}>Loading submissions...</div>
  }

  if (error) {
    return (
      <div style={{ color: '#d32f2f', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
        Error loading submissions: {error.message}
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
          }}
        >
          <option value="all">All Status</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="ABANDONED">Abandoned</option>
        </select>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
        {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
      </div>

      {/* Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
              ID
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
              Form ID
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
              User ID
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
              Variant
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
              Status
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
              Current Step
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredSubmissions.map((submission) => (
            <tr
              key={submission.id}
              style={{
                borderBottom: '1px solid #e0e0e0',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => setSelectedSubmission(submission)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fafafa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff'
              }}
            >
              <td
                style={{
                  padding: '12px 16px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: '#0066cc',
                }}
              >
                {submission.id.substring(0, 8)}...
              </td>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                {submission.formId.substring(0, 8)}...
              </td>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                {submission.userId.substring(0, 8)}...
              </td>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                {submission.variantKey || '—'}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(submission.status) + '20',
                    color: getStatusColor(submission.status),
                    fontWeight: '500',
                    fontSize: '12px',
                  }}
                >
                  {submission.status === 'IN_PROGRESS'
                    ? 'In Progress'
                    : submission.status === 'COMPLETED'
                      ? 'Completed'
                      : 'Abandoned'}
                </span>
              </td>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                {submission.currentStepId || '—'}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                {new Date(submission.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredSubmissions.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: '#999',
            backgroundColor: '#fff',
            borderRadius: '8px',
          }}
        >
          No submissions found
        </div>
      )}

      {/* Detail modal */}
      {selectedSubmission && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>Submission Details</h2>
            <div style={{ marginBottom: '15px' }}>
              <strong>ID:</strong> {selectedSubmission.id}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Form ID:</strong> {selectedSubmission.formId}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>User ID:</strong> {selectedSubmission.userId}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Status:</strong> {selectedSubmission.status}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Tenant:</strong> {selectedSubmission.tenantId || 'N/A'}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Variant:</strong> {selectedSubmission.variantKey || 'N/A'}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Current Step:</strong> {selectedSubmission.currentStepId || 'N/A'}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Created:</strong> {new Date(selectedSubmission.createdAt).toLocaleString()}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Updated:</strong> {new Date(selectedSubmission.updatedAt).toLocaleString()}
            </div>
            <button
              onClick={() => setSelectedSubmission(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '20px',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
