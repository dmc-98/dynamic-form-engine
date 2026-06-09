import { useMemo, useState } from 'react'
import { createFormEngine, createFormStepper } from '@dmc--98/dfe-core'
import type { FormField, FormStep } from '@dmc--98/dfe-core'

// ─── DFE Kitchen-Sink Demo ────────────────────────────────────────────────────
// A three-step form showcasing field kinds and validation rules:
//   • SHORT_TEXT with min/max length + regex pattern   • EMAIL / URL / PHONE
//   • NUMBER with min/max + integer                     • SELECT / RADIO / MULTI_SELECT
//   • CHECKBOX (required consent)                       • DATE / RATING / SCALE / LONG_TEXT
//   • Conditional visibility (business-only fields)     • Conditional requirement
//   • A computed field                                  • Per-field errors + an error summary
// One typed config drives all of it — rendering, conditions, validation, payload.

const steps: FormStep[] = [
  { id: 'step_account', versionId: 'v1', title: 'Account', order: 1 },
  { id: 'step_details', versionId: 'v1', title: 'Details', order: 2 },
  { id: 'step_review', versionId: 'v1', title: 'Feedback & Consent', order: 3 },
]

const fields: FormField[] = [
  // ── Step 1: Account ──
  { id: 'f_username', versionId: 'v1', stepId: 'step_account', key: 'username', label: 'Username', type: 'SHORT_TEXT', required: true, order: 1,
    description: '3–16 chars, letters/numbers/underscores',
    config: { minLength: 3, maxLength: 16, pattern: '^[a-zA-Z0-9_]+$', placeholder: 'ada_lovelace' } },
  { id: 'f_email', versionId: 'v1', stepId: 'step_account', key: 'email', label: 'Email', type: 'EMAIL', required: true, order: 2,
    config: { placeholder: 'ada@example.com' } },
  { id: 'f_website', versionId: 'v1', stepId: 'step_account', key: 'website', label: 'Website (optional)', type: 'URL', required: false, order: 3,
    config: { placeholder: 'https://…' } },
  { id: 'f_account_type', versionId: 'v1', stepId: 'step_account', key: 'accountType', label: 'Account Type', type: 'RADIO', required: true, order: 4,
    config: { mode: 'static', options: [
      { label: 'Personal', value: 'personal' },
      { label: 'Business', value: 'business' },
    ] } },
  // Business-only, conditionally REQUIRED when business
  { id: 'f_company', versionId: 'v1', stepId: 'step_account', key: 'companyName', label: 'Company Name', type: 'SHORT_TEXT', required: true, order: 5,
    config: {},
    conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'accountType', operator: 'eq', value: 'business' }] } },

  // ── Step 2: Details ──
  { id: 'f_seats', versionId: 'v1', stepId: 'step_details', key: 'seats', label: 'Seats', type: 'NUMBER', required: true, order: 1,
    description: 'Whole number, 1–500',
    config: { min: 1, max: 500, format: 'integer' } },
  { id: 'f_price', versionId: 'v1', stepId: 'step_details', key: 'pricePerSeat', label: 'Price per seat ($)', type: 'NUMBER', required: true, order: 2,
    config: { min: 0 } },
  { id: 'f_total', versionId: 'v1', stepId: 'step_details', key: 'estimatedTotal', label: 'Estimated total ($/mo) — computed', type: 'NUMBER', required: false, order: 3,
    config: {},
    computed: { expression: '(seats || 0) * (pricePerSeat || 0)', dependsOn: ['seats', 'pricePerSeat'] } },
  { id: 'f_start', versionId: 'v1', stepId: 'step_details', key: 'startDate', label: 'Start date', type: 'DATE', required: true, order: 4, config: {} },
  { id: 'f_stack', versionId: 'v1', stepId: 'step_details', key: 'stack', label: 'Your stack (pick at least one)', type: 'MULTI_SELECT', required: true, order: 5,
    config: { mode: 'static', options: [
      { label: 'React', value: 'react' }, { label: 'Vue', value: 'vue' },
      { label: 'Svelte', value: 'svelte' }, { label: 'Angular', value: 'angular' },
    ] } },
  { id: 'f_referral', versionId: 'v1', stepId: 'step_details', key: 'referral', label: 'How did you hear about us? (optional)', type: 'SELECT', required: false, order: 6,
    config: { mode: 'static', options: [
      { label: 'GitHub', value: 'github' }, { label: 'Hacker News', value: 'hn' }, { label: 'A friend', value: 'friend' },
    ] } },

  // ── Step 3: Feedback & Consent ──
  { id: 'f_rating', versionId: 'v1', stepId: 'step_review', key: 'rating', label: 'How excited are you? (1–5)', type: 'RATING', required: true, order: 1,
    config: { max: 5 } },
  { id: 'f_nps', versionId: 'v1', stepId: 'step_review', key: 'nps', label: 'Likelihood to recommend (1–10)', type: 'SCALE', required: false, order: 2,
    config: { min: 1, max: 10 } },
  { id: 'f_notes', versionId: 'v1', stepId: 'step_review', key: 'notes', label: 'Anything else? (optional, max 200 chars)', type: 'LONG_TEXT', required: false, order: 3,
    config: { maxLength: 200 } },
  { id: 'f_terms', versionId: 'v1', stepId: 'step_review', key: 'agreeToTerms', label: 'I agree to the terms', type: 'CHECKBOX', required: true, order: 4, config: {} },
]

