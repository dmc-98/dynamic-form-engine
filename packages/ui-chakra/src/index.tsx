import React from 'react'
import type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core'
import * as DfeRenderers from '@dmc--98/dfe-react/renderers'
import {
  DfeFormPreview,
  DfeStepIndicator,
  type DfeFormPreviewProps,
  type DfeStepIndicatorProps,
} from '@dmc--98/dfe-react/components'
import type { FieldRendererProps } from '@dmc--98/dfe-react/renderers'
import { createDfeThemeVariables, dfeDefaultTheme } from '@dmc--98/dfe-react/theme'

const DefaultFieldRenderer = DfeRenderers
  .DefaultFieldRenderer as React.ComponentType<FieldRendererProps>

// Default look (Graphite & Teal) — derived from the single source of truth.
const chakraThemeStyles = createDfeThemeVariables(dfeDefaultTheme)

// Opt-out: Chakra-native palette (blue), applied when `disableDfeTheme` is set.
const chakraHostThemeStyles = {
  '--dfe-color-canvas': '#f7fafc',
  '--dfe-color-surface': '#ffffff',
  '--dfe-color-surface-muted': '#ebf8ff',
  '--dfe-color-border': '#e2e8f0',
  '--dfe-color-border-strong': '#cbd5e0',
  '--dfe-color-text': '#1a202c',
  '--dfe-color-text-muted': '#4a5568',
  '--dfe-color-primary': '#3182ce',
  '--dfe-color-primary-hover': '#2b6cb0',
  '--dfe-color-primary-foreground': '#ffffff',
  '--dfe-color-focus': 'rgba(49, 130, 206, 0.18)',
  '--dfe-color-error': '#e53e3e',
  '--dfe-color-error-surface': '#fff5f5',
  '--dfe-color-success': '#38a169',
  '--dfe-color-success-surface': '#f0fff4',
  '--dfe-radius-sm': '0.5rem',
  '--dfe-radius-md': '0.75rem',
  '--dfe-radius-lg': '1rem',
  '--dfe-radius-pill': '999px',
  '--dfe-font-family': 'Inter, system-ui, sans-serif',
} as React.CSSProperties

export interface DfeChakraThemeProviderProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Opt out of the DFE (Graphite & Teal) look and use the Chakra-native palette. */
  disableDfeTheme?: boolean
}

export function DfeChakraThemeProvider({
  children,
  className,
  style,
  disableDfeTheme = false,
}: DfeChakraThemeProviderProps): React.ReactElement {
  const themeStyles = disableDfeTheme ? chakraHostThemeStyles : chakraThemeStyles
  return (
    <div
      className={className}
      data-dfe-chakra-theme
      data-dfe-theme
      style={{
        ...themeStyles,
        background: 'var(--dfe-color-canvas)',
        color: 'var(--dfe-color-text)',
        fontFamily: 'var(--dfe-font-family)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function ChakraFieldRenderer(
  props: FieldRendererProps
): React.ReactElement {
  return (
    <DfeChakraThemeProvider>
      <DefaultFieldRenderer {...props} />
    </DfeChakraThemeProvider>
  )
}

export function DfeChakraStepIndicator(
  props: DfeStepIndicatorProps
): React.ReactElement {
  return (
    <DfeChakraThemeProvider>
      <DfeStepIndicator {...props} />
    </DfeChakraThemeProvider>
  )
}

export function DfeChakraFormPreview(
  props: DfeFormPreviewProps
): React.ReactElement {
  return (
    <DfeChakraThemeProvider>
      <DfeFormPreview {...props} />
    </DfeChakraThemeProvider>
  )
}

export { chakraThemeStyles, chakraHostThemeStyles }
export type { FieldRendererProps } from '@dmc--98/dfe-react/renderers'
export type { DfeFormPreviewProps, DfeStepIndicatorProps } from '@dmc--98/dfe-react/components'
export type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core'
