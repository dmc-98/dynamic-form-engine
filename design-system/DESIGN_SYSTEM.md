# DFE Design System — "Graphite & Teal"

Status: **DRAFT — awaiting approval.** No package code has been changed yet. This
document plus `tokens.css` and `preview.html` are the approval artifacts.

---

## 1. Why this exists

`dynamic-form-engine` already ships a partial token system in
`packages/react/src/theme.ts` (`DfeThemeTokens`) and a CSS-var emitter in
`packages/core/src/theme.ts`. The problem is not the absence of a system — it's
that the system is **inconsistent and unenforced**:

- **Brand contradiction.** `react/theme.ts` sets `primary: #0f766e` (teal) while
  `core/theme.ts` defaults `accent: #6366f1` (indigo) and `surfaceMuted: #eef2ff`
  (an indigo tint). The product reads as teal-with-indigo-bleed.
- **Ad-hoc styling.** The builder and dashboard components use inline `style={{}}`
  with hardcoded hex/px values instead of consuming the tokens. The "system"
  lives in one file the rest of the app ignores.
- **No full scales.** Single-stop colors, no ramps, no dark mode, no motion /
  z-index / elevation tokens, off-grid spacing (0.375 / 0.625 / 0.875rem).

This spec resolves all of the above with one coherent, layered token set that
**every** surface consumes: builder, dashboard, playground, marketing landing,
Storybook, and Docusaurus.

## 2. Direction & rationale

**Graphite & Teal** — a precise, engineered aesthetic for a developer-first form
engine. Cool slate/graphite neutrals carry the UI; a single confident teal accent
(evolved from the existing `#0f766e`) does all the "this is interactive / this is
ours" work.

Why this direction:

- **Honors existing code.** Teal is already the de-facto primary, so we keep it
  and kill the stray indigo rather than re-skinning from zero.
- **Differentiates.** The form-tool market (Typeform, Tally, Formspree, Google
  Forms) is a wall of blue/indigo/purple. Teal on graphite reads as technical and
  trustworthy without being generic.
- **Headless-friendly.** It's quiet by default — a strong neutral base means the
  rendered end-user forms inherit a clean look that consumers can re-theme by
  overriding a handful of semantic tokens.

## 3. Token architecture (3 layers)

Tokens live in `tokens.css`, all prefixed `--dfe-`, scoped to `[data-dfe-theme]`
so host pages are never polluted. Three layers, consumed top-down only:

1. **Primitives** — raw scales (`--dfe-slate-500`, `--dfe-teal-700`, `--dfe-space-4`).
   Components must **never** reference these directly.
2. **Semantic** — intent tokens (`--dfe-color-surface`, `--dfe-color-primary`,
   `--dfe-color-danger`, `--dfe-space-md`). **This is the only layer components touch.**
3. **Theme remap** — dark mode (and `auto`/OS) re-point the *semantic* layer;
   primitives are constant.

Rule of thumb: if a component references `--dfe-slate-*` or `--dfe-teal-*`
directly, that's a bug — it should reference a semantic token.

### 3.1 Color — primitives

Neutral (graphite/slate): `0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`
Brand (teal): `50 … 950`, with `700 = #0f766e` (legacy primary preserved).
Status ramps (compressed): green, amber, red, sky.
Data-viz categorical: `--dfe-data-1…6` (teal, indigo, amber, rose, violet, cyan)
for dashboard charts.

### 3.2 Color — semantic (light)

| Token | Role | Light value |
|---|---|---|
| `--dfe-color-canvas` | App background | slate-50 |
| `--dfe-color-surface` | Cards, inputs, panels | white |
| `--dfe-color-surface-muted` | Secondary fills, hover rows | slate-100 |
| `--dfe-color-border` | Default 1px lines | slate-200 |
| `--dfe-color-border-strong` | Emphasis dividers | slate-300 |
| `--dfe-color-text` | Body / headings | slate-900 |
| `--dfe-color-text-muted` | Secondary text | slate-600 |
| `--dfe-color-text-subtle` | Hints, placeholders | slate-500 |
| `--dfe-color-primary` | Brand actions | teal-700 |
| `--dfe-color-primary-hover` / `-active` | Interaction states | teal-800 / 900 |
| `--dfe-color-primary-subtle` | Selected / tinted bg | teal-50 |
| `--dfe-color-focus` | Focus ring (rgba) | teal @ 0.28 |
| `--dfe-color-success` / `-surface` | Positive | green-700 / green-100 |
| `--dfe-color-warning` / `-surface` | Caution | amber-700 / amber-100 |
| `--dfe-color-danger` / `-surface` | Error / destructive | red-700 / red-100 |
| `--dfe-color-info` / `-surface` | Neutral notice | sky-700 / sky-100 |

`--dfe-color-error[-surface]` are kept as **aliases** of `danger` so existing
renderer CSS keeps working unchanged.

### 3.3 Dark mode

`[data-dfe-color-scheme="dark"]` (explicit) or `="auto"` (follows OS) remap the
semantic layer. Notably, in dark mode `--dfe-color-primary` shifts to **teal-400**
so the accent stays legible on dark surfaces (teal-700 fails contrast on slate-900).

