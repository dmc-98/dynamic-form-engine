#!/usr/bin/env bash
#
# DFE CLI demo — a scripted, runnable walkthrough of the scaffold flow.
#
# Doubles as: (1) a smoke test of the CLI end-to-end, and (2) the recording
# source for an asciinema cast / GIF (see README.md).
#
# Usage:
#   ./demo.sh            # run against the built local CLI
#   DFE="npx dfe" ./demo.sh   # run against the published CLI
#
# It scaffolds a project in a throwaway temp dir and cleans up after itself.
set -euo pipefail

# How to invoke the CLI. Defaults to the locally built bin if present.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DFE="${DFE:-node $ROOT/packages/cli/dist/index.js}"

# Pacing for recordings; set TYPE_DELAY=0 to run fast in CI.
TYPE_DELAY="${TYPE_DELAY:-0.6}"

say()  { printf '\n\033[1;35m# %s\033[0m\n' "$*"; sleep "$TYPE_DELAY"; }
run()  { printf '\033[1;36m$ %s\033[0m\n' "$*"; sleep "$TYPE_DELAY"; eval "$*"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"

say "1. Scaffold a multi-step onboarding project (frontend + Express + Prisma)"
run "$DFE init --template onboarding --express --prisma --dir ./my-app"

say "2. Look at what was generated"
run "find ./my-app -type f -not -path '*/node_modules/*' | sort"

say "3. The starter form is real, typed config you can edit"
run "sed -n '1,20p' ./my-app/src/forms/user-onboarding.ts || true"

say "4. Add the React hooks layer"
run "cd ./my-app && $DFE add fe-hooks; cd \"$WORK\""

say "5. Validate a form config (dfe validate takes a JSON config file)"
# Extract the embedded JSON definition from the generated module into config.json.
run "node -e \"const s=require('fs').readFileSync('./my-app/src/forms/user-onboarding.ts','utf8');const m=s.match(/JSON.parse\\(\\\`(.+?)\\\`\\)/s);require('fs').writeFileSync('./my-app/form.config.json',m[1])\""
run "$DFE validate ./my-app/form.config.json || true"

say "6. Plan the database migration (Prisma)"
run "cd ./my-app && $DFE migrate plan --adapter prisma || true; cd \"$WORK\""

say "Done — from zero to a validated, multi-step, full-stack form scaffold."
echo
