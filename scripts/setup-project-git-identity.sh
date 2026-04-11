#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/setup-project-git-identity.sh \
    --name "Your Name" \
    --email "you@example.com" \
    [--ssh-key ~/.ssh/id_ed25519_project] \
    [--remote git@github.com:OWNER/REPO.git]

What it does:
  - Sets repo-local git identity in .git/config only
  - Optionally pins an SSH key for this repo only via core.sshCommand
  - Optionally adds or updates the origin remote

What it does NOT do:
  - It does not touch ~/.gitconfig
  - It does not affect any other repository on your machine

Examples:
  ./scripts/setup-project-git-identity.sh \
    --name "Arjun OSS" \
    --email "arjun.opensource@example.com"

  ./scripts/setup-project-git-identity.sh \
    --name "Arjun OSS" \
    --email "arjun.opensource@example.com" \
    --ssh-key ~/.ssh/id_ed25519_sn_arjun \
    --remote git@github.com:dmc-98/dynamic-form-engine.git
EOF
}

name=""
email=""
ssh_key=""
remote_url=""

expand_path() {
  local path="$1"
  if [[ "$path" == "~"* ]]; then
    printf '%s\n' "${HOME}${path:1}"
  else
    printf '%s\n' "$path"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      name="${2:-}"
      shift 2
      ;;
    --email)
      email="${2:-}"
      shift 2
      ;;
    --ssh-key)
      ssh_key="${2:-}"
      shift 2
      ;;
    --remote)
      remote_url="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$name" || -z "$email" ]]; then
  echo "Both --name and --email are required." >&2
  usage
  exit 1
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "This command must be run inside a git repository." >&2
  exit 1
}

git config --local user.name "$name"
git config --local user.email "$email"
git config --local user.useConfigOnly true

if [[ -n "$ssh_key" ]]; then
  ssh_key="$(expand_path "$ssh_key")"
  if [[ ! -f "$ssh_key" ]]; then
    echo "SSH key not found: $ssh_key" >&2
    exit 1
  fi

  git config --local core.sshCommand "ssh -i \"$ssh_key\" -o IdentitiesOnly=yes"
fi

if [[ -n "$remote_url" ]]; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$remote_url"
  else
    git remote add origin "$remote_url"
  fi
fi

echo
echo "Repo-local git identity configured."
echo
echo "Current local settings:"
git config --local --get user.name
git config --local --get user.email

if git config --local --get core.sshCommand >/dev/null 2>&1; then
  echo "core.sshCommand=$(git config --local --get core.sshCommand)"
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "origin=$(git remote get-url origin)"
fi

echo
echo "These settings apply only to this repository."
