// vitest.config.ts
import { defineConfig } from "file:///sessions/epic-sweet-ride/mnt/dynamic-form-engine/node_modules/.pnpm/vitest@1.6.1_@types+node@20.19.37/node_modules/vitest/dist/config.js";
import path from "node:path";
var __vite_injected_original_dirname = "/sessions/epic-sweet-ride/mnt/dynamic-form-engine/packages/react";
var vitest_config_default = defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts", "src/**/*.d.ts", "src/builder/**/*.{ts,tsx}"],
      thresholds: {
        lines: 14,
        statements: 14
      }
    }
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  resolve: {
    alias: {
      "@dmc--98/dfe-core": path.resolve(__vite_injected_original_dirname, "../core/src/index.ts")
    },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".json"]
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9zZXNzaW9ucy9lcGljLXN3ZWV0LXJpZGUvbW50L2R5bmFtaWMtZm9ybS1lbmdpbmUvcGFja2FnZXMvcmVhY3RcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9zZXNzaW9ucy9lcGljLXN3ZWV0LXJpZGUvbW50L2R5bmFtaWMtZm9ybS1lbmdpbmUvcGFja2FnZXMvcmVhY3Qvdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vc2Vzc2lvbnMvZXBpYy1zd2VldC1yaWRlL21udC9keW5hbWljLWZvcm0tZW5naW5lL3BhY2thZ2VzL3JlYWN0L3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ25vZGUnLFxuICAgIGluY2x1ZGU6IFsnX190ZXN0c19fLyoqLyoudGVzdC50cycsICdfX3Rlc3RzX18vKiovKi50ZXN0LnRzeCddLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICBwcm92aWRlcjogJ3Y4JyxcbiAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbi1zdW1tYXJ5J10sXG4gICAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnt0cyx0c3h9J10sXG4gICAgICBleGNsdWRlOiBbJ3NyYy9pbmRleC50cycsICdzcmMvKiovKi5kLnRzJywgJ3NyYy9idWlsZGVyLyoqLyoue3RzLHRzeH0nXSxcbiAgICAgIHRocmVzaG9sZHM6IHtcbiAgICAgICAgbGluZXM6IDE0LFxuICAgICAgICBzdGF0ZW1lbnRzOiAxNCxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgZXNidWlsZDoge1xuICAgIGpzeDogJ2F1dG9tYXRpYycsXG4gICAganN4SW1wb3J0U291cmNlOiAncmVhY3QnLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAZG1jLS05OC9kZmUtY29yZSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9jb3JlL3NyYy9pbmRleC50cycpLFxuICAgIH0sXG4gICAgZXh0ZW5zaW9uczogWycudHN4JywgJy50cycsICcuanN4JywgJy5qcycsICcubWpzJywgJy5janMnLCAnLmpzb24nXSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNYLFNBQVMsb0JBQW9CO0FBQ25aLE9BQU8sVUFBVTtBQURqQixJQUFNLG1DQUFtQztBQUd6QyxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixTQUFTLENBQUMsMEJBQTBCLHlCQUF5QjtBQUFBLElBQzdELFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLGNBQWM7QUFBQSxNQUNqQyxTQUFTLENBQUMsbUJBQW1CO0FBQUEsTUFDN0IsU0FBUyxDQUFDLGdCQUFnQixpQkFBaUIsMkJBQTJCO0FBQUEsTUFDdEUsWUFBWTtBQUFBLFFBQ1YsT0FBTztBQUFBLFFBQ1AsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsS0FBSztBQUFBLElBQ0wsaUJBQWlCO0FBQUEsRUFDbkI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLHFCQUFxQixLQUFLLFFBQVEsa0NBQVcsc0JBQXNCO0FBQUEsSUFDckU7QUFBQSxJQUNBLFlBQVksQ0FBQyxRQUFRLE9BQU8sUUFBUSxPQUFPLFFBQVEsUUFBUSxPQUFPO0FBQUEsRUFDcEU7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
