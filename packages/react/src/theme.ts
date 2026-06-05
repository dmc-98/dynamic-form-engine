import React, { useMemo } from 'react'

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export interface DfeThemeTokens {
  colors: {
    canvas: string
    surface: string
    surfaceMuted: string
    border: string
    borderStrong: string
    text: string
    textMuted: string
    primary: string
    primaryHover: string
    primaryForeground: string
    focus: string
    error: string
    errorSurface: string
    success: string
    successSurface: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  radius: {
    sm: string
    md: string
    lg: string
    pill: string
  }
  typography: {
    fontFamily: string
    fontSize: string
    labelSize: string
    helperSize: string
    titleSize: string
    lineHeight: string
  }
  shadow: {
    sm: string
    md: string
  }
}

export const dfeDefaultTheme: DfeThemeTokens = {
  colors: {
    canvas: '#f8fafc',
    surface: '#ffffff',
    surfaceMuted: '#eef2ff',
    border: '#cbd5e1',
    borderStrong: '#94a3b8',
    text: '#0f172a',
    textMuted: '#475569',
    primary: '#0f766e',
    primaryHover: '#115e59',
    primaryForeground: '#f8fafc',
    focus: 'rgba(15, 118, 110, 0.22)',
    error: '#b91c1c',
    errorSurface: '#fef2f2',
    success: '#166534',
    successSurface: '#f0fdf4',
  },
  spacing: {
    xs: '0.375rem',
    sm: '0.625rem',
    md: '0.875rem',
    lg: '1.25rem',
    xl: '1.75rem',
    '2xl': '2.5rem',
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1.25rem',
    pill: '999px',
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Avenir Next", sans-serif',
    fontSize: '1rem',
    labelSize: '0.95rem',
    helperSize: '0.9rem',
    titleSize: '1.35rem',
    lineHeight: '1.5',
  },
  shadow: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
    md: '0 10px 30px rgba(15, 23, 42, 0.08)',
  },
}

export interface DfeThemeProviderProps {
  children: React.ReactNode
  theme?: DeepPartial<DfeThemeTokens>
  className?: string
  style?: React.CSSProperties
}

export const dfeBaseThemeCss = `
[data-dfe-theme] {
  color: var(--dfe-color-text, #0f172a);
  font-family: var(--dfe-font-family, "IBM Plex Sans", sans-serif);
  font-size: var(--dfe-font-size, 1rem);
  line-height: var(--dfe-line-height, 1.5);
}

[data-dfe-theme] [data-dfe-form] {
  display: grid;
  gap: var(--dfe-space-lg, 1.25rem);
}

[data-dfe-theme] [data-dfe-field] {
  display: grid;
  gap: var(--dfe-space-sm, 0.625rem);
}

[data-dfe-theme] [data-dfe-label] {
  color: var(--dfe-color-text, #0f172a);
  font-size: var(--dfe-label-size, 0.95rem);
  font-weight: 600;
}

[data-dfe-theme] [data-dfe-description] {
  margin: 0;
  color: var(--dfe-color-text-muted, #475569);
  font-size: var(--dfe-helper-size, 0.9rem);
}

[data-dfe-theme] [data-dfe-control] {
  width: 100%;
  border: 1px solid var(--dfe-color-border, #cbd5e1);
  border-radius: var(--dfe-radius-md, 0.75rem);
  background: var(--dfe-color-surface, #ffffff);
  color: var(--dfe-color-text, #0f172a);
  box-shadow: var(--dfe-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
  padding: var(--dfe-space-sm, 0.625rem) var(--dfe-space-md, 0.875rem);
  font: inherit;
  transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
}

[data-dfe-theme] [data-dfe-control]:focus-visible {
  border-color: var(--dfe-color-primary, #0f766e);
  box-shadow:
    0 0 0 3px var(--dfe-color-focus, rgba(15, 118, 110, 0.22)),
    var(--dfe-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
  outline: none;
}

[data-dfe-theme] [data-dfe-control][aria-invalid="true"] {
  border-color: var(--dfe-color-error, #b91c1c);
  background: var(--dfe-color-error-surface, #fef2f2);
}

[data-dfe-theme] [data-dfe-error] {
  margin: 0;
  border-radius: var(--dfe-radius-sm, 0.5rem);
  background: var(--dfe-color-error-surface, #fef2f2);
  color: var(--dfe-color-error, #b91c1c);
  padding: var(--dfe-space-xs, 0.375rem) var(--dfe-space-sm, 0.625rem);
  font-size: var(--dfe-helper-size, 0.9rem);
}

[data-dfe-theme] [data-dfe-steps] [data-dfe-step-list] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--dfe-space-sm, 0.625rem);
  list-style: none;
  padding: 0;
  margin: 0;
}

[data-dfe-theme] [data-dfe-step-item] {
  min-width: 0;
}

[data-dfe-theme] [data-dfe-step-button],
[data-dfe-theme] [data-dfe-step-label] {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--dfe-space-sm, 0.625rem);
  padding: var(--dfe-space-sm, 0.625rem) var(--dfe-space-md, 0.875rem);
  border-radius: var(--dfe-radius-pill, 999px);
  border: 1px solid var(--dfe-color-border, #cbd5e1);
  background: var(--dfe-color-surface, #ffffff);
  color: var(--dfe-color-text, #0f172a);
  box-shadow: var(--dfe-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
  text-align: left;
}

[data-dfe-theme] [data-dfe-step-button] {
  cursor: pointer;
}

[data-dfe-theme] [data-dfe-step-item][data-dfe-active="true"] [data-dfe-step-button],
[data-dfe-theme] [data-dfe-step-item][data-dfe-active="true"] [data-dfe-step-label] {
  border-color: var(--dfe-color-primary, #0f766e);
  background: var(--dfe-color-surface-muted, #eef2ff);
}

[data-dfe-theme] [data-dfe-step-item][data-dfe-future="true"] [data-dfe-step-button],
[data-dfe-theme] [data-dfe-step-item][data-dfe-future="true"] [data-dfe-step-label] {
  opacity: 0.7;
}

[data-dfe-theme] [data-dfe-step-index] {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--dfe-color-primary, #0f766e);
  color: var(--dfe-color-primary-foreground, #f8fafc);
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

[data-dfe-theme] [data-dfe-preview-step] {
  margin-bottom: var(--dfe-space-2xl, 2.5rem);
}

[data-dfe-theme] [data-dfe-preview-title] {
  margin-top: 0;
  margin-bottom: var(--dfe-space-md, 0.875rem);
  font-size: var(--dfe-title-size, 1.35rem);
}

[data-dfe-theme] [data-dfe-preview-grid] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--dfe-space-lg, 1.25rem);
}

[data-dfe-theme] [data-dfe-preview-field] {
  padding: var(--dfe-space-md, 0.875rem);
  border-radius: var(--dfe-radius-md, 0.75rem);
  border: 1px solid var(--dfe-color-border, #cbd5e1);
  background: var(--dfe-color-surface, #ffffff);
  box-shadow: var(--dfe-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
}

[data-dfe-theme] [data-dfe-preview-label] {
  margin-bottom: var(--dfe-space-xs, 0.375rem);
  color: var(--dfe-color-text, #0f172a);
  font-size: var(--dfe-label-size, 0.95rem);
  font-weight: 600;
}

[data-dfe-theme] [data-dfe-preview-value] {
  color: var(--dfe-color-text-muted, #475569);
}
`

