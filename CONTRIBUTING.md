# Contributing to Dynamic Form Engine

Thanks for your interest in contributing! This guide will help you get set up and submit high-quality contributions.

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+ (`npm install -g pnpm`)

### Getting Started

```bash
git clone https://github.com/snarjun98/dynamic-form-engine.git
cd dynamic-form-engine
pnpm install
pnpm build
pnpm test
```

### Monorepo Structure

| Package | Path | Description |
|---------|------|-------------|
| `@dmc-98/dfe-core` | `packages/core` | Types, DAG engine, conditions, validation, stepper |
| `@dmc-98/dfe-server` | `packages/server` | Framework-agnostic backend logic |
| `@dmc-98/dfe-express` | `packages/express` | Express route handlers |
| `@dmc-98/dfe-prisma` | `packages/prisma` | Prisma database adapter |
| `@dmc-98/dfe-drizzle` | `packages/drizzle` | Drizzle ORM database adapter |
| `@dmc-98/dfe-react` | `packages/react` | React hooks and components |
| `@dmc-98/dfe-cli` | `packages/cli` | CLI scaffolding tool |

### Useful Commands

```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Smoke the wrapper packages that sit beyond the stable lane
pnpm test:smoke:wrappers

# Run release-readiness checks (packaging + export validation)
pnpm release:check

# Typecheck all packages
pnpm typecheck

# Run tests in watch mode (from a package directory)
cd packages/core && pnpm test:watch

# Build docs locally
cd docs && pnpm dev
```

### Optional Turbo Remote Caching

Maintainers can opt into shared Turbo remote caching locally:

```bash
export TURBO_TEAM=your-team
export TURBO_TOKEN=your-token
pnpm build
```

Optional variables:

- `TURBO_API` — override the remote cache endpoint
- `TURBO_REMOTE_ONLY` — force remote-only cache behavior

If those env vars are not set, Turbo uses the normal local cache and the repo still works as expected.

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/repeatable-groups` — new features
- `fix/stale-closure-runtime` — bug fixes
- `docs/api-reference-update` — documentation
- `refactor/dag-performance` — code improvements
- `test/stepper-edge-cases` — test additions

### Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add repeatable field group support
fix(express): prevent duplicate submission on race condition
docs(react): add useFormRuntime hook examples
test(server): add step-submit pipeline edge cases
chore: update dependencies
```

Scope should be the package name without the `dfe-` prefix: `core`, `server`, `express`, `prisma`, `drizzle`, `react`, `cli`, `docs`.

### Code Style

- TypeScript strict mode — no `any` unless absolutely necessary (use `Record<string, unknown>`)
- Explicit return types on exported functions
- JSDoc comments on all public APIs
- Use UUIDv7 for all ID generation (via `generateId()` from `@dmc-98/dfe-server`)
- Prefer `const` over `let`, never use `var`
- Use named exports, not default exports

### Testing

Every PR should include tests for new functionality or bug fixes:

```bash
# Run tests for a specific package
cd packages/core && pnpm test

# Run with coverage
cd packages/core && pnpm test -- --coverage
```

- Unit tests go in `__tests__/` directories next to the source
- Use Vitest for all test files
- Aim for meaningful coverage — test behavior, not implementation details

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. Make your changes with tests
3. Ensure `pnpm build && pnpm test && pnpm typecheck` all pass
4. Run `pnpm test:smoke:wrappers` if you touched Fastify, Hono, tRPC, Angular, Vanilla, Vue, Svelte, or Solid
5. Run `pnpm release:check` if you changed package exports, package.json publish metadata, or release tooling
6. Update documentation if you changed public APIs
7. Open a PR with a clear title and description

### PR Checklist

- [ ] Tests added/updated
- [ ] TypeScript compiles cleanly (`pnpm typecheck`)
- [ ] All existing tests pass (`pnpm test`)
- [ ] Wrapper smoke checks pass if wrapper packages were touched (`pnpm test:smoke:wrappers`)
- [ ] Release-readiness checks pass if package metadata or exports changed (`pnpm release:check`)
- [ ] Documentation updated (if public API changed)
- [ ] Commit messages follow conventional commits
- [ ] No `console.log` left in production code

### Review Process

- All PRs require at least one review
- CI must be green before merge
- We aim to review PRs within 48 hours

## Reporting Issues

### Bug Reports

Please include:

1. What you expected to happen
2. What actually happened
3. Minimal reproduction (code snippet or repo link)
4. Package version(s) and Node.js version

### Feature Requests

Describe the problem you're trying to solve, not just the solution you want. This helps us find the best approach.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
