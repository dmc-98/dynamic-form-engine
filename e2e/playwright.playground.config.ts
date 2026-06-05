import path from 'path'
import { defineConfig } from '@playwright/test'

const repoRoot = path.resolve(__dirname, '..')
const webPort = process.env.DFE_E2E_PLAYGROUND_WEB_PORT ?? '5173'
const webOrigin = `http://127.0.0.1:${webPort}`
const cacheHome = process.env.XDG_CACHE_HOME ?? path.join(repoRoot, '.cache')

export default defineConfig({
  testDir: __dirname,
  testMatch: ['**/playground-authoring.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ['list'],
        ['github'],
        ['html', { outputFolder: path.join(repoRoot, 'output/playwright/playground-report'), open: 'never' }],
      ]
    : [['list']],
  outputDir: path.join(repoRoot, 'output/playwright/playground-results'),
  use: {
    baseURL: webOrigin,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --dir examples/fullstack/web dev:e2e:playground',
      cwd: repoRoot,
      env: {
        ...process.env,
        VITE_API_URL: 'http://127.0.0.1:3001/api',
        XDG_CACHE_HOME: cacheHome,
      },
      url: webOrigin,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
