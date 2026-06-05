# Performance

This page documents how Dynamic Form Engine performs and, more importantly, how to reproduce the numbers yourself. We publish the harness, not just the headline — run it on your own machine and compare.

## Reproduce it

```bash
pnpm install
pnpm --filter @dmc--98/dfe-core build
node scripts/benchmark.mjs          # human-readable table
node scripts/benchmark.mjs --json   # machine-readable
```

The script (`scripts/benchmark.mjs`) runs against the built package and measures three things on forms of 10 → 1,000 fields: graph construction, single-change propagation, and validation.

## Results

Indicative run — Node v25, Apple Silicon (darwin-arm64). Absolute numbers vary by machine; the **shape** of the curves is the point.

### 1. Change propagation — the core claim

When a value changes, DFE walks the dependency graph and recomputes only the fields actually affected (`O(affected)`), not the whole form (`O(total)`). So per-change cost stays low even as the form grows.

| Fields | Per change |
|-------:|-----------:|
| 10 | 0.0018 ms |
| 50 | 0.0038 ms |
| 100 | 0.0057 ms |
| 500 | 0.0274 ms |
| 1,000 | 0.0542 ms |

The form grew **100×** (10 → 1,000 fields) while the cost of a single change grew only **~30×** — sublinear, and in absolute terms a change on a 1,000-field form still resolves in ~0.05 ms, far under one animation frame (16.7 ms). A naive "re-evaluate everything on every keystroke" approach scales linearly with total field count; DFE scales with the number of dependents the changed field actually has.

### 2. Graph construction (one-time, at engine creation)

| Fields | Per build |
|-------:|----------:|
| 10 | 0.012 ms |
| 100 | 0.052 ms |
| 500 | 0.257 ms |
| 1,000 | 0.513 ms |

Building the full dependency graph for a 1,000-field form takes about half a millisecond — a one-time cost when you create the engine.

### 3. Validation (Zod schema generation + parse of visible fields)

| Fields | Per validate |
|-------:|-------------:|
| 10 | 0.031 ms |
| 100 | 0.056 ms |
| 500 | 0.157 ms |
| 1,000 | 0.276 ms |

Validation regenerates a Zod schema from the currently visible fields and parses the values. A full validation pass on a 1,000-field form is ~0.28 ms.

## How to read this honestly

- These are micro-benchmarks of the engine core in isolation, not end-to-end app performance (which is dominated by your UI framework's render). The claim DFE makes is specifically about **engine** cost.
- Numbers are indicative and machine-dependent. The harness is in the repo precisely so you can verify rather than trust.
- The regression guard lives in `packages/core/__tests__/benchmarks.test.ts`, which runs in CI to catch performance regressions over time.

## Why it's fast (architecture)

The engine compiles each field's conditions into closures once at construction, builds a directed acyclic graph of field dependencies, and topologically sorts it. A value change does a breadth-first walk from the changed node along dependency edges only, returning a patch describing exactly what changed. See [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) and [`docs/guide/dag.md`](./guide/dag.md) for the full design.
