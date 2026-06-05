"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const dfe_prisma_1 = require("@dmc--98/dfe-prisma");
const dfe_express_1 = require("@dmc--98/dfe-express");
const prisma = new client_1.PrismaClient();
const db = new dfe_prisma_1.PrismaDatabaseAdapter(prisma);
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Mount DFE routes at /api/dfe/*
app.use('/api', (0, dfe_express_1.createDfeRouter)({
    db,
    getUserId: (req) => {
        var _a;
        // In a real app, extract from JWT/session
        return (_a = req.headers['x-user-id']) !== null && _a !== void 0 ? _a : 'demo-user';
    },
}));
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3001;
app.listen(PORT, () => {
    console.log(`🚀 DFE Example API running on http://localhost:${PORT}`);
    console.log(`   API routes: http://localhost:${PORT}/api/dfe/forms`);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNEQUE2QjtBQUM3QixnREFBdUI7QUFDdkIsMkNBQTZDO0FBQzdDLHNEQUE2RDtBQUM3RCx3REFBd0Q7QUFFeEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxxQkFBWSxFQUFFLENBQUE7QUFDakMsTUFBTSxFQUFFLEdBQUcsSUFBSSxrQ0FBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUU1QyxNQUFNLEdBQUcsR0FBRyxJQUFBLGlCQUFPLEdBQUUsQ0FBQTtBQUNyQixHQUFHLENBQUMsR0FBRyxDQUFDLElBQUEsY0FBSSxHQUFFLENBQUMsQ0FBQTtBQUNmLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBRXZCLGlDQUFpQztBQUNqQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFBLDZCQUFlLEVBQUM7SUFDOUIsRUFBRTtJQUNGLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFOztRQUNqQiwwQ0FBMEM7UUFDMUMsT0FBTyxNQUFDLEdBQVcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFXLG1DQUFJLFdBQVcsQ0FBQTtJQUNuRSxDQUFDO0NBQ0YsQ0FBQyxDQUFDLENBQUE7QUFFSCxlQUFlO0FBQ2YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDL0IsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQzVCLENBQUMsQ0FBQyxDQUFBO0FBRUYsTUFBTSxJQUFJLEdBQUcsTUFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksbUNBQUksSUFBSSxDQUFBO0FBQ3JDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtJQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLGtEQUFrRCxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ3JFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLElBQUksZ0JBQWdCLENBQUMsQ0FBQTtBQUN0RSxDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnXG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJ1xuaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnXG5pbXBvcnQgeyBQcmlzbWFEYXRhYmFzZUFkYXB0ZXIgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1wcmlzbWEnXG5pbXBvcnQgeyBjcmVhdGVEZmVSb3V0ZXIgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1leHByZXNzJ1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KClcbmNvbnN0IGRiID0gbmV3IFByaXNtYURhdGFiYXNlQWRhcHRlcihwcmlzbWEpXG5cbmNvbnN0IGFwcCA9IGV4cHJlc3MoKVxuYXBwLnVzZShjb3JzKCkpXG5hcHAudXNlKGV4cHJlc3MuanNvbigpKVxuXG4vLyBNb3VudCBERkUgcm91dGVzIGF0IC9hcGkvZGZlLypcbmFwcC51c2UoJy9hcGknLCBjcmVhdGVEZmVSb3V0ZXIoe1xuICBkYixcbiAgZ2V0VXNlcklkOiAocmVxKSA9PiB7XG4gICAgLy8gSW4gYSByZWFsIGFwcCwgZXh0cmFjdCBmcm9tIEpXVC9zZXNzaW9uXG4gICAgcmV0dXJuIChyZXEgYXMgYW55KS5oZWFkZXJzWyd4LXVzZXItaWQnXSBhcyBzdHJpbmcgPz8gJ2RlbW8tdXNlcidcbiAgfSxcbn0pKVxuXG4vLyBIZWFsdGggY2hlY2tcbmFwcC5nZXQoJy9oZWFsdGgnLCAoX3JlcSwgcmVzKSA9PiB7XG4gIHJlcy5qc29uKHsgc3RhdHVzOiAnb2snIH0pXG59KVxuXG5jb25zdCBQT1JUID0gcHJvY2Vzcy5lbnYuUE9SVCA/PyAzMDAxXG5hcHAubGlzdGVuKFBPUlQsICgpID0+IHtcbiAgY29uc29sZS5sb2coYPCfmoAgREZFIEV4YW1wbGUgQVBJIHJ1bm5pbmcgb24gaHR0cDovL2xvY2FsaG9zdDoke1BPUlR9YClcbiAgY29uc29sZS5sb2coYCAgIEFQSSByb3V0ZXM6IGh0dHA6Ly9sb2NhbGhvc3Q6JHtQT1JUfS9hcGkvZGZlL2Zvcm1zYClcbn0pXG4iXX0=