import React, { useState, useEffect } from 'react'
import type { DashboardConfig, FormSummary } from '../types'
import { useDashboardApi } from '../hooks/useDashboardApi'

export interface FormsListProps {
  config: DashboardConfig
  onFormEdit?: (formId: string) => void
}

/**
 * Table component displaying all forms with filtering and actions.
 */
export const FormsList: React.FC<FormsListProps> = ({ config, onFormEdit }) => {
  const [forms, setForms] = useState<FormSummary[]>([])
  const [filteredForms, setFilteredForms] = useState<FormSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>(
    'all'
  )

  const { listForms } = useDashboardApi(config)

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true)
      const response = await listForms()
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setForms(response.data)
      }
      setLoading(false)
    }

    fetchForms()
  }, [listForms])

  // Filter forms based on search and status
  useEffect(() => {
    let filtered = forms

    if (searchQuery) {
      filtered = filtered.filter((form) =>
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((form) => form.status === statusFilter)
    }

    setFilteredForms(filtered)
  }, [forms, searchQuery, statusFilter])

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return '#999'
      case 'published':
        return '#0066cc'
      case 'archived':
        return '#666'
      default:
        return '#000'
    }
  }

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  if (loading) {
    return <div style={{ textAlign: 'center', color: '#666' }}>Loading forms...</div>
  }

  if (error) {
    return (
      <div style={{ color: '#d32f2f', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
        Error loading forms: {error.message}
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by title or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
            minWidth: '300px',
          }}
        />

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
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
        {filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''} found
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
              Title
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
              Status
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
              Submissions
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
              Completion %
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
              Created
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredForms.map((form) => (
            <tr
              key={form.id}
              style={{
                borderBottom: '1px solid #e0e0e0',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
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
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#1a1a1a',
                }}
              >
                {form.title}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(form.status) + '20',
                    color: getStatusColor(form.status),
                    fontWeight: '500',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                  }}
                >
                  {form.status}
                </span>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                {form.submissionCount}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                {formatPercent(form.completionRate)}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                {new Date(form.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                {onFormEdit && (
                  <button
                    onClick={() => onFormEdit(form.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#0066cc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredForms.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: '#999',
            backgroundColor: '#fff',
            borderRadius: '8px',
          }}
        >
          No forms found
        </div>
      )}
    </div>
  )
}