const styles: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'system-ui, sans-serif', maxWidth: 780, margin: '32px auto', padding: '0 20px', color: '#16161f' },
  h1: { fontSize: 24, marginBottom: 4 },
  sub: { color: '#666', marginTop: 0, fontSize: 14.5 },
  card: { border: '1px solid #e3e3ef', borderRadius: 12, padding: 20, marginTop: 16 },
  field: { display: 'block', margin: '14px 0' },
  label: { display: 'block', fontSize: 14, marginBottom: 4, fontWeight: 600 },
  hint: { display: 'block', fontSize: 12, color: '#888', marginTop: 2 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d0d0d8', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  inputErr: { borderColor: 'crimson' },
  err: { color: 'crimson', fontSize: 12, marginTop: 4, display: 'block' },
  nav: { display: 'flex', gap: 8, marginTop: 18, alignItems: 'center' },
  btn: { padding: '8px 16px', borderRadius: 6, border: '1px solid #6366f1', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: 14 },
  btnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  ghost: { padding: '8px 16px', borderRadius: 6, border: '1px solid #d0d0d8', background: '#fff', cursor: 'pointer', fontSize: 14 },
  pre: { background: '#14141f', color: '#e9e9f1', padding: 16, borderRadius: 10, fontSize: 12, overflowX: 'auto' },
  progress: { fontSize: 12, color: '#666', marginBottom: 6 },
  summary: { border: '1px solid #f3c2cd', background: '#fdf2f5', borderRadius: 10, padding: '12px 16px', marginTop: 14, fontSize: 13.5 },
  summaryTitle: { fontWeight: 700, color: '#b3264a', marginBottom: 6 },
  summaryItem: { margin: '3px 0', color: '#8d2240' },
  ok: { border: '1px solid #bfe3c6', background: '#f1faf3', color: '#1d6b34', borderRadius: 10, padding: '12px 16px', marginTop: 14, fontSize: 14 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { border: '1px solid #d0d0d8', borderRadius: 999, padding: '5px 12px', fontSize: 13, cursor: 'pointer', background: '#fff', userSelect: 'none' },
  chipOn: { background: '#6366f1', borderColor: '#6366f1', color: '#fff' },
}

export function App() {
  const engine = useMemo(() => createFormEngine(fields), [])
  const stepper = useMemo(() => createFormStepper(steps, engine), [engine])
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)
  const [showErrors, setShowErrors] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const step = stepper.getCurrentStep()
  const progress = stepper.getProgress()
  const visible = engine.getVisibleFields().filter((f) => f.stepId === step?.step.id)
  const validation = engine.validate()
  const labelFor = (key: string) => fields.find((f) => f.key === key)?.label ?? key
  const stepFor = (key: string) => steps.find((s) => s.id === fields.find((f) => f.key === key)?.stepId)?.title ?? ''

  const trySubmit = () => {
    setShowErrors(true)
    if (validation.success) {
      setSubmitted(true)
    }
    rerender()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Dynamic Form Engine — Kitchen-Sink Demo</h1>
      <p style={styles.sub}>
        Text patterns, email/URL, numbers, dates, selects, multi-select, rating, scale, checkbox consent,
        conditional fields (pick “Business”), a computed total, and full validation with an error summary.
        One typed config drives everything.
      </p>

      <div style={styles.card}>
        <div style={styles.progress}>
          Step {progress.current} of {progress.total} — <strong>{step?.step.title}</strong> ({progress.percent}%)
        </div>

        {visible.map((f) => {
          const error = showErrors ? validation.errors[f.key] : undefined
          return (
            <label key={f.key} style={styles.field}>
              <span style={styles.label}>{f.label}{f.required ? ' *' : ''}</span>
              {renderInput(f, engine, rerender, !!error)}
              {f.description ? <span style={styles.hint}>{f.description}</span> : null}
              {error ? <span style={styles.err}>{error}</span> : null}
            </label>
          )
        })}

        <div style={styles.nav}>
          {stepper.canGoBack() && (
            <button style={styles.ghost} onClick={() => { stepper.goBack(); rerender() }}>← Back</button>
          )}
          {!stepper.isLastStep() ? (
            <button style={styles.btn} onClick={() => { stepper.goNext(); rerender() }}>Next →</button>
          ) : (
            <button style={validation.success ? styles.btn : { ...styles.btn, ...styles.btnDisabled }} onClick={trySubmit}>
              Submit
            </button>
          )}
        </div>

        {/* Error summary: shows EVERY failing field with its step, so nothing is invisible */}
        {showErrors && !validation.success ? (
          <div style={styles.summary}>
            <div style={styles.summaryTitle}>
              {Object.keys(validation.errors).length} field(s) need attention:
            </div>
            {Object.entries(validation.errors).map(([key, msg]) => (
              <div key={key} style={styles.summaryItem}>
                • <strong>{labelFor(key)}</strong> ({stepFor(key)}): {msg}
              </div>
            ))}
          </div>
        ) : null}

        {submitted && validation.success ? (
          <div style={styles.ok}>✓ Submitted! Payload below — note hidden conditional fields are excluded automatically.</div>
        ) : null}
      </div>

      <div style={styles.card}>
        <strong>Live submission payload</strong> <span style={styles.hint}>updates as you type — collectSubmissionValues()</span>
        <pre style={styles.pre}>{JSON.stringify(engine.collectSubmissionValues(), null, 2)}</pre>
      </div>
    </div>
  )
}

