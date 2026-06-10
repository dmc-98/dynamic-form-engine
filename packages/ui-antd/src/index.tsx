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
const antdThemeStyles = createDfeThemeVariables(dfeDefaultTheme)

// Opt-out: antd-native palette (blue), applied when `disableDfeTheme` is set.
const antdHostThemeStyles = {
  '--dfe-color-canvas': '#f5f7fa',
  '--dfe-color-surface': '#ffffff',
  '--dfe-color-surface-muted': '#e6f4ff',
  '--dfe-color-border': '#d9d9d9',
  '--dfe-color-border-strong': '#bfbfbf',
  '--dfe-color-text': '#1f1f1f',
  '--dfe-color-text-muted': '#595959',
  '--dfe-color-primary': '#1677ff',
  '--dfe-color-primary-hover': '#0958d9',
  '--dfe-color-primary-foreground': '#ffffff',
  '--dfe-color-focus': 'rgba(22, 119, 255, 0.16)',
  '--dfe-color-error': '#ff4d4f',
  '--dfe-color-error-surface': '#fff2f0',
  '--dfe-color-success': '#52c41a',
  '--dfe-color-success-surface': '#f6ffed',
  '--dfe-radius-sm': '0.375rem',
  '--dfe-radius-md': '0.5rem',
  '--dfe-radius-lg': '0.75rem',
  '--dfe-radius-pill': '999px',
} as React.CSSProperties

export interface DfeAntdThemeProviderProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Opt out of the DFE (Graphite & Teal) look and use the antd-native palette. */
  disableDfeTheme?: boolean
}

export function DfeAntdThemeProvider({
  children,
  className,
  style,
  disableDfeTheme = false,
}: DfeAntdThemeProviderProps): React.ReactElement {
  const themeStyles = disableDfeTheme ? antdHostThemeStyles : antdThemeStyles
  return (
    <div
      className={className}
      data-dfe-antd-theme
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

export function AntdFieldRenderer(props: FieldRendererProps): React.ReactElement {
  return (
    <DfeAntdThemeProvider>
      <DefaultFieldRenderer {...props} />
    </DfeAntdThemeProvider>
  )
}

export function DfeAntdStepIndicator(
  props: DfeStepIndicatorProps
): React.ReactElement {
  return (
    <DfeAntdThemeProvider>
      <DfeStepIndicator {...props} />
    </DfeAntdThemeProvider>
  )
}

export function DfeAntdFormPreview(
  props: DfeFormPreviewProps
): React.ReactElement {
  return (
    <DfeAntdThemeProvider>
      <DfeFormPreview {...props} />
    </DfeAntdThemeProvider>
  )
}

export { antdThemeStyles, antdHostThemeStyles }
export type { FieldRendererProps } from '@dmc--98/dfe-react/renderers'
export type { DfeFormPreviewProps, DfeStepIndicatorProps } from '@dmc--98/dfe-react/components'
export type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core'
