# Design System — Graphite &amp; Teal

The Dynamic Form Engine ships one design language across every surface — the form
renderer, the visual builder, the dashboard, the playground, the marketing site,
and these docs. It is delivered as design tokens from
[`@dmc--98/dfe-tokens`](https://github.com/dmc-98/dynamic-form-engine/tree/main/packages/tokens).

## Using the tokens

```css
@import "@dmc--98/dfe-tokens/tokens.css";
@import "@dmc--98/dfe-tokens/motion.css"; /* optional: keyframes + utilities */
```

```html
<div data-dfe-theme data-dfe-color-scheme="auto">…</div>
```

```ts
import { dfeDefaultTheme, dfeDataPalette, DFE_BRAND } from "@dmc--98/dfe-tokens"
```

Components consume the **semantic** layer only (`--dfe-color-surface`,
`--dfe-color-primary`, `--dfe-space-4`…). Primitives (`--dfe-slate-500`) are never
referenced directly. Dark mode and re-theming work by remapping the semantic layer.

## Foundations

**Color.** A graphite/slate neutral ramp (`--dfe-slate-0…950`) carries structure;
a single teal accent (`--dfe-teal-50…950`, primary = `#0f766e`) marks everything
interactive. Status: success/warning/danger/info. A 6-color categorical
`--dfe-data-1…6` palette drives dashboard charts.

**Typography.** IBM Plex Sans (UI/body) + IBM Plex Mono (code/numerics). Scale:
`xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30 · 4xl 36`.

**Spacing.** 4px grid (`--dfe-space-1…16`). **Radius.** `sm 6 · md 8 · lg 12 · xl 16`.
**Elevation.** `--dfe-shadow-xs…xl`. **Aesthetic.** gradients (`--dfe-gradient-brand`,
`--dfe-gradient-hero`), glass (`--dfe-glass-*`).

**Motion.** Durations `instant 80 · fast 120 · base 160 · slow 240` ms; easings
`standard · out · emphasized · spring`. Every animation is bound to these tokens
and disabled under `prefers-reduced-motion`.

**Theming.** `[data-dfe-color-scheme="dark"]` (or `"auto"` to follow the OS)
remaps the semantic layer. Text-on-surface and text-on-primary meet WCAG AA in
both light and dark.

## Per-surface stylesheets

| Surface | Import |
|---|---|
| Builder panels | `@dmc--98/dfe-builder/builder.css` |
| Playground | `@dmc--98/dfe-playground/playground.css` |
| Docusaurus | `@dmc--98/dfe-docusaurus/theme.css` (Infima mapping) |
| Storybook | tokens + motion loaded in `.storybook/preview.tsx` |
