/**
 * Engine-level benchmark lane (run with DFE_BENCH=1).
 *
 * Measures setFieldValue → visibility/validation propagation latency on
 * worst-case dependency-chain forms, against the PRD budget (P95 field
 * update < 16ms END-TO-END incl. DOM; the engine share must be far below).
 * Results are written to .pm/benchmarks/ (private until published per the
 * "run privately first" rule).
 *
 * Skipped by default so `vitest run` stays fast in CI; the bench is its own
 * command: DFE_BENCH=1 vitest run test/engine-bench.test.ts
 */
import { describe, it, expect } from 'vitest'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { createFormEngine } from '@dmc--98/dfe-core'
import { makeBenchmarkForm } from '../src/generate'

const BENCH = process.env.DFE_BENCH === '1'

interface Stats { ops: number; p50: number; p95: number; p99: number; max: number; meanVisible: number }

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

function runScenario(fieldCount: number, chainDepth: number): Stats {
  const fields = makeBenchmarkForm({ fieldCount, chainDepth })
  const engine = createFormEngine(fields, {})
  // Warmup — fill every chain head so visibility work is non-trivial.
  for (let i = 0; i < fieldCount; i += chainDepth) engine.setFieldValue(`bench_${i}`, 'warm')

  const latencies: number[] = []
  let visibleSum = 0
  const OPS = 400
  for (let op = 0; op < OPS; op += 1) {
    // Round-robin through the form: worst case alternates cascade-triggering
    // chain positions and mid-chain toggles (clearing re-hides successors).
    const idx = (op * 7) % fieldCount
    const value = op % 3 === 2 ? '' : `v${op}`
    const t0 = performance.now()
    engine.setFieldValue(`bench_${idx}`, value)
    const visible = engine.getVisibleFields().length
    const t1 = performance.now()
    latencies.push(t1 - t0)
    visibleSum += visible
  }
  latencies.sort((a, b) => a - b)
  return {
    ops: OPS,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    max: latencies[latencies.length - 1],
    meanVisible: Math.round(visibleSum / OPS),
  }
}

describe.skipIf(!BENCH)('DFE engine benchmark (DFE_BENCH=1)', () => {
  it('measures field-update propagation against PRD budgets', () => {
    const scenarios = [
      { name: '100 fields / chain depth 10', fieldCount: 100, chainDepth: 10 },
      { name: '500 fields / chain depth 25', fieldCount: 500, chainDepth: 25 },
    ]
    const results = scenarios.map((s) => ({ ...s, stats: runScenario(s.fieldCount, s.chainDepth) }))

    const report = {
      date: new Date().toISOString(),
      node: process.version,
      note: 'Engine-level only (no DOM). PRD budget: P95 end-to-end <16ms; engine share target <4ms.',
      results,
    }
    const outDir = resolve(__dirname, '../../../.pm/benchmarks')
    mkdirSync(outDir, { recursive: true })
    const outFile = resolve(outDir, `engine-${new Date().toISOString().slice(0, 10)}.json`)
    writeFileSync(outFile, JSON.stringify(report, null, 2))

    for (const r of results) {
      // eslint-disable-next-line no-console
      console.log(`${r.name}: p50=${r.stats.p50.toFixed(3)}ms p95=${r.stats.p95.toFixed(3)}ms p99=${r.stats.p99.toFixed(3)}ms max=${r.stats.max.toFixed(3)}ms (visible≈${r.stats.meanVisible})`)
      // Engine share of the 16ms end-to-end budget: keep under 4ms at P95.
      expect(r.stats.p95).toBeLessThan(4)
    }
    // eslint-disable-next-line no-console
    console.log(`report: ${outFile}`)
  })
})
