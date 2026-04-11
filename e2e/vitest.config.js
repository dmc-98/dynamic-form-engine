"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const path_1 = __importDefault(require("path"));
exports.default = (0, config_1.defineConfig)({
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
            'zod': path_1.default.resolve(__dirname, '../packages/core/node_modules/zod'),
            '@dmc-98/dfe-core': path_1.default.resolve(__dirname, '../packages/core/src/index.ts'),
            '@dmc-98/dfe-server': path_1.default.resolve(__dirname, '../packages/server/src/index.ts'),
            '@dmc-98/dfe-express': path_1.default.resolve(__dirname, '../packages/express/src/index.ts'),
            '@dmc-98/dfe-react': path_1.default.resolve(__dirname, '../packages/react/src/index.ts'),
            '@dmc-98/dfe-cli/src/commands/validate': path_1.default.resolve(__dirname, '../packages/cli/src/commands/validate.ts'),
            '@dmc-98/dfe-cli': path_1.default.resolve(__dirname, '../packages/cli/src/index.ts'),
        },
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZXN0LmNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZpdGVzdC5jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwQ0FBNEM7QUFDNUMsZ0RBQXVCO0FBRXZCLGtCQUFlLElBQUEscUJBQVksRUFBQztJQUMxQixJQUFJLEVBQUU7UUFDSixPQUFPLEVBQUUsSUFBSTtRQUNiLFdBQVcsRUFBRSxNQUFNO1FBQ25CLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQztRQUN6QixXQUFXLEVBQUUsS0FBSztRQUNsQixJQUFJLEVBQUUsU0FBUztLQUNoQjtJQUNELEdBQUcsRUFBRTtRQUNILFVBQVUsRUFBRSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDO0tBQzVDO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsS0FBSyxFQUFFO1lBQ0wsS0FBSyxFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG1DQUFtQyxDQUFDO1lBQ25FLHFCQUFxQixFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLCtCQUErQixDQUFDO1lBQy9FLHVCQUF1QixFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGlDQUFpQyxDQUFDO1lBQ25GLHdCQUF3QixFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGtDQUFrQyxDQUFDO1lBQ3JGLHNCQUFzQixFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGdDQUFnQyxDQUFDO1lBQ2pGLDBDQUEwQyxFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLDBDQUEwQyxDQUFDO1lBQy9HLG9CQUFvQixFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLDhCQUE4QixDQUFDO1NBQzlFO0tBQ0Y7Q0FDRixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdub2RlJyxcbiAgICBpbmNsdWRlOiBbJyoqLyoudGVzdC50cyddLFxuICAgIHRlc3RUaW1lb3V0OiAzMDAwMCxcbiAgICBwb29sOiAndGhyZWFkcycsXG4gIH0sXG4gIHNzcjoge1xuICAgIG5vRXh0ZXJuYWw6IFsnZXhwcmVzcycsICdzdXBlcnRlc3QnLCAnem9kJ10sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ3pvZCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9wYWNrYWdlcy9jb3JlL25vZGVfbW9kdWxlcy96b2QnKSxcbiAgICAgICdAc25hcmp1bjk4L2RmZS1jb3JlJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL3BhY2thZ2VzL2NvcmUvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQHNuYXJqdW45OC9kZmUtc2VydmVyJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL3BhY2thZ2VzL3NlcnZlci9zcmMvaW5kZXgudHMnKSxcbiAgICAgICdAc25hcmp1bjk4L2RmZS1leHByZXNzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL3BhY2thZ2VzL2V4cHJlc3Mvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQHNuYXJqdW45OC9kZmUtcmVhY3QnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vcGFja2FnZXMvcmVhY3Qvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQHNuYXJqdW45OC9kZmUtY2xpL3NyYy9jb21tYW5kcy92YWxpZGF0ZSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9wYWNrYWdlcy9jbGkvc3JjL2NvbW1hbmRzL3ZhbGlkYXRlLnRzJyksXG4gICAgICAnQHNuYXJqdW45OC9kZmUtY2xpJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL3BhY2thZ2VzL2NsaS9zcmMvaW5kZXgudHMnKSxcbiAgICB9LFxuICB9LFxufSlcbiJdfQ==