import { useMemo, useReducer, useState } from 'react'
import { createBuilderState, builderReducer, toFormConfig, makeField } from '@dmc--98/dfe-builder'
import { createFormEngine } from '@dmc--98/dfe-core'
import type { FormField, FieldType } from '@dmc--98/dfe-core'
import { executeStepSubmit } from '@dmc--98/dfe-server'

// ─── DFE Landing Playground ──────────────────────────────────────────────────
// A real, working playground powered by the actual published packages:
//   BUILD  — drag-and-drop builder state from @dmc--98/dfe-builder
//   STYLE  — live theme controls; the preview restyles instantly
//   PREVIEW— a live dfe-core engine: conditions, validation, error summary
//   EXPORT — copy the typed config or ready-to-paste React code
//   SERVER — the real dfe-server pipeline in-browser (in-memory adapter),
//            including a "tampered payload rejected" demonstration.

interface Theme { accent: string; radius: number; density: number; labelWeight: number }
const DEFAULT_THEME: Theme = { accent: '#6366f1', radius: 8, density: 10, labelWeight: 600 }

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

type Tab = 'build' | 'style' | 'export' | 'server'
const FIELD_PALETTE: FieldType[] = ['SHORT_TEXT', 'EMAIL', 'NUMBER', 'SELECT', 'DATE', 'CHECKBOX', 'LONG_TEXT']

export default function Playground() {
  const [state, dispatch] = useReducer(builderReducer, undefined, () =>
    createBuilderState({ fields: starterFields() }),
  )
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  const [tab, setTab] = useState<Tab>('build')
  const [copied, setCopied] = useState<string | null>(null)
  const [serverLog, setServerLog] = useState<string[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [, force] = useState(0)

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

  const copy = async (what: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(null), 1500) } catch { /* no clipboard */ }
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
    const from = ordered.findIndex((f) => f.id === dragId)
    const to = ordered.findIndex((f) => f.id === targetId)
    if (from >= 0 && to >= 0) dispatch({ type: 'MOVE_FIELD', from, to })
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
  }

  return (
    <div style={css.wrap} className="pg-wrap">
      <div style={css.panel}>
        <div style={css.tabs}>
          {(['build', 'style', 'export', 'server'] as Tab[]).map((x) => (
            <button key={x} style={tab === x ? { ...css.tabBtn, ...css.tabOn } : css.tabBtn} onClick={() => setTab(x)}>
              {x === 'build' ? '⚒ Build' : x === 'style' ? '🎨 Style' : x === 'export' ? '⧉ Export code' : '🛡 Server demo'}
            </button>
          ))}
        </div>

        {tab === 'build' && (
          <>
            <div style={css.palette}>
              {FIELD_PALETTE.map((ft) => (
                <span key={ft} style={css.chip}
                  draggable
                  onDragStart={() => setDragId(`__new__${ft}`)}
                  onClick={() => dispatch({ type: 'ADD_FIELD', fieldType: ft })}>
                  + {ft.toLowerCase().replace('_', ' ')}
                </span>
              ))}
            </div>
            <div onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId?.startsWith('__new__')) { dispatch({ type: 'ADD_FIELD', fieldType: dragId.slice(7) as FieldType }); setDragId(null) } }}>
              {ordered.map((f) => (
                <div key={f.id} style={css.fieldRow}
                  draggable
                  onDragStart={() => setDragId(f.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropReorder(f.id)}>
                  <span style={{ color: 'var(--muted)' }}>⠿</span>
                  <input style={{ ...css.input, width: 130, padding: '4px 8px' }} value={f.label}
                    onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: f.id, patch: { label: e.target.value } })} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{f.type}</span>
                  <label style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', gap: 3, alignItems: 'center' }}>
                    <input type="checkbox" checked={f.required}
                      onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: f.id, patch: { required: e.target.checked } })} /> req
                  </label>
                  {f.conditions ? (
                    <span style={css.badge} title={JSON.stringify(f.conditions)}>
                      {f.conditions.action} when {f.conditions.rules?.[0]?.fieldKey} = {String(f.conditions.rules?.[0]?.value)}
                    </span>
                  ) : null}
                  <button style={css.del} title="Remove" onClick={() => dispatch({ type: 'REMOVE_FIELD', id: f.id })}>✕</button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              Drag rows to reorder · click a palette chip to add a field · the “Company Name” badge is a live condition — set Account Type to Business in the preview.
            </p>
          </>
        )}

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
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              DFE is headless — these knobs restyle the live preview because <em>you</em> own the rendering. No theme lock-in.
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button style={css.btn} onClick={() => runServerDemo(false)}>Submit clean payload</button>
              <button style={css.ghost} onClick={() => runServerDemo(true)}>Submit tampered payload</button>
            </div>
            {serverLog.length > 0 && <pre style={css.pre}>{serverLog.join('\n')}</pre>}
          </>
        )}
      </div>

      <div style={css.panel}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>LIVE PREVIEW — a real dfe-core engine</div>
        {visible.map((f) => {
          const error = showErrors ? validation.errors[f.key] : undefined
          const cfg = f.config as { options?: Array<{ label: string; value: string }>; placeholder?: string }
          return (
            <label key={f.key} style={{ display: 'block', margin: '10px 0' }}>
              <span style={css.label}>{f.label}{f.required ? ' *' : ''}</span>
              {f.type === 'SELECT' ? (
                <select style={css.input} value={String(engine.getValues()[f.key] ?? '')} onChange={(e) => setValue(f.key, e.target.value)}>
                  <option value="">Select…</option>
                  {cfg.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'CHECKBOX' ? (
                <input type="checkbox" checked={!!engine.getValues()[f.key]} onChange={(e) => setValue(f.key, e.target.checked)} />
              ) : f.type === 'LONG_TEXT' ? (
                <textarea style={{ ...css.input, minHeight: 60 }} value={String(engine.getValues()[f.key] ?? '')} onChange={(e) => setValue(f.key, e.target.value)} />
              ) : (
                <input style={error ? { ...css.input, borderColor: '#e5484d' } : css.input}
                  type={f.type === 'EMAIL' ? 'email' : f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}
                  placeholder={cfg.placeholder}
                  value={String(engine.getValues()[f.key] ?? '')}
                  onChange={(e) => setValue(f.key, f.type === 'NUMBER' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)} />
              )}
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
      </div>
    </div>
  )
}
