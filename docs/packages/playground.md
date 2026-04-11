# @dmc-98/dfe-playground

`@dmc-98/dfe-playground` is the stable authoring surface for DFE.

As of March 13, 2026, it is browser-verified through the example app at `/playground` and covered by:

- package tests
- root build/test/typecheck
- built-artifact smoke coverage
- Playwright authoring coverage via `pnpm test:e2e:playground`

## What It Includes

- JSON config editing
- live preview using the shared React renderer
- template loading
- config validation
- AI-assisted config generation through `generateFormFromDescription()`
- validation-rule suggestions through `suggestValidationRules()`
- additional-field suggestions through `suggestAdditionalFields()`
- review-first AI-assisted draft fill through `generateAutofillDraft()`

## Important Boundaries

- The draft-fill workflow requires explicit user consent before generating a draft.
- Proposed values are shown for review before they are applied.
- The playground never auto-submits the form after draft generation or draft application.
- The current implementation is deterministic and local-first. It does not require a remote model provider.

## Run It

From the repo root:

```bash
pnpm install
pnpm build
pnpm --dir examples/fullstack/api dev
pnpm --dir examples/fullstack/web dev
```

Then open:

- `http://localhost:5173/playground` for the Playground
- `http://localhost:5173/` for the canonical runtime example

## Verification

```bash
pnpm --dir packages/playground test
pnpm --dir packages/playground typecheck
pnpm test:e2e:playground
```

## When To Use It

Use the Playground when you want:

- fast iteration on raw DFE config
- authoring-time AI assistance without wiring your own provider
- a reviewable draft-fill reference implementation

Use the Builder when you want a more visual drag-and-drop surface and are comfortable staying on the current Beta lane.
