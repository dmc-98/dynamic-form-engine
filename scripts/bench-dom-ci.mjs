/**
 * DOM CI benchmark gate (scripts/bench-dom-ci.mjs)
 *
 * Runs entirely in Node.js — no browser, no jsdom, no build tool required
 * beyond `pnpm build` (which CI's `verify` job already does).
 *
 * Measures two complementary lanes against the PRD P95 budget (< 16ms end-to-end):
 *   1. Engine lane  — setFieldValue propagation, P95 < 4 ms  (engine share)
 *   2. React SSR lane — renderToString for N visible fields, P95 < 12 ms (React share)
 *
 * Combined upper bound ≤ 16 ms.  Either failure exits 1 and prints a clear
 * budget-miss message so CI is actionable.
 *
 * Usage:
 *   node scripts/bench-dom-ci.mjs
 *   # or via package.json script:
 *   pnpm bench:dom:ci
 *
 * Regeneration note: if packages change module format, update the import paths below.
 */

import { createRequire } from 'module'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// ── Imports from built dist ───────────────────────────────────────────────────

const coreDist = resolve(__dirname, '../packages/core/dist/index.mjs')
const { createFormEngine } = await import(coreDist)

// ── Inline form generator (mirrors packages/benchmarks/src/generate.ts) ──────

