import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    testTimeout: 30000,
    pool: 'threads',
  },
  ssr: {
    noExternal: ['express', 'supertest', 'zod'],
  },
  resolve: {
    alias: {
      'zod': path.resolve(__dirname, '../packages/core/node_modules/zod'),
      '@dmc-98/dfe-core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@dmc-98/dfe-server': path.resolve(__dirname, '../packages/server/src/index.ts'),
      '@dmc-98/dfe-express': path.resolve(__dirname, '../packages/express/src/index.ts'),
      '@dmc-98/dfe-react': path.resolve(__dirname, '../packages/react/src/index.ts'),
      '@dmc-98/dfe-cli/src/commands/validate': path.resolve(__dirname, '../packages/cli/src/commands/validate.ts'),
      '@dmc-98/dfe-cli': path.resolve(__dirname, '../packages/cli/src/index.ts'),
    },
  },
})
