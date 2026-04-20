import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/index.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 35,
        statements: 35,
      },
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: [
      {
        find: '@dmc--98/dfe-react/components',
        replacement: path.resolve(__dirname, '../react/src/components.ts'),
      },
      {
        find: '@dmc--98/dfe-react',
        replacement: path.resolve(__dirname, '../react/src/index.ts'),
      },
      {
        find: '@dmc--98/dfe-core',
        replacement: path.resolve(__dirname, '../core/src/index.ts'),
      },
    ],
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json'],
  },
})
