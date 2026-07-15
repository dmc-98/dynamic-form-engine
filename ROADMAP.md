# Roadmap

Dynamic Form Engine ships as a TypeScript monorepo: headless core, React/Vue/Svelte/Angular/Solid/vanilla bindings, server adapters (Express, Fastify, Hono, tRPC, GraphQL), and DB adapters (Prisma, Drizzle, Mongoose, SQLite).

This is the public Now / Next / Later view. Have a feature request? [Open an issue](https://github.com/dmc-98/dynamic-form-engine/issues) — community input drives prioritization.

## Now

- First public npm release under the `@dmc--98` scope
- "Graphite & Teal" design-system rollout across builder, dashboard, playground, and docs
- Playground polish and interactive examples

## Next

- Performance budgets and published benchmarks (render P95, bundle size)
- Accessibility hardening toward WCAG 2.2 AA
- Expanded AI features: ~~provider-agnostic adapters~~ ✓, ~~document-to-form~~ ✓, ~~audio/transcript-to-form~~ ✓

## Later

- Community-driven: vote with 👍 on issues

## Shipped

Conditional logic & branching steps, computed fields, repeatable groups, async validation, autosave/undo, i18n, form versioning, visual builder, JSON Schema import/export, AI form generation, UI kits (MUI/AntD/Chakra), webhooks, plugin system, multi-tenant support, offline support, observability, comprehensive E2E test suite (12 suites / 324 tests, `pnpm run e2e`), and more — see [CHANGELOG.md](./CHANGELOG.md).