type Engine = ReturnType<typeof createFormEngine>

function renderInput(f: FormField, engine: Engine, rerender: () => void, hasError: boolean) {
  const value = engine.getValues()[f.key]
  const set = (v: unknown) => { engine.setFieldValue(f.key, v); rerender() }
  const cfg = f.config as {
    options?: Array<{ label: string; value: string }>
    min?: number; max?: number; maxLength?: number; placeholder?: string
  }
  const inputStyle = hasError ? { ...styles.input, ...styles.inputErr } : styles.input

  switch (f.type) {
    case 'SELECT':
      return (
        <select style={inputStyle} value={String(value ?? '')} onChange={(e) => set(e.target.value)}>
          <option value="">Select…</option>
          {cfg.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    case 'RADIO':
      return (
        <span style={styles.chips}>
          {cfg.options?.map((o) => (
            <span key={o.value}
              style={value === o.value ? { ...styles.chip, ...styles.chipOn } : styles.chip}
              onClick={() => set(o.value)}>
              {o.label}
            </span>
          ))}
        </span>
      )
    case 'MULTI_SELECT': {
      const selected: string[] = Array.isArray(value) ? (value as string[]) : []
      const toggle = (v: string) =>
        set(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
      return (
        <span style={styles.chips}>
          {cfg.options?.map((o) => (
            <span key={o.value}
              style={selected.includes(o.value) ? { ...styles.chip, ...styles.chipOn } : styles.chip}
              onClick={() => toggle(o.value)}>
              {o.label}
            </span>
          ))}
        </span>
      )
    }
    case 'CHECKBOX':
      return (
        <input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} />
      )
    case 'NUMBER':
      return (
        <input style={inputStyle} type="number" value={value == null ? '' : String(value)}
          readOnly={!!f.computed}
          onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))} />
      )
    case 'RATING': {
      const max = cfg.max ?? 5
      return (
        <span style={styles.chips}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <span key={n}
              style={typeof value === 'number' && value >= n ? { ...styles.chip, ...styles.chipOn } : styles.chip}
              onClick={() => set(n)}>★</span>
          ))}
        </span>
      )
    }
    case 'SCALE': {
      const min = cfg.min ?? 1
      const max = cfg.max ?? 10
      return (
        <span style={styles.chips}>
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
            <span key={n}
              style={value === n ? { ...styles.chip, ...styles.chipOn } : styles.chip}
              onClick={() => set(n)}>{n}</span>
          ))}
        </span>
      )
    }
    case 'DATE':
      return <input style={inputStyle} type="date" value={String(value ?? '')} onChange={(e) => set(e.target.value)} />
    case 'LONG_TEXT':
      return <textarea style={{ ...inputStyle, minHeight: 70 }} maxLength={cfg.maxLength} value={String(value ?? '')} onChange={(e) => set(e.target.value)} />
    default:
      return (
        <input style={inputStyle}
          type={f.type === 'EMAIL' ? 'email' : f.type === 'URL' ? 'url' : 'text'}
          placeholder={cfg.placeholder}
          value={String(value ?? '')}
          onChange={(e) => set(e.target.value)} />
      )
  }
}
