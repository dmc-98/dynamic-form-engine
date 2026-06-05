# Serverless Feasibility Audit

Last updated: March 13, 2026

This document answers two practical questions:

1. Which backend-facing DFE packages are feasible in serverless environments today?
2. What still needs to be built for true remote collaboration, not just browser-local sync?

## Executive Summary

- The project now has two real collaboration lanes:
  - browser-local collaboration for low-latency same-browser sync
  - server-backed remote collaboration for the Hono + Prisma serverless reference path
- A real serverless collaboration architecture is no longer just feasible on paper; it is implemented and browser-verified in the reference lane.
- The best current foundation for serverless is:
  - `@dmc--98/dfe-core`
  - `@dmc--98/dfe-server`
  - `@dmc--98/dfe-hono`
  - `@dmc--98/dfe-drizzle` or a carefully configured `@dmc--98/dfe-prisma`
- The remaining caveats are mostly about breadth and production hardening, not the existence of a serverless collaboration path:
  - only the Hono + Prisma reference lane is browser-verified today
  - observability is still lightweight rather than full OpenTelemetry
  - some adapter defaults remain process-local unless explicitly overridden
  - the Express `app.listen()` example remains the stable Node lane, not the serverless-first lane

## Collaboration Status Today

What exists today:

- deterministic field-operation merge semantics in `@dmc--98/dfe-core`
- participant presence and snapshots
- offline queueing and IndexedDB persistence in `@dmc--98/dfe-react`
- browser-verified cross-tab editing in the canonical example
- server collaboration contracts in `@dmc--98/dfe-server`
- Hono collaboration endpoints for join, snapshot, operations, presence, and SSE streaming
- durable Prisma-backed collaboration storage
- browser-verified remote collaboration against the serverless reference app

What still remains after the follow-through:

- broader adapter coverage beyond the Hono + Prisma reference lane
- stronger deployment recipes for hosted serverless providers
- richer auth/join-token stories if the project wants collaboration invitations beyond current tenant/user scoping
- deeper observability and operational guidance for production serverless deployments

Current implementation proof points:

- `packages/core/src/sync.ts`
- `packages/react/src/sync.ts`
- `packages/react/src/useFormSync.ts`
- `examples/fullstack/web/src/App.tsx`
- `packages/server/src/collaboration.ts`
- `packages/hono/src/index.ts`
- `packages/prisma/src/collaboration.ts`
- `examples/fullstack/api/src/serverless-app.ts`

The key nuance now is that collaboration has both a local and a remote mode. `BroadcastChannel` still powers the lowest-friction local path, while the serverless reference lane moves coordination to the backend with durable session state and SSE fan-out.

## Package Feasibility Matrix

| Package / surface | Serverless feasibility | Reality check |
| --- | --- | --- |
| `@dmc--98/dfe-core` | Yes | Pure logic/types. Good fit for serverless and edge execution. |
| `@dmc--98/dfe-server` | Yes, with durable implementations | The contracts are mostly stateless and adapter-driven. Default observability/analytics helpers must not be mistaken for durable infra. |
| `@dmc--98/dfe-hono` | Best fit | Hono is the strongest current wrapper for fetch-style serverless and edge runtimes. |
| `@dmc--98/dfe-graphql` | Yes | Pure execution layer. Feasibility depends on the surrounding HTTP/runtime adapter and database choice. |
| `@dmc--98/dfe-trpc` | Yes | Feasible when hosted through a serverless-compatible adapter. |
| `@dmc--98/dfe-express` | Partial | Fine for Node-style serverless wrappers, but not the best serverless-first or edge target. |
| `@dmc--98/dfe-fastify` | Partial | Feasible in Node serverless, less attractive than Hono for serverless-first design. |
| `@dmc--98/dfe-prisma` | Yes, with caveats | Feasible if the chosen runtime, driver, connection strategy, and pooling model fit the target platform. Default dynamic-resource execution is still in-memory unless overridden. |
| `@dmc--98/dfe-drizzle` | Yes | Structurally the cleanest current ORM adapter for serverless-first work. Default dynamic-resource execution still needs a real implementation. |
| `@dmc--98/dfe-mongoose` | Partial | Reasonable for Node serverless, not edge-friendly, and still relies on in-memory dynamic-resource execution by default. |
| `@dmc--98/dfe-sqlite` | Poor fit for distributed serverless | Useful for local/dev and single-node setups, not a good default for horizontally distributed serverless collaboration. |
| `examples/fullstack/api` | Yes, via the serverless entrypoint | The package now contains both the stable Express entrypoint and a Hono-based serverless reference entrypoint for remote collaboration. |

