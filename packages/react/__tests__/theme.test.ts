import { describe, expect, it } from 'vitest'
import React from 'react'
import {
  DfeThemeProvider,
  createDfeThemeVariables,
  dfeDefaultTheme,
  mergeDfeTheme,
} from '../src/theme'

describe('theme utilities', () => {
  it('merges partial theme overrides deeply', () => {
    const merged = mergeDfeTheme({
      colors: {
        primary: '#1d4ed8',
      },
      spacing: {
        lg: '2rem',
      },
    })

    expect(merged.colors.primary).toBe('#1d4ed8')
    expect(merged.spacing.lg).toBe('2rem')
    expect(merged.colors.text).toBe(dfeDefaultTheme.colors.text)
  })

  it('creates CSS variables from theme tokens', () => {
    const variables = createDfeThemeVariables(dfeDefaultTheme)

    expect(variables['--dfe-color-primary' as const]).toBe(dfeDefaultTheme.colors.primary)
    expect(variables['--dfe-radius-md' as const]).toBe(dfeDefaultTheme.radius.md)
    expect(variables['--dfe-font-family' as const]).toBe(dfeDefaultTheme.typography.fontFamily)
  })

  it('renders a provider with theme data attributes and variables', () => {
    const element = React.createElement(DfeThemeProvider, {
      theme: {
        colors: {
          primary: '#2563eb',
        },
      },
      children: 'content',
    })

    expect(element.type).toBe(DfeThemeProvider)
    expect(element.props.theme.colors.primary).toBe('#2563eb')
  })
})
