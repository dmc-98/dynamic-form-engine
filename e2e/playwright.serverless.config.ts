import path from 'path'
import { defineConfig } from '@playwright/test'

const repoRoot = path.resolve(__dirname, '..')
const apiPort = process.env.DFE_E2E_SERVERLESS_API_PORT ?? '3002'
const webPort = process.env.DFE_E2E_SERVERLESS_WEB_PORT ?? '5174'
const apiOrigin = `http://127.0.0.1:${apiPort}`
const webOrigin = `http://127.0.0.1:${webPort}`
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://dfe:dfe_secret@127.0.0.1:5432/dfe_example'
const cacheHome = process.env.XDG_CACHE_HOME ?? path.join(repoRoot, '.cache')

export default defineConfig({
  testDir: __dirname,
  testMatch: ['**/serverless-collaboration.spec.ts'],
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
        ['html', { outputFolder: path.join(repoRoot, 'output/playwright/serverless-report'), open: 'never' }],
      ]
    : [['list']],
  outputDir: path.join(repoRoot, 'output/playwright/serverless-results'),
  use: {
    baseURL: webOrigin,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --dir examples/fullstack/api dev:e2e:serverless',
      cwd: repoRoot,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        PORT: apiPort,
        XDG_CACHE_HOME: cacheHome,
      },
      url: `${apiOrigin}/health`,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --dir examples/fullstack/web dev:e2e:serverless',
      cwd: repoRoot,
      env: {
        ...process.env,
        VITE_API_URL: `${apiOrigin}/api`,
        VITE_ENABLE_SW: 'true',
        VITE_SYNC_MODE: 'remote',
        XDG_CACHE_HOME: cacheHome,
      },
      url: webOrigin,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
