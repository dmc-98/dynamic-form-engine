import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const scriptDir = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = dirname(scriptDir)

function checkNamedExports(moduleValue, exportNames, label) {
  for (const exportName of exportNames) {
    assert.ok(
      exportName in moduleValue,
      `${label} is missing expected export "${exportName}"`,
    )
  }
}

function readPackageJson(packageDir) {
  return JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
}

async function smokeEntry(packageDir, entryConfig) {
  const label = `${packageDir}:${entryConfig.label}`

  if (entryConfig.importPath) {
    const fullImportPath = join(packageDir, entryConfig.importPath)
    assert.ok(existsSync(fullImportPath), `${label} import target is missing: ${entryConfig.importPath}`)

    if (!fullImportPath.endsWith('.prisma')) {
      const esmModule = await import(pathToFileURL(fullImportPath).href)
      checkNamedExports(esmModule, entryConfig.exports, `ESM import for ${label}`)
    }
  }

  if (entryConfig.requirePath) {
    const fullRequirePath = join(packageDir, entryConfig.requirePath)
    assert.ok(existsSync(fullRequirePath), `${label} require target is missing: ${entryConfig.requirePath}`)

    const cjsModule = require(fullRequirePath)
    checkNamedExports(cjsModule, entryConfig.exports, `CJS require for ${label}`)
  }
}

async function main() {
  const packages = [
    {
      dir: join(workspaceRoot, 'packages/core'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.mjs',
          requirePath: 'dist/index.js',
          exports: ['createFormEngine', 'toJsonSchema'],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/react'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['useFormEngine', 'useFormRuntime'],
        },
        {
          label: './components',
          importPath: 'dist/components.js',
          requirePath: 'dist/components.cjs',
          exports: ['DfeFormRenderer', 'DfeStepIndicator'],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/server'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['executeStepSubmit', 'createAnalyticsStore'],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/express'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['createDfeRouter', 'createRateLimiter'],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/drizzle'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['DrizzleDatabaseAdapter'],
        },
        {
          label: './schema',
          importPath: 'dist/schema.js',
          requirePath: 'dist/schema.cjs',
          exports: ['dfeForms', 'dfeSubmissions'],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/prisma'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['PrismaDatabaseAdapter', 'InMemoryModelStore'],
        },
        {
          label: './schema',
          importPath: 'schema/schema.prisma',
          exports: [],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/ui-mui'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['MuiFieldRenderer', 'DfeMuiStepIndicator', 'DfeMuiFormPreview'],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/ui-antd'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['AntdFieldRenderer', 'DfeAntdStepIndicator', 'DfeAntdFormPreview'],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/ui-chakra'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['ChakraFieldRenderer', 'DfeChakraStepIndicator', 'DfeChakraFormPreview'],
        },
      ],
    },
    {
      dir: join(workspaceRoot, 'packages/playground'),
      entries: [
        {
          label: '.',
          importPath: 'dist/index.js',
          requirePath: 'dist/index.cjs',
          exports: ['DfePlayground'],
        },
      ],
    },
  ]

  for (const packageConfig of packages) {
    const packageJson = readPackageJson(packageConfig.dir)
    assert.ok(packageJson.files?.includes('dist') || packageConfig.dir.endsWith('/packages/prisma'))

    for (const entryConfig of packageConfig.entries) {
      await smokeEntry(packageConfig.dir, entryConfig)
    }
  }

  const cliEntry = join(workspaceRoot, 'packages/cli/dist/index.js')
  const cliResult = spawnSync(
    process.execPath,
    [cliEntry, 'migrate', 'plan', '--help'],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
    },
  )

  assert.equal(
    cliResult.status,
    0,
    `CLI built artifact smoke failed:\n${cliResult.stderr || cliResult.stdout}`,
  )
  assert.match(
    cliResult.stdout,
    /Inspect the current project and suggest the next DFE migration steps/,
    'Expected built CLI help output to include the migrate plan description',
  )

  console.log('Built artifact smoke checks passed.')
}

await main()