### 3.4 Typography

- **UI / body:** `IBM Plex Sans` (kept from current theme — its engineered,
  slightly technical character fits the brand).
- **Code / numerics:** `IBM Plex Mono` (config snippets, submission payloads,
  analytics figures).
- **Scale:** `xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30 · 4xl 36`.
- **Weights:** 400 / 500 / 600 / 700. **Line-height:** tight 1.25, normal 1.5,
  relaxed 1.7.

### 3.5 Spacing — 4px grid

`0, 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64` (px).
The old `xs/sm/md/lg/xl/2xl` names are retained as **aliases** onto the grid, so
existing components don't break — but new work uses the numeric scale.

### 3.6 Radius / border / elevation / motion / z-index

- **Radius:** `xs 4 · sm 6 · md 8 · lg 12 · xl 16 · 2xl 24 · pill`.
- **Border widths:** thin 1 · medium 1.5 · thick 2.
- **Elevation:** `shadow-xs … shadow-xl` (5 steps), dark-mode-aware.
- **Motion:** durations `instant 80 · fast 120 · base 160 · slow 240` ms;
  easings `standard · emphasized · out`. Auto-zeroed under
  `prefers-reduced-motion`.
- **Z-index:** `base · raised · sticky · dropdown · overlay · modal · toast`.

## 4. Component recipes

Built entirely from semantic tokens. The preview page renders all of these.

- **Button** — primary (filled teal), secondary (surface + border), ghost,
  danger. Height tied to spacing; radius `md`; focus ring via `--dfe-color-focus`.
- **Input / select / textarea** — `surface` bg, `border` line, radius `md`,
  focus → `primary` border + ring, `aria-invalid` → `danger` border + `danger-surface`.
- **Form field** — label (`sm`, semibold), control, helper/description
  (`sm`, muted), error message (chip on `danger-surface`).
- **Panel / card** — `surface` on `canvas`, `border`, radius `lg`, `shadow-sm`.
- **Badge / chip** — pill, status-surface backgrounds (used for field-type chips
  in the builder palette and status pills in the dashboard).
- **Builder palette item** — draggable chip, `surface-muted`, hover → `primary-subtle`.
- **Dashboard stat card** — large numeric (`3xl`, mono), label (`sm`, muted),
  trend in `success`/`danger`.
- **Stepper** — pill steps; active → `primary-subtle` + `primary` border (already
  present in renderer CSS, re-expressed via tokens).

## 5. Usage rules

1. **Semantic only.** Components reference semantic tokens, never primitives.
2. **No raw hex/px in components.** If a value isn't a token, it's a gap — add a
   token, don't hardcode.
3. **Scope, don't leak.** All styling stays under `[data-dfe-theme]`; we never set
   global `:root`, `body`, or element selectors in shipped packages.
4. **Re-theming is a contract.** Consumers re-skin by overriding semantic tokens
   only. Document which tokens are the supported "public" surface.
5. **Contrast.** Text-on-surface and text-on-primary pairs meet WCAG AA (≥4.5:1
   for body, ≥3:1 for large/UI). Verified for both light and dark in the preview.

## 6. Rollout plan (after approval — not done yet)

Staged so each step is independently reviewable and reversible:

1. **Foundation.** Land `tokens.css` into `packages/core` (or a new
   `packages/tokens`) and re-export it; reconcile `core/theme.ts` defaults
   (kill indigo) and `react/theme.ts` to source from these tokens. *Renderer
   already uses `--dfe-*`, so it benefits immediately with near-zero churn.*
2. **Builder.** Replace inline `style={{}}` in builder components with
   token-backed classes (`FieldPalette`, `FormCanvas`, `PropertyEditor`,
   `BuilderToolbar`).
3. **Dashboard.** Same treatment for `FormsList`, `SubmissionsList`,
   `AnalyticsPanel`, `TemplateGallery` + the data-viz palette for charts.
4. **Playground.** Re-skin the landing island; wire the live theme controls to
   the semantic tokens.
5. **Marketing landing (Astro).** Mirror the tokens into the site's stylesheet so
   the marketing look matches the product.
6. **Storybook + Docusaurus.** Theme Storybook (manager + preview) and the docs
   site with the same tokens; add a "Design Tokens" docs page driven by this file.
7. **Verification.** Per repo standards: visual regression via Storybook stories
   + headed Playwright screenshots (light/dark) for builder & dashboard, and a
   contrast check. Capture before/after.

Each stage is a separate changeset and PR. Step 1 is low blast radius; steps 2–3
touch many files and will get a per-step plan before execution.

## 7. Open questions

- **`packages/tokens` vs. fold into `core`?** A dedicated package is cleaner for
  the Astro site + docs to consume, but adds a workspace package. Leaning
  dedicated — confirm.
- **Marketing font.** Keep IBM Plex across marketing too, or allow a display face
  for hero headings only?
- **`ui-*` adapters.** Confirm these stay host-library-native (antd/mui/etc.) and
  are explicitly **out of scope** for re-skinning — they should inherit their host
  look, not the DFE look.
