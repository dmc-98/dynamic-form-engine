#!/usr/bin/env node
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const privateExamples = [
  {
    name: 'dfe-example-api',
    packageJson: 'examples/fullstack/api/package.json',
    changelog: 'examples/fullstack/api/CHANGELOG.md',
  },
  {
    name: 'dfe-example-web',
    packageJson: 'examples/fullstack/web/package.json',
    changelog: 'examples/fullstack/web/CHANGELOG.md',
  },
]

const config = JSON.parse(readFileSync(join(repoRoot, '.changeset/config.json'), 'utf8'))
const ignoredPackages = new Set(config.ignore ?? [])

assert.equal(
  config.privatePackages?.version,
  false,
  'Changesets privatePackages.version must be false so private examples are never versioned.',
)
assert.equal(
  config.privatePackages?.tag,
  false,
  'Changesets privatePackages.tag must be false so private examples are never tagged.',
)

for (const example of privateExamples) {
  assert.ok(
    ignoredPackages.has(example.name),
    `Changesets config must explicitly ignore private example app ${example.name}.`,
  )

  const manifest = JSON.parse(readFileSync(join(repoRoot, example.packageJson), 'utf8'))
  assert.equal(manifest.private, true, `${example.name} must remain private.`)

  assert.equal(
    existsSync(join(repoRoot, example.changelog)),
    false,
    `${example.changelog} must not exist; private examples should not receive package changelogs.`,
  )
}

const changedFiles = getChangedFiles()
for (const example of privateExamples) {
  const touchedPrivateReleaseFile = changedFiles.find(file =>
    file === example.packageJson || file === example.changelog
  )

  assert.equal(
    touchedPrivateReleaseFile,
    undefined,
    `Release versioning touched ${touchedPrivateReleaseFile}. Private example apps must stay out of Changesets release PRs.`,
  )
}

console.log('Private example Changesets guard passed.')

function getChangedFiles() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'git status --porcelain failed')
  }

  return result.stdout
    .split('\n')
    .map(line => line.slice(3).trim())
    .filter(Boolean)
}
