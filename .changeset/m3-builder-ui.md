---
"@dmc--98/dfe-builder": minor
---

Add a functional drag-and-drop visual form builder. The package now ships a headless builder state engine (`createBuilderState`, `builderReducer`, `toFormConfig`, `makeField`, `deriveFieldKey`) and a React `FormBuilder` component with native HTML5 drag-and-drop: add fields from a palette, reorder by dragging, edit field properties (label, key, required), remove fields, and emit a DFE-ready config via `onChange`.
