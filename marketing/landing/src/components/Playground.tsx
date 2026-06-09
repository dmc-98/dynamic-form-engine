import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { createBuilderState, builderReducer, toFormConfig, makeField } from '@dmc--98/dfe-builder'
import { createFormEngine, auditFormAccessibility, getTemplate } from '@dmc--98/dfe-core'
import type { FormField, FieldType, FormStep } from '@dmc--98/dfe-core'
import { executeStepSubmit } from '@dmc--98/dfe-server'
// buildFlowModel + createPaymentStepHandler are vendored locally so the deployed
// landing build doesn't depend on the published package versions resolving to
// the ones containing these (newer) APIs. See lib/playground-vendor.ts.
import { buildFlowModel, createPaymentStepHandler } from '../lib/playground-vendor'

// Inline theme export — mirrors @dmc--98/dfe-core's exportTheme(), kept local so
// the deployed playground works against the currently-published core version.
// Inline theme export — mirrors @dmc--98/dfe-core's exportTheme(), kept local so
// the deployed playground works against the currently-published core version.
// Strips characters that could break out of the CSS declaration (matches core).
function cssSafe(v: string): string {
  return v.replace(/[;{}<>]/g, '')
}
function exportThemeCss(t: Theme): string {
  return `:root {
  --dfe-accent: ${cssSafe(t.accent)};
  --dfe-radius: ${t.radius}px;
  --dfe-density: ${t.density}px;
  --dfe-label-weight: ${t.labelWeight};
  --dfe-font-family: ${cssSafe(t.fontFamily)};
}`
}

// ─── DFE Landing Playground ──────────────────────────────────────────────────
// A real, working playground powered by the actual published packages:
//   BUILD  — drag-and-drop builder state from @dmc--98/dfe-builder
//   STYLE  — live theme controls; the preview restyles instantly
//   PREVIEW— a live dfe-core engine: conditions, validation, error summary
//   EXPORT — copy the typed config or ready-to-paste React code
//   SERVER — the real dfe-server pipeline in-browser (in-memory adapter),
//            including a "tampered payload rejected" demonstration.

interface Theme { accent: string; radius: number; density: number; labelWeight: number; fontFamily: string }
const SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const DEFAULT_THEME: Theme = { accent: '#6366f1', radius: 8, density: 10, labelWeight: 600, fontFamily: SYSTEM_FONT }

// Font choices for the switcher. Web-safe stacks so nothing needs loading.
const FONT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'System', value: SYSTEM_FONT },
  { label: 'Sans (Helvetica)', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Serif (Georgia)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
  { label: 'Rounded', value: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif' },
]

function starterFields(): FormField[] {
  const keys = new Set<string>()
  const mk = (type: FieldType, order: number, patch: Partial<FormField>): FormField => {
    const f = { ...makeField(type, keys as never, order), ...patch } as FormField
    keys.add(f.key)
    return f
  }
  return [
    mk('SHORT_TEXT', 1, { key: 'fullName', label: 'Full Name', required: true, config: { minLength: 2, placeholder: 'Ada Lovelace' } }),
    mk('EMAIL', 2, { key: 'email', label: 'Email', required: true, config: { placeholder: 'ada@example.com' } }),
    mk('SELECT', 3, { key: 'accountType', label: 'Account Type', required: true,
      config: { mode: 'static', options: [{ label: 'Personal', value: 'personal' }, { label: 'Business', value: 'business' }] } }),
    mk('SHORT_TEXT', 4, { key: 'companyName', label: 'Company Name', required: true, config: {},
      conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'accountType', operator: 'eq', value: 'business' }] } }),
  ]
}

/** Minimal in-memory DatabaseAdapter — enough for executeStepSubmit. */
function makeMemoryDb(submissions: Map<string, Record<string, unknown>>) {
  return {
    getFormBySlug: async () => null,
    getFormById: async () => null,
    listForms: async () => ({ items: [], nextCursor: null }),
    createSubmission: async () => { throw new Error('not needed') },
    getSubmission: async (id: string) => (submissions.get(id) as never) ?? null,
    updateSubmission: async (id: string, data: Record<string, unknown>) => {
      submissions.set(id, { ...(submissions.get(id) ?? {}), ...data })
    },
    executeApiContract: async () => ({}),
    fetchFieldOptions: async () => ({ items: [], nextCursor: null }),
  }
}

function exportCode(fields: FormField[]): string {
  return `import { useFormEngine } from '@dmc--98/dfe-react'
import type { FormField } from '@dmc--98/dfe-core'

export const fields: FormField[] = ${JSON.stringify(fields, null, 2)}

export function MyForm() {
  const engine = useFormEngine({ fields })
  return (
    <form>
      {engine.getVisibleFields().map(f => (
        <label key={f.key}>
          {f.label}{f.required ? ' *' : ''}
          <input
            value={String(engine.getValues()[f.key] ?? '')}
            onChange={e => engine.setFieldValue(f.key, e.target.value)}
          />
        </label>
      ))}
    </form>
  )
}`
}

type Tab = 'build' | 'flow' | 'style' | 'export' | 'server'

