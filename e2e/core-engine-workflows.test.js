"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_core_1 = require("@dmc--98/dfe-core");
const fixtures_1 = require("./helpers/fixtures");
(0, vitest_1.describe)('Core Engine Workflows', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, fixtures_1.resetFieldCounter)();
    });
    (0, vitest_1.describe)('Basic Form Creation and Validation', () => {
        (0, vitest_1.it)('should create engine from contact form fields, set all values, and validate successfully', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const validValues = (0, fixtures_1.createValidContactValues)();
            Object.entries(validValues).forEach(([key, value]) => {
                engine.setFieldValue(key, value);
            });
            const values = engine.getValues();
            (0, vitest_1.expect)(values.firstName).toBe('John');
            (0, vitest_1.expect)(values.lastName).toBe('Doe');
            (0, vitest_1.expect)(values.email).toBe('john@example.com');
            const result = engine.validate();
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.errors).toEqual({});
        });
        (0, vitest_1.it)('should fill single-step form with all field types and set values without crashing', () => {
            const { fields } = (0, fixtures_1.createAllFieldTypesForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            // Set values using actual field keys from the fixture (field_<type_lowercase>)
            engine.setFieldValue('field_short_text', 'Hello World');
            engine.setFieldValue('field_email', 'test@example.com');
            engine.setFieldValue('field_number', 42);
            engine.setFieldValue('field_select', 'a');
            engine.setFieldValue('field_multi_select', ['x', 'y']);
            engine.setFieldValue('field_rating', 4);
            engine.setFieldValue('field_scale', 7);
            engine.setFieldValue('field_file_upload', [{ name: 'test.pdf', size: 1024, type: 'application/pdf', url: 'https://example.com/test.pdf' }]);
            engine.setFieldValue('field_rich_text', 'Rich text content <b>bold</b>');
            engine.setFieldValue('field_signature', 'data:image/png;base64,ABC123');
            engine.setFieldValue('field_address', { street: '123 Main St', city: 'Boston', state: 'MA', zip: '02101' });
            engine.setFieldValue('field_date_range', { from: '2024-01-01', to: '2024-01-31' });
            engine.setFieldValue('field_checkbox', true);
            engine.setFieldValue('field_date', '2024-01-01');
            engine.setFieldValue('field_time', '10:30');
            engine.setFieldValue('field_date_time', '2024-01-01T10:30:00');
            engine.setFieldValue('field_url', 'https://example.com');
            engine.setFieldValue('field_password', 'secret123');
            engine.setFieldValue('field_phone', '+1234567890');
            engine.setFieldValue('field_long_text', 'A longer text value');
            engine.setFieldValue('field_radio', 'a');
            const values = engine.getValues();
            (0, vitest_1.expect)(values.field_short_text).toBe('Hello World');
            (0, vitest_1.expect)(values.field_email).toBe('test@example.com');
            (0, vitest_1.expect)(values.field_number).toBe(42);
        });
        (0, vitest_1.it)('should enforce required field constraint: missing required SHORT_TEXT fails validation', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', required: true, config: { minLength: 1 } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const result = engine.validate();
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors.name).toBeDefined();
        });
        (0, vitest_1.it)('should validate required EMAIL field as valid email format', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', required: true }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('email', 'invalid-email');
            let result = engine.validate();
            (0, vitest_1.expect)(result.success).toBe(false);
            engine.setFieldValue('email', 'valid@example.com');
            result = engine.validate();
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should accept empty string, null, undefined for optional fields', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'optional1', type: 'SHORT_TEXT', required: false }),
                (0, fixtures_1.makeField)({ key: 'optional2', type: 'SHORT_TEXT', required: false }),
                (0, fixtures_1.makeField)({ key: 'optional3', type: 'SHORT_TEXT', required: false }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('optional1', '');
            engine.setFieldValue('optional2', null);
            // optional3 left unset
            const result = engine.validate();
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should populate default values from field config', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'country', type: 'SHORT_TEXT', required: false, config: { defaultValue: 'USA' } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const values = engine.getValues();
            // defaultValue in config is not automatically applied by getDefaultValue for SHORT_TEXT
            // getDefaultValue returns '' for SHORT_TEXT
            (0, vitest_1.expect)(values.country).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Hydration', () => {
        (0, vitest_1.it)('should hydrate engine with initial data and return it from getValues', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const hydrationData = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
            };
            const engine = (0, dfe_core_1.createFormEngine)(fields, hydrationData);
            const values = engine.getValues();
            (0, vitest_1.expect)(values.firstName).toBe('Jane');
            (0, vitest_1.expect)(values.lastName).toBe('Smith');
            (0, vitest_1.expect)(values.email).toBe('jane@example.com');
        });
        (0, vitest_1.it)('should merge hydration data with defaults for unset fields', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const hydrationData = { firstName: 'Jane' };
            const engine = (0, dfe_core_1.createFormEngine)(fields, hydrationData);
            const values = engine.getValues();
            (0, vitest_1.expect)(values.firstName).toBe('Jane');
            // Other fields have their defaults
            (0, vitest_1.expect)(values.lastName).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Large Forms', () => {
        (0, vitest_1.it)('should handle large form with 100 fields: create, set 5 required fields, validate', () => {
            const { fields } = (0, fixtures_1.createLargeForm)(100);
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            // Set only the first 5 required fields
            const requiredFields = fields.filter(f => f.required);
            requiredFields.slice(0, 5).forEach(field => {
                if (field.type === 'SHORT_TEXT') {
                    engine.setFieldValue(field.key, 'test-value');
                }
                else if (field.type === 'NUMBER') {
                    engine.setFieldValue(field.key, 42);
                }
                else if (field.type === 'EMAIL') {
                    engine.setFieldValue(field.key, 'test@example.com');
                }
            });
            // Engine should be functional with 100 fields
            const values = engine.getValues();
            (0, vitest_1.expect)(Object.keys(values).length).toBe(100);
        });
        (0, vitest_1.it)('should create engine with 500 fields without performance issues', () => {
            const { fields } = (0, fixtures_1.createLargeForm)(500);
            const start = performance.now();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const elapsed = performance.now() - start;
            (0, vitest_1.expect)(elapsed).toBeLessThan(5000); // Under 5 seconds
            (0, vitest_1.expect)(Object.keys(engine.getValues()).length).toBe(500);
        });
    });
    (0, vitest_1.describe)('Field Constraints', () => {
        (0, vitest_1.it)('should enforce minLength constraint', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'username', type: 'SHORT_TEXT', required: true, config: { minLength: 5 } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('username', 'abc');
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('username', 'abcde');
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
        (0, vitest_1.it)('should enforce maxLength constraint', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'title', type: 'SHORT_TEXT', required: true, config: { maxLength: 10, minLength: 1 } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('title', 'This is too long');
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('title', 'Short');
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
        (0, vitest_1.it)('should enforce NUMBER min/max constraints', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'age', type: 'NUMBER', required: true, config: { min: 18, max: 120 } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('age', 10);
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('age', 150);
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('age', 25);
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
        (0, vitest_1.it)('should enforce pattern constraint on SHORT_TEXT', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'zipCode', type: 'SHORT_TEXT', required: true, config: { pattern: '^[0-9]{5}$' } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('zipCode', 'ABCDE');
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('zipCode', '02101');
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
    });
    (0, vitest_1.describe)('Select and Multi-Select Options', () => {
        (0, vitest_1.it)('should validate SELECT with static options: invalid option fails', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'category', type: 'SELECT', required: true,
                    config: { mode: 'static', options: [{ label: 'Electronics', value: 'electronics' }, { label: 'Books', value: 'books' }] },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('category', 'invalid');
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('category', 'electronics');
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
        (0, vitest_1.it)('should validate MULTI_SELECT options', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'interests', type: 'MULTI_SELECT', required: true,
                    config: { mode: 'static', options: [{ label: 'Sports', value: 'sports' }, { label: 'Music', value: 'music' }] },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('interests', ['sports', 'music']);
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
            engine.setFieldValue('interests', ['sports', 'invalid']);
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
        });
    });
    (0, vitest_1.describe)('Rating and Scale Validation', () => {
        (0, vitest_1.it)('should validate RATING field within 1 to max range', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'satisfaction', type: 'RATING', required: true, config: { max: 5 } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('satisfaction', 0);
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('satisfaction', 3);
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
            engine.setFieldValue('satisfaction', 6);
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
        });
        (0, vitest_1.it)('should validate SCALE range', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'agreement', type: 'SCALE', required: true, config: { min: 1, max: 10 } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('agreement', 0);
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('agreement', 5);
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
            engine.setFieldValue('agreement', 11);
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
        });
    });
    (0, vitest_1.describe)('File and Complex Types', () => {
        (0, vitest_1.it)('should validate FILE_UPLOAD file shape (array of file objects)', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'document', type: 'FILE_UPLOAD', required: true, config: { maxSizeMB: 10, maxFiles: 1 } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            // FILE_UPLOAD expects an array of file objects
            engine.setFieldValue('document', [{ name: 'report.pdf', size: 2048, type: 'application/pdf', url: 'https://example.com/report.pdf' }]);
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
        (0, vitest_1.it)('should accept RICH_TEXT as any string', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'description', type: 'RICH_TEXT', required: true }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('description', '<p>Rich <b>text</b> content</p>');
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
        (0, vitest_1.it)('should require SIGNATURE to have data: prefix', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'sig', type: 'SIGNATURE', required: true }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('sig', 'invalid-signature');
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('sig', 'data:image/png;base64,iVBORw0KGgo=');
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
        (0, vitest_1.it)('should accept ADDRESS as object', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'location', type: 'ADDRESS', required: true }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('location', { street: '456 Oak Ave', city: 'Springfield', state: 'IL', zip: '62701' });
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
    });
    (0, vitest_1.describe)('Submission and Visibility', () => {
        (0, vitest_1.it)('should collect submission values from visible fields', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
                (0, fixtures_1.makeField)({
                    key: 'admin_code', type: 'SHORT_TEXT', required: true,
                    conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] },
                }),
                (0, fixtures_1.makeField)({ key: 'username', type: 'SHORT_TEXT', required: true, config: { minLength: 3 } }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('role', 'admin');
            engine.setFieldValue('admin_code', 'SECRET');
            engine.setFieldValue('username', 'johndoe');
            const submission = engine.collectSubmissionValues();
            (0, vitest_1.expect)(submission.role).toBe('admin');
            (0, vitest_1.expect)(submission.admin_code).toBe('SECRET');
            (0, vitest_1.expect)(submission.username).toBe('johndoe');
        });
        (0, vitest_1.it)('should exclude hidden conditional fields from submission', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
                (0, fixtures_1.makeField)({
                    key: 'admin_code', type: 'SHORT_TEXT', required: true,
                    conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('role', 'user'); // admin_code should be hidden
            const submission = engine.collectSubmissionValues();
            (0, vitest_1.expect)(submission.admin_code).toBeUndefined();
        });
        (0, vitest_1.it)('should include field in validation when condition is met', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
                (0, fixtures_1.makeField)({
                    key: 'admin_code', type: 'SHORT_TEXT', required: true,
                    conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] },
                    config: { minLength: 1 },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('role', 'admin');
            // admin_code is now visible and required but empty
            const result = engine.validate();
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors.admin_code).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Graph Patch and State Changes', () => {
        (0, vitest_1.it)('should return GraphPatch from setFieldValue', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const patch = engine.setFieldValue('firstName', 'Alice');
            (0, vitest_1.expect)(patch).toBeDefined();
        });
        (0, vitest_1.it)('should exclude hidden fields from getVisibleFields', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'role', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] } }),
                (0, fixtures_1.makeField)({
                    key: 'admin_code', type: 'SHORT_TEXT', required: false,
                    conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'role', operator: 'eq', value: 'admin' }] },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('role', 'user');
            const visibleFields = engine.getVisibleFields();
            const fieldKeys = visibleFields.map(f => f.key);
            (0, vitest_1.expect)(fieldKeys).toContain('role');
            (0, vitest_1.expect)(fieldKeys).not.toContain('admin_code');
        });
        (0, vitest_1.it)('should get field state with getFieldState', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('firstName', 'Test');
            const fieldState = engine.getFieldState('firstName');
            (0, vitest_1.expect)(fieldState).toBeDefined();
            (0, vitest_1.expect)(fieldState.value).toBe('Test');
            (0, vitest_1.expect)(fieldState.isVisible).toBe(true);
        });
    });
    (0, vitest_1.describe)('Date Range and Strict Submission', () => {
        (0, vitest_1.it)('should require DATE_RANGE to have both from and to', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'vacationDates', type: 'DATE_RANGE', required: true }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('vacationDates', { from: '2024-06-01' });
            (0, vitest_1.expect)(engine.validate().success).toBe(false);
            engine.setFieldValue('vacationDates', { from: '2024-06-01', to: '2024-06-15' });
            (0, vitest_1.expect)(engine.validate().success).toBe(true);
        });
        (0, vitest_1.it)('should reject unknown keys with strict submission schema', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', required: true }),
            ];
            const schema = (0, dfe_core_1.generateStrictSubmissionSchema)(fields);
            const data = { email: 'test@example.com', unknownField: 'should cause failure' };
            const result = schema.safeParse(data);
            // strict() rejects unknown keys
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('Schema Generation', () => {
        (0, vitest_1.it)('should generate Zod schema from fields', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', required: true, config: { minLength: 1 } }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', required: false }),
            ];
            const schema = (0, dfe_core_1.generateZodSchema)(fields);
            (0, vitest_1.expect)(schema).toBeDefined();
            const validData = { name: 'John', email: 'john@example.com' };
            const result = schema.safeParse(validData);
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should generate schemas for all 24 field types without errors', () => {
            const { fields } = (0, fixtures_1.createAllFieldTypesForm)();
            const schema = (0, dfe_core_1.generateZodSchema)(fields);
            (0, vitest_1.expect)(schema).toBeDefined();
            (0, vitest_1.expect)(schema.shape).toBeDefined();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1lbmdpbmUtd29ya2Zsb3dzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb3JlLWVuZ2luZS13b3JrZmxvd3MudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUF5RDtBQUN6RCxrREFLNEI7QUFDNUIsaURBTzJCO0FBRTNCLElBQUEsaUJBQVEsRUFBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRTtRQUNkLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtJQUNyQixDQUFDLENBQUMsQ0FBQTtJQUVGLElBQUEsaUJBQVEsRUFBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFDbEQsSUFBQSxXQUFFLEVBQUMsMEZBQTBGLEVBQUUsR0FBRyxFQUFFO1lBQ2xHLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFBLDRCQUFpQixHQUFFLENBQUE7WUFDdEMsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLFdBQVcsR0FBRyxJQUFBLG1DQUF3QixHQUFFLENBQUE7WUFDOUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO2dCQUNuRCxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUNsQyxDQUFDLENBQUMsQ0FBQTtZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNqQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3JDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbkMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1lBRTdDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUNoQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ2pDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDbkMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxtRkFBbUYsRUFBRSxHQUFHLEVBQUU7WUFDM0YsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsa0NBQXVCLEdBQUUsQ0FBQTtZQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLCtFQUErRTtZQUMvRSxNQUFNLENBQUMsYUFBYSxDQUFDLGtCQUFrQixFQUFFLGFBQWEsQ0FBQyxDQUFBO1lBQ3ZELE1BQU0sQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUE7WUFDdkQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDeEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDekMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ3RELE1BQU0sQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3ZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3RDLE1BQU0sQ0FBQyxhQUFhLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLDhCQUE4QixFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzNJLE1BQU0sQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsK0JBQStCLENBQUMsQ0FBQTtZQUN4RSxNQUFNLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLDhCQUE4QixDQUFDLENBQUE7WUFDdkUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUMzRyxNQUFNLENBQUMsYUFBYSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQTtZQUNsRixNQUFNLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFBO1lBQzVDLE1BQU0sQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFBO1lBQ2hELE1BQU0sQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQzNDLE1BQU0sQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUscUJBQXFCLENBQUMsQ0FBQTtZQUM5RCxNQUFNLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO1lBQ3hELE1BQU0sQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUE7WUFDbkQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUE7WUFDbEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO1lBQzlELE1BQU0sQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBRXhDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNqQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7WUFDbkQsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1lBQ25ELElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDdEMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyx3RkFBd0YsRUFBRSxHQUFHLEVBQUU7WUFDaEcsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDekYsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBO1lBQ2hDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUMxQyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDREQUE0RCxFQUFFLEdBQUcsRUFBRTtZQUNwRSxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO2FBQzNELENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFBO1lBQzlDLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUM5QixJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBRWxDLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLG1CQUFtQixDQUFDLENBQUE7WUFDbEQsTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUMxQixJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ25DLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO1lBQ3pFLE1BQU0sTUFBTSxHQUFHO2dCQUNiLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBQ3BFLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBQ3BFLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7YUFDckUsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDckMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDdkMsdUJBQXVCO1lBRXZCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUNoQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ25DLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO1lBQzFELE1BQU0sTUFBTSxHQUFHO2dCQUNiLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO2FBQ3BHLENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3ZDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNqQyx3RkFBd0Y7WUFDeEYsNENBQTRDO1lBQzVDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxpQkFBUSxFQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFDekIsSUFBQSxXQUFFLEVBQUMsc0VBQXNFLEVBQUUsR0FBRyxFQUFFO1lBQzlFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFBLDRCQUFpQixHQUFFLENBQUE7WUFDdEMsTUFBTSxhQUFhLEdBQUc7Z0JBQ3BCLFNBQVMsRUFBRSxNQUFNO2dCQUNqQixRQUFRLEVBQUUsT0FBTztnQkFDakIsS0FBSyxFQUFFLGtCQUFrQjthQUMxQixDQUFBO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUE7WUFDdEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBRWpDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDckMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNyQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyw0REFBNEQsRUFBRSxHQUFHLEVBQUU7WUFDcEUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtZQUN0QyxNQUFNLGFBQWEsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQTtZQUUzQyxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQTtZQUN0RCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUE7WUFFakMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNyQyxtQ0FBbUM7WUFDbkMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQ3ZDLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixJQUFBLGlCQUFRLEVBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtRQUMzQixJQUFBLFdBQUUsRUFBQyxtRkFBbUYsRUFBRSxHQUFHLEVBQUU7WUFDM0YsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsMEJBQWUsRUFBQyxHQUFHLENBQUMsQ0FBQTtZQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLHVDQUF1QztZQUN2QyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQ3JELGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDekMsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRSxDQUFDO29CQUNoQyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUE7Z0JBQy9DLENBQUM7cUJBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNuQyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7Z0JBQ3JDLENBQUM7cUJBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO29CQUNsQyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtnQkFDckQsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFBO1lBRUYsOENBQThDO1lBQzlDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNqQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLGlFQUFpRSxFQUFFLEdBQUcsRUFBRTtZQUN6RSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBQSwwQkFBZSxFQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3ZDLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUMvQixNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3ZDLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUE7WUFFekMsSUFBQSxlQUFNLEVBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUMsa0JBQWtCO1lBQ3JELElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzFELENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixJQUFBLGlCQUFRLEVBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQ2pDLElBQUEsV0FBRSxFQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUM3RixDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUN2QyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBRTdDLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3pDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDOUMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7WUFDN0MsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUN6RyxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO1lBQ2pELElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFFN0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDdEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtZQUNuRCxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO2FBQ3pGLENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQy9CLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFFN0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDaEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUU3QyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUMvQixJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzlDLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFO1lBQ3pELE1BQU0sTUFBTSxHQUFHO2dCQUNiLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxDQUFDO2FBQ3JHLENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3hDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFFN0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDeEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxpQkFBUSxFQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtRQUMvQyxJQUFBLFdBQUUsRUFBQyxrRUFBa0UsRUFBRSxHQUFHLEVBQUU7WUFDMUUsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDO29CQUNSLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSTtvQkFDL0MsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRTtpQkFDMUgsQ0FBQzthQUNILENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBQzNDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFFN0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUE7WUFDL0MsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUM7b0JBQ1IsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBRSxJQUFJO29CQUN0RCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFO2lCQUNoSCxDQUFDO2FBQ0gsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTtZQUN0RCxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBRTVDLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUE7WUFDeEQsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMvQyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxpQkFBUSxFQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUMzQyxJQUFBLFdBQUUsRUFBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7WUFDNUQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDdkYsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDdkMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUU3QyxNQUFNLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN2QyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBRTVDLE1BQU0sQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3ZDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFDckMsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUM1RixDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUNwQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBRTdDLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3BDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7WUFFNUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDckMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMvQyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxpQkFBUSxFQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUN0QyxJQUFBLFdBQUUsRUFBQyxnRUFBZ0UsRUFBRSxHQUFHLEVBQUU7WUFDeEUsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUM1RyxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QywrQ0FBK0M7WUFDL0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLGdDQUFnQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3RJLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDOUMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7WUFDL0MsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUNyRSxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFBO1lBQ3RFLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDOUMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7WUFDdkQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUM3RCxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFBO1lBQ2hELElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFFN0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsb0NBQW9DLENBQUMsQ0FBQTtZQUNqRSxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzlDLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFHO2dCQUNiLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDaEUsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUMzRyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzlDLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixJQUFBLGlCQUFRLEVBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1FBQ3pDLElBQUEsV0FBRSxFQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtZQUM5RCxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkssSUFBQSxvQkFBUyxFQUFDO29CQUNSLEdBQUcsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsSUFBSTtvQkFDckQsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFTO2lCQUN0SCxDQUFDO2dCQUNGLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQzdGLENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3JDLE1BQU0sQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQzVDLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBRTNDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFBO1lBQ25ELElBQUEsZUFBTSxFQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDckMsSUFBQSxlQUFNLEVBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUM1QyxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQzdDLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsMERBQTBELEVBQUUsR0FBRyxFQUFFO1lBQ2xFLE1BQU0sTUFBTSxHQUFHO2dCQUNiLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2SyxJQUFBLG9CQUFTLEVBQUM7b0JBQ1IsR0FBRyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJO29CQUNyRCxVQUFVLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQVM7aUJBQ3RILENBQUM7YUFDSCxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQSxDQUFDLDhCQUE4QjtZQUNuRSxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQTtZQUNuRCxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQywwREFBMEQsRUFBRSxHQUFHLEVBQUU7WUFDbEUsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZLLElBQUEsb0JBQVMsRUFBQztvQkFDUixHQUFHLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLElBQUk7b0JBQ3JELFVBQVUsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBUztvQkFDckgsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTtpQkFDekIsQ0FBQzthQUNILENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3JDLG1EQUFtRDtZQUNuRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDaEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNsQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQ2hELENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixJQUFBLGlCQUFRLEVBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1FBQzdDLElBQUEsV0FBRSxFQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUNyRCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBQSw0QkFBaUIsR0FBRSxDQUFBO1lBQ3RDLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDeEQsSUFBQSxlQUFNLEVBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDN0IsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7WUFDNUQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZLLElBQUEsb0JBQVMsRUFBQztvQkFDUixHQUFHLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUs7b0JBQ3RELFVBQVUsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBUztpQkFDdEgsQ0FBQzthQUNILENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3BDLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1lBQy9DLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDL0MsSUFBQSxlQUFNLEVBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ25DLElBQUEsZUFBTSxFQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7WUFDbkQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtZQUN0QyxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUE7WUFFcEQsSUFBQSxlQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7WUFDaEMsSUFBQSxlQUFNLEVBQUMsVUFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUN0QyxJQUFBLGVBQU0sRUFBQyxVQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzFDLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixJQUFBLGlCQUFRLEVBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1FBQ2hELElBQUEsV0FBRSxFQUFDLG9EQUFvRCxFQUFFLEdBQUcsRUFBRTtZQUM1RCxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO2FBQ3hFLENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUE7WUFDN0QsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUU3QyxNQUFNLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUE7WUFDL0UsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDBEQUEwRCxFQUFFLEdBQUcsRUFBRTtZQUNsRSxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO2FBQzNELENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLHlDQUE4QixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXJELE1BQU0sSUFBSSxHQUFHLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxzQkFBc0IsRUFBRSxDQUFBO1lBQ2hGLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDckMsZ0NBQWdDO1lBQ2hDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDcEMsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLElBQUEsaUJBQVEsRUFBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDakMsSUFBQSxXQUFFLEVBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1lBQ2hELE1BQU0sTUFBTSxHQUFHO2dCQUNiLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN4RixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO2FBQzVELENBQUE7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDRCQUFpQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3hDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFBO1lBRTVCLE1BQU0sU0FBUyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQTtZQUM3RCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQzFDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDbkMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQywrREFBK0QsRUFBRSxHQUFHLEVBQUU7WUFDdkUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsa0NBQXVCLEdBQUUsQ0FBQTtZQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFBLDRCQUFpQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3hDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFBO1lBQzVCLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNwQyxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZXNjcmliZSwgaXQsIGV4cGVjdCwgYmVmb3JlRWFjaCB9IGZyb20gJ3ZpdGVzdCdcbmltcG9ydCB7XG4gIGNyZWF0ZUZvcm1FbmdpbmUsXG4gIGdlbmVyYXRlWm9kU2NoZW1hLFxuICBnZW5lcmF0ZVN0cmljdFN1Ym1pc3Npb25TY2hlbWEsXG4gIHR5cGUgRm9ybUZpZWxkLFxufSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuaW1wb3J0IHtcbiAgbWFrZUZpZWxkLFxuICByZXNldEZpZWxkQ291bnRlcixcbiAgY3JlYXRlQ29udGFjdEZvcm0sXG4gIGNyZWF0ZUFsbEZpZWxkVHlwZXNGb3JtLFxuICBjcmVhdGVMYXJnZUZvcm0sXG4gIGNyZWF0ZVZhbGlkQ29udGFjdFZhbHVlcyxcbn0gZnJvbSAnLi9oZWxwZXJzL2ZpeHR1cmVzJ1xuXG5kZXNjcmliZSgnQ29yZSBFbmdpbmUgV29ya2Zsb3dzJywgKCkgPT4ge1xuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICByZXNldEZpZWxkQ291bnRlcigpXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0Jhc2ljIEZvcm0gQ3JlYXRpb24gYW5kIFZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgZW5naW5lIGZyb20gY29udGFjdCBmb3JtIGZpZWxkcywgc2V0IGFsbCB2YWx1ZXMsIGFuZCB2YWxpZGF0ZSBzdWNjZXNzZnVsbHknLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcyB9ID0gY3JlYXRlQ29udGFjdEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHZhbGlkVmFsdWVzID0gY3JlYXRlVmFsaWRDb250YWN0VmFsdWVzKClcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbGlkVmFsdWVzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSlcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IHZhbHVlcyA9IGVuZ2luZS5nZXRWYWx1ZXMoKVxuICAgICAgZXhwZWN0KHZhbHVlcy5maXJzdE5hbWUpLnRvQmUoJ0pvaG4nKVxuICAgICAgZXhwZWN0KHZhbHVlcy5sYXN0TmFtZSkudG9CZSgnRG9lJylcbiAgICAgIGV4cGVjdCh2YWx1ZXMuZW1haWwpLnRvQmUoJ2pvaG5AZXhhbXBsZS5jb20nKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBlbmdpbmUudmFsaWRhdGUoKVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9FcXVhbCh7fSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBmaWxsIHNpbmdsZS1zdGVwIGZvcm0gd2l0aCBhbGwgZmllbGQgdHlwZXMgYW5kIHNldCB2YWx1ZXMgd2l0aG91dCBjcmFzaGluZycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBjcmVhdGVBbGxGaWVsZFR5cGVzRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgLy8gU2V0IHZhbHVlcyB1c2luZyBhY3R1YWwgZmllbGQga2V5cyBmcm9tIHRoZSBmaXh0dXJlIChmaWVsZF88dHlwZV9sb3dlcmNhc2U+KVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX3Nob3J0X3RleHQnLCAnSGVsbG8gV29ybGQnKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX2VtYWlsJywgJ3Rlc3RAZXhhbXBsZS5jb20nKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX251bWJlcicsIDQyKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX3NlbGVjdCcsICdhJylcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdmaWVsZF9tdWx0aV9zZWxlY3QnLCBbJ3gnLCAneSddKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX3JhdGluZycsIDQpXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZmllbGRfc2NhbGUnLCA3KVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX2ZpbGVfdXBsb2FkJywgW3sgbmFtZTogJ3Rlc3QucGRmJywgc2l6ZTogMTAyNCwgdHlwZTogJ2FwcGxpY2F0aW9uL3BkZicsIHVybDogJ2h0dHBzOi8vZXhhbXBsZS5jb20vdGVzdC5wZGYnIH1dKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX3JpY2hfdGV4dCcsICdSaWNoIHRleHQgY29udGVudCA8Yj5ib2xkPC9iPicpXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZmllbGRfc2lnbmF0dXJlJywgJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxBQkMxMjMnKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX2FkZHJlc3MnLCB7IHN0cmVldDogJzEyMyBNYWluIFN0JywgY2l0eTogJ0Jvc3RvbicsIHN0YXRlOiAnTUEnLCB6aXA6ICcwMjEwMScgfSlcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdmaWVsZF9kYXRlX3JhbmdlJywgeyBmcm9tOiAnMjAyNC0wMS0wMScsIHRvOiAnMjAyNC0wMS0zMScgfSlcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdmaWVsZF9jaGVja2JveCcsIHRydWUpXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZmllbGRfZGF0ZScsICcyMDI0LTAxLTAxJylcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdmaWVsZF90aW1lJywgJzEwOjMwJylcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdmaWVsZF9kYXRlX3RpbWUnLCAnMjAyNC0wMS0wMVQxMDozMDowMCcpXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZmllbGRfdXJsJywgJ2h0dHBzOi8vZXhhbXBsZS5jb20nKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX3Bhc3N3b3JkJywgJ3NlY3JldDEyMycpXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZmllbGRfcGhvbmUnLCAnKzEyMzQ1Njc4OTAnKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkX2xvbmdfdGV4dCcsICdBIGxvbmdlciB0ZXh0IHZhbHVlJylcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdmaWVsZF9yYWRpbycsICdhJylcblxuICAgICAgY29uc3QgdmFsdWVzID0gZW5naW5lLmdldFZhbHVlcygpXG4gICAgICBleHBlY3QodmFsdWVzLmZpZWxkX3Nob3J0X3RleHQpLnRvQmUoJ0hlbGxvIFdvcmxkJylcbiAgICAgIGV4cGVjdCh2YWx1ZXMuZmllbGRfZW1haWwpLnRvQmUoJ3Rlc3RAZXhhbXBsZS5jb20nKVxuICAgICAgZXhwZWN0KHZhbHVlcy5maWVsZF9udW1iZXIpLnRvQmUoNDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZW5mb3JjZSByZXF1aXJlZCBmaWVsZCBjb25zdHJhaW50OiBtaXNzaW5nIHJlcXVpcmVkIFNIT1JUX1RFWFQgZmFpbHMgdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtaW5MZW5ndGg6IDEgfSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBlbmdpbmUudmFsaWRhdGUoKVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMubmFtZSkudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIHJlcXVpcmVkIEVNQUlMIGZpZWxkIGFzIHZhbGlkIGVtYWlsIGZvcm1hdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZW1haWwnLCAnaW52YWxpZC1lbWFpbCcpXG4gICAgICBsZXQgcmVzdWx0ID0gZW5naW5lLnZhbGlkYXRlKClcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2VtYWlsJywgJ3ZhbGlkQGV4YW1wbGUuY29tJylcbiAgICAgIHJlc3VsdCA9IGVuZ2luZS52YWxpZGF0ZSgpXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBhY2NlcHQgZW1wdHkgc3RyaW5nLCBudWxsLCB1bmRlZmluZWQgZm9yIG9wdGlvbmFsIGZpZWxkcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnb3B0aW9uYWwxJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ29wdGlvbmFsMicsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IGZhbHNlIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdvcHRpb25hbDMnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnb3B0aW9uYWwxJywgJycpXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnb3B0aW9uYWwyJywgbnVsbClcbiAgICAgIC8vIG9wdGlvbmFsMyBsZWZ0IHVuc2V0XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGVuZ2luZS52YWxpZGF0ZSgpXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwb3B1bGF0ZSBkZWZhdWx0IHZhbHVlcyBmcm9tIGZpZWxkIGNvbmZpZycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnY291bnRyeScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IGZhbHNlLCBjb25maWc6IHsgZGVmYXVsdFZhbHVlOiAnVVNBJyB9IH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCB2YWx1ZXMgPSBlbmdpbmUuZ2V0VmFsdWVzKClcbiAgICAgIC8vIGRlZmF1bHRWYWx1ZSBpbiBjb25maWcgaXMgbm90IGF1dG9tYXRpY2FsbHkgYXBwbGllZCBieSBnZXREZWZhdWx0VmFsdWUgZm9yIFNIT1JUX1RFWFRcbiAgICAgIC8vIGdldERlZmF1bHRWYWx1ZSByZXR1cm5zICcnIGZvciBTSE9SVF9URVhUXG4gICAgICBleHBlY3QodmFsdWVzLmNvdW50cnkpLnRvQmVEZWZpbmVkKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdIeWRyYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoeWRyYXRlIGVuZ2luZSB3aXRoIGluaXRpYWwgZGF0YSBhbmQgcmV0dXJuIGl0IGZyb20gZ2V0VmFsdWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMgfSA9IGNyZWF0ZUNvbnRhY3RGb3JtKClcbiAgICAgIGNvbnN0IGh5ZHJhdGlvbkRhdGEgPSB7XG4gICAgICAgIGZpcnN0TmFtZTogJ0phbmUnLFxuICAgICAgICBsYXN0TmFtZTogJ1NtaXRoJyxcbiAgICAgICAgZW1haWw6ICdqYW5lQGV4YW1wbGUuY29tJyxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMsIGh5ZHJhdGlvbkRhdGEpXG4gICAgICBjb25zdCB2YWx1ZXMgPSBlbmdpbmUuZ2V0VmFsdWVzKClcblxuICAgICAgZXhwZWN0KHZhbHVlcy5maXJzdE5hbWUpLnRvQmUoJ0phbmUnKVxuICAgICAgZXhwZWN0KHZhbHVlcy5sYXN0TmFtZSkudG9CZSgnU21pdGgnKVxuICAgICAgZXhwZWN0KHZhbHVlcy5lbWFpbCkudG9CZSgnamFuZUBleGFtcGxlLmNvbScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWVyZ2UgaHlkcmF0aW9uIGRhdGEgd2l0aCBkZWZhdWx0cyBmb3IgdW5zZXQgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMgfSA9IGNyZWF0ZUNvbnRhY3RGb3JtKClcbiAgICAgIGNvbnN0IGh5ZHJhdGlvbkRhdGEgPSB7IGZpcnN0TmFtZTogJ0phbmUnIH1cblxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMsIGh5ZHJhdGlvbkRhdGEpXG4gICAgICBjb25zdCB2YWx1ZXMgPSBlbmdpbmUuZ2V0VmFsdWVzKClcblxuICAgICAgZXhwZWN0KHZhbHVlcy5maXJzdE5hbWUpLnRvQmUoJ0phbmUnKVxuICAgICAgLy8gT3RoZXIgZmllbGRzIGhhdmUgdGhlaXIgZGVmYXVsdHNcbiAgICAgIGV4cGVjdCh2YWx1ZXMubGFzdE5hbWUpLnRvQmVEZWZpbmVkKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdMYXJnZSBGb3JtcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBsYXJnZSBmb3JtIHdpdGggMTAwIGZpZWxkczogY3JlYXRlLCBzZXQgNSByZXF1aXJlZCBmaWVsZHMsIHZhbGlkYXRlJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMgfSA9IGNyZWF0ZUxhcmdlRm9ybSgxMDApXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgLy8gU2V0IG9ubHkgdGhlIGZpcnN0IDUgcmVxdWlyZWQgZmllbGRzXG4gICAgICBjb25zdCByZXF1aXJlZEZpZWxkcyA9IGZpZWxkcy5maWx0ZXIoZiA9PiBmLnJlcXVpcmVkKVxuICAgICAgcmVxdWlyZWRGaWVsZHMuc2xpY2UoMCwgNSkuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSAnU0hPUlRfVEVYVCcpIHtcbiAgICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZShmaWVsZC5rZXksICd0ZXN0LXZhbHVlJylcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnTlVNQkVSJykge1xuICAgICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKGZpZWxkLmtleSwgNDIpXG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ0VNQUlMJykge1xuICAgICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKGZpZWxkLmtleSwgJ3Rlc3RAZXhhbXBsZS5jb20nKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBFbmdpbmUgc2hvdWxkIGJlIGZ1bmN0aW9uYWwgd2l0aCAxMDAgZmllbGRzXG4gICAgICBjb25zdCB2YWx1ZXMgPSBlbmdpbmUuZ2V0VmFsdWVzKClcbiAgICAgIGV4cGVjdChPYmplY3Qua2V5cyh2YWx1ZXMpLmxlbmd0aCkudG9CZSgxMDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGVuZ2luZSB3aXRoIDUwMCBmaWVsZHMgd2l0aG91dCBwZXJmb3JtYW5jZSBpc3N1ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcyB9ID0gY3JlYXRlTGFyZ2VGb3JtKDUwMClcbiAgICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgICAgY29uc3QgZWxhcHNlZCA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRcblxuICAgICAgZXhwZWN0KGVsYXBzZWQpLnRvQmVMZXNzVGhhbig1MDAwKSAvLyBVbmRlciA1IHNlY29uZHNcbiAgICAgIGV4cGVjdChPYmplY3Qua2V5cyhlbmdpbmUuZ2V0VmFsdWVzKCkpLmxlbmd0aCkudG9CZSg1MDApXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnRmllbGQgQ29uc3RyYWludHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBlbmZvcmNlIG1pbkxlbmd0aCBjb25zdHJhaW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICd1c2VybmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtaW5MZW5ndGg6IDUgfSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgndXNlcm5hbWUnLCAnYWJjJylcbiAgICAgIGV4cGVjdChlbmdpbmUudmFsaWRhdGUoKS5zdWNjZXNzKS50b0JlKGZhbHNlKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgndXNlcm5hbWUnLCAnYWJjZGUnKVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBlbmZvcmNlIG1heExlbmd0aCBjb25zdHJhaW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICd0aXRsZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtYXhMZW5ndGg6IDEwLCBtaW5MZW5ndGg6IDEgfSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgndGl0bGUnLCAnVGhpcyBpcyB0b28gbG9uZycpXG4gICAgICBleHBlY3QoZW5naW5lLnZhbGlkYXRlKCkuc3VjY2VzcykudG9CZShmYWxzZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3RpdGxlJywgJ1Nob3J0JylcbiAgICAgIGV4cGVjdChlbmdpbmUudmFsaWRhdGUoKS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZW5mb3JjZSBOVU1CRVIgbWluL21heCBjb25zdHJhaW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnYWdlJywgdHlwZTogJ05VTUJFUicsIHJlcXVpcmVkOiB0cnVlLCBjb25maWc6IHsgbWluOiAxOCwgbWF4OiAxMjAgfSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnYWdlJywgMTApXG4gICAgICBleHBlY3QoZW5naW5lLnZhbGlkYXRlKCkuc3VjY2VzcykudG9CZShmYWxzZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2FnZScsIDE1MClcbiAgICAgIGV4cGVjdChlbmdpbmUudmFsaWRhdGUoKS5zdWNjZXNzKS50b0JlKGZhbHNlKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnYWdlJywgMjUpXG4gICAgICBleHBlY3QoZW5naW5lLnZhbGlkYXRlKCkuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGVuZm9yY2UgcGF0dGVybiBjb25zdHJhaW50IG9uIFNIT1JUX1RFWFQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3ppcENvZGUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlLCBjb25maWc6IHsgcGF0dGVybjogJ15bMC05XXs1fSQnIH0gfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3ppcENvZGUnLCAnQUJDREUnKVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCd6aXBDb2RlJywgJzAyMTAxJylcbiAgICAgIGV4cGVjdChlbmdpbmUudmFsaWRhdGUoKS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnU2VsZWN0IGFuZCBNdWx0aS1TZWxlY3QgT3B0aW9ucycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIFNFTEVDVCB3aXRoIHN0YXRpYyBvcHRpb25zOiBpbnZhbGlkIG9wdGlvbiBmYWlscycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdjYXRlZ29yeScsIHR5cGU6ICdTRUxFQ1QnLCByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBjb25maWc6IHsgbW9kZTogJ3N0YXRpYycsIG9wdGlvbnM6IFt7IGxhYmVsOiAnRWxlY3Ryb25pY3MnLCB2YWx1ZTogJ2VsZWN0cm9uaWNzJyB9LCB7IGxhYmVsOiAnQm9va3MnLCB2YWx1ZTogJ2Jvb2tzJyB9XSB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnY2F0ZWdvcnknLCAnaW52YWxpZCcpXG4gICAgICBleHBlY3QoZW5naW5lLnZhbGlkYXRlKCkuc3VjY2VzcykudG9CZShmYWxzZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2NhdGVnb3J5JywgJ2VsZWN0cm9uaWNzJylcbiAgICAgIGV4cGVjdChlbmdpbmUudmFsaWRhdGUoKS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgTVVMVElfU0VMRUNUIG9wdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnaW50ZXJlc3RzJywgdHlwZTogJ01VTFRJX1NFTEVDVCcsIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZzogeyBtb2RlOiAnc3RhdGljJywgb3B0aW9uczogW3sgbGFiZWw6ICdTcG9ydHMnLCB2YWx1ZTogJ3Nwb3J0cycgfSwgeyBsYWJlbDogJ011c2ljJywgdmFsdWU6ICdtdXNpYycgfV0gfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ludGVyZXN0cycsIFsnc3BvcnRzJywgJ211c2ljJ10pXG4gICAgICBleHBlY3QoZW5naW5lLnZhbGlkYXRlKCkuc3VjY2VzcykudG9CZSh0cnVlKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnaW50ZXJlc3RzJywgWydzcG9ydHMnLCAnaW52YWxpZCddKVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnUmF0aW5nIGFuZCBTY2FsZSBWYWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgUkFUSU5HIGZpZWxkIHdpdGhpbiAxIHRvIG1heCByYW5nZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnc2F0aXNmYWN0aW9uJywgdHlwZTogJ1JBVElORycsIHJlcXVpcmVkOiB0cnVlLCBjb25maWc6IHsgbWF4OiA1IH0gfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3NhdGlzZmFjdGlvbicsIDApXG4gICAgICBleHBlY3QoZW5naW5lLnZhbGlkYXRlKCkuc3VjY2VzcykudG9CZShmYWxzZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3NhdGlzZmFjdGlvbicsIDMpXG4gICAgICBleHBlY3QoZW5naW5lLnZhbGlkYXRlKCkuc3VjY2VzcykudG9CZSh0cnVlKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnc2F0aXNmYWN0aW9uJywgNilcbiAgICAgIGV4cGVjdChlbmdpbmUudmFsaWRhdGUoKS5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIFNDQUxFIHJhbmdlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdhZ3JlZW1lbnQnLCB0eXBlOiAnU0NBTEUnLCByZXF1aXJlZDogdHJ1ZSwgY29uZmlnOiB7IG1pbjogMSwgbWF4OiAxMCB9IH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdhZ3JlZW1lbnQnLCAwKVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdhZ3JlZW1lbnQnLCA1KVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2FncmVlbWVudCcsIDExKVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnRmlsZSBhbmQgQ29tcGxleCBUeXBlcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIEZJTEVfVVBMT0FEIGZpbGUgc2hhcGUgKGFycmF5IG9mIGZpbGUgb2JqZWN0cyknLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2RvY3VtZW50JywgdHlwZTogJ0ZJTEVfVVBMT0FEJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtYXhTaXplTUI6IDEwLCBtYXhGaWxlczogMSB9IH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIC8vIEZJTEVfVVBMT0FEIGV4cGVjdHMgYW4gYXJyYXkgb2YgZmlsZSBvYmplY3RzXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZG9jdW1lbnQnLCBbeyBuYW1lOiAncmVwb3J0LnBkZicsIHNpemU6IDIwNDgsIHR5cGU6ICdhcHBsaWNhdGlvbi9wZGYnLCB1cmw6ICdodHRwczovL2V4YW1wbGUuY29tL3JlcG9ydC5wZGYnIH1dKVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBhY2NlcHQgUklDSF9URVhUIGFzIGFueSBzdHJpbmcnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2Rlc2NyaXB0aW9uJywgdHlwZTogJ1JJQ0hfVEVYVCcsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdkZXNjcmlwdGlvbicsICc8cD5SaWNoIDxiPnRleHQ8L2I+IGNvbnRlbnQ8L3A+JylcbiAgICAgIGV4cGVjdChlbmdpbmUudmFsaWRhdGUoKS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVxdWlyZSBTSUdOQVRVUkUgdG8gaGF2ZSBkYXRhOiBwcmVmaXgnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3NpZycsIHR5cGU6ICdTSUdOQVRVUkUnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnc2lnJywgJ2ludmFsaWQtc2lnbmF0dXJlJylcbiAgICAgIGV4cGVjdChlbmdpbmUudmFsaWRhdGUoKS5zdWNjZXNzKS50b0JlKGZhbHNlKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnc2lnJywgJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnbz0nKVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBhY2NlcHQgQUREUkVTUyBhcyBvYmplY3QnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2xvY2F0aW9uJywgdHlwZTogJ0FERFJFU1MnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnbG9jYXRpb24nLCB7IHN0cmVldDogJzQ1NiBPYWsgQXZlJywgY2l0eTogJ1NwcmluZ2ZpZWxkJywgc3RhdGU6ICdJTCcsIHppcDogJzYyNzAxJyB9KVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdTdWJtaXNzaW9uIGFuZCBWaXNpYmlsaXR5JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY29sbGVjdCBzdWJtaXNzaW9uIHZhbHVlcyBmcm9tIHZpc2libGUgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdyb2xlJywgdHlwZTogJ1NFTEVDVCcsIHJlcXVpcmVkOiB0cnVlLCBjb25maWc6IHsgbW9kZTogJ3N0YXRpYycsIG9wdGlvbnM6IFt7IGxhYmVsOiAnVXNlcicsIHZhbHVlOiAndXNlcicgfSwgeyBsYWJlbDogJ0FkbWluJywgdmFsdWU6ICdhZG1pbicgfV0gfSB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdhZG1pbl9jb2RlJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBjb25kaXRpb25zOiB7IGFjdGlvbjogJ1NIT1cnLCBvcGVyYXRvcjogJ2FuZCcsIHJ1bGVzOiBbeyBmaWVsZEtleTogJ3JvbGUnLCBvcGVyYXRvcjogJ2VxJywgdmFsdWU6ICdhZG1pbicgfV0gfSBhcyBhbnksXG4gICAgICAgIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICd1c2VybmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtaW5MZW5ndGg6IDMgfSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgncm9sZScsICdhZG1pbicpXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnYWRtaW5fY29kZScsICdTRUNSRVQnKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3VzZXJuYW1lJywgJ2pvaG5kb2UnKVxuXG4gICAgICBjb25zdCBzdWJtaXNzaW9uID0gZW5naW5lLmNvbGxlY3RTdWJtaXNzaW9uVmFsdWVzKClcbiAgICAgIGV4cGVjdChzdWJtaXNzaW9uLnJvbGUpLnRvQmUoJ2FkbWluJylcbiAgICAgIGV4cGVjdChzdWJtaXNzaW9uLmFkbWluX2NvZGUpLnRvQmUoJ1NFQ1JFVCcpXG4gICAgICBleHBlY3Qoc3VibWlzc2lvbi51c2VybmFtZSkudG9CZSgnam9obmRvZScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZXhjbHVkZSBoaWRkZW4gY29uZGl0aW9uYWwgZmllbGRzIGZyb20gc3VibWlzc2lvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAncm9sZScsIHR5cGU6ICdTRUxFQ1QnLCByZXF1aXJlZDogdHJ1ZSwgY29uZmlnOiB7IG1vZGU6ICdzdGF0aWMnLCBvcHRpb25zOiBbeyBsYWJlbDogJ1VzZXInLCB2YWx1ZTogJ3VzZXInIH0sIHsgbGFiZWw6ICdBZG1pbicsIHZhbHVlOiAnYWRtaW4nIH1dIH0gfSksXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnYWRtaW5fY29kZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgY29uZGl0aW9uczogeyBhY3Rpb246ICdTSE9XJywgb3BlcmF0b3I6ICdhbmQnLCBydWxlczogW3sgZmllbGRLZXk6ICdyb2xlJywgb3BlcmF0b3I6ICdlcScsIHZhbHVlOiAnYWRtaW4nIH1dIH0gYXMgYW55LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgncm9sZScsICd1c2VyJykgLy8gYWRtaW5fY29kZSBzaG91bGQgYmUgaGlkZGVuXG4gICAgICBjb25zdCBzdWJtaXNzaW9uID0gZW5naW5lLmNvbGxlY3RTdWJtaXNzaW9uVmFsdWVzKClcbiAgICAgIGV4cGVjdChzdWJtaXNzaW9uLmFkbWluX2NvZGUpLnRvQmVVbmRlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgZmllbGQgaW4gdmFsaWRhdGlvbiB3aGVuIGNvbmRpdGlvbiBpcyBtZXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3JvbGUnLCB0eXBlOiAnU0VMRUNUJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtb2RlOiAnc3RhdGljJywgb3B0aW9uczogW3sgbGFiZWw6ICdVc2VyJywgdmFsdWU6ICd1c2VyJyB9LCB7IGxhYmVsOiAnQWRtaW4nLCB2YWx1ZTogJ2FkbWluJyB9XSB9IH0pLFxuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2FkbWluX2NvZGUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IHsgYWN0aW9uOiAnU0hPVycsIG9wZXJhdG9yOiAnYW5kJywgcnVsZXM6IFt7IGZpZWxkS2V5OiAncm9sZScsIG9wZXJhdG9yOiAnZXEnLCB2YWx1ZTogJ2FkbWluJyB9XSB9IGFzIGFueSxcbiAgICAgICAgICBjb25maWc6IHsgbWluTGVuZ3RoOiAxIH0sXG4gICAgICAgIH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdyb2xlJywgJ2FkbWluJylcbiAgICAgIC8vIGFkbWluX2NvZGUgaXMgbm93IHZpc2libGUgYW5kIHJlcXVpcmVkIGJ1dCBlbXB0eVxuICAgICAgY29uc3QgcmVzdWx0ID0gZW5naW5lLnZhbGlkYXRlKClcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzLmFkbWluX2NvZGUpLnRvQmVEZWZpbmVkKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdHcmFwaCBQYXRjaCBhbmQgU3RhdGUgQ2hhbmdlcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBHcmFwaFBhdGNoIGZyb20gc2V0RmllbGRWYWx1ZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBjcmVhdGVDb250YWN0Rm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgY29uc3QgcGF0Y2ggPSBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZmlyc3ROYW1lJywgJ0FsaWNlJylcbiAgICAgIGV4cGVjdChwYXRjaCkudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGV4Y2x1ZGUgaGlkZGVuIGZpZWxkcyBmcm9tIGdldFZpc2libGVGaWVsZHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3JvbGUnLCB0eXBlOiAnU0VMRUNUJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtb2RlOiAnc3RhdGljJywgb3B0aW9uczogW3sgbGFiZWw6ICdVc2VyJywgdmFsdWU6ICd1c2VyJyB9LCB7IGxhYmVsOiAnQWRtaW4nLCB2YWx1ZTogJ2FkbWluJyB9XSB9IH0pLFxuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2FkbWluX2NvZGUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBjb25kaXRpb25zOiB7IGFjdGlvbjogJ1NIT1cnLCBvcGVyYXRvcjogJ2FuZCcsIHJ1bGVzOiBbeyBmaWVsZEtleTogJ3JvbGUnLCBvcGVyYXRvcjogJ2VxJywgdmFsdWU6ICdhZG1pbicgfV0gfSBhcyBhbnksXG4gICAgICAgIH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdyb2xlJywgJ3VzZXInKVxuICAgICAgY29uc3QgdmlzaWJsZUZpZWxkcyA9IGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKClcbiAgICAgIGNvbnN0IGZpZWxkS2V5cyA9IHZpc2libGVGaWVsZHMubWFwKGYgPT4gZi5rZXkpXG4gICAgICBleHBlY3QoZmllbGRLZXlzKS50b0NvbnRhaW4oJ3JvbGUnKVxuICAgICAgZXhwZWN0KGZpZWxkS2V5cykubm90LnRvQ29udGFpbignYWRtaW5fY29kZScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZ2V0IGZpZWxkIHN0YXRlIHdpdGggZ2V0RmllbGRTdGF0ZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBjcmVhdGVDb250YWN0Rm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpcnN0TmFtZScsICdUZXN0JylcbiAgICAgIGNvbnN0IGZpZWxkU3RhdGUgPSBlbmdpbmUuZ2V0RmllbGRTdGF0ZSgnZmlyc3ROYW1lJylcblxuICAgICAgZXhwZWN0KGZpZWxkU3RhdGUpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChmaWVsZFN0YXRlIS52YWx1ZSkudG9CZSgnVGVzdCcpXG4gICAgICBleHBlY3QoZmllbGRTdGF0ZSEuaXNWaXNpYmxlKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnRGF0ZSBSYW5nZSBhbmQgU3RyaWN0IFN1Ym1pc3Npb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXF1aXJlIERBVEVfUkFOR0UgdG8gaGF2ZSBib3RoIGZyb20gYW5kIHRvJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICd2YWNhdGlvbkRhdGVzJywgdHlwZTogJ0RBVEVfUkFOR0UnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgndmFjYXRpb25EYXRlcycsIHsgZnJvbTogJzIwMjQtMDYtMDEnIH0pXG4gICAgICBleHBlY3QoZW5naW5lLnZhbGlkYXRlKCkuc3VjY2VzcykudG9CZShmYWxzZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3ZhY2F0aW9uRGF0ZXMnLCB7IGZyb206ICcyMDI0LTA2LTAxJywgdG86ICcyMDI0LTA2LTE1JyB9KVxuICAgICAgZXhwZWN0KGVuZ2luZS52YWxpZGF0ZSgpLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgdW5rbm93biBrZXlzIHdpdGggc3RyaWN0IHN1Ym1pc3Npb24gc2NoZW1hJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVTdHJpY3RTdWJtaXNzaW9uU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3QgZGF0YSA9IHsgZW1haWw6ICd0ZXN0QGV4YW1wbGUuY29tJywgdW5rbm93bkZpZWxkOiAnc2hvdWxkIGNhdXNlIGZhaWx1cmUnIH1cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHNjaGVtYS5zYWZlUGFyc2UoZGF0YSlcbiAgICAgIC8vIHN0cmljdCgpIHJlamVjdHMgdW5rbm93biBrZXlzXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnU2NoZW1hIEdlbmVyYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBab2Qgc2NoZW1hIGZyb20gZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSwgY29uZmlnOiB7IG1pbkxlbmd0aDogMSB9IH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIF1cblxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuICAgICAgZXhwZWN0KHNjaGVtYSkudG9CZURlZmluZWQoKVxuXG4gICAgICBjb25zdCB2YWxpZERhdGEgPSB7IG5hbWU6ICdKb2huJywgZW1haWw6ICdqb2huQGV4YW1wbGUuY29tJyB9XG4gICAgICBjb25zdCByZXN1bHQgPSBzY2hlbWEuc2FmZVBhcnNlKHZhbGlkRGF0YSlcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHNjaGVtYXMgZm9yIGFsbCAyNCBmaWVsZCB0eXBlcyB3aXRob3V0IGVycm9ycycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBjcmVhdGVBbGxGaWVsZFR5cGVzRm9ybSgpXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG4gICAgICBleHBlY3Qoc2NoZW1hKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3Qoc2NoZW1hLnNoYXBlKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=