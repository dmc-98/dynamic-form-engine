# PRD 06 — Marketing site (Astro)

Status: DRAFT. Parent: `00-master`. Surface: `marketing/landing` (Astro).

## 1. Problem

The marketing landing site is a separate Astro stack with its own look. It must
match the product's new identity and carry the strongest first impression.

## 2. Goals / success criteria

- Astro site imports `@dmc--98/dfe-tokens/tokens.css`; uses semantic tokens
  (no parallel palette).
- Expressive-modern hero: gradient mesh background, gradient-clipped headline,
  glass nav, staggered scroll reveals, the playground island embedded.
- Showcase motion: scroll-driven section reveals, hover micro-interactions, CTA
  sheen — all reduced-motion-safe.
- IBM Plex everywhere; dark mode supported (respects OS via `auto`).
- Lighthouse: performance ≥ 90 mobile, no CLS from animations.

## 3. Scope

In: token import + theming; hero, features, footer, nav; motion; dark mode;
playground island integration.

Out: copywriting/IA changes (content is a marketing PRD); new pages.

## 4. Plan (TDD)

1. Baseline screenshot + Lighthouse.
2. **Green:** add token import; build sections from tokens; add reveal helper
   (reduced-motion-safe).
3. **Proof:** `astro build` succeeds; Playwright screenshots home light/dark +
   reduced-motion; Lighthouse perf/CLS check.

## 5. Risks / open questions

- Scroll-driven effects on low-end mobile → gate by viewport/`prefers-reduced-motion`.
- Token loading strategy: inline critical vars vs. linked stylesheet (FOUC).
