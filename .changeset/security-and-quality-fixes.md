---
"@dmc--98/dfe-core": patch
"@dmc--98/dfe-server": patch
"@dmc--98/dfe-express": patch
"@dmc--98/dfe-react": patch
"@dmc--98/dfe-prisma": patch
"@dmc--98/dfe-drizzle": patch
---

Security and quality hardening from a full code review:

- **express:** deny-by-default tenant access (`requireTenantMatch` option) closing a cross-tenant IDOR; loud `skipAuth` warning; authentication required on the dynamic field-options endpoint; client-supplied step `context` no longer trusted (`allowedClientContextKeys` allowlist); per-form stats made opt-in (`includeFormStats`) to remove an N+1; rate limiter `failClosed` option, bucket eviction, and trust-proxy guidance.
- **server:** fixed a webhook bug that broke the default `fetch` path (now with timeout + SSRF note); `encodeURIComponent` on resolved endpoint placeholders; step persistence failures no longer report success; generic downstream-error messages (no internal leakage); uniform FNV-1a experiment bucketing; HKDF-based field encryption that honors `keyId` for rotation.
- **core:** hardened the computed-expression evaluator (scope-object binding + reserved-word handling so field keys like `default` no longer break evaluation; documented as trusted-config, not a sandbox); O(1) parent lookup in graph construction; no `console` noise in library code.
- **react:** correct `useDynamicOptions` dependencies + abort-on-unmount + stable headers; stabilized `useFormSync` connect effect (no reconnect churn); stable keys in builder panels.
- **prisma / drizzle:** field-option search + pagination pushed into SQL with explicit cursor handling; real `count()` for analytics; transactional collaboration reads/writes; typed row mappers.
