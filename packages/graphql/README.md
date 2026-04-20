# @dmc--98/dfe-graphql

Beta GraphQL API helpers for Dynamic Form Engine.

This package provides a GraphQL schema, root resolvers, and an execution helper that reuse the stable DFE server contracts instead of forking form logic.

## Install

```bash
npm install @dmc--98/dfe-graphql @dmc--98/dfe-server graphql
```

## Exports

```ts
import {
  createDfeGraphqlApi,
  createDfeGraphqlSchema,
} from '@dmc--98/dfe-graphql'
```

## Operations

Queries:

- `listForms`
- `formBySlug`
- `formById`
- `submission`
- `submissions`
- `fieldOptions`
- `analytics`

Mutations:

- `createSubmission`
- `submitStep`
- `completeSubmission`

## Status

This package is `Beta`.

It is covered by:

- root `pnpm build`
- root `pnpm test`
- root `pnpm typecheck`
- package tests and typecheck
- wrapper smoke verification