// All field types, grouped, with friendly labels — the full DFE palette.
const PALETTE_GROUPS: Array<{ group: string; types: Array<{ type: FieldType; label: string }> }> = [
  { group: 'Text', types: [
    { type: 'SHORT_TEXT', label: 'Short text' }, { type: 'LONG_TEXT', label: 'Paragraph' },
    { type: 'EMAIL', label: 'Email' }, { type: 'URL', label: 'URL' },
    { type: 'PHONE', label: 'Phone' }, { type: 'PASSWORD', label: 'Password' },
    { type: 'RICH_TEXT', label: 'Rich text' },
  ] },
  { group: 'Choice', types: [
    { type: 'SELECT', label: 'Dropdown' }, { type: 'MULTI_SELECT', label: 'Multi-select' },
    { type: 'RADIO', label: 'Radio' }, { type: 'CHECKBOX', label: 'Checkbox' },
  ] },
  { group: 'Number & scale', types: [
    { type: 'NUMBER', label: 'Number' }, { type: 'RATING', label: 'Rating' }, { type: 'SCALE', label: 'Scale' },
  ] },
  { group: 'Date & time', types: [
    { type: 'DATE', label: 'Date' }, { type: 'TIME', label: 'Time' },
    { type: 'DATE_TIME', label: 'Date & time' }, { type: 'DATE_RANGE', label: 'Date range' },
  ] },
  { group: 'Advanced', types: [
    { type: 'FILE_UPLOAD', label: 'File upload' }, { type: 'SIGNATURE', label: 'Signature' }, { type: 'ADDRESS', label: 'Address' },
  ] },
  { group: 'Layout', types: [
    { type: 'SECTION_BREAK', label: 'Section break' },
  ] },
]
const FRIENDLY: Record<string, string> = Object.fromEntries(
  PALETTE_GROUPS.flatMap((g) => g.types.map((t) => [t.type, t.label])),
)

// ─── Undo/redo: a history wrapper over the builder reducer ───────────────────
type BState = ReturnType<typeof createBuilderState>
interface History { past: BState[]; present: BState; future: BState[] }
type HistoryAction = Parameters<typeof builderReducer>[1] | { type: '__UNDO__' } | { type: '__REDO__' }

const MAX_HISTORY = 50
function historyReducer(h: History, action: HistoryAction): History {
  if (action.type === '__UNDO__') {
    if (h.past.length === 0) return h
    const previous = h.past[h.past.length - 1]
    return { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future] }
  }
  if (action.type === '__REDO__') {
    if (h.future.length === 0) return h
    const next = h.future[0]
    return { past: [...h.past, h.present], present: next, future: h.future.slice(1) }
  }
  const present = builderReducer(h.present, action)
  if (present === h.present) return h // no-op action: don't record history
  return { past: [...h.past, h.present].slice(-MAX_HISTORY), present, future: [] }
}

