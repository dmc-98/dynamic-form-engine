# PRD 07 — Docs (Docusaurus) + Storybook theming

Status: DRAFT. Parent: `00-master`. Surfaces: `packages/docusaurus`, `.storybook/`.

## 1. Problem

Storybook and the Docusaurus docs site use default themes, disconnected from the
product look. Storybook is also our component visual-test surface, so it should
render components under the real tokens.

## 2. Goals / success criteria

- **Storybook:** global decorator wraps stories in `[data-dfe-theme]` and loads
  `tokens.css`; a light/dark toolbar toggle; manager + preview themed to brand.
  Becomes the canonical visual-regression surface for builder/dashboard.
- **Docusaurus:** Infima variables mapped to `--dfe-*`; brand nav/hero; a generated
  **"Design Tokens"** docs page (ramps, semantic tokens, motion catalog) sourced
  from `@dmc--98/dfe-tokens`.
- IBM Plex; light + dark.

## 3. Scope

In: Storybook `preview.tsx`/`main.ts` theming + decorator + toggle; Docusaurus
theme config + custom CSS + tokens docs page.

Out: writing prose docs content beyond the tokens page.

## 4. Plan (TDD)

1. **Green:** add Storybook decorator + theme; map Docusaurus Infima vars; build
   tokens page from the package.
2. **Proof:** `storybook build` + `docusaurus build` succeed; Playwright
   screenshot a sample story and the docs home in light/dark; verify toggle.

## 5. Open questions

- Generate the tokens docs page at build time from the package, or hand-author and
  test for drift? (Lean: generate.)
