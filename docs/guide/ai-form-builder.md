# AI Form Builder

::: warning Roadmap — not yet implemented
The AI Form Builder is a planned feature. This page documents the intended design and the API surface DFE is building toward so the community can give feedback early. Nothing here is available in a published release yet, and the API is subject to change. Track progress in the project roadmap and GitHub Discussions.
:::

## What it will be

The AI Form Builder will let you describe a form in plain language — "a three-step contractor onboarding form that asks for tax details only for US-based contractors" — and get back a complete, typed DFE configuration: fields, conditions, validation, steps, and branching. It turns the slowest part of building a workflow form (translating requirements into a correct config) into a conversation, while keeping DFE's core promise that the output is just data you own and can edit.

It builds directly on the AI authoring primitives already in `@dmc--98/dfe-core` (`generateFormFromDescription`, `suggestValidationRules`, `suggestAdditionalFields`, `detectFormType`), graduating them from individual helpers into a guided, end-to-end authoring experience in the Playground and Builder.

## Design principles

The builder is being designed to stay true to how DFE works rather than bolting on a black box. Generation is **provider-agnostic**: you bring your own LLM provider through a thin abstraction, and no AI calls are hardcoded to a single vendor or required to use DFE at all. Output is **inspectable and editable** — the AI produces a normal DFE config object that you review, diff, and tweak by hand; there is no hidden runtime that re-generates your form on every load. And the workflow is **review-first**: like the existing consent-based draft-fill flow, the builder proposes and you approve. It never silently publishes or auto-submits.

## Intended capabilities

The first version aims to cover the full authoring loop. From a natural-language prompt it will generate a draft form configuration, including fields with sensible types, conditional visibility and requirement rules, multi-step structure, and validation. From there it will support iterative refinement ("make the address step optional", "add a signature field at the end") applied as diffs against the current config, suggestion of missing fields and stronger validation based on the form's detected purpose, and import from an existing form description or screenshot into an editable DFE config. Generated forms will be runnable in the Playground immediately and exportable as code or JSON.

## Planned API shape

The exact signatures will be finalized during implementation, but the direction looks like this:

```ts
import { createAiFormBuilder } from '@dmc--98/dfe-core' // planned

const builder = createAiFormBuilder({
  // Bring your own provider — DFE never calls a vendor directly.
  provider: myLlmProvider,
})

// 1. Generate a draft config from a description
const draft = await builder.generate(
  'A 3-step loan application: applicant details, financials with a computed monthly estimate, and a review step.',
)

// 2. Refine it conversationally — returns a diff against the current config
const refined = await builder.refine(draft, 'Require an employer name only when the applicant is employed.')

// 3. Inspect and accept (review-first; nothing is published automatically)
console.log(refined.changes) // human-readable summary of what changed
const config = refined.config // a normal DFE config you can edit and run
```

The `provider` abstraction is the key boundary: it accepts a prompt and returns text, so any hosted or self-hosted model can power the builder, and safety/cost/PII controls live in your provider implementation.

## Safety and trust

Because the builder generates configuration rather than executing anything, the trust model is straightforward: review before you ship. DFE will additionally document prompt-injection and data-handling guidance for teams that wire the builder to production LLM providers, and the review-first flow ensures a human approves every generated or refined form before it is used. Computed-field expressions in generated configs are author-controlled and should be treated as code, exactly as they are today.

## Status and feedback

This feature is on the roadmap and not yet shipped. If your team would use it, the most useful thing you can do now is share the kinds of forms you would describe to it and the provider you would want to plug in — that feedback shapes the first release. See the project roadmap and open a GitHub Discussion to weigh in.
