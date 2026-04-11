# @dmc-98/dfe-ui-mui

Stable MUI-themed wrappers for the shared DFE React renderer contract.

## What This Package Is

`@dmc-98/dfe-ui-mui` gives you a Material-inspired presentation layer for:

- field rendering
- step indicators
- form preview screens

It is built on top of the shared renderer contract from `@dmc-98/dfe-react/renderers`.

## What This Package Is Not

This package does not currently render native `@mui/material` components.
It provides a stable MUI-like visual language and token preset without requiring Material UI as a runtime dependency.

If you need direct `@mui/material` component integration, use `renderField` with your own renderer on top of `@dmc-98/dfe-react`.

## Install

```bash
npm install @dmc-98/dfe-ui-mui @dmc-98/dfe-react @dmc-98/dfe-core react react-dom
```

## Exports

```tsx
import {
  MuiFieldRenderer,
  DfeMuiStepIndicator,
  DfeMuiFormPreview,
  DfeMuiThemeProvider,
} from '@dmc-98/dfe-ui-mui'
```

## Usage

```tsx
import { DfeFormRenderer } from '@dmc-98/dfe-react/components'
import { MuiFieldRenderer } from '@dmc-98/dfe-ui-mui'

<DfeFormRenderer
  fields={visibleFields}
  values={values}
  onFieldChange={setFieldValue}
  errors={errors}
  renderField={MuiFieldRenderer}
/>
```

## Theming

Wrap any UI surface with `DfeMuiThemeProvider` to apply the package tokens:

```tsx
<DfeMuiThemeProvider>
  <DfeMuiStepIndicator steps={steps} currentIndex={currentIndex} />
</DfeMuiThemeProvider>
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