## Concrete Blockers Found In The Codebase

### Collaboration transport now has a remote path

- `packages/react/src/sync.ts` now provides both the browser-local `BroadcastChannel` transport and a remote transport that talks to collaboration endpoints over HTTP + SSE.
- `packages/react/src/useFormSync.ts` works against the shared transport contract, so the same sync model powers local and remote collaboration.

### Offline persistence is browser-only

- `packages/react/src/sync.ts` uses IndexedDB and memory persistence adapters.

That is correct for draft/offline behavior, but it does not help share state across users or devices.

### Some backend defaults are process-local

- `packages/express/src/rate-limit.ts` uses an in-memory `Map` and `setInterval`.
- `packages/server/src/observability.ts` includes an in-memory span exporter.
- `packages/prisma/src/adapter.ts`, `packages/drizzle/src/adapter.ts`, `packages/mongoose/src/index.ts`, and `packages/sqlite/src/index.ts` all default dynamic-resource execution to in-memory storage if no custom executor is supplied.

These are acceptable defaults for local development, but not durable serverless production primitives.

### The example package now has both Node and serverless shapes

- `examples/fullstack/api/src/server.ts` remains the stable Express server.
- `examples/fullstack/api/src/serverless-app.ts` and `examples/fullstack/api/src/serverless.ts` provide the Hono-based serverless reference path used by the dedicated browser suite.

That means the example package is now useful for both the stable Node lane and the serverless collaboration reference lane.

## What “Real Collaboration” Should Mean Here

For this project, real collaboration should mean:

- multiple users on multiple devices can edit the same in-progress draft
- shared state survives page refreshes and cold starts
- presence is visible and expires correctly
- field edits are durably ordered and merged
- authorization is enforced before joining a session
- the implementation works in a serverless deployment model

## Recommended Serverless Collaboration Architecture

Use the current sync model, but move coordination to the backend.

### 1. Keep the shared sync model

Retain the current `@dmc--98/dfe-core` sync document, lamport ordering, conflict rules, and snapshot shape.

### 2. Add server collaboration contracts

Add collaboration-specific server abstractions, either in `@dmc--98/dfe-server` or a dedicated collaboration package:

- `CollaborationStore`
- `CollaborationPresenceStore`
- `CollaborationAuthProvider`
- `CollaborationTransportBroker`

Minimum responsibilities:

- join session
- load snapshot
- append operation
- upsert presence heartbeat
- prune expired presence
- stream remote events

### 3. Prefer a serverless-friendly transport

Recommended order:

1. SSE outbound + HTTP POST inbound
2. managed realtime/pub-sub channel
3. platform-specific durable WebSocket coordination if the target platform supports it well

Why SSE first:

- easier to run in serverless than custom WebSocket infra
- simpler auth and replay semantics
- good fit for append-only operation streams

### 4. Build around durable storage

The collaboration backend needs durable storage for:

- session metadata
- latest snapshot
- operation log
- presence heartbeats with TTL

Good categories of backing store:

- durable serverless objects or actors
- Redis-compatible stores with pub/sub and TTL
- Postgres plus append-only operations and snapshot checkpoints

### 5. Make Hono the first-class serverless wrapper

If we want one serverless-first backend surface, Hono is the best current target package.

Recommended reference shape:

- `POST /dfe/collab/sessions/:id/join`
- `GET /dfe/collab/sessions/:id/stream`
- `POST /dfe/collab/sessions/:id/operations`
- `POST /dfe/collab/sessions/:id/presence`
- `GET /dfe/collab/sessions/:id/snapshot`

### 6. Keep tenant/auth constraints first-class

Collaboration must be tenant-aware and submission-aware:

- session membership should be tied to tenant/form/submission boundaries
- join should require an authenticated user and an authorization check
- operation writes should carry actor identity from the server-authenticated session, not trust a raw client actor id

## Recommended Implementation Backlog

1. Add collaboration server contracts and types.
2. Add a Hono-first serverless collaboration transport.
3. Add a durable collaboration store implementation.
4. Add remote presence heartbeats and pruning.
5. Add a serverless reference example.
6. Replace or clearly scope in-memory rate limiting and analytics/tracing defaults for serverless deployments.
7. Add browser E2E with two isolated clients, not just two tabs in one local browser context.

## Bottom Line

- Yes, most of the backend package architecture is feasible in serverless.
- No, real remote collaboration is not done yet.
- The codebase is already close enough architecturally that this is an implementation project, not a rewrite.
- If we want one serverless-first path, the best target is Hono + durable collaboration store + SSE-style streaming.
