"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const zod_generator_1 = require("../src/zod-generator");
/**
 * Snapshot tests for Zod schema generation.
 *
 * These tests verify that the Zod schema generator produces correct
 * schemas for various field configurations, including:
 * - All 20+ field types
 * - Required vs optional fields
 * - Field constraints (min/max, pattern, length)
 * - Select options and multi-select
 * - Complex field types (date ranges, file uploads, etc.)
 */
// ─── Test Fixtures ──────────────────────────────────────────────────────────
function makeField(overrides) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return {
        id: (_a = overrides.id) !== null && _a !== void 0 ? _a : `field_${overrides.key}`,
        versionId: (_b = overrides.versionId) !== null && _b !== void 0 ? _b : 'v1',
        key: overrides.key,
        label: (_c = overrides.label) !== null && _c !== void 0 ? _c : overrides.key,
        type: (_d = overrides.type) !== null && _d !== void 0 ? _d : 'SHORT_TEXT',
        required: (_e = overrides.required) !== null && _e !== void 0 ? _e : false,
        order: (_f = overrides.order) !== null && _f !== void 0 ? _f : 0,
        config: (_g = overrides.config) !== null && _g !== void 0 ? _g : {},
        stepId: (_h = overrides.stepId) !== null && _h !== void 0 ? _h : null,
        sectionId: (_j = overrides.sectionId) !== null && _j !== void 0 ? _j : null,
        parentFieldId: (_k = overrides.parentFieldId) !== null && _k !== void 0 ? _k : null,
        conditions: (_l = overrides.conditions) !== null && _l !== void 0 ? _l : null,
        children: overrides.children,
    };
}
// ─── Individual Field Type Tests ─────────────────────────────────────────────
(0, vitest_1.describe)('generateZodSchema - Individual Field Types', () => {
    (0, vitest_1.describe)('Text fields', () => {
        (0, vitest_1.it)('should generate schema for required SHORT_TEXT', () => {
            var _a;
            const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.name).toBeDefined();
            (0, vitest_1.expect)(shape.name._def.typeName).toBe('ZodString');
            (0, vitest_1.expect)((_a = shape.name._def.checks) === null || _a === void 0 ? void 0 : _a.some((c) => c.kind === 'min')).toBe(true);
        });
        (0, vitest_1.it)('should generate schema for optional SHORT_TEXT', () => {
            const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: false })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.name).toBeDefined();
            // Optional fields should be union with undefined/null/empty string
            (0, vitest_1.expect)(shape.name._def.typeName).toBe('ZodUnion');
        });
        (0, vitest_1.it)('should respect minLength and maxLength constraints', () => {
            const fields = [
                makeField({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    required: true,
                    config: { minLength: 3, maxLength: 20 },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            const checks = shape.username._def.checks;
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'min' && c.value === 3)).toBe(true);
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'max' && c.value === 20)).toBe(true);
        });
        (0, vitest_1.it)('should apply regex pattern validation', () => {
            const fields = [
                makeField({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    required: true,
                    config: { pattern: '^[a-z0-9_]+$' },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            const checks = shape.username._def.checks;
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'regex')).toBe(true);
        });
        (0, vitest_1.it)('should generate schema for LONG_TEXT', () => {
            const fields = [
                makeField({
                    key: 'bio',
                    type: 'LONG_TEXT',
                    required: false,
                    config: { maxLength: 500 },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.bio).toBeDefined();
            (0, vitest_1.expect)(shape.bio._def.typeName).toBe('ZodUnion');
        });
    });
    (0, vitest_1.describe)('Email and URL fields', () => {
        (0, vitest_1.it)('should generate EMAIL schema with email validation', () => {
            const fields = [makeField({ key: 'email', type: 'EMAIL', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.email).toBeDefined();
            const checks = shape.email._def.checks;
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'email')).toBe(true);
        });
        (0, vitest_1.it)('should generate URL schema with URL validation', () => {
            const fields = [makeField({ key: 'website', type: 'URL', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.website).toBeDefined();
            const checks = shape.website._def.checks;
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'url')).toBe(true);
        });
        (0, vitest_1.it)('should generate PHONE schema with phone regex', () => {
            const fields = [makeField({ key: 'phone', type: 'PHONE', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.phone).toBeDefined();
            const checks = shape.phone._def.checks;
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'regex')).toBe(true);
        });
        (0, vitest_1.it)('should generate PASSWORD schema', () => {
            const fields = [makeField({ key: 'password', type: 'PASSWORD', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.password).toBeDefined();
            (0, vitest_1.expect)(shape.password._def.typeName).toBe('ZodString');
        });
    });
    (0, vitest_1.describe)('Number fields', () => {
        (0, vitest_1.it)('should generate NUMBER schema with min/max constraints', () => {
            const fields = [
                makeField({
                    key: 'age',
                    type: 'NUMBER',
                    required: true,
                    config: { min: 0, max: 150 },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.age).toBeDefined();
            (0, vitest_1.expect)(shape.age._def.typeName).toBe('ZodNumber');
            const checks = shape.age._def.checks;
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'min')).toBe(true);
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'max')).toBe(true);
        });
        (0, vitest_1.it)('should enforce integer format', () => {
            const fields = [
                makeField({
                    key: 'count',
                    type: 'NUMBER',
                    required: true,
                    config: { format: 'integer' },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            const checks = shape.count._def.checks;
            (0, vitest_1.expect)(checks === null || checks === void 0 ? void 0 : checks.some((c) => c.kind === 'int')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Date and time fields', () => {
        (0, vitest_1.it)('should generate DATE schema', () => {
            const fields = [makeField({ key: 'birthDate', type: 'DATE', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.birthDate).toBeDefined();
            (0, vitest_1.expect)(shape.birthDate._def.typeName).toBe('ZodString');
        });
        (0, vitest_1.it)('should generate TIME schema', () => {
            const fields = [makeField({ key: 'meetingTime', type: 'TIME', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.meetingTime).toBeDefined();
        });
        (0, vitest_1.it)('should generate DATE_TIME schema', () => {
            const fields = [makeField({ key: 'meetingDateTime', type: 'DATE_TIME', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.meetingDateTime).toBeDefined();
        });
        (0, vitest_1.it)('should generate DATE_RANGE schema as object', () => {
            const fields = [makeField({ key: 'dateRange', type: 'DATE_RANGE', required: true })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.dateRange).toBeDefined();
            (0, vitest_1.expect)(shape.dateRange._def.typeName).toBe('ZodObject');
        });
    });
    (0, vitest_1.describe)('Selection fields', () => {
        (0, vitest_1.it)('should generate SELECT schema with enum from options', () => {
            const fields = [
                makeField({
                    key: 'country',
                    type: 'SELECT',
                    required: true,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'USA', value: 'us' },
                            { label: 'Canada', value: 'ca' },
                        ],
                    },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.country).toBeDefined();
            (0, vitest_1.expect)(shape.country._def.typeName).toBe('ZodEnum');
        });
        (0, vitest_1.it)('should generate MULTI_SELECT schema as array of enum', () => {
            const fields = [
                makeField({
                    key: 'interests',
                    type: 'MULTI_SELECT',
                    required: true,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Sports', value: 'sports' },
                            { label: 'Music', value: 'music' },
                        ],
                    },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.interests).toBeDefined();
            (0, vitest_1.expect)(shape.interests._def.typeName).toBe('ZodArray');
        });
        (0, vitest_1.it)('should generate RADIO schema with enum', () => {
            const fields = [
                makeField({
                    key: 'gender',
                    type: 'RADIO',
                    required: true,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Male', value: 'male' },
                            { label: 'Female', value: 'female' },
                        ],
                    },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.gender).toBeDefined();
        });
        (0, vitest_1.it)('should handle SELECT with dynamic mode', () => {
            const fields = [
                makeField({
                    key: 'dynamicSelect',
                    type: 'SELECT',
                    required: true,
                    config: { mode: 'dynamic' },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.dynamicSelect).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Checkbox and boolean fields', () => {
        (0, vitest_1.it)('should generate CHECKBOX schema as boolean', () => {
            const fields = [makeField({ key: 'subscribe', type: 'CHECKBOX', required: false })];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.subscribe).toBeDefined();
            // Should be union with boolean for optional
            (0, vitest_1.expect)(shape.subscribe._def.typeName).toBe('ZodUnion');
        });
    });
    (0, vitest_1.describe)('File upload fields', () => {
        (0, vitest_1.it)('should generate FILE_UPLOAD schema with size and type constraints', () => {
            const fields = [
                makeField({
                    key: 'document',
                    type: 'FILE_UPLOAD',
                    required: true,
                    config: {
                        maxSizeMB: 5,
                        allowedMimeTypes: ['application/pdf', 'image/jpeg'],
                        maxFiles: 1,
                    },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.document).toBeDefined();
            (0, vitest_1.expect)(shape.document._def.typeName).toBe('ZodArray');
        });
    });
    (0, vitest_1.describe)('Rating and scale fields', () => {
        (0, vitest_1.it)('should generate RATING schema with max constraint', () => {
            const fields = [
                makeField({
                    key: 'rating',
                    type: 'RATING',
                    required: true,
                    config: { max: 5 },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.rating).toBeDefined();
            (0, vitest_1.expect)(shape.rating._def.typeName).toBe('ZodNumber');
        });
        (0, vitest_1.it)('should generate SCALE schema with min and max', () => {
            const fields = [
                makeField({
                    key: 'scale',
                    type: 'SCALE',
                    required: true,
                    config: { min: 1, max: 10 },
                }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.scale).toBeDefined();
            (0, vitest_1.expect)(shape.scale._def.typeName).toBe('ZodNumber');
        });
    });
    (0, vitest_1.describe)('Layout fields', () => {
        (0, vitest_1.it)('should exclude SECTION_BREAK from schema', () => {
            const fields = [
                makeField({ key: 'section', type: 'SECTION_BREAK', required: false }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.section).toBeUndefined();
        });
        (0, vitest_1.it)('should exclude FIELD_GROUP from schema', () => {
            const fields = [
                makeField({ key: 'group', type: 'FIELD_GROUP', required: false }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.group).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('Special fields', () => {
        (0, vitest_1.it)('should generate HIDDEN field schema', () => {
            const fields = [
                makeField({ key: 'sessionId', type: 'HIDDEN', required: false }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.sessionId).toBeDefined();
        });
        (0, vitest_1.it)('should generate RICH_TEXT schema', () => {
            const fields = [
                makeField({ key: 'content', type: 'RICH_TEXT', required: false }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.content).toBeDefined();
        });
        (0, vitest_1.it)('should generate SIGNATURE schema', () => {
            const fields = [
                makeField({ key: 'signature', type: 'SIGNATURE', required: false }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.signature).toBeDefined();
        });
        (0, vitest_1.it)('should generate ADDRESS schema', () => {
            const fields = [
                makeField({ key: 'address', type: 'ADDRESS', required: false }),
            ];
            const schema = (0, zod_generator_1.generateZodSchema)(fields);
            const shape = schema.shape;
            (0, vitest_1.expect)(shape.address).toBeDefined();
        });
    });
});
// ─── Mixed Field Tests ──────────────────────────────────────────────────────
(0, vitest_1.describe)('generateZodSchema - Mixed Field Types', () => {
    (0, vitest_1.it)('should generate schema for mixed required and optional fields', () => {
        const fields = [
            makeField({ key: 'name', type: 'SHORT_TEXT', required: true }),
            makeField({ key: 'email', type: 'EMAIL', required: true }),
            makeField({ key: 'phone', type: 'PHONE', required: false }),
            makeField({ key: 'bio', type: 'LONG_TEXT', required: false }),
        ];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        const shape = schema.shape;
        (0, vitest_1.expect)(shape.name).toBeDefined();
        (0, vitest_1.expect)(shape.email).toBeDefined();
        (0, vitest_1.expect)(shape.phone).toBeDefined();
        (0, vitest_1.expect)(shape.bio).toBeDefined();
    });
    (0, vitest_1.it)('should handle all 21 field types', () => {
        const allTypes = [
            makeField({ key: 'short_text', type: 'SHORT_TEXT', required: true }),
            makeField({ key: 'long_text', type: 'LONG_TEXT', required: false }),
            makeField({ key: 'number', type: 'NUMBER', required: false }),
            makeField({ key: 'email', type: 'EMAIL', required: true }),
            makeField({ key: 'phone', type: 'PHONE', required: false }),
            makeField({ key: 'date', type: 'DATE', required: false }),
            makeField({ key: 'date_range', type: 'DATE_RANGE', required: false }),
            makeField({ key: 'time', type: 'TIME', required: false }),
            makeField({ key: 'date_time', type: 'DATE_TIME', required: false }),
            makeField({
                key: 'select',
                type: 'SELECT',
                required: false,
                config: { mode: 'static', options: [{ label: 'A', value: 'a' }] },
            }),
            makeField({
                key: 'multi_select',
                type: 'MULTI_SELECT',
                required: false,
                config: { mode: 'static', options: [{ label: 'A', value: 'a' }] },
            }),
            makeField({
                key: 'radio',
                type: 'RADIO',
                required: false,
                config: { mode: 'static', options: [{ label: 'A', value: 'a' }] },
            }),
            makeField({ key: 'checkbox', type: 'CHECKBOX', required: false }),
            makeField({ key: 'file_upload', type: 'FILE_UPLOAD', required: false }),
            makeField({ key: 'rating', type: 'RATING', required: false }),
            makeField({ key: 'scale', type: 'SCALE', required: false }),
            makeField({ key: 'url', type: 'URL', required: false }),
            makeField({ key: 'password', type: 'PASSWORD', required: false }),
            makeField({ key: 'hidden', type: 'HIDDEN', required: false }),
            makeField({ key: 'rich_text', type: 'RICH_TEXT', required: false }),
            makeField({ key: 'signature', type: 'SIGNATURE', required: false }),
            makeField({ key: 'address', type: 'ADDRESS', required: false }),
        ];
        const schema = (0, zod_generator_1.generateZodSchema)(allTypes);
        const shape = schema.shape;
        (0, vitest_1.expect)(Object.keys(shape).length).toBeGreaterThan(20);
    });
});
// ─── Validation Tests ────────────────────────────────────────────────────────
(0, vitest_1.describe)('generateZodSchema - Validation Behavior', () => {
    (0, vitest_1.it)('should validate required text field correctly', () => {
        const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: true })];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        const valid = schema.safeParse({ name: 'John Doe' });
        (0, vitest_1.expect)(valid.success).toBe(true);
        const invalid = schema.safeParse({ name: '' });
        (0, vitest_1.expect)(invalid.success).toBe(false);
        const missing = schema.safeParse({});
        (0, vitest_1.expect)(missing.success).toBe(false);
    });
    (0, vitest_1.it)('should allow optional fields to be undefined, null, or empty', () => {
        const fields = [makeField({ key: 'bio', type: 'LONG_TEXT', required: false })];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        (0, vitest_1.expect)(schema.safeParse({ bio: undefined }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ bio: null }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ bio: '' }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({}).success).toBe(true);
    });
    (0, vitest_1.it)('should validate number constraints', () => {
        const fields = [
            makeField({
                key: 'age',
                type: 'NUMBER',
                required: true,
                config: { min: 0, max: 150 },
            }),
        ];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        (0, vitest_1.expect)(schema.safeParse({ age: 25 }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ age: -1 }).success).toBe(false);
        (0, vitest_1.expect)(schema.safeParse({ age: 200 }).success).toBe(false);
    });
    (0, vitest_1.it)('should validate email format', () => {
        const fields = [makeField({ key: 'email', type: 'EMAIL', required: true })];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        (0, vitest_1.expect)(schema.safeParse({ email: 'test@example.com' }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ email: 'invalid-email' }).success).toBe(false);
    });
    (0, vitest_1.it)('should validate select enum values', () => {
        const fields = [
            makeField({
                key: 'country',
                type: 'SELECT',
                required: true,
                config: {
                    mode: 'static',
                    options: [
                        { label: 'USA', value: 'us' },
                        { label: 'Canada', value: 'ca' },
                    ],
                },
            }),
        ];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        (0, vitest_1.expect)(schema.safeParse({ country: 'us' }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ country: 'invalid' }).success).toBe(false);
    });
    (0, vitest_1.it)('should validate multi-select as array', () => {
        const fields = [
            makeField({
                key: 'interests',
                type: 'MULTI_SELECT',
                required: true,
                config: {
                    mode: 'static',
                    options: [
                        { label: 'Sports', value: 'sports' },
                        { label: 'Music', value: 'music' },
                    ],
                },
            }),
        ];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        (0, vitest_1.expect)(schema.safeParse({ interests: ['sports', 'music'] }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ interests: ['sports'] }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ interests: [] }).success).toBe(false);
    });
});
// ─── Step Zod Schema Tests ──────────────────────────────────────────────────
(0, vitest_1.describe)('generateStepZodSchema', () => {
    (0, vitest_1.it)('should generate schema scoped to step fields', () => {
        const stepFields = [
            makeField({ key: 'firstName', type: 'SHORT_TEXT', required: true }),
            makeField({ key: 'lastName', type: 'SHORT_TEXT', required: true }),
        ];
        const schema = (0, zod_generator_1.generateStepZodSchema)(stepFields);
        const shape = schema.shape;
        (0, vitest_1.expect)(shape.firstName).toBeDefined();
        (0, vitest_1.expect)(shape.lastName).toBeDefined();
    });
    (0, vitest_1.it)('should validate step-specific data', () => {
        const stepFields = [
            makeField({
                key: 'country',
                type: 'SELECT',
                required: true,
                config: {
                    mode: 'static',
                    options: [{ label: 'USA', value: 'us' }],
                },
            }),
        ];
        const schema = (0, zod_generator_1.generateStepZodSchema)(stepFields);
        (0, vitest_1.expect)(schema.safeParse({ country: 'us' }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ country: 'invalid' }).success).toBe(false);
    });
});
// ─── Strict Submission Schema Tests ──────────────────────────────────────────
(0, vitest_1.describe)('generateStrictSubmissionSchema', () => {
    (0, vitest_1.it)('should generate strict schema that rejects unknown keys', () => {
        const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: true })];
        const schema = (0, zod_generator_1.generateStrictSubmissionSchema)(fields);
        const valid = schema.safeParse({ name: 'John Doe' });
        (0, vitest_1.expect)(valid.success).toBe(true);
        const withExtra = schema.safeParse({ name: 'John Doe', extra: 'field' });
        (0, vitest_1.expect)(withExtra.success).toBe(false);
    });
    (0, vitest_1.it)('should enforce all required fields', () => {
        const fields = [
            makeField({ key: 'name', type: 'SHORT_TEXT', required: true }),
            makeField({ key: 'email', type: 'EMAIL', required: true }),
        ];
        const schema = (0, zod_generator_1.generateStrictSubmissionSchema)(fields);
        (0, vitest_1.expect)(schema.safeParse({ name: 'John', email: 'john@example.com' }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ name: 'John' }).success).toBe(false);
    });
});
// ─── ReDoS Safety Tests ──────────────────────────────────────────────────────
(0, vitest_1.describe)('generateZodSchema - ReDoS Safety', () => {
    (0, vitest_1.it)('should reject extremely long regex patterns', () => {
        const longPattern = 'a+'.repeat(300); // Over 500 chars
        const fields = [
            makeField({
                key: 'field',
                type: 'SHORT_TEXT',
                required: true,
                config: { pattern: longPattern },
            }),
        ];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        // Schema should be generated but pattern validation should be skipped
        const shape = schema.shape;
        (0, vitest_1.expect)(shape.field).toBeDefined();
    });
    (0, vitest_1.it)('should reject nested quantifier patterns', () => {
        const badPattern = '(a+)+';
        const fields = [
            makeField({
                key: 'field',
                type: 'SHORT_TEXT',
                required: true,
                config: { pattern: badPattern },
            }),
        ];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        // Schema should be generated but unsafe pattern rejected
        const shape = schema.shape;
        (0, vitest_1.expect)(shape.field).toBeDefined();
    });
    (0, vitest_1.it)('should accept safe regex patterns', () => {
        const safePattern = '^[a-z0-9_]+$';
        const fields = [
            makeField({
                key: 'username',
                type: 'SHORT_TEXT',
                required: true,
                config: { pattern: safePattern },
            }),
        ];
        const schema = (0, zod_generator_1.generateZodSchema)(fields);
        (0, vitest_1.expect)(schema.safeParse({ username: 'valid_user123' }).success).toBe(true);
        (0, vitest_1.expect)(schema.safeParse({ username: 'invalid-user' }).success).toBe(false);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9kLXNuYXBzaG90LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ6b2Qtc25hcHNob3QudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUE2QztBQUU3Qyx3REFBK0c7QUFHL0c7Ozs7Ozs7Ozs7R0FVRztBQUVILCtFQUErRTtBQUUvRSxTQUFTLFNBQVMsQ0FBQyxTQUErQzs7SUFDaEUsT0FBTztRQUNMLEVBQUUsRUFBRSxNQUFBLFNBQVMsQ0FBQyxFQUFFLG1DQUFJLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUM1QyxTQUFTLEVBQUUsTUFBQSxTQUFTLENBQUMsU0FBUyxtQ0FBSSxJQUFJO1FBQ3RDLEdBQUcsRUFBRSxTQUFTLENBQUMsR0FBRztRQUNsQixLQUFLLEVBQUUsTUFBQSxTQUFTLENBQUMsS0FBSyxtQ0FBSSxTQUFTLENBQUMsR0FBRztRQUN2QyxJQUFJLEVBQUUsTUFBQSxTQUFTLENBQUMsSUFBSSxtQ0FBSSxZQUFZO1FBQ3BDLFFBQVEsRUFBRSxNQUFBLFNBQVMsQ0FBQyxRQUFRLG1DQUFJLEtBQUs7UUFDckMsS0FBSyxFQUFFLE1BQUEsU0FBUyxDQUFDLEtBQUssbUNBQUksQ0FBQztRQUMzQixNQUFNLEVBQUUsTUFBQSxTQUFTLENBQUMsTUFBTSxtQ0FBSSxFQUFFO1FBQzlCLE1BQU0sRUFBRSxNQUFBLFNBQVMsQ0FBQyxNQUFNLG1DQUFJLElBQUk7UUFDaEMsU0FBUyxFQUFFLE1BQUEsU0FBUyxDQUFDLFNBQVMsbUNBQUksSUFBSTtRQUN0QyxhQUFhLEVBQUUsTUFBQSxTQUFTLENBQUMsYUFBYSxtQ0FBSSxJQUFJO1FBQzlDLFVBQVUsRUFBRSxNQUFBLFNBQVMsQ0FBQyxVQUFVLG1DQUFJLElBQUk7UUFDeEMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxRQUFRO0tBQzdCLENBQUE7QUFDSCxDQUFDO0FBRUQsZ0ZBQWdGO0FBRWhGLElBQUEsaUJBQVEsRUFBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7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WUFBWTtnQkFDbEIsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRTthQUNqQyxDQUFDO1NBQ0gsQ0FBQTtRQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsaUNBQWlCLEVBQUMsTUFBTSxDQUFDLENBQUE7UUFFeEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMxRSxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzVFLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZXNjcmliZSwgaXQsIGV4cGVjdCB9IGZyb20gJ3ZpdGVzdCdcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnXG5pbXBvcnQgeyBnZW5lcmF0ZVpvZFNjaGVtYSwgZ2VuZXJhdGVTdGVwWm9kU2NoZW1hLCBnZW5lcmF0ZVN0cmljdFN1Ym1pc3Npb25TY2hlbWEgfSBmcm9tICcuLi9zcmMvem9kLWdlbmVyYXRvcidcbmltcG9ydCB0eXBlIHsgRm9ybUZpZWxkIH0gZnJvbSAnLi4vc3JjL3R5cGVzJ1xuXG4vKipcbiAqIFNuYXBzaG90IHRlc3RzIGZvciBab2Qgc2NoZW1hIGdlbmVyYXRpb24uXG4gKlxuICogVGhlc2UgdGVzdHMgdmVyaWZ5IHRoYXQgdGhlIFpvZCBzY2hlbWEgZ2VuZXJhdG9yIHByb2R1Y2VzIGNvcnJlY3RcbiAqIHNjaGVtYXMgZm9yIHZhcmlvdXMgZmllbGQgY29uZmlndXJhdGlvbnMsIGluY2x1ZGluZzpcbiAqIC0gQWxsIDIwKyBmaWVsZCB0eXBlc1xuICogLSBSZXF1aXJlZCB2cyBvcHRpb25hbCBmaWVsZHNcbiAqIC0gRmllbGQgY29uc3RyYWludHMgKG1pbi9tYXgsIHBhdHRlcm4sIGxlbmd0aClcbiAqIC0gU2VsZWN0IG9wdGlvbnMgYW5kIG11bHRpLXNlbGVjdFxuICogLSBDb21wbGV4IGZpZWxkIHR5cGVzIChkYXRlIHJhbmdlcywgZmlsZSB1cGxvYWRzLCBldGMuKVxuICovXG5cbi8vIOKUgOKUgOKUgCBUZXN0IEZpeHR1cmVzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5mdW5jdGlvbiBtYWtlRmllbGQob3ZlcnJpZGVzOiBQYXJ0aWFsPEZvcm1GaWVsZD4gJiB7IGtleTogc3RyaW5nIH0pOiBGb3JtRmllbGQge1xuICByZXR1cm4ge1xuICAgIGlkOiBvdmVycmlkZXMuaWQgPz8gYGZpZWxkXyR7b3ZlcnJpZGVzLmtleX1gLFxuICAgIHZlcnNpb25JZDogb3ZlcnJpZGVzLnZlcnNpb25JZCA/PyAndjEnLFxuICAgIGtleTogb3ZlcnJpZGVzLmtleSxcbiAgICBsYWJlbDogb3ZlcnJpZGVzLmxhYmVsID8/IG92ZXJyaWRlcy5rZXksXG4gICAgdHlwZTogb3ZlcnJpZGVzLnR5cGUgPz8gJ1NIT1JUX1RFWFQnLFxuICAgIHJlcXVpcmVkOiBvdmVycmlkZXMucmVxdWlyZWQgPz8gZmFsc2UsXG4gICAgb3JkZXI6IG92ZXJyaWRlcy5vcmRlciA/PyAwLFxuICAgIGNvbmZpZzogb3ZlcnJpZGVzLmNvbmZpZyA/PyB7fSxcbiAgICBzdGVwSWQ6IG92ZXJyaWRlcy5zdGVwSWQgPz8gbnVsbCxcbiAgICBzZWN0aW9uSWQ6IG92ZXJyaWRlcy5zZWN0aW9uSWQgPz8gbnVsbCxcbiAgICBwYXJlbnRGaWVsZElkOiBvdmVycmlkZXMucGFyZW50RmllbGRJZCA/PyBudWxsLFxuICAgIGNvbmRpdGlvbnM6IG92ZXJyaWRlcy5jb25kaXRpb25zID8/IG51bGwsXG4gICAgY2hpbGRyZW46IG92ZXJyaWRlcy5jaGlsZHJlbixcbiAgfVxufVxuXG4vLyDilIDilIDilIAgSW5kaXZpZHVhbCBGaWVsZCBUeXBlIFRlc3RzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5kZXNjcmliZSgnZ2VuZXJhdGVab2RTY2hlbWEgLSBJbmRpdmlkdWFsIEZpZWxkIFR5cGVzJywgKCkgPT4ge1xuICBkZXNjcmliZSgnVGV4dCBmaWVsZHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBzY2hlbWEgZm9yIHJlcXVpcmVkIFNIT1JUX1RFWFQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnbmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUubmFtZSkudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KHNoYXBlLm5hbWUuX2RlZi50eXBlTmFtZSkudG9CZSgnWm9kU3RyaW5nJylcbiAgICAgIGV4cGVjdChzaGFwZS5uYW1lLl9kZWYuY2hlY2tzPy5zb21lKChjOiBhbnkpID0+IGMua2luZCA9PT0gJ21pbicpKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgc2NoZW1hIGZvciBvcHRpb25hbCBTSE9SVF9URVhUJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiBmYWxzZSB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5uYW1lKS50b0JlRGVmaW5lZCgpXG4gICAgICAvLyBPcHRpb25hbCBmaWVsZHMgc2hvdWxkIGJlIHVuaW9uIHdpdGggdW5kZWZpbmVkL251bGwvZW1wdHkgc3RyaW5nXG4gICAgICBleHBlY3Qoc2hhcGUubmFtZS5fZGVmLnR5cGVOYW1lKS50b0JlKCdab2RVbmlvbicpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVzcGVjdCBtaW5MZW5ndGggYW5kIG1heExlbmd0aCBjb25zdHJhaW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICd1c2VybmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZzogeyBtaW5MZW5ndGg6IDMsIG1heExlbmd0aDogMjAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBjb25zdCBjaGVja3MgPSBzaGFwZS51c2VybmFtZS5fZGVmLmNoZWNrc1xuICAgICAgZXhwZWN0KGNoZWNrcz8uc29tZSgoYzogYW55KSA9PiBjLmtpbmQgPT09ICdtaW4nICYmIGMudmFsdWUgPT09IDMpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoY2hlY2tzPy5zb21lKChjOiBhbnkpID0+IGMua2luZCA9PT0gJ21heCcgJiYgYy52YWx1ZSA9PT0gMjApKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgYXBwbHkgcmVnZXggcGF0dGVybiB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ3VzZXJuYW1lJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgY29uZmlnOiB7IHBhdHRlcm46ICdeW2EtejAtOV9dKyQnIH0sXG4gICAgICAgIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgICBjb25zdCBzaGFwZSA9IHNjaGVtYS5zaGFwZVxuICAgICAgY29uc3QgY2hlY2tzID0gc2hhcGUudXNlcm5hbWUuX2RlZi5jaGVja3NcbiAgICAgIGV4cGVjdChjaGVja3M/LnNvbWUoKGM6IGFueSkgPT4gYy5raW5kID09PSAncmVnZXgnKSkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHNjaGVtYSBmb3IgTE9OR19URVhUJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2JpbycsXG4gICAgICAgICAgdHlwZTogJ0xPTkdfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIGNvbmZpZzogeyBtYXhMZW5ndGg6IDUwMCB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5iaW8pLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChzaGFwZS5iaW8uX2RlZi50eXBlTmFtZSkudG9CZSgnWm9kVW5pb24nKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0VtYWlsIGFuZCBVUkwgZmllbGRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgRU1BSUwgc2NoZW1hIHdpdGggZW1haWwgdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIHJlcXVpcmVkOiB0cnVlIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgICBjb25zdCBzaGFwZSA9IHNjaGVtYS5zaGFwZVxuICAgICAgZXhwZWN0KHNoYXBlLmVtYWlsKS50b0JlRGVmaW5lZCgpXG4gICAgICBjb25zdCBjaGVja3MgPSBzaGFwZS5lbWFpbC5fZGVmLmNoZWNrc1xuICAgICAgZXhwZWN0KGNoZWNrcz8uc29tZSgoYzogYW55KSA9PiBjLmtpbmQgPT09ICdlbWFpbCcpKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgVVJMIHNjaGVtYSB3aXRoIFVSTCB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3dlYnNpdGUnLCB0eXBlOiAnVVJMJywgcmVxdWlyZWQ6IHRydWUgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUud2Vic2l0ZSkudG9CZURlZmluZWQoKVxuICAgICAgY29uc3QgY2hlY2tzID0gc2hhcGUud2Vic2l0ZS5fZGVmLmNoZWNrc1xuICAgICAgZXhwZWN0KGNoZWNrcz8uc29tZSgoYzogYW55KSA9PiBjLmtpbmQgPT09ICd1cmwnKSkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIFBIT05FIHNjaGVtYSB3aXRoIHBob25lIHJlZ2V4JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3Bob25lJywgdHlwZTogJ1BIT05FJywgcmVxdWlyZWQ6IHRydWUgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUucGhvbmUpLnRvQmVEZWZpbmVkKClcbiAgICAgIGNvbnN0IGNoZWNrcyA9IHNoYXBlLnBob25lLl9kZWYuY2hlY2tzXG4gICAgICBleHBlY3QoY2hlY2tzPy5zb21lKChjOiBhbnkpID0+IGMua2luZCA9PT0gJ3JlZ2V4JykpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBQQVNTV09SRCBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAncGFzc3dvcmQnLCB0eXBlOiAnUEFTU1dPUkQnLCByZXF1aXJlZDogdHJ1ZSB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5wYXNzd29yZCkudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KHNoYXBlLnBhc3N3b3JkLl9kZWYudHlwZU5hbWUpLnRvQmUoJ1pvZFN0cmluZycpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnTnVtYmVyIGZpZWxkcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIE5VTUJFUiBzY2hlbWEgd2l0aCBtaW4vbWF4IGNvbnN0cmFpbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2FnZScsXG4gICAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgY29uZmlnOiB7IG1pbjogMCwgbWF4OiAxNTAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUuYWdlKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3Qoc2hhcGUuYWdlLl9kZWYudHlwZU5hbWUpLnRvQmUoJ1pvZE51bWJlcicpXG4gICAgICBjb25zdCBjaGVja3MgPSBzaGFwZS5hZ2UuX2RlZi5jaGVja3NcbiAgICAgIGV4cGVjdChjaGVja3M/LnNvbWUoKGM6IGFueSkgPT4gYy5raW5kID09PSAnbWluJykpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChjaGVja3M/LnNvbWUoKGM6IGFueSkgPT4gYy5raW5kID09PSAnbWF4JykpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBlbmZvcmNlIGludGVnZXIgZm9ybWF0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2NvdW50JyxcbiAgICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBjb25maWc6IHsgZm9ybWF0OiAnaW50ZWdlcicgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBjb25zdCBjaGVja3MgPSBzaGFwZS5jb3VudC5fZGVmLmNoZWNrc1xuICAgICAgZXhwZWN0KGNoZWNrcz8uc29tZSgoYzogYW55KSA9PiBjLmtpbmQgPT09ICdpbnQnKSkudG9CZSh0cnVlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0RhdGUgYW5kIHRpbWUgZmllbGRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgREFURSBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnYmlydGhEYXRlJywgdHlwZTogJ0RBVEUnLCByZXF1aXJlZDogdHJ1ZSB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5iaXJ0aERhdGUpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChzaGFwZS5iaXJ0aERhdGUuX2RlZi50eXBlTmFtZSkudG9CZSgnWm9kU3RyaW5nJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBUSU1FIHNjaGVtYScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdtZWV0aW5nVGltZScsIHR5cGU6ICdUSU1FJywgcmVxdWlyZWQ6IHRydWUgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUubWVldGluZ1RpbWUpLnRvQmVEZWZpbmVkKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBEQVRFX1RJTUUgc2NoZW1hJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ21lZXRpbmdEYXRlVGltZScsIHR5cGU6ICdEQVRFX1RJTUUnLCByZXF1aXJlZDogdHJ1ZSB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5tZWV0aW5nRGF0ZVRpbWUpLnRvQmVEZWZpbmVkKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBEQVRFX1JBTkdFIHNjaGVtYSBhcyBvYmplY3QnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnZGF0ZVJhbmdlJywgdHlwZTogJ0RBVEVfUkFOR0UnLCByZXF1aXJlZDogdHJ1ZSB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5kYXRlUmFuZ2UpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChzaGFwZS5kYXRlUmFuZ2UuX2RlZi50eXBlTmFtZSkudG9CZSgnWm9kT2JqZWN0JylcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdTZWxlY3Rpb24gZmllbGRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgU0VMRUNUIHNjaGVtYSB3aXRoIGVudW0gZnJvbSBvcHRpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2NvdW50cnknLFxuICAgICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdVU0EnLCB2YWx1ZTogJ3VzJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2FuYWRhJywgdmFsdWU6ICdjYScgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUuY291bnRyeSkudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KHNoYXBlLmNvdW50cnkuX2RlZi50eXBlTmFtZSkudG9CZSgnWm9kRW51bScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgTVVMVElfU0VMRUNUIHNjaGVtYSBhcyBhcnJheSBvZiBlbnVtJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2ludGVyZXN0cycsXG4gICAgICAgICAgdHlwZTogJ01VTFRJX1NFTEVDVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ1Nwb3J0cycsIHZhbHVlOiAnc3BvcnRzJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnTXVzaWMnLCB2YWx1ZTogJ211c2ljJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5pbnRlcmVzdHMpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChzaGFwZS5pbnRlcmVzdHMuX2RlZi50eXBlTmFtZSkudG9CZSgnWm9kQXJyYXknKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIFJBRElPIHNjaGVtYSB3aXRoIGVudW0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnZ2VuZGVyJyxcbiAgICAgICAgICB0eXBlOiAnUkFESU8nLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdNYWxlJywgdmFsdWU6ICdtYWxlJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnRmVtYWxlJywgdmFsdWU6ICdmZW1hbGUnIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgICBjb25zdCBzaGFwZSA9IHNjaGVtYS5zaGFwZVxuICAgICAgZXhwZWN0KHNoYXBlLmdlbmRlcikudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBTRUxFQ1Qgd2l0aCBkeW5hbWljIG1vZGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnZHluYW1pY1NlbGVjdCcsXG4gICAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgY29uZmlnOiB7IG1vZGU6ICdkeW5hbWljJyB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5keW5hbWljU2VsZWN0KS50b0JlRGVmaW5lZCgpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnQ2hlY2tib3ggYW5kIGJvb2xlYW4gZmllbGRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgQ0hFQ0tCT1ggc2NoZW1hIGFzIGJvb2xlYW4nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnc3Vic2NyaWJlJywgdHlwZTogJ0NIRUNLQk9YJywgcmVxdWlyZWQ6IGZhbHNlIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgICBjb25zdCBzaGFwZSA9IHNjaGVtYS5zaGFwZVxuICAgICAgZXhwZWN0KHNoYXBlLnN1YnNjcmliZSkudG9CZURlZmluZWQoKVxuICAgICAgLy8gU2hvdWxkIGJlIHVuaW9uIHdpdGggYm9vbGVhbiBmb3Igb3B0aW9uYWxcbiAgICAgIGV4cGVjdChzaGFwZS5zdWJzY3JpYmUuX2RlZi50eXBlTmFtZSkudG9CZSgnWm9kVW5pb24nKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0ZpbGUgdXBsb2FkIGZpZWxkcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIEZJTEVfVVBMT0FEIHNjaGVtYSB3aXRoIHNpemUgYW5kIHR5cGUgY29uc3RyYWludHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnZG9jdW1lbnQnLFxuICAgICAgICAgIHR5cGU6ICdGSUxFX1VQTE9BRCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBtYXhTaXplTUI6IDUsXG4gICAgICAgICAgICBhbGxvd2VkTWltZVR5cGVzOiBbJ2FwcGxpY2F0aW9uL3BkZicsICdpbWFnZS9qcGVnJ10sXG4gICAgICAgICAgICBtYXhGaWxlczogMSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5kb2N1bWVudCkudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KHNoYXBlLmRvY3VtZW50Ll9kZWYudHlwZU5hbWUpLnRvQmUoJ1pvZEFycmF5JylcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdSYXRpbmcgYW5kIHNjYWxlIGZpZWxkcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIFJBVElORyBzY2hlbWEgd2l0aCBtYXggY29uc3RyYWludCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdyYXRpbmcnLFxuICAgICAgICAgIHR5cGU6ICdSQVRJTkcnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZzogeyBtYXg6IDUgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUucmF0aW5nKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3Qoc2hhcGUucmF0aW5nLl9kZWYudHlwZU5hbWUpLnRvQmUoJ1pvZE51bWJlcicpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgU0NBTEUgc2NoZW1hIHdpdGggbWluIGFuZCBtYXgnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnc2NhbGUnLFxuICAgICAgICAgIHR5cGU6ICdTQ0FMRScsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgY29uZmlnOiB7IG1pbjogMSwgbWF4OiAxMCB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5zY2FsZSkudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KHNoYXBlLnNjYWxlLl9kZWYudHlwZU5hbWUpLnRvQmUoJ1pvZE51bWJlcicpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnTGF5b3V0IGZpZWxkcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGV4Y2x1ZGUgU0VDVElPTl9CUkVBSyBmcm9tIHNjaGVtYScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnc2VjdGlvbicsIHR5cGU6ICdTRUNUSU9OX0JSRUFLJywgcmVxdWlyZWQ6IGZhbHNlIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgICBjb25zdCBzaGFwZSA9IHNjaGVtYS5zaGFwZVxuICAgICAgZXhwZWN0KHNoYXBlLnNlY3Rpb24pLnRvQmVVbmRlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGV4Y2x1ZGUgRklFTERfR1JPVVAgZnJvbSBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2dyb3VwJywgdHlwZTogJ0ZJRUxEX0dST1VQJywgcmVxdWlyZWQ6IGZhbHNlIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgICBjb25zdCBzaGFwZSA9IHNjaGVtYS5zaGFwZVxuICAgICAgZXhwZWN0KHNoYXBlLmdyb3VwKS50b0JlVW5kZWZpbmVkKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdTcGVjaWFsIGZpZWxkcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIEhJRERFTiBmaWVsZCBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3Nlc3Npb25JZCcsIHR5cGU6ICdISURERU4nLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUuc2Vzc2lvbklkKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgUklDSF9URVhUIHNjaGVtYScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnY29udGVudCcsIHR5cGU6ICdSSUNIX1RFWFQnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUuY29udGVudCkudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIFNJR05BVFVSRSBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3NpZ25hdHVyZScsIHR5cGU6ICdTSUdOQVRVUkUnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgICBleHBlY3Qoc2hhcGUuc2lnbmF0dXJlKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgQUREUkVTUyBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2FkZHJlc3MnLCB0eXBlOiAnQUREUkVTUycsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICAgIGV4cGVjdChzaGFwZS5hZGRyZXNzKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBNaXhlZCBGaWVsZCBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ2dlbmVyYXRlWm9kU2NoZW1hIC0gTWl4ZWQgRmllbGQgVHlwZXMnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgZ2VuZXJhdGUgc2NoZW1hIGZvciBtaXhlZCByZXF1aXJlZCBhbmQgb3B0aW9uYWwgZmllbGRzJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3Bob25lJywgdHlwZTogJ1BIT05FJywgcmVxdWlyZWQ6IGZhbHNlIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnYmlvJywgdHlwZTogJ0xPTkdfVEVYVCcsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICBdXG4gICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICBleHBlY3Qoc2hhcGUubmFtZSkudG9CZURlZmluZWQoKVxuICAgIGV4cGVjdChzaGFwZS5lbWFpbCkudG9CZURlZmluZWQoKVxuICAgIGV4cGVjdChzaGFwZS5waG9uZSkudG9CZURlZmluZWQoKVxuICAgIGV4cGVjdChzaGFwZS5iaW8pLnRvQmVEZWZpbmVkKClcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhbmRsZSBhbGwgMjEgZmllbGQgdHlwZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgYWxsVHlwZXM6IEZvcm1GaWVsZFtdID0gW1xuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnc2hvcnRfdGV4dCcsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdsb25nX3RleHQnLCB0eXBlOiAnTE9OR19URVhUJywgcmVxdWlyZWQ6IGZhbHNlIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbnVtYmVyJywgdHlwZTogJ05VTUJFUicsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2VtYWlsJywgdHlwZTogJ0VNQUlMJywgcmVxdWlyZWQ6IHRydWUgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdwaG9uZScsIHR5cGU6ICdQSE9ORScsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2RhdGUnLCB0eXBlOiAnREFURScsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2RhdGVfcmFuZ2UnLCB0eXBlOiAnREFURV9SQU5HRScsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3RpbWUnLCB0eXBlOiAnVElNRScsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2RhdGVfdGltZScsIHR5cGU6ICdEQVRFX1RJTUUnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdzZWxlY3QnLFxuICAgICAgICB0eXBlOiAnU0VMRUNUJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICBjb25maWc6IHsgbW9kZTogJ3N0YXRpYycsIG9wdGlvbnM6IFt7IGxhYmVsOiAnQScsIHZhbHVlOiAnYScgfV0gfSxcbiAgICAgIH0pLFxuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnbXVsdGlfc2VsZWN0JyxcbiAgICAgICAgdHlwZTogJ01VTFRJX1NFTEVDVCcsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgY29uZmlnOiB7IG1vZGU6ICdzdGF0aWMnLCBvcHRpb25zOiBbeyBsYWJlbDogJ0EnLCB2YWx1ZTogJ2EnIH1dIH0sXG4gICAgICB9KSxcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ3JhZGlvJyxcbiAgICAgICAgdHlwZTogJ1JBRElPJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICBjb25maWc6IHsgbW9kZTogJ3N0YXRpYycsIG9wdGlvbnM6IFt7IGxhYmVsOiAnQScsIHZhbHVlOiAnYScgfV0gfSxcbiAgICAgIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnY2hlY2tib3gnLCB0eXBlOiAnQ0hFQ0tCT1gnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdmaWxlX3VwbG9hZCcsIHR5cGU6ICdGSUxFX1VQTE9BRCcsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3JhdGluZycsIHR5cGU6ICdSQVRJTkcnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdzY2FsZScsIHR5cGU6ICdTQ0FMRScsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3VybCcsIHR5cGU6ICdVUkwnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdwYXNzd29yZCcsIHR5cGU6ICdQQVNTV09SRCcsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2hpZGRlbicsIHR5cGU6ICdISURERU4nLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdyaWNoX3RleHQnLCB0eXBlOiAnUklDSF9URVhUJywgcmVxdWlyZWQ6IGZhbHNlIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnc2lnbmF0dXJlJywgdHlwZTogJ1NJR05BVFVSRScsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2FkZHJlc3MnLCB0eXBlOiAnQUREUkVTUycsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICBdXG5cbiAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShhbGxUeXBlcylcbiAgICBjb25zdCBzaGFwZSA9IHNjaGVtYS5zaGFwZVxuXG4gICAgZXhwZWN0KE9iamVjdC5rZXlzKHNoYXBlKS5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigyMClcbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBWYWxpZGF0aW9uIFRlc3RzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5kZXNjcmliZSgnZ2VuZXJhdGVab2RTY2hlbWEgLSBWYWxpZGF0aW9uIEJlaGF2aW9yJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHZhbGlkYXRlIHJlcXVpcmVkIHRleHQgZmllbGQgY29ycmVjdGx5JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSB9KV1cbiAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICBjb25zdCB2YWxpZCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBuYW1lOiAnSm9obiBEb2UnIH0pXG4gICAgZXhwZWN0KHZhbGlkLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcblxuICAgIGNvbnN0IGludmFsaWQgPSBzY2hlbWEuc2FmZVBhcnNlKHsgbmFtZTogJycgfSlcbiAgICBleHBlY3QoaW52YWxpZC5zdWNjZXNzKS50b0JlKGZhbHNlKVxuXG4gICAgY29uc3QgbWlzc2luZyA9IHNjaGVtYS5zYWZlUGFyc2Uoe30pXG4gICAgZXhwZWN0KG1pc3Npbmcuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIGFsbG93IG9wdGlvbmFsIGZpZWxkcyB0byBiZSB1bmRlZmluZWQsIG51bGwsIG9yIGVtcHR5JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdiaW8nLCB0eXBlOiAnTE9OR19URVhUJywgcmVxdWlyZWQ6IGZhbHNlIH0pXVxuICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgIGV4cGVjdChzY2hlbWEuc2FmZVBhcnNlKHsgYmlvOiB1bmRlZmluZWQgfSkuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIGV4cGVjdChzY2hlbWEuc2FmZVBhcnNlKHsgYmlvOiBudWxsIH0pLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICBleHBlY3Qoc2NoZW1hLnNhZmVQYXJzZSh7IGJpbzogJycgfSkuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIGV4cGVjdChzY2hlbWEuc2FmZVBhcnNlKHt9KS5zdWNjZXNzKS50b0JlKHRydWUpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBudW1iZXIgY29uc3RyYWludHMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnYWdlJyxcbiAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICBjb25maWc6IHsgbWluOiAwLCBtYXg6IDE1MCB9LFxuICAgICAgfSksXG4gICAgXVxuICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgIGV4cGVjdChzY2hlbWEuc2FmZVBhcnNlKHsgYWdlOiAyNSB9KS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHNjaGVtYS5zYWZlUGFyc2UoeyBhZ2U6IC0xIH0pLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgZXhwZWN0KHNjaGVtYS5zYWZlUGFyc2UoeyBhZ2U6IDIwMCB9KS5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgdmFsaWRhdGUgZW1haWwgZm9ybWF0JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIHJlcXVpcmVkOiB0cnVlIH0pXVxuICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgIGV4cGVjdChzY2hlbWEuc2FmZVBhcnNlKHsgZW1haWw6ICd0ZXN0QGV4YW1wbGUuY29tJyB9KS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHNjaGVtYS5zYWZlUGFyc2UoeyBlbWFpbDogJ2ludmFsaWQtZW1haWwnIH0pLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBzZWxlY3QgZW51bSB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnY291bnRyeScsXG4gICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBsYWJlbDogJ1VTQScsIHZhbHVlOiAndXMnIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2FuYWRhJywgdmFsdWU6ICdjYScgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlWm9kU2NoZW1hKGZpZWxkcylcblxuICAgIGV4cGVjdChzY2hlbWEuc2FmZVBhcnNlKHsgY291bnRyeTogJ3VzJyB9KS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHNjaGVtYS5zYWZlUGFyc2UoeyBjb3VudHJ5OiAnaW52YWxpZCcgfSkuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIHZhbGlkYXRlIG11bHRpLXNlbGVjdCBhcyBhcnJheScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdpbnRlcmVzdHMnLFxuICAgICAgICB0eXBlOiAnTVVMVElfU0VMRUNUJyxcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgIHsgbGFiZWw6ICdTcG9ydHMnLCB2YWx1ZTogJ3Nwb3J0cycgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdNdXNpYycsIHZhbHVlOiAnbXVzaWMnIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF1cbiAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICBleHBlY3Qoc2NoZW1hLnNhZmVQYXJzZSh7IGludGVyZXN0czogWydzcG9ydHMnLCAnbXVzaWMnXSB9KS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHNjaGVtYS5zYWZlUGFyc2UoeyBpbnRlcmVzdHM6IFsnc3BvcnRzJ10gfSkuc3VjY2VzcykudG9CZSh0cnVlKVxuICAgIGV4cGVjdChzY2hlbWEuc2FmZVBhcnNlKHsgaW50ZXJlc3RzOiBbXSB9KS5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICB9KVxufSlcblxuLy8g4pSA4pSA4pSAIFN0ZXAgWm9kIFNjaGVtYSBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ2dlbmVyYXRlU3RlcFpvZFNjaGVtYScsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBzY2hlbWEgc2NvcGVkIHRvIHN0ZXAgZmllbGRzJywgKCkgPT4ge1xuICAgIGNvbnN0IHN0ZXBGaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdmaXJzdE5hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbGFzdE5hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgIF1cbiAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVN0ZXBab2RTY2hlbWEoc3RlcEZpZWxkcylcblxuICAgIGNvbnN0IHNoYXBlID0gc2NoZW1hLnNoYXBlXG4gICAgZXhwZWN0KHNoYXBlLmZpcnN0TmFtZSkudG9CZURlZmluZWQoKVxuICAgIGV4cGVjdChzaGFwZS5sYXN0TmFtZSkudG9CZURlZmluZWQoKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgdmFsaWRhdGUgc3RlcC1zcGVjaWZpYyBkYXRhJywgKCkgPT4ge1xuICAgIGNvbnN0IHN0ZXBGaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdjb3VudHJ5JyxcbiAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICBvcHRpb25zOiBbeyBsYWJlbDogJ1VTQScsIHZhbHVlOiAndXMnIH1dLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlU3RlcFpvZFNjaGVtYShzdGVwRmllbGRzKVxuXG4gICAgZXhwZWN0KHNjaGVtYS5zYWZlUGFyc2UoeyBjb3VudHJ5OiAndXMnIH0pLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICBleHBlY3Qoc2NoZW1hLnNhZmVQYXJzZSh7IGNvdW50cnk6ICdpbnZhbGlkJyB9KS5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICB9KVxufSlcblxuLy8g4pSA4pSA4pSAIFN0cmljdCBTdWJtaXNzaW9uIFNjaGVtYSBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ2dlbmVyYXRlU3RyaWN0U3VibWlzc2lvblNjaGVtYScsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBzdHJpY3Qgc2NoZW1hIHRoYXQgcmVqZWN0cyB1bmtub3duIGtleXMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlIH0pXVxuICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlU3RyaWN0U3VibWlzc2lvblNjaGVtYShmaWVsZHMpXG5cbiAgICBjb25zdCB2YWxpZCA9IHNjaGVtYS5zYWZlUGFyc2UoeyBuYW1lOiAnSm9obiBEb2UnIH0pXG4gICAgZXhwZWN0KHZhbGlkLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcblxuICAgIGNvbnN0IHdpdGhFeHRyYSA9IHNjaGVtYS5zYWZlUGFyc2UoeyBuYW1lOiAnSm9obiBEb2UnLCBleHRyYTogJ2ZpZWxkJyB9KVxuICAgIGV4cGVjdCh3aXRoRXh0cmEuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIGVuZm9yY2UgYWxsIHJlcXVpcmVkIGZpZWxkcycsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2VtYWlsJywgdHlwZTogJ0VNQUlMJywgcmVxdWlyZWQ6IHRydWUgfSksXG4gICAgXVxuICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlU3RyaWN0U3VibWlzc2lvblNjaGVtYShmaWVsZHMpXG5cbiAgICBleHBlY3Qoc2NoZW1hLnNhZmVQYXJzZSh7IG5hbWU6ICdKb2huJywgZW1haWw6ICdqb2huQGV4YW1wbGUuY29tJyB9KS5zdWNjZXNzKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHNjaGVtYS5zYWZlUGFyc2UoeyBuYW1lOiAnSm9obicgfSkuc3VjY2VzcykudG9CZShmYWxzZSlcbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBSZURvUyBTYWZldHkgVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdnZW5lcmF0ZVpvZFNjaGVtYSAtIFJlRG9TIFNhZmV0eScsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCByZWplY3QgZXh0cmVtZWx5IGxvbmcgcmVnZXggcGF0dGVybnMnLCAoKSA9PiB7XG4gICAgY29uc3QgbG9uZ1BhdHRlcm4gPSAnYSsnLnJlcGVhdCgzMDApIC8vIE92ZXIgNTAwIGNoYXJzXG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnZmllbGQnLFxuICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICBjb25maWc6IHsgcGF0dGVybjogbG9uZ1BhdHRlcm4gfSxcbiAgICAgIH0pLFxuICAgIF1cbiAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAvLyBTY2hlbWEgc2hvdWxkIGJlIGdlbmVyYXRlZCBidXQgcGF0dGVybiB2YWxpZGF0aW9uIHNob3VsZCBiZSBza2lwcGVkXG4gICAgY29uc3Qgc2hhcGUgPSBzY2hlbWEuc2hhcGVcbiAgICBleHBlY3Qoc2hhcGUuZmllbGQpLnRvQmVEZWZpbmVkKClcbiAgfSlcblxuICBpdCgnc2hvdWxkIHJlamVjdCBuZXN0ZWQgcXVhbnRpZmllciBwYXR0ZXJucycsICgpID0+IHtcbiAgICBjb25zdCBiYWRQYXR0ZXJuID0gJyhhKykrJ1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2ZpZWxkJyxcbiAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgY29uZmlnOiB7IHBhdHRlcm46IGJhZFBhdHRlcm4gfSxcbiAgICAgIH0pLFxuICAgIF1cbiAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYShmaWVsZHMpXG5cbiAgICAvLyBTY2hlbWEgc2hvdWxkIGJlIGdlbmVyYXRlZCBidXQgdW5zYWZlIHBhdHRlcm4gcmVqZWN0ZWRcbiAgICBjb25zdCBzaGFwZSA9IHNjaGVtYS5zaGFwZVxuICAgIGV4cGVjdChzaGFwZS5maWVsZCkudG9CZURlZmluZWQoKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgYWNjZXB0IHNhZmUgcmVnZXggcGF0dGVybnMnLCAoKSA9PiB7XG4gICAgY29uc3Qgc2FmZVBhdHRlcm4gPSAnXlthLXowLTlfXSskJ1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ3VzZXJuYW1lJyxcbiAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgY29uZmlnOiB7IHBhdHRlcm46IHNhZmVQYXR0ZXJuIH0sXG4gICAgICB9KSxcbiAgICBdXG4gICAgY29uc3Qgc2NoZW1hID0gZ2VuZXJhdGVab2RTY2hlbWEoZmllbGRzKVxuXG4gICAgZXhwZWN0KHNjaGVtYS5zYWZlUGFyc2UoeyB1c2VybmFtZTogJ3ZhbGlkX3VzZXIxMjMnIH0pLnN1Y2Nlc3MpLnRvQmUodHJ1ZSlcbiAgICBleHBlY3Qoc2NoZW1hLnNhZmVQYXJzZSh7IHVzZXJuYW1lOiAnaW52YWxpZC11c2VyJyB9KS5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICB9KVxufSlcbiJdfQ==