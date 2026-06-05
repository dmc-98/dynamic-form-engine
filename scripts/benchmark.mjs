#!/usr/bin/env node
/**
 * Dynamic Form Engine — performance benchmark.
 *
 * Runs real measurements against the built @dmc--98/dfe-core package and prints
 * a results table. Use it to (a) prove DFE's performance claims and (b) capture
 * numbers for PERFORMANCE.md, the landing page, and the demo video.
 *
 * Usage:
 *   pnpm --filter @dmc--98/dfe-core build   # ensure dist/ is fresh
 *   node scripts/benchmark.mjs              # human-readable table
 *   node scripts/benchmark.mjs --json       # machine-readable JSON
 *
 * It measures:
 *   1. Graph construction time vs. field count.
 *   2. Field-change propagation cost — the O(k) claim: time to propagate one
 *      change should stay ~flat as total field count grows, because only
 *      dependents recompute.
 *   3. Validation throughput on large forms.
 */

import { performance } from 'node:perf_hooks'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const coreDir = join(__dirname, '..', 'packages', 'core')

let core
try {
  core = require(join(coreDir, 'dist', 'index.cjs'))
} catch {
  try {
    core = require(join(coreDir, 'dist', 'index.js'))
  } catch (e) {
    console.error('Could not load @dmc--98/dfe-core dist. Build it first:')
    console.error('  pnpm --filter @dmc--98/dfe-core build')
    console.error(String(e))
    process.exit(1)
  }
}

const { createFormEngine } = core
const asJson = process.argv.includes('--json')

// ─── Helpers ──────────────────────────────────────────────────────────────

/** A flat set of fields where ~1 in 8 is a SELECT that a later field depends on. */
function makeFields(count) {
  const fields = []
  for (let i = 0; i < count; i++) {
    const isController = i % 8 === 0
    fields.push({
      id: `field_${i}`,
      versionId: 'v1',
      key: `field_${i}`,
      label: `Field ${i}`,
      type: isController ? 'SELECT' : 'SHORT_TEXT',
      required: i % 3 === 0,
      order: i,
      config: isController
        ? { mode: 'static', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] }
        : {},
      // Each non-controller field is shown only when the *previous* controller is 'a'.
      conditions: !isController && i > 0
        ? { action: 'SHOW', operator: 'and', rules: [{ fieldKey: `field_${i - (i % 8)}`, operator: 'eq', value: 'a' }] }
        : undefined,
    })
  }
  return fields
}

function bench(fn, iterations) {
  // Warm up.
  for (let i = 0; i < Math.min(5, iterations); i++) fn(i)
  const start = performance.now()
  for (let i = 0; i < iterations; i++) fn(i)
  const total = performance.now() - start
  return { total, per: total / iterations }
}

const ms = (n) => `${n.toFixed(4)} ms`

// ─── 1. Graph construction ──────────────────────────────────────────────────

const sizes = [10, 50, 100, 500, 1000]
const construction = []
for (const size of sizes) {
  const fields = makeFields(size)
  const { per } = bench(() => createFormEngine(fields), 20)
  construction.push({ fields: size, perBuildMs: per })
}

// ─── 2. Propagation cost (the O(k) claim) ────────────────────────────────────

const propagation = []
for (const size of sizes) {
  const fields = makeFields(size)
  const engine = createFormEngine(fields)
  // Toggle the first controller back and forth; only its dependents recompute.
  let toggle = false
  const { per } = bench(() => {
    toggle = !toggle
    engine.setFieldValue('field_0', toggle ? 'a' : 'b')
  }, 2000)
  propagation.push({ fields: size, perChangeMs: per })
}

// ─── 3. Validation throughput ────────────────────────────────────────────────

const validation = []
for (const size of sizes) {
  const fields = makeFields(size)
  const engine = createFormEngine(fields)
  engine.setFieldValue('field_0', 'a') // reveal dependents so validation has work
  const { per } = bench(() => engine.validate(), 200)
  validation.push({ fields: size, perValidateMs: per })
}

// ─── Output ──────────────────────────────────────────────────────────────────

if (asJson) {
  console.log(JSON.stringify({
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    construction,
    propagation,
    validation,
  }, null, 2))
} else {
  const pad = (s, n) => String(s).padEnd(n)
  console.log('\nDynamic Form Engine — Performance Benchmark')
  console.log(`Node ${process.version} · ${process.platform}-${process.arch}\n`)

  console.log('1) Graph construction (build the full engine once)')
  console.log(`   ${pad('Fields', 10)}${pad('Per build', 16)}`)
  for (const r of construction) console.log(`   ${pad(r.fields, 10)}${pad(ms(r.perBuildMs), 16)}`)

  console.log('\n2) Change propagation — one setFieldValue (the O(k) claim)')
  console.log('   Per-change time stays ~flat as the form grows: only dependents recompute.')
  console.log(`   ${pad('Fields', 10)}${pad('Per change', 16)}`)
  for (const r of propagation) console.log(`   ${pad(r.fields, 10)}${pad(ms(r.perChangeMs), 16)}`)

  console.log('\n3) Validation (Zod schema generation + parse of visible fields)')
  console.log(`   ${pad('Fields', 10)}${pad('Per validate', 16)}`)
  for (const r of validation) console.log(`   ${pad(r.fields, 10)}${pad(ms(r.perValidateMs), 16)}`)

  const first = propagation[0].perChangeMs
  const last = propagation[propagation.length - 1].perChangeMs
  const growth = (last / first).toFixed(1)
  console.log(`\nPropagation cost grew ${growth}x while the form grew ${(sizes[sizes.length - 1] / sizes[0])}x in size.`)
  console.log('(Near-flat propagation is the point: a value change is O(affected), not O(total).)\n')
}
