import React, { useState } from 'react'
import type { DashboardConfig, DashboardView } from '../types'
import { FormsList } from './FormsList'
import { SubmissionsList } from './SubmissionsList'
import { AnalyticsPanel } from './AnalyticsPanel'
import { TemplateGallery } from './TemplateGallery'

export interface DfeDashboardProps {
  config: DashboardConfig
  onFormEdit?: (formId: string) => void
  onFormCreate?: () => void
}

/**
 * Main dashboard layout component for the Dynamic Form Engine.
 * Provides navigation between Forms, Submissions, Analytics, and Templates views.
 */
export const DfeDashboard: React.FC<DfeDashboardProps> = ({
  config,
  onFormEdit,
  onFormCreate,
}) => {
  const [currentView, setCurrentView] = useState<DashboardView>('forms')

  const navItems: Array<{ id: DashboardView; label: string; icon: string }> = [
    { id: 'forms', label: 'Forms', icon: '📋' },
    { id: 'submissions', label: 'Submissions', icon: '📝' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'templates', label: 'Templates', icon: '📦' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '220px',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          padding: '20px',
          borderRight: '1px solid #333',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '30px' }}>
          DFE Dashboard
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                padding: '10px 12px',
                backgroundColor: currentView === item.id ? '#0066cc' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (currentView !== item.id) {
                  e.currentTarget.style.backgroundColor = '#333'
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f5f5',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '20px 30px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>
            {navItems.find((item) => item.id === currentView)?.label}
          </h1>

          {currentView === 'forms' && onFormCreate && (
            <button
              onClick={onFormCreate}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Create Form
            </button>
          )}
        </header>

        {/* View Content */}
        <div style={{ padding: '30px', flex: 1, overflow: 'auto' }}>
          {currentView === 'forms' && (
            <FormsList config={config} onFormEdit={onFormEdit} />
          )}
          {currentView === 'submissions' && <SubmissionsList config={config} />}
          {currentView === 'analytics' && <AnalyticsPanel config={config} />}
          {currentView === 'templates' && <TemplateGallery />}
        </div>
      </main>
    </div>
  )
}
