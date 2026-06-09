// ─── @dmc--98/dfe-builder ─────────────────────────────────────────────────────
// Visual form builder for the Dynamic Form Engine.

// ── Established 3-panel builder API ──────────────────────────────────────────
export { DfeFormBuilder } from './components/DfeFormBuilder'
export { useBuilderState } from './useBuilderState'
export { FieldPalette } from './components/FieldPalette'
export { FormCanvas } from './components/FormCanvas'
export { PropertyEditor } from './components/PropertyEditor'
export { BuilderToolbar } from './components/BuilderToolbar'
export type { BuilderState, BuilderAction } from './types'
export type { FieldPaletteProps } from './components/FieldPalette'
export type { FormCanvasProps } from './components/FormCanvas'
export type { PropertyEditorProps } from './components/PropertyEditor'
export type { BuilderToolbarProps } from './components/BuilderToolbar'
export type { DfeFormBuilderProps } from './components/DfeFormBuilder'

// ── Drag-and-drop FormBuilder + headless state engine ────────────────────────
// A self-contained, dependency-free builder with native HTML5 drag-and-drop and
// a fully unit-tested headless reducer. Complements the panel components above.
// Its state types are named Dnd* at the source so they don't collide with the
// panel API's BuilderState/BuilderAction (the collision previously made the dts
// bundler silently drop this whole export block).
export { FormBuilder } from './FormBuilder'
export type { FormBuilderProps } from './FormBuilder'
export {
  createBuilderState,
  builderReducer,
  toFormConfig,
  makeField,
  deriveFieldKey,
} from './builder-state'
export type {
  DndBuilderState,
  DndBuilderAction,
  BuilderFormConfig,
} from './builder-state'

export const VERSION = '0.2.0'
