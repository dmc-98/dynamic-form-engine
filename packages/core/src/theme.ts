// ─── Form Theme ───────────────────────────────────────────────────────────────
// DFE is headless: it owns no styling. This helper lets a builder/playground
// export a theme the consumer fully owns — as CSS custom properties (drop into
// any stylesheet) and as a plain token object (feed into CSS-in-JS or a design
// system). It's the "your theme is also code you own" counterpart to config
// and component code export.

export interface FormTheme {
  /** Accent / primary color (any CSS color string). */
  accent: string
  /** Corner radius in px. */
  radius: number
  /** Vertical input padding (density) in px. */
  density: number
  /** Field-label font weight (100–900). */
  labelWeight: number
  /** Font family stack. */
  fontFamily: string
}

export interface ExportThemeOptions {
  /** CSS selector the variables are scoped to (default ':root'). */
  selector?: string
}

export interface ThemeExport {
  /** A ready-to-paste CSS rule defining the DFE theme custom properties. */
  css: string
  /** The fully-resolved token object (defaults merged with overrides). */
  tokens: FormTheme
}

/** The default DFE theme. */
export function defaultTheme(): FormTheme {
  return {
    accent: '#6366f1',
    radius: 8,
    density: 10,
    labelWeight: 600,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  }
}

/**
 * Export a (possibly partial) theme as CSS custom properties and a token object.
 *
 * @example
 * ```ts
 * const { css, tokens } = exportTheme({ accent: '#0ea5e9' })
 * // css   → ":root {\n  --dfe-accent: #0ea5e9;\n  ... }"
 * // tokens → fully-resolved FormTheme
 * ```
 */
export function exportTheme(
  theme: Partial<FormTheme>,
  options: ExportThemeOptions = {},
): ThemeExport {
  const tokens: FormTheme = { ...defaultTheme(), ...theme }
  const selector = options.selector ?? ':root'

  // Strip characters that would let a string value break out of the CSS
  // declaration (or a surrounding <style> block). Numbers are emitted as-is.
  const safe = (v: string) => v.replace(/[;{}<>]/g, '')

  const lines = [
    `--dfe-accent: ${safe(tokens.accent)};`,
    `--dfe-radius: ${tokens.radius}px;`,
    `--dfe-density: ${tokens.density}px;`,
    `--dfe-label-weight: ${tokens.labelWeight};`,
    `--dfe-font-family: ${safe(tokens.fontFamily)};`,
  ]
  const css = `${selector} {\n${lines.map(l => `  ${l}`).join('\n')}\n}`

  return { css, tokens }
}
