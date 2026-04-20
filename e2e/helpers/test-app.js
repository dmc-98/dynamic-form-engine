"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
/**
 * Express test app factory for API E2E tests.
 * Creates a fully wired Express app with mock database.
 */
const express_1 = __importDefault(require("express"));
const dfe_express_1 = require("@dmc--98/dfe-express");
function createTestApp(options) {
    var _a, _b;
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const router = (0, dfe_express_1.createDfeRouter)({
        db: options.db,
        getUserId: (_a = options.getUserId) !== null && _a !== void 0 ? _a : (() => 'test-user-1'),
        skipAuth: (_b = options.skipAuth) !== null && _b !== void 0 ? _b : false,
        prefix: options.prefix,
        allowedOptionFilterKeys: options.allowedOptionFilterKeys,
    });
    app.use(router);
    return app;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1hcHAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0LWFwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQWdCQSxzQ0FjQztBQTlCRDs7O0dBR0c7QUFDSCxzREFBNkI7QUFDN0Isd0RBQXdEO0FBV3hELFNBQWdCLGFBQWEsQ0FBQyxPQUF1Qjs7SUFDbkQsTUFBTSxHQUFHLEdBQUcsSUFBQSxpQkFBTyxHQUFFLENBQUE7SUFDckIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7SUFFdkIsTUFBTSxNQUFNLEdBQUcsSUFBQSw2QkFBZSxFQUFDO1FBQzdCLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRTtRQUNkLFNBQVMsRUFBRSxNQUFBLE9BQU8sQ0FBQyxTQUFTLG1DQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDO1FBQ3JELFFBQVEsRUFBRSxNQUFBLE9BQU8sQ0FBQyxRQUFRLG1DQUFJLEtBQUs7UUFDbkMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNO1FBQ3RCLHVCQUF1QixFQUFFLE9BQU8sQ0FBQyx1QkFBdUI7S0FDekQsQ0FBQyxDQUFBO0lBRUYsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNmLE9BQU8sR0FBRyxDQUFBO0FBQ1osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRXhwcmVzcyB0ZXN0IGFwcCBmYWN0b3J5IGZvciBBUEkgRTJFIHRlc3RzLlxuICogQ3JlYXRlcyBhIGZ1bGx5IHdpcmVkIEV4cHJlc3MgYXBwIHdpdGggbW9jayBkYXRhYmFzZS5cbiAqL1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcydcbmltcG9ydCB7IGNyZWF0ZURmZVJvdXRlciB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWV4cHJlc3MnXG5pbXBvcnQgdHlwZSB7IEluTWVtb3J5RGF0YWJhc2UgfSBmcm9tICcuL21vY2stZGInXG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdEFwcE9wdGlvbnMge1xuICBkYjogSW5NZW1vcnlEYXRhYmFzZVxuICBnZXRVc2VySWQ/OiAocmVxOiBleHByZXNzLlJlcXVlc3QpID0+IHN0cmluZyB8IG51bGxcbiAgc2tpcEF1dGg/OiBib29sZWFuXG4gIHByZWZpeD86IHN0cmluZ1xuICBhbGxvd2VkT3B0aW9uRmlsdGVyS2V5cz86IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXN0QXBwKG9wdGlvbnM6IFRlc3RBcHBPcHRpb25zKSB7XG4gIGNvbnN0IGFwcCA9IGV4cHJlc3MoKVxuICBhcHAudXNlKGV4cHJlc3MuanNvbigpKVxuXG4gIGNvbnN0IHJvdXRlciA9IGNyZWF0ZURmZVJvdXRlcih7XG4gICAgZGI6IG9wdGlvbnMuZGIsXG4gICAgZ2V0VXNlcklkOiBvcHRpb25zLmdldFVzZXJJZCA/PyAoKCkgPT4gJ3Rlc3QtdXNlci0xJyksXG4gICAgc2tpcEF1dGg6IG9wdGlvbnMuc2tpcEF1dGggPz8gZmFsc2UsXG4gICAgcHJlZml4OiBvcHRpb25zLnByZWZpeCxcbiAgICBhbGxvd2VkT3B0aW9uRmlsdGVyS2V5czogb3B0aW9ucy5hbGxvd2VkT3B0aW9uRmlsdGVyS2V5cyxcbiAgfSlcblxuICBhcHAudXNlKHJvdXRlcilcbiAgcmV0dXJuIGFwcFxufVxuIl19