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

const DefaultFieldRenderer = DfeRenderers
  .DefaultFieldRenderer as React.ComponentType<FieldRendererProps>

const antdThemeStyles = {
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
  '--dfe-space-xs': '0.375rem',
  '--dfe-space-sm': '0.625rem',
  '--dfe-space-md': '0.875rem',
  '--dfe-space-lg': '1rem',
  '--dfe-space-xl': '1.375rem',
  '--dfe-space-2xl': '1.875rem',
  '--dfe-radius-sm': '0.375rem',
  '--dfe-radius-md': '0.5rem',
  '--dfe-radius-lg': '0.75rem',
  '--dfe-radius-pill': '999px',
  '--dfe-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  '--dfe-font-size': '0.95rem',
  '--dfe-label-size': '0.9rem',
  '--dfe-helper-size': '0.82rem',
  '--dfe-title-size': '1.18rem',
  '--dfe-line-height': '1.5',
  '--dfe-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
  '--dfe-shadow-md': '0 10px 24px rgba(0, 0, 0, 0.08)',
} as React.CSSProperties

export interface DfeAntdThemeProviderProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DfeAntdThemeProvider({
  children,
  className,
  style,
}: DfeAntdThemeProviderProps): React.ReactElement {
  return (
    <div
      className={className}
      data-dfe-antd-theme
      style={{
        ...antdThemeStyles,
        background: 'var(--dfe-color-canvas, #f5f7fa)',
        color: 'var(--dfe-color-text, #1f1f1f)',
        fontFamily: 'var(--dfe-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
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

export { antdThemeStyles }
export type { FieldRendererProps } from '@dmc--98/dfe-react/renderers'
export type { DfeFormPreviewProps, DfeStepIndicatorProps } from '@dmc--98/dfe-react/components'
export type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core'
