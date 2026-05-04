# Release Guide

This repo uses Changesets for versioning, release PRs, and npm publishing.

## First Public Release

If this is the first time DFE is being published publicly:

1. Create or reserve the npm scope `@dmc--98`.
2. Add the `NPM_TOKEN` repository secret in GitHub.
3. Confirm the default branch is protected and CI is green on `main`.
4. Run the local verification commands in this document.
5. Push the final docs and changesets to `main`.
6. Let the `Release` workflow open the release PR.
7. Review the generated versions and changelog.
8. Merge the release PR to publish.

## Everyday Maintainer Flow

1. Keep `main` green.
2. Require a changeset in feature PRs unless the change is docs-only or internal-only.
3. Let the `Release` workflow create or update the release PR automatically.
4. Review the release PR for package versions, changelog text, and any accidental package scope drift.
5. Merge the release PR when it looks correct.
6. Confirm npm packages, GitHub release notes, docs, and smoke checks after publish.

Private workspace example apps are intentionally excluded from Changesets.
`dfe-example-api` and `dfe-example-web` stay in the workspace for builds, tests, and e2e coverage, but they must never appear in release PRs, version bumps, or package changelog generation.

For the current patch republish lane, keep the public release message focused on:
- improved package docs and npm package pages
- harder-to-break release publishing and npm retry behavior
- docs deployment and release workflow reliability
- no breaking API changes

## Local Verification

Run these from the repo root before cutting or merging a release PR:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm test:coverage:stable
pnpm test:smoke:artifacts
pnpm test:smoke:wrappers
pnpm changeset status
pnpm release:check
pnpm --dir docs build
```

If you are validating the canonical example locally as part of the release:

```bash
cd examples/fullstack
DFE_EXAMPLE_POSTGRES_PORT=55432 docker compose up -d postgres
DATABASE_URL='postgresql://dfe:dfe_secret@127.0.0.1:55432/dfe_example' pnpm --dir api db:migrate:deploy
DATABASE_URL='postgresql://dfe:dfe_secret@127.0.0.1:55432/dfe_example' pnpm --dir api db:seed
cd ../..
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright DATABASE_URL='postgresql://dfe:dfe_secret@127.0.0.1:55432/dfe_example' pnpm test:e2e:example
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright DATABASE_URL='postgresql://dfe:dfe_secret@127.0.0.1:55432/dfe_example' pnpm test:e2e:serverless
PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright pnpm test:e2e:playground
cd examples/fullstack
DFE_EXAMPLE_POSTGRES_PORT=55432 docker compose down
```

## Manual Dry Runs

Use these when you want extra confidence before the first publish:

```bash
npm whoami
pnpm --filter @dmc--98/dfe-core publish --dry-run --access public
pnpm --filter @dmc--98/dfe-react publish --dry-run --access public
pnpm --filter @dmc--98/dfe-server publish --dry-run --access public
```

## Release Notes Template

Use this structure for GitHub releases and announcement posts:

```md
## Dynamic Form Engine vX.Y.Z

### Highlights
- One short paragraph on the biggest user-facing win.

### Stable Packages
- List the stable packages users should start with.

### Notable Changes
- Feature 1
- Feature 2
- Fix 1

### Examples and Docs
- Canonical example updates
- Playground updates
- New docs or migration guides

### Upgrade Notes
- Breaking changes, if any
- Required migration steps, if any

### Known Limits
- Any Beta or still-maturing surfaces worth calling out honestly

### Thanks
- Contributors
- Community feedback
- Ecosystem packages
```

## What Good OSS Release Notes Should Include

- A one-screen summary for people skimming the release.
- Clear upgrade notes for existing users.
- Honest stability language: Stable, Beta, Experimental.
- Links to docs, examples, and migration guidance.
- Acknowledgement of contributors and upstream ecosystem packages.
- Any security or compliance-relevant changes called out explicitly.

## Required Secrets And Variables

- `NPM_TOKEN`: npm publish token for `changeset publish`
- `TURBO_TOKEN`: optional remote cache token for CI and local maintainers
- `TURBO_TEAM`: optional remote cache team slug
- `TURBO_API`: optional remote cache endpoint override

When the Turbo cache variables are absent, the repo falls back to local caching automatically.

## Related Docs

- `DEPLOY_CHECKLIST.md`
- `MAINTAINER_GUIDE.md`
- `CONTRIBUTING.md`
