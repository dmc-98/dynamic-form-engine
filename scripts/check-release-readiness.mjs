import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const packageDirs = readdirSync(join(repoRoot, 'packages'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => join('packages', entry.name))
  .filter(packageDir => existsSync(join(repoRoot, packageDir, 'package.json')))
  .sort()

const npmCacheDir = join(repoRoot, '.cache', 'npm')
const npmLogsDir = join(repoRoot, '.cache', 'npm-logs')
const changesetStatusPath = join(repoRoot, '.cache', 'changeset-status.json')
const ignoredPrivateWorkspaceApps = ['dfe-example-api', 'dfe-example-web']
mkdirSync(npmCacheDir, { recursive: true })
mkdirSync(npmLogsDir, { recursive: true })

assertPackageExists('.changeset/config.json')
assertPackageExists('.github/workflows/release.yml')
assertChangesetIgnoresPrivateExamples()
assertPrivateExampleAppsStayPrivate()
assertChangesetStatusLeavesPrivateExamplesUnchanged()

for (const packageDir of packageDirs) {
  const packageRoot = join(repoRoot, packageDir)
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf-8'))
  const declaredTargets = collectDeclaredTargets(manifest)

  assert.ok(
    Array.isArray(manifest.files) && manifest.files.includes('dist'),
    `${manifest.name} must include dist in package.json files`,
  )
  assertPackageExists(join(packageDir, 'README.md'))

  for (const target of declaredTargets) {
    assertPackageExists(join(packageDir, target))
  }

  const packResult = runPackDryRun(packageRoot)
  const packedFiles = new Set(packResult.files.map(file => file.path))

  assert.ok(packedFiles.has('package.json'), `${manifest.name} dry-run pack is missing package.json`)
  assert.ok(packedFiles.has('README.md'), `${manifest.name} dry-run pack is missing README.md`)
  assert.ok(
    [...packedFiles].some(path => path.startsWith('dist/')),
    `${manifest.name} dry-run pack is missing dist output`,
  )
  assert.ok(
    ![...packedFiles].some(path => path.startsWith('src/')),
    `${manifest.name} dry-run pack should not include src files`,
  )

  for (const target of declaredTargets) {
    assert.ok(
      packedFiles.has(target),
      `${manifest.name} dry-run pack is missing declared target ${target}`,
    )
  }

  console.log(`Release readiness passed: ${manifest.name}`)
}

console.log('Release readiness checks passed.')

function assertPackageExists(relativePath) {
  const fullPath = join(repoRoot, relativePath)
  assert.ok(
    existsSync(fullPath),
    `Missing required file: ${relativePath}`,
  )
}

function collectDeclaredTargets(manifest) {
  const targets = new Set()

  for (const key of ['main', 'module', 'types']) {
    if (typeof manifest[key] === 'string') {
      targets.add(normalizeTarget(manifest[key]))
    }
  }

  collectExportTargets(manifest.exports, targets)

  return [...targets]
}

function collectExportTargets(node, targets) {
  if (!node) {
    return
  }

  if (typeof node === 'string') {
    targets.add(normalizeTarget(node))
    return
  }

  if (typeof node === 'object') {
    for (const value of Object.values(node)) {
      collectExportTargets(value, targets)
    }
  }
}

function normalizeTarget(target) {
  return target.replace(/^\.\//, '')
}

function runPackDryRun(packageRoot) {
  const result = spawnSync(
    'npm',
    ['pack', '--json', '--dry-run'],
    {
      cwd: packageRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache: npmCacheDir,
        npm_config_logs_dir: npmLogsDir,
      },
    },
  )

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `npm pack failed in ${packageRoot}`)
  }

  return JSON.parse(result.stdout)[0]
}

function assertChangesetIgnoresPrivateExamples() {
  const config = JSON.parse(readFileSync(join(repoRoot, '.changeset/config.json'), 'utf8'))
  const ignoredPackages = new Set(config.ignore ?? [])

  for (const packageName of ignoredPrivateWorkspaceApps) {
    assert.ok(
      ignoredPackages.has(packageName),
      `Changesets config must ignore private example app ${packageName}`,
    )
  }
}

function assertPrivateExampleAppsStayPrivate() {
  for (const packageName of ignoredPrivateWorkspaceApps) {
    const packageRoot = join(repoRoot, 'examples', 'fullstack', packageName === 'dfe-example-api' ? 'api' : 'web')
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

    assert.equal(
      manifest.private,
      true,
      `${packageName} must remain private`,
    )
  }
}

function assertChangesetStatusLeavesPrivateExamplesUnchanged() {
  const result = spawnSync(
    'pnpm',
    ['exec', 'changeset', 'status', `--output=${changesetStatusPath}`],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: process.env,
    },
  )

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'changeset status failed')
  }

  const status = JSON.parse(readFileSync(changesetStatusPath, 'utf8'))
  const releasedPackages = new Map((status.releases ?? []).map(release => [release.name, release]))

  for (const packageName of ignoredPrivateWorkspaceApps) {
    const release = releasedPackages.get(packageName)

    if (!release) {
      continue
    }

    assert.equal(
      release.type,
      'none',
      `Changesets must not version-bump private example app ${packageName}`,
    )
    assert.equal(
      release.oldVersion,
      release.newVersion,
      `Changesets must not change the version of private example app ${packageName}`,
    )
    assert.deepEqual(
      release.changesets,
      [],
      `Changesets must not attach release notes to private example app ${packageName}`,
    )
  }
}
