import { describe, it, expect } from 'vitest'
import { exportTheme, defaultTheme, type FormTheme } from '../src/theme'

describe('exportTheme', () => {
  it('returns CSS variables and a token object for the default theme', () => {
    const out = exportTheme(defaultTheme())
    expect(out.css).toContain(':root')
    expect(out.css).toContain('--dfe-accent:')
    expect(out.tokens.accent).toBeTruthy()
  })

  it('reflects custom values in both css and tokens', () => {
    const theme: FormTheme = { accent: '#ff0000', radius: 12, density: 14, labelWeight: 700, fontFamily: 'Inter' }
    const out = exportTheme(theme)
    expect(out.tokens).toEqual(theme)
    expect(out.css).toContain('--dfe-accent: #ff0000')
    expect(out.css).toContain('--dfe-radius: 12px')
    expect(out.css).toContain('--dfe-density: 14px')
    expect(out.css).toContain('--dfe-label-weight: 700')
    expect(out.css).toContain('--dfe-font-family: Inter')
  })

  it('merges partial overrides onto defaults', () => {
    const out = exportTheme({ accent: '#123456' })
    expect(out.tokens.accent).toBe('#123456')
    expect(out.tokens.radius).toBe(defaultTheme().radius) // untouched default kept
  })

  it('supports a custom CSS selector', () => {
    const out = exportTheme(defaultTheme(), { selector: '.my-form' })
    expect(out.css.startsWith('.my-form {')).toBe(true)
  })

  it('produces valid, parseable CSS (balanced braces, one var per line)', () => {
    const css = exportTheme(defaultTheme()).css
    expect((css.match(/\{/g) || []).length).toBe((css.match(/\}/g) || []).length)
    const varLines = css.split('\n').filter(l => l.trim().startsWith('--'))
    expect(varLines.length).toBeGreaterThanOrEqual(5)
    for (const l of varLines) expect(l.trim().endsWith(';')).toBe(true)
  })

  it('escapes nothing unexpected — accent hex round-trips', () => {
    expect(exportTheme({ accent: '#0EA5E9' }).css).toContain('--dfe-accent: #0EA5E9')
  })

  it('strips characters that could break out of the CSS declaration / <style>', () => {
    const css = exportTheme({ accent: 'red; } body { display:none', fontFamily: 'a</style>b' }).css
    // The malicious accent value must not introduce its own ; or } into the rule.
    expect(css).toContain('--dfe-accent: red  body  display:none;')
    expect(css).not.toContain('</style>')
    expect(css).toContain('--dfe-font-family: a/styleb;')
    // structure stays valid: one balanced rule
    expect((css.match(/\{/g) || []).length).toBe((css.match(/\}/g) || []).length)
  })
})

describe('defaultTheme', () => {
  it('has all required token fields', () => {
    const t = defaultTheme()
    expect(t.accent).toBeTruthy()
    expect(typeof t.radius).toBe('number')
    expect(typeof t.density).toBe('number')
    expect(typeof t.labelWeight).toBe('number')
    expect(t.fontFamily).toBeTruthy()
  })
})
