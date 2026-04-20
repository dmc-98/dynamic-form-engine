# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of all packages
- `@dmc--98/dfe-core` — DAG engine, condition compiler, Zod validation generator, form stepper
- `@dmc--98/dfe-server` — Framework-agnostic step submission pipeline, UUIDv7 ID generation
- `@dmc--98/dfe-express` — Express route handlers with auth, ownership checks, query sanitization
- `@dmc--98/dfe-prisma` — Prisma database adapter with UUIDv7 support
- `@dmc--98/dfe-drizzle` — Drizzle ORM database adapter with transaction support
- `@dmc--98/dfe-react` — React hooks (`useFormEngine`, `useFormStepper`, `useFormRuntime`)
- `@dmc--98/dfe-cli` — CLI scaffolding tool (`dfe init`, `dfe add`)
- VitePress documentation site
- Centralized config system (`dfe.config.ts`)

### Security

- Authorization middleware with ownership verification on all submission endpoints
- Query parameter sanitization to prevent injection via filter passthrough
- ReDoS protection for user-supplied regex patterns
- Stale closure fix in `useFormRuntime` using `useRef`
- Strict equality in condition compiler (no loose `==` comparisons)
- SSRF documentation for custom API contract executors
- UUIDv7 for all server-generated IDs
