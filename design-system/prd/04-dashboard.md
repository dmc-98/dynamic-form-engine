# PRD 04 — Dashboard revamp &amp; data-viz

Status: DRAFT. Parent: `00-master`. Surface: `packages/dashboard`.

## 1. Problem

`FormsList`, `SubmissionsList`, `AnalyticsPanel`, `TemplateGallery`, `DfeDashboard`
use inline styles, have no shared chart palette, no dark mode, and static charts.

## 2. Goals / success criteria

- All dashboard components on semantic tokens; charts use `dfeDataPalette`
  (`--dfe-data-1..6`).
- Expressive-modern: stat cards with depth + hover lift, glassy headers,
  token-driven tables with hover rows, status pills via status-surface tokens.
- Motion: stats count-up (or fade), chart bars/lines grow-in (staggered), row
  hover, skeleton loaders for async panels, toast on actions.
- Empty, loading, and error states designed and tokenized.
- Light + dark; AA contrast on data colors against both canvases.

## 3. Scope

In: visual + interaction for all dashboard components; the data-viz palette wiring;
table/list/card/pill patterns; loading/empty/error states.

Out: analytics data model, API hooks behavior (`useDashboardApi`) — logic
untouched. New analytics metrics are product PRDs.

## 4. Plan (TDD)

1. Baseline Storybook + Playwright screenshots.
2. **Red:** tests asserting chart series map to `--dfe-data-*` tokens (not
   hardcoded), status pills use status tokens, skeleton shows while `loading`.
3. **Green:** migrate FormsList → SubmissionsList → AnalyticsPanel →
   TemplateGallery → shell.
4. **Refactor:** shared `StatCard`, `DataTable`, `Chart` wrappers on tokens.
5. **Proof:** vitest green; Playwright screenshots light/dark + reduced-motion;
   contrast check on the 6 data colors over light and dark surfaces.

## 5. Risks

- Charts: confirm rendering tech (SVG/canvas/lib?) before wiring palette — audit
  `AnalyticsPanel` first. Contrast of 6 categorical colors in dark mode may need
  per-mode tints.

## 6. Open questions

- Is there a charting dependency already, or are charts hand-rolled? (Audit gates
  the palette-wiring approach.)
- Count-up animation on stats: desirable or distracting for an analytics view?
