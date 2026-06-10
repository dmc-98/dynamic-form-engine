# @dmc--98/dfe-tokens

Canonical design tokens for Dynamic Form Engine — the **"Graphite & Teal"**
visual language. Framework-agnostic and the single source of truth every DFE
surface (renderer, builder, dashboard, playground, marketing, docs) consumes.

## What ships

- **`tokens.css`** — the full canonical set of `--dfe-*` CSS custom properties:
  primitive ramps (slate, teal, status, data-viz), a semantic layer, dark mode
  (`[data-dfe-color-scheme="dark"]` / `auto`), plus motion, radius, elevation and
  z-index scales. Scoped to `[data-dfe-theme]` so host pages stay isolated.
- **`dfeDefaultTheme`** — the runtime-overridable semantic subset (light-mode
  projection) used by the React `DfeThemeProvider`.
- **`dfeDataPalette`** — 6-color categorical palette for dashboard charts.
- **`DFE_BRAND`** — brand invariants (primary accent, font stack).

## Usage

Stylesheet surfaces (Astro, Docusaurus, Storybook, plain HTML):

```css
@import "@dmc--98/dfe-tokens/tokens.css";
```

```html
<div data-dfe-theme data-dfe-color-scheme="auto"> … </div>
```

React (runtime theming / overrides):

```ts
import { dfeDefaultTheme, type DfeThemeTokens } from "@dmc--98/dfe-tokens"
```

## Layering rule

Components consume the **semantic** layer only (`--dfe-color-surface`,
`--dfe-color-primary`, …). Never reference primitives (`--dfe-slate-500`) directly.
Dark mode and re-theming work by remapping the semantic layer; primitives are
constant.

Brand/anti-drift invariants are enforced by `__tests__/tokens.test.ts`.
