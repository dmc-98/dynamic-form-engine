import { useMemo, useState } from 'react'
import { createFormEngine, createFormStepper, getTemplate } from '@dmc--98/dfe-core'

// ─── Live DFE demo ────────────────────────────────────────────────────────────
// A self-contained, framework-light demo using the built-in `user-onboarding`
// starter template. Edit values and watch conditional fields appear, steps
// advance, and the live submission payload update. No backend required.

const styles: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '40px auto', padding: '0 20px', color: '#16161f' },
  h1: { fontSize: 24, marginBottom: 4 },
  sub: { color: '#666', marginTop: 0 },
  card: { border: '1px solid #e3e3ef', borderRadius: 12, padding: 20, marginTop: 20 },
  field: { display: 'block', margin: '12px 0' },
  label: { display: 'block', fontSize: 14, marginBottom: 4, fontWeight: 600 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d0d0d8', borderRadius: 6, fontSize: 14 },
  err: { color: 'crimson', fontSize: 12, marginTop: 4 },
  nav: { display: 'flex', gap: 8, marginTop: 16 },
  btn: { padding: '8px 16px', borderRadius: 6, border: '1px solid #6366f1', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: 14 },
  ghost: { padding: '8px 16px', borderRadius: 6, border: '1px solid #d0d0d8', background: '#fff', cursor: 'pointer', fontSize: 14 },
  pre: { background: '#14141f', color: '#e9e9f1', padding: 16, borderRadius: 10, fontSize: 12, overflowX: 'auto' },
  progress: { fontSize: 12, color: '#666', marginBottom: 8 },
}

export function App() {
  const template = useMemo(() => getTemplate('user-onboarding')!, [])
  const engine = useMemo(() => createFormEngine(template.fields), [template])
  const stepper = useMemo(() => createFormStepper(template.steps ?? [], engine), [template, engine])

  // Force re-render on engine/stepper changes.
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)

  const step = stepper.getCurrentStep()
  const progress = stepper.getProgress()
  const visible = engine.getVisibleFields().filter((f) => f.stepId === step?.step.id)
  const validation = engine.validate()

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Dynamic Form Engine — Live Demo</h1>
      <p style={styles.sub}>
        The <code>user-onboarding</code> starter template. Set Account Type to “Business” to see
        conditional fields appear. One config drives rendering, conditions, steps, and validation.
      </p>

      <div style={styles.card}>
        <div style={styles.progress}>
          Step {progress.current} of {progress.total} — {step?.step.title} ({progress.percent}%)
        </div>

        {visible.map((f) => (
          <label key={f.key} style={styles.field}>
            <span style={styles.label}>{f.label}{f.required ? ' *' : ''}</span>
            {renderInput(f, engine, rerender)}
            {engine.getFieldState(f.key)?.validationError && (
              <span style={styles.err}>{engine.getFieldState(f.key)?.validationError}</span>
            )}
          </label>
        ))}

        <div style={styles.nav}>
          {stepper.canGoBack() && (
            <button style={styles.ghost} onClick={() => { stepper.goBack(); rerender() }}>← Back</button>
          )}
          {!stepper.isLastStep() ? (
            <button style={styles.btn} onClick={() => { stepper.goNext(); rerender() }}>Next →</button>
          ) : (
            <button style={styles.btn} disabled={!validation.success}>
              {validation.success ? 'Submit' : 'Fix errors to submit'}
            </button>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <strong>Live submission payload</strong>
        <pre style={styles.pre}>{JSON.stringify(engine.collectSubmissionValues(), null, 2)}</pre>
      </div>
    </div>
  )
}

function renderInput(
  f: ReturnType<ReturnType<typeof createFormEngine>['getVisibleFields']>[number],
  engine: ReturnType<typeof createFormEngine>,
  rerender: () => void,
) {
  const value = engine.getValues()[f.key]
  const set = (v: unknown) => { engine.setFieldValue(f.key, v); rerender() }
  const cfg = f.config as { options?: Array<{ label: string; value: string }> }

  if (f.type === 'SELECT' && cfg.options) {
    return (
      <select style={styles.input} value={String(value ?? '')} onChange={(e) => set(e.target.value)}>
        <option value="">Select…</option>
        {cfg.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }
  if (f.type === 'NUMBER') {
    return <input style={styles.input} type="number" value={String(value ?? '')} onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))} />
  }
  return <input style={styles.input} type={f.type === 'EMAIL' ? 'email' : 'text'} value={String(value ?? '')} onChange={(e) => set(e.target.value)} />
}
