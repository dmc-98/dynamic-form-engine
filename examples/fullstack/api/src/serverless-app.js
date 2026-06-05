"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createServerlessApp = createServerlessApp;
var client_1 = require("@prisma/client");
var hono_1 = require("hono");
var dfe_prisma_1 = require("@dmc--98/dfe-prisma");
var cors_1 = require("hono/cors");
var dfe_hono_1 = require("@dmc--98/dfe-hono");
var prisma = new client_1.PrismaClient();
var db = new dfe_prisma_1.PrismaDatabaseAdapter(prisma);
var collaboration = new dfe_prisma_1.PrismaCollaborationStore(prisma);
var defaultTenantId = (_a = process.env.DFE_TENANT_ID) !== null && _a !== void 0 ? _a : 'demo-tenant';
function createServerlessApp() {
    var _a, _b;
    var api = (0, dfe_hono_1.createDfeApp)({
        db: db,
        prefix: '/api/dfe',
        allowedOptionFilterKeys: ['department'],
        collaboration: {
            store: collaboration,
            pollIntervalMs: Number.parseInt((_a = process.env.DFE_COLLAB_POLL_MS) !== null && _a !== void 0 ? _a : '250', 10),
            presenceTtlMs: Number.parseInt((_b = process.env.DFE_COLLAB_PRESENCE_TTL_MS) !== null && _b !== void 0 ? _b : '45000', 10),
        },
        getTenantId: function (c) { var _a, _b; return (_b = (_a = c.req.header('x-tenant-id')) !== null && _a !== void 0 ? _a : c.req.query('tenantId')) !== null && _b !== void 0 ? _b : defaultTenantId; },
        getUserId: function (c) { var _a, _b; return (_b = (_a = c.req.header('x-user-id')) !== null && _a !== void 0 ? _a : c.req.query('userId')) !== null && _b !== void 0 ? _b : 'demo-user'; },
    });
    var app = new hono_1.Hono();
    app.use('*', (0, cors_1.cors)());
    app.route('/', api);
    app.get('/health', function (c) { return c.json({ status: 'ok', mode: 'serverless' }); });
    return app;
}
exports.app = createServerlessApp();
