import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const packageDirs = [
  'core',
  'react',
  'server',
  'express',
  'prisma',
  'drizzle',
  'cli',
  'ui-mui',
  'ui-antd',
  'ui-chakra',
  'playground',
]

for (const dir of packageDirs) {
  const packageDir = join(repoRoot, 'packages', dir)

  console.log(`\n==> Coverage: packages/${dir}`)

  const result = spawnSync(
    'pnpm',
    ['--dir', packageDir, 'test', '--', '--coverage'],
    {
      cwd: repoRoot,
      stdio: 'inherit',
    },
  )

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1)
  }
}
