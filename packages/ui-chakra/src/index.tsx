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

const chakraThemeStyles = {
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
  '--dfe-font-family': 'Inter, system-ui, sans-serif',
  '--dfe-font-size': '0.95rem',
  '--dfe-label-size': '0.92rem',
  '--dfe-helper-size': '0.82rem',
  '--dfe-title-size': '1.22rem',
  '--dfe-line-height': '1.5',
  '--dfe-shadow-sm': '0 1px 2px rgba(26, 32, 44, 0.06)',
  '--dfe-shadow-md': '0 12px 28px rgba(49, 130, 206, 0.12)',
} as React.CSSProperties

export interface DfeChakraThemeProviderProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DfeChakraThemeProvider({
  children,
  className,
  style,
}: DfeChakraThemeProviderProps): React.ReactElement {
  return (
    <div
      className={className}
      data-dfe-chakra-theme
      style={{
        ...chakraThemeStyles,
        background: 'var(--dfe-color-canvas, #f7fafc)',
        color: 'var(--dfe-color-text, #1a202c)',
        fontFamily: 'var(--dfe-font-family, Inter, system-ui, sans-serif)',
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

export { chakraThemeStyles }
export type { FieldRendererProps } from '@dmc--98/dfe-react/renderers'
export type { DfeFormPreviewProps, DfeStepIndicatorProps } from '@dmc--98/dfe-react/components'
export type { FormField, FormValues, StepNodeState } from '@dmc--98/dfe-core'
