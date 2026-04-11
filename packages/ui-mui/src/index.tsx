import React from 'react'
import type { FormField, FormValues, StepNodeState } from '@dmc-98/dfe-core'
import * as DfeRenderers from '@dmc-98/dfe-react/renderers'
import {
  DfeFormPreview,
  DfeStepIndicator,
  type DfeFormPreviewProps,
  type DfeStepIndicatorProps,
} from '@dmc-98/dfe-react/components'
import type { FieldRendererProps } from '@dmc-98/dfe-react/renderers'

const DefaultFieldRenderer = DfeRenderers
  .DefaultFieldRenderer as React.ComponentType<FieldRendererProps>

const muiThemeStyles = {
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
  '--dfe-space-xs': '0.375rem',
  '--dfe-space-sm': '0.625rem',
  '--dfe-space-md': '0.875rem',
  '--dfe-space-lg': '1.125rem',
  '--dfe-space-xl': '1.5rem',
  '--dfe-space-2xl': '2rem',
  '--dfe-radius-sm': '0.5rem',
  '--dfe-radius-md': '0.75rem',
  '--dfe-radius-lg': '1rem',
  '--dfe-radius-pill': '999px',
  '--dfe-font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
  '--dfe-font-size': '0.95rem',
  '--dfe-label-size': '0.92rem',
  '--dfe-helper-size': '0.82rem',
  '--dfe-title-size': '1.25rem',
  '--dfe-line-height': '1.5',
  '--dfe-shadow-sm': '0 1px 2px rgba(15, 23, 42, 0.08)',
  '--dfe-shadow-md': '0 12px 32px rgba(25, 118, 210, 0.12)',
} as React.CSSProperties

export interface DfeMuiThemeProviderProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DfeMuiThemeProvider({
  children,
  className,
  style,
}: DfeMuiThemeProviderProps): React.ReactElement {
  return (
    <div
      className={className}
      data-dfe-mui-theme
      style={{
        ...muiThemeStyles,
        background: 'var(--dfe-color-canvas, #f5f7fb)',
        color: 'var(--dfe-color-text, #1f2937)',
        fontFamily: 'var(--dfe-font-family, "Roboto", "Helvetica", "Arial", sans-serif)',
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

export { muiThemeStyles }
export type { FieldRendererProps } from '@dmc-98/dfe-react/renderers'
export type { DfeFormPreviewProps, DfeStepIndicatorProps } from '@dmc-98/dfe-react/components'
export type { FormField, FormValues, StepNodeState } from '@dmc-98/dfe-core'
