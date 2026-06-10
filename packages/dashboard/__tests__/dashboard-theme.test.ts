import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const componentsDir = resolve(__dirname, '../src/components')
const files = readdirSync(componentsDir).filter(f => f.endsWith('.tsx'))
const sources = Object.fromEntries(files.map(f => [f, readFileSync(resolve(componentsDir, f), 'utf8')]))

// Hex literals are allowed only inside var(--token, #fallback) — none of ours use
// fallbacks, so the dashboard source must contain no raw hex colors at all.
const RAW_HEX = /#[0-9a-fA-F]{3,6}\b/

describe('Dashboard — design-system migration', () => {
  for (const [name, src] of Object.entries(sources)) {
    it(`${name} contains no raw hex colors (tokens only)`, () => {
      const offenders = src.split('\n')
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => RAW_HEX.test(line))
      expect(offenders.map(o => `${name}:${o.i + 1} ${o.line.trim()}`)).toEqual([])
    })

    it(`${name} references DFE semantic tokens`, () => {
      expect(src).toContain('var(--dfe-color-')
    })
  }

  it('the off-brand blue (#0066cc) and indigo are gone everywhere', () => {
    const all = Object.values(sources).join('\n').toLowerCase()
    expect(all).not.toContain('0066cc')
    expect(all).not.toContain('6366f1')
  })

  it('root is scoped to [data-dfe-theme] and honors reduced motion', () => {
    const root = sources['DfeDashboard.tsx']
    expect(root).toContain('data-dfe-theme')
    expect(root).toContain('prefers-reduced-motion')
  })
})
