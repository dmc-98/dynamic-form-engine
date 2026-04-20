# Choose Your Package

Start with the Stable lane unless you have a concrete reason not to.

As of March 13, 2026, that means:

- `@dmc--98/dfe-core`
- `@dmc--98/dfe-react`
- `@dmc--98/dfe-server`
- `@dmc--98/dfe-express`
- `@dmc--98/dfe-prisma` or `@dmc--98/dfe-drizzle`
- `@dmc--98/dfe-cli`

## Quick Picks

| If you need... | Start with... | Status |
| --- | --- | --- |
| The safest production path today | `core`, `react`, `server`, `express`, `prisma`/`drizzle`, `cli` | Stable |
| A ready-made themed UI without leaving the React renderer contract | `ui-mui`, `ui-antd`, or `ui-chakra` | Stable |
| GraphQL instead of REST | `@dmc--98/dfe-graphql` on top of `server` + your adapter | Beta |
| DFE forms embedded in a Docusaurus site | `@dmc--98/dfe-docusaurus` | Beta |
| Browser-verified authoring and preview | `@dmc--98/dfe-playground` | Stable |
| Visual drag-and-drop authoring | `@dmc--98/dfe-builder` | Beta |
| Alternative backend transport | `@dmc--98/dfe-fastify`, `@dmc--98/dfe-hono`, `@dmc--98/dfe-trpc` | Beta |
| Alternative frontend bindings | `@dmc--98/dfe-vue`, `@dmc--98/dfe-svelte`, `@dmc--98/dfe-solid`, `@dmc--98/dfe-angular`, `@dmc--98/dfe-vanilla` | Experimental |

## Recommended Combinations

### Production Default

Use this if you want the strongest verification story:

- `@dmc--98/dfe-core`
- `@dmc--98/dfe-react`
- `@dmc--98/dfe-server`
- `@dmc--98/dfe-express`
- `@dmc--98/dfe-prisma` or `@dmc--98/dfe-drizzle`
- `@dmc--98/dfe-cli`

This is the lane covered by root build/test/typecheck, the canonical fullstack example, and browser E2E.

### GraphQL API Surface

Use this if your app is already standardized on GraphQL:

- the Stable production default above
- `@dmc--98/dfe-graphql`

The GraphQL package reuses the stable server orchestration instead of forking submission logic. Treat it as a Beta surface until it has broader real-world example coverage.

### Docs Site Integration

Use this if you want live DFE examples inside a Docusaurus site:

- `@dmc--98/dfe-core`
- `@dmc--98/dfe-react`
- `@dmc--98/dfe-docusaurus`

This is a Beta adoption path. It is documented and smoke-verified, but it is not the canonical docs stack for the repo itself.

### Authoring Surfaces

Use this if your goal is configuration authoring rather than runtime delivery:

- `@dmc--98/dfe-playground`
- `@dmc--98/dfe-builder` when you specifically want the current visual builder surface

`@dmc--98/dfe-playground` is now browser-verified and stable. `@dmc--98/dfe-builder` remains Beta until it reaches the same proof level.

## Maturity Levels

- `Stable`: part of the strongest verified lane with broader docs and release gates.
- `Beta`: implemented, documented, and buildable, but not yet the main recommended production path.
- `Experimental`: useful package surface with lighter docs and verification coverage.

## AI Note

The current AI capabilities in DFE are built on authoring helpers in `@dmc--98/dfe-core` and surfaced through `@dmc--98/dfe-playground`:

- `generateFormFromDescription()`
- `suggestValidationRules()`
- `suggestAdditionalFields()`
- `generateAutofillDraft()`

The shipped draft-fill workflow is intentionally review-first: users must grant consent, inspect the proposed values, and explicitly apply them. It is not an autonomous submission feature.

## Next Reads

- [Supported Stack](/guide/supported-stack)
- [Production Checklist](/guide/production-checklist)
- [@dmc--98/dfe-graphql](/packages/graphql)
- [@dmc--98/dfe-docusaurus](/packages/docusaurus)
