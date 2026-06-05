# dfe-scaffold (Claude Code plugin)

A Claude Code plugin that lets Claude Code scaffold [Dynamic Form Engine](https://github.com/dmc-98/dynamic-form-engine) projects for you — `dfe init`, starter templates, backend wiring (Express + Prisma/Drizzle), config validation, and migrations — instead of hand-writing boilerplate.

Bundles the `dfe-scaffold` skill (see `skills/dfe-scaffold/SKILL.md`).

## Install

From the marketplace in this repo:

```
/plugin marketplace add dmc-98/dynamic-form-engine
/plugin install dfe-scaffold@dfe
```

(The marketplace manifest lives at `integrations/claude-code/.claude-plugin/marketplace.json`; `/plugin marketplace add` resolves it from the repo root.)

Or install the plugin directly without the marketplace:

```
/plugin install https://github.com/dmc-98/dynamic-form-engine
```

Then `/reload-plugins` and confirm with `/plugin list` (you should see **dfe-scaffold**).

## Use

Just ask Claude Code for what you want:

> "Build a multi-step onboarding form with a Postgres backend."

Claude Code will run the DFE CLI (`dfe init --template onboarding --express --prisma`), add the React/server layers, edit the generated typed config, and validate it.

## Updating

Bump `version` in `.claude-plugin/plugin.json` (and the marketplace entry) on each release — Claude Code uses the version to decide when to pull updates.
