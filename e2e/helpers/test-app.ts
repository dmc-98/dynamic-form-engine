/**
 * Express test app factory for API E2E tests.
 * Creates a fully wired Express app with mock database.
 */
import express from 'express'
import { createDfeRouter } from '@dmc--98/dfe-express'
import type { InMemoryDatabase } from './mock-db'

export interface TestAppOptions {
  db: InMemoryDatabase
  getUserId?: (req: express.Request) => string | null
  skipAuth?: boolean
  prefix?: string
  allowedOptionFilterKeys?: string[]
}

export function createTestApp(options: TestAppOptions) {
  const app = express()
  app.use(express.json())

  const router = createDfeRouter({
    db: options.db,
    getUserId: options.getUserId ?? (() => 'test-user-1'),
    skipAuth: options.skipAuth ?? false,
    prefix: options.prefix,
    allowedOptionFilterKeys: options.allowedOptionFilterKeys,
  })

  app.use(router)
  return app
}
