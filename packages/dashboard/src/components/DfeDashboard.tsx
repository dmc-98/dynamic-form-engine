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
 * Main dashboard layout for the Dynamic Form Engine. Navigation between Forms,
 * Submissions, Analytics and Templates. Token-driven (Graphite & Teal): the
 * whole tree is scoped to [data-dfe-theme] so every child panel's `--dfe-*`
 * references resolve and dark mode works by setting data-dfe-color-scheme on an
 * ancestor.
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
    <div className="dfe-dashboard" data-dfe-theme style={shell}>
      <style>{DASH_CSS}</style>

      <aside style={sidebar} aria-label="Dashboard navigation">
        <div style={brand}>DFE Dashboard</div>
        <nav style={nav}>
          {navItems.map((item) => {
            const active = currentView === item.id
            return (
              <button
                key={item.id}
                className="dfe-dash-nav"
                data-active={active ? 'true' : undefined}
                onClick={() => setCurrentView(item.id)}
                style={navBtn}
              >
                <span aria-hidden>{item.icon}</span> {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <main style={main}>
        <header style={header}>
          <h1 style={title}>{navItems.find((item) => item.id === currentView)?.label}</h1>
          {currentView === 'forms' && onFormCreate && (
            <button onClick={onFormCreate} className="dfe-dash-cta" style={cta}>
              + Create Form
            </button>
          )}
        </header>

        <div style={content}>
          {currentView === 'forms' && <FormsList config={config} onFormEdit={onFormEdit} />}
          {currentView === 'submissions' && <SubmissionsList config={config} />}
          {currentView === 'analytics' && <AnalyticsPanel config={config} />}
          {currentView === 'templates' && <TemplateGallery />}
        </div>
      </main>
    </div>
  )
}

// ─── Token-driven styles ──────────────────────────────────────────────────────
const shell: React.CSSProperties = {
  display: 'flex', height: '100vh',
  fontFamily: 'var(--dfe-font-sans)',
  color: 'var(--dfe-color-text)', background: 'var(--dfe-color-canvas)',
}
const sidebar: React.CSSProperties = {
  width: 224, padding: 'var(--dfe-space-5)',
  background: 'var(--dfe-color-surface)',
  borderRight: '1px solid var(--dfe-color-border)',
  overflowY: 'auto',
}
const brand: React.CSSProperties = {
  fontSize: 'var(--dfe-text-base)', fontWeight: 700, marginBottom: 'var(--dfe-space-8)',
  letterSpacing: 'var(--dfe-tracking-tight)',
}
const nav: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--dfe-space-2)' }
const navBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 'var(--dfe-space-2)',
  padding: 'var(--dfe-space-2) var(--dfe-space-3)',
  background: 'transparent', color: 'var(--dfe-color-text-muted)',
  border: '1px solid transparent', borderRadius: 'var(--dfe-radius-md)',
  cursor: 'pointer', textAlign: 'left', font: 'inherit', fontSize: 'var(--dfe-text-sm)', fontWeight: 500,
}
const main: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dfe-color-canvas)', overflowY: 'auto' }
const header: React.CSSProperties = {
  padding: 'var(--dfe-space-5) var(--dfe-space-8)',
  background: 'var(--dfe-glass-bg)',
  WebkitBackdropFilter: 'blur(var(--dfe-glass-blur))', backdropFilter: 'blur(var(--dfe-glass-blur))',
  borderBottom: '1px solid var(--dfe-color-border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  position: 'sticky', top: 0, zIndex: 'var(--dfe-z-sticky)' as unknown as number,
}
const title: React.CSSProperties = { margin: 0, fontSize: 'var(--dfe-text-2xl)', letterSpacing: 'var(--dfe-tracking-tight)' }
const cta: React.CSSProperties = {
  padding: 'var(--dfe-space-2) var(--dfe-space-4)',
  background: 'var(--dfe-gradient-brand)', color: 'var(--dfe-slate-0)', border: 'none',
  borderRadius: 'var(--dfe-radius-md)', cursor: 'pointer',
  fontSize: 'var(--dfe-text-sm)', fontWeight: 600, boxShadow: 'var(--dfe-shadow-sm)',
}
const content: React.CSSProperties = { padding: 'var(--dfe-space-8)', flex: 1, overflow: 'auto' }

const DASH_CSS = `
.dfe-dashboard .dfe-dash-nav {
  transition: background var(--dfe-duration-fast) var(--dfe-ease-standard),
              color var(--dfe-duration-fast) var(--dfe-ease-standard),
              transform var(--dfe-duration-fast) var(--dfe-ease-spring);
}
.dfe-dashboard .dfe-dash-nav:hover { background: var(--dfe-color-surface-muted); color: var(--dfe-color-text); }
.dfe-dashboard .dfe-dash-nav[data-active="true"] {
  background: var(--dfe-color-primary-subtle); color: var(--dfe-color-primary);
  border-color: var(--dfe-color-primary-border); font-weight: var(--dfe-weight-semibold);
}
.dfe-dashboard .dfe-dash-nav:focus-visible,
.dfe-dashboard .dfe-dash-cta:focus-visible { outline: none; box-shadow: var(--dfe-ring-primary); }
.dfe-dashboard .dfe-dash-cta { transition: transform var(--dfe-duration-fast) var(--dfe-ease-spring), box-shadow var(--dfe-duration-fast) var(--dfe-ease-standard); }
.dfe-dashboard .dfe-dash-cta:hover { transform: translateY(-1px); box-shadow: var(--dfe-shadow-md); }
.dfe-dashboard .dfe-dash-cta:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) {
  .dfe-dashboard .dfe-dash-nav, .dfe-dashboard .dfe-dash-cta { transition-duration: 0.001ms; }
}
`
