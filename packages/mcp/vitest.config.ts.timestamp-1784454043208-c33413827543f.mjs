// packages/mcp/vitest.config.ts
import { defineConfig } from "file:///sessions/hopeful-gracious-mccarthy/mnt/dynamic-form-engine/node_modules/.pnpm/vitest@1.6.1_@types+node@20.19.37_jsdom@24.1.3/node_modules/vitest/dist/config.js";
import path from "node:path";
var __vite_injected_original_dirname = "/sessions/hopeful-gracious-mccarthy/mnt/dynamic-form-engine/packages/mcp";
var vitest_config_default = defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/bin/**/*.ts", "src/**/*.d.ts"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      "@dmc--98/dfe-ai": path.resolve(__vite_injected_original_dirname, "../ai/src/index.ts")
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"]
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGFja2FnZXMvbWNwL3ZpdGVzdC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvaG9wZWZ1bC1ncmFjaW91cy1tY2NhcnRoeS9tbnQvZHluYW1pYy1mb3JtLWVuZ2luZS9wYWNrYWdlcy9tY3BcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9zZXNzaW9ucy9ob3BlZnVsLWdyYWNpb3VzLW1jY2FydGh5L21udC9keW5hbWljLWZvcm0tZW5naW5lL3BhY2thZ2VzL21jcC92aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9ob3BlZnVsLWdyYWNpb3VzLW1jY2FydGh5L21udC9keW5hbWljLWZvcm0tZW5naW5lL3BhY2thZ2VzL21jcC92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdub2RlJyxcbiAgICBpbmNsdWRlOiBbJ19fdGVzdHNfXy8qKi8qLnRlc3QudHMnXSxcbiAgICBjb3ZlcmFnZToge1xuICAgICAgcHJvdmlkZXI6ICd2OCcsXG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24tc3VtbWFyeSddLFxuICAgICAgaW5jbHVkZTogWydzcmMvKiovKi50cyddLFxuICAgICAgZXhjbHVkZTogWydzcmMvaW5kZXgudHMnLCAnc3JjL2Jpbi8qKi8qLnRzJywgJ3NyYy8qKi8qLmQudHMnXSxcbiAgICAgIHRocmVzaG9sZHM6IHtcbiAgICAgICAgYnJhbmNoZXM6IDgwLFxuICAgICAgICBmdW5jdGlvbnM6IDgwLFxuICAgICAgICBsaW5lczogODAsXG4gICAgICAgIHN0YXRlbWVudHM6IDgwLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAZG1jLS05OC9kZmUtYWknOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vYWkvc3JjL2luZGV4LnRzJyksXG4gICAgfSxcbiAgICBleHRlbnNpb25zOiBbJy50cycsICcudHN4JywgJy5qcycsICcuanN4JywgJy5tanMnLCAnLmNqcycsICcuanNvbiddLFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFksU0FBUyxvQkFBb0I7QUFDM2EsT0FBTyxVQUFVO0FBRGpCLElBQU0sbUNBQW1DO0FBR3pDLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFNBQVMsQ0FBQyx3QkFBd0I7QUFBQSxJQUNsQyxVQUFVO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixVQUFVLENBQUMsUUFBUSxjQUFjO0FBQUEsTUFDakMsU0FBUyxDQUFDLGFBQWE7QUFBQSxNQUN2QixTQUFTLENBQUMsZ0JBQWdCLG1CQUFtQixlQUFlO0FBQUEsTUFDNUQsWUFBWTtBQUFBLFFBQ1YsVUFBVTtBQUFBLFFBQ1YsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsbUJBQW1CLEtBQUssUUFBUSxrQ0FBVyxvQkFBb0I7QUFBQSxJQUNqRTtBQUFBLElBQ0EsWUFBWSxDQUFDLE9BQU8sUUFBUSxPQUFPLFFBQVEsUUFBUSxRQUFRLE9BQU87QUFBQSxFQUNwRTtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
