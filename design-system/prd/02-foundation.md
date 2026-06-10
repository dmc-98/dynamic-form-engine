# PRD 02 — Foundation: tokens package &amp; theme reconciliation

Status: DRAFT (package scaffolded, edits to core/react pending approval). Parent: `00-master`.

## 1. Problem

Tokens live in `react/theme.ts`; other surfaces can't share them. The brand is
contradictory (teal primary vs. indigo `accent`/`surfaceMuted`). No ramps, dark
mode, motion, or aesthetic tokens.

## 2. Goals / success criteria

- `@dmc--98/dfe-tokens` is the single source: `tokens.css` (full canonical set) +
  typed `dfeDefaultTheme`/`DfeThemeTokens` + `dfeDataPalette` + `DFE_BRAND`.
- Indigo eliminated from brand usage everywhere (only `--dfe-data-2` may be indigo).
- `react/theme.ts` re-exports `DfeThemeTokens`/`dfeDefaultTheme` from the tokens
  package (no duplicate definition); its public exports are unchanged.
- `core/theme.ts` default `accent` → teal; stale `#eef2ff` fallbacks → slate.
- Builds (tsup) green; existing `react` theme tests green.

## 3. Scope

In: create package; move type+default into it; re-export from react; fix indigo in
`core/theme.ts`, `react/theme.ts` (incl. `dfeBaseThemeCss` fallbacks),
`renderers.tsx` and `DfeStepIndicator.tsx` `#eef2ff` fallbacks. Add aesthetic +
motion tokens (done in `tokens.css`). 

Out: builder/dashboard migration (PRD 03/04); renderer visual re-tuning beyond the
indigo fix + token alignment (tracked, with screenshots, in the renderer pass).

## 4. Plan (TDD)

1. **Red:** `tokens.test.ts` — brand invariants (primary teal, zero indigo except
   data-2), ramp completeness, dark+auto+reduced-motion present, css/object
   anti-drift. *(Drafted.)*
2. **Green:** finalize package; wire `react` dep + re-export; apply indigo fixes.
3. **Refactor:** ensure `createDfeThemeVariables` covers any new semantic vars used
   by the renderer.
4. **Proof:** `pnpm --filter @dmc--98/dfe-tokens build && test`; `pnpm --filter
   @dmc--98/dfe-react build && test`; `pnpm --filter @dmc--98/dfe-core test`. Paste
   counts. Node invariant check already passes (30/30) in-session.

## 5. Constraints / risks

- tokens package must stay framework-agnostic (no React import) — verified
  (plain interface + object).
- Moving symbols risks import breakage → mitigated by re-export; grep confirmed
  only `react/__tests__/theme.test.ts` references them, and it compares to object
  values (not literals), so default-value alignment won't break it.

## 6. Open questions

- Keep `core/theme.ts exportTheme()` API or deprecate toward importing tokens?
  (Lean keep + document.)
