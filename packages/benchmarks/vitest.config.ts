import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // Resolve the engine from source so the harness runs without a
      // workspace install step (and benchmarks always test current code).
      '@dmc--98/dfe-core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
})
