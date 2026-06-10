import path from 'path'
import { defineConfig } from '@playwright/test'

// Visual-regression suite for the design-system revamp. Renders Storybook
// stories (the canonical visual surface) and captures committed screenshot
// baselines in light + dark. Run: pnpm test:e2e:visual
//   - first run / intentional change: add `--update-snapshots`
const repoRoot = path.resolve(__dirname, '..')
const webPort = process.env.DFE_E2E_SB_PORT ?? '6006'
const webOrigin = `http://127.0.0.1:${webPort}`
const cacheHome = process.env.XDG_CACHE_HOME ?? path.join(repoRoot, '.cache')

export default defineConfig({
  testDir: __dirname,
  testMatch: ['**/visual-*.spec.ts'],
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { outputFolder: path.join(repoRoot, 'output/playwright/visual-report'), open: 'never' }]]
    : [['list']],
  outputDir: path.join(repoRoot, 'output/playwright/visual-results'),
  snapshotDir: path.join(repoRoot, 'e2e/__screenshots__'),
  use: {
    baseURL: webOrigin,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm storybook',
      cwd: repoRoot,
      env: { ...process.env, XDG_CACHE_HOME: cacheHome },
      url: `${webOrigin}/iframe.html`,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
