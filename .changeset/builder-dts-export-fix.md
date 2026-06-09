---
"@dmc--98/dfe-builder": patch
---

Fix missing type declarations for the headless builder API. The `FormBuilder` component and the `createBuilderState` / `builderReducer` / `toFormConfig` / `makeField` / `deriveFieldKey` functions (plus the `DndBuilderState` / `DndBuilderAction` / `BuilderFormConfig` types) were present at runtime but absent from the published `.d.ts`, so TypeScript consumers got "has no exported member" errors. Declarations are now emitted via `tsc` (the previous bundler silently dropped this export block due to a `BuilderState`/`BuilderAction` name collision; the headless state types are now named `Dnd*` at the source). No runtime change.
