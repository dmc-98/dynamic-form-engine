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
const muiThemeStyles = createDfeThemeVariables(dfeDefaultTheme)

// Opt-out: MUI-native palette (blue), applied when `disableDfeTheme` is set.
const muiHostThemeStyles = {
  '--dfe-color-canvas': '#f5f7fb',
  '--dfe-color-surface': '#ffffff',
  '--dfe-color-surface-muted': '#e8f0fe',
  '--dfe-color-border': '#d7dce5',
  '--dfe-color-border-strong': '#b7c3d7',
  '--dfe-color-text': '#1f2937',
  '--dfe-color-text-muted': '#5f6b7a',
  '--dfe-color-primary': '#1976d2',
  '--dfe-color-primary-hover': '#1565c0',
  '--dfe-color-primary-foreground': '#ffffff',
  '--dfe-color-focus': 'rgba(25, 118, 210, 0.18)',
  '--dfe-color-error': '#d32f2f',
  '--dfe-color-error-surface': '#fdecea',
  '--dfe-color-success': '#2e7d32',
  '--dfe-color-success-surface': '#edf7ed',
  '--dfe-radius-sm': '0.5rem',
  '--dfe-radius-md': '0.75rem',
  '--dfe-radius-lg': '1rem',
  '--dfe-radius-pill': '999px',
  '--dfe-font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
} as React.CSSProperties

export interface DfeMuiThemeProviderProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Opt out of the DFE (Graphite & Teal) look and use the MUI-native palette. */
  disableDfeTheme?: boolean
}

export function DfeMuiThemeProvider({
  children,
  className,
  style,
  disableDfeTheme = false,
}: DfeMuiThemeProviderProps): React.ReactElement {
  const themeStyles = disableDfeTheme ? muiHostThemeStyles : muiThemeStyles
  return (
    <div
      className={className}
      data-dfe-mui-theme
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

export function MuiFieldRenderer(props: FieldRendererProps): React.ReactElement {
  return (
    <DfeMuiThemeProvider>
      <DefaultFieldRenderer {...props} />
    </DfeMuiThemeProvider>
  )
}

export function DfeMuiStepIndicator(
  props: DfeStepIndicatorProps
): React.ReactElement {
  return (
    <DfeMuiThemeProvider>
      <DfeStepIndicator {...props} />
    </DfeMuiThemeProvider>
  )
}

export function DfeMuiFormPreview(
  props: DfeFormPreviewProps
): React.ReactElement {
  return (
    <DfeMuiThemeProvider>
      <DfeFormPreview {...props} />
    </DfeMuiThemeProvider>
  )
}

export { muiThemeStyles, muiHostThemeStyles }
export type { FieldRendererProps } from '@dmc--98/dfe-react/renderers'
export type { DfeFormPreviewProps, DfeStepIndicatorProps } from '@dmc--98/dfe-react/components'
export type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core'
