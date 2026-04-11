import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    alias: [
      {
        find: '@dmc-98/dfe-react/components',
        replacement: path.resolve(__dirname, '../../../packages/react/src/components.ts'),
      },
      {
        find: '@dmc-98/dfe-react/theme',
        replacement: path.resolve(__dirname, '../../../packages/react/src/theme.ts'),
      },
      {
        find: '@dmc-98/dfe-react',
        replacement: path.resolve(__dirname, '../../../packages/react/src/index.ts'),
      },
      {
        find: '@dmc-98/dfe-playground',
        replacement: path.resolve(__dirname, '../../../packages/playground/src/index.ts'),
      },
      {
        find: '@dmc-98/dfe-core',
        replacement: path.resolve(__dirname, '../../../packages/core/src/index.ts'),
      },
    ],
  },
})
