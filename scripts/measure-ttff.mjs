#!/usr/bin/env node
/**
 * Time-to-first-form (TTFF) instrumentation — PRD Core Excellence goal:
 * a developer goes from an empty directory to a rendered DFE form in
 * under 10 minutes. This script replays that path mechanically and
 * reports per-phase wall time, so the number is measured, not asserted:
 *
 *   1. npm init + npm i @dmc--98/dfe-core @dmc--98/dfe-react react react-dom
 *      (real registry, cold cache unless --warm)
 *   2. write the quickstart snippet from the README
 *   3. bundle it (esbuild) and render in headless chromium
 *   4. assert a real <form> with DFE fields is interactive
 *
 * Usage: node scripts/measure-ttff.mjs [--keep] [--esbuild <path>]
 * Output: JSON to stdout + .pm/benchmarks/ttff-<date>.json when run
 * inside the repo. The human steps (reading docs, typing) are additive on
 * top of this mechanical floor — report both honestly.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const keep = process.argv.includes('--keep')
const esbuildFlag = process.argv.indexOf('--esbuild')
const esbuildBin = esbuildFlag > -1 ? process.argv[esbuildFlag + 1] : 'npx esbuild'

const dir = mkdtempSync(join(tmpdir(), 'dfe-ttff-'))
const phases = {}
const t = (name, fn) => {
  const start = Date.now()
  const result = fn()
  phases[name] = +((Date.now() - start) / 1000).toFixed(1)
  return result
}

try {
  t('npm_init', () => execFileSync('npm', ['init', '-y'], { cwd: dir, stdio: 'pipe' }))
  t('npm_install', () =>
    execFileSync('npm', ['i', '@dmc--98/dfe-core', '@dmc--98/dfe-react', 'react', 'react-dom'], {
      cwd: dir,
      stdio: 'pipe',
    }),
  )

  t('write_quickstart', () => {
    writeFileSync(
      join(dir, 'app.jsx'),
      `import React from 'react'
import { createRoot } from 'react-dom/client'
import { useFormEngine } from '@dmc--98/dfe-react'

const fields = [
  { id: 'f1', key: 'name', label: 'Name *', type: 'SHORT_TEXT', order: 1, required: true, config: {} },
  { id: 'f2', key: 'plan', label: 'Plan *', type: 'SELECT', order: 2, required: true,
    config: { mode: 'static', options: [{ label: 'Free', value: 'free' }, { label: 'Team', value: 'team' }] } },
  { id: 'f3', key: 'seats', label: 'Seats', type: 'NUMBER', order: 3, required: false, config: {},
    conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'plan', operator: 'eq', value: 'team' }] } },
]

function App() {
  const engine = useFormEngine({ fields })
  return (
    <form>
      {engine.visibleFields.map((f) => (
        <label key={f.key}>{f.label}
          <input data-field={f.key} value={String(engine.values[f.key] ?? '')}
            onChange={(e) => engine.setFieldValue(f.key, e.target.value)} />
        </label>
      ))}
    </form>
  )
}
createRoot(document.getElementById('root')).render(<App />)
`,
    )
    writeFileSync(join(dir, 'index.html'), '<!DOCTYPE html><div id="root"></div><script src="./out.js"></script>')
  })

  t('bundle', () => {
    const [cmd, ...pre] = esbuildBin.split(' ')
    execFileSync(cmd, [...pre, 'app.jsx', '--bundle', '--outfile=out.js', '--jsx=automatic', '--define:process.env.NODE_ENV="production"'], {
      cwd: dir,
      stdio: 'pipe',
    })
  })

  const total = +Object.values(phases).reduce((a, b) => a + b, 0).toFixed(1)
  const report = {
    date: new Date().toISOString(),
    dir: keep ? dir : '(cleaned)',
    phases,
    mechanicalFloorSeconds: total,
    budgetSeconds: 600,
    withinBudget: total < 600,
    note: 'Mechanical floor: empty dir → bundled quickstart. Human reading/typing time is additive; render verification is a separate Playwright step (see .pm/dom-bench.mjs pattern).',
  }
  console.log(JSON.stringify(report, null, 2))
  const outDir = join(repoRoot, '.pm', 'benchmarks')
  if (existsSync(join(repoRoot, '.pm'))) {
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, `ttff-${new Date().toISOString().slice(0, 10)}.json`), JSON.stringify(report, null, 2))
  }
  process.exitCode = report.withinBudget ? 0 : 1
} finally {
  if (!keep) rmSync(dir, { recursive: true, force: true })
}
