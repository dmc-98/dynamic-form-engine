# Production Checklist

Use this checklist for the currently supported production lane:

- `@dmc--98/dfe-core`
- `@dmc--98/dfe-react`
- `@dmc--98/dfe-server`
- `@dmc--98/dfe-express`
- `@dmc--98/dfe-prisma` or `@dmc--98/dfe-drizzle`
- `@dmc--98/dfe-cli`

## 1. Lock The Package Lane

- Prefer the Stable packages first.
- Add Beta or Experimental packages only when you have a clear reason and acceptance of the extra support risk.
- Keep `@dmc--98/dfe-core`, `@dmc--98/dfe-react`, and the server adapter packages version-aligned.

## 2. Make Migrations Repeatable

For Prisma:

```bash
npx dfe migrate plan --adapter prisma
npx dfe migrate generate --adapter prisma
npx prisma migrate dev --schema prisma/schema.prisma --name add_dfe_tables
npx dfe migrate doctor --adapter prisma --database-url "$DATABASE_URL"
```

For Drizzle:

```bash
npx dfe migrate plan --adapter drizzle
npx dfe migrate generate --adapter drizzle
npx drizzle-kit generate
npx drizzle-kit migrate
npx dfe migrate doctor --adapter drizzle --database-url "$DATABASE_URL"
```

- Commit your ORM-native migration files.
- Run `doctor` against a real PostgreSQL connection in CI or release verification.

## 3. Enforce Identity And Tenant Boundaries

- Always provide a real authenticated user identity to the server layer.
- If you are multi-tenant, pass a consistent tenant/org identifier through the request context.
- Do not rely on `skipAuth` outside local development and tests.

## 4. Protect The HTTP Surface

- Put `createRateLimiter()` or an equivalent gateway policy in front of public DFE endpoints.
- Apply your normal auth middleware before mounting the DFE router.
- Review which dynamic option filter keys are allowed if you expose option search to clients.

## 5. Verify Runtime Behavior

- Use the canonical example as a reference architecture before creating your own stack from scratch.
- Keep at least one browser test for the real form flow in your app, not only unit tests.
- If you adopt GraphQL or other Beta surfaces, add an app-level smoke test for that surface.

## 6. Turn On Operator Signals

- Enable the tracing middleware from the stable server lane.
- Persist analytics events if you want drop-off, funnel, and variant reporting.
- If you use experiments, make sure assignment and reporting run against the same tenant and form IDs.

## 7. Treat HIPAA-Supporting Mode As An Operations Feature

- Classify sensitive fields in the form config so protected-field analytics redaction and encrypted submission vault hooks can activate consistently.
- Provide a real audit log store in production; the in-memory store is for local development and examples only.
- Manage your encryption secret through your normal secret manager and rotate it on your own schedule.
- Do not present the library feature alone as legal HIPAA certification; your hosting, access controls, BAAs, retention policy, and operational process still matter.

## 8. Keep Release Gates Honest

From this repo, the baseline verification set is:

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm test:smoke:artifacts
pnpm test:smoke:wrappers
pnpm test:coverage:stable
pnpm release:check
```

If you are using the canonical example or a similar browser lane, also run:

```bash
pnpm test:e2e:example
```

## 9. Publish Only When Docs Match Reality

- Update package maturity labels when a package moves between Stable, Beta, and Experimental.
- Keep the migration story in sync across README, package docs, and examples.
- If you expose AI-assisted draft fill, keep the explicit consent, review, and no-auto-submit boundaries in place.

## Done Looks Like

You are in good shape when:

- your chosen DFE packages are from the Stable lane or have explicit local justification
- migrations are committed and `doctor` passes against a live database
- auth, tenant scoping, and rate limiting are in place
- your CI runs real build/test/typecheck verification
- your app has at least one browser-level regression path
- if you enable HIPAA-supporting mode, you also have durable audit storage and managed encryption secrets
