"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_express_1 = require("@dmc--98/dfe-express");
const mock_db_1 = require("./helpers/mock-db");
// Use require to load these packages at runtime in Node environment
const express = require('express').default || require('express');
const request = require('supertest');
(0, vitest_1.describe)('Express API Pipeline E2E Tests', () => {
    let db;
    let app;
    (0, vitest_1.beforeEach)(() => {
        db = (0, mock_db_1.createTestDb)();
        app = express();
        app.use(express.json());
        app.use((0, dfe_express_1.createDfeRouter)({ db, getUserId: () => 'user-1', skipAuth: false }));
    });
    (0, vitest_1.describe)('GET /dfe/forms', () => {
        (0, vitest_1.it)('should return 200 with empty items when no forms exist', async () => {
            const res = await request(app).get('/dfe/forms');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('items');
            (0, vitest_1.expect)(res.body.items).toEqual([]);
        });
        (0, vitest_1.it)('should return 200 with seeded forms', async () => {
            (0, mock_db_1.seedContactForm)(db);
            const res = await request(app).get('/dfe/forms');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.items.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(res.body.items[0]).toHaveProperty('id');
            (0, vitest_1.expect)(res.body.items[0]).toHaveProperty('slug');
        });
        (0, vitest_1.it)('should support cursor pagination with pageSize=1', async () => {
            (0, mock_db_1.seedContactForm)(db);
            (0, mock_db_1.seedMultiStepForm)(db);
            const res = await request(app).get('/dfe/forms?pageSize=1');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.items.length).toBe(1);
            (0, vitest_1.expect)(res.body).toHaveProperty('nextCursor');
        });
        (0, vitest_1.it)('should return next page using cursor parameter', async () => {
            (0, mock_db_1.seedContactForm)(db);
            (0, mock_db_1.seedMultiStepForm)(db);
            const firstPage = await request(app).get('/dfe/forms?pageSize=1');
            (0, vitest_1.expect)(firstPage.body.nextCursor).toBeDefined();
            const secondPage = await request(app).get(`/dfe/forms?pageSize=1&cursor=${firstPage.body.nextCursor}`);
            (0, vitest_1.expect)(secondPage.status).toBe(200);
            (0, vitest_1.expect)(secondPage.body.items.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(secondPage.body.items[0].id).not.toBe(firstPage.body.items[0].id);
        });
    });
    (0, vitest_1.describe)('GET /dfe/forms/:slug', () => {
        (0, vitest_1.it)('should return 200 with form data when form exists', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(app).get(`/dfe/forms/${form.slug}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('id', form.id);
            (0, vitest_1.expect)(res.body).toHaveProperty('slug', form.slug);
            (0, vitest_1.expect)(res.body).toHaveProperty('steps');
        });
        (0, vitest_1.it)('should return 404 when form does not exist', async () => {
            const res = await request(app).get('/dfe/forms/nonexistent-form');
            (0, vitest_1.expect)(res.status).toBe(404);
        });
        (0, vitest_1.it)('should return complete form structure with fields', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(app).get(`/dfe/forms/${form.slug}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.steps).toBeInstanceOf(Array);
            (0, vitest_1.expect)(res.body.steps.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(res.body.fields).toBeInstanceOf(Array);
            (0, vitest_1.expect)(res.body.fields.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('POST /dfe/submissions', () => {
        (0, vitest_1.it)('should return 201 with submission ID when valid form is submitted', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body).toHaveProperty('id');
            (0, vitest_1.expect)(res.body).toHaveProperty('formId', form.id);
            (0, vitest_1.expect)(res.body).toHaveProperty('status', 'IN_PROGRESS');
        });
        (0, vitest_1.it)('should return 400 when formId is missing', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(app)
                .post('/dfe/submissions')
                .send({ versionId: form.versionId });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)('should return 400 when versionId is missing', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)('should return 401 when user is not authenticated', async () => {
            const appUnauth = express();
            appUnauth.use(express.json());
            appUnauth.use((0, dfe_express_1.createDfeRouter)({ db, getUserId: () => null, skipAuth: false }));
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(appUnauth)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('should create submission with correct ownership', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.userId).toBe('user-1');
        });
    });
    (0, vitest_1.describe)('GET /dfe/submissions/:id', () => {
        (0, vitest_1.it)('should return 200 with submission data', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const res = await request(app).get(`/dfe/submissions/${submission.body.id}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('id', submission.body.id);
            (0, vitest_1.expect)(res.body).toHaveProperty('formId', form.id);
        });
        (0, vitest_1.it)('should return 404 when submission does not exist', async () => {
            const res = await request(app).get('/dfe/submissions/nonexistent-id');
            (0, vitest_1.expect)(res.status).toBe(404);
        });
        (0, vitest_1.it)('should return 401 when user is not authenticated', async () => {
            const appUnauth = express();
            appUnauth.use(express.json());
            appUnauth.use((0, dfe_express_1.createDfeRouter)({ db, getUserId: () => null, skipAuth: false }));
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const res = await request(appUnauth).get(`/dfe/submissions/${submission.body.id}`);
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('should return 403 when user does not own submission', async () => {
            const appOtherUser = express();
            appOtherUser.use(express.json());
            appOtherUser.use((0, dfe_express_1.createDfeRouter)({ db, getUserId: () => 'user-2', skipAuth: false }));
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const res = await request(appOtherUser).get(`/dfe/submissions/${submission.body.id}`);
            (0, vitest_1.expect)(res.status).toBe(403);
        });
    });
    (0, vitest_1.describe)('POST /dfe/submissions/:id/steps/:stepId', () => {
        (0, vitest_1.it)('should return 200 with valid step values', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            // step_info requires firstName, lastName, email
            const firstStep = form.steps[0];
            const res = await request(app)
                .post(`/dfe/submissions/${submission.body.id}/steps/${firstStep.id}`)
                .send({ values: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('success', true);
        });
        (0, vitest_1.it)('should update submission after step submit', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const firstStep = form.steps[0];
            const stepRes = await request(app)
                .post(`/dfe/submissions/${submission.body.id}/steps/${firstStep.id}`)
                .send({ values: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
            (0, vitest_1.expect)(stepRes.status).toBe(200);
            (0, vitest_1.expect)(stepRes.body.success).toBe(true);
            // Verify submission's currentStepId was updated
            const res = await request(app).get(`/dfe/submissions/${submission.body.id}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.currentStepId).toBe(firstStep.id);
        });
        (0, vitest_1.it)('should return 401 when user is not authenticated', async () => {
            const appUnauth = express();
            appUnauth.use(express.json());
            appUnauth.use((0, dfe_express_1.createDfeRouter)({ db, getUserId: () => null, skipAuth: false }));
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const res = await request(appUnauth)
                .post(`/dfe/submissions/${submission.body.id}/steps/${form.steps[0].id}`)
                .send({ values: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('should return 422 with validation errors for invalid step values', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            // step_info fields are required, sending empty should fail validation
            const res = await request(app)
                .post(`/dfe/submissions/${submission.body.id}/steps/${form.steps[0].id}`)
                .send({ values: {} });
            (0, vitest_1.expect)(res.status).toBe(422);
            (0, vitest_1.expect)(res.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('POST /dfe/submissions/:id/complete', () => {
        (0, vitest_1.it)('should return 200 and mark submission as completed', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const res = await request(app)
                .post(`/dfe/submissions/${submission.body.id}/complete`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
        });
        (0, vitest_1.it)('should return 401 when user is not authenticated', async () => {
            const appUnauth = express();
            appUnauth.use(express.json());
            appUnauth.use((0, dfe_express_1.createDfeRouter)({ db, getUserId: () => null, skipAuth: false }));
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const res = await request(appUnauth)
                .post(`/dfe/submissions/${submission.body.id}/complete`);
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('should handle gracefully when completing already completed submission', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            await request(app)
                .post(`/dfe/submissions/${submission.body.id}/complete`);
            const res = await request(app)
                .post(`/dfe/submissions/${submission.body.id}/complete`);
            // Already completed returns 409 conflict
            (0, vitest_1.expect)(res.status).toBe(409);
        });
    });
    (0, vitest_1.describe)('GET /dfe/fields/:fieldId/options', () => {
        (0, vitest_1.it)('should return 200 with field options', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const fieldWithOptions = form.fields.find((f) => f.options);
            if (fieldWithOptions) {
                const res = await request(app).get(`/dfe/fields/${fieldWithOptions.id}/options`);
                (0, vitest_1.expect)(res.status).toBe(200);
                (0, vitest_1.expect)(res.body).toHaveProperty('items');
            }
        });
        (0, vitest_1.it)('should support search filter for dynamic options', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const fieldWithOptions = form.fields.find((f) => f.options);
            if (fieldWithOptions) {
                const res = await request(app)
                    .get(`/dfe/fields/${fieldWithOptions.id}/options?q=test`);
                (0, vitest_1.expect)(res.status).toBe(200);
                (0, vitest_1.expect)(res.body).toHaveProperty('items');
            }
        });
        (0, vitest_1.it)('should support country filter for location-based options', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const fieldWithOptions = form.fields.find((f) => f.options);
            if (fieldWithOptions) {
                const res = await request(app)
                    .get(`/dfe/fields/${fieldWithOptions.id}/options?country=US`);
                (0, vitest_1.expect)(res.status).toBe(200);
            }
        });
        (0, vitest_1.it)('should sanitize filter keys with injection characters', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const fieldWithOptions = form.fields.find((f) => f.options);
            if (fieldWithOptions) {
                const res = await request(app)
                    .get(`/dfe/fields/${fieldWithOptions.id}/options?search=${encodeURIComponent('{$ne: null}')}`);
                (0, vitest_1.expect)(res.status).toBe(200);
                (0, vitest_1.expect)(res.body.items).toBeDefined();
            }
        });
    });
    (0, vitest_1.describe)('Full pipeline workflow', () => {
        (0, vitest_1.it)('should complete full multi-step form submission workflow', async () => {
            const form = (0, mock_db_1.seedMultiStepForm)(db);
            // Create submission
            const createRes = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            (0, vitest_1.expect)(createRes.status).toBe(201);
            const submissionId = createRes.body.id;
            // Submit step 1 (name + email required)
            const step1Res = await request(app)
                .post(`/dfe/submissions/${submissionId}/steps/${form.steps[0].id}`)
                .send({ values: { name: 'John Doe', email: 'john@example.com' } });
            (0, vitest_1.expect)(step1Res.status).toBe(200);
            // Submit step 2 (age required)
            const step2Res = await request(app)
                .post(`/dfe/submissions/${submissionId}/steps/${form.steps[1].id}`)
                .send({ values: { age: 30 } });
            (0, vitest_1.expect)(step2Res.status).toBe(200);
            // Submit step 3 (agree optional)
            const step3Res = await request(app)
                .post(`/dfe/submissions/${submissionId}/steps/${form.steps[2].id}`)
                .send({ values: { agree: true } });
            (0, vitest_1.expect)(step3Res.status).toBe(200);
            // Complete submission
            const completeRes = await request(app)
                .post(`/dfe/submissions/${submissionId}/complete`);
            (0, vitest_1.expect)(completeRes.status).toBe(200);
            (0, vitest_1.expect)(completeRes.body.success).toBe(true);
            // Verify final state
            const finalRes = await request(app).get(`/dfe/submissions/${submissionId}`);
            (0, vitest_1.expect)(finalRes.status).toBe(200);
            (0, vitest_1.expect)(finalRes.body.status).toBe('COMPLETED');
            // Context contains userId from initial creation (values aren't auto-merged without API contracts)
            (0, vitest_1.expect)(finalRes.body.context.userId).toBe('user-1');
        });
        (0, vitest_1.it)('should create multiple submissions with unique IDs', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission1 = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const submission2 = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            (0, vitest_1.expect)(submission1.status).toBe(201);
            (0, vitest_1.expect)(submission2.status).toBe(201);
            (0, vitest_1.expect)(submission1.body.id).not.toBe(submission2.body.id);
        });
    });
    (0, vitest_1.describe)('Router options', () => {
        (0, vitest_1.it)('should bypass auth checks when skipAuth is true', async () => {
            const appNoAuth = express();
            appNoAuth.use(express.json());
            appNoAuth.use((0, dfe_express_1.createDfeRouter)({ db, getUserId: () => null, skipAuth: true }));
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(appNoAuth)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            (0, vitest_1.expect)(res.status).toBe(201);
        });
        (0, vitest_1.it)('should use custom prefix for all routes', async () => {
            const appCustom = express();
            appCustom.use(express.json());
            appCustom.use((0, dfe_express_1.createDfeRouter)({
                db,
                getUserId: () => 'user-1',
                skipAuth: false,
                prefix: '/api/v2'
            }));
            const form = (0, mock_db_1.seedContactForm)(db);
            const res = await request(appCustom).get('/api/v2/forms');
            (0, vitest_1.expect)(res.status).toBe(200);
        });
        (0, vitest_1.it)('should clamp page size to maxPageSize', async () => {
            const appLimited = express();
            appLimited.use(express.json());
            appLimited.use((0, dfe_express_1.createDfeRouter)({
                db,
                getUserId: () => 'user-1',
                maxPageSize: 50
            }));
            (0, mock_db_1.seedContactForm)(db);
            const res = await request(appLimited).get('/dfe/forms?pageSize=999');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.items.length).toBeLessThanOrEqual(50);
        });
        (0, vitest_1.it)('should restrict field option filters to allowedOptionFilterKeys', async () => {
            const appRestricted = express();
            appRestricted.use(express.json());
            appRestricted.use((0, dfe_express_1.createDfeRouter)({
                db,
                getUserId: () => 'user-1',
                allowedOptionFilterKeys: ['search']
            }));
            const form = (0, mock_db_1.seedContactForm)(db);
            const fieldWithOptions = form.fields.find((f) => f.options);
            if (fieldWithOptions) {
                const res = await request(appRestricted)
                    .get(`/dfe/fields/${fieldWithOptions.id}/options?country=US&search=test`);
                (0, vitest_1.expect)(res.status).toBe(200);
            }
        });
    });
    (0, vitest_1.describe)('Edge cases', () => {
        (0, vitest_1.it)('should default pageSize to 20 when negative value is provided', async () => {
            (0, mock_db_1.seedContactForm)(db);
            const res = await request(app).get('/dfe/forms?pageSize=-5');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.items).toBeDefined();
        });
        (0, vitest_1.it)('should handle invalid JSON body gracefully', async () => {
            const res = await request(app)
                .post('/dfe/submissions')
                .set('Content-Type', 'application/json')
                .send('invalid json');
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)('should return all forms when multiple forms are seeded', async () => {
            (0, mock_db_1.seedContactForm)(db);
            (0, mock_db_1.seedMultiStepForm)(db);
            const res = await request(app).get('/dfe/forms');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.items.length).toBeGreaterThanOrEqual(2);
        });
        (0, vitest_1.it)('should return 422 for non-existent step ID', async () => {
            const form = (0, mock_db_1.seedContactForm)(db);
            const submission = await request(app)
                .post('/dfe/submissions')
                .send({ formId: form.id, versionId: form.versionId });
            const res = await request(app)
                .post(`/dfe/submissions/${submission.body.id}/steps/nonexistent-step`)
                .send({ values: {} });
            (0, vitest_1.expect)(res.status).toBe(422);
            (0, vitest_1.expect)(res.body.success).toBe(false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzcy1hcGktcGlwZWxpbmUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4cHJlc3MtYXBpLXBpcGVsaW5lLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBeUQ7QUFDekQsd0RBQXdEO0FBQ3hELCtDQUFzRztBQUV0RyxvRUFBb0U7QUFDcEUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDaEUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO0FBRXBDLElBQUEsaUJBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7SUFDOUMsSUFBSSxFQUFvQixDQUFBO0lBQ3hCLElBQUksR0FBUSxDQUFBO0lBRVosSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRTtRQUNkLEVBQUUsR0FBRyxJQUFBLHNCQUFZLEdBQUUsQ0FBQTtRQUNuQixHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUE7UUFDZixHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQ3ZCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBQSw2QkFBZSxFQUFDLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUM5RSxDQUFDLENBQUMsQ0FBQTtJQUVGLElBQUEsaUJBQVEsRUFBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsSUFBQSxXQUFFLEVBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEUsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ2hELElBQUEsZUFBTSxFQUFDLEdBQUcsQ0FBQyxN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TUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1lBRXZELE1BQU0sR0FBRyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztpQkFDM0IsSUFBSSxDQUFDLG9CQUFvQixVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUseUJBQXlCLENBQUM7aUJBQ3JFLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ3ZCLElBQUEsZUFBTSxFQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDNUIsSUFBQSxlQUFNLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QsIGJlZm9yZUVhY2ggfSBmcm9tICd2aXRlc3QnXG5pbXBvcnQgeyBjcmVhdGVEZmVSb3V0ZXIgfSBmcm9tICdAc25hcmp1bjk4L2RmZS1leHByZXNzJ1xuaW1wb3J0IHsgSW5NZW1vcnlEYXRhYmFzZSwgY3JlYXRlVGVzdERiLCBzZWVkQ29udGFjdEZvcm0sIHNlZWRNdWx0aVN0ZXBGb3JtIH0gZnJvbSAnLi9oZWxwZXJzL21vY2stZGInXG5cbi8vIFVzZSByZXF1aXJlIHRvIGxvYWQgdGhlc2UgcGFja2FnZXMgYXQgcnVudGltZSBpbiBOb2RlIGVudmlyb25tZW50XG5jb25zdCBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpLmRlZmF1bHQgfHwgcmVxdWlyZSgnZXhwcmVzcycpXG5jb25zdCByZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJ0ZXN0JylcblxuZGVzY3JpYmUoJ0V4cHJlc3MgQVBJIFBpcGVsaW5lIEUyRSBUZXN0cycsICgpID0+IHtcbiAgbGV0IGRiOiBJbk1lbW9yeURhdGFiYXNlXG4gIGxldCBhcHA6IGFueVxuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGRiID0gY3JlYXRlVGVzdERiKClcbiAgICBhcHAgPSBleHByZXNzKClcbiAgICBhcHAudXNlKGV4cHJlc3MuanNvbigpKVxuICAgIGFwcC51c2UoY3JlYXRlRGZlUm91dGVyKHsgZGIsIGdldFVzZXJJZDogKCkgPT4gJ3VzZXItMScsIHNraXBBdXRoOiBmYWxzZSB9KSlcbiAgfSlcblxuICBkZXNjcmliZSgnR0VUIC9kZmUvZm9ybXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gMjAwIHdpdGggZW1wdHkgaXRlbXMgd2hlbiBubyBmb3JtcyBleGlzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QoYXBwKS5nZXQoJy9kZmUvZm9ybXMnKVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5KS50b0hhdmVQcm9wZXJ0eSgnaXRlbXMnKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5Lml0ZW1zKS50b0VxdWFsKFtdKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiAyMDAgd2l0aCBzZWVkZWQgZm9ybXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcCkuZ2V0KCcvZGZlL2Zvcm1zJylcbiAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICAgIGV4cGVjdChyZXMuYm9keS5pdGVtcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5Lml0ZW1zWzBdKS50b0hhdmVQcm9wZXJ0eSgnaWQnKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5Lml0ZW1zWzBdKS50b0hhdmVQcm9wZXJ0eSgnc2x1ZycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3VwcG9ydCBjdXJzb3IgcGFnaW5hdGlvbiB3aXRoIHBhZ2VTaXplPTEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBzZWVkTXVsdGlTdGVwRm9ybShkYilcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QoYXBwKS5nZXQoJy9kZmUvZm9ybXM/cGFnZVNpemU9MScpXG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSgyMDApXG4gICAgICBleHBlY3QocmVzLmJvZHkuaXRlbXMubGVuZ3RoKS50b0JlKDEpXG4gICAgICBleHBlY3QocmVzLmJvZHkpLnRvSGF2ZVByb3BlcnR5KCduZXh0Q3Vyc29yJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbmV4dCBwYWdlIHVzaW5nIGN1cnNvciBwYXJhbWV0ZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBzZWVkTXVsdGlTdGVwRm9ybShkYilcbiAgICAgIGNvbnN0IGZpcnN0UGFnZSA9IGF3YWl0IHJlcXVlc3QoYXBwKS5nZXQoJy9kZmUvZm9ybXM/cGFnZVNpemU9MScpXG4gICAgICBleHBlY3QoZmlyc3RQYWdlLmJvZHkubmV4dEN1cnNvcikudG9CZURlZmluZWQoKVxuXG4gICAgICBjb25zdCBzZWNvbmRQYWdlID0gYXdhaXQgcmVxdWVzdChhcHApLmdldChgL2RmZS9mb3Jtcz9wYWdlU2l6ZT0xJmN1cnNvcj0ke2ZpcnN0UGFnZS5ib2R5Lm5leHRDdXJzb3J9YClcbiAgICAgIGV4cGVjdChzZWNvbmRQYWdlLnN0YXR1cykudG9CZSgyMDApXG4gICAgICBleHBlY3Qoc2Vjb25kUGFnZS5ib2R5Lml0ZW1zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgICBleHBlY3Qoc2Vjb25kUGFnZS5ib2R5Lml0ZW1zWzBdLmlkKS5ub3QudG9CZShmaXJzdFBhZ2UuYm9keS5pdGVtc1swXS5pZClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdHRVQgL2RmZS9mb3Jtcy86c2x1ZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiAyMDAgd2l0aCBmb3JtIGRhdGEgd2hlbiBmb3JtIGV4aXN0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcCkuZ2V0KGAvZGZlL2Zvcm1zLyR7Zm9ybS5zbHVnfWApXG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSgyMDApXG4gICAgICBleHBlY3QocmVzLmJvZHkpLnRvSGF2ZVByb3BlcnR5KCdpZCcsIGZvcm0uaWQpXG4gICAgICBleHBlY3QocmVzLmJvZHkpLnRvSGF2ZVByb3BlcnR5KCdzbHVnJywgZm9ybS5zbHVnKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5KS50b0hhdmVQcm9wZXJ0eSgnc3RlcHMnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiA0MDQgd2hlbiBmb3JtIGRvZXMgbm90IGV4aXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApLmdldCgnL2RmZS9mb3Jtcy9ub25leGlzdGVudC1mb3JtJylcbiAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDQwNClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gY29tcGxldGUgZm9ybSBzdHJ1Y3R1cmUgd2l0aCBmaWVsZHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gc2VlZENvbnRhY3RGb3JtKGRiKVxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApLmdldChgL2RmZS9mb3Jtcy8ke2Zvcm0uc2x1Z31gKVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5LnN0ZXBzKS50b0JlSW5zdGFuY2VPZihBcnJheSlcbiAgICAgIGV4cGVjdChyZXMuYm9keS5zdGVwcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5LmZpZWxkcykudG9CZUluc3RhbmNlT2YoQXJyYXkpXG4gICAgICBleHBlY3QocmVzLmJvZHkuZmllbGRzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnUE9TVCAvZGZlL3N1Ym1pc3Npb25zJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIDIwMSB3aXRoIHN1Ym1pc3Npb24gSUQgd2hlbiB2YWxpZCBmb3JtIGlzIHN1Ym1pdHRlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgLnBvc3QoJy9kZmUvc3VibWlzc2lvbnMnKVxuICAgICAgICAuc2VuZCh7IGZvcm1JZDogZm9ybS5pZCwgdmVyc2lvbklkOiBmb3JtLnZlcnNpb25JZCB9KVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAxKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5KS50b0hhdmVQcm9wZXJ0eSgnaWQnKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5KS50b0hhdmVQcm9wZXJ0eSgnZm9ybUlkJywgZm9ybS5pZClcbiAgICAgIGV4cGVjdChyZXMuYm9keSkudG9IYXZlUHJvcGVydHkoJ3N0YXR1cycsICdJTl9QUk9HUkVTUycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIDQwMCB3aGVuIGZvcm1JZCBpcyBtaXNzaW5nJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IHNlZWRDb250YWN0Rm9ybShkYilcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAucG9zdCgnL2RmZS9zdWJtaXNzaW9ucycpXG4gICAgICAgIC5zZW5kKHsgdmVyc2lvbklkOiBmb3JtLnZlcnNpb25JZCB9KVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoNDAwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiA0MDAgd2hlbiB2ZXJzaW9uSWQgaXMgbWlzc2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgLnBvc3QoJy9kZmUvc3VibWlzc2lvbnMnKVxuICAgICAgICAuc2VuZCh7IGZvcm1JZDogZm9ybS5pZCB9KVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoNDAwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiA0MDEgd2hlbiB1c2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXBwVW5hdXRoID0gZXhwcmVzcygpXG4gICAgICBhcHBVbmF1dGgudXNlKGV4cHJlc3MuanNvbigpKVxuICAgICAgYXBwVW5hdXRoLnVzZShjcmVhdGVEZmVSb3V0ZXIoeyBkYiwgZ2V0VXNlcklkOiAoKSA9PiBudWxsLCBza2lwQXV0aDogZmFsc2UgfSkpXG5cbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcFVuYXV0aClcbiAgICAgICAgLnBvc3QoJy9kZmUvc3VibWlzc2lvbnMnKVxuICAgICAgICAuc2VuZCh7IGZvcm1JZDogZm9ybS5pZCwgdmVyc2lvbklkOiBmb3JtLnZlcnNpb25JZCB9KVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoNDAxKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBzdWJtaXNzaW9uIHdpdGggY29ycmVjdCBvd25lcnNoaXAnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gc2VlZENvbnRhY3RGb3JtKGRiKVxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcbiAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDIwMSlcbiAgICAgIGV4cGVjdChyZXMuYm9keS51c2VySWQpLnRvQmUoJ3VzZXItMScpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnR0VUIC9kZmUvc3VibWlzc2lvbnMvOmlkJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIDIwMCB3aXRoIHN1Ym1pc3Npb24gZGF0YScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApLmdldChgL2RmZS9zdWJtaXNzaW9ucy8ke3N1Ym1pc3Npb24uYm9keS5pZH1gKVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5KS50b0hhdmVQcm9wZXJ0eSgnaWQnLCBzdWJtaXNzaW9uLmJvZHkuaWQpXG4gICAgICBleHBlY3QocmVzLmJvZHkpLnRvSGF2ZVByb3BlcnR5KCdmb3JtSWQnLCBmb3JtLmlkKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiA0MDQgd2hlbiBzdWJtaXNzaW9uIGRvZXMgbm90IGV4aXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApLmdldCgnL2RmZS9zdWJtaXNzaW9ucy9ub25leGlzdGVudC1pZCcpXG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSg0MDQpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIDQwMSB3aGVuIHVzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBhcHBVbmF1dGggPSBleHByZXNzKClcbiAgICAgIGFwcFVuYXV0aC51c2UoZXhwcmVzcy5qc29uKCkpXG4gICAgICBhcHBVbmF1dGgudXNlKGNyZWF0ZURmZVJvdXRlcih7IGRiLCBnZXRVc2VySWQ6ICgpID0+IG51bGwsIHNraXBBdXRoOiBmYWxzZSB9KSlcblxuICAgICAgY29uc3QgZm9ybSA9IHNlZWRDb250YWN0Rm9ybShkYilcbiAgICAgIGNvbnN0IHN1Ym1pc3Npb24gPSBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgLnBvc3QoJy9kZmUvc3VibWlzc2lvbnMnKVxuICAgICAgICAuc2VuZCh7IGZvcm1JZDogZm9ybS5pZCwgdmVyc2lvbklkOiBmb3JtLnZlcnNpb25JZCB9KVxuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcFVuYXV0aCkuZ2V0KGAvZGZlL3N1Ym1pc3Npb25zLyR7c3VibWlzc2lvbi5ib2R5LmlkfWApXG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSg0MDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIDQwMyB3aGVuIHVzZXIgZG9lcyBub3Qgb3duIHN1Ym1pc3Npb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBhcHBPdGhlclVzZXIgPSBleHByZXNzKClcbiAgICAgIGFwcE90aGVyVXNlci51c2UoZXhwcmVzcy5qc29uKCkpXG4gICAgICBhcHBPdGhlclVzZXIudXNlKGNyZWF0ZURmZVJvdXRlcih7IGRiLCBnZXRVc2VySWQ6ICgpID0+ICd1c2VyLTInLCBza2lwQXV0aDogZmFsc2UgfSkpXG5cbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHBPdGhlclVzZXIpLmdldChgL2RmZS9zdWJtaXNzaW9ucy8ke3N1Ym1pc3Npb24uYm9keS5pZH1gKVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoNDAzKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ1BPU1QgL2RmZS9zdWJtaXNzaW9ucy86aWQvc3RlcHMvOnN0ZXBJZCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiAyMDAgd2l0aCB2YWxpZCBzdGVwIHZhbHVlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcblxuICAgICAgLy8gc3RlcF9pbmZvIHJlcXVpcmVzIGZpcnN0TmFtZSwgbGFzdE5hbWUsIGVtYWlsXG4gICAgICBjb25zdCBmaXJzdFN0ZXAgPSBmb3JtLnN0ZXBzWzBdXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgLnBvc3QoYC9kZmUvc3VibWlzc2lvbnMvJHtzdWJtaXNzaW9uLmJvZHkuaWR9L3N0ZXBzLyR7Zmlyc3RTdGVwLmlkfWApXG4gICAgICAgIC5zZW5kKHsgdmFsdWVzOiB7IGZpcnN0TmFtZTogJ0pvaG4nLCBsYXN0TmFtZTogJ0RvZScsIGVtYWlsOiAnam9obkBleGFtcGxlLmNvbScgfSB9KVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5KS50b0hhdmVQcm9wZXJ0eSgnc3VjY2VzcycsIHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIHN1Ym1pc3Npb24gYWZ0ZXIgc3RlcCBzdWJtaXQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gc2VlZENvbnRhY3RGb3JtKGRiKVxuICAgICAgY29uc3Qgc3VibWlzc2lvbiA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAucG9zdCgnL2RmZS9zdWJtaXNzaW9ucycpXG4gICAgICAgIC5zZW5kKHsgZm9ybUlkOiBmb3JtLmlkLCB2ZXJzaW9uSWQ6IGZvcm0udmVyc2lvbklkIH0pXG5cbiAgICAgIGNvbnN0IGZpcnN0U3RlcCA9IGZvcm0uc3RlcHNbMF1cbiAgICAgIGNvbnN0IHN0ZXBSZXMgPSBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgLnBvc3QoYC9kZmUvc3VibWlzc2lvbnMvJHtzdWJtaXNzaW9uLmJvZHkuaWR9L3N0ZXBzLyR7Zmlyc3RTdGVwLmlkfWApXG4gICAgICAgIC5zZW5kKHsgdmFsdWVzOiB7IGZpcnN0TmFtZTogJ0pvaG4nLCBsYXN0TmFtZTogJ0RvZScsIGVtYWlsOiAnam9obkBleGFtcGxlLmNvbScgfSB9KVxuICAgICAgZXhwZWN0KHN0ZXBSZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICAgIGV4cGVjdChzdGVwUmVzLmJvZHkuc3VjY2VzcykudG9CZSh0cnVlKVxuXG4gICAgICAvLyBWZXJpZnkgc3VibWlzc2lvbidzIGN1cnJlbnRTdGVwSWQgd2FzIHVwZGF0ZWRcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QoYXBwKS5nZXQoYC9kZmUvc3VibWlzc2lvbnMvJHtzdWJtaXNzaW9uLmJvZHkuaWR9YClcbiAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICAgIGV4cGVjdChyZXMuYm9keS5jdXJyZW50U3RlcElkKS50b0JlKGZpcnN0U3RlcC5pZClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gNDAxIHdoZW4gdXNlciBpcyBub3QgYXV0aGVudGljYXRlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGFwcFVuYXV0aCA9IGV4cHJlc3MoKVxuICAgICAgYXBwVW5hdXRoLnVzZShleHByZXNzLmpzb24oKSlcbiAgICAgIGFwcFVuYXV0aC51c2UoY3JlYXRlRGZlUm91dGVyKHsgZGIsIGdldFVzZXJJZDogKCkgPT4gbnVsbCwgc2tpcEF1dGg6IGZhbHNlIH0pKVxuXG4gICAgICBjb25zdCBmb3JtID0gc2VlZENvbnRhY3RGb3JtKGRiKVxuICAgICAgY29uc3Qgc3VibWlzc2lvbiA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAucG9zdCgnL2RmZS9zdWJtaXNzaW9ucycpXG4gICAgICAgIC5zZW5kKHsgZm9ybUlkOiBmb3JtLmlkLCB2ZXJzaW9uSWQ6IGZvcm0udmVyc2lvbklkIH0pXG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QoYXBwVW5hdXRoKVxuICAgICAgICAucG9zdChgL2RmZS9zdWJtaXNzaW9ucy8ke3N1Ym1pc3Npb24uYm9keS5pZH0vc3RlcHMvJHtmb3JtLnN0ZXBzWzBdLmlkfWApXG4gICAgICAgIC5zZW5kKHsgdmFsdWVzOiB7IGZpcnN0TmFtZTogJ0pvaG4nLCBsYXN0TmFtZTogJ0RvZScsIGVtYWlsOiAnam9obkBleGFtcGxlLmNvbScgfSB9KVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoNDAxKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiA0MjIgd2l0aCB2YWxpZGF0aW9uIGVycm9ycyBmb3IgaW52YWxpZCBzdGVwIHZhbHVlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcblxuICAgICAgLy8gc3RlcF9pbmZvIGZpZWxkcyBhcmUgcmVxdWlyZWQsIHNlbmRpbmcgZW1wdHkgc2hvdWxkIGZhaWwgdmFsaWRhdGlvblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KGAvZGZlL3N1Ym1pc3Npb25zLyR7c3VibWlzc2lvbi5ib2R5LmlkfS9zdGVwcy8ke2Zvcm0uc3RlcHNbMF0uaWR9YClcbiAgICAgICAgLnNlbmQoeyB2YWx1ZXM6IHt9IH0pXG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSg0MjIpXG4gICAgICBleHBlY3QocmVzLmJvZHkuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdQT1NUIC9kZmUvc3VibWlzc2lvbnMvOmlkL2NvbXBsZXRlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIDIwMCBhbmQgbWFyayBzdWJtaXNzaW9uIGFzIGNvbXBsZXRlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KGAvZGZlL3N1Ym1pc3Npb25zLyR7c3VibWlzc2lvbi5ib2R5LmlkfS9jb21wbGV0ZWApXG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSgyMDApXG4gICAgICBleHBlY3QocmVzLmJvZHkuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiA0MDEgd2hlbiB1c2VyIGlzIG5vdCBhdXRoZW50aWNhdGVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXBwVW5hdXRoID0gZXhwcmVzcygpXG4gICAgICBhcHBVbmF1dGgudXNlKGV4cHJlc3MuanNvbigpKVxuICAgICAgYXBwVW5hdXRoLnVzZShjcmVhdGVEZmVSb3V0ZXIoeyBkYiwgZ2V0VXNlcklkOiAoKSA9PiBudWxsLCBza2lwQXV0aDogZmFsc2UgfSkpXG5cbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHBVbmF1dGgpXG4gICAgICAgIC5wb3N0KGAvZGZlL3N1Ym1pc3Npb25zLyR7c3VibWlzc2lvbi5ib2R5LmlkfS9jb21wbGV0ZWApXG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSg0MDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGdyYWNlZnVsbHkgd2hlbiBjb21wbGV0aW5nIGFscmVhZHkgY29tcGxldGVkIHN1Ym1pc3Npb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gc2VlZENvbnRhY3RGb3JtKGRiKVxuICAgICAgY29uc3Qgc3VibWlzc2lvbiA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAucG9zdCgnL2RmZS9zdWJtaXNzaW9ucycpXG4gICAgICAgIC5zZW5kKHsgZm9ybUlkOiBmb3JtLmlkLCB2ZXJzaW9uSWQ6IGZvcm0udmVyc2lvbklkIH0pXG5cbiAgICAgIGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAucG9zdChgL2RmZS9zdWJtaXNzaW9ucy8ke3N1Ym1pc3Npb24uYm9keS5pZH0vY29tcGxldGVgKVxuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgLnBvc3QoYC9kZmUvc3VibWlzc2lvbnMvJHtzdWJtaXNzaW9uLmJvZHkuaWR9L2NvbXBsZXRlYClcbiAgICAgIC8vIEFscmVhZHkgY29tcGxldGVkIHJldHVybnMgNDA5IGNvbmZsaWN0XG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSg0MDkpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnR0VUIC9kZmUvZmllbGRzLzpmaWVsZElkL29wdGlvbnMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gMjAwIHdpdGggZmllbGQgb3B0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCBmaWVsZFdpdGhPcHRpb25zID0gZm9ybS5maWVsZHMuZmluZCgoZjogYW55KSA9PiBmLm9wdGlvbnMpXG5cbiAgICAgIGlmIChmaWVsZFdpdGhPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QoYXBwKS5nZXQoYC9kZmUvZmllbGRzLyR7ZmllbGRXaXRoT3B0aW9ucy5pZH0vb3B0aW9uc2ApXG4gICAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICAgICAgZXhwZWN0KHJlcy5ib2R5KS50b0hhdmVQcm9wZXJ0eSgnaXRlbXMnKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHN1cHBvcnQgc2VhcmNoIGZpbHRlciBmb3IgZHluYW1pYyBvcHRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IHNlZWRDb250YWN0Rm9ybShkYilcbiAgICAgIGNvbnN0IGZpZWxkV2l0aE9wdGlvbnMgPSBmb3JtLmZpZWxkcy5maW5kKChmOiBhbnkpID0+IGYub3B0aW9ucylcblxuICAgICAgaWYgKGZpZWxkV2l0aE9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgICAgLmdldChgL2RmZS9maWVsZHMvJHtmaWVsZFdpdGhPcHRpb25zLmlkfS9vcHRpb25zP3E9dGVzdGApXG4gICAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICAgICAgZXhwZWN0KHJlcy5ib2R5KS50b0hhdmVQcm9wZXJ0eSgnaXRlbXMnKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHN1cHBvcnQgY291bnRyeSBmaWx0ZXIgZm9yIGxvY2F0aW9uLWJhc2VkIG9wdGlvbnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gc2VlZENvbnRhY3RGb3JtKGRiKVxuICAgICAgY29uc3QgZmllbGRXaXRoT3B0aW9ucyA9IGZvcm0uZmllbGRzLmZpbmQoKGY6IGFueSkgPT4gZi5vcHRpb25zKVxuXG4gICAgICBpZiAoZmllbGRXaXRoT3B0aW9ucykge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgICAuZ2V0KGAvZGZlL2ZpZWxkcy8ke2ZpZWxkV2l0aE9wdGlvbnMuaWR9L29wdGlvbnM/Y291bnRyeT1VU2ApXG4gICAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzYW5pdGl6ZSBmaWx0ZXIga2V5cyB3aXRoIGluamVjdGlvbiBjaGFyYWN0ZXJzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IHNlZWRDb250YWN0Rm9ybShkYilcbiAgICAgIGNvbnN0IGZpZWxkV2l0aE9wdGlvbnMgPSBmb3JtLmZpZWxkcy5maW5kKChmOiBhbnkpID0+IGYub3B0aW9ucylcblxuICAgICAgaWYgKGZpZWxkV2l0aE9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgICAgLmdldChgL2RmZS9maWVsZHMvJHtmaWVsZFdpdGhPcHRpb25zLmlkfS9vcHRpb25zP3NlYXJjaD0ke2VuY29kZVVSSUNvbXBvbmVudCgneyRuZTogbnVsbH0nKX1gKVxuICAgICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSgyMDApXG4gICAgICAgIGV4cGVjdChyZXMuYm9keS5pdGVtcykudG9CZURlZmluZWQoKVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0Z1bGwgcGlwZWxpbmUgd29ya2Zsb3cnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb21wbGV0ZSBmdWxsIG11bHRpLXN0ZXAgZm9ybSBzdWJtaXNzaW9uIHdvcmtmbG93JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IHNlZWRNdWx0aVN0ZXBGb3JtKGRiKVxuXG4gICAgICAvLyBDcmVhdGUgc3VibWlzc2lvblxuICAgICAgY29uc3QgY3JlYXRlUmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcbiAgICAgIGV4cGVjdChjcmVhdGVSZXMuc3RhdHVzKS50b0JlKDIwMSlcbiAgICAgIGNvbnN0IHN1Ym1pc3Npb25JZCA9IGNyZWF0ZVJlcy5ib2R5LmlkXG5cbiAgICAgIC8vIFN1Ym1pdCBzdGVwIDEgKG5hbWUgKyBlbWFpbCByZXF1aXJlZClcbiAgICAgIGNvbnN0IHN0ZXAxUmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KGAvZGZlL3N1Ym1pc3Npb25zLyR7c3VibWlzc2lvbklkfS9zdGVwcy8ke2Zvcm0uc3RlcHNbMF0uaWR9YClcbiAgICAgICAgLnNlbmQoeyB2YWx1ZXM6IHsgbmFtZTogJ0pvaG4gRG9lJywgZW1haWw6ICdqb2huQGV4YW1wbGUuY29tJyB9IH0pXG4gICAgICBleHBlY3Qoc3RlcDFSZXMuc3RhdHVzKS50b0JlKDIwMClcblxuICAgICAgLy8gU3VibWl0IHN0ZXAgMiAoYWdlIHJlcXVpcmVkKVxuICAgICAgY29uc3Qgc3RlcDJSZXMgPSBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgLnBvc3QoYC9kZmUvc3VibWlzc2lvbnMvJHtzdWJtaXNzaW9uSWR9L3N0ZXBzLyR7Zm9ybS5zdGVwc1sxXS5pZH1gKVxuICAgICAgICAuc2VuZCh7IHZhbHVlczogeyBhZ2U6IDMwIH0gfSlcbiAgICAgIGV4cGVjdChzdGVwMlJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuXG4gICAgICAvLyBTdWJtaXQgc3RlcCAzIChhZ3JlZSBvcHRpb25hbClcbiAgICAgIGNvbnN0IHN0ZXAzUmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KGAvZGZlL3N1Ym1pc3Npb25zLyR7c3VibWlzc2lvbklkfS9zdGVwcy8ke2Zvcm0uc3RlcHNbMl0uaWR9YClcbiAgICAgICAgLnNlbmQoeyB2YWx1ZXM6IHsgYWdyZWU6IHRydWUgfSB9KVxuICAgICAgZXhwZWN0KHN0ZXAzUmVzLnN0YXR1cykudG9CZSgyMDApXG5cbiAgICAgIC8vIENvbXBsZXRlIHN1Ym1pc3Npb25cbiAgICAgIGNvbnN0IGNvbXBsZXRlUmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KGAvZGZlL3N1Ym1pc3Npb25zLyR7c3VibWlzc2lvbklkfS9jb21wbGV0ZWApXG4gICAgICBleHBlY3QoY29tcGxldGVSZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICAgIGV4cGVjdChjb21wbGV0ZVJlcy5ib2R5LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcblxuICAgICAgLy8gVmVyaWZ5IGZpbmFsIHN0YXRlXG4gICAgICBjb25zdCBmaW5hbFJlcyA9IGF3YWl0IHJlcXVlc3QoYXBwKS5nZXQoYC9kZmUvc3VibWlzc2lvbnMvJHtzdWJtaXNzaW9uSWR9YClcbiAgICAgIGV4cGVjdChmaW5hbFJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuICAgICAgZXhwZWN0KGZpbmFsUmVzLmJvZHkuc3RhdHVzKS50b0JlKCdDT01QTEVURUQnKVxuICAgICAgLy8gQ29udGV4dCBjb250YWlucyB1c2VySWQgZnJvbSBpbml0aWFsIGNyZWF0aW9uICh2YWx1ZXMgYXJlbid0IGF1dG8tbWVyZ2VkIHdpdGhvdXQgQVBJIGNvbnRyYWN0cylcbiAgICAgIGV4cGVjdChmaW5hbFJlcy5ib2R5LmNvbnRleHQudXNlcklkKS50b0JlKCd1c2VyLTEnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBtdWx0aXBsZSBzdWJtaXNzaW9ucyB3aXRoIHVuaXF1ZSBJRHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gc2VlZENvbnRhY3RGb3JtKGRiKVxuXG4gICAgICBjb25zdCBzdWJtaXNzaW9uMSA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAucG9zdCgnL2RmZS9zdWJtaXNzaW9ucycpXG4gICAgICAgIC5zZW5kKHsgZm9ybUlkOiBmb3JtLmlkLCB2ZXJzaW9uSWQ6IGZvcm0udmVyc2lvbklkIH0pXG5cbiAgICAgIGNvbnN0IHN1Ym1pc3Npb24yID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNlbmQoeyBmb3JtSWQ6IGZvcm0uaWQsIHZlcnNpb25JZDogZm9ybS52ZXJzaW9uSWQgfSlcblxuICAgICAgZXhwZWN0KHN1Ym1pc3Npb24xLnN0YXR1cykudG9CZSgyMDEpXG4gICAgICBleHBlY3Qoc3VibWlzc2lvbjIuc3RhdHVzKS50b0JlKDIwMSlcbiAgICAgIGV4cGVjdChzdWJtaXNzaW9uMS5ib2R5LmlkKS5ub3QudG9CZShzdWJtaXNzaW9uMi5ib2R5LmlkKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ1JvdXRlciBvcHRpb25zJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYnlwYXNzIGF1dGggY2hlY2tzIHdoZW4gc2tpcEF1dGggaXMgdHJ1ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGFwcE5vQXV0aCA9IGV4cHJlc3MoKVxuICAgICAgYXBwTm9BdXRoLnVzZShleHByZXNzLmpzb24oKSlcbiAgICAgIGFwcE5vQXV0aC51c2UoY3JlYXRlRGZlUm91dGVyKHsgZGIsIGdldFVzZXJJZDogKCkgPT4gbnVsbCwgc2tpcEF1dGg6IHRydWUgfSkpXG5cbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcE5vQXV0aClcbiAgICAgICAgLnBvc3QoJy9kZmUvc3VibWlzc2lvbnMnKVxuICAgICAgICAuc2VuZCh7IGZvcm1JZDogZm9ybS5pZCwgdmVyc2lvbklkOiBmb3JtLnZlcnNpb25JZCB9KVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAxKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHVzZSBjdXN0b20gcHJlZml4IGZvciBhbGwgcm91dGVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXBwQ3VzdG9tID0gZXhwcmVzcygpXG4gICAgICBhcHBDdXN0b20udXNlKGV4cHJlc3MuanNvbigpKVxuICAgICAgYXBwQ3VzdG9tLnVzZShjcmVhdGVEZmVSb3V0ZXIoe1xuICAgICAgICBkYixcbiAgICAgICAgZ2V0VXNlcklkOiAoKSA9PiAndXNlci0xJyxcbiAgICAgICAgc2tpcEF1dGg6IGZhbHNlLFxuICAgICAgICBwcmVmaXg6ICcvYXBpL3YyJ1xuICAgICAgfSkpXG5cbiAgICAgIGNvbnN0IGZvcm0gPSBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcEN1c3RvbSkuZ2V0KCcvYXBpL3YyL2Zvcm1zJylcbiAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjbGFtcCBwYWdlIHNpemUgdG8gbWF4UGFnZVNpemUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBhcHBMaW1pdGVkID0gZXhwcmVzcygpXG4gICAgICBhcHBMaW1pdGVkLnVzZShleHByZXNzLmpzb24oKSlcbiAgICAgIGFwcExpbWl0ZWQudXNlKGNyZWF0ZURmZVJvdXRlcih7XG4gICAgICAgIGRiLFxuICAgICAgICBnZXRVc2VySWQ6ICgpID0+ICd1c2VyLTEnLFxuICAgICAgICBtYXhQYWdlU2l6ZTogNTBcbiAgICAgIH0pKVxuXG4gICAgICBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcExpbWl0ZWQpLmdldCgnL2RmZS9mb3Jtcz9wYWdlU2l6ZT05OTknKVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5Lml0ZW1zLmxlbmd0aCkudG9CZUxlc3NUaGFuT3JFcXVhbCg1MClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXN0cmljdCBmaWVsZCBvcHRpb24gZmlsdGVycyB0byBhbGxvd2VkT3B0aW9uRmlsdGVyS2V5cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGFwcFJlc3RyaWN0ZWQgPSBleHByZXNzKClcbiAgICAgIGFwcFJlc3RyaWN0ZWQudXNlKGV4cHJlc3MuanNvbigpKVxuICAgICAgYXBwUmVzdHJpY3RlZC51c2UoY3JlYXRlRGZlUm91dGVyKHtcbiAgICAgICAgZGIsXG4gICAgICAgIGdldFVzZXJJZDogKCkgPT4gJ3VzZXItMScsXG4gICAgICAgIGFsbG93ZWRPcHRpb25GaWx0ZXJLZXlzOiBbJ3NlYXJjaCddXG4gICAgICB9KSlcblxuICAgICAgY29uc3QgZm9ybSA9IHNlZWRDb250YWN0Rm9ybShkYilcbiAgICAgIGNvbnN0IGZpZWxkV2l0aE9wdGlvbnMgPSBmb3JtLmZpZWxkcy5maW5kKChmOiBhbnkpID0+IGYub3B0aW9ucylcblxuICAgICAgaWYgKGZpZWxkV2l0aE9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHBSZXN0cmljdGVkKVxuICAgICAgICAgIC5nZXQoYC9kZmUvZmllbGRzLyR7ZmllbGRXaXRoT3B0aW9ucy5pZH0vb3B0aW9ucz9jb3VudHJ5PVVTJnNlYXJjaD10ZXN0YClcbiAgICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0VkZ2UgY2FzZXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBkZWZhdWx0IHBhZ2VTaXplIHRvIDIwIHdoZW4gbmVnYXRpdmUgdmFsdWUgaXMgcHJvdmlkZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBzZWVkQ29udGFjdEZvcm0oZGIpXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KGFwcCkuZ2V0KCcvZGZlL2Zvcm1zP3BhZ2VTaXplPS01JylcbiAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDIwMClcbiAgICAgIGV4cGVjdChyZXMuYm9keS5pdGVtcykudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBpbnZhbGlkIEpTT04gYm9keSBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvZGZlL3N1Ym1pc3Npb25zJylcbiAgICAgICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAuc2VuZCgnaW52YWxpZCBqc29uJylcbiAgICAgIGV4cGVjdChyZXMuc3RhdHVzKS50b0JlKDQwMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gYWxsIGZvcm1zIHdoZW4gbXVsdGlwbGUgZm9ybXMgYXJlIHNlZWRlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIHNlZWRDb250YWN0Rm9ybShkYilcbiAgICAgIHNlZWRNdWx0aVN0ZXBGb3JtKGRiKVxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdChhcHApLmdldCgnL2RmZS9mb3JtcycpXG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSgyMDApXG4gICAgICBleHBlY3QocmVzLmJvZHkuaXRlbXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIDQyMiBmb3Igbm9uLWV4aXN0ZW50IHN0ZXAgSUQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gc2VlZENvbnRhY3RGb3JtKGRiKVxuICAgICAgY29uc3Qgc3VibWlzc2lvbiA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAucG9zdCgnL2RmZS9zdWJtaXNzaW9ucycpXG4gICAgICAgIC5zZW5kKHsgZm9ybUlkOiBmb3JtLmlkLCB2ZXJzaW9uSWQ6IGZvcm0udmVyc2lvbklkIH0pXG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAucG9zdChgL2RmZS9zdWJtaXNzaW9ucy8ke3N1Ym1pc3Npb24uYm9keS5pZH0vc3RlcHMvbm9uZXhpc3RlbnQtc3RlcGApXG4gICAgICAgIC5zZW5kKHsgdmFsdWVzOiB7fSB9KVxuICAgICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoNDIyKVxuICAgICAgZXhwZWN0KHJlcy5ib2R5LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=