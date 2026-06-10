import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '..')
const component = readFileSync(resolve(root, 'src/components/DfePlayground.tsx'), 'utf8')
const css = readFileSync(resolve(root, 'src/playground.css'), 'utf8')

// Every data-dfe-playground* attribute the component renders.
const emitted = Array.from(new Set(component.match(/data-dfe-playground[a-z-]*/g) ?? []))

describe('Playground — design-system re-skin', () => {
  it('ships a token-driven stylesheet with no raw hex (except primitive white)', () => {
    const hex = (css.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [])
    expect(hex).toEqual([])
    expect(css).toContain('var(--dfe-color-')
  })

  it('styles every attribute the component emits', () => {
    // status/value-specific attrs are styled via attribute-value selectors.
    const valueScoped = new Set(['data-dfe-playground-status'])
    const unstyled = emitted.filter(a => !valueScoped.has(a) && !css.includes(`[${a}`))
    expect(unstyled).toEqual([])
  })

  it('is scoped to [data-dfe-theme] and honors reduced motion', () => {
    expect(css).toContain('[data-dfe-theme] [data-dfe-playground]')
    expect(css).toContain('prefers-reduced-motion')
  })

  it('uses the brand gradient for the hero + primary actions', () => {
    expect(css).toContain('--dfe-gradient-hero')
    expect(css).toContain('--dfe-gradient-brand')
  })
})
