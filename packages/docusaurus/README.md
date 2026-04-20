# @dmc--98/dfe-docusaurus

Beta Docusaurus integration helpers for Dynamic Form Engine.

This package adds route generation and a lightweight DFE form page component so teams already standardized on Docusaurus can embed live DFE examples without forking the renderer stack.

It is ESM-first, which fits the normal `docusaurus.config.mjs` setup.

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

## Status

This package is `Beta`.

It is covered by:

- root `pnpm build`
- root `pnpm test`
- root `pnpm typecheck`
- package tests and typecheck
- wrapper smoke verification
