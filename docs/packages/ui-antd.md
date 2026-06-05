# @dmc--98/dfe-ui-antd

Stable Ant Design-themed wrappers for the shared DFE React renderer contract.

## What This Package Is

`@dmc--98/dfe-ui-antd` gives you an Ant-inspired presentation layer for:

- field rendering
- step indicators
- form preview screens

It is built on top of the shared renderer contract from `@dmc--98/dfe-react/renderers`.

## What This Package Is Not

This package does not currently render native `antd` components.
It provides a stable Ant-style visual language and token preset without requiring Ant Design as a runtime dependency.

If you need direct `antd` component integration, use `renderField` with your own renderer on top of `@dmc--98/dfe-react`.

## Install

```bash
npm install @dmc--98/dfe-ui-antd @dmc--98/dfe-react @dmc--98/dfe-core react react-dom
```

## Exports

```tsx
import {
  AntdFieldRenderer,
  DfeAntdStepIndicator,
  DfeAntdFormPreview,
  DfeAntdThemeProvider,
} from '@dmc--98/dfe-ui-antd'
```

## Usage

```tsx
import { DfeFormRenderer } from '@dmc--98/dfe-react/components'
import { AntdFieldRenderer } from '@dmc--98/dfe-ui-antd'

<DfeFormRenderer
  fields={visibleFields}
  values={values}
  onFieldChange={setFieldValue}
  errors={errors}
  renderField={AntdFieldRenderer}
/>
```

## Theming

Wrap any UI surface with `DfeAntdThemeProvider` to apply the package tokens:

```tsx
<DfeAntdThemeProvider>
  <DfeAntdFormPreview fields={fields} values={values} />
</DfeAntdThemeProvider>
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
