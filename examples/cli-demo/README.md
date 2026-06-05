# DFE CLI Demo

A scripted, runnable walkthrough of the `dfe` CLI scaffold flow — from zero to a validated, multi-step, full-stack form. It's both a smoke test and the recording source for an asciinema cast or GIF.

## Run it

```bash
# against the locally built CLI (run `pnpm --filter @dmc--98/dfe-cli build` first)
./examples/cli-demo/demo.sh

# against the published CLI
DFE="npx dfe" ./examples/cli-demo/demo.sh

# fast (no typing pauses) — good for CI
TYPE_DELAY=0 ./examples/cli-demo/demo.sh
```

It scaffolds into a temp directory and cleans up automatically, so it's safe to run repeatedly.

## What it shows

1. `dfe init --template onboarding --express --prisma` — scaffold a full-stack multi-step form
2. the generated file tree
3. the real, typed starter form config
4. `dfe add fe-hooks` — add the React layer
5. `dfe validate` — validate the config
6. `dfe migrate plan` — plan the database migration

## Record a GIF / asciinema cast

```bash
# asciinema (recommended — small, replayable)
asciinema rec dfe-cli-demo.cast -c "./examples/cli-demo/demo.sh"
# convert to GIF with agg:
agg dfe-cli-demo.cast dfe-cli-demo.gif

# or a quick screen-capture GIF with vhs (charmbracelet/vhs) using demo.tape
```

Drop the resulting GIF into the README and the landing page's demo slot. Pair it with the [demo video script](../../marketing/DEMO_VIDEO_SCRIPT.md) for the full narrated version.

## Let Claude Code drive it

Install the [Claude Code skill](../../integrations/claude-code/README.md) and just ask Claude Code to "build a multi-step onboarding form with a Postgres backend" — it runs these same commands for you.
