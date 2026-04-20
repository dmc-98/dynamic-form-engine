# @dmc--98/dfe-graphql

Beta GraphQL API helpers for Dynamic Form Engine.

## What This Package Is

`@dmc--98/dfe-graphql` gives you a GraphQL surface for the existing DFE server flow without forking the business logic already used by the REST adapters.

It exposes:

- a DFE GraphQL schema
- root resolvers for forms, submissions, field options, analytics, and completion flows
- an execution helper you can plug into your own GraphQL server

## What This Package Is Not

This package is not the main supported adoption path today. The canonical lane is still REST-oriented:

- `@dmc--98/dfe-server`
- `@dmc--98/dfe-express`
- `@dmc--98/dfe-prisma` or `@dmc--98/dfe-drizzle`

Use GraphQL when your application platform already expects it.

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

## Supported Operations

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

## Usage

```ts
import { createDfeGraphqlApi } from '@dmc--98/dfe-graphql'

const api = createDfeGraphqlApi({
  db,
  getUserId: context => context.userId,
  getTenantId: context => context.tenantId,
})

const result = await api.execute({
  source: `
    query {
      listForms {
        items {
          id
          slug
        }
      }
    }
  `,
  contextValue: {
    userId: 'user-1',
    tenantId: 'tenant-a',
  },
})
```

## Verification Status

This package is currently `Beta`.

It is covered by:

- root `pnpm build`
- root `pnpm test`
- root `pnpm typecheck`
- package tests and typecheck
- wrapper smoke verification

## Notes

- The GraphQL layer reuses the existing stable server orchestration for submission steps, completion, analytics, and experiment assignment.
- If you expose this surface publicly, keep the same auth, tenant-scoping, and rate-limiting discipline you would apply to the REST router.


---

## Links

- Source: [packages/graphql](https://github.com/dmc-98/dynamic-form-engine/tree/main/packages/graphql)
- Docs source: [docs/packages/graphql.md](https://github.com/dmc-98/dynamic-form-engine/blob/main/docs/packages/graphql.md)
- Issues: [https://github.com/dmc-98/dynamic-form-engine/issues](https://github.com/dmc-98/dynamic-form-engine/issues)
