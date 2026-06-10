// ─── DFE Design Tokens ────────────────────────────────────────────────────────
// Single source of truth for the dynamic-form-engine visual language
// ("Graphite & Teal"). Framework-agnostic: no React, no DOM, just data.
//
// Two artifacts ship from this package:
//   • `tokens.css`      — the full canonical CSS custom-property set (all ramps,
//                          semantic layer, dark mode). Import for any surface
//                          that can load a stylesheet (Astro, docs, Storybook).
//   • `dfeDefaultTheme` — the runtime-overridable *semantic* subset consumed by
//                          the React renderer's DfeThemeProvider. Its values are
//                          the light-mode projection of `tokens.css`; keeping the
//                          two in agreement is enforced by tokens.test.ts.

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

/**
 * The default DFE theme — light-mode semantic values, identical to the
 * `[data-dfe-theme]` light layer in `tokens.css`. Override any subset via
 * `DfeThemeProvider`.
 */
export const dfeDefaultTheme: DfeThemeTokens = {
  colors: {
    canvas: '#f8fafc', // slate-50
    surface: '#ffffff', // slate-0
    surfaceMuted: '#f1f5f9', // slate-100  (was #eef2ff indigo — fixed)
    border: '#e2e8f0', // slate-200
    borderStrong: '#cbd5e1', // slate-300
    text: '#0f172a', // slate-900
    textMuted: '#475569', // slate-600
    primary: '#0f766e', // teal-700
    primaryHover: '#115e59', // teal-800
    primaryForeground: '#f8fafc',
    focus: 'rgba(13, 148, 136, 0.28)', // teal @ 0.28
    error: '#b91c1c', // red-700
    errorSurface: '#fee2e2', // red-100
    success: '#15803d', // green-700
    successSurface: '#dcfce7', // green-100
  },
  spacing: {
    xs: '0.25rem', //  4 — space-1
    sm: '0.5rem', //  8 — space-2
    md: '0.75rem', // 12 — space-3
    lg: '1.25rem', // 20 — space-5
    xl: '2rem', // 32 — space-8
    '2xl': '3rem', // 48 — space-12
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    pill: '999px',
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Avenir Next", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: '1rem',
    labelSize: '0.875rem',
    helperSize: '0.875rem',
    titleSize: '1.5rem',
    lineHeight: '1.5',
  },
  shadow: {
    sm: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
    md: '0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
  },
}

/** Categorical palette for dashboard data-viz (charts, series). */
export const dfeDataPalette = [
  '#0d9488', // teal
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#e11d48', // rose
  '#8b5cf6', // violet
  '#0891b2', // cyan
] as const

/** Brand identity constants — the things that must never silently drift. */
export const DFE_BRAND = {
  /** Primary accent (light mode). */
  primary: '#0f766e',
  /** Font stack. */
  fontFamily: dfeDefaultTheme.typography.fontFamily,
} as const
