# @dmc-98/dfe-ui-chakra

Stable Chakra-themed wrappers for the shared DFE React renderer contract.

## What This Package Is

`@dmc-98/dfe-ui-chakra` gives you a Chakra-inspired presentation layer for:

- field rendering
- step indicators
- form preview screens

It is built on top of the shared renderer contract from `@dmc-98/dfe-react/renderers`.

## What This Package Is Not

This package does not currently render native `@chakra-ui/react` components.
It provides a stable Chakra-style visual language and token preset without requiring Chakra UI as a runtime dependency.

If you need direct Chakra component integration, use `renderField` with your own renderer on top of `@dmc-98/dfe-react`.

## Install

```bash
npm install @dmc-98/dfe-ui-chakra @dmc-98/dfe-react @dmc-98/dfe-core react react-dom
```

## Exports

```tsx
import {
  ChakraFieldRenderer,
  DfeChakraStepIndicator,
  DfeChakraFormPreview,
  DfeChakraThemeProvider,
} from '@dmc-98/dfe-ui-chakra'
```

## Usage

```tsx
import { DfeFormRenderer } from '@dmc-98/dfe-react/components'
import { ChakraFieldRenderer } from '@dmc-98/dfe-ui-chakra'

<DfeFormRenderer
  fields={visibleFields}
  values={values}
  onFieldChange={setFieldValue}
  errors={errors}
  renderField={ChakraFieldRenderer}
/>
```

## Theming

Wrap any UI surface with `DfeChakraThemeProvider` to apply the package tokens:

```tsx
<DfeChakraThemeProvider>
  <DfeChakraStepIndicator steps={steps} currentIndex={currentIndex} />
</DfeChakraThemeProvider>
```

You can override individual CSS variables with `style` if needed.

## Verification Status

This package is part of the stable verification set for:

- root `pnpm build`
- root `pnpm test`
- root `pnpm typecheck`
- stable artifact smoke checks
- stable coverage checks
- Storybook build
