---
layout: home

hero:
  name: "Dynamic Form Engine"
  text: "Build complex forms with zero UI lock-in"
  tagline: Configuration-driven forms with DAG-based dependencies, conditional logic, multi-step workflows, and backend persistence — all framework-agnostic.
  image:
    src: /logo.svg
    alt: Dynamic Form Engine
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/snarjun98/dynamic-form-engine

features:
  - icon: 🧠
    title: DAG-Based Dependencies
    details: Fields form a directed acyclic graph. When a value changes, only affected dependents re-evaluate — O(k) propagation instead of O(n) brute force.
  - icon: 🔀
    title: Conditional Logic
    details: Show, hide, require, or disable fields based on other field values. Supports 12 operators with AND/OR combinators, compiled to closures for speed.
  - icon: 📋
    title: Multi-Step Workflows
    details: Define form steps with skip conditions, per-step validation, and API contracts that persist data and propagate context (like generated IDs) across steps.
  - icon: 🔌
    title: Framework Agnostic
    details: The core engine is a plain TypeScript library with zero framework dependencies. Use it with React, Vue, Svelte, or vanilla JS — your choice.
  - icon: 🗄️
    title: ORM Adapters
    details: First-class adapters for Prisma and Drizzle ORM. Implement the DatabaseAdapter interface to plug in any backend you want.
  - icon: ✅
    title: Zod Validation
    details: Dynamic Zod schemas generated from field definitions. Per-field and per-step validation with custom field type registration via registerSchemaBuilder().
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #6366f1, #8b5cf6);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #6366f1 50%, #8b5cf6 50%);
  --vp-home-hero-image-filter: blur(44px);
}
</style>

## Quick Look

```ts
import { createFormEngine, createFormStepper } from '@dmc--98/dfe-core'

// 1. Create the engine from field definitions
const engine = createFormEngine(fields, existingData)

// 2. Set values — conditions auto-evaluate via DAG
const patch = engine.setFieldValue('role', 'admin')
console.log(patch.visibilityChanges) // Map { 'admin_panel' => true }

// 3. Validate before submission
const { success, errors } = engine.validate()

// 4. Multi-step navigation
const stepper = createFormStepper(steps, engine)
stepper.goNext()
```

## Supported Adoption Path

If you are starting with DFE today, follow the [Supported Stack](/guide/supported-stack) guide first.

That path is centered on:

- React for the frontend
- Express for HTTP delivery
- Prisma or Drizzle for persistence
- CLI scaffolding for project setup

It matches the package lane currently verified from the repo root.

## Package Ecosystem

| Package | Description |
|---------|-------------|
| [`@dmc--98/dfe-core`](/packages/core) | Zero-dep engine: types, DAG, conditions, validation, stepper |
| [`@dmc--98/dfe-server`](/packages/server) | Framework-agnostic backend: adapter interfaces, step submission pipeline |
| [`@dmc--98/dfe-express`](/packages/express) | Express route handlers — one-liner setup |
| [`@dmc--98/dfe-prisma`](/packages/prisma) | Prisma adapter + ready-to-use schema |
| [`@dmc--98/dfe-drizzle`](/packages/drizzle) | Drizzle adapter + PostgreSQL schema |
| [`@dmc--98/dfe-react`](/packages/react) | React hooks + optional headless components |
| [`@dmc--98/dfe-cli`](/packages/cli) | CLI scaffolding: `npx dfe init`, `npx dfe add` |
