"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_core_1 = require("@dmc-98/dfe-core");
const fixtures_1 = require("./helpers/fixtures");
(0, vitest_1.describe)('Import and Export Functionality', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, fixtures_1.resetFieldCounter)();
    });
    (0, vitest_1.describe)('exportForm', () => {
        (0, vitest_1.it)('should produce valid JSON parseable string', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const exported = (0, dfe_core_1.exportForm)(fields);
            (0, vitest_1.expect)(typeof exported).toBe('string');
            (0, vitest_1.expect)(() => JSON.parse(exported)).not.toThrow();
        });
        (0, vitest_1.it)('should include metadata by default', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const exported = (0, dfe_core_1.exportForm)(fields);
            const parsed = JSON.parse(exported);
            (0, vitest_1.expect)(parsed.metadata).toBeDefined();
            (0, vitest_1.expect)(parsed.metadata.exportedAt).toBeDefined();
            (0, vitest_1.expect)(parsed.metadata.version).toBeDefined();
        });
        (0, vitest_1.it)('should omit metadata when includeMetadata is false', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const exported = (0, dfe_core_1.exportForm)(fields, undefined, { includeMetadata: false });
            const parsed = JSON.parse(exported);
            (0, vitest_1.expect)(parsed.metadata).toBeUndefined();
        });
        (0, vitest_1.it)('should include fields array in export', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const exported = (0, dfe_core_1.exportForm)(fields);
            const parsed = JSON.parse(exported);
            (0, vitest_1.expect)(parsed.fields).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(parsed.fields)).toBe(true);
            (0, vitest_1.expect)(parsed.fields.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should preserve field properties in export', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'username', type: 'SHORT_TEXT', label: 'Username', required: true, config: { minLength: 3 } }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
                (0, fixtures_1.makeField)({ key: 'age', type: 'NUMBER', label: 'Age', config: { min: 18, max: 100 } }),
            ];
            const exported = (0, dfe_core_1.exportForm)(fields);
            const parsed = JSON.parse(exported);
            (0, vitest_1.expect)(parsed.fields[0].key).toBe('username');
            (0, vitest_1.expect)(parsed.fields[0].type).toBe('SHORT_TEXT');
            (0, vitest_1.expect)(parsed.fields[0].required).toBe(true);
            (0, vitest_1.expect)(parsed.fields[1].key).toBe('email');
            (0, vitest_1.expect)(parsed.fields[1].type).toBe('EMAIL');
            (0, vitest_1.expect)(parsed.fields[2].key).toBe('age');
        });
        (0, vitest_1.it)('should include steps array when provided', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email' }),
            ];
            const steps = [
                { id: 'step1', versionId: 'v1', title: 'Personal Info', order: 0 },
                { id: 'step2', versionId: 'v1', title: 'Contact Info', order: 1 },
            ];
            const exported = (0, dfe_core_1.exportForm)(fields, steps);
            const parsed = JSON.parse(exported);
            (0, vitest_1.expect)(parsed.steps).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(parsed.steps)).toBe(true);
            (0, vitest_1.expect)(parsed.steps.length).toBe(2);
            (0, vitest_1.expect)(parsed.steps[0].title).toBe('Personal Info');
        });
        (0, vitest_1.it)('should handle complex field types and constraints', () => {
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
                        ],
                    },
                }),
                (0, fixtures_1.makeField)({
                    key: 'skills',
                    type: 'MULTI_SELECT',
                    label: 'Skills',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'JavaScript', value: 'js' },
                            { label: 'Python', value: 'py' },
                        ],
                    },
                }),
            ];
            const exported = (0, dfe_core_1.exportForm)(fields);
            const parsed = JSON.parse(exported);
            (0, vitest_1.expect)(parsed.fields[0].config.options).toEqual([
                { label: 'USA', value: 'usa' },
                { label: 'Canada', value: 'ca' },
            ]);
            (0, vitest_1.expect)(parsed.fields[1].config.options).toEqual([
                { label: 'JavaScript', value: 'js' },
                { label: 'Python', value: 'py' },
            ]);
        });
    });
    (0, vitest_1.describe)('exportFormToYaml', () => {
        (0, vitest_1.it)('should produce YAML-like string structure', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const exported = (0, dfe_core_1.exportFormToYaml)(fields);
            (0, vitest_1.expect)(typeof exported).toBe('string');
            (0, vitest_1.expect)(exported.length).toBeGreaterThan(0);
            // YAML structure indicators
            (0, vitest_1.expect)(exported).toMatch(/[\s-]/);
        });
        (0, vitest_1.it)('should contain key:value pairs', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name' })];
            const exported = (0, dfe_core_1.exportFormToYaml)(fields);
            (0, vitest_1.expect)(exported).toContain('fields');
            (0, vitest_1.expect)(exported).toContain('key');
            (0, vitest_1.expect)(exported).toContain('type');
        });
        (0, vitest_1.it)('should use indentation for nested structures', () => {
            const fields = [(0, fixtures_1.makeField)({
                    key: 'country',
                    type: 'SELECT',
                    label: 'Country',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'USA', value: 'usa' },
                        ],
                    },
                })];
            const exported = (0, dfe_core_1.exportFormToYaml)(fields);
            (0, vitest_1.expect)(exported).toMatch(/  /);
        });
        (0, vitest_1.it)('should use dashes for arrays', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const exported = (0, dfe_core_1.exportFormToYaml)(fields);
            (0, vitest_1.expect)(exported).toContain('-');
        });
        (0, vitest_1.it)('should preserve field information in YAML', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'username', type: 'SHORT_TEXT', label: 'Username', required: true }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
            ];
            const exported = (0, dfe_core_1.exportFormToYaml)(fields);
            (0, vitest_1.expect)(exported).toContain('username');
            (0, vitest_1.expect)(exported).toContain('email');
            (0, vitest_1.expect)(exported).toContain('SHORT_TEXT');
            (0, vitest_1.expect)(exported).toContain('EMAIL');
        });
        (0, vitest_1.it)('should support steps in YAML export', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name' })];
            const steps = [{ id: 'step1', versionId: 'v1', title: 'Basic Info', order: 0 }];
            const exported = (0, dfe_core_1.exportFormToYaml)(fields, steps);
            (0, vitest_1.expect)(exported).toContain('steps');
            (0, vitest_1.expect)(exported).toContain('Basic Info');
        });
    });
    (0, vitest_1.describe)('exportFormToCsv', () => {
        (0, vitest_1.it)('should have header row with field keys', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email' }),
            ];
            const exported = (0, dfe_core_1.exportFormToCsv)(fields);
            (0, vitest_1.expect)(exported).toContain('name');
            (0, vitest_1.expect)(exported).toContain('email');
        });
        (0, vitest_1.it)('should contain CSV formatted content', () => {
            const { fields } = (0, fixtures_1.createContactForm)();
            const exported = (0, dfe_core_1.exportFormToCsv)(fields);
            (0, vitest_1.expect)(typeof exported).toBe('string');
            (0, vitest_1.expect)(exported).toContain('\n');
        });
        (0, vitest_1.it)('should have rows for field configurations', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name', required: true }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email' }),
            ];
            const exported = (0, dfe_core_1.exportFormToCsv)(fields);
            const lines = exported.split('\n');
            (0, vitest_1.expect)(lines.length).toBeGreaterThan(1);
        });
        (0, vitest_1.it)('should include field types in CSV', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email' }),
                (0, fixtures_1.makeField)({ key: 'age', type: 'NUMBER', label: 'Age' }),
            ];
            const exported = (0, dfe_core_1.exportFormToCsv)(fields);
            (0, vitest_1.expect)(exported).toContain('SHORT_TEXT');
            (0, vitest_1.expect)(exported).toContain('EMAIL');
            (0, vitest_1.expect)(exported).toContain('NUMBER');
        });
        (0, vitest_1.it)('should include field labels in CSV', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Full Name' }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email Address' }),
            ];
            const exported = (0, dfe_core_1.exportFormToCsv)(fields);
            (0, vitest_1.expect)(exported).toContain('Full Name');
            (0, vitest_1.expect)(exported).toContain('Email Address');
        });
        (0, vitest_1.it)('should support steps parameter in CSV export', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email' }),
            ];
            const exported = (0, dfe_core_1.exportFormToCsv)(fields);
            (0, vitest_1.expect)(typeof exported).toBe('string');
            (0, vitest_1.expect)(exported.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('importForm', () => {
        (0, vitest_1.it)('should parse JSON and return fields and steps', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name', required: true }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
            ];
            const exported = (0, dfe_core_1.exportForm)(fields, undefined, { includeMetadata: false });
            const result = (0, dfe_core_1.importForm)(exported);
            (0, vitest_1.expect)(result.fields).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(result.fields)).toBe(true);
            (0, vitest_1.expect)(result.fields.length).toBe(2);
        });
        (0, vitest_1.it)('should preserve field properties during import', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    label: 'Username',
                    required: true,
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
                    config: { min: 18, max: 100 },
                }),
            ];
            const exported = (0, dfe_core_1.exportForm)(fields, undefined, { includeMetadata: false });
            const result = (0, dfe_core_1.importForm)(exported);
            (0, vitest_1.expect)(result.fields[0].key).toBe('username');
            (0, vitest_1.expect)(result.fields[0].required).toBe(true);
            (0, vitest_1.expect)(result.fields[1].key).toBe('age');
        });
        (0, vitest_1.it)('should restore steps when included in export', () => {
            var _a, _b;
            const fields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email' }),
            ];
            const steps = [
                { id: 'step1', versionId: 'v1', title: 'Step 1', order: 0 },
                { id: 'step2', versionId: 'v1', title: 'Step 2', order: 1 },
            ];
            const exported = (0, dfe_core_1.exportForm)(fields, steps, { includeMetadata: false });
            const result = (0, dfe_core_1.importForm)(exported);
            (0, vitest_1.expect)(result.steps).toBeDefined();
            (0, vitest_1.expect)((_a = result.steps) === null || _a === void 0 ? void 0 : _a.length).toBe(2);
            (0, vitest_1.expect)((_b = result.steps) === null || _b === void 0 ? void 0 : _b[0].title).toBe('Step 1');
        });
        (0, vitest_1.it)('should handle complex field types during import', () => {
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
            ];
            const exported = (0, dfe_core_1.exportForm)(fields, undefined, { includeMetadata: false });
            const result = (0, dfe_core_1.importForm)(exported);
            (0, vitest_1.expect)(result.fields[0].config.options).toEqual([
                { label: 'USA', value: 'usa' },
                { label: 'Canada', value: 'ca' },
            ]);
            (0, vitest_1.expect)(result.fields[1].config.options).toEqual([
                { label: 'Male', value: 'm' },
                { label: 'Female', value: 'f' },
            ]);
        });
    });
    (0, vitest_1.describe)('Round-trip: exportForm → importForm', () => {
        (0, vitest_1.it)('should preserve fields during round-trip', () => {
            const originalFields = [
                (0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT', label: 'Full Name', required: true }),
                (0, fixtures_1.makeField)({ key: 'email', type: 'EMAIL', label: 'Email', required: true }),
                (0, fixtures_1.makeField)({ key: 'phone', type: 'PHONE', label: 'Phone' }),
                (0, fixtures_1.makeField)({ key: 'message', type: 'LONG_TEXT', label: 'Message', required: true }),
            ];
            const exported = (0, dfe_core_1.exportForm)(originalFields, undefined, { includeMetadata: false });
            const result = (0, dfe_core_1.importForm)(exported);
            (0, vitest_1.expect)(result.fields.length).toBe(originalFields.length);
            for (let i = 0; i < originalFields.length; i++) {
                (0, vitest_1.expect)(result.fields[i].key).toBe(originalFields[i].key);
                (0, vitest_1.expect)(result.fields[i].type).toBe(originalFields[i].type);
                (0, vitest_1.expect)(result.fields[i].label).toBe(originalFields[i].label);
                (0, vitest_1.expect)(result.fields[i].required).toBe(originalFields[i].required);
            }
        });
        (0, vitest_1.it)('should preserve all constraints during round-trip', () => {
            const originalFields = [
                (0, fixtures_1.makeField)({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    label: 'Username',
                    required: true,
                    config: {
                        minLength: 5,
                        maxLength: 30,
                        pattern: '^[a-z0-9_]+$',
                    },
                }),
                (0, fixtures_1.makeField)({
                    key: 'score',
                    type: 'NUMBER',
                    label: 'Score',
                    required: false,
                    config: {
                        min: 0,
                        max: 100,
                    },
                }),
            ];
            const exported = (0, dfe_core_1.exportForm)(originalFields, undefined, { includeMetadata: false });
            const result = (0, dfe_core_1.importForm)(exported);
            (0, vitest_1.expect)(result.fields[0].config.minLength).toBe(5);
            (0, vitest_1.expect)(result.fields[0].config.maxLength).toBe(30);
            (0, vitest_1.expect)(result.fields[0].config.pattern).toBe('^[a-z0-9_]+$');
            (0, vitest_1.expect)(result.fields[1].config.min).toBe(0);
            (0, vitest_1.expect)(result.fields[1].config.max).toBe(100);
        });
        (0, vitest_1.it)('should preserve options during round-trip', () => {
            const originalFields = [
                (0, fixtures_1.makeField)({
                    key: 'status',
                    type: 'SELECT',
                    label: 'Status',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                            { label: 'Pending', value: 'pending' },
                        ],
                    },
                }),
            ];
            const exported = (0, dfe_core_1.exportForm)(originalFields, undefined, { includeMetadata: false });
            const result = (0, dfe_core_1.importForm)(exported);
            (0, vitest_1.expect)(result.fields[0].config.options).toEqual(originalFields[0].config.options);
        });
    });
    (0, vitest_1.describe)('importFromTypeform', () => {
        (0, vitest_1.it)('should convert Typeform config to DFE fields', () => {
            const typeformConfig = {
                fields: [
                    {
                        ref: 'q1',
                        title: 'Your name',
                        type: 'short_text',
                        validations: { required: true },
                    },
                ],
            };
            const { fields } = (0, dfe_core_1.importFromTypeform)(typeformConfig);
            (0, vitest_1.expect)(Array.isArray(fields)).toBe(true);
            (0, vitest_1.expect)(fields.length).toBe(1);
        });
        (0, vitest_1.it)('should map Typeform field properties to DFE format', () => {
            const typeformConfig = {
                fields: [
                    {
                        ref: 'name_field',
                        title: 'Full Name',
                        type: 'short_text',
                        validations: { required: true },
                    },
                    {
                        ref: 'email_field',
                        title: 'Email Address',
                        type: 'email',
                        validations: { required: true },
                    },
                ],
            };
            const { fields } = (0, dfe_core_1.importFromTypeform)(typeformConfig);
            (0, vitest_1.expect)(fields.length).toBe(2);
            (0, vitest_1.expect)(fields[0].label).toBeDefined();
            (0, vitest_1.expect)(fields[0].required).toBe(true);
            (0, vitest_1.expect)(fields[1].label).toBeDefined();
            (0, vitest_1.expect)(fields[1].required).toBe(true);
        });
        (0, vitest_1.it)('should handle Typeform with multiple field types', () => {
            const typeformConfig = {
                fields: [
                    {
                        ref: 'q1',
                        title: 'Name',
                        type: 'short_text',
                        validations: { required: true },
                    },
                    {
                        ref: 'q2',
                        title: 'Message',
                        type: 'long_text',
                        validations: { required: false },
                    },
                    {
                        ref: 'q3',
                        title: 'Age',
                        type: 'number',
                        validations: { required: false },
                    },
                ],
            };
            const { fields } = (0, dfe_core_1.importFromTypeform)(typeformConfig);
            (0, vitest_1.expect)(fields.length).toBe(3);
            (0, vitest_1.expect)(fields.every((f) => f.key && f.type && f.label)).toBe(true);
        });
        (0, vitest_1.it)('should generate unique keys for DFE fields', () => {
            const typeformConfig = {
                fields: [
                    {
                        ref: 'name_q1',
                        title: 'Your name',
                        type: 'short_text',
                        validations: { required: true },
                    },
                    {
                        ref: 'email_q2',
                        title: 'Your email',
                        type: 'email',
                        validations: { required: true },
                    },
                ],
            };
            const { fields } = (0, dfe_core_1.importFromTypeform)(typeformConfig);
            (0, vitest_1.expect)(fields[0].key).not.toBe(fields[1].key);
        });
    });
    (0, vitest_1.describe)('importFromGoogleForms', () => {
        (0, vitest_1.it)('should convert Google Forms config to DFE fields', () => {
            const googleFormsConfig = {
                items: [
                    {
                        title: 'Your name',
                        questionItem: {
                            question: {
                                required: true,
                                textQuestion: { paragraph: false },
                            },
                        },
                    },
                ],
            };
            const { fields } = (0, dfe_core_1.importFromGoogleForms)(googleFormsConfig);
            (0, vitest_1.expect)(Array.isArray(fields)).toBe(true);
            (0, vitest_1.expect)(fields.length).toBe(1);
        });
        (0, vitest_1.it)('should map Google Forms field properties to DFE format', () => {
            const googleFormsConfig = {
                items: [
                    {
                        title: 'Full Name',
                        questionItem: {
                            question: {
                                required: true,
                                textQuestion: { paragraph: false },
                            },
                        },
                    },
                    {
                        title: 'Your message',
                        questionItem: {
                            question: {
                                required: false,
                                textQuestion: { paragraph: true },
                            },
                        },
                    },
                ],
            };
            const { fields } = (0, dfe_core_1.importFromGoogleForms)(googleFormsConfig);
            (0, vitest_1.expect)(fields.length).toBe(2);
            (0, vitest_1.expect)(fields[0].required).toBe(true);
            (0, vitest_1.expect)(fields[1].required).toBe(false);
        });
        (0, vitest_1.it)('should handle Google Forms with multiple question types', () => {
            const googleFormsConfig = {
                items: [
                    {
                        title: 'Your name',
                        questionItem: {
                            question: {
                                questionText: 'Your name',
                                required: true,
                                questionType: 'SHORT_ANSWER',
                                textQuestion: { paragraph: false },
                            },
                        },
                    },
                    {
                        title: 'Feedback',
                        questionItem: {
                            question: {
                                questionText: 'Feedback',
                                required: true,
                                questionType: 'PARAGRAPH',
                                textQuestion: { paragraph: true },
                            },
                        },
                    },
                    {
                        title: 'Age',
                        questionItem: {
                            question: {
                                questionText: 'Age',
                                required: false,
                                questionType: 'SHORT_ANSWER',
                                textQuestion: { paragraph: false },
                            },
                        },
                    },
                ],
            };
            const { fields } = (0, dfe_core_1.importFromGoogleForms)(googleFormsConfig);
            (0, vitest_1.expect)(fields.length).toBe(3);
            (0, vitest_1.expect)(fields.every((f) => f.key && f.type && f.label)).toBe(true);
        });
        (0, vitest_1.it)('should generate unique keys for all imported fields', () => {
            const googleFormsConfig = {
                items: [
                    {
                        title: 'Question 1',
                        questionItem: {
                            question: {
                                required: true,
                                textQuestion: { paragraph: false },
                            },
                        },
                    },
                    {
                        title: 'Question 2',
                        questionItem: {
                            question: {
                                required: false,
                                textQuestion: { paragraph: false },
                            },
                        },
                    },
                ],
            };
            const { fields } = (0, dfe_core_1.importFromGoogleForms)(googleFormsConfig);
            const keys = fields.map((f) => f.key);
            (0, vitest_1.expect)(new Set(keys).size).toBe(keys.length);
        });
    });
    (0, vitest_1.describe)('Integration: Complete import/export workflows', () => {
        (0, vitest_1.it)('should export template and re-import successfully', () => {
            const template = (0, dfe_core_1.getTemplate)('contact-form');
            (0, vitest_1.expect)(template).toBeDefined();
            if (template) {
                const exported = (0, dfe_core_1.exportForm)(template.fields, undefined, { includeMetadata: false });
                const result = (0, dfe_core_1.importForm)(exported);
                (0, vitest_1.expect)(result.fields.length).toBe(template.fields.length);
            }
        });
        (0, vitest_1.it)('should handle Typeform → DFE → export → import workflow', () => {
            const typeformConfig = {
                fields: [
                    {
                        ref: 'q1',
                        title: 'Your name',
                        type: 'short_text',
                        validations: { required: true },
                    },
                    {
                        ref: 'q2',
                        title: 'Your email',
                        type: 'email',
                        validations: { required: true },
                    },
                ],
            };
            // Import from Typeform
            const { fields } = (0, dfe_core_1.importFromTypeform)(typeformConfig);
            (0, vitest_1.expect)(fields.length).toBe(2);
            // Export to JSON
            const exported = (0, dfe_core_1.exportForm)(fields, undefined, { includeMetadata: false });
            // Re-import
            const reimported = (0, dfe_core_1.importForm)(exported);
            (0, vitest_1.expect)(reimported.fields.length).toBe(2);
            (0, vitest_1.expect)(reimported.fields[0].required).toBe(true);
            (0, vitest_1.expect)(reimported.fields[1].required).toBe(true);
        });
        (0, vitest_1.it)('should handle GoogleForms → DFE → CSV export workflow', () => {
            const googleFormsConfig = {
                items: [
                    {
                        title: 'Your name',
                        questionItem: {
                            question: {
                                required: true,
                                textQuestion: { paragraph: false },
                            },
                        },
                    },
                    {
                        title: 'Your message',
                        questionItem: {
                            question: {
                                required: true,
                                textQuestion: { paragraph: true },
                            },
                        },
                    },
                ],
            };
            // Import from Google Forms
            const { fields } = (0, dfe_core_1.importFromGoogleForms)(googleFormsConfig);
            // Export to CSV
            const csvExport = (0, dfe_core_1.exportFormToCsv)(fields);
            (0, vitest_1.expect)(typeof csvExport).toBe('string');
            (0, vitest_1.expect)(csvExport.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWV4cG9ydC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW1wb3J0LWV4cG9ydC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQXlEO0FBRXpELGtEQUk0QjtBQUM1QixpREFBb0Y7QUFFcEYsSUFBQSxpQkFBUSxFQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtJQUMvQyxJQUFBLG1CQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ2QsSUFBQSw0QkFBaUIsR0FBRSxDQUFBO0lBQ3JCLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxpQkFBUSxFQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7UUFDMUIsSUFBQSxXQUFFLEVBQUMsNENBQTRDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFBLDRCQUFpQixHQUFFLENBQUE7WUFDdEMsTUFBTSxRQUFRLEdBQUcsSUFBQSxxQkFBVSxFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRW5DLElBQUEsZUFBTSxFQUFDLE9BQU8sUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQ3RDLElBQUEsZUFBTSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDbEQsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDNUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtZQUN0QyxNQUFNLFFBQVEsR0FBRyxJQUFBLHFCQUFVLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFDbkMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUVuQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsUUFBUSxD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QyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDN0MsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QsIGJlZm9yZUVhY2ggfSBmcm9tICd2aXRlc3QnXG5pbXBvcnQgdHlwZSB7IEZvcm1TdGVwIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtY29yZSdcbmltcG9ydCB7XG4gIGV4cG9ydEZvcm0sIGV4cG9ydEZvcm1Ub1lhbWwsIGV4cG9ydEZvcm1Ub0NzdixcbiAgaW1wb3J0Rm9ybSwgaW1wb3J0RnJvbVR5cGVmb3JtLCBpbXBvcnRGcm9tR29vZ2xlRm9ybXMsXG4gIGdldFRlbXBsYXRlLFxufSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuaW1wb3J0IHsgbWFrZUZpZWxkLCByZXNldEZpZWxkQ291bnRlciwgY3JlYXRlQ29udGFjdEZvcm0gfSBmcm9tICcuL2hlbHBlcnMvZml4dHVyZXMnXG5cbmRlc2NyaWJlKCdJbXBvcnQgYW5kIEV4cG9ydCBGdW5jdGlvbmFsaXR5JywgKCkgPT4ge1xuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICByZXNldEZpZWxkQ291bnRlcigpXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2V4cG9ydEZvcm0nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm9kdWNlIHZhbGlkIEpTT04gcGFyc2VhYmxlIHN0cmluZycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBjcmVhdGVDb250YWN0Rm9ybSgpXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm0oZmllbGRzKVxuXG4gICAgICBleHBlY3QodHlwZW9mIGV4cG9ydGVkKS50b0JlKCdzdHJpbmcnKVxuICAgICAgZXhwZWN0KCgpID0+IEpTT04ucGFyc2UoZXhwb3J0ZWQpKS5ub3QudG9UaHJvdygpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSBtZXRhZGF0YSBieSBkZWZhdWx0JywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMgfSA9IGNyZWF0ZUNvbnRhY3RGb3JtKClcbiAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybShmaWVsZHMpXG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGV4cG9ydGVkKVxuXG4gICAgICBleHBlY3QocGFyc2VkLm1ldGFkYXRhKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QocGFyc2VkLm1ldGFkYXRhLmV4cG9ydGVkQXQpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChwYXJzZWQubWV0YWRhdGEudmVyc2lvbikudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG9taXQgbWV0YWRhdGEgd2hlbiBpbmNsdWRlTWV0YWRhdGEgaXMgZmFsc2UnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcyB9ID0gY3JlYXRlQ29udGFjdEZvcm0oKVxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtKGZpZWxkcywgdW5kZWZpbmVkLCB7IGluY2x1ZGVNZXRhZGF0YTogZmFsc2UgfSlcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoZXhwb3J0ZWQpXG5cbiAgICAgIGV4cGVjdChwYXJzZWQubWV0YWRhdGEpLnRvQmVVbmRlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgZmllbGRzIGFycmF5IGluIGV4cG9ydCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBjcmVhdGVDb250YWN0Rm9ybSgpXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm0oZmllbGRzKVxuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShleHBvcnRlZClcblxuICAgICAgZXhwZWN0KHBhcnNlZC5maWVsZHMpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHBhcnNlZC5maWVsZHMpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QocGFyc2VkLmZpZWxkcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByZXNlcnZlIGZpZWxkIHByb3BlcnRpZXMgaW4gZXhwb3J0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICd1c2VybmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgbGFiZWw6ICdVc2VybmFtZScsIHJlcXVpcmVkOiB0cnVlLCBjb25maWc6IHsgbWluTGVuZ3RoOiAzIH0gfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2VtYWlsJywgdHlwZTogJ0VNQUlMJywgbGFiZWw6ICdFbWFpbCcsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdhZ2UnLCB0eXBlOiAnTlVNQkVSJywgbGFiZWw6ICdBZ2UnLCBjb25maWc6IHsgbWluOiAxOCwgbWF4OiAxMDAgfSB9KSxcbiAgICAgIF1cblxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtKGZpZWxkcylcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoZXhwb3J0ZWQpXG5cbiAgICAgIGV4cGVjdChwYXJzZWQuZmllbGRzWzBdLmtleSkudG9CZSgndXNlcm5hbWUnKVxuICAgICAgZXhwZWN0KHBhcnNlZC5maWVsZHNbMF0udHlwZSkudG9CZSgnU0hPUlRfVEVYVCcpXG4gICAgICBleHBlY3QocGFyc2VkLmZpZWxkc1swXS5yZXF1aXJlZCkudG9CZSh0cnVlKVxuXG4gICAgICBleHBlY3QocGFyc2VkLmZpZWxkc1sxXS5rZXkpLnRvQmUoJ2VtYWlsJylcbiAgICAgIGV4cGVjdChwYXJzZWQuZmllbGRzWzFdLnR5cGUpLnRvQmUoJ0VNQUlMJylcblxuICAgICAgZXhwZWN0KHBhcnNlZC5maWVsZHNbMl0ua2V5KS50b0JlKCdhZ2UnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgc3RlcHMgYXJyYXkgd2hlbiBwcm92aWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgbGFiZWw6ICdOYW1lJyB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnLCBsYWJlbDogJ0VtYWlsJyB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHN0ZXBzID0gW1xuICAgICAgICB7IGlkOiAnc3RlcDEnLCB2ZXJzaW9uSWQ6ICd2MScsIHRpdGxlOiAnUGVyc29uYWwgSW5mbycsIG9yZGVyOiAwIH0sXG4gICAgICAgIHsgaWQ6ICdzdGVwMicsIHZlcnNpb25JZDogJ3YxJywgdGl0bGU6ICdDb250YWN0IEluZm8nLCBvcmRlcjogMSB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm0oZmllbGRzLCBzdGVwcylcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoZXhwb3J0ZWQpXG5cbiAgICAgIGV4cGVjdChwYXJzZWQuc3RlcHMpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHBhcnNlZC5zdGVwcykpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChwYXJzZWQuc3RlcHMubGVuZ3RoKS50b0JlKDIpXG4gICAgICBleHBlY3QocGFyc2VkLnN0ZXBzWzBdLnRpdGxlKS50b0JlKCdQZXJzb25hbCBJbmZvJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY29tcGxleCBmaWVsZCB0eXBlcyBhbmQgY29uc3RyYWludHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnY291bnRyeScsXG4gICAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgICAgbGFiZWw6ICdDb3VudHJ5JyxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgICB7IGxhYmVsOiAnVVNBJywgdmFsdWU6ICd1c2EnIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDYW5hZGEnLCB2YWx1ZTogJ2NhJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdza2lsbHMnLFxuICAgICAgICAgIHR5cGU6ICdNVUxUSV9TRUxFQ1QnLFxuICAgICAgICAgIGxhYmVsOiAnU2tpbGxzJyxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgICB7IGxhYmVsOiAnSmF2YVNjcmlwdCcsIHZhbHVlOiAnanMnIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdQeXRob24nLCB2YWx1ZTogJ3B5JyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cblxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtKGZpZWxkcylcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoZXhwb3J0ZWQpXG5cbiAgICAgIGV4cGVjdChwYXJzZWQuZmllbGRzWzBdLmNvbmZpZy5vcHRpb25zKS50b0VxdWFsKFtcbiAgICAgICAgeyBsYWJlbDogJ1VTQScsIHZhbHVlOiAndXNhJyB9LFxuICAgICAgICB7IGxhYmVsOiAnQ2FuYWRhJywgdmFsdWU6ICdjYScgfSxcbiAgICAgIF0pXG4gICAgICBleHBlY3QocGFyc2VkLmZpZWxkc1sxXS5jb25maWcub3B0aW9ucykudG9FcXVhbChbXG4gICAgICAgIHsgbGFiZWw6ICdKYXZhU2NyaXB0JywgdmFsdWU6ICdqcycgfSxcbiAgICAgICAgeyBsYWJlbDogJ1B5dGhvbicsIHZhbHVlOiAncHknIH0sXG4gICAgICBdKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2V4cG9ydEZvcm1Ub1lhbWwnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm9kdWNlIFlBTUwtbGlrZSBzdHJpbmcgc3RydWN0dXJlJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMgfSA9IGNyZWF0ZUNvbnRhY3RGb3JtKClcbiAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybVRvWWFtbChmaWVsZHMpXG5cbiAgICAgIGV4cGVjdCh0eXBlb2YgZXhwb3J0ZWQpLnRvQmUoJ3N0cmluZycpXG4gICAgICBleHBlY3QoZXhwb3J0ZWQubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcbiAgICAgIC8vIFlBTUwgc3RydWN0dXJlIGluZGljYXRvcnNcbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9NYXRjaCgvW1xccy1dLylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjb250YWluIGtleTp2YWx1ZSBwYWlycycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCBsYWJlbDogJ05hbWUnIH0pXVxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtVG9ZYW1sKGZpZWxkcylcblxuICAgICAgZXhwZWN0KGV4cG9ydGVkKS50b0NvbnRhaW4oJ2ZpZWxkcycpXG4gICAgICBleHBlY3QoZXhwb3J0ZWQpLnRvQ29udGFpbigna2V5JylcbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9Db250YWluKCd0eXBlJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB1c2UgaW5kZW50YXRpb24gZm9yIG5lc3RlZCBzdHJ1Y3R1cmVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2NvdW50cnknLFxuICAgICAgICB0eXBlOiAnU0VMRUNUJyxcbiAgICAgICAgbGFiZWw6ICdDb3VudHJ5JyxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBsYWJlbDogJ1VTQScsIHZhbHVlOiAndXNhJyB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KV1cbiAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybVRvWWFtbChmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9NYXRjaCgvICAvKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHVzZSBkYXNoZXMgZm9yIGFycmF5cycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBjcmVhdGVDb250YWN0Rm9ybSgpXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm1Ub1lhbWwoZmllbGRzKVxuXG4gICAgICBleHBlY3QoZXhwb3J0ZWQpLnRvQ29udGFpbignLScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgZmllbGQgaW5mb3JtYXRpb24gaW4gWUFNTCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAndXNlcm5hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGxhYmVsOiAnVXNlcm5hbWUnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnLCBsYWJlbDogJ0VtYWlsJywgcmVxdWlyZWQ6IHRydWUgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm1Ub1lhbWwoZmllbGRzKVxuXG4gICAgICBleHBlY3QoZXhwb3J0ZWQpLnRvQ29udGFpbigndXNlcm5hbWUnKVxuICAgICAgZXhwZWN0KGV4cG9ydGVkKS50b0NvbnRhaW4oJ2VtYWlsJylcbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9Db250YWluKCdTSE9SVF9URVhUJylcbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9Db250YWluKCdFTUFJTCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3VwcG9ydCBzdGVwcyBpbiBZQU1MIGV4cG9ydCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCBsYWJlbDogJ05hbWUnIH0pXVxuICAgICAgY29uc3Qgc3RlcHMgPSBbeyBpZDogJ3N0ZXAxJywgdmVyc2lvbklkOiAndjEnLCB0aXRsZTogJ0Jhc2ljIEluZm8nLCBvcmRlcjogMCB9XVxuXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm1Ub1lhbWwoZmllbGRzLCBzdGVwcylcblxuICAgICAgZXhwZWN0KGV4cG9ydGVkKS50b0NvbnRhaW4oJ3N0ZXBzJylcbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9Db250YWluKCdCYXNpYyBJbmZvJylcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdleHBvcnRGb3JtVG9Dc3YnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoYXZlIGhlYWRlciByb3cgd2l0aCBmaWVsZCBrZXlzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCBsYWJlbDogJ05hbWUnIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIGxhYmVsOiAnRW1haWwnIH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtVG9Dc3YoZmllbGRzKVxuXG4gICAgICBleHBlY3QoZXhwb3J0ZWQpLnRvQ29udGFpbignbmFtZScpXG4gICAgICBleHBlY3QoZXhwb3J0ZWQpLnRvQ29udGFpbignZW1haWwnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNvbnRhaW4gQ1NWIGZvcm1hdHRlZCBjb250ZW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMgfSA9IGNyZWF0ZUNvbnRhY3RGb3JtKClcbiAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybVRvQ3N2KGZpZWxkcylcblxuICAgICAgZXhwZWN0KHR5cGVvZiBleHBvcnRlZCkudG9CZSgnc3RyaW5nJylcbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9Db250YWluKCdcXG4nKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhdmUgcm93cyBmb3IgZmllbGQgY29uZmlndXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGxhYmVsOiAnTmFtZScsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIGxhYmVsOiAnRW1haWwnIH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtVG9Dc3YoZmllbGRzKVxuXG4gICAgICBjb25zdCBsaW5lcyA9IGV4cG9ydGVkLnNwbGl0KCdcXG4nKVxuICAgICAgZXhwZWN0KGxpbmVzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSBmaWVsZCB0eXBlcyBpbiBDU1YnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGxhYmVsOiAnTmFtZScgfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2VtYWlsJywgdHlwZTogJ0VNQUlMJywgbGFiZWw6ICdFbWFpbCcgfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2FnZScsIHR5cGU6ICdOVU1CRVInLCBsYWJlbDogJ0FnZScgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm1Ub0NzdihmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9Db250YWluKCdTSE9SVF9URVhUJylcbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9Db250YWluKCdFTUFJTCcpXG4gICAgICBleHBlY3QoZXhwb3J0ZWQpLnRvQ29udGFpbignTlVNQkVSJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIGZpZWxkIGxhYmVscyBpbiBDU1YnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGxhYmVsOiAnRnVsbCBOYW1lJyB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnLCBsYWJlbDogJ0VtYWlsIEFkZHJlc3MnIH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtVG9Dc3YoZmllbGRzKVxuXG4gICAgICBleHBlY3QoZXhwb3J0ZWQpLnRvQ29udGFpbignRnVsbCBOYW1lJylcbiAgICAgIGV4cGVjdChleHBvcnRlZCkudG9Db250YWluKCdFbWFpbCBBZGRyZXNzJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzdXBwb3J0IHN0ZXBzIHBhcmFtZXRlciBpbiBDU1YgZXhwb3J0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCBsYWJlbDogJ05hbWUnIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIGxhYmVsOiAnRW1haWwnIH0pLFxuICAgICAgXVxuXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm1Ub0NzdihmaWVsZHMpXG4gICAgICBleHBlY3QodHlwZW9mIGV4cG9ydGVkKS50b0JlKCdzdHJpbmcnKVxuICAgICAgZXhwZWN0KGV4cG9ydGVkLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnaW1wb3J0Rm9ybScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHBhcnNlIEpTT04gYW5kIHJldHVybiBmaWVsZHMgYW5kIHN0ZXBzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCBsYWJlbDogJ05hbWUnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnLCBsYWJlbDogJ0VtYWlsJywgcmVxdWlyZWQ6IHRydWUgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBleHBvcnRlZCA9IGV4cG9ydEZvcm0oZmllbGRzLCB1bmRlZmluZWQsIHsgaW5jbHVkZU1ldGFkYXRhOiBmYWxzZSB9KVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBpbXBvcnRGb3JtKGV4cG9ydGVkKVxuXG4gICAgICBleHBlY3QocmVzdWx0LmZpZWxkcykudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzdWx0LmZpZWxkcykpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuZmllbGRzLmxlbmd0aCkudG9CZSgyKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByZXNlcnZlIGZpZWxkIHByb3BlcnRpZXMgZHVyaW5nIGltcG9ydCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICd1c2VybmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIGxhYmVsOiAnVXNlcm5hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiAzLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiAyMCxcbiAgICAgICAgICAgIHBhdHRlcm46ICdeW2EtekEtWjAtOV9dKyQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2FnZScsXG4gICAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgICAgbGFiZWw6ICdBZ2UnLFxuICAgICAgICAgIGNvbmZpZzogeyBtaW46IDE4LCBtYXg6IDEwMCB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybShmaWVsZHMsIHVuZGVmaW5lZCwgeyBpbmNsdWRlTWV0YWRhdGE6IGZhbHNlIH0pXG4gICAgICBjb25zdCByZXN1bHQgPSBpbXBvcnRGb3JtKGV4cG9ydGVkKVxuXG4gICAgICBleHBlY3QocmVzdWx0LmZpZWxkc1swXS5rZXkpLnRvQmUoJ3VzZXJuYW1lJylcbiAgICAgIGV4cGVjdChyZXN1bHQuZmllbGRzWzBdLnJlcXVpcmVkKS50b0JlKHRydWUpXG5cbiAgICAgIGV4cGVjdChyZXN1bHQuZmllbGRzWzFdLmtleSkudG9CZSgnYWdlJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXN0b3JlIHN0ZXBzIHdoZW4gaW5jbHVkZWQgaW4gZXhwb3J0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCBsYWJlbDogJ05hbWUnIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIGxhYmVsOiAnRW1haWwnIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc3RlcHMgPSBbXG4gICAgICAgIHsgaWQ6ICdzdGVwMScsIHZlcnNpb25JZDogJ3YxJywgdGl0bGU6ICdTdGVwIDEnLCBvcmRlcjogMCB9LFxuICAgICAgICB7IGlkOiAnc3RlcDInLCB2ZXJzaW9uSWQ6ICd2MScsIHRpdGxlOiAnU3RlcCAyJywgb3JkZXI6IDEgfSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybShmaWVsZHMsIHN0ZXBzLCB7IGluY2x1ZGVNZXRhZGF0YTogZmFsc2UgfSlcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGltcG9ydEZvcm0oZXhwb3J0ZWQpXG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3RlcHMpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RlcHM/Lmxlbmd0aCkudG9CZSgyKVxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGVwcz8uWzBdLnRpdGxlKS50b0JlKCdTdGVwIDEnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBjb21wbGV4IGZpZWxkIHR5cGVzIGR1cmluZyBpbXBvcnQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnY291bnRyeScsXG4gICAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgICAgbGFiZWw6ICdDb3VudHJ5JyxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgICB7IGxhYmVsOiAnVVNBJywgdmFsdWU6ICd1c2EnIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDYW5hZGEnLCB2YWx1ZTogJ2NhJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdnZW5kZXInLFxuICAgICAgICAgIHR5cGU6ICdSQURJTycsXG4gICAgICAgICAgbGFiZWw6ICdHZW5kZXInLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdNYWxlJywgdmFsdWU6ICdtJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnRmVtYWxlJywgdmFsdWU6ICdmJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybShmaWVsZHMsIHVuZGVmaW5lZCwgeyBpbmNsdWRlTWV0YWRhdGE6IGZhbHNlIH0pXG4gICAgICBjb25zdCByZXN1bHQgPSBpbXBvcnRGb3JtKGV4cG9ydGVkKVxuXG4gICAgICBleHBlY3QocmVzdWx0LmZpZWxkc1swXS5jb25maWcub3B0aW9ucykudG9FcXVhbChbXG4gICAgICAgIHsgbGFiZWw6ICdVU0EnLCB2YWx1ZTogJ3VzYScgfSxcbiAgICAgICAgeyBsYWJlbDogJ0NhbmFkYScsIHZhbHVlOiAnY2EnIH0sXG4gICAgICBdKVxuICAgICAgZXhwZWN0KHJlc3VsdC5maWVsZHNbMV0uY29uZmlnLm9wdGlvbnMpLnRvRXF1YWwoW1xuICAgICAgICB7IGxhYmVsOiAnTWFsZScsIHZhbHVlOiAnbScgfSxcbiAgICAgICAgeyBsYWJlbDogJ0ZlbWFsZScsIHZhbHVlOiAnZicgfSxcbiAgICAgIF0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnUm91bmQtdHJpcDogZXhwb3J0Rm9ybSDihpIgaW1wb3J0Rm9ybScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHByZXNlcnZlIGZpZWxkcyBkdXJpbmcgcm91bmQtdHJpcCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9yaWdpbmFsRmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCBsYWJlbDogJ0Z1bGwgTmFtZScsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIGxhYmVsOiAnRW1haWwnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAncGhvbmUnLCB0eXBlOiAnUEhPTkUnLCBsYWJlbDogJ1Bob25lJyB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbWVzc2FnZScsIHR5cGU6ICdMT05HX1RFWFQnLCBsYWJlbDogJ01lc3NhZ2UnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIF1cblxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtKG9yaWdpbmFsRmllbGRzLCB1bmRlZmluZWQsIHsgaW5jbHVkZU1ldGFkYXRhOiBmYWxzZSB9KVxuICAgICAgY29uc3QgcmVzdWx0ID0gaW1wb3J0Rm9ybShleHBvcnRlZClcblxuICAgICAgZXhwZWN0KHJlc3VsdC5maWVsZHMubGVuZ3RoKS50b0JlKG9yaWdpbmFsRmllbGRzLmxlbmd0aClcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcmlnaW5hbEZpZWxkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBlY3QocmVzdWx0LmZpZWxkc1tpXS5rZXkpLnRvQmUob3JpZ2luYWxGaWVsZHNbaV0ua2V5KVxuICAgICAgICBleHBlY3QocmVzdWx0LmZpZWxkc1tpXS50eXBlKS50b0JlKG9yaWdpbmFsRmllbGRzW2ldLnR5cGUpXG4gICAgICAgIGV4cGVjdChyZXN1bHQuZmllbGRzW2ldLmxhYmVsKS50b0JlKG9yaWdpbmFsRmllbGRzW2ldLmxhYmVsKVxuICAgICAgICBleHBlY3QocmVzdWx0LmZpZWxkc1tpXS5yZXF1aXJlZCkudG9CZShvcmlnaW5hbEZpZWxkc1tpXS5yZXF1aXJlZClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcmVzZXJ2ZSBhbGwgY29uc3RyYWludHMgZHVyaW5nIHJvdW5kLXRyaXAnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvcmlnaW5hbEZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICd1c2VybmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIGxhYmVsOiAnVXNlcm5hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiA1LFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiAzMCxcbiAgICAgICAgICAgIHBhdHRlcm46ICdeW2EtejAtOV9dKyQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ3Njb3JlJyxcbiAgICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgICBsYWJlbDogJ1Njb3JlJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICBtYXg6IDEwMCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cblxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtKG9yaWdpbmFsRmllbGRzLCB1bmRlZmluZWQsIHsgaW5jbHVkZU1ldGFkYXRhOiBmYWxzZSB9KVxuICAgICAgY29uc3QgcmVzdWx0ID0gaW1wb3J0Rm9ybShleHBvcnRlZClcblxuICAgICAgZXhwZWN0KHJlc3VsdC5maWVsZHNbMF0uY29uZmlnLm1pbkxlbmd0aCkudG9CZSg1KVxuICAgICAgZXhwZWN0KHJlc3VsdC5maWVsZHNbMF0uY29uZmlnLm1heExlbmd0aCkudG9CZSgzMClcbiAgICAgIGV4cGVjdChyZXN1bHQuZmllbGRzWzBdLmNvbmZpZy5wYXR0ZXJuKS50b0JlKCdeW2EtejAtOV9dKyQnKVxuXG4gICAgICBleHBlY3QocmVzdWx0LmZpZWxkc1sxXS5jb25maWcubWluKS50b0JlKDApXG4gICAgICBleHBlY3QocmVzdWx0LmZpZWxkc1sxXS5jb25maWcubWF4KS50b0JlKDEwMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcmVzZXJ2ZSBvcHRpb25zIGR1cmluZyByb3VuZC10cmlwJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb3JpZ2luYWxGaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnc3RhdHVzJyxcbiAgICAgICAgICB0eXBlOiAnU0VMRUNUJyxcbiAgICAgICAgICBsYWJlbDogJ1N0YXR1cycsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0FjdGl2ZScsIHZhbHVlOiAnYWN0aXZlJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnSW5hY3RpdmUnLCB2YWx1ZTogJ2luYWN0aXZlJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnUGVuZGluZycsIHZhbHVlOiAncGVuZGluZycgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybShvcmlnaW5hbEZpZWxkcywgdW5kZWZpbmVkLCB7IGluY2x1ZGVNZXRhZGF0YTogZmFsc2UgfSlcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGltcG9ydEZvcm0oZXhwb3J0ZWQpXG5cbiAgICAgIGV4cGVjdChyZXN1bHQuZmllbGRzWzBdLmNvbmZpZy5vcHRpb25zKS50b0VxdWFsKG9yaWdpbmFsRmllbGRzWzBdLmNvbmZpZy5vcHRpb25zKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2ltcG9ydEZyb21UeXBlZm9ybScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNvbnZlcnQgVHlwZWZvcm0gY29uZmlnIHRvIERGRSBmaWVsZHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0eXBlZm9ybUNvbmZpZyA9IHtcbiAgICAgICAgZmllbGRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVmOiAncTEnLFxuICAgICAgICAgICAgdGl0bGU6ICdZb3VyIG5hbWUnLFxuICAgICAgICAgICAgdHlwZTogJ3Nob3J0X3RleHQnLFxuICAgICAgICAgICAgdmFsaWRhdGlvbnM6IHsgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCB7IGZpZWxkcyB9ID0gaW1wb3J0RnJvbVR5cGVmb3JtKHR5cGVmb3JtQ29uZmlnKVxuXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShmaWVsZHMpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoZmllbGRzLmxlbmd0aCkudG9CZSgxKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBUeXBlZm9ybSBmaWVsZCBwcm9wZXJ0aWVzIHRvIERGRSBmb3JtYXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0eXBlZm9ybUNvbmZpZyA9IHtcbiAgICAgICAgZmllbGRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVmOiAnbmFtZV9maWVsZCcsXG4gICAgICAgICAgICB0aXRsZTogJ0Z1bGwgTmFtZScsXG4gICAgICAgICAgICB0eXBlOiAnc2hvcnRfdGV4dCcsXG4gICAgICAgICAgICB2YWxpZGF0aW9uczogeyByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVmOiAnZW1haWxfZmllbGQnLFxuICAgICAgICAgICAgdGl0bGU6ICdFbWFpbCBBZGRyZXNzJyxcbiAgICAgICAgICAgIHR5cGU6ICdlbWFpbCcsXG4gICAgICAgICAgICB2YWxpZGF0aW9uczogeyByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBpbXBvcnRGcm9tVHlwZWZvcm0odHlwZWZvcm1Db25maWcpXG5cbiAgICAgIGV4cGVjdChmaWVsZHMubGVuZ3RoKS50b0JlKDIpXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmxhYmVsKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoZmllbGRzWzBdLnJlcXVpcmVkKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoZmllbGRzWzFdLmxhYmVsKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoZmllbGRzWzFdLnJlcXVpcmVkKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIFR5cGVmb3JtIHdpdGggbXVsdGlwbGUgZmllbGQgdHlwZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0eXBlZm9ybUNvbmZpZyA9IHtcbiAgICAgICAgZmllbGRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVmOiAncTEnLFxuICAgICAgICAgICAgdGl0bGU6ICdOYW1lJyxcbiAgICAgICAgICAgIHR5cGU6ICdzaG9ydF90ZXh0JyxcbiAgICAgICAgICAgIHZhbGlkYXRpb25zOiB7IHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWY6ICdxMicsXG4gICAgICAgICAgICB0aXRsZTogJ01lc3NhZ2UnLFxuICAgICAgICAgICAgdHlwZTogJ2xvbmdfdGV4dCcsXG4gICAgICAgICAgICB2YWxpZGF0aW9uczogeyByZXF1aXJlZDogZmFsc2UgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlZjogJ3EzJyxcbiAgICAgICAgICAgIHRpdGxlOiAnQWdlJyxcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgdmFsaWRhdGlvbnM6IHsgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgeyBmaWVsZHMgfSA9IGltcG9ydEZyb21UeXBlZm9ybSh0eXBlZm9ybUNvbmZpZylcblxuICAgICAgZXhwZWN0KGZpZWxkcy5sZW5ndGgpLnRvQmUoMylcbiAgICAgIGV4cGVjdChmaWVsZHMuZXZlcnkoKGYpID0+IGYua2V5ICYmIGYudHlwZSAmJiBmLmxhYmVsKSkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHVuaXF1ZSBrZXlzIGZvciBERkUgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgdHlwZWZvcm1Db25maWcgPSB7XG4gICAgICAgIGZpZWxkczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlZjogJ25hbWVfcTEnLFxuICAgICAgICAgICAgdGl0bGU6ICdZb3VyIG5hbWUnLFxuICAgICAgICAgICAgdHlwZTogJ3Nob3J0X3RleHQnLFxuICAgICAgICAgICAgdmFsaWRhdGlvbnM6IHsgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlZjogJ2VtYWlsX3EyJyxcbiAgICAgICAgICAgIHRpdGxlOiAnWW91ciBlbWFpbCcsXG4gICAgICAgICAgICB0eXBlOiAnZW1haWwnLFxuICAgICAgICAgICAgdmFsaWRhdGlvbnM6IHsgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCB7IGZpZWxkcyB9ID0gaW1wb3J0RnJvbVR5cGVmb3JtKHR5cGVmb3JtQ29uZmlnKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmtleSkubm90LnRvQmUoZmllbGRzWzFdLmtleSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdpbXBvcnRGcm9tR29vZ2xlRm9ybXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb252ZXJ0IEdvb2dsZSBGb3JtcyBjb25maWcgdG8gREZFIGZpZWxkcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGdvb2dsZUZvcm1zQ29uZmlnID0ge1xuICAgICAgICBpdGVtczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnWW91ciBuYW1lJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uSXRlbToge1xuICAgICAgICAgICAgICBxdWVzdGlvbjoge1xuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRleHRRdWVzdGlvbjogeyBwYXJhZ3JhcGg6IGZhbHNlIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBpbXBvcnRGcm9tR29vZ2xlRm9ybXMoZ29vZ2xlRm9ybXNDb25maWcpXG5cbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KGZpZWxkcykpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChmaWVsZHMubGVuZ3RoKS50b0JlKDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIEdvb2dsZSBGb3JtcyBmaWVsZCBwcm9wZXJ0aWVzIHRvIERGRSBmb3JtYXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBnb29nbGVGb3Jtc0NvbmZpZyA9IHtcbiAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0Z1bGwgTmFtZScsXG4gICAgICAgICAgICBxdWVzdGlvbkl0ZW06IHtcbiAgICAgICAgICAgICAgcXVlc3Rpb246IHtcbiAgICAgICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0ZXh0UXVlc3Rpb246IHsgcGFyYWdyYXBoOiBmYWxzZSB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnWW91ciBtZXNzYWdlJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uSXRlbToge1xuICAgICAgICAgICAgICBxdWVzdGlvbjoge1xuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0ZXh0UXVlc3Rpb246IHsgcGFyYWdyYXBoOiB0cnVlIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBpbXBvcnRGcm9tR29vZ2xlRm9ybXMoZ29vZ2xlRm9ybXNDb25maWcpXG5cbiAgICAgIGV4cGVjdChmaWVsZHMubGVuZ3RoKS50b0JlKDIpXG4gICAgICBleHBlY3QoZmllbGRzWzBdLnJlcXVpcmVkKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoZmllbGRzWzFdLnJlcXVpcmVkKS50b0JlKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBHb29nbGUgRm9ybXMgd2l0aCBtdWx0aXBsZSBxdWVzdGlvbiB0eXBlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGdvb2dsZUZvcm1zQ29uZmlnID0ge1xuICAgICAgICBpdGVtczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnWW91ciBuYW1lJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uSXRlbToge1xuICAgICAgICAgICAgICBxdWVzdGlvbjoge1xuICAgICAgICAgICAgICAgIHF1ZXN0aW9uVGV4dDogJ1lvdXIgbmFtZScsXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgcXVlc3Rpb25UeXBlOiAnU0hPUlRfQU5TV0VSJyxcbiAgICAgICAgICAgICAgICB0ZXh0UXVlc3Rpb246IHsgcGFyYWdyYXBoOiBmYWxzZSB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnRmVlZGJhY2snLFxuICAgICAgICAgICAgcXVlc3Rpb25JdGVtOiB7XG4gICAgICAgICAgICAgIHF1ZXN0aW9uOiB7XG4gICAgICAgICAgICAgICAgcXVlc3Rpb25UZXh0OiAnRmVlZGJhY2snLFxuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHF1ZXN0aW9uVHlwZTogJ1BBUkFHUkFQSCcsXG4gICAgICAgICAgICAgICAgdGV4dFF1ZXN0aW9uOiB7IHBhcmFncmFwaDogdHJ1ZSB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnQWdlJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uSXRlbToge1xuICAgICAgICAgICAgICBxdWVzdGlvbjoge1xuICAgICAgICAgICAgICAgIHF1ZXN0aW9uVGV4dDogJ0FnZScsXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHF1ZXN0aW9uVHlwZTogJ1NIT1JUX0FOU1dFUicsXG4gICAgICAgICAgICAgICAgdGV4dFF1ZXN0aW9uOiB7IHBhcmFncmFwaDogZmFsc2UgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgeyBmaWVsZHMgfSA9IGltcG9ydEZyb21Hb29nbGVGb3Jtcyhnb29nbGVGb3Jtc0NvbmZpZylcblxuICAgICAgZXhwZWN0KGZpZWxkcy5sZW5ndGgpLnRvQmUoMylcbiAgICAgIGV4cGVjdChmaWVsZHMuZXZlcnkoKGYpID0+IGYua2V5ICYmIGYudHlwZSAmJiBmLmxhYmVsKSkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHVuaXF1ZSBrZXlzIGZvciBhbGwgaW1wb3J0ZWQgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZ29vZ2xlRm9ybXNDb25maWcgPSB7XG4gICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdRdWVzdGlvbiAxJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uSXRlbToge1xuICAgICAgICAgICAgICBxdWVzdGlvbjoge1xuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRleHRRdWVzdGlvbjogeyBwYXJhZ3JhcGg6IGZhbHNlIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdRdWVzdGlvbiAyJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uSXRlbToge1xuICAgICAgICAgICAgICBxdWVzdGlvbjoge1xuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0ZXh0UXVlc3Rpb246IHsgcGFyYWdyYXBoOiBmYWxzZSB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCB7IGZpZWxkcyB9ID0gaW1wb3J0RnJvbUdvb2dsZUZvcm1zKGdvb2dsZUZvcm1zQ29uZmlnKVxuXG4gICAgICBjb25zdCBrZXlzID0gZmllbGRzLm1hcCgoZikgPT4gZi5rZXkpXG4gICAgICBleHBlY3QobmV3IFNldChrZXlzKS5zaXplKS50b0JlKGtleXMubGVuZ3RoKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0ludGVncmF0aW9uOiBDb21wbGV0ZSBpbXBvcnQvZXhwb3J0IHdvcmtmbG93cycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGV4cG9ydCB0ZW1wbGF0ZSBhbmQgcmUtaW1wb3J0IHN1Y2Nlc3NmdWxseScsICgpID0+IHtcbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoJ2NvbnRhY3QtZm9ybScpXG4gICAgICBleHBlY3QodGVtcGxhdGUpLnRvQmVEZWZpbmVkKClcblxuICAgICAgaWYgKHRlbXBsYXRlKSB7XG4gICAgICAgIGNvbnN0IGV4cG9ydGVkID0gZXhwb3J0Rm9ybSh0ZW1wbGF0ZS5maWVsZHMsIHVuZGVmaW5lZCwgeyBpbmNsdWRlTWV0YWRhdGE6IGZhbHNlIH0pXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGltcG9ydEZvcm0oZXhwb3J0ZWQpXG5cbiAgICAgICAgZXhwZWN0KHJlc3VsdC5maWVsZHMubGVuZ3RoKS50b0JlKHRlbXBsYXRlLmZpZWxkcy5sZW5ndGgpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIFR5cGVmb3JtIOKGkiBERkUg4oaSIGV4cG9ydCDihpIgaW1wb3J0IHdvcmtmbG93JywgKCkgPT4ge1xuICAgICAgY29uc3QgdHlwZWZvcm1Db25maWcgPSB7XG4gICAgICAgIGZpZWxkczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlZjogJ3ExJyxcbiAgICAgICAgICAgIHRpdGxlOiAnWW91ciBuYW1lJyxcbiAgICAgICAgICAgIHR5cGU6ICdzaG9ydF90ZXh0JyxcbiAgICAgICAgICAgIHZhbGlkYXRpb25zOiB7IHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWY6ICdxMicsXG4gICAgICAgICAgICB0aXRsZTogJ1lvdXIgZW1haWwnLFxuICAgICAgICAgICAgdHlwZTogJ2VtYWlsJyxcbiAgICAgICAgICAgIHZhbGlkYXRpb25zOiB7IHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH1cblxuICAgICAgLy8gSW1wb3J0IGZyb20gVHlwZWZvcm1cbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBpbXBvcnRGcm9tVHlwZWZvcm0odHlwZWZvcm1Db25maWcpXG4gICAgICBleHBlY3QoZmllbGRzLmxlbmd0aCkudG9CZSgyKVxuXG4gICAgICAvLyBFeHBvcnQgdG8gSlNPTlxuICAgICAgY29uc3QgZXhwb3J0ZWQgPSBleHBvcnRGb3JtKGZpZWxkcywgdW5kZWZpbmVkLCB7IGluY2x1ZGVNZXRhZGF0YTogZmFsc2UgfSlcblxuICAgICAgLy8gUmUtaW1wb3J0XG4gICAgICBjb25zdCByZWltcG9ydGVkID0gaW1wb3J0Rm9ybShleHBvcnRlZClcblxuICAgICAgZXhwZWN0KHJlaW1wb3J0ZWQuZmllbGRzLmxlbmd0aCkudG9CZSgyKVxuICAgICAgZXhwZWN0KHJlaW1wb3J0ZWQuZmllbGRzWzBdLnJlcXVpcmVkKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QocmVpbXBvcnRlZC5maWVsZHNbMV0ucmVxdWlyZWQpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgR29vZ2xlRm9ybXMg4oaSIERGRSDihpIgQ1NWIGV4cG9ydCB3b3JrZmxvdycsICgpID0+IHtcbiAgICAgIGNvbnN0IGdvb2dsZUZvcm1zQ29uZmlnID0ge1xuICAgICAgICBpdGVtczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnWW91ciBuYW1lJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uSXRlbToge1xuICAgICAgICAgICAgICBxdWVzdGlvbjoge1xuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRleHRRdWVzdGlvbjogeyBwYXJhZ3JhcGg6IGZhbHNlIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdZb3VyIG1lc3NhZ2UnLFxuICAgICAgICAgICAgcXVlc3Rpb25JdGVtOiB7XG4gICAgICAgICAgICAgIHF1ZXN0aW9uOiB7XG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdGV4dFF1ZXN0aW9uOiB7IHBhcmFncmFwaDogdHJ1ZSB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfVxuXG4gICAgICAvLyBJbXBvcnQgZnJvbSBHb29nbGUgRm9ybXNcbiAgICAgIGNvbnN0IHsgZmllbGRzIH0gPSBpbXBvcnRGcm9tR29vZ2xlRm9ybXMoZ29vZ2xlRm9ybXNDb25maWcpXG5cbiAgICAgIC8vIEV4cG9ydCB0byBDU1ZcbiAgICAgIGNvbnN0IGNzdkV4cG9ydCA9IGV4cG9ydEZvcm1Ub0NzdihmaWVsZHMpXG5cbiAgICAgIGV4cGVjdCh0eXBlb2YgY3N2RXhwb3J0KS50b0JlKCdzdHJpbmcnKVxuICAgICAgZXhwZWN0KGNzdkV4cG9ydC5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgIH0pXG4gIH0pXG59KVxuIl19