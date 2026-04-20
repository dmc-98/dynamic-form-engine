"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_core_1 = require("@dmc--98/dfe-core");
const zod_1 = require("zod");
const fixtures_1 = require("./helpers/fixtures");
(0, vitest_1.describe)('Validation Pipeline E2E Tests', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, fixtures_1.resetFieldCounter)();
    });
    (0, vitest_1.describe)('SHORT_TEXT field validation', () => {
        (0, vitest_1.it)('should fail validation when required SHORT_TEXT is empty string', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_1', type: 'SHORT_TEXT', required: true });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: '' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should pass validation with valid SHORT_TEXT value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_2', type: 'SHORT_TEXT', required: true });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'valid text' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should enforce minLength constraint', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_3', type: 'SHORT_TEXT', config: { minLength: 3 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const tooShort = schema.safeParse({ [field.key]: 'ab' });
            (0, vitest_1.expect)(tooShort.success).toBe(false);
            const valid = schema.safeParse({ [field.key]: 'abc' });
            (0, vitest_1.expect)(valid.success).toBe(true);
        });
        (0, vitest_1.it)('should enforce maxLength constraint', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_4', type: 'SHORT_TEXT', config: { maxLength: 5 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const tooLong = schema.safeParse({ [field.key]: 'abcdef' });
            (0, vitest_1.expect)(tooLong.success).toBe(false);
            const valid = schema.safeParse({ [field.key]: 'abcd' });
            (0, vitest_1.expect)(valid.success).toBe(true);
        });
        (0, vitest_1.it)('should validate against pattern regex', async () => {
            const field = (0, fixtures_1.makeField)({
                key: 'field_5',
                type: 'SHORT_TEXT',
                config: { pattern: '^[A-Z][a-z]+$' }
            });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const invalid = schema.safeParse({ [field.key]: 'invalid123' });
            (0, vitest_1.expect)(invalid.success).toBe(false);
            const valid = schema.safeParse({ [field.key]: 'Hello' });
            (0, vitest_1.expect)(valid.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('NUMBER field validation', () => {
        (0, vitest_1.it)('should fail when NUMBER is below min value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_6', type: 'NUMBER', config: { min: 0 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: -1 });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should fail when NUMBER is above max value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_7', type: 'NUMBER', config: { max: 100 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 101 });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should pass when NUMBER is within valid range', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_8', type: 'NUMBER', config: { min: 0, max: 100 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 50 });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should enforce integer format when specified', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_9', type: 'NUMBER', config: { format: 'integer' } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const decimal = schema.safeParse({ [field.key]: 3.5 });
            (0, vitest_1.expect)(decimal.success).toBe(false);
            const integer = schema.safeParse({ [field.key]: 3 });
            (0, vitest_1.expect)(integer.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('EMAIL field validation', () => {
        (0, vitest_1.it)('should fail validation with invalid email format', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_10', type: 'EMAIL' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'not-email' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should pass validation with valid email format', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_11', type: 'EMAIL' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'a@b.com' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should pass validation with complex valid email', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_12', type: 'EMAIL' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'user.name+tag@example.co.uk' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('URL field validation', () => {
        (0, vitest_1.it)('should fail validation with invalid URL format', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_13', type: 'URL' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'not-url' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should pass validation with valid HTTPS URL', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_14', type: 'URL' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'https://example.com' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should pass validation with HTTP URL', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_15', type: 'URL' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'http://example.com/path' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('PHONE field validation', () => {
        (0, vitest_1.it)('should pass validation with valid phone number', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_16', type: 'PHONE' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: '+1234567890' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should pass validation with various phone formats', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_17', type: 'PHONE' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const formats = [
                '+1 (555) 123-4567',
                '555-123-4567',
                '5551234567',
                '+441234567890'
            ];
            formats.forEach(phone => {
                const result = schema.safeParse({ [field.key]: phone });
                (0, vitest_1.expect)(result.success).toBe(true);
            });
        });
    });
    (0, vitest_1.describe)('SELECT field validation', () => {
        (0, vitest_1.it)('should fail when selected value is not in static options', async () => {
            const field = (0, fixtures_1.makeField)({
                key: 'field_18',
                type: 'SELECT',
                config: {
                    mode: 'static',
                    options: [
                        { id: 'opt1', label: 'Option A', value: 'a' },
                        { id: 'opt2', label: 'Option B', value: 'b' }
                    ]
                }
            });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'c' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should pass when selected value is in static options', async () => {
            const field = (0, fixtures_1.makeField)({
                key: 'field_19',
                type: 'SELECT',
                config: {
                    mode: 'static',
                    options: [
                        { id: 'opt1', label: 'Option A', value: 'a' },
                        { id: 'opt2', label: 'Option B', value: 'b' }
                    ]
                }
            });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'a' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('MULTI_SELECT field validation', () => {
        (0, vitest_1.it)('should pass with valid selected options', async () => {
            const field = (0, fixtures_1.makeField)({
                key: 'field_20',
                type: 'MULTI_SELECT',
                config: {
                    mode: 'static',
                    options: [
                        { id: 'opt1', label: 'Option A', value: 'a' },
                        { id: 'opt2', label: 'Option B', value: 'b' },
                        { id: 'opt3', label: 'Option C', value: 'c' }
                    ]
                }
            });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: ['a', 'b'] });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail when any selected value is not in options', async () => {
            const field = (0, fixtures_1.makeField)({
                key: 'field_21',
                type: 'MULTI_SELECT',
                config: {
                    mode: 'static',
                    options: [
                        { id: 'opt1', label: 'Option A', value: 'a' },
                        { id: 'opt2', label: 'Option B', value: 'b' }
                    ]
                }
            });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: ['c'] });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('RATING field validation', () => {
        (0, vitest_1.it)('should fail when rating is 0', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_22', type: 'RATING', config: { max: 5 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 0 });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should pass when rating is within valid range', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_23', type: 'RATING', config: { max: 5 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 3 });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail when rating exceeds max value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_24', type: 'RATING', config: { max: 5 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 6 });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('SCALE field validation', () => {
        (0, vitest_1.it)('should fail when scale is below min value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_25', type: 'SCALE', config: { min: 1, max: 10 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 0 });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should pass when scale is within valid range', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_26', type: 'SCALE', config: { min: 1, max: 10 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 5 });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail when scale exceeds max value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_27', type: 'SCALE', config: { min: 1, max: 10 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 11 });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('CHECKBOX field validation', () => {
        (0, vitest_1.it)('should pass validation with boolean true', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_28', type: 'CHECKBOX' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: true });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should pass validation with boolean false', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_29', type: 'CHECKBOX' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: false });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail validation with non-boolean value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_30', type: 'CHECKBOX' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'string' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('FILE_UPLOAD field validation', () => {
        (0, vitest_1.it)('should pass validation with valid file array', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_31', type: 'FILE_UPLOAD', config: { maxSizeMB: 5, maxFiles: 1, allowedMimeTypes: ['application/pdf'] } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const fileData = [{
                    name: 'document.pdf',
                    size: 1000000,
                    type: 'application/pdf',
                    url: 'https://example.com/doc.pdf'
                }];
            const result = schema.safeParse({ [field.key]: fileData });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail validation when file exceeds maxFileSize', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_32', type: 'FILE_UPLOAD', config: { maxSizeMB: 1, maxFiles: 1, allowedMimeTypes: ['application/pdf'] } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const largeFile = [{
                    name: 'large.pdf',
                    size: 5000000,
                    type: 'application/pdf',
                    url: 'https://example.com/large.pdf'
                }];
            const result = schema.safeParse({ [field.key]: largeFile });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('DATE_RANGE field validation', () => {
        (0, vitest_1.it)('should pass with valid date range object', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_33', type: 'DATE_RANGE' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({
                [field.key]: { from: '2024-01-01', to: '2024-01-31' }
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail when from date is missing', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_34', type: 'DATE_RANGE' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({
                [field.key]: { to: '2024-01-31' }
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should fail when to date is missing', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_35', type: 'DATE_RANGE' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({
                [field.key]: { from: '2024-01-01' }
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('ADDRESS field validation', () => {
        (0, vitest_1.it)('should pass with complete address object', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_36', type: 'ADDRESS' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({
                [field.key]: {
                    street: '123 Main St',
                    city: 'Springfield',
                    state: 'IL',
                    zip: '62701',
                    country: 'US'
                }
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should pass with partial address object', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_37', type: 'ADDRESS' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({
                [field.key]: {
                    street: '123 Main St',
                    city: 'Springfield'
                }
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('SIGNATURE field validation', () => {
        (0, vitest_1.it)('should pass with valid data URL signature', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_38', type: 'SIGNATURE' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({
                [field.key]: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail with non-data URL', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_39', type: 'SIGNATURE' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'not-data-url' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('RICH_TEXT field validation', () => {
        (0, vitest_1.it)('should pass with any string value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_40', type: 'RICH_TEXT' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({
                [field.key]: '<h1>Hello</h1><p>World</p>'
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should pass with empty rich text', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_41', type: 'RICH_TEXT' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: '' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('Optional field handling', () => {
        (0, vitest_1.it)('should accept undefined for optional field', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_42', type: 'SHORT_TEXT', required: false });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: undefined });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should accept empty string for optional field', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_43', type: 'SHORT_TEXT', required: false });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: '' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should accept null for optional field', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_44', type: 'SHORT_TEXT', required: false });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: null });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('Schema generation and building', () => {
        (0, vitest_1.it)('should generate step schema from step fields', async () => {
            const form = (0, fixtures_1.createAllFieldTypesForm)();
            const fields = form.fields;
            const schema = (0, dfe_core_1.generateStepZodSchema)(fields);
            (0, vitest_1.expect)(schema).toBeDefined();
            (0, vitest_1.expect)(schema instanceof zod_1.z.ZodSchema).toBe(true);
        });
        (0, vitest_1.it)('should reject unknown keys in strict submission schema', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_45', type: 'SHORT_TEXT' });
            const schema = (0, dfe_core_1.generateStrictSubmissionSchema)([field]);
            const result = schema.safeParse({
                [field.key]: 'valid',
                unknownKey: 'should be rejected'
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should register custom schema builder', async () => {
            const customType = 'CUSTOM_TYPE';
            (0, dfe_core_1.registerSchemaBuilder)(customType, (field) => {
                return zod_1.z.string().startsWith('CUSTOM_');
            });
            const field = (0, fixtures_1.makeField)({ key: 'field_46', type: customType });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const validResult = schema.safeParse({ [field.key]: 'CUSTOM_value' });
            (0, vitest_1.expect)(validResult.success).toBe(true);
            const invalidResult = schema.safeParse({ [field.key]: 'INVALID' });
            (0, vitest_1.expect)(invalidResult.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('Conditional visibility in validation', () => {
        (0, vitest_1.it)('should include all fields in schema regardless of conditions', async () => {
            const form = (0, fixtures_1.createConditionalVisibilityForm)();
            const fields = form.fields;
            const schema = (0, dfe_core_1.generateStepZodSchema)(fields);
            // generateStepZodSchema doesn't handle conditions — all required fields must be provided
            // Provide all required field values
            const result = schema.safeParse({
                role: 'admin',
                admin_code: 'secret123',
                username: 'johndoe',
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail validation when required fields are missing', async () => {
            const form = (0, fixtures_1.createConditionalVisibilityForm)();
            const fields = form.fields;
            const schema = (0, dfe_core_1.generateStepZodSchema)(fields);
            // Omitting required fields should cause validation failure
            const result = schema.safeParse({ role: 'user' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should validate only visible fields when filtered before schema generation', async () => {
            const form = (0, fixtures_1.createConditionalVisibilityForm)();
            // Filter out conditionally hidden fields (simulating runtime behavior)
            const visibleFields = form.fields.filter((f) => !f.conditions);
            const schema = (0, dfe_core_1.generateStepZodSchema)(visibleFields);
            const result = schema.safeParse({ role: 'user', username: 'johndoe' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('Complex validation scenarios', () => {
        (0, vitest_1.it)('should validate form with all field types', async () => {
            const form = (0, fixtures_1.createAllFieldTypesForm)();
            const fields = form.fields;
            const schema = (0, dfe_core_1.generateStepZodSchema)(fields);
            const validData = {};
            fields.forEach((field) => {
                var _a, _b, _c, _d, _e;
                if (field.type === 'SHORT_TEXT') {
                    validData[field.key] = 'valid text';
                }
                else if (field.type === 'NUMBER') {
                    validData[field.key] = 42;
                }
                else if (field.type === 'EMAIL') {
                    validData[field.key] = 'test@example.com';
                }
                else if (field.type === 'CHECKBOX') {
                    validData[field.key] = true;
                }
                else if (field.type === 'SELECT' || field.type === 'RADIO') {
                    validData[field.key] = ((_c = (_b = (_a = field.config) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.value) || 'option';
                }
                else if (field.type === 'MULTI_SELECT') {
                    validData[field.key] = ((_e = (_d = field.config) === null || _d === void 0 ? void 0 : _d.options) === null || _e === void 0 ? void 0 : _e.slice(0, 1).map((o) => o.value)) || [];
                }
                else if (field.type === 'RATING') {
                    validData[field.key] = 3;
                }
                else if (field.type === 'SCALE') {
                    validData[field.key] = 5;
                }
                else if (field.type === 'DATE_RANGE') {
                    validData[field.key] = { from: '2024-01-01', to: '2024-01-31' };
                }
                else if (field.type === 'ADDRESS') {
                    validData[field.key] = { street: '123 St', city: 'City' };
                }
                else if (field.type === 'FILE_UPLOAD') {
                    validData[field.key] = [{ name: 'file.pdf', size: 1000, type: 'application/pdf', url: 'https://example.com/file.pdf' }];
                }
                else if (field.type === 'SIGNATURE') {
                    validData[field.key] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
                }
                else if (field.type === 'PHONE') {
                    validData[field.key] = '+1234567890';
                }
                else if (field.type === 'URL') {
                    validData[field.key] = 'https://example.com';
                }
                else {
                    validData[field.key] = 'default value';
                }
            });
            const result = schema.safeParse(validData);
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should handle nested validation errors with clear messages', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_47', type: 'SHORT_TEXT', config: { minLength: 5 } });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'ab' });
            (0, vitest_1.expect)(result.success).toBe(false);
            if (!result.success) {
                (0, vitest_1.expect)(result.error.issues).toBeDefined();
                (0, vitest_1.expect)(result.error.issues.length).toBeGreaterThan(0);
            }
        });
        (0, vitest_1.it)('should validate partial data with optional fields', async () => {
            const requiredField = (0, fixtures_1.makeField)({ key: 'field_48', type: 'SHORT_TEXT', required: true });
            const optionalField = (0, fixtures_1.makeField)({ key: 'field_49', type: 'SHORT_TEXT', required: false });
            const schema = (0, dfe_core_1.generateZodSchema)([requiredField, optionalField]);
            const result = schema.safeParse({ [requiredField.key]: 'required value' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('Edge cases and special characters', () => {
        (0, vitest_1.it)('should handle SHORT_TEXT with special characters', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_50', type: 'SHORT_TEXT' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const specialChars = '@#$%^&*(){}[]|:;<>?,./~`';
            const result = schema.safeParse({ [field.key]: specialChars });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should handle EMAIL with international characters', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_51', type: 'EMAIL' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'user+tag@example.co.uk' });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should handle very long SHORT_TEXT without maxLength', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_52', type: 'SHORT_TEXT' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const longText = 'a'.repeat(10000);
            const result = schema.safeParse({ [field.key]: longText });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should handle NUMBER with scientific notation', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_53', type: 'NUMBER' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 1e5 });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('Type coercion and validation', () => {
        (0, vitest_1.it)('should fail when NUMBER receives string value', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_54', type: 'NUMBER' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: '123' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should fail when CHECKBOX receives non-boolean', async () => {
            const field = (0, fixtures_1.makeField)({ key: 'field_55', type: 'CHECKBOX' });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 1 });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should fail when MULTI_SELECT receives non-array', async () => {
            const field = (0, fixtures_1.makeField)({
                key: 'field_56',
                type: 'MULTI_SELECT',
                config: {
                    mode: 'static',
                    options: [{ id: 'opt1', label: 'A', value: 'a' }]
                }
            });
            const schema = (0, dfe_core_1.generateZodSchema)([field]);
            const result = schema.safeParse({ [field.key]: 'a' });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi1waXBlbGluZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmFsaWRhdGlvbi1waXBlbGluZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQXlEO0FBQ3pELGtEQUF1SjtBQUN2Siw2QkFBdUI7QUFDdkIsaURBQTJIO0FBRTNILElBQUEsaUJBQVEsRUFBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7SUFDN0MsSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRTtRQUNkLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtJQUNyQixDQUFDLENBQUMsQ0FBQTtJQUVGLElBQUEsaUJBQVEsRUFBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7UUFDM0MsSUFBQSxXQUFFLEVBQUMsaUVBQWlFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0UsTUFBTSxLQUFLLEdBQUcsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1lBQy9FLE1BQU0sTUFBTSxHQUFHLElBQUEsNEJBQWlCLEVBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1lBRXpDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ3BELElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDcEMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxvREFBb0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRSxNQUFNLEtBQUssR0FBRyxJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFF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Q0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ25ELElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDcEMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRSxNQUFNLEtBQUssR0FBRyxJQUFBLG9CQUFTLEVBQUM7Z0JBQ3RCLEdBQUcsRUFBRSxVQUFVO2dCQUNmLElBQUksRUFBRSxjQUFjO2dCQUNwQixNQUFNLEVBQUU7b0JBQ04sSUFBSSxFQUFFLFFBQVE7b0JBQ2QsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDO2lCQUNsRDthQUNGLENBQUMsQ0FBQTtZQUNGLE1BQU0sTUFBTSxHQUFHLElBQUEsNEJBQWlCLEVBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1lBRXpDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFBO1lBQ3JELElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDcEMsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QsIGJlZm9yZUVhY2ggfSBmcm9tICd2aXRlc3QnXG5pbXBvcnQgeyBnZW5lcmF0ZVpvZFNjaGVtYSwgZ2VuZXJhdGVTdGVwWm9kU2NoZW1hLCBnZW5lcmF0ZVN0cmljdFN1Ym1pc3Npb25TY2hlbWEsIHJlZ2lzdGVyU2NoZW1hQnVpbGRlciwgY3JlYXRlRm9ybUVuZ2luZSB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJ1xuaW1wb3J0IHsgbWFrZUZpZWxkLCByZXNldEZpZWxkQ291bnRlciwgY3JlYXRlQWxsRmllbGRUeXBlc0Zvcm0sIGNyZWF0ZUNvbmRpdGlvbmFsVmlzaWJpbGl0eUZvcm0gfSBmcm9tICcuL2hlbHBlcnMvZml4dHVyZXMnXG5cbmRlc2NyaWJlKCdWYWxpZGF0aW9uIFBpcGVsaW5lIEUyRSBUZXN0cycsICgpID0+IHtcbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgcmVzZXRGaWVsZENvdW50ZXIoKVxuICB9KVxuXG4gIGRlc2NyaWJlKCdTSE9SVF9URVhUIGZpZWxkIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBmYWlsIHZhbGlkYXRpb24gd2hlbiByZXF1aXJlZCBTSE9SVF9URVhUIGlzIGVtcHR5IHN0cmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJycgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwYXNzIHZhbGlkYXRpb24gd2l0aCB2YWxpZCBTSE9SVF9URVhUIHZhbHVlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8yJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAndmFsaWQgdGV4dCcgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGVuZm9yY2UgbWluTGVuZ3RoIGNvbnN0cmFpbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzMnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGNvbmZpZzogeyBtaW5MZW5ndGg6IDMgfSB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgdG9vU2hvcnQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICdhYicgfSlcbiAgICAgIGV4cGVjdCh0b29TaG9ydC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuXG4gICAgICBjb25zdCB2YWxpZCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJ2FiYycgfSlcbiAgICAgIGV4cGVjdCh2YWxpZC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZW5mb3JjZSBtYXhMZW5ndGggY29uc3RyYWludCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfNCcsIHR5cGU6ICdTSE9SVF9URVhUJywgY29uZmlnOiB7IG1heExlbmd0aDogNSB9IH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCB0b29Mb25nID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAnYWJjZGVmJyB9KVxuICAgICAgZXhwZWN0KHRvb0xvbmcuc3VjY2VzcykudG9CZShmYWxzZSlcblxuICAgICAgY29uc3QgdmFsaWQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICdhYmNkJyB9KVxuICAgICAgZXhwZWN0KHZhbGlkLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBhZ2FpbnN0IHBhdHRlcm4gcmVnZXgnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2ZpZWxkXzUnLFxuICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgIGNvbmZpZzogeyBwYXR0ZXJuOiAnXltBLVpdW2Etel0rJCcgfVxuICAgICAgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IGludmFsaWQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICdpbnZhbGlkMTIzJyB9KVxuICAgICAgZXhwZWN0KGludmFsaWQuc3VjY2VzcykudG9CZShmYWxzZSlcblxuICAgICAgY29uc3QgdmFsaWQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICdIZWxsbycgfSlcbiAgICAgIGV4cGVjdCh2YWxpZC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnTlVNQkVSIGZpZWxkIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gTlVNQkVSIGlzIGJlbG93IG1pbiB2YWx1ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfNicsIHR5cGU6ICdOVU1CRVInLCBjb25maWc6IHsgbWluOiAwIH0gfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogLTEgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gTlVNQkVSIGlzIGFib3ZlIG1heCB2YWx1ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfNycsIHR5cGU6ICdOVU1CRVInLCBjb25maWc6IHsgbWF4OiAxMDAgfSB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAxMDEgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwYXNzIHdoZW4gTlVNQkVSIGlzIHdpdGhpbiB2YWxpZCByYW5nZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfOCcsIHR5cGU6ICdOVU1CRVInLCBjb25maWc6IHsgbWluOiAwLCBtYXg6IDEwMCB9IH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06IDUwIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBlbmZvcmNlIGludGVnZXIgZm9ybWF0IHdoZW4gc3BlY2lmaWVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF85JywgdHlwZTogJ05VTUJFUicsIGNvbmZpZzogeyBmb3JtYXQ6ICdpbnRlZ2VyJyB9IH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCBkZWNpbWFsID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAzLjUgfSlcbiAgICAgIGV4cGVjdChkZWNpbWFsLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG5cbiAgICAgIGNvbnN0IGludGVnZXIgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06IDMgfSlcbiAgICAgIGV4cGVjdChpbnRlZ2VyLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdFTUFJTCBmaWVsZCB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZmFpbCB2YWxpZGF0aW9uIHdpdGggaW52YWxpZCBlbWFpbCBmb3JtYXQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzEwJywgdHlwZTogJ0VNQUlMJyB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAnbm90LWVtYWlsJyB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHBhc3MgdmFsaWRhdGlvbiB3aXRoIHZhbGlkIGVtYWlsIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMTEnLCB0eXBlOiAnRU1BSUwnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICdhQGIuY29tJyB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcGFzcyB2YWxpZGF0aW9uIHdpdGggY29tcGxleCB2YWxpZCBlbWFpbCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMTInLCB0eXBlOiAnRU1BSUwnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICd1c2VyLm5hbWUrdGFnQGV4YW1wbGUuY28udWsnIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdVUkwgZmllbGQgdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGZhaWwgdmFsaWRhdGlvbiB3aXRoIGludmFsaWQgVVJMIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMTMnLCB0eXBlOiAnVVJMJyB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAnbm90LXVybCcgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwYXNzIHZhbGlkYXRpb24gd2l0aCB2YWxpZCBIVFRQUyBVUkwnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzE0JywgdHlwZTogJ1VSTCcgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJ2h0dHBzOi8vZXhhbXBsZS5jb20nIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwYXNzIHZhbGlkYXRpb24gd2l0aCBIVFRQIFVSTCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMTUnLCB0eXBlOiAnVVJMJyB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAnaHR0cDovL2V4YW1wbGUuY29tL3BhdGgnIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdQSE9ORSBmaWVsZCB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcGFzcyB2YWxpZGF0aW9uIHdpdGggdmFsaWQgcGhvbmUgbnVtYmVyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8xNicsIHR5cGU6ICdQSE9ORScgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJysxMjM0NTY3ODkwJyB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcGFzcyB2YWxpZGF0aW9uIHdpdGggdmFyaW91cyBwaG9uZSBmb3JtYXRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8xNycsIHR5cGU6ICdQSE9ORScgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IGZvcm1hdHMgPSBbXG4gICAgICAgICcrMSAoNTU1KSAxMjMtNDU2NycsXG4gICAgICAgICc1NTUtMTIzLTQ1NjcnLFxuICAgICAgICAnNTU1MTIzNDU2NycsXG4gICAgICAgICcrNDQxMjM0NTY3ODkwJ1xuICAgICAgXVxuXG4gICAgICBmb3JtYXRzLmZvckVhY2gocGhvbmUgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06IHBob25lIH0pXG4gICAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdTRUxFQ1QgZmllbGQgdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBzZWxlY3RlZCB2YWx1ZSBpcyBub3QgaW4gc3RhdGljIG9wdGlvbnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2ZpZWxkXzE4JyxcbiAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgIHsgaWQ6ICdvcHQxJywgbGFiZWw6ICdPcHRpb24gQScsIHZhbHVlOiAnYScgfSxcbiAgICAgICAgICAgIHsgaWQ6ICdvcHQyJywgbGFiZWw6ICdPcHRpb24gQicsIHZhbHVlOiAnYicgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJ2MnIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcGFzcyB3aGVuIHNlbGVjdGVkIHZhbHVlIGlzIGluIHN0YXRpYyBvcHRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdmaWVsZF8xOScsXG4gICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICB7IGlkOiAnb3B0MScsIGxhYmVsOiAnT3B0aW9uIEEnLCB2YWx1ZTogJ2EnIH0sXG4gICAgICAgICAgICB7IGlkOiAnb3B0MicsIGxhYmVsOiAnT3B0aW9uIEInLCB2YWx1ZTogJ2InIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICdhJyB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnTVVMVElfU0VMRUNUIGZpZWxkIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwYXNzIHdpdGggdmFsaWQgc2VsZWN0ZWQgb3B0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnZmllbGRfMjAnLFxuICAgICAgICB0eXBlOiAnTVVMVElfU0VMRUNUJyxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBpZDogJ29wdDEnLCBsYWJlbDogJ09wdGlvbiBBJywgdmFsdWU6ICdhJyB9LFxuICAgICAgICAgICAgeyBpZDogJ29wdDInLCBsYWJlbDogJ09wdGlvbiBCJywgdmFsdWU6ICdiJyB9LFxuICAgICAgICAgICAgeyBpZDogJ29wdDMnLCBsYWJlbDogJ09wdGlvbiBDJywgdmFsdWU6ICdjJyB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiBbJ2EnLCAnYiddIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gYW55IHNlbGVjdGVkIHZhbHVlIGlzIG5vdCBpbiBvcHRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdmaWVsZF8yMScsXG4gICAgICAgIHR5cGU6ICdNVUxUSV9TRUxFQ1QnLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICB7IGlkOiAnb3B0MScsIGxhYmVsOiAnT3B0aW9uIEEnLCB2YWx1ZTogJ2EnIH0sXG4gICAgICAgICAgICB7IGlkOiAnb3B0MicsIGxhYmVsOiAnT3B0aW9uIEInLCB2YWx1ZTogJ2InIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06IFsnYyddIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnUkFUSU5HIGZpZWxkIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gcmF0aW5nIGlzIDAnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzIyJywgdHlwZTogJ1JBVElORycsIGNvbmZpZzogeyBtYXg6IDUgfSB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAwIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcGFzcyB3aGVuIHJhdGluZyBpcyB3aXRoaW4gdmFsaWQgcmFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzIzJywgdHlwZTogJ1JBVElORycsIGNvbmZpZzogeyBtYXg6IDUgfSB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAzIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gcmF0aW5nIGV4Y2VlZHMgbWF4IHZhbHVlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8yNCcsIHR5cGU6ICdSQVRJTkcnLCBjb25maWc6IHsgbWF4OiA1IH0gfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogNiB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ1NDQUxFIGZpZWxkIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gc2NhbGUgaXMgYmVsb3cgbWluIHZhbHVlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8yNScsIHR5cGU6ICdTQ0FMRScsIGNvbmZpZzogeyBtaW46IDEsIG1heDogMTAgfSB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAwIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcGFzcyB3aGVuIHNjYWxlIGlzIHdpdGhpbiB2YWxpZCByYW5nZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMjYnLCB0eXBlOiAnU0NBTEUnLCBjb25maWc6IHsgbWluOiAxLCBtYXg6IDEwIH0gfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogNSB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIHNjYWxlIGV4Y2VlZHMgbWF4IHZhbHVlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8yNycsIHR5cGU6ICdTQ0FMRScsIGNvbmZpZzogeyBtaW46IDEsIG1heDogMTAgfSB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAxMSB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0NIRUNLQk9YIGZpZWxkIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwYXNzIHZhbGlkYXRpb24gd2l0aCBib29sZWFuIHRydWUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzI4JywgdHlwZTogJ0NIRUNLQk9YJyB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiB0cnVlIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwYXNzIHZhbGlkYXRpb24gd2l0aCBib29sZWFuIGZhbHNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8yOScsIHR5cGU6ICdDSEVDS0JPWCcgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogZmFsc2UgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGZhaWwgdmFsaWRhdGlvbiB3aXRoIG5vbi1ib29sZWFuIHZhbHVlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8zMCcsIHR5cGU6ICdDSEVDS0JPWCcgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJ3N0cmluZycgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdGSUxFX1VQTE9BRCBmaWVsZCB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcGFzcyB2YWxpZGF0aW9uIHdpdGggdmFsaWQgZmlsZSBhcnJheScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMzEnLCB0eXBlOiAnRklMRV9VUExPQUQnLCBjb25maWc6IHsgbWF4U2l6ZU1COiA1LCBtYXhGaWxlczogMSwgYWxsb3dlZE1pbWVUeXBlczogWydhcHBsaWNhdGlvbi9wZGYnXSB9IH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCBmaWxlRGF0YSA9IFt7XG4gICAgICAgIG5hbWU6ICdkb2N1bWVudC5wZGYnLFxuICAgICAgICBzaXplOiAxMDAwMDAwLFxuICAgICAgICB0eXBlOiAnYXBwbGljYXRpb24vcGRmJyxcbiAgICAgICAgdXJsOiAnaHR0cHM6Ly9leGFtcGxlLmNvbS9kb2MucGRmJ1xuICAgICAgfV1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiBmaWxlRGF0YSB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmFpbCB2YWxpZGF0aW9uIHdoZW4gZmlsZSBleGNlZWRzIG1heEZpbGVTaXplJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8zMicsIHR5cGU6ICdGSUxFX1VQTE9BRCcsIGNvbmZpZzogeyBtYXhTaXplTUI6IDEsIG1heEZpbGVzOiAxLCBhbGxvd2VkTWltZVR5cGVzOiBbJ2FwcGxpY2F0aW9uL3BkZiddIH0gfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IGxhcmdlRmlsZSA9IFt7XG4gICAgICAgIG5hbWU6ICdsYXJnZS5wZGYnLFxuICAgICAgICBzaXplOiA1MDAwMDAwLFxuICAgICAgICB0eXBlOiAnYXBwbGljYXRpb24vcGRmJyxcbiAgICAgICAgdXJsOiAnaHR0cHM6Ly9leGFtcGxlLmNvbS9sYXJnZS5wZGYnXG4gICAgICB9XVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06IGxhcmdlRmlsZSB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0RBVEVfUkFOR0UgZmllbGQgdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHBhc3Mgd2l0aCB2YWxpZCBkYXRlIHJhbmdlIG9iamVjdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMzMnLCB0eXBlOiAnREFURV9SQU5HRScgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2Uoe1xuICAgICAgICBbZmllbGQua2V5XTogeyBmcm9tOiAnMjAyNC0wMS0wMScsIHRvOiAnMjAyNC0wMS0zMScgfVxuICAgICAgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBmcm9tIGRhdGUgaXMgbWlzc2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMzQnLCB0eXBlOiAnREFURV9SQU5HRScgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2Uoe1xuICAgICAgICBbZmllbGQua2V5XTogeyB0bzogJzIwMjQtMDEtMzEnIH1cbiAgICAgIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIHRvIGRhdGUgaXMgbWlzc2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfMzUnLCB0eXBlOiAnREFURV9SQU5HRScgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2Uoe1xuICAgICAgICBbZmllbGQua2V5XTogeyBmcm9tOiAnMjAyNC0wMS0wMScgfVxuICAgICAgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdBRERSRVNTIGZpZWxkIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwYXNzIHdpdGggY29tcGxldGUgYWRkcmVzcyBvYmplY3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzM2JywgdHlwZTogJ0FERFJFU1MnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHtcbiAgICAgICAgW2ZpZWxkLmtleV06IHtcbiAgICAgICAgICBzdHJlZXQ6ICcxMjMgTWFpbiBTdCcsXG4gICAgICAgICAgY2l0eTogJ1NwcmluZ2ZpZWxkJyxcbiAgICAgICAgICBzdGF0ZTogJ0lMJyxcbiAgICAgICAgICB6aXA6ICc2MjcwMScsXG4gICAgICAgICAgY291bnRyeTogJ1VTJ1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcGFzcyB3aXRoIHBhcnRpYWwgYWRkcmVzcyBvYmplY3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzM3JywgdHlwZTogJ0FERFJFU1MnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHtcbiAgICAgICAgW2ZpZWxkLmtleV06IHtcbiAgICAgICAgICBzdHJlZXQ6ICcxMjMgTWFpbiBTdCcsXG4gICAgICAgICAgY2l0eTogJ1NwcmluZ2ZpZWxkJ1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnU0lHTkFUVVJFIGZpZWxkIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwYXNzIHdpdGggdmFsaWQgZGF0YSBVUkwgc2lnbmF0dXJlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF8zOCcsIHR5cGU6ICdTSUdOQVRVUkUnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHtcbiAgICAgICAgW2ZpZWxkLmtleV06ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJDQVlBQUFBZkZjU0pBQUFBRFVsRVFWUjQybU5rK005UUR3QURoZ0dBV2pSOWF3QUFBQUJKUlU1RXJrSmdnZz09J1xuICAgICAgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGZhaWwgd2l0aCBub24tZGF0YSBVUkwnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzM5JywgdHlwZTogJ1NJR05BVFVSRScgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJ25vdC1kYXRhLXVybCcgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdSSUNIX1RFWFQgZmllbGQgdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHBhc3Mgd2l0aCBhbnkgc3RyaW5nIHZhbHVlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF80MCcsIHR5cGU6ICdSSUNIX1RFWFQnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHtcbiAgICAgICAgW2ZpZWxkLmtleV06ICc8aDE+SGVsbG88L2gxPjxwPldvcmxkPC9wPidcbiAgICAgIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwYXNzIHdpdGggZW1wdHkgcmljaCB0ZXh0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF80MScsIHR5cGU6ICdSSUNIX1RFWFQnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICcnIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdPcHRpb25hbCBmaWVsZCBoYW5kbGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGFjY2VwdCB1bmRlZmluZWQgZm9yIG9wdGlvbmFsIGZpZWxkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF80MicsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IGZhbHNlIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06IHVuZGVmaW5lZCB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgYWNjZXB0IGVtcHR5IHN0cmluZyBmb3Igb3B0aW9uYWwgZmllbGQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzQzJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogZmFsc2UgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJycgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGFjY2VwdCBudWxsIGZvciBvcHRpb25hbCBmaWVsZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfNDQnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiBmYWxzZSB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiBudWxsIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdTY2hlbWEgZ2VuZXJhdGlvbiBhbmQgYnVpbGRpbmcnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBzdGVwIHNjaGVtYSBmcm9tIHN0ZXAgZmllbGRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IGNyZWF0ZUFsbEZpZWxkVHlwZXNGb3JtKClcbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZvcm0uZmllbGRzXG5cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlU3RlcFpvZFNjaGVtYShmaWVsZHMpXG4gICAgICBleHBlY3Qoc2NoZW1hKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3Qoc2NoZW1hIGluc3RhbmNlb2Ygei5ab2RTY2hlbWEpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgdW5rbm93biBrZXlzIGluIHN0cmljdCBzdWJtaXNzaW9uIHNjaGVtYScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfNDUnLCB0eXBlOiAnU0hPUlRfVEVYVCcgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlU3RyaWN0U3VibWlzc2lvblNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHtcbiAgICAgICAgW2ZpZWxkLmtleV06ICd2YWxpZCcsXG4gICAgICAgIHVua25vd25LZXk6ICdzaG91bGQgYmUgcmVqZWN0ZWQnXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVnaXN0ZXIgY3VzdG9tIHNjaGVtYSBidWlsZGVyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY3VzdG9tVHlwZSA9ICdDVVNUT01fVFlQRSdcblxuICAgICAgcmVnaXN0ZXJTY2hlbWFCdWlsZGVyKGN1c3RvbVR5cGUsIChmaWVsZDogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiB6LnN0cmluZygpLnN0YXJ0c1dpdGgoJ0NVU1RPTV8nKVxuICAgICAgfSlcblxuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF80NicsIHR5cGU6IGN1c3RvbVR5cGUgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHZhbGlkUmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAnQ1VTVE9NX3ZhbHVlJyB9KVxuICAgICAgZXhwZWN0KHZhbGlkUmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcblxuICAgICAgY29uc3QgaW52YWxpZFJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJ0lOVkFMSUQnIH0pXG4gICAgICBleHBlY3QoaW52YWxpZFJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0NvbmRpdGlvbmFsIHZpc2liaWxpdHkgaW4gdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgYWxsIGZpZWxkcyBpbiBzY2hlbWEgcmVnYXJkbGVzcyBvZiBjb25kaXRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IGNyZWF0ZUNvbmRpdGlvbmFsVmlzaWJpbGl0eUZvcm0oKVxuICAgICAgY29uc3QgZmllbGRzID0gZm9ybS5maWVsZHNcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlU3RlcFpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIC8vIGdlbmVyYXRlU3RlcFpvZFNjaGVtYSBkb2Vzbid0IGhhbmRsZSBjb25kaXRpb25zIOKAlCBhbGwgcmVxdWlyZWQgZmllbGRzIG11c3QgYmUgcHJvdmlkZWRcbiAgICAgIC8vIFByb3ZpZGUgYWxsIHJlcXVpcmVkIGZpZWxkIHZhbHVlc1xuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7XG4gICAgICAgIHJvbGU6ICdhZG1pbicsXG4gICAgICAgIGFkbWluX2NvZGU6ICdzZWNyZXQxMjMnLFxuICAgICAgICB1c2VybmFtZTogJ2pvaG5kb2UnLFxuICAgICAgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGZhaWwgdmFsaWRhdGlvbiB3aGVuIHJlcXVpcmVkIGZpZWxkcyBhcmUgbWlzc2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBjcmVhdGVDb25kaXRpb25hbFZpc2liaWxpdHlGb3JtKClcbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZvcm0uZmllbGRzXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVN0ZXBab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgICAvLyBPbWl0dGluZyByZXF1aXJlZCBmaWVsZHMgc2hvdWxkIGNhdXNlIHZhbGlkYXRpb24gZmFpbHVyZVxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IHJvbGU6ICd1c2VyJyB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIG9ubHkgdmlzaWJsZSBmaWVsZHMgd2hlbiBmaWx0ZXJlZCBiZWZvcmUgc2NoZW1hIGdlbmVyYXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gY3JlYXRlQ29uZGl0aW9uYWxWaXNpYmlsaXR5Rm9ybSgpXG4gICAgICAvLyBGaWx0ZXIgb3V0IGNvbmRpdGlvbmFsbHkgaGlkZGVuIGZpZWxkcyAoc2ltdWxhdGluZyBydW50aW1lIGJlaGF2aW9yKVxuICAgICAgY29uc3QgdmlzaWJsZUZpZWxkcyA9IGZvcm0uZmllbGRzLmZpbHRlcigoZjogYW55KSA9PiAhZi5jb25kaXRpb25zKVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVTdGVwWm9kU2NoZW1hKHZpc2libGVGaWVsZHMpXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyByb2xlOiAndXNlcicsIHVzZXJuYW1lOiAnam9obmRvZScgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0NvbXBsZXggdmFsaWRhdGlvbiBzY2VuYXJpb3MnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBmb3JtIHdpdGggYWxsIGZpZWxkIHR5cGVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IGNyZWF0ZUFsbEZpZWxkVHlwZXNGb3JtKClcbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZvcm0uZmllbGRzXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVN0ZXBab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgICBjb25zdCB2YWxpZERhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fVxuXG4gICAgICBmaWVsZHMuZm9yRWFjaCgoZmllbGQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ1NIT1JUX1RFWFQnKSB7XG4gICAgICAgICAgdmFsaWREYXRhW2ZpZWxkLmtleV0gPSAndmFsaWQgdGV4dCdcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnTlVNQkVSJykge1xuICAgICAgICAgIHZhbGlkRGF0YVtmaWVsZC5rZXldID0gNDJcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnRU1BSUwnKSB7XG4gICAgICAgICAgdmFsaWREYXRhW2ZpZWxkLmtleV0gPSAndGVzdEBleGFtcGxlLmNvbSdcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnQ0hFQ0tCT1gnKSB7XG4gICAgICAgICAgdmFsaWREYXRhW2ZpZWxkLmtleV0gPSB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ1NFTEVDVCcgfHwgZmllbGQudHlwZSA9PT0gJ1JBRElPJykge1xuICAgICAgICAgIHZhbGlkRGF0YVtmaWVsZC5rZXldID0gZmllbGQuY29uZmlnPy5vcHRpb25zPy5bMF0/LnZhbHVlIHx8ICdvcHRpb24nXG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ01VTFRJX1NFTEVDVCcpIHtcbiAgICAgICAgICB2YWxpZERhdGFbZmllbGQua2V5XSA9IGZpZWxkLmNvbmZpZz8ub3B0aW9ucz8uc2xpY2UoMCwgMSkubWFwKChvOiBhbnkpID0+IG8udmFsdWUpIHx8IFtdXG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ1JBVElORycpIHtcbiAgICAgICAgICB2YWxpZERhdGFbZmllbGQua2V5XSA9IDNcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnU0NBTEUnKSB7XG4gICAgICAgICAgdmFsaWREYXRhW2ZpZWxkLmtleV0gPSA1XG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ0RBVEVfUkFOR0UnKSB7XG4gICAgICAgICAgdmFsaWREYXRhW2ZpZWxkLmtleV0gPSB7IGZyb206ICcyMDI0LTAxLTAxJywgdG86ICcyMDI0LTAxLTMxJyB9XG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ0FERFJFU1MnKSB7XG4gICAgICAgICAgdmFsaWREYXRhW2ZpZWxkLmtleV0gPSB7IHN0cmVldDogJzEyMyBTdCcsIGNpdHk6ICdDaXR5JyB9XG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ0ZJTEVfVVBMT0FEJykge1xuICAgICAgICAgIHZhbGlkRGF0YVtmaWVsZC5rZXldID0gW3sgbmFtZTogJ2ZpbGUucGRmJywgc2l6ZTogMTAwMCwgdHlwZTogJ2FwcGxpY2F0aW9uL3BkZicsIHVybDogJ2h0dHBzOi8vZXhhbXBsZS5jb20vZmlsZS5wZGYnIH1dXG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ1NJR05BVFVSRScpIHtcbiAgICAgICAgICB2YWxpZERhdGFbZmllbGQua2V5XSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJDQVlBQUFBZkZjU0pBQUFBRFVsRVFWUjQybU5rK005UUR3QURoZ0dBV2pSOWF3QUFBQUJKUlU1RXJrSmdnZz09J1xuICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdQSE9ORScpIHtcbiAgICAgICAgICB2YWxpZERhdGFbZmllbGQua2V5XSA9ICcrMTIzNDU2Nzg5MCdcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnVVJMJykge1xuICAgICAgICAgIHZhbGlkRGF0YVtmaWVsZC5rZXldID0gJ2h0dHBzOi8vZXhhbXBsZS5jb20nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsaWREYXRhW2ZpZWxkLmtleV0gPSAnZGVmYXVsdCB2YWx1ZSdcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh2YWxpZERhdGEpXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgbmVzdGVkIHZhbGlkYXRpb24gZXJyb3JzIHdpdGggY2xlYXIgbWVzc2FnZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzQ3JywgdHlwZTogJ1NIT1JUX1RFWFQnLCBjb25maWc6IHsgbWluTGVuZ3RoOiA1IH0gfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJ2FiJyB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuXG4gICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3IuaXNzdWVzKS50b0JlRGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3IuaXNzdWVzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgICB9XG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgcGFydGlhbCBkYXRhIHdpdGggb3B0aW9uYWwgZmllbGRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWlyZWRGaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzQ4JywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSB9KVxuICAgICAgY29uc3Qgb3B0aW9uYWxGaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzQ5JywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogZmFsc2UgfSlcblxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW3JlcXVpcmVkRmllbGQsIG9wdGlvbmFsRmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW3JlcXVpcmVkRmllbGQua2V5XTogJ3JlcXVpcmVkIHZhbHVlJyB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnRWRnZSBjYXNlcyBhbmQgc3BlY2lhbCBjaGFyYWN0ZXJzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIFNIT1JUX1RFWFQgd2l0aCBzcGVjaWFsIGNoYXJhY3RlcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzUwJywgdHlwZTogJ1NIT1JUX1RFWFQnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCBzcGVjaWFsQ2hhcnMgPSAnQCMkJV4mKigpe31bXXw6Ozw+PywuL35gJ1xuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiBzcGVjaWFsQ2hhcnMgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBFTUFJTCB3aXRoIGludGVybmF0aW9uYWwgY2hhcmFjdGVycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfNTEnLCB0eXBlOiAnRU1BSUwnIH0pXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShbZmllbGRdKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgW2ZpZWxkLmtleV06ICd1c2VyK3RhZ0BleGFtcGxlLmNvLnVrJyB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIHZlcnkgbG9uZyBTSE9SVF9URVhUIHdpdGhvdXQgbWF4TGVuZ3RoJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSBtYWtlRmllbGQoeyBrZXk6ICdmaWVsZF81MicsIHR5cGU6ICdTSE9SVF9URVhUJyB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgbG9uZ1RleHQgPSAnYScucmVwZWF0KDEwMDAwKVxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiBsb25nVGV4dCB9KVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIE5VTUJFUiB3aXRoIHNjaWVudGlmaWMgbm90YXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzUzJywgdHlwZTogJ05VTUJFUicgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogMWU1IH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdUeXBlIGNvZXJjaW9uIGFuZCB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIE5VTUJFUiByZWNlaXZlcyBzdHJpbmcgdmFsdWUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzU0JywgdHlwZTogJ05VTUJFUicgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJzEyMycgfSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gQ0hFQ0tCT1ggcmVjZWl2ZXMgbm9uLWJvb2xlYW4nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7IGtleTogJ2ZpZWxkXzU1JywgdHlwZTogJ0NIRUNLQk9YJyB9KVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoW2ZpZWxkXSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh7IFtmaWVsZC5rZXldOiAxIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIE1VTFRJX1NFTEVDVCByZWNlaXZlcyBub24tYXJyYXknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZCA9IG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2ZpZWxkXzU2JyxcbiAgICAgICAgdHlwZTogJ01VTFRJX1NFTEVDVCcsXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgIG9wdGlvbnM6IFt7IGlkOiAnb3B0MScsIGxhYmVsOiAnQScsIHZhbHVlOiAnYScgfV1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKFtmaWVsZF0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBbZmllbGQua2V5XTogJ2EnIH0pXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=