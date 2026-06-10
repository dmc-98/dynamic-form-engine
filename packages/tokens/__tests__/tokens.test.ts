import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { dfeDefaultTheme, dfeDataPalette, DFE_BRAND } from '../src/index'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../tokens.css'), 'utf8')

/** Pull a custom-property declaration's value out of tokens.css (first match). */
function cssVar(name: string): string | undefined {
  const m = css.match(new RegExp(`--dfe-${name}\\s*:\\s*([^;]+);`))
  return m?.[1].trim()
}

describe('DFE tokens — brand invariants', () => {
  it('primary accent is teal-700, never indigo', () => {
    expect(dfeDefaultTheme.colors.primary).toBe('#0f766e')
    expect(DFE_BRAND.primary).toBe('#0f766e')
    expect(cssVar('teal-700')).toBe('#0f766e')
  })

  it('contains no stray indigo brand colors (#6366f1 / #eef2ff)', () => {
    // The whole theme object must be indigo-free.
    expect(JSON.stringify(dfeDefaultTheme).toLowerCase()).not.toContain('6366f1')
    expect(JSON.stringify(dfeDefaultTheme).toLowerCase()).not.toContain('eef2ff')
    // The CSS may only reference #6366f1 as the data-viz categorical color,
    // and must never reference the indigo surface tint #eef2ff.
    expect(css.toLowerCase()).not.toContain('eef2ff')
    const indigoHits = css.toLowerCase().split('6366f1').length - 1
    expect(indigoHits).toBe(1) // exactly the --dfe-data-2 categorical entry
  })

  it('surfaceMuted is a slate tint, not an indigo tint', () => {
    expect(dfeDefaultTheme.colors.surfaceMuted).toBe('#f1f5f9')
  })
})

describe('DFE tokens — completeness', () => {
  it('exposes a full slate ramp (0..950)', () => {
    for (const stop of ['0', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']) {
      expect(cssVar(`slate-${stop}`), `--dfe-slate-${stop}`).toBeTruthy()
    }
  })

  it('exposes a full teal ramp (50..950)', () => {
    for (const stop of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']) {
      expect(cssVar(`teal-${stop}`), `--dfe-teal-${stop}`).toBeTruthy()
    }
  })

  it('defines a dark theme remap of the semantic layer', () => {
    expect(css).toContain('[data-dfe-theme][data-dfe-color-scheme="dark"]')
    expect(css).toContain('prefers-color-scheme: dark')
  })

  it('ships a 6-color categorical data-viz palette', () => {
    expect(dfeDataPalette).toHaveLength(6)
    expect(new Set(dfeDataPalette).size).toBe(6) // all distinct
  })
})

describe('DFE tokens — css/object agreement (anti-drift)', () => {
  // The renderer theme object is the light-mode projection of tokens.css.
  // These primitives must resolve to the same hex in both representations.
  it('object semantic values trace back to the documented primitives', () => {
    expect(dfeDefaultTheme.colors.canvas).toBe(cssVar('slate-50'))
    expect(dfeDefaultTheme.colors.surface).toBe(cssVar('slate-0'))
    expect(dfeDefaultTheme.colors.surfaceMuted).toBe(cssVar('slate-100'))
    expect(dfeDefaultTheme.colors.border).toBe(cssVar('slate-200'))
    expect(dfeDefaultTheme.colors.text).toBe(cssVar('slate-900'))
    expect(dfeDefaultTheme.colors.primary).toBe(cssVar('teal-700'))
    expect(dfeDefaultTheme.colors.primaryHover).toBe(cssVar('teal-800'))
  })
})
