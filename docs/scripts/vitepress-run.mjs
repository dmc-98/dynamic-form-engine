import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { delimiter, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const docsDir = resolve(scriptDir, '..')
const repoRoot = resolve(docsDir, '..')
const command = process.argv[2] ?? 'build'
const require = createRequire(import.meta.url)
const resolvePaths = [docsDir, repoRoot]

function readVersion(packageJsonPath) {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version
}

function resolvePackageJsonPath(specifier) {
  return require.resolve(`${specifier}/package.json`, { paths: resolvePaths })
}

function getNativeTarget(platform, arch) {
  if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64'
  if (platform === 'darwin' && arch === 'x64') return 'darwin-x64'
  if (platform === 'linux' && arch === 'arm64') return 'linux-arm64'
  if (platform === 'linux' && arch === 'x64') return 'linux-x64'
  if (platform === 'win32' && arch === 'arm64') return 'win32-arm64'
  if (platform === 'win32' && arch === 'x64') return 'win32-x64'
  if (platform === 'win32' && arch === 'ia32') return 'win32-ia32'
  return null
}

function addNodePath(env, value) {
  if (!value) return
  env.NODE_PATH = env.NODE_PATH ? `${value}${delimiter}${env.NODE_PATH}` : value
}

const env = { ...process.env }
const nativeTarget = getNativeTarget(process.platform, process.arch)
const vitepressPackageJsonPath = resolvePackageJsonPath('vitepress')
resolvePaths.push(dirname(vitepressPackageJsonPath))

if (nativeTarget) {
  const rollupVersion = readVersion(resolvePackageJsonPath('rollup'))
  const rollupNodePath = join(
    repoRoot,
    'node_modules',
    '.pnpm',
    `@rollup+rollup-${nativeTarget}@${rollupVersion}`,
    'node_modules',
  )
  const rollupPackagePath = join(rollupNodePath, '@rollup', `rollup-${nativeTarget}`)

  if (existsSync(rollupPackagePath)) {
    addNodePath(env, rollupNodePath)
  }

  const esbuildVersion = readVersion(resolvePackageJsonPath('esbuild'))
  const esbuildBinaryPath = join(
    repoRoot,
    'node_modules',
    '.pnpm',
    `@esbuild+${nativeTarget}@${esbuildVersion}`,
    'node_modules',
    '@esbuild',
    nativeTarget,
    'bin',
    process.platform === 'win32' ? 'esbuild.exe' : 'esbuild',
  )

  if (existsSync(esbuildBinaryPath)) {
    env.ESBUILD_BINARY_PATH = esbuildBinaryPath
  }
}

const vitepressCliPath = require.resolve('vitepress/dist/node/cli.js', { paths: resolvePaths })
const result = spawnSync(process.execPath, [vitepressCliPath, command], {
  cwd: docsDir,
  env,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