export default function Playground() {
  const [history, hdispatch] = useReducer(
    historyReducer,
    undefined,
    (): History => ({ past: [], present: createBuilderState({ fields: starterFields() }), future: [] }),
  )
  const state = history.present
  const dispatch = hdispatch as React.Dispatch<Parameters<typeof builderReducer>[1]>
  const undo = () => hdispatch({ type: '__UNDO__' })
  const redo = () => hdispatch({ type: '__REDO__' })
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  const [tab, setTab] = useState<Tab>('build')
  const [copied, setCopied] = useState<string | null>(null)
  const [serverLog, setServerLog] = useState<string[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [, force] = useState(0)

  // Hydrate from ?template=<id> deep links (used by the /templates gallery).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = new URLSearchParams(window.location.search).get('template')
    if (!id) return
    const tpl = getTemplate(id)
    if (tpl) dispatch({ type: 'RESET', state: { fields: tpl.fields, steps: tpl.steps ?? [] } })
  }, [])

  const config = useMemo(() => toFormConfig(state), [state])
  // Rebuild the engine whenever the config changes; carry user-entered values over.
  const [values, setValues] = useState<Record<string, unknown>>({})
  const engine = useMemo(
    () => createFormEngine(config.fields, values),
    [config.fields], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const setValue = (key: string, v: unknown) => {
    engine.setFieldValue(key, v)
    setValues(engine.getValues())
    force((n) => n + 1)
  }
  const validation = engine.validate()
  const visible = engine.getVisibleFields()
  const ordered = useMemo(() => [...state.fields].sort((a, b) => a.order - b.order), [state.fields])
  const labelFor = (key: string) => config.fields.find((f) => f.key === key)?.label ?? key
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Live accessibility audit over the current config.
  const a11yIssues = useMemo(() => auditFormAccessibility(config.fields, config.steps), [config.fields, config.steps])

  // Keyboard-accessible relative reorder. NOTE: MOVE_FIELD operates on
  // state.fields ARRAY positions, but rows are shown in sorted (`ordered`)
  // order — which can differ after loading a template. So we translate: find
  // the visual neighbor in `ordered`, then map both the moved item and that
  // neighbor back to their real array indices before dispatching.
  const moveBy = (id: string, delta: number) => {
    const visualIdx = ordered.findIndex((f) => f.id === id)
    const neighbor = ordered[visualIdx + delta]
    if (!neighbor) return // clamped at top/bottom
    const from = state.fields.findIndex((f) => f.id === id)
    const to = state.fields.findIndex((f) => f.id === neighbor.id)
    if (from >= 0 && to >= 0 && from !== to) dispatch({ type: 'MOVE_FIELD', from, to })
  }
  // Option editing via UPDATE_FIELD config patches (works against published builder).
  const getOptions = (f: FormField) => ((f.config as { options?: Array<{ label: string; value: string }> }).options ?? [])
  const setOptions = (f: FormField, options: Array<{ label: string; value: string }>) =>
    dispatch({ type: 'UPDATE_FIELD', id: f.id, patch: { config: { ...(f.config as object), options } } as Partial<FormField> })
  const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'option'
  const setValidationRule = (f: FormField, rule: string, value: unknown) => {
    const cfg = { ...(f.config as Record<string, unknown>) }
    if (value === undefined || value === '' || value === null) delete cfg[rule]; else cfg[rule] = value
    dispatch({ type: 'UPDATE_FIELD', id: f.id, patch: { config: cfg } as Partial<FormField> })
  }
  const isSelection = (t: string) => t === 'SELECT' || t === 'MULTI_SELECT' || t === 'RADIO'

  const copy = async (what: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(null), 1500) } catch { /* no clipboard */ }
  }

  // Payment-step demo — the real createPaymentStepHandler against a mock provider.
  const runPaymentDemo = async (succeed: boolean) => {
    const log: string[] = []
    // A mock PaymentClient (in production this wraps Stripe). Server-side only.
    const client = {
      createPaymentIntent: async (p: { amount: number; currency: string }) => ({
        id: 'pi_demo', clientSecret: 'pi_demo_secret', amount: p.amount, currency: p.currency, status: 'requires_payment_method',
      }),
      retrievePaymentIntent: async (id: string) => ({
        id, clientSecret: 'pi_demo_secret', amount: 4900, currency: 'usd', status: succeed ? 'succeeded' : 'requires_payment_method',
      }),
    }
    const payments = createPaymentStepHandler({ client })
    const intent = await payments.createIntent({ amount: 4900, currency: 'usd', metadata: { plan: 'pro' } })
    log.push(`→ createIntent({ amount: 4900, currency: 'usd' })`)
    log.push(`← clientSecret: ${intent.clientSecret} (frontend confirms with Stripe Elements)`)
    log.push(`→ verify('${intent.id}', { expectAmount: 4900, expectCurrency: 'usd' })  [server-side]`)
    const result = await payments.verify(intent.id, { expectAmount: 4900, expectCurrency: 'usd' })
    log.push(result.paid
      ? '← ✓ PAID — verified server-side; safe to complete the step.'
      : `← ✗ NOT PAID — ${result.reason}`)
    setServerLog(log)
  }

  const runServerDemo = async (tamper: boolean) => {
    const submissions = new Map<string, Record<string, unknown>>()
    submissions.set('sub_demo', { id: 'sub_demo', context: {} })
    const db = makeMemoryDb(submissions)
    const clean = engine.collectSubmissionValues()
    const payload = tamper
      ? { values: { ...clean, email: 'not-an-email', fullName: '' }, context: {} }
      : { values: clean, context: {} }

    const log: string[] = []
    log.push('→ POST /submissions/sub_demo/steps/step_main')
    log.push(`  values: ${JSON.stringify(payload.values)}`)
    log.push(tamper ? '  (payload tampered AFTER client validation — hostile client)' : '  (clean payload from the preview form)')

    const form = {
      id: 'form_demo', versionId: 'v1', slug: 'demo', title: 'Demo', status: 'published',
      fields: config.fields.map((f) => ({ ...f, stepId: 'step_main' })),
      steps: [{ id: 'step_main', versionId: 'v1', title: 'Main', order: 1 }],
    }
    try {
      const res = await executeStepSubmit({
        form: form as never,
        stepId: 'step_main',
        payload: payload as never,
        db: db as never,
        submissionId: 'sub_demo',
        visibleFieldKeys: visible.map((f) => f.key),
      })
      if (res.success) {
        log.push('← 200 OK — server re-validated against the SAME schema and persisted.')
      } else {
        log.push('← 422 REJECTED — server-side validation caught it:')
        for (const [k, msg] of Object.entries(res.errors ?? {})) log.push(`  • ${k}: ${msg}`)
      }
    } catch (e) {
      log.push(`← error: ${(e as Error).message}`)
    }
    setServerLog(log)
  }

  const onDropReorder = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    // Map ids → real state.fields array indices (see moveBy note on why).
    const from = state.fields.findIndex((f) => f.id === dragId)
    const to = state.fields.findIndex((f) => f.id === targetId)
    if (from >= 0 && to >= 0 && from !== to) dispatch({ type: 'MOVE_FIELD', from, to })
    setDragId(null)
  }

  const t = theme
  const css: Record<string, React.CSSProperties> = {
    wrap: { display: 'grid', gridTemplateColumns: 'minmax(0,5fr) minmax(0,4fr)', gap: 16, textAlign: 'left' },
    panel: { background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, minWidth: 0 },
    tabs: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    tabBtn: { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 },
    tabOn: { background: t.accent, color: '#fff', borderColor: t.accent },
    palette: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    chip: { border: '1px dashed var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'grab', color: 'var(--muted)' },
    fieldRow: { display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', margin: '6px 0', cursor: 'grab', background: 'var(--bg)', flexWrap: 'wrap' },
    badge: { fontSize: 10.5, border: `1px solid ${t.accent}`, color: t.accent, borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap' },
    del: { marginLeft: 'auto', cursor: 'pointer', color: 'var(--muted)', border: 'none', background: 'none', fontSize: 14 },
    label: { display: 'block', fontSize: 13, fontWeight: t.labelWeight as never, marginBottom: 3 },
    input: { width: '100%', boxSizing: 'border-box', padding: `${t.density}px ${t.density + 2}px`, borderRadius: t.radius, border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)' },
    err: { color: '#e5484d', fontSize: 12, display: 'block', marginTop: 3 },
    btn: { padding: '9px 18px', borderRadius: t.radius, border: 'none', background: t.accent, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    summary: { border: '1px solid #e5484d55', background: '#e5484d11', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 13 },
    pre: { background: '#14141f', color: '#e9e9f1', padding: 12, borderRadius: 10, fontSize: 11.5, overflowX: 'auto', maxHeight: 280 },
    row: { display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0', fontSize: 13 },
    ghost: { padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13 },
    move: { cursor: 'pointer', color: 'var(--muted)', border: 'none', background: 'none', fontSize: 11, padding: '0 2px' },
    ghostSm: { padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 },
    editor: { border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '10px 12px', margin: '-6px 0 6px', background: 'var(--panel)' },
  }

  return (
    <div style={css.wrap} className="pg-wrap">
      <div style={css.panel}>
        <div style={css.tabs}>
          {(['build', 'flow', 'style', 'export', 'server'] as Tab[]).map((x) => (
            <button key={x} style={tab === x ? { ...css.tabBtn, ...css.tabOn } : css.tabBtn} onClick={() => setTab(x)}>
              {x === 'build' ? '⚒ Build' : x === 'flow' ? '🔀 Flow' : x === 'style' ? '🎨 Style' : x === 'export' ? '⧉ Export code' : '🛡 Server demo'}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
            <button style={{ ...css.tabBtn, opacity: canUndo ? 1 : 0.4 }} disabled={!canUndo} title="Undo" onClick={undo}>↶</button>
            <button style={{ ...css.tabBtn, opacity: canRedo ? 1 : 0.4 }} disabled={!canRedo} title="Redo" onClick={redo}>↷</button>
          </span>
        </div>

        {tab === 'build' && (
          <>
            {/* Steps strip — build a multi-step form */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Steps</span>
              {state.steps.map((s) => (
                // Step chips are drop targets: drag a field row onto a step to assign it.
                <span key={s.id}
                  onDragOver={(e) => { if (dragId && !dragId.startsWith('__new__')) e.preventDefault() }}
                  onDrop={() => { if (dragId && !dragId.startsWith('__new__')) { dispatch({ type: 'ASSIGN_FIELD_TO_STEP', id: dragId, stepId: s.id }); setDragId(null) } }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: `1px solid ${dragId && !dragId.startsWith('__new__') ? t.accent : 'var(--border)'}`, borderRadius: 8, padding: '2px 6px', fontSize: 12 }}>
                  <input style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 12, width: 84 }}
                    value={s.title} onChange={(e) => dispatch({ type: 'UPDATE_STEP', id: s.id, patch: { title: e.target.value } })} />
                  <button style={css.move} title="Remove step" onClick={() => dispatch({ type: 'REMOVE_STEP', id: s.id })}>✕</button>
                </span>
              ))}
              <button style={css.ghostSm} onClick={() => dispatch({ type: 'ADD_STEP', title: `Step ${state.steps.length + 1}` })}>+ Add step</button>
              {state.steps.length > 0 ? <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>drag a field onto a step to assign</span> : null}
            </div>
            <div style={{ marginBottom: 10 }}>
              {PALETTE_GROUPS.map((g) => (
                <div key={g.group} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 3 }}>{g.group}</div>
                  <div style={css.palette}>
                    {g.types.map((ft) => (
                      <span key={ft.type} style={css.chip}
                        draggable
                        onDragStart={() => setDragId(`__new__${ft.type}`)}
                        onClick={() => dispatch({ type: 'ADD_FIELD', fieldType: ft.type })}>
                        + {ft.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId?.startsWith('__new__')) { dispatch({ type: 'ADD_FIELD', fieldType: dragId.slice(7) as FieldType }); setDragId(null) } }}>
              {ordered.map((f, i) => (
                <div key={f.id}>
                  <div style={css.fieldRow}
                    draggable
                    onDragStart={() => setDragId(f.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropReorder(f.id)}>
                    <span style={{ color: 'var(--muted)', cursor: 'grab' }} title="Drag to reorder">⠿</span>
                    {/* Keyboard-accessible reorder */}
                    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0.7 }}>
                      <button style={css.move} title="Move up" aria-label={`Move ${f.label} up`} disabled={i === 0} onClick={() => moveBy(f.id, -1)}>▲</button>
                      <button style={css.move} title="Move down" aria-label={`Move ${f.label} down`} disabled={i === ordered.length - 1} onClick={() => moveBy(f.id, 1)}>▼</button>
                    </span>
                    <input style={{ ...css.input, width: 120, padding: '4px 8px' }} value={f.label}
                      onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: f.id, patch: { label: e.target.value } })} />
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{FRIENDLY[f.type] ?? f.type}</span>
                    {state.steps.length > 0 ? (
                      <select style={{ ...css.input, width: 'auto', padding: '2px 4px', fontSize: 11 }} value={f.stepId ?? ''}
                        onChange={(e) => dispatch({ type: 'ASSIGN_FIELD_TO_STEP', id: f.id, stepId: e.target.value || null })}>
                        <option value="">No step</option>
                        {state.steps.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    ) : null}
                    <label style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', gap: 3, alignItems: 'center' }}>
                      <input type="checkbox" checked={f.required}
                        onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: f.id, patch: { required: e.target.checked } })} /> req
                    </label>
                    {f.conditions ? (
                      <span style={css.badge} title={JSON.stringify(f.conditions)}>
                        {f.conditions.action} when {f.conditions.rules?.[0]?.fieldKey} = {String(f.conditions.rules?.[0]?.value)}
                      </span>
                    ) : null}
                    <button style={css.move} title="Edit field" aria-label={`Edit ${f.label}`} onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}>⚙</button>
                    <button style={css.del} title="Remove" onClick={() => dispatch({ type: 'REMOVE_FIELD', id: f.id })}>✕</button>
                  </div>
                  {expandedId === f.id ? (
                    <div style={css.editor}>
                      {isSelection(f.type) ? (
                        <>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>Options</div>
                          {getOptions(f).map((o, oi) => (
                            // Key by the stable option value (not array index) so editing/removing
                            // a middle option doesn't mis-associate input focus/state.
                            <div key={o.value || oi} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                              {/* Editing only changes the label; the value is fixed at creation so
                                  it can't churn or collide with conditions referencing it. */}
                              <input style={{ ...css.input, padding: '4px 8px' }} value={o.label}
                                onChange={(e) => setOptions(f, getOptions(f).map((x, xi) => xi === oi ? { ...x, label: e.target.value } : x))} />
                              <button style={css.move} title="Remove option" disabled={getOptions(f).length <= 1}
                                onClick={() => setOptions(f, getOptions(f).filter((_, xi) => xi !== oi))}>✕</button>
                            </div>
                          ))}
                          <button style={css.ghostSm} onClick={() => {
                            const opts = getOptions(f)
                            const existing = new Set(opts.map((o) => o.value))
                            let n = opts.length + 1
                            let value = slug(`option ${n}`)
                            while (existing.has(value)) { n += 1; value = slug(`option ${n}`) } // dedupe
                            setOptions(f, [...opts, { label: `Option ${n}`, value }])
                          }}>+ Add option</button>
                        </>
                      ) : (f.type === 'SHORT_TEXT' || f.type === 'LONG_TEXT') ? (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
                          <label>Min length <input type="number" style={{ ...css.input, width: 70, padding: '4px 6px' }}
                            value={String((f.config as { minLength?: number }).minLength ?? '')}
                            onChange={(e) => setValidationRule(f, 'minLength', e.target.value === '' ? undefined : Number(e.target.value))} /></label>
                          <label>Max length <input type="number" style={{ ...css.input, width: 70, padding: '4px 6px' }}
                            value={String((f.config as { maxLength?: number }).maxLength ?? '')}
                            onChange={(e) => setValidationRule(f, 'maxLength', e.target.value === '' ? undefined : Number(e.target.value))} /></label>
                          <label style={{ flex: 1, minWidth: 140 }}>Pattern (regex) <input style={{ ...css.input, padding: '4px 6px' }}
                            value={String((f.config as { pattern?: string }).pattern ?? '')}
                            onChange={(e) => setValidationRule(f, 'pattern', e.target.value || undefined)} /></label>
                        </div>
                      ) : (f.type === 'NUMBER') ? (
                        <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                          <label>Min <input type="number" style={{ ...css.input, width: 80, padding: '4px 6px' }}
                            value={String((f.config as { min?: number }).min ?? '')}
                            onChange={(e) => setValidationRule(f, 'min', e.target.value === '' ? undefined : Number(e.target.value))} /></label>
                          <label>Max <input type="number" style={{ ...css.input, width: 80, padding: '4px 6px' }}
                            value={String((f.config as { max?: number }).max ?? '')}
                            onChange={(e) => setValidationRule(f, 'max', e.target.value === '' ? undefined : Number(e.target.value))} /></label>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>No extra validation options for {f.type.toLowerCase()}.</div>
                      )}

                      {/* Field properties: placeholder, help text, default value */}
                      {f.type !== 'SECTION_BREAK' ? (
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                          <label style={{ gridColumn: '1 / -1' }}>Placeholder
                            <input style={{ ...css.input, padding: '4px 6px' }} value={String((f.config as { placeholder?: string }).placeholder ?? '')}
                              onChange={(e) => setValidationRule(f, 'placeholder', e.target.value || undefined)} /></label>
                          <label style={{ gridColumn: '1 / -1' }}>Help text
                            <input style={{ ...css.input, padding: '4px 6px' }} value={String((f.config as { helpText?: string }).helpText ?? '')}
                              onChange={(e) => setValidationRule(f, 'helpText', e.target.value || undefined)} /></label>
                        </div>
                      ) : null}

                      {/* Logic: a visual one-rule condition builder */}
                      {f.type !== 'SECTION_BREAK' ? (
                        <ConditionEditor field={f} allFields={ordered} dispatch={dispatch} css={css} />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              Drag or use ▲▼ to reorder · ⚙ edits options, validation, properties &amp; logic · add steps above to build a multi-step form.
            </p>
          </>
        )}

        {tab === 'flow' && <FlowDiagram steps={state.steps} accent={t.accent} css={css} />}

        {tab === 'style' && (
          <>
            <div style={css.row}><span style={{ width: 110 }}>Accent</span>
              <input type="color" value={t.accent} onChange={(e) => setTheme({ ...t, accent: e.target.value })} />
              {['#6366f1', '#0ea5e9', '#16a34a', '#e11d48', '#f59e0b'].map((c) => (
                <span key={c} style={{ width: 18, height: 18, borderRadius: 6, background: c, cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => setTheme({ ...t, accent: c })} />
              ))}
            </div>
            <div style={css.row}><span style={{ width: 110 }}>Corner radius</span>
              <input type="range" min={0} max={20} value={t.radius} onChange={(e) => setTheme({ ...t, radius: Number(e.target.value) })} /> {t.radius}px
            </div>
            <div style={css.row}><span style={{ width: 110 }}>Density</span>
              <input type="range" min={6} max={16} value={t.density} onChange={(e) => setTheme({ ...t, density: Number(e.target.value) })} /> {t.density}px
            </div>
            <div style={css.row}><span style={{ width: 110 }}>Label weight</span>
              <input type="range" min={400} max={800} step={100} value={t.labelWeight} onChange={(e) => setTheme({ ...t, labelWeight: Number(e.target.value) })} /> {t.labelWeight}
            </div>
            <div style={css.row}><span style={{ width: 110 }}>Font</span>
              <select style={{ ...css.input, maxWidth: 220 }} value={t.fontFamily}
                onChange={(e) => setTheme({ ...t, fontFamily: e.target.value })}>
                {FONT_OPTIONS.map((fo) => <option key={fo.label} value={fo.value}>{fo.label}</option>)}
              </select>
              <span style={{ fontFamily: t.fontFamily, fontSize: 13, color: 'var(--muted)' }}>Aa Bb Cc</span>
            </div>
            <button style={{ ...css.ghost, marginTop: 6 }}
              onClick={() => copy('theme', exportThemeCss(t))}>
              {copied === 'theme' ? '✓ Copied' : 'Copy theme as CSS variables'}
            </button>
            <pre style={{ ...css.pre, marginTop: 10 }}>{exportThemeCss(t)}</pre>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              DFE is headless — these knobs restyle the live preview because <em>you</em> own the rendering, and your theme is exportable as plain CSS variables. No theme lock-in.
            </p>
          </>
        )}

        {tab === 'export' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button style={css.ghost} onClick={() => copy('config', JSON.stringify(config.fields, null, 2))}>
                {copied === 'config' ? '✓ Copied' : 'Copy config JSON'}
              </button>
              <button style={css.ghost} onClick={() => copy('code', exportCode(config.fields))}>
                {copied === 'code' ? '✓ Copied' : 'Copy React code'}
              </button>
            </div>
            <pre style={css.pre}>{exportCode(config.fields)}</pre>
          </>
        )}

        {tab === 'server' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0 }}>
              This runs the <strong>real</strong> <code>@dmc--98/dfe-server</code> pipeline in your browser
              (in-memory adapter). The server regenerates the Zod schema from the same config and re-validates —
              a tampered client can't sneak bad data past it.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <button style={css.btn} onClick={() => runServerDemo(false)}>Submit clean payload</button>
              <button style={css.ghost} onClick={() => runServerDemo(true)}>Submit tampered payload</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
              <strong>Payments</strong> use <code>createPaymentStepHandler</code> — provider-agnostic, verified server-side
              (here against a mock; in production you wrap Stripe). DFE hosts nothing.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <button style={css.btn} onClick={() => runPaymentDemo(true)}>Pay $49 (succeeds)</button>
              <button style={css.ghost} onClick={() => runPaymentDemo(false)}>Pay $49 (unpaid)</button>
            </div>
            {serverLog.length > 0 && <pre style={css.pre}>{serverLog.join('\n')}</pre>}
          </>
        )}
      </div>

      <div style={{ ...css.panel, fontFamily: t.fontFamily }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>LIVE PREVIEW — a real dfe-core engine</div>
        {visible.map((f) => {
          const error = showErrors ? validation.errors[f.key] : undefined
          if (f.type === 'SECTION_BREAK') {
            return (
              <div key={f.key} style={{ margin: '18px 0 8px', paddingBottom: 4, borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
                {f.label}
              </div>
            )
          }
          const help = (f.config as { helpText?: string; description?: string }).helpText
            ?? (f.config as { description?: string }).description ?? f.description ?? undefined
          return (
            <label key={f.key} style={{ display: 'block', margin: '10px 0' }}>
              <span style={css.label}>{f.label}{f.required ? ' *' : ''}</span>
              <PreviewInput field={f} value={engine.getValues()[f.key]} setValue={(v) => setValue(f.key, v)} error={!!error} css={css} accent={t.accent} />
              {help ? <span style={{ fontSize: 11.5, color: 'var(--muted)', display: 'block', marginTop: 2 }}>{help}</span> : null}
              {error ? <span style={css.err}>{error}</span> : null}
            </label>
          )
        })}
        <button style={validation.success ? css.btn : { ...css.btn, opacity: 0.6 }} onClick={() => setShowErrors(true)}>
          {validation.success ? 'Submit ✓' : 'Validate'}
        </button>
        {showErrors && !validation.success ? (
          <div style={css.summary}>
            <strong>{Object.keys(validation.errors).length} field(s) need attention:</strong>
            {Object.entries(validation.errors).map(([k, m]) => (
              <div key={k}>• {labelFor(k)}: {m}</div>
            ))}
          </div>
        ) : null}
        {showErrors && validation.success ? (
          <div style={{ ...css.summary, borderColor: '#16a34a55', background: '#16a34a11' }}>✓ Valid — try the 🛡 Server demo tab next.</div>
        ) : null}

        {/* Live accessibility audit — DFE proves a11y, doesn't just claim it */}
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            ♿ ACCESSIBILITY AUDIT — <code>auditFormAccessibility()</code>, live
          </div>
          {a11yIssues.length === 0 ? (
            <div style={{ ...css.summary, borderColor: '#16a34a55', background: '#16a34a11', marginTop: 0 }}>
              ✓ No accessibility issues found in this form.
            </div>
          ) : (
            <div style={{ ...css.summary, marginTop: 0 }}>
              <strong>{a11yIssues.length} issue(s):</strong>
              {a11yIssues.slice(0, 6).map((iss, idx) => (
                <div key={idx}>• <span style={{ textTransform: 'uppercase', fontSize: 10.5, opacity: 0.8 }}>{iss.severity}</span> — {iss.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Flow / workflow diagram ─────────────────────────────────────────────────
// Renders buildFlowModel(steps) from @dmc--98/dfe-core: step nodes in order,
// with sequential edges and labelled conditional-branch edges.

function FlowDiagram({ steps, accent, css }: { steps: FormStep[]; accent: string; css: Record<string, React.CSSProperties> }) {
  const model = useMemo(() => buildFlowModel(steps), [steps])
  if (model.nodes.length === 0) {
    return (
      <div style={{ fontSize: 13, color: 'var(--muted)', padding: '20px 0' }}>
        No steps yet. Add steps on the <strong>Build</strong> tab to see the form's flow as a diagram —
        sequential progression plus any conditional branches.
      </div>
    )
  }
  const branchesByFrom = new Map<string, typeof model.edges>()
  for (const e of model.edges) {
    if (e.kind === 'branch') {
      const list = branchesByFrom.get(e.from) ?? []
      list.push(e); branchesByFrom.set(e.from, list)
    }
  }
  return (
    <div style={{ padding: '4px 0' }}>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0 }}>
        The form's flow — generated from <code>buildFlowModel()</code>. Steps run top to bottom; branches show conditional jumps.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
        {model.nodes.map((n, i) => (
          <div key={n.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1, border: `1px solid ${n.isReview ? accent : 'var(--border)'}`, borderRadius: 10,
                padding: '10px 12px', background: 'var(--panel)',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  step {n.order}{n.skippable ? ' · skippable' : ''}{n.isReview ? ' · review' : ''}
                </div>
              </div>
              {(branchesByFrom.get(n.id) ?? []).map((b, bi) => (
                <div key={bi} style={{
                  fontSize: 11, color: b.dangling ? '#e5484d' : accent,
                  border: `1px dashed ${b.dangling ? '#e5484d' : accent}`, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap',
                }} title={b.dangling ? 'Branch targets a missing step' : undefined}>
                  ↳ if {b.label} → {model.nodes.find((x) => x.id === b.to)?.title ?? b.to}{b.dangling ? ' (missing)' : ''}
                </div>
              ))}
            </div>
            {i < model.nodes.length - 1 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, lineHeight: '18px' }}>↓</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Visual condition builder (one rule per field) ──────────────────────────

const COND_ACTIONS = ['SHOW', 'HIDE', 'REQUIRE', 'DISABLE'] as const
const COND_OPERATORS: Array<{ value: string; label: string; noValue?: boolean }> = [
  { value: 'eq', label: 'equals' }, { value: 'neq', label: 'not equals' },
  { value: 'empty', label: 'is empty', noValue: true }, { value: 'not_empty', label: 'is not empty', noValue: true },
  { value: 'gt', label: 'greater than' }, { value: 'lt', label: 'less than' },
  { value: 'contains', label: 'contains' },
]

interface CondRule { fieldKey: string; operator: string; value: unknown }
interface Cond { action: string; operator: 'and' | 'or'; rules: CondRule[] }

function ConditionEditor({ field, allFields, dispatch, css }: {
  field: FormField
  allFields: FormField[]
  dispatch: React.Dispatch<{ type: 'UPDATE_FIELD'; id: string; patch: Partial<FormField> }>
  css: Record<string, React.CSSProperties>
}) {
  const others = allFields.filter((f) => f.key !== field.key && f.type !== 'SECTION_BREAK')
  const cond = field.conditions as Cond | undefined
  const enabled = !!cond

  const write = (next: Cond | null) =>
    dispatch({ type: 'UPDATE_FIELD', id: field.id, patch: { conditions: next ?? undefined } as Partial<FormField> })
  const setRule = (i: number, patch: Partial<CondRule>) => {
    if (!cond) return
    write({ ...cond, rules: cond.rules.map((r, ri) => ri === i ? { ...r, ...patch } : r) })
  }
  const addRule = () => cond && write({ ...cond, rules: [...cond.rules, { fieldKey: others[0]?.key ?? '', operator: 'eq', value: '' }] })
  const removeRule = (i: number) => {
    if (!cond) return
    const rules = cond.rules.filter((_, ri) => ri !== i)
    write(rules.length ? { ...cond, rules } : null)
  }

  const sel = { ...css.input, padding: '4px 6px', width: 'auto' as const, fontSize: 12 }

  return (
    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
      <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', marginBottom: enabled ? 6 : 0 }}>
        <input type="checkbox" checked={enabled}
          onChange={(e) => e.target.checked
            ? write({ action: 'SHOW', operator: 'and', rules: [{ fieldKey: others[0]?.key ?? '', operator: 'eq', value: '' }] })
            : write(null)}
          disabled={others.length === 0} />
        Conditional logic {others.length === 0 ? <span style={{ color: 'var(--muted)' }}>(add another field first)</span> : null}
      </label>
      {enabled && cond ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select style={sel} value={cond.action} onChange={(e) => write({ ...cond, action: e.target.value })}>
              {COND_ACTIONS.map((a) => <option key={a} value={a}>{a[0] + a.slice(1).toLowerCase()}</option>)}
            </select>
            <span>this field when</span>
            {cond.rules.length > 1 ? (
              <select style={sel} value={cond.operator} onChange={(e) => write({ ...cond, operator: e.target.value as 'and' | 'or' })}>
                <option value="and">ALL of</option>
                <option value="or">ANY of</option>
              </select>
            ) : null}
          </div>
          {cond.rules.map((rule, i) => {
            const target = others.find((f) => f.key === rule.fieldKey)
            const opts = (target?.config as { options?: Array<{ label: string; value: string }> })?.options
            const opMeta = COND_OPERATORS.find((o) => o.value === rule.operator)
            return (
              <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', paddingLeft: 8 }}>
                <select style={sel} value={rule.fieldKey} onChange={(e) => setRule(i, { fieldKey: e.target.value })}>
                  {others.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
                <select style={sel} value={rule.operator} onChange={(e) => setRule(i, { operator: e.target.value })}>
                  {COND_OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {!opMeta?.noValue ? (
                  opts ? (
                    <select style={sel} value={String(rule.value ?? '')} onChange={(e) => setRule(i, { value: e.target.value })}>
                      <option value="">—</option>
                      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input style={{ ...sel, width: 100 }} value={String(rule.value ?? '')} placeholder="value"
                      onChange={(e) => setRule(i, { value: e.target.value })} />
                  )
                ) : null}
                {cond.rules.length > 1 ? <button style={css.move} title="Remove rule" onClick={() => removeRule(i)}>✕</button> : null}
              </div>
            )
          })}
          <button style={{ ...css.ghostSm, alignSelf: 'flex-start', marginLeft: 8 }} onClick={addRule}>+ Add rule</button>
        </div>
      ) : null}
    </div>
  )
}

// ─── Preview inputs — a real widget for every field type ─────────────────────

interface PreviewInputProps {
  field: FormField
  value: unknown
  setValue: (v: unknown) => void
  error: boolean
  css: Record<string, React.CSSProperties>
  accent: string
}

function PreviewInput({ field, value, setValue, error, css, accent }: PreviewInputProps) {
  const cfg = (field.config ?? {}) as {
    options?: Array<{ label: string; value: string }>
    placeholder?: string; max?: number; min?: number; maxLength?: number
  }
  const base = error ? { ...css.input, borderColor: '#e5484d' } : css.input
  const chip = (on: boolean): React.CSSProperties => ({
    border: `1px solid ${on ? accent : 'var(--border)'}`, background: on ? accent : 'transparent',
    color: on ? '#fff' : 'var(--text)', borderRadius: 999, padding: '5px 12px', fontSize: 13, cursor: 'pointer', userSelect: 'none',
  })
  const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6 }

  switch (field.type) {
    case 'LONG_TEXT':
    case 'RICH_TEXT':
      return <textarea style={{ ...base, minHeight: 60 }} maxLength={cfg.maxLength} placeholder={cfg.placeholder}
        value={String(value ?? '')} onChange={(e) => setValue(e.target.value)} />
    case 'CHECKBOX':
      return <input type="checkbox" checked={!!value} onChange={(e) => setValue(e.target.checked)} />
    case 'SELECT':
      return (
        <select style={base} value={String(value ?? '')} onChange={(e) => setValue(e.target.value)}>
          <option value="">Select…</option>
          {cfg.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    case 'RADIO':
      return (
        <span style={row}>
          {cfg.options?.map((o) => (
            <span key={o.value} style={chip(value === o.value)} onClick={() => setValue(o.value)}>{o.label}</span>
          ))}
        </span>
      )
    case 'MULTI_SELECT': {
      const sel: string[] = Array.isArray(value) ? (value as string[]) : []
      return (
        <span style={row}>
          {cfg.options?.map((o) => (
            <span key={o.value} style={chip(sel.includes(o.value))}
              onClick={() => setValue(sel.includes(o.value) ? sel.filter((x) => x !== o.value) : [...sel, o.value])}>{o.label}</span>
          ))}
        </span>
      )
    }
    case 'NUMBER':
      return <input style={base} type="number" placeholder={cfg.placeholder} value={value == null ? '' : String(value)}
        onChange={(e) => setValue(e.target.value === '' ? null : Number(e.target.value))} />
    case 'RATING': {
      const max = cfg.max ?? 5
      return (
        <span style={row}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <span key={n} style={{ cursor: 'pointer', fontSize: 20, color: typeof value === 'number' && value >= n ? accent : 'var(--border)' }}
              onClick={() => setValue(n)}>★</span>
          ))}
        </span>
      )
    }
    case 'SCALE': {
      const min = cfg.min ?? 1; const max = cfg.max ?? 10
      return (
        <span style={row}>
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
            <span key={n} style={chip(value === n)} onClick={() => setValue(n)}>{n}</span>
          ))}
        </span>
      )
    }
    case 'DATE': return <input style={base} type="date" value={String(value ?? '')} onChange={(e) => setValue(e.target.value)} />
    case 'TIME': return <input style={base} type="time" value={String(value ?? '')} onChange={(e) => setValue(e.target.value)} />
    case 'DATE_TIME': return <input style={base} type="datetime-local" value={String(value ?? '')} onChange={(e) => setValue(e.target.value)} />
    case 'DATE_RANGE': {
      const v = (value ?? {}) as { from?: string; to?: string }
      return (
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input style={base} type="date" value={v.from ?? ''} onChange={(e) => setValue({ ...v, from: e.target.value })} />
          <span style={{ color: 'var(--muted)' }}>→</span>
          <input style={base} type="date" value={v.to ?? ''} onChange={(e) => setValue({ ...v, to: e.target.value })} />
        </span>
      )
    }
    case 'FILE_UPLOAD':
      return (
        <span style={{ display: 'block' }}>
          <input type="file" style={{ fontSize: 13 }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) { setValue([]); return }
              // Read the real file to a data URL (in-browser; nothing uploaded).
              const reader = new FileReader()
              reader.onload = () => setValue([{ name: file.name, size: file.size, type: file.type, url: String(reader.result) }])
              reader.readAsDataURL(file)
            }} />
          {(() => {
            const f0 = Array.isArray(value) ? (value[0] as { name?: string; size?: number } | undefined) : undefined
            return f0?.name
              ? <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{f0.name} ({Math.round((f0.size ?? 0) / 1024)} KB) read ✓</span>
              : null
          })()}
        </span>
      )
    case 'ADDRESS': {
      const a = (value ?? {}) as Record<string, string>
      const fieldKeys: Array<[string, string]> = [['street', 'Street'], ['city', 'City'], ['state', 'State'], ['zip', 'ZIP'], ['country', 'Country']]
      return (
        <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {fieldKeys.map(([k, ph]) => (
            <input key={k} style={{ ...base, gridColumn: k === 'street' ? '1 / -1' : 'auto' }} placeholder={ph}
              value={a[k] ?? ''} onChange={(e) => setValue({ ...a, [k]: e.target.value })} />
          ))}
        </span>
      )
    }
    case 'SIGNATURE':
      return <SignaturePad value={String(value ?? '')} setValue={setValue} accent={accent} />
    default: // SHORT_TEXT, EMAIL, URL, PHONE, PASSWORD, HIDDEN
      return <input style={base}
        type={field.type === 'EMAIL' ? 'email' : field.type === 'URL' ? 'url' : field.type === 'PASSWORD' ? 'password' : field.type === 'PHONE' ? 'tel' : 'text'}
        placeholder={cfg.placeholder} value={String(value ?? '')} onChange={(e) => setValue(e.target.value)} />
  }
}

// A tiny real signature pad: draw on a canvas, store a data URL, clear.
function SignaturePad({ value, setValue, accent }: { value: string; setValue: (v: unknown) => void; accent: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const pos = (e: React.PointerEvent) => {
    const c = ref.current!; const r = c.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const start = (e: React.PointerEvent) => {
    drawing.current = true
    const ctx = ref.current!.getContext('2d')!; const p = pos(e)
    ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(p.x, p.y)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = ref.current!.getContext('2d')!; const p = pos(e)
    ctx.lineTo(p.x, p.y); ctx.stroke()
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    setValue(ref.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = ref.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setValue('')
  }
  return (
    <span style={{ display: 'block' }}>
      <canvas ref={ref} width={320} height={90}
        style={{ border: '1px solid var(--border)', borderRadius: 8, touchAction: 'none', background: 'var(--bg)', display: 'block' }}
        onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} />
      <button type="button" onClick={clear}
        style={{ marginTop: 4, fontSize: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', color: 'var(--text)' }}>
        Clear{value ? ' ✓' : ''}
      </button>
    </span>
  )
}
