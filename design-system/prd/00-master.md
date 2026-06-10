# PRD 00 — Frontend Revamp (Master)

Status: **DRAFT — awaiting sign-off.** No product code is changed until this and
the per-surface PRDs are approved. Children: `01-motion-and-interaction`,
`02-foundation`, `03-builder`, `04-dashboard`, `05-playground`, `06-marketing`,
`07-docs-storybook`, `08-ui-adapters`.

## 1. Problem

`dynamic-form-engine` has a partial, unenforced design language. Tokens exist in
`react/theme.ts` but the builder and dashboard use ad-hoc inline styles; the brand
is incoherent (teal primary bleeding into indigo `#6366f1`/`#eef2ff`); there is no
dark mode, no motion system, and no shared aesthetic across the renderer, builder,
dashboard, playground, marketing site, and docs. The product looks like six
different apps. For an open-source dev tool competing for stars and adoption, the
frontend is the storefront — and it currently undersells the engine.

## 2. Goals / success criteria

- **One system, every surface.** All human-facing surfaces consume the single
  `@dmc--98/dfe-tokens` source (CSS vars + typed object). Zero hardcoded brand
  hex/px in shipped component code.
- **Coherent expressive-modern identity** ("Graphite & Teal"): slate neutrals, a
  single teal accent, tasteful depth (gradients, layered shadows, glass overlays),
  generous rounding. Approved via `preview.html`.
- **Showcase-level motion** that is purposeful, fast, and fully reversible under
  `prefers-reduced-motion` (see PRD 01).
- **Light + dark + auto**, WCAG AA contrast on text and UI in both.
- **No regressions:** existing unit/e2e suites stay green; public package APIs
  unchanged (or additively extended).
- **Adoption signal:** the README hero, playground, and docs visibly reflect the
  new system (qualitative; this is the storefront).

## 3. Non-goals

- No functional/behavioral changes to the form engine, validation, DAG, or APIs —
  this is a visual + interaction revamp only.
- No new component framework or CSS-framework migration (we formalize the existing
  CSS-var approach).
- No rebrand of the project name, logo wordmark, or domain.

## 4. Principles

1. **Semantic tokens only** in components; primitives never referenced directly.
2. **Headless-respecting:** all styling scoped under `[data-dfe-theme]`; we never
   touch host global styles.
3. **Re-theming is a public contract:** consumers override semantic tokens; we
   document the supported surface and guard it with tests.
4. **Motion serves meaning:** every animation communicates state, hierarchy, or
   continuity — never decoration for its own sake. Always reduced-motion-safe.
5. **Progressive, reversible delivery:** one surface per stage, each its own
   changeset/PR with proof.

## 5. Workstreams & order

| # | PRD | Surface | Blast radius |
|---|-----|---------|--------------|
| 02 | Foundation | `packages/tokens`, reconcile `core`/`react` theme | Low |
| 01 | Motion & interaction | shared motion spec + `motion.css` utilities | Low |
| 03 | Builder | `packages/builder` | High (many inline styles) |
| 04 | Dashboard | `packages/dashboard` + data-viz | High |
| 05 | Playground | `packages/playground` landing island | Medium |
| 06 | Marketing | `marketing/landing` (Astro) | Medium |
| 07 | Docs + Storybook | `packages/docusaurus`, `.storybook` | Medium |
| 08 | ui-* adapters | antd/chakra/mantine/mui/shadcn — **default re-skin, all five** | High / risky |

Foundation + Motion land first (they unblock everything). Builder and Dashboard
are the highest-value product surfaces. ui-adapters come last; all five are in
scope (default DFE theme), with shadcn implemented first only for fast feedback —
not as a scope gate.

## 6. TDD & verification approach (per CLAUDE.md "proof of working")

Each stage follows red → green → refactor with proof matched to the change:

- **Tokens / pure logic** — vitest unit tests (brand invariants, anti-drift,
  ramp completeness, contrast assertions) + a runnable Node check. *Already
  drafted for foundation.*
- **Components (builder/dashboard/renderer)** — vitest + Testing Library for
  behavior; **Storybook stories** as the visual surface; **headed Playwright**
  e2e capturing before/after screenshots in light + dark, plus a
  reduced-motion run. Visual diffs attached to each PR.
- **Marketing/docs** — build succeeds; Playwright screenshot of the rendered
  hero/home in both themes.
- **Contrast** — automated check (axe / contrast-ratio assertion) on key
  text-on-surface and text-on-primary pairs, light and dark.
- **Visual regression (decided):** committed **Playwright screenshot snapshots**
  (`expect(page).toHaveScreenshot()`) for builder/dashboard/playground/marketing in
  light + dark, run in CI; baselines reviewed in-PR. No external service for v1;
  Chromatic can be layered on later if hosted review is wanted.
- Every PR states: exact commands, env, pass/fail counts, artifact paths.
  Anything not executable in-session is marked **UNVERIFIED** with verify steps.

> Sandbox note: this Linux session can run pure-Node checks but not the full
> vitest/Playwright toolchain (esbuild/browsers are installed for the host
> macOS). Full suites are run on the host; in-session work ships invariant
> checks + the static `preview.html` as visual evidence.

## 7. Constraints

- Stack: pnpm workspace + turbo + tsup + vitest + Playwright + Storybook 8;
  React 18; Astro (marketing); Docusaurus (docs). No new heavy deps without an ADR.
- Public package exports must not break (re-export when moving symbols).
- IBM Plex Sans/Mono everywhere (approved).

## 8. Risks & mitigations

- **Builder/dashboard inline-style sprawl** → migrate file-by-file behind tests;
  snapshot before/after.
- **ui-adapter re-skin fights host theming** (approved but risky) → pilot shadcn
  only, review, then decide on the rest (PRD 08).
- **Motion overuse / perf** → strict token-bound durations, GPU-friendly
  transforms only, reduced-motion fallback enforced by lint/check.
- **Contrast in dark mode** (teal-700 fails on slate-900) → primary shifts to
  teal-400 in dark; verified.

## 9. Open questions

1. `packages/tokens` — confirmed dedicated (approved). Should `core/theme.ts`'s
   `exportTheme()` consumer API be deprecated in favor of importing tokens, or
   kept for back-compat? (Lean: keep + document.)
2. Marketing: any scroll-driven hero animation budget concerns for low-end devices?
3. Do we want a visual-regression service (Chromatic/Playwright snapshots in CI),
   or PR-attached screenshots only, for v1?
