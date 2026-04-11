/**
 * Default unstyled components for @dmc-98/dfe-react.
 *
 * These are headless, minimal components that provide the structure
 * but leave styling entirely to you. Import from '@dmc-98/dfe-react/components'.
 *
 * For fully styled components, build your own or use a UI library.
 *
 * @example
 * ```tsx
 * import { DfeFormRenderer, DfeStepIndicator } from '@dmc-98/dfe-react/components'
 * ```
 */

export { DefaultFieldRenderer, DfeFormRenderer } from './components/DfeFormRenderer'
export type { DfeFormRendererProps } from './components/DfeFormRenderer'
export type { FieldRendererProps } from './renderers'

export { DfeStepIndicator } from './components/DfeStepIndicator'
export type { DfeStepIndicatorProps } from './components/DfeStepIndicator'

export { DfeFormPreview } from './components/DfeFormPreview'
export type { DfeFormPreviewProps } from './components/DfeFormPreview'

export { DfeResponsiveLayout } from './components/DfeResponsiveLayout'
export type { DfeResponsiveLayoutProps } from './components/DfeResponsiveLayout'
