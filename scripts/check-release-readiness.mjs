import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const packageDirs = [
  'packages/core',
  'packages/react',
  'packages/server',
  'packages/express',
  'packages/prisma',
  'packages/drizzle',
  'packages/cli',
  'packages/fastify',
  'packages/hono',
  'packages/trpc',
  'packages/angular',
  'packages/vanilla',
  'packages/vue',
  'packages/svelte',
  'packages/solid',
]

const npmCacheDir = join(repoRoot, '.cache', 'npm')
const npmLogsDir = join(repoRoot, '.cache', 'npm-logs')
mkdirSync(npmCacheDir, { recursive: true })
mkdirSync(npmLogsDir, { recursive: true })

assertPackageExists('.changeset/config.json')
assertPackageExists('.github/workflows/release.yml')

for (const packageDir of packageDirs) {
  const packageRoot = join(repoRoot, packageDir)
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf-8'))
  const declaredTargets = collectDeclaredTargets(manifest)

  assert.ok(
    Array.isArray(manifest.files) && manifest.files.includes('dist'),
    `${manifest.name} must include dist in package.json files`,
  )

  for (const target of declaredTargets) {
    assertPackageExists(join(packageDir, target))
  }

  const packResult = runPackDryRun(packageRoot)
  const packedFiles = new Set(packResult.files.map(file => file.path))

  assert.ok(packedFiles.has('package.json'), `${manifest.name} dry-run pack is missing package.json`)
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
