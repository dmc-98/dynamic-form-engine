import React from 'react'
import { DfePlayground } from '@dmc-98/dfe-playground'

export function PlaygroundExample() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Stable Authoring Surface</p>
          <h1 style={styles.title}>DFE Playground</h1>
          <p style={styles.body}>
            Create configs, preview them live, generate authoring suggestions, and review AI-assisted draft answers without leaving the browser.
          </p>
        </div>

        <div style={styles.actions}>
          <a href="/" style={styles.primaryLink}>Open Fullstack Example</a>
          <a href="/playground" style={styles.secondaryLink}>Stay in Playground</a>
        </div>
      </section>

      <section style={styles.notes}>
        <div style={styles.noteCard}>
          <strong>Authoring</strong>
          <p>Generate configs from natural language, then refine the JSON and preview side by side.</p>
        </div>
        <div style={styles.noteCard}>
          <strong>Review-first AI fill</strong>
          <p>The draft-fill flow requires explicit consent, shows every proposed value, and never auto-submits.</p>
        </div>
        <div style={styles.noteCard}>
          <strong>Browser verified</strong>
          <p>This route is covered by Playwright as part of the example verification flow.</p>
        </div>
      </section>

      <DfePlayground />
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: '3rem clamp(1rem, 3vw, 2.5rem) 4rem',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
    color: '#0f172a',
    fontFamily: 'system-ui, sans-serif',
  },
  hero: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '1.5rem',
    marginBottom: '1.75rem',
  },
  kicker: {
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#3730a3',
  },
  title: {
    margin: '0.35rem 0 0.75rem',
    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
    lineHeight: 1,
  },
  body: {
    maxWidth: 720,
    margin: 0,
    color: '#334155',
    fontSize: '1.05rem',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  primaryLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.85rem 1.3rem',
    borderRadius: 999,
    background: '#1d4ed8',
    color: '#fff',
    fontWeight: 700,
    textDecoration: 'none',
  },
  secondaryLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.85rem 1.3rem',
    borderRadius: 999,
    background: '#e0e7ff',
    color: '#312e81',
    fontWeight: 700,
    textDecoration: 'none',
  },
  notes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.75rem',
  },
  noteCard: {
    padding: '1rem 1.1rem',
    borderRadius: 18,
    background: 'rgba(255, 255, 255, 0.75)',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
  },
}
