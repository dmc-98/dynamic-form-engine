import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Scope to e2e/ only — prevent the project-root **/*.test.ts glob from
    // crawling into packages/*/src/__tests__ when vitest root is the monorepo root.
    include: [path.resolve(__dirname, '*.test.ts')],
    testTimeout: 30000,
    pool: 'threads',
  },
  ssr: {
    noExternal: ['express', 'supertest', 'zod'],
  },
  resolve: {
    alias: {
      // Workspace package aliases — resolve to source so vitest can transform them
      '@dmc--98/dfe-core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@dmc--98/dfe-server': path.resolve(__dirname, '../packages/server/src/index.ts'),
      '@dmc--98/dfe-express': path.resolve(__dirname, '../packages/express/src/index.ts'),
      '@dmc--98/dfe-react': path.resolve(__dirname, '../packages/react/src/index.ts'),
      '@dmc--98/dfe-cli/src/commands/validate': path.resolve(__dirname, '../packages/cli/src/commands/validate.ts'),
      '@dmc--98/dfe-cli': path.resolve(__dirname, '../packages/cli/src/index.ts'),
      // Third-party aliases: pin to the locations used by workspace packages so
      // require() and import both resolve to the same instance. These are also
      // declared as root devDependencies so `pnpm install` keeps them hoisted.
      'zod': path.resolve(__dirname, '../packages/core/node_modules/zod'),
      'express': path.resolve(__dirname, '../packages/express/node_modules/express'),
      'supertest': path.resolve(__dirname, '../node_modules/.pnpm/supertest@7.2.2/node_modules/supertest'),
    },
  },
})