function makeBenchmarkForm({ fieldCount, chainDepth }) {
  const fields = []
  for (let i = 0; i < fieldCount; i++) {
    const isChainHead = i % chainDepth === 0
    const field = {
      id: `bench_${i}`,
      key: `bench_${i}`,
      label: `Benchmark field ${i}`,
      type: 'SHORT_TEXT',
      order: i,
      required: false,
      config: { placeholder: `value ${i}` },
    }
    if (!isChainHead) {
      field.conditions = {
        action: 'SHOW',
        operator: 'and',
        rules: [{ fieldKey: `bench_${i - 1}`, operator: 'not_empty', value: '' }],
      }
    }
    fields.push(field)
  }
  return fields
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

function stats(arr) {
  const s = [...arr].sort((a, b) => a - b)
  return {
    ops: s.length,
    p50: percentile(s, 50),
    p95: percentile(s, 95),
    p99: percentile(s, 99),
    max: s[s.length - 1],
  }
}

// ── Lane 1: Engine update propagation ────────────────────────────────────────
// Mirrors the engine-bench vitest test; validates the engine share of the budget.

function runEngineLane(fieldCount, chainDepth) {
  const fields = makeBenchmarkForm({ fieldCount, chainDepth })
  const engine = createFormEngine(fields, {})
  // Warmup
  for (let i = 0; i < fieldCount; i += chainDepth) engine.setFieldValue(`bench_${i}`, 'warm')
  const latencies = []
  const OPS = 400
  for (let op = 0; op < OPS; op++) {
    const idx = (op * 7) % fieldCount
    const value = op % 3 === 2 ? '' : `v${op}`
    const t0 = performance.now()
    engine.setFieldValue(`bench_${idx}`, value)
    engine.getVisibleFields() // ensure propagation runs
    latencies.push(performance.now() - t0)
  }
  return stats(latencies)
}

// ── Lane 2: React SSR render cost ────────────────────────────────────────────
// Measures renderToString for the visible fields — the React component-render
// share of the end-to-end DOM commit budget. Uses plain HTML elements (no
// DfeFormRenderer) to isolate React's own cost from field-renderer specifics.

function buildFieldElement(field, value) {
  return createElement('label', { key: field.key, style: { display: 'block' } },
    field.label,
    createElement('input', {
      type: 'text',
      name: field.key,
      defaultValue: String(value ?? ''),
      placeholder: field.config?.placeholder ?? '',
    })
  )
}

function runSsrLane(fieldCount, chainDepth) {
  const fields = makeBenchmarkForm({ fieldCount, chainDepth })
  // Use the engine to get realistic visible-field sets at different fill states
  const engine = createFormEngine(fields, {})
  // Warmup: fill all chain heads so visibility is non-trivial
  for (let i = 0; i < fieldCount; i += chainDepth) engine.setFieldValue(`bench_${i}`, 'warm')

  const latencies = []
  const OPS = 200
  for (let op = 0; op < OPS; op++) {
    // Alternate fill/clear to vary the visible set (like real user edits)
    const idx = (op * 7) % fieldCount
    engine.setFieldValue(`bench_${idx}`, op % 3 === 2 ? '' : `v${op}`)
    const visible = engine.getVisibleFields()
    const values = engine.getValues()

    const t0 = performance.now()
    renderToString(
      createElement('form', null,
        ...visible.map(f => buildFieldElement(f, values[f.key]))
      )
    )
    latencies.push(performance.now() - t0)
  }
  return stats(latencies)
}

// ── Run scenarios ─────────────────────────────────────────────────────────────

const SCENARIOS = [
  { name: '100 fields / chain depth 10', fieldCount: 100, chainDepth: 10 },
  { name: '500 fields / chain depth 25', fieldCount: 500, chainDepth: 25 },
]

// Budget constants (ms, P95)
const ENGINE_BUDGET_P95 = 4    // engine share of the 16ms PRD budget
const SSR_BUDGET_P95    = 12   // React-render share (conservative proxy)

const results = []
let failed = false

for (const { name, fieldCount, chainDepth } of SCENARIOS) {
  process.stdout.write(`\nRunning: ${name}\n`)

  const engine = runEngineLane(fieldCount, chainDepth)
  const ssr    = runSsrLane(fieldCount, chainDepth)

  const engineOk = engine.p95 < ENGINE_BUDGET_P95
  const ssrOk    = ssr.p95    < SSR_BUDGET_P95

  results.push({ name, fieldCount, chainDepth, engine, ssr, engineOk, ssrOk })

  console.log(`  engine  p50=${engine.p50.toFixed(3)}ms  p95=${engine.p95.toFixed(3)}ms  p99=${engine.p99.toFixed(3)}ms  [budget<${ENGINE_BUDGET_P95}ms: ${engineOk ? '✓ PASS' : '✗ FAIL'}]`)
  console.log(`  ssr     p50=${ssr.p50.toFixed(3)}ms  p95=${ssr.p95.toFixed(3)}ms  p99=${ssr.p99.toFixed(3)}ms  [budget<${SSR_BUDGET_P95}ms: ${ssrOk ? '✓ PASS' : '✗ FAIL'}]`)

  if (!engineOk) {
    console.error(`\n  ✗ BUDGET MISS — engine P95 ${engine.p95.toFixed(3)}ms ≥ ${ENGINE_BUDGET_P95}ms for "${name}"`)
    failed = true
  }
  if (!ssrOk) {
    console.error(`\n  ✗ BUDGET MISS — React SSR P95 ${ssr.p95.toFixed(3)}ms ≥ ${SSR_BUDGET_P95}ms for "${name}"`)
    failed = true
  }
}

// ── Write report ──────────────────────────────────────────────────────────────

const report = {
  date: new Date().toISOString(),
  node: process.version,
  budgets: { engineP95Ms: ENGINE_BUDGET_P95, ssrP95Ms: SSR_BUDGET_P95, note: 'PRD end-to-end P95 < 16ms; engine + SSR-proxy shares.' },
  results,
  passed: !failed,
}

const outDir = resolve(__dirname, '../.pm/benchmarks')
mkdirSync(outDir, { recursive: true })
const outFile = resolve(outDir, `dom-ci-${new Date().toISOString().slice(0, 10)}.json`)
writeFileSync(outFile, JSON.stringify(report, null, 2))
console.log(`\nReport written: ${outFile}`)

if (failed) {
  console.error('\n✗ DOM CI benchmark FAILED — one or more budget gates missed.\n')
  process.exit(1)
} else {
  console.log('\n✓ DOM CI benchmark PASSED — all budget gates met.\n')
}
