# PRD 08 — ui-* adapter re-skin (default, all five)

Status: APPROVED direction — **default re-skin of all five adapters**. Parent:
`00-master`. Surfaces: `ui-shadcn`, `ui-antd`, `ui-mui`, `ui-chakra`, `ui-mantine`.

## 1. Problem & decision

Re-skin the host-library adapters so DFE forms render in Graphite & Teal **by
default** across antd, MUI, Chakra, Mantine, and shadcn.

**Trade-off (acknowledged, accepted):** these adapters normally inherit the host
app's look; making the DFE brand the default means each adapter ships a DFE theme
applied out-of-the-box, overriding five different theming systems (antd
ConfigProvider, MUI `createTheme`, Chakra `extendTheme`, Mantine
`MantineProvider`, shadcn CSS vars). Higher effort + upstream-churn maintenance —
accepted per decision. We still expose an escape hatch so a consumer can opt back
into pure host theming, but **DFE look is the default**.

## 2. Goals / success criteria

- Each adapter applies a DFE theme by default: primary = teal, surfaces, radius,
  typography, spacing, focus ring, and **dark mode** all driven from
  `@dmc--98/dfe-tokens`.
- A documented escape hatch (`disableDfeTheme` / pass-through) restores host
  defaults for consumers who want it.
- Showcase motion applied where the host library allows (focus, hover, transitions)
  without breaking the library's own a11y/behavior.
- Visual parity across all five verified in light + dark.

## 3. Scope

In: a DFE theme preset per library, applied by default in each adapter's provider;
dark mode; focus/hover/transition motion; per-adapter example + stories + tests;
the opt-out hook.

Out: re-implementing host components; changing adapter public APIs beyond the
additive opt-out flag.

## 4. Plan (TDD) — pilot shadcn first for fast feedback, then the rest

1. **Pilot (shadcn):** red — assert DFE theme sets shadcn CSS vars (primary=teal,
   etc.) by default; green — implement; proof — Playwright light/dark screenshots.
2. **Roll to the other four** in parallel-able PRs (antd → MUI → Chakra → Mantine),
   each: red (theme-mapping test) → green → screenshot proof.
3. Each adapter: verify opt-out restores host look; verify dark mode; contrast check.

> Pilot-first is an execution ordering for tight feedback, **not** a gate to drop
> scope — all five are in.

## 5. Risks & mitigations

- Upstream theme API churn / partial component coverage → pin versions; document
  any components that can't fully match; cover with screenshots.
- Five parallel theming models → shared `tokensToX()` mappers, one per library,
  unit-tested against `@dmc--98/dfe-tokens`.

## 6. Open questions

- Opt-out API name/shape: prop (`disableDfeTheme`) vs. separate un-themed export?
  (Lean: prop on the provider.)
