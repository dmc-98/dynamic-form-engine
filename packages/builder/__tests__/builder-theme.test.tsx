import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FormBuilder } from '../src/FormBuilder'

const root = resolve(__dirname, '..')
const formBuilderSrc = readFileSync(resolve(root, 'src/FormBuilder.tsx'), 'utf8')
const builderCss = readFileSync(resolve(root, 'src/builder.css'), 'utf8')

describe('Builder — design-system migration (Graphite & Teal)', () => {
  it('FormBuilder source contains no hardcoded brand indigo', () => {
    expect(formBuilderSrc.toLowerCase()).not.toContain('6366f1')
    expect(formBuilderSrc.toLowerCase()).not.toContain('eef2ff')
  })

  it('builder.css contains no hardcoded brand indigo', () => {
    expect(builderCss.toLowerCase()).not.toContain('6366f1')
    expect(builderCss.toLowerCase()).not.toContain('eef2ff')
  })

  it('FormBuilder and panel CSS drive interactive state from the primary token', () => {
    expect(formBuilderSrc).toContain('--dfe-color-primary')
    expect(builderCss).toContain('--dfe-color-primary')
    // Motion is token-bound, not magic numbers.
    expect(formBuilderSrc).toContain('--dfe-duration-')
    expect(builderCss).toContain('--dfe-ease-')
  })

  it('honors reduced-motion', () => {
    expect(formBuilderSrc).toContain('prefers-reduced-motion')
    expect(builderCss).toMatch(/prefers-reduced-motion|@media/)
  })

  it('marks the selected field row with data-selected (token-styled), not an indigo inline ring', () => {
    render(<FormBuilder />)
    fireEvent.click(screen.getByTestId('palette-SHORT_TEXT'))
    const row = screen.getByTestId(/^field-row-/)
    fireEvent.click(row)
    expect(row.getAttribute('data-selected')).toBe('true')
    // No inline indigo ring remains.
    expect((row.getAttribute('style') ?? '').toLowerCase()).not.toContain('6366f1')
  })

  it('roots the builder in a [data-dfe-theme] scope so tokens resolve', () => {
    render(<FormBuilder />)
    expect(screen.getByTestId('dfe-builder').hasAttribute('data-dfe-theme')).toBe(true)
  })
})
