# @dmc--98/dfe-builder

## 1.0.0

### Major Changes

- 6e7dab0: s

### Patch Changes

- Updated dependencies [6e7dab0]
  - @dmc--98/dfe-react@1.0.0
  - @dmc--98/dfe-core@1.0.0

## 0.4.0

### Minor Changes

- cfd0f46: Add an `UPDATE_STEP` reducer action to edit a step's title/description (e.g. renaming a step in a visual builder). Unknown step ids are a no-op.

## 0.3.0

### Minor Changes

- 8f1b13c: Builder editing + headless theming for the visual builder / playground:
  - **dfe-builder:** new reducer actions — `MOVE_FIELD_BY` (keyboard-accessible relative reorder, clamped), `ADD_OPTION` / `UPDATE_OPTION` / `REMOVE_OPTION` (selection-field option editing, keeps ≥1 option, dedupes values), and `SET_VALIDATION` (per-field validation rules in config, with rule-clearing).
  - **dfe-core:** new `exportTheme()` / `defaultTheme()` — export a form theme as both CSS custom properties and a token object, so styling is code the consumer owns. No runtime styling is imposed; DFE stays headless.

### Patch Changes

- 8f1b13c: Fix missing type declarations for the headless builder API. The `FormBuilder` component and the `createBuilderState` / `builderReducer` / `toFormConfig` / `makeField` / `deriveFieldKey` functions (plus the `DndBuilderState` / `DndBuilderAction` / `BuilderFormConfig` types) were present at runtime but absent from the published `.d.ts`, so TypeScript consumers got "has no exported member" errors. Declarations are now emitted via `tsc` (the previous bundler silently dropped this export block due to a `BuilderState`/`BuilderAction` name collision; the headless state types are now named `Dnd*` at the source). No runtime change.
- 8f1b13c: Code-review hardening of the milestone work:
  - **core (CSV formula injection — critical):** `exportSubmissionsToCsv`/`exportFormToCsv` now neutralize spreadsheet formula injection (cells starting with `= + - @` tab/CR are prefixed with `'`) and render objects as JSON instead of `[object Object]`.
  - **core (review):** `buildReviewSummary` no longer crashes on a field with `undefined` config and resolves numeric SELECT values to their option labels (string coercion).
  - **core (theme):** `exportTheme` strips `;{}<>` from string values so a malformed theme can't break out of the CSS declaration or a `<style>` block.
  - **core (templates):** the NPS-survey follow-up now uses `not_empty` (show once scored) instead of an always-true `gte 0`. `flow-model` sorts deterministically (tie-break on id).
  - **builder:** `SET_VALIDATION` is restricted to an allow-list of validation keys so it can't corrupt structural config (`options`, `mode`).
  - **server (auth):** `requireRole` guards against a non-array `roles` shape (fails closed 403, never throws). **payment:** rejects non-integer amounts and compares currency case-insensitively; non-Error throws stringify safely. **notify:** documented that `notify` rejects on transport/template errors so callers don't fail the submission flow.

- Updated dependencies [8f1b13c]
- Updated dependencies [f9159d7]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
  - @dmc--98/dfe-core@0.3.0
  - @dmc--98/dfe-react@0.1.2

## 0.2.0

### Minor Changes

- f3c43c7: Add a functional drag-and-drop visual form builder. The package now ships a headless builder state engine (`createBuilderState`, `builderReducer`, `toFormConfig`, `makeField`, `deriveFieldKey`) and a React `FormBuilder` component with native HTML5 drag-and-drop: add fields from a palette, reorder by dragging, edit field properties (label, key, required), remove fields, and emit a DFE-ready config via `onChange`.

### Patch Changes

- f3c43c7: Improve package docs and npm package pages, harden release publishing against npm throttling, and fix docs and release workflow reliability. No breaking API changes.
- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
  - @dmc--98/dfe-core@0.2.0
  - @dmc--98/dfe-react@0.1.1
