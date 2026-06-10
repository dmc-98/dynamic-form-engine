# PRD 05 — Playground re-skin

Status: DRAFT. Parent: `00-master`. Surface: `packages/playground` (landing island).

## 1. Problem

The playground is the interactive proof that sells the engine, but it's visually
plain and off-brand. It also has live theme controls that should map to the new
semantic tokens.

## 2. Goals / success criteria

- Playground adopts the full system + motion; feels like the hero of the README.
- Live theme controls (accent/radius/density/font) drive the **semantic tokens**
  in real time, demonstrating re-theming as a first-class feature.
- A "switch theme" + "dark mode" affordance shows token power instantly.
- Preview widgets for all field types reflect the new field styling.

## 3. Scope

In: visual + interaction skin of `DfePlayground`; theme-control panel wired to
tokens; live preview styling; export view polish.

Out: adding new field types / builder features (separate product plan, see
`PLAYGROUND_PLAN.md`).

## 4. Plan (TDD)

1. Baseline screenshot.
2. **Red:** test that moving a theme control updates the corresponding
   `--dfe-*` variable on the scope; reduced-motion inert.
3. **Green:** re-skin; wire controls → `createDfeThemeVariables`.
4. **Proof:** vitest green; Playwright: change accent → assert preview recolors;
   screenshots light/dark.

## 5. Risks / open questions

- Playground runs as an island on the marketing/landing site — coordinate token
  loading with PRD 06 to avoid double-defining vars.
