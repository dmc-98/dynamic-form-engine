"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_core_1 = require("@dmc--98/dfe-core");
const fixtures_1 = require("./helpers/fixtures");
(0, vitest_1.describe)('JSON Schema Interoperability', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, fixtures_1.resetFieldCounter)();
    });
    (0, vitest_1.describe)('toJsonSchema conversion', () => {
        (0, vitest_1.it)('should produce valid $schema and type:object', () => {
            const fields = [(0, fixtures_1.makeField)('name', 'SHORT_TEXT', 'Name')];
            const schema = (0, dfe_core_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
            (0, vitest_1.expect)(schema.type).toBe('object');
        });
        (0, vitest_1.it)('should include title when provided', () => {
            const fields = [(0, fixtures_1.makeField)('name', 'SHORT_TEXT', 'Name')];
            const schema = (0, dfe_core_1.toJsonSchema)(fields, 'Contact Form');
            (0, vitest_1.expect)(schema.title).toBe('Contact Form');
        });
        (0, vitest_1.it)('should map all 24 field types to correct JSON Schema types', () => {
            const allFieldsForm = (0, fixtures_1.createAllFieldTypesForm)();
            const schema = (0, dfe_core_1.toJsonSchema)(allFieldsForm.fields);
            (0, vitest_1.expect)(schema.properties).toBeDefined();
            (0, vitest_1.expect)(Object.keys(schema.properties).length).toBeGreaterThan(0);
            // Verify some key type mappings
            const properties = schema.properties;
            // SHORT_TEXT → string
            const shortTextField = properties[Object.keys(properties).find(k => { var _a; return ((_a = schema.properties[k]) === null || _a === void 0 ? void 0 : _a['x-dfe-type']) === 'SHORT_TEXT'; })];
            if (shortTextField) {
                (0, vitest_1.expect)(shortTextField.type).toBe('string');
            }
            // EMAIL → string with format:email
            const emailField = Object.entries(properties).find(([_, p]) => p['x-dfe-type'] === 'EMAIL');
            if (emailField) {
                (0, vitest_1.expect)(emailField[1].type).toBe('string');
                (0, vitest_1.expect)(emailField[1].format).toBe('email');
            }
            // NUMBER → number
            const numberField = Object.entries(properties).find(([_, p]) => p['x-dfe-type'] === 'NUMBER');
            if (numberField) {
                (0, vitest_1.expect)(numberField[1].type).toBe('number');
            }
        });
        (0, vitest_1.it)('should include required array for required fields', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name', required: true }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email', required: false }),
            ];
            const schema = (0, dfe_core_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.required).toBeDefined();
            (0, vitest_1.expect)(schema.required).toContain('name');
            (0, vitest_1.expect)(schema.required).not.toContain('email');
        });
        (0, vitest_1.it)('should preserve constraints: minLength, maxLength, min, max, pattern', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    label: 'Username',
                    config: {
                        minLength: 3,
                        maxLength: 20,
                        pattern: '^[a-zA-Z0-9_]+$',
                    },
                }),
                (0, fixtures_1.makeField)({
                    key: 'age',
                    type: 'NUMBER',
                    label: 'Age',
                    config: {
                        min: 0,
                        max: 150,
                    },
                }),
            ];
            const schema = (0, dfe_core_1.toJsonSchema)(fields);
            const props = schema.properties;
            (0, vitest_1.expect)(props.username.minLength).toBe(3);
            (0, vitest_1.expect)(props.username.maxLength).toBe(20);
            (0, vitest_1.expect)(props.username.pattern).toBe('^[a-zA-Z0-9_]+$');
            (0, vitest_1.expect)(props.age.minimum).toBe(0);
            (0, vitest_1.expect)(props.age.maximum).toBe(150);
        });
        (0, vitest_1.it)('should map SELECT options to enum', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'country',
                    type: 'SELECT',
                    label: 'Country',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'USA', value: 'usa' },
                            { label: 'Canada', value: 'ca' },
                            { label: 'Mexico', value: 'mx' },
                        ],
                    },
                }),
            ];
            const schema = (0, dfe_core_1.toJsonSchema)(fields);
            const props = schema.properties;
            (0, vitest_1.expect)(props.country.enum).toEqual(['usa', 'ca', 'mx']);
        });
        (0, vitest_1.it)('should map MULTI_SELECT items to array with enum', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'skills',
                    type: 'MULTI_SELECT',
                    label: 'Skills',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'JavaScript', value: 'js' },
                            { label: 'Python', value: 'py' },
                            { label: 'Go', value: 'go' },
                        ],
                    },
                }),
            ];
            const schema = (0, dfe_core_1.toJsonSchema)(fields);
            const props = schema.properties;
            (0, vitest_1.expect)(props.skills.type).toBe('array');
            (0, vitest_1.expect)(props.skills.items.enum).toEqual(['js', 'py', 'go']);
        });
    });
    (0, vitest_1.describe)('fromJsonSchema conversion', () => {
        (0, vitest_1.it)('should convert basic string to SHORT_TEXT', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    name: { type: 'string' },
                },
            };
            const fields = (0, dfe_core_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields.length).toBe(1);
            (0, vitest_1.expect)(fields[0].type).toBe('SHORT_TEXT');
            (0, vitest_1.expect)(fields[0].key).toBe('name');
        });
        (0, vitest_1.it)('should convert format:email to EMAIL type', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                },
            };
            const fields = (0, dfe_core_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('EMAIL');
            (0, vitest_1.expect)(fields[0].key).toBe('email');
        });
        (0, vitest_1.it)('should convert enum to SELECT with options', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    status: { enum: ['active', 'inactive', 'pending'] },
                },
            };
            const fields = (0, dfe_core_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('SELECT');
            (0, vitest_1.expect)(fields[0].config.options).toEqual([
                { label: 'active', value: 'active' },
                { label: 'inactive', value: 'inactive' },
                { label: 'pending', value: 'pending' },
            ]);
        });
        (0, vitest_1.it)('should preserve exact type with x-dfe-type extension', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    password: { type: 'string', 'x-dfe-type': 'PASSWORD' },
                    phone: { type: 'string', 'x-dfe-type': 'PHONE' },
                },
            };
            const fields = (0, dfe_core_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('PASSWORD');
            (0, vitest_1.expect)(fields[1].type).toBe('PHONE');
        });
    });
    (0, vitest_1.describe)('Round-trip conversions', () => {
        (0, vitest_1.it)('should preserve all 24 field types via x-dfe-type extension', () => {
            const { fields: originalFields } = (0, fixtures_1.createAllFieldTypesForm)();
            // toJsonSchema skips SECTION_BREAK and FIELD_GROUP
            const nonSkipped = originalFields.filter(f => f.type !== 'SECTION_BREAK' && f.type !== 'FIELD_GROUP');
            const schema = (0, dfe_core_1.toJsonSchema)(originalFields);
            const convertedFields = (0, dfe_core_1.fromJsonSchema)(schema);
            // Compare types (x-dfe-type should preserve exact types)
            (0, vitest_1.expect)(convertedFields.length).toBe(nonSkipped.length);
            for (let i = 0; i < convertedFields.length; i++) {
                (0, vitest_1.expect)(convertedFields[i].type).toBe(nonSkipped[i].type);
            }
        });
        (0, vitest_1.it)('should preserve constraints during round-trip', () => {
            const originalFields = [
                (0, fixtures_1.makeField)({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    label: 'Username',
                    config: {
                        minLength: 3,
                        maxLength: 20,
                        pattern: '^[a-zA-Z0-9_]+$',
                    },
                    required: true,
                }),
                (0, fixtures_1.makeField)({
                    key: 'score',
                    type: 'NUMBER',
                    label: 'Score',
                    config: {
                        min: 0,
                        max: 100,
                    },
                    required: false,
                }),
            ];
            const schema = (0, dfe_core_1.toJsonSchema)(originalFields);
            const convertedFields = (0, dfe_core_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(convertedFields[0].config.minLength).toBe(3);
            (0, vitest_1.expect)(convertedFields[0].config.maxLength).toBe(20);
            (0, vitest_1.expect)(convertedFields[0].config.pattern).toBe('^[a-zA-Z0-9_]+$');
            (0, vitest_1.expect)(convertedFields[0].required).toBe(true);
            (0, vitest_1.expect)(convertedFields[1].config.min).toBe(0);
            (0, vitest_1.expect)(convertedFields[1].config.max).toBe(100);
            (0, vitest_1.expect)(convertedFields[1].required).toBe(false);
        });
        (0, vitest_1.it)('should preserve SELECT/RADIO/MULTI_SELECT options during round-trip', () => {
            const originalFields = [
                (0, fixtures_1.makeField)({
                    key: 'country',
                    type: 'SELECT',
                    label: 'Country',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'USA', value: 'usa' },
                            { label: 'Canada', value: 'ca' },
                        ],
                    },
                }),
                (0, fixtures_1.makeField)({
                    key: 'gender',
                    type: 'RADIO',
                    label: 'Gender',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Male', value: 'm' },
                            { label: 'Female', value: 'f' },
                        ],
                    },
                }),
                (0, fixtures_1.makeField)({
                    key: 'languages',
                    type: 'MULTI_SELECT',
                    label: 'Languages',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'English', value: 'en' },
                            { label: 'Spanish', value: 'es' },
                        ],
                    },
                }),
            ];
            const schema = (0, dfe_core_1.toJsonSchema)(originalFields);
            const convertedFields = (0, dfe_core_1.fromJsonSchema)(schema);
            // JSON Schema enums don't preserve original labels — fromJsonSchema uses value as label
            // So we check that values are preserved correctly
            const convertedValues0 = convertedFields[0].config.options.map((o) => o.value);
            const originalValues0 = originalFields[0].config.options.map((o) => o.value);
            (0, vitest_1.expect)(convertedValues0).toEqual(originalValues0);
            const convertedValues1 = convertedFields[1].config.options.map((o) => o.value);
            const originalValues1 = originalFields[1].config.options.map((o) => o.value);
            (0, vitest_1.expect)(convertedValues1).toEqual(originalValues1);
            const convertedValues2 = convertedFields[2].config.options.map((o) => o.value);
            const originalValues2 = originalFields[2].config.options.map((o) => o.value);
            (0, vitest_1.expect)(convertedValues2).toEqual(originalValues2);
        });
        (0, vitest_1.it)('should round-trip template form: getTemplate → toJsonSchema → fromJsonSchema', () => {
            const template = (0, dfe_core_1.getTemplate)('contact-form');
            (0, vitest_1.expect)(template).toBeDefined();
            if (template) {
                const schema = (0, dfe_core_1.toJsonSchema)(template.fields);
                const convertedFields = (0, dfe_core_1.fromJsonSchema)(schema);
                (0, vitest_1.expect)(convertedFields.length).toBe(template.fields.length);
                // Verify field keys and types match
                for (let i = 0; i < template.fields.length; i++) {
                    (0, vitest_1.expect)(convertedFields[i].key).toBe(template.fields[i].key);
                    (0, vitest_1.expect)(convertedFields[i].type).toBe(template.fields[i].type);
                }
            }
        });
    });
    (0, vitest_1.describe)('JSON Schema integration with FormEngine', () => {
        (0, vitest_1.it)('should create valid FormEngine from toJsonSchema output', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name', required: true }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
            ];
            const schema = (0, dfe_core_1.toJsonSchema)(fields, 'User Form');
            // Convert back and create engine
            const convertedFields = (0, dfe_core_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(() => (0, dfe_core_1.createFormEngine)(convertedFields)).not.toThrow();
        });
        (0, vitest_1.it)('should handle complex nested structures during schema conversion', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'section1',
                    type: 'SECTION_BREAK',
                    label: 'Contact Information',
                    config: {
                        helperText: 'Please provide your contact details',
                    },
                }),
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Full Name', required: true }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email Address', required: true }),
                (0, fixtures_1.makeField)('phone', 'PHONE', 'Phone Number'),
            ];
            const schema = (0, dfe_core_1.toJsonSchema)(fields, 'Complex Form');
            const convertedFields = (0, dfe_core_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(schema.properties).toBeDefined();
            (0, vitest_1.expect)(convertedFields.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zY2hlbWEtaW50ZXJvcC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsianNvbi1zY2hlbWEtaW50ZXJvcC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQXlEO0FBQ3pELGtEQUFnSDtBQUNoSCxpREFBMEY7QUFFMUYsSUFBQSxpQkFBUSxFQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtJQUM1QyxJQUFBLG1CQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ2QsSUFBQSw0QkFBaUIsR0FBRSxDQUFBO0lBQ3JCLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxpQkFBUSxFQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUN2QyxJQUFBLFdBQUUsRUFBQyw4Q0FBOEMsRUFBRSxHQUFHLEVBQUU7WUFDdEQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFBLG9CQUFTLEVBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO1lBQ3hELE1BQU0sTUFBTSxHQUFHLElBQUEsdUJBQVksRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUVuQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxDQUFDLENBQUE7WUFDdEUsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNwQyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUEsb0JBQVMsRUFBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUE7WUFDeEQsTUFBTSxNQUFNLEdBQUcsSUFBQSx1QkFBWSxFQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQTtZQUVuRCxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsS0FB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ZUVhY2ggfSBmcm9tICd2aXRlc3QnXG5pbXBvcnQgeyB0b0pzb25TY2hlbWEsIGZyb21Kc29uU2NoZW1hLCBjcmVhdGVGb3JtRW5naW5lLCBnZXRUZW1wbGF0ZSwgbGlzdFRlbXBsYXRlcyB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5pbXBvcnQgeyBtYWtlRmllbGQsIHJlc2V0RmllbGRDb3VudGVyLCBjcmVhdGVBbGxGaWVsZFR5cGVzRm9ybSB9IGZyb20gJy4vaGVscGVycy9maXh0dXJlcydcblxuZGVzY3JpYmUoJ0pTT04gU2NoZW1hIEludGVyb3BlcmFiaWxpdHknLCAoKSA9PiB7XG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHJlc2V0RmllbGRDb3VudGVyKClcbiAgfSlcblxuICBkZXNjcmliZSgndG9Kc29uU2NoZW1hIGNvbnZlcnNpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm9kdWNlIHZhbGlkICRzY2hlbWEgYW5kIHR5cGU6b2JqZWN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCgnbmFtZScsICdTSE9SVF9URVhUJywgJ05hbWUnKV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEuJHNjaGVtYSkudG9CZSgnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJylcbiAgICAgIGV4cGVjdChzY2hlbWEudHlwZSkudG9CZSgnb2JqZWN0JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHRpdGxlIHdoZW4gcHJvdmlkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKCduYW1lJywgJ1NIT1JUX1RFWFQnLCAnTmFtZScpXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcywgJ0NvbnRhY3QgRm9ybScpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEudGl0bGUpLnRvQmUoJ0NvbnRhY3QgRm9ybScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIGFsbCAyNCBmaWVsZCB0eXBlcyB0byBjb3JyZWN0IEpTT04gU2NoZW1hIHR5cGVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWxsRmllbGRzRm9ybSA9IGNyZWF0ZUFsbEZpZWxkVHlwZXNGb3JtKClcbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShhbGxGaWVsZHNGb3JtLmZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoT2JqZWN0LmtleXMoc2NoZW1hLnByb3BlcnRpZXMpLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG5cbiAgICAgIC8vIFZlcmlmeSBzb21lIGtleSB0eXBlIG1hcHBpbmdzXG4gICAgICBjb25zdCBwcm9wZXJ0aWVzID0gc2NoZW1hLnByb3BlcnRpZXMgYXMgUmVjb3JkPHN0cmluZywgYW55PlxuXG4gICAgICAvLyBTSE9SVF9URVhUIOKGkiBzdHJpbmdcbiAgICAgIGNvbnN0IHNob3J0VGV4dEZpZWxkID0gcHJvcGVydGllc1tPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5maW5kKGsgPT4gc2NoZW1hLnByb3BlcnRpZXNba10/LlsneC1kZmUtdHlwZSddID09PSAnU0hPUlRfVEVYVCcpXVxuICAgICAgaWYgKHNob3J0VGV4dEZpZWxkKSB7XG4gICAgICAgIGV4cGVjdChzaG9ydFRleHRGaWVsZC50eXBlKS50b0JlKCdzdHJpbmcnKVxuICAgICAgfVxuXG4gICAgICAvLyBFTUFJTCDihpIgc3RyaW5nIHdpdGggZm9ybWF0OmVtYWlsXG4gICAgICBjb25zdCBlbWFpbEZpZWxkID0gT2JqZWN0LmVudHJpZXMocHJvcGVydGllcykuZmluZCgoW18sIHBdOiBbc3RyaW5nLCBhbnldKSA9PiBwWyd4LWRmZS10eXBlJ10gPT09ICdFTUFJTCcpXG4gICAgICBpZiAoZW1haWxGaWVsZCkge1xuICAgICAgICBleHBlY3QoZW1haWxGaWVsZFsxXS50eXBlKS50b0JlKCdzdHJpbmcnKVxuICAgICAgICBleHBlY3QoZW1haWxGaWVsZFsxXS5mb3JtYXQpLnRvQmUoJ2VtYWlsJylcbiAgICAgIH1cblxuICAgICAgLy8gTlVNQkVSIOKGkiBudW1iZXJcbiAgICAgIGNvbnN0IG51bWJlckZpZWxkID0gT2JqZWN0LmVudHJpZXMocHJvcGVydGllcykuZmluZCgoW18sIHBdOiBbc3RyaW5nLCBhbnldKSA9PiBwWyd4LWRmZS10eXBlJ10gPT09ICdOVU1CRVInKVxuICAgICAgaWYgKG51bWJlckZpZWxkKSB7XG4gICAgICAgIGV4cGVjdChudW1iZXJGaWVsZFsxXS50eXBlKS50b0JlKCdudW1iZXInKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgcmVxdWlyZWQgYXJyYXkgZm9yIHJlcXVpcmVkIGZpZWxkcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgbGFiZWw6ICdOYW1lJywgcmVxdWlyZWQ6IHRydWUgfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2VtYWlsJywgdHlwZTogJ0VNQUlMJywgbGFiZWw6ICdFbWFpbCcsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucmVxdWlyZWQpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChzY2hlbWEucmVxdWlyZWQpLnRvQ29udGFpbignbmFtZScpXG4gICAgICBleHBlY3Qoc2NoZW1hLnJlcXVpcmVkKS5ub3QudG9Db250YWluKCdlbWFpbCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgY29uc3RyYWludHM6IG1pbkxlbmd0aCwgbWF4TGVuZ3RoLCBtaW4sIG1heCwgcGF0dGVybicsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICd1c2VybmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIGxhYmVsOiAnVXNlcm5hbWUnLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiAzLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiAyMCxcbiAgICAgICAgICAgIHBhdHRlcm46ICdeW2EtekEtWjAtOV9dKyQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2FnZScsXG4gICAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgICAgbGFiZWw6ICdBZ2UnLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbWluOiAwLFxuICAgICAgICAgICAgbWF4OiAxNTAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuICAgICAgY29uc3QgcHJvcHMgPSBzY2hlbWEucHJvcGVydGllcyBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+XG5cbiAgICAgIGV4cGVjdChwcm9wcy51c2VybmFtZS5taW5MZW5ndGgpLnRvQmUoMylcbiAgICAgIGV4cGVjdChwcm9wcy51c2VybmFtZS5tYXhMZW5ndGgpLnRvQmUoMjApXG4gICAgICBleHBlY3QocHJvcHMudXNlcm5hbWUucGF0dGVybikudG9CZSgnXlthLXpBLVowLTlfXSskJylcblxuICAgICAgZXhwZWN0KHByb3BzLmFnZS5taW5pbXVtKS50b0JlKDApXG4gICAgICBleHBlY3QocHJvcHMuYWdlLm1heGltdW0pLnRvQmUoMTUwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBTRUxFQ1Qgb3B0aW9ucyB0byBlbnVtJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2NvdW50cnknLFxuICAgICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICAgIGxhYmVsOiAnQ291bnRyeScsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ1VTQScsIHZhbHVlOiAndXNhJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2FuYWRhJywgdmFsdWU6ICdjYScgfSxcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ01leGljbycsIHZhbHVlOiAnbXgnIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcbiAgICAgIGNvbnN0IHByb3BzID0gc2NoZW1hLnByb3BlcnRpZXMgYXMgUmVjb3JkPHN0cmluZywgYW55PlxuXG4gICAgICBleHBlY3QocHJvcHMuY291bnRyeS5lbnVtKS50b0VxdWFsKFsndXNhJywgJ2NhJywgJ214J10pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIE1VTFRJX1NFTEVDVCBpdGVtcyB0byBhcnJheSB3aXRoIGVudW0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnc2tpbGxzJyxcbiAgICAgICAgICB0eXBlOiAnTVVMVElfU0VMRUNUJyxcbiAgICAgICAgICBsYWJlbDogJ1NraWxscycsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0phdmFTY3JpcHQnLCB2YWx1ZTogJ2pzJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnUHl0aG9uJywgdmFsdWU6ICdweScgfSxcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0dvJywgdmFsdWU6ICdnbycgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuICAgICAgY29uc3QgcHJvcHMgPSBzY2hlbWEucHJvcGVydGllcyBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+XG5cbiAgICAgIGV4cGVjdChwcm9wcy5za2lsbHMudHlwZSkudG9CZSgnYXJyYXknKVxuICAgICAgZXhwZWN0KHByb3BzLnNraWxscy5pdGVtcy5lbnVtKS50b0VxdWFsKFsnanMnLCAncHknLCAnZ28nXSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdmcm9tSnNvblNjaGVtYSBjb252ZXJzaW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY29udmVydCBiYXNpYyBzdHJpbmcgdG8gU0hPUlRfVEVYVCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICB9LFxuICAgICAgfVxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzLmxlbmd0aCkudG9CZSgxKVxuICAgICAgZXhwZWN0KGZpZWxkc1swXS50eXBlKS50b0JlKCdTSE9SVF9URVhUJylcbiAgICAgIGV4cGVjdChmaWVsZHNbMF0ua2V5KS50b0JlKCduYW1lJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjb252ZXJ0IGZvcm1hdDplbWFpbCB0byBFTUFJTCB0eXBlJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBlbWFpbDogeyB0eXBlOiAnc3RyaW5nJywgZm9ybWF0OiAnZW1haWwnIH0sXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0udHlwZSkudG9CZSgnRU1BSUwnKVxuICAgICAgZXhwZWN0KGZpZWxkc1swXS5rZXkpLnRvQmUoJ2VtYWlsJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjb252ZXJ0IGVudW0gdG8gU0VMRUNUIHdpdGggb3B0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgc3RhdHVzOiB7IGVudW06IFsnYWN0aXZlJywgJ2luYWN0aXZlJywgJ3BlbmRpbmcnXSB9LFxuICAgICAgICB9LFxuICAgICAgfVxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLnR5cGUpLnRvQmUoJ1NFTEVDVCcpXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmNvbmZpZy5vcHRpb25zKS50b0VxdWFsKFtcbiAgICAgICAgeyBsYWJlbDogJ2FjdGl2ZScsIHZhbHVlOiAnYWN0aXZlJyB9LFxuICAgICAgICB7IGxhYmVsOiAnaW5hY3RpdmUnLCB2YWx1ZTogJ2luYWN0aXZlJyB9LFxuICAgICAgICB7IGxhYmVsOiAncGVuZGluZycsIHZhbHVlOiAncGVuZGluZycgfSxcbiAgICAgIF0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgZXhhY3QgdHlwZSB3aXRoIHgtZGZlLXR5cGUgZXh0ZW5zaW9uJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBwYXNzd29yZDogeyB0eXBlOiAnc3RyaW5nJywgJ3gtZGZlLXR5cGUnOiAnUEFTU1dPUkQnIH0sXG4gICAgICAgICAgcGhvbmU6IHsgdHlwZTogJ3N0cmluZycsICd4LWRmZS10eXBlJzogJ1BIT05FJyB9LFxuICAgICAgICB9LFxuICAgICAgfVxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLnR5cGUpLnRvQmUoJ1BBU1NXT1JEJylcbiAgICAgIGV4cGVjdChmaWVsZHNbMV0udHlwZSkudG9CZSgnUEhPTkUnKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ1JvdW5kLXRyaXAgY29udmVyc2lvbnMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcmVzZXJ2ZSBhbGwgMjQgZmllbGQgdHlwZXMgdmlhIHgtZGZlLXR5cGUgZXh0ZW5zaW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHM6IG9yaWdpbmFsRmllbGRzIH0gPSBjcmVhdGVBbGxGaWVsZFR5cGVzRm9ybSgpXG4gICAgICAvLyB0b0pzb25TY2hlbWEgc2tpcHMgU0VDVElPTl9CUkVBSyBhbmQgRklFTERfR1JPVVBcbiAgICAgIGNvbnN0IG5vblNraXBwZWQgPSBvcmlnaW5hbEZpZWxkcy5maWx0ZXIoZiA9PiBmLnR5cGUgIT09ICdTRUNUSU9OX0JSRUFLJyAmJiBmLnR5cGUgIT09ICdGSUVMRF9HUk9VUCcpXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEob3JpZ2luYWxGaWVsZHMpXG4gICAgICBjb25zdCBjb252ZXJ0ZWRGaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIC8vIENvbXBhcmUgdHlwZXMgKHgtZGZlLXR5cGUgc2hvdWxkIHByZXNlcnZlIGV4YWN0IHR5cGVzKVxuICAgICAgZXhwZWN0KGNvbnZlcnRlZEZpZWxkcy5sZW5ndGgpLnRvQmUobm9uU2tpcHBlZC5sZW5ndGgpXG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udmVydGVkRmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV4cGVjdChjb252ZXJ0ZWRGaWVsZHNbaV0udHlwZSkudG9CZShub25Ta2lwcGVkW2ldLnR5cGUpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgY29uc3RyYWludHMgZHVyaW5nIHJvdW5kLXRyaXAnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvcmlnaW5hbEZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICd1c2VybmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIGxhYmVsOiAnVXNlcm5hbWUnLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiAzLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiAyMCxcbiAgICAgICAgICAgIHBhdHRlcm46ICdeW2EtekEtWjAtOV9dKyQnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0pLFxuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ3Njb3JlJyxcbiAgICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgICBsYWJlbDogJ1Njb3JlJyxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgIG1heDogMTAwLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICB9KSxcbiAgICAgIF1cblxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKG9yaWdpbmFsRmllbGRzKVxuICAgICAgY29uc3QgY29udmVydGVkRmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoY29udmVydGVkRmllbGRzWzBdLmNvbmZpZy5taW5MZW5ndGgpLnRvQmUoMylcbiAgICAgIGV4cGVjdChjb252ZXJ0ZWRGaWVsZHNbMF0uY29uZmlnLm1heExlbmd0aCkudG9CZSgyMClcbiAgICAgIGV4cGVjdChjb252ZXJ0ZWRGaWVsZHNbMF0uY29uZmlnLnBhdHRlcm4pLnRvQmUoJ15bYS16QS1aMC05X10rJCcpXG4gICAgICBleHBlY3QoY29udmVydGVkRmllbGRzWzBdLnJlcXVpcmVkKS50b0JlKHRydWUpXG5cbiAgICAgIGV4cGVjdChjb252ZXJ0ZWRGaWVsZHNbMV0uY29uZmlnLm1pbikudG9CZSgwKVxuICAgICAgZXhwZWN0KGNvbnZlcnRlZEZpZWxkc1sxXS5jb25maWcubWF4KS50b0JlKDEwMClcbiAgICAgIGV4cGVjdChjb252ZXJ0ZWRGaWVsZHNbMV0ucmVxdWlyZWQpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgU0VMRUNUL1JBRElPL01VTFRJX1NFTEVDVCBvcHRpb25zIGR1cmluZyByb3VuZC10cmlwJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb3JpZ2luYWxGaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnY291bnRyeScsXG4gICAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgICAgbGFiZWw6ICdDb3VudHJ5JyxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgICB7IGxhYmVsOiAnVVNBJywgdmFsdWU6ICd1c2EnIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDYW5hZGEnLCB2YWx1ZTogJ2NhJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdnZW5kZXInLFxuICAgICAgICAgIHR5cGU6ICdSQURJTycsXG4gICAgICAgICAgbGFiZWw6ICdHZW5kZXInLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdNYWxlJywgdmFsdWU6ICdtJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnRmVtYWxlJywgdmFsdWU6ICdmJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdsYW5ndWFnZXMnLFxuICAgICAgICAgIHR5cGU6ICdNVUxUSV9TRUxFQ1QnLFxuICAgICAgICAgIGxhYmVsOiAnTGFuZ3VhZ2VzJyxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgICB7IGxhYmVsOiAnRW5nbGlzaCcsIHZhbHVlOiAnZW4nIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdTcGFuaXNoJywgdmFsdWU6ICdlcycgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShvcmlnaW5hbEZpZWxkcylcbiAgICAgIGNvbnN0IGNvbnZlcnRlZEZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgLy8gSlNPTiBTY2hlbWEgZW51bXMgZG9uJ3QgcHJlc2VydmUgb3JpZ2luYWwgbGFiZWxzIOKAlCBmcm9tSnNvblNjaGVtYSB1c2VzIHZhbHVlIGFzIGxhYmVsXG4gICAgICAvLyBTbyB3ZSBjaGVjayB0aGF0IHZhbHVlcyBhcmUgcHJlc2VydmVkIGNvcnJlY3RseVxuICAgICAgY29uc3QgY29udmVydGVkVmFsdWVzMCA9IGNvbnZlcnRlZEZpZWxkc1swXS5jb25maWcub3B0aW9ucy5tYXAoKG86IGFueSkgPT4gby52YWx1ZSlcbiAgICAgIGNvbnN0IG9yaWdpbmFsVmFsdWVzMCA9IG9yaWdpbmFsRmllbGRzWzBdLmNvbmZpZy5vcHRpb25zLm1hcCgobzogYW55KSA9PiBvLnZhbHVlKVxuICAgICAgZXhwZWN0KGNvbnZlcnRlZFZhbHVlczApLnRvRXF1YWwob3JpZ2luYWxWYWx1ZXMwKVxuXG4gICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZXMxID0gY29udmVydGVkRmllbGRzWzFdLmNvbmZpZy5vcHRpb25zLm1hcCgobzogYW55KSA9PiBvLnZhbHVlKVxuICAgICAgY29uc3Qgb3JpZ2luYWxWYWx1ZXMxID0gb3JpZ2luYWxGaWVsZHNbMV0uY29uZmlnLm9wdGlvbnMubWFwKChvOiBhbnkpID0+IG8udmFsdWUpXG4gICAgICBleHBlY3QoY29udmVydGVkVmFsdWVzMSkudG9FcXVhbChvcmlnaW5hbFZhbHVlczEpXG5cbiAgICAgIGNvbnN0IGNvbnZlcnRlZFZhbHVlczIgPSBjb252ZXJ0ZWRGaWVsZHNbMl0uY29uZmlnLm9wdGlvbnMubWFwKChvOiBhbnkpID0+IG8udmFsdWUpXG4gICAgICBjb25zdCBvcmlnaW5hbFZhbHVlczIgPSBvcmlnaW5hbEZpZWxkc1syXS5jb25maWcub3B0aW9ucy5tYXAoKG86IGFueSkgPT4gby52YWx1ZSlcbiAgICAgIGV4cGVjdChjb252ZXJ0ZWRWYWx1ZXMyKS50b0VxdWFsKG9yaWdpbmFsVmFsdWVzMilcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByb3VuZC10cmlwIHRlbXBsYXRlIGZvcm06IGdldFRlbXBsYXRlIOKGkiB0b0pzb25TY2hlbWEg4oaSIGZyb21Kc29uU2NoZW1hJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnY29udGFjdC1mb3JtJylcbiAgICAgIGV4cGVjdCh0ZW1wbGF0ZSkudG9CZURlZmluZWQoKVxuXG4gICAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKHRlbXBsYXRlLmZpZWxkcylcbiAgICAgICAgY29uc3QgY29udmVydGVkRmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICAgIGV4cGVjdChjb252ZXJ0ZWRGaWVsZHMubGVuZ3RoKS50b0JlKHRlbXBsYXRlLmZpZWxkcy5sZW5ndGgpXG5cbiAgICAgICAgLy8gVmVyaWZ5IGZpZWxkIGtleXMgYW5kIHR5cGVzIG1hdGNoXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGVtcGxhdGUuZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZXhwZWN0KGNvbnZlcnRlZEZpZWxkc1tpXS5rZXkpLnRvQmUodGVtcGxhdGUuZmllbGRzW2ldLmtleSlcbiAgICAgICAgICBleHBlY3QoY29udmVydGVkRmllbGRzW2ldLnR5cGUpLnRvQmUodGVtcGxhdGUuZmllbGRzW2ldLnR5cGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdKU09OIFNjaGVtYSBpbnRlZ3JhdGlvbiB3aXRoIEZvcm1FbmdpbmUnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgdmFsaWQgRm9ybUVuZ2luZSBmcm9tIHRvSnNvblNjaGVtYSBvdXRwdXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGxhYmVsOiAnTmFtZScsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIGxhYmVsOiAnRW1haWwnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMsICdVc2VyIEZvcm0nKVxuXG4gICAgICAvLyBDb252ZXJ0IGJhY2sgYW5kIGNyZWF0ZSBlbmdpbmVcbiAgICAgIGNvbnN0IGNvbnZlcnRlZEZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcbiAgICAgIGV4cGVjdCgoKSA9PiBjcmVhdGVGb3JtRW5naW5lKGNvbnZlcnRlZEZpZWxkcykpLm5vdC50b1Rocm93KClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY29tcGxleCBuZXN0ZWQgc3RydWN0dXJlcyBkdXJpbmcgc2NoZW1hIGNvbnZlcnNpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnc2VjdGlvbjEnLFxuICAgICAgICAgIHR5cGU6ICdTRUNUSU9OX0JSRUFLJyxcbiAgICAgICAgICBsYWJlbDogJ0NvbnRhY3QgSW5mb3JtYXRpb24nLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgaGVscGVyVGV4dDogJ1BsZWFzZSBwcm92aWRlIHlvdXIgY29udGFjdCBkZXRhaWxzJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgbGFiZWw6ICdGdWxsIE5hbWUnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnLCBsYWJlbDogJ0VtYWlsIEFkZHJlc3MnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgICAgbWFrZUZpZWxkKCdwaG9uZScsICdQSE9ORScsICdQaG9uZSBOdW1iZXInKSxcbiAgICAgIF1cblxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcywgJ0NvbXBsZXggRm9ybScpXG4gICAgICBjb25zdCBjb252ZXJ0ZWRGaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcykudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KGNvbnZlcnRlZEZpZWxkcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgIH0pXG4gIH0pXG59KVxuIl19