# @dmc--98/dfe-docusaurus

Beta Docusaurus integration helpers for Dynamic Form Engine.

## What This Package Is

`@dmc--98/dfe-docusaurus` helps teams embed live DFE examples into a Docusaurus site without rebuilding the renderer stack from scratch.

It provides:

- a lightweight plugin factory for route generation
- a preset helper for Docusaurus config
- a `DfeFormPage` component that renders a live form from supplied config

The package is ESM-first, which fits the normal `docusaurus.config.mjs` setup.

## What This Package Is Not

This is not the repo's primary docs stack. The DFE repo itself still uses VitePress.

Treat this package as a Beta integration path for teams that are already standardized on Docusaurus.

## Install

```bash
npm install @dmc--98/dfe-docusaurus @dmc--98/dfe-core @dmc--98/dfe-react react react-dom
```

## Exports

```ts
import {
  createDfeDocusaurusPlugin,
  createDfeDocusaurusPreset,
  DfeFormPage,
} from '@dmc--98/dfe-docusaurus'
```

## Usage

```ts
import { createDfeDocusaurusPreset } from '@dmc--98/dfe-docusaurus'

export default {
  presets: [
    createDfeDocusaurusPreset({
      routeBasePath: '/forms',
      forms: [
        {
          id: 'employee-onboarding',
          title: 'Employee Onboarding',
          formConfig: {
            fields: [
              {
                id: 'field-full-name',
                versionId: 'version-1',
                key: 'full_name',
                label: 'Full Name',
                type: 'SHORT_TEXT',
                required: true,
                order: 1,
                config: {},
              },
            ],
          },
        },
      ],
    }),
  ],
}
```

See the package example config in `packages/docusaurus/examples/docusaurus.config.mjs` for a concrete starting point.

## Verification Status

This package is currently `Beta`.

It is covered by:

- root `pnpm build`
- root `pnpm test`
- root `pnpm typecheck`
- package tests and typecheck
- wrapper smoke verification

## Notes

- `DfeFormPage` uses the shared `@dmc--98/dfe-react` renderer contract.
- This package is best for live docs examples, product onboarding flows, and internal documentation portals.
