---
"@dmc--98/dfe-core": minor
"@dmc--98/dfe-builder": minor
---

Builder editing + headless theming for the visual builder / playground:

- **dfe-builder:** new reducer actions — `MOVE_FIELD_BY` (keyboard-accessible relative reorder, clamped), `ADD_OPTION` / `UPDATE_OPTION` / `REMOVE_OPTION` (selection-field option editing, keeps ≥1 option, dedupes values), and `SET_VALIDATION` (per-field validation rules in config, with rule-clearing).
- **dfe-core:** new `exportTheme()` / `defaultTheme()` — export a form theme as both CSS custom properties and a token object, so styling is code the consumer owns. No runtime styling is imposed; DFE stays headless.
