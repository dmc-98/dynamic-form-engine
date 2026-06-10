# @dmc--98/dfe-express

## 0.1.3

### Patch Changes

- Updated dependencies [6e7dab0]
  - @dmc--98/dfe-server@1.0.0
  - @dmc--98/dfe-core@1.0.0

## 0.1.2

### Patch Changes

- Updated dependencies [8f1b13c]
- Updated dependencies [f9159d7]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
- Updated dependencies [8f1b13c]
  - @dmc--98/dfe-core@0.3.0
  - @dmc--98/dfe-server@0.2.0

## 0.1.1

### Patch Changes

- f3c43c7: Improve package docs and npm package pages, harden release publishing against npm throttling, and fix docs and release workflow reliability. No breaking API changes.
- f3c43c7: Security and quality hardening from a full code review:
  - **express:** deny-by-default tenant access (`requireTenantMatch` option) closing a cross-tenant IDOR; loud `skipAuth` warning; authentication required on the dynamic field-options endpoint; client-supplied step `context` no longer trusted (`allowedClientContextKeys` allowlist); per-form stats made opt-in (`includeFormStats`) to remove an N+1; rate limiter `failClosed` option, bucket eviction, and trust-proxy guidance.
  - **server:** fixed a webhook bug that broke the default `fetch` path (now with timeout + SSRF note); `encodeURIComponent` on resolved endpoint placeholders; step persistence failures no longer report success; generic downstream-error messages (no internal leakage); uniform FNV-1a experiment bucketing; HKDF-based field encryption that honors `keyId` for rotation.
  - **core:** hardened the computed-expression evaluator (scope-object binding + reserved-word handling so field keys like `default` no longer break evaluation; documented as trusted-config, not a sandbox); O(1) parent lookup in graph construction; no `console` noise in library code.
  - **react:** correct `useDynamicOptions` dependencies + abort-on-unmount + stable headers; stabilized `useFormSync` connect effect (no reconnect churn); stable keys in builder panels.
  - **prisma / drizzle:** field-option search + pagination pushed into SQL with explicit cursor handling; real `count()` for analytics; transactional collaboration reads/writes; typed row mappers.

- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
- Updated dependencies [f3c43c7]
  - @dmc--98/dfe-core@0.2.0
  - @dmc--98/dfe-server@0.1.1