export function mergeDfeTheme(theme?: DeepPartial<DfeThemeTokens>): DfeThemeTokens {
  return {
    colors: { ...dfeDefaultTheme.colors, ...theme?.colors },
    spacing: { ...dfeDefaultTheme.spacing, ...theme?.spacing },
    radius: { ...dfeDefaultTheme.radius, ...theme?.radius },
    typography: { ...dfeDefaultTheme.typography, ...theme?.typography },
    shadow: { ...dfeDefaultTheme.shadow, ...theme?.shadow },
  }
}

export function createDfeThemeVariables(theme: DfeThemeTokens): React.CSSProperties {
  return {
    ['--dfe-color-canvas' as const]: theme.colors.canvas,
    ['--dfe-color-surface' as const]: theme.colors.surface,
    ['--dfe-color-surface-muted' as const]: theme.colors.surfaceMuted,
    ['--dfe-color-border' as const]: theme.colors.border,
    ['--dfe-color-border-strong' as const]: theme.colors.borderStrong,
    ['--dfe-color-text' as const]: theme.colors.text,
    ['--dfe-color-text-muted' as const]: theme.colors.textMuted,
    ['--dfe-color-primary' as const]: theme.colors.primary,
    ['--dfe-color-primary-hover' as const]: theme.colors.primaryHover,
    ['--dfe-color-primary-foreground' as const]: theme.colors.primaryForeground,
    ['--dfe-color-focus' as const]: theme.colors.focus,
    ['--dfe-color-error' as const]: theme.colors.error,
    ['--dfe-color-error-surface' as const]: theme.colors.errorSurface,
    ['--dfe-color-success' as const]: theme.colors.success,
    ['--dfe-color-success-surface' as const]: theme.colors.successSurface,
    ['--dfe-space-xs' as const]: theme.spacing.xs,
    ['--dfe-space-sm' as const]: theme.spacing.sm,
    ['--dfe-space-md' as const]: theme.spacing.md,
    ['--dfe-space-lg' as const]: theme.spacing.lg,
    ['--dfe-space-xl' as const]: theme.spacing.xl,
    ['--dfe-space-2xl' as const]: theme.spacing['2xl'],
    ['--dfe-radius-sm' as const]: theme.radius.sm,
    ['--dfe-radius-md' as const]: theme.radius.md,
    ['--dfe-radius-lg' as const]: theme.radius.lg,
    ['--dfe-radius-pill' as const]: theme.radius.pill,
    ['--dfe-font-family' as const]: theme.typography.fontFamily,
    ['--dfe-font-size' as const]: theme.typography.fontSize,
    ['--dfe-label-size' as const]: theme.typography.labelSize,
    ['--dfe-helper-size' as const]: theme.typography.helperSize,
    ['--dfe-title-size' as const]: theme.typography.titleSize,
    ['--dfe-line-height' as const]: theme.typography.lineHeight,
    ['--dfe-shadow-sm' as const]: theme.shadow.sm,
    ['--dfe-shadow-md' as const]: theme.shadow.md,
  } as React.CSSProperties
}

export function DfeThemeProvider({
  children,
  theme,
  className,
  style,
}: DfeThemeProviderProps): React.ReactElement {
  const mergedTheme = useMemo(() => mergeDfeTheme(theme), [theme])
  const variables = useMemo(() => createDfeThemeVariables(mergedTheme), [mergedTheme])

  return React.createElement(
    'div',
    {
      className,
      'data-dfe-theme': true,
      style: { ...variables, ...style },
    },
    React.createElement('style', null, dfeBaseThemeCss),
    children,
  )
}
