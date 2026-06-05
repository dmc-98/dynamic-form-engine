"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const json_schema_1 = require("../src/json-schema");
/**
 * Round-trip tests for JSON Schema conversion.
 *
 * These tests verify that:
 * - DFE fields can be converted to JSON Schema
 * - JSON Schema can be converted back to DFE fields
 * - Round-trip conversions preserve essential information
 * - All field types map correctly
 * - Constraints and options are preserved
 */
// ─── Test Helpers ───────────────────────────────────────────────────────────
function makeField(overrides) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return {
        id: (_a = overrides.id) !== null && _a !== void 0 ? _a : `field_${overrides.key}`,
        versionId: (_b = overrides.versionId) !== null && _b !== void 0 ? _b : 'v1',
        key: overrides.key,
        label: (_c = overrides.label) !== null && _c !== void 0 ? _c : overrides.key,
        description: (_d = overrides.description) !== null && _d !== void 0 ? _d : null,
        type: (_e = overrides.type) !== null && _e !== void 0 ? _e : 'SHORT_TEXT',
        required: (_f = overrides.required) !== null && _f !== void 0 ? _f : false,
        order: (_g = overrides.order) !== null && _g !== void 0 ? _g : 0,
        config: (_h = overrides.config) !== null && _h !== void 0 ? _h : {},
        stepId: (_j = overrides.stepId) !== null && _j !== void 0 ? _j : null,
        sectionId: (_k = overrides.sectionId) !== null && _k !== void 0 ? _k : null,
        parentFieldId: (_l = overrides.parentFieldId) !== null && _l !== void 0 ? _l : null,
        conditions: (_m = overrides.conditions) !== null && _m !== void 0 ? _m : null,
        children: overrides.children,
    };
}
// ─── toJsonSchema Tests ──────────────────────────────────────────────────────
(0, vitest_1.describe)('toJsonSchema', () => {
    (0, vitest_1.describe)('basic structure', () => {
        (0, vitest_1.it)('should create valid JSON Schema object', () => {
            const fields = [makeField({ key: 'name', type: 'SHORT_TEXT', required: true })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
            (0, vitest_1.expect)(schema.type).toBe('object');
            (0, vitest_1.expect)(schema.properties).toBeDefined();
            (0, vitest_1.expect)(schema.required).toBeDefined();
        });
        (0, vitest_1.it)('should include title when provided', () => {
            const fields = [makeField({ key: 'name' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields, 'User Form');
            (0, vitest_1.expect)(schema.title).toBe('User Form');
        });
        (0, vitest_1.it)('should omit title when not provided', () => {
            const fields = [makeField({ key: 'name' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.title).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('field type mapping', () => {
        (0, vitest_1.it)('should map SHORT_TEXT to string', () => {
            const fields = [makeField({ key: 'name', type: 'SHORT_TEXT' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.name.type).toBe('string');
        });
        (0, vitest_1.it)('should map LONG_TEXT to string', () => {
            const fields = [makeField({ key: 'bio', type: 'LONG_TEXT' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.bio.type).toBe('string');
        });
        (0, vitest_1.it)('should map NUMBER to number', () => {
            const fields = [makeField({ key: 'age', type: 'NUMBER' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.age.type).toBe('number');
        });
        (0, vitest_1.it)('should map EMAIL with format', () => {
            const fields = [makeField({ key: 'email', type: 'EMAIL' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.email.type).toBe('string');
            (0, vitest_1.expect)(schema.properties.email.format).toBe('email');
        });
        (0, vitest_1.it)('should map PHONE with format', () => {
            const fields = [makeField({ key: 'phone', type: 'PHONE' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.phone.type).toBe('string');
            (0, vitest_1.expect)(schema.properties.phone.format).toBe('phone');
        });
        (0, vitest_1.it)('should map URL with uri format', () => {
            const fields = [makeField({ key: 'website', type: 'URL' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.website.type).toBe('string');
            (0, vitest_1.expect)(schema.properties.website.format).toBe('uri');
        });
        (0, vitest_1.it)('should map DATE with date format', () => {
            const fields = [makeField({ key: 'birthDate', type: 'DATE' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.birthDate.type).toBe('string');
            (0, vitest_1.expect)(schema.properties.birthDate.format).toBe('date');
        });
        (0, vitest_1.it)('should map TIME with time format', () => {
            const fields = [makeField({ key: 'meetingTime', type: 'TIME' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.meetingTime.type).toBe('string');
            (0, vitest_1.expect)(schema.properties.meetingTime.format).toBe('time');
        });
        (0, vitest_1.it)('should map DATE_TIME with date-time format', () => {
            const fields = [makeField({ key: 'meetingDateTime', type: 'DATE_TIME' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.meetingDateTime.type).toBe('string');
            (0, vitest_1.expect)(schema.properties.meetingDateTime.format).toBe('date-time');
        });
        (0, vitest_1.it)('should map DATE_RANGE to object', () => {
            const fields = [makeField({ key: 'dateRange', type: 'DATE_RANGE' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.dateRange.type).toBe('object');
        });
        (0, vitest_1.it)('should map CHECKBOX to boolean', () => {
            const fields = [makeField({ key: 'subscribe', type: 'CHECKBOX' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.subscribe.type).toBe('boolean');
        });
        (0, vitest_1.it)('should map SELECT to string', () => {
            const fields = [makeField({ key: 'country', type: 'SELECT' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.country.type).toBe('string');
        });
        (0, vitest_1.it)('should map RADIO to string', () => {
            const fields = [makeField({ key: 'gender', type: 'RADIO' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.gender.type).toBe('string');
        });
        (0, vitest_1.it)('should map MULTI_SELECT to array', () => {
            const fields = [makeField({ key: 'interests', type: 'MULTI_SELECT' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.interests.type).toBe('array');
        });
        (0, vitest_1.it)('should map RATING to integer', () => {
            const fields = [makeField({ key: 'rating', type: 'RATING' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.rating.type).toBe('integer');
        });
        (0, vitest_1.it)('should map SCALE to integer', () => {
            const fields = [makeField({ key: 'scale', type: 'SCALE' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.scale.type).toBe('integer');
        });
        (0, vitest_1.it)('should map PASSWORD to string', () => {
            const fields = [makeField({ key: 'password', type: 'PASSWORD' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.password.type).toBe('string');
        });
        (0, vitest_1.it)('should map HIDDEN to string', () => {
            const fields = [makeField({ key: 'sessionId', type: 'HIDDEN' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.sessionId.type).toBe('string');
        });
        (0, vitest_1.it)('should map FILE_UPLOAD with uri format', () => {
            const fields = [makeField({ key: 'document', type: 'FILE_UPLOAD' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.document.type).toBe('string');
            (0, vitest_1.expect)(schema.properties.document.format).toBe('uri');
        });
        (0, vitest_1.it)('should map RICH_TEXT to string', () => {
            const fields = [makeField({ key: 'content', type: 'RICH_TEXT' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.content.type).toBe('string');
        });
        (0, vitest_1.it)('should map SIGNATURE with data-url format', () => {
            const fields = [makeField({ key: 'signature', type: 'SIGNATURE' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.signature.type).toBe('string');
            (0, vitest_1.expect)(schema.properties.signature.format).toBe('data-url');
        });
        (0, vitest_1.it)('should map ADDRESS to object', () => {
            const fields = [makeField({ key: 'address', type: 'ADDRESS' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.address.type).toBe('object');
        });
    });
    (0, vitest_1.describe)('constraints mapping', () => {
        (0, vitest_1.it)('should include minLength constraint', () => {
            const fields = [
                makeField({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    config: { minLength: 3 },
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.username.minLength).toBe(3);
        });
        (0, vitest_1.it)('should include maxLength constraint', () => {
            const fields = [
                makeField({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    config: { maxLength: 20 },
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.username.maxLength).toBe(20);
        });
        (0, vitest_1.it)('should include min constraint as minimum', () => {
            const fields = [
                makeField({
                    key: 'age',
                    type: 'NUMBER',
                    config: { min: 0 },
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.age.minimum).toBe(0);
        });
        (0, vitest_1.it)('should include max constraint as maximum', () => {
            const fields = [
                makeField({
                    key: 'age',
                    type: 'NUMBER',
                    config: { max: 150 },
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.age.maximum).toBe(150);
        });
        (0, vitest_1.it)('should include pattern constraint', () => {
            const fields = [
                makeField({
                    key: 'username',
                    type: 'SHORT_TEXT',
                    config: { pattern: '^[a-z0-9_]+$' },
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.username.pattern).toBe('^[a-z0-9_]+$');
        });
    });
    (0, vitest_1.describe)('options mapping', () => {
        (0, vitest_1.it)('should map SELECT options to enum', () => {
            const fields = [
                makeField({
                    key: 'country',
                    type: 'SELECT',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'USA', value: 'us' },
                            { label: 'Canada', value: 'ca' },
                        ],
                    },
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.country.enum).toEqual(['us', 'ca']);
        });
        (0, vitest_1.it)('should map RADIO options to enum', () => {
            const fields = [
                makeField({
                    key: 'gender',
                    type: 'RADIO',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Male', value: 'male' },
                            { label: 'Female', value: 'female' },
                        ],
                    },
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.gender.enum).toEqual(['male', 'female']);
        });
        (0, vitest_1.it)('should map MULTI_SELECT options to array items enum', () => {
            const fields = [
                makeField({
                    key: 'interests',
                    type: 'MULTI_SELECT',
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Sports', value: 'sports' },
                            { label: 'Music', value: 'music' },
                        ],
                    },
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.interests.items.enum).toEqual(['sports', 'music']);
        });
    });
    (0, vitest_1.describe)('required fields', () => {
        (0, vitest_1.it)('should mark required fields', () => {
            const fields = [
                makeField({ key: 'name', type: 'SHORT_TEXT', required: true }),
                makeField({ key: 'age', type: 'NUMBER', required: false }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.required).toContain('name');
            (0, vitest_1.expect)(schema.required).not.toContain('age');
        });
    });
    (0, vitest_1.describe)('field metadata', () => {
        (0, vitest_1.it)('should include field label as title', () => {
            const fields = [makeField({ key: 'email', label: 'Email Address' })];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.email.title).toBe('Email Address');
        });
        (0, vitest_1.it)('should include field description', () => {
            const fields = [
                makeField({
                    key: 'email',
                    description: 'Your primary email address',
                }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.email.description).toBe('Your primary email address');
        });
    });
    (0, vitest_1.describe)('excluded field types', () => {
        (0, vitest_1.it)('should exclude SECTION_BREAK', () => {
            const fields = [
                makeField({ key: 'section', type: 'SECTION_BREAK' }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.section).toBeUndefined();
        });
        (0, vitest_1.it)('should exclude FIELD_GROUP', () => {
            const fields = [
                makeField({ key: 'group', type: 'FIELD_GROUP' }),
            ];
            const schema = (0, json_schema_1.toJsonSchema)(fields);
            (0, vitest_1.expect)(schema.properties.group).toBeUndefined();
        });
    });
});
// ─── fromJsonSchema Tests ────────────────────────────────────────────────────
(0, vitest_1.describe)('fromJsonSchema', () => {
    (0, vitest_1.describe)('basic conversion', () => {
        (0, vitest_1.it)('should convert basic JSON Schema to fields', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    name: { type: 'string', title: 'Name' },
                },
                required: ['name'],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields.length).toBe(1);
            (0, vitest_1.expect)(fields[0].key).toBe('name');
            (0, vitest_1.expect)(fields[0].required).toBe(true);
        });
        (0, vitest_1.it)('should set field order sequentially', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    field1: { type: 'string' },
                    field2: { type: 'string' },
                    field3: { type: 'string' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            fields.forEach((field, index) => {
                (0, vitest_1.expect)(field.order).toBe(index);
            });
        });
    });
    (0, vitest_1.describe)('type inference', () => {
        (0, vitest_1.it)('should infer SHORT_TEXT for basic string', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    text: { type: 'string' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('SHORT_TEXT');
        });
        (0, vitest_1.it)('should infer LONG_TEXT for string with maxLength > 255', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    bio: { type: 'string', maxLength: 500 },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('LONG_TEXT');
        });
        (0, vitest_1.it)('should infer EMAIL from format', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('EMAIL');
        });
        (0, vitest_1.it)('should infer URL from uri format', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    website: { type: 'string', format: 'uri' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('URL');
        });
        (0, vitest_1.it)('should infer PHONE from phone format', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    phone: { type: 'string', format: 'phone' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('PHONE');
        });
        (0, vitest_1.it)('should infer DATE from date format', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    date: { type: 'string', format: 'date' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('DATE');
        });
        (0, vitest_1.it)('should infer TIME from time format', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    time: { type: 'string', format: 'time' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('TIME');
        });
        (0, vitest_1.it)('should infer DATE_TIME from date-time format', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    datetime: { type: 'string', format: 'date-time' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('DATE_TIME');
        });
        (0, vitest_1.it)('should infer SIGNATURE from data-url format', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    sig: { type: 'string', format: 'data-url' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('SIGNATURE');
        });
        (0, vitest_1.it)('should infer NUMBER from number type', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    price: { type: 'number' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('NUMBER');
        });
        (0, vitest_1.it)('should infer NUMBER from integer type', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    count: { type: 'integer' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('NUMBER');
        });
        (0, vitest_1.it)('should infer CHECKBOX from boolean type', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    agree: { type: 'boolean' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('CHECKBOX');
        });
        (0, vitest_1.it)('should infer SELECT from enum', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    country: { enum: ['us', 'ca'] },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('SELECT');
        });
        (0, vitest_1.it)('should infer MULTI_SELECT from array with enum items', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    interests: { type: 'array', items: { enum: ['sports', 'music'] } },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('MULTI_SELECT');
        });
        (0, vitest_1.it)('should infer FIELD_GROUP from object type', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    address: { type: 'object' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].type).toBe('FIELD_GROUP');
        });
    });
    (0, vitest_1.describe)('constraints preservation', () => {
        (0, vitest_1.it)('should preserve minLength constraint', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    username: { type: 'string', minLength: 3 },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].config.minLength).toBe(3);
        });
        (0, vitest_1.it)('should preserve maxLength constraint', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    username: { type: 'string', maxLength: 20 },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].config.maxLength).toBe(20);
        });
        (0, vitest_1.it)('should preserve min constraint', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    age: { type: 'integer', minimum: 0 },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].config.min).toBe(0);
        });
        (0, vitest_1.it)('should preserve max constraint', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    age: { type: 'integer', maximum: 150 },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].config.max).toBe(150);
        });
        (0, vitest_1.it)('should preserve pattern constraint', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    username: { type: 'string', pattern: '^[a-z0-9_]+$' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].config.pattern).toBe('^[a-z0-9_]+$');
        });
    });
    (0, vitest_1.describe)('options preservation', () => {
        (0, vitest_1.it)('should convert enum to SELECT options', () => {
            var _a, _b;
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    country: { enum: ['us', 'ca', 'mx'] },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)((_a = fields[0].config.options) === null || _a === void 0 ? void 0 : _a.length).toBe(3);
            (0, vitest_1.expect)((_b = fields[0].config.options) === null || _b === void 0 ? void 0 : _b[0]).toEqual({ label: 'us', value: 'us' });
        });
        (0, vitest_1.it)('should convert array items enum to MULTI_SELECT options', () => {
            var _a, _b;
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    interests: { type: 'array', items: { enum: ['sports', 'music', 'reading'] } },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)((_a = fields[0].config.options) === null || _a === void 0 ? void 0 : _a.length).toBe(3);
            (0, vitest_1.expect)((_b = fields[0].config.options) === null || _b === void 0 ? void 0 : _b[0]).toEqual({ label: 'sports', value: 'sports' });
        });
    });
    (0, vitest_1.describe)('metadata preservation', () => {
        (0, vitest_1.it)('should use JSON Schema title as label', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    email: { type: 'string', title: 'Email Address' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].label).toBe('Email Address');
        });
        (0, vitest_1.it)('should use key as fallback label', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    email: { type: 'string' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].label).toBe('email');
        });
        (0, vitest_1.it)('should preserve description', () => {
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {
                    email: { type: 'string', description: 'Your email address' },
                },
                required: [],
            };
            const fields = (0, json_schema_1.fromJsonSchema)(schema);
            (0, vitest_1.expect)(fields[0].description).toBe('Your email address');
        });
    });
});
// ─── Round-Trip Tests ────────────────────────────────────────────────────────
(0, vitest_1.describe)('Round-trip conversion', () => {
    (0, vitest_1.it)('should preserve required fields in round-trip', () => {
        const originalFields = [
            makeField({ key: 'name', type: 'SHORT_TEXT', required: true }),
            makeField({ key: 'email', type: 'EMAIL', required: true }),
            makeField({ key: 'phone', type: 'PHONE', required: false }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        (0, vitest_1.expect)(reconstructed[0].required).toBe(true);
        (0, vitest_1.expect)(reconstructed[1].required).toBe(true);
        (0, vitest_1.expect)(reconstructed[2].required).toBe(false);
    });
    (0, vitest_1.it)('should preserve field types in round-trip', () => {
        var _a, _b, _c, _d;
        const originalFields = [
            makeField({ key: 'email', type: 'EMAIL' }),
            makeField({ key: 'phone', type: 'PHONE' }),
            makeField({ key: 'website', type: 'URL' }),
            makeField({ key: 'date', type: 'DATE' }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        // Types should match or be inferred correctly
        (0, vitest_1.expect)((_a = reconstructed.find(f => f.key === 'email')) === null || _a === void 0 ? void 0 : _a.type).toBe('EMAIL');
        (0, vitest_1.expect)((_b = reconstructed.find(f => f.key === 'phone')) === null || _b === void 0 ? void 0 : _b.type).toBe('PHONE');
        (0, vitest_1.expect)((_c = reconstructed.find(f => f.key === 'website')) === null || _c === void 0 ? void 0 : _c.type).toBe('URL');
        (0, vitest_1.expect)((_d = reconstructed.find(f => f.key === 'date')) === null || _d === void 0 ? void 0 : _d.type).toBe('DATE');
    });
    (0, vitest_1.it)('should preserve text constraints in round-trip', () => {
        const originalFields = [
            makeField({
                key: 'username',
                type: 'SHORT_TEXT',
                config: { minLength: 3, maxLength: 20, pattern: '^[a-z0-9_]+$' },
            }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        (0, vitest_1.expect)(reconstructed[0].config.minLength).toBe(3);
        (0, vitest_1.expect)(reconstructed[0].config.maxLength).toBe(20);
        (0, vitest_1.expect)(reconstructed[0].config.pattern).toBe('^[a-z0-9_]+$');
    });
    (0, vitest_1.it)('should preserve number constraints in round-trip', () => {
        const originalFields = [
            makeField({
                key: 'age',
                type: 'NUMBER',
                config: { min: 0, max: 150 },
            }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        (0, vitest_1.expect)(reconstructed[0].config.min).toBe(0);
        (0, vitest_1.expect)(reconstructed[0].config.max).toBe(150);
    });
    (0, vitest_1.it)('should preserve select options in round-trip', () => {
        const originalFields = [
            makeField({
                key: 'country',
                type: 'SELECT',
                config: {
                    mode: 'static',
                    options: [
                        { label: 'USA', value: 'us' },
                        { label: 'Canada', value: 'ca' },
                    ],
                },
            }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        const reconstructedOptions = reconstructed[0].config.options;
        (0, vitest_1.expect)(reconstructedOptions === null || reconstructedOptions === void 0 ? void 0 : reconstructedOptions.length).toBe(2);
        (0, vitest_1.expect)(reconstructedOptions === null || reconstructedOptions === void 0 ? void 0 : reconstructedOptions[0].value).toBe('us');
        (0, vitest_1.expect)(reconstructedOptions === null || reconstructedOptions === void 0 ? void 0 : reconstructedOptions[1].value).toBe('ca');
    });
    (0, vitest_1.it)('should preserve multi-select options in round-trip', () => {
        const originalFields = [
            makeField({
                key: 'interests',
                type: 'MULTI_SELECT',
                config: {
                    mode: 'static',
                    options: [
                        { label: 'Sports', value: 'sports' },
                        { label: 'Music', value: 'music' },
                        { label: 'Reading', value: 'reading' },
                    ],
                },
            }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        const reconstructedOptions = reconstructed[0].config.options;
        (0, vitest_1.expect)(reconstructedOptions === null || reconstructedOptions === void 0 ? void 0 : reconstructedOptions.length).toBe(3);
        (0, vitest_1.expect)(reconstructedOptions === null || reconstructedOptions === void 0 ? void 0 : reconstructedOptions.map(o => o.value)).toEqual(['sports', 'music', 'reading']);
    });
    (0, vitest_1.it)('should maintain field order in round-trip', () => {
        const originalFields = [
            makeField({ key: 'field_a', order: 0 }),
            makeField({ key: 'field_b', order: 1 }),
            makeField({ key: 'field_c', order: 2 }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        (0, vitest_1.expect)(reconstructed[0].key).toBe('field_a');
        (0, vitest_1.expect)(reconstructed[1].key).toBe('field_b');
        (0, vitest_1.expect)(reconstructed[2].key).toBe('field_c');
    });
});
// ─── Complex Field Type Round-Trip Tests ─────────────────────────────────────
(0, vitest_1.describe)('Complex field type round-trips', () => {
    (0, vitest_1.it)('should handle all text field variants', () => {
        const originalFields = [
            makeField({ key: 'name', type: 'SHORT_TEXT' }),
            makeField({ key: 'bio', type: 'LONG_TEXT', config: { maxLength: 500 } }),
            makeField({ key: 'email', type: 'EMAIL' }),
            makeField({ key: 'phone', type: 'PHONE' }),
            makeField({ key: 'website', type: 'URL' }),
            makeField({ key: 'password', type: 'PASSWORD' }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        (0, vitest_1.expect)(reconstructed.length).toBe(6);
        (0, vitest_1.expect)(reconstructed.some(f => f.type === 'EMAIL')).toBe(true);
        (0, vitest_1.expect)(reconstructed.some(f => f.type === 'PHONE')).toBe(true);
        (0, vitest_1.expect)(reconstructed.some(f => f.type === 'URL')).toBe(true);
    });
    (0, vitest_1.it)('should handle all date/time field variants', () => {
        var _a, _b, _c, _d;
        const originalFields = [
            makeField({ key: 'date', type: 'DATE' }),
            makeField({ key: 'time', type: 'TIME' }),
            makeField({ key: 'datetime', type: 'DATE_TIME' }),
            makeField({ key: 'daterange', type: 'DATE_RANGE' }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        (0, vitest_1.expect)((_a = reconstructed.find(f => f.key === 'date')) === null || _a === void 0 ? void 0 : _a.type).toBe('DATE');
        (0, vitest_1.expect)((_b = reconstructed.find(f => f.key === 'time')) === null || _b === void 0 ? void 0 : _b.type).toBe('TIME');
        (0, vitest_1.expect)((_c = reconstructed.find(f => f.key === 'datetime')) === null || _c === void 0 ? void 0 : _c.type).toBe('DATE_TIME');
        (0, vitest_1.expect)((_d = reconstructed.find(f => f.key === 'daterange')) === null || _d === void 0 ? void 0 : _d.type).toBe('DATE_RANGE');
    });
    (0, vitest_1.it)('should handle all selection field variants', () => {
        var _a, _b, _c;
        const originalFields = [
            makeField({
                key: 'select',
                type: 'SELECT',
                config: {
                    mode: 'static',
                    options: [{ label: 'Option', value: 'opt' }],
                },
            }),
            makeField({
                key: 'radio',
                type: 'RADIO',
                config: {
                    mode: 'static',
                    options: [{ label: 'Option', value: 'opt' }],
                },
            }),
            makeField({
                key: 'multi',
                type: 'MULTI_SELECT',
                config: {
                    mode: 'static',
                    options: [{ label: 'Option', value: 'opt' }],
                },
            }),
        ];
        const schema = (0, json_schema_1.toJsonSchema)(originalFields);
        const reconstructed = (0, json_schema_1.fromJsonSchema)(schema);
        (0, vitest_1.expect)((_a = reconstructed.find(f => f.key === 'select')) === null || _a === void 0 ? void 0 : _a.type).toBe('SELECT');
        (0, vitest_1.expect)((_b = reconstructed.find(f => f.key === 'radio')) === null || _b === void 0 ? void 0 : _b.type).toBe('RADIO');
        (0, vitest_1.expect)((_c = reconstructed.find(f => f.key === 'multi')) === null || _c === void 0 ? void 0 : _c.type).toBe('MULTI_SELECT');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zY2hlbWEudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImpzb24tc2NoZW1hLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBNkM7QUFDN0Msb0RBQWlFO0FBR2pFOzs7Ozs7Ozs7R0FTRztBQUVILCtFQUErRTtBQUUvRSxTQUFTLFNBQVMsQ0FBQyxTQUErQzs7SUFDaEUsT0FBTztRQUNMLEVBQUUsRUFBRSxNQUFBLFNBQVMsQ0FBQyxFQUFFLG1DQUFJLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUM1QyxTQUFTLEVBQUUsTUFBQSxTQUFTLENBQUMsU0FBUyxtQ0FBSSxJQUFJO1FBQ3RDLEdBQUcsRUFBRSxTQUFTLENBQUMsR0FBRztRQUNsQixLQUFLLEVBQUUsTUFBQSxTQUFTLENBQUMsS0FBSyxtQ0FBSSxTQUFTLENBQUMsR0FBRztRQUN2QyxXQUFXLEVBQUUsTUFBQSxTQUFTLENBQUMsV0FBVyxtQ0FBSSxJQUFJO1FBQzFDLElBQUksRUFBRSxNQUFBLFNBQVMsQ0FBQyxJQUFJLG1DQUFJLFlBQVk7UUFDcEMsUUFBUSxFQUFFLE1BQUEsU0FBUyxDQUFDLFFBQVEsbUNBQUksS0FBSztRQUNyQyxLQUFLLEVBQUUsTUFBQSxTQUFTLENBQUMsS0FBSyxtQ0FBSSxDQUFDO1FBQzNCLE1BQU0sRUFBRSxNQUFBLFNBQVMsQ0FBQyxNQUFNLG1DQUFJLEVBQUU7UUFDOUIsTUFBTSxFQUFFLE1BQUEsU0FBUyxDQUFDLE1BQU0sbUNBQUksSUFBSTtRQUNoQyxTQUFTLEVBQUUsTUFBQSxTQUFTLENBQUMsU0FBUyxtQ0FBSSxJQUFJO1FBQ3RDLGFBQWEsRUFBRSxNQUFBLFNBQVMsQ0FBQyxhQUFhLG1DQUFJLElBQUk7UUFDOUMsVUFBVSxFQUFFLE1BQUEsU0FBUyxDQUFDLFVBQVUsbUNBQUksSUFBSTtRQUN4QyxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7S0FDN0IsQ0FBQTtBQUNILENBQUM7QUFFRCxnRkFBZ0Y7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QUFHLElBQUEsMEJBQVksRUFBQyxjQUFjLENBQUMsQ0FBQTtRQUMzQyxNQUFNLGFBQWEsR0FBRyxJQUFBLDRCQUFjLEVBQUMsTUFBTSxDQUFDLENBQUE7UUFFNUMsSUFBQSxlQUFNLEVBQUMsTUFBQSxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxRQUFRLENBQUMsMENBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3hFLElBQUEsZUFBTSxFQUFDLE1BQUEsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssT0FBTyxDQUFDLDBDQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUN0RSxJQUFBLGVBQU0sRUFBQyxNQUFBLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLE9BQU8sQ0FBQywwQ0FBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7SUFDL0UsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlc2NyaWJlLCBpdCwgZXhwZWN0IH0gZnJvbSAndml0ZXN0J1xuaW1wb3J0IHsgdG9Kc29uU2NoZW1hLCBmcm9tSnNvblNjaGVtYSB9IGZyb20gJy4uL3NyYy9qc29uLXNjaGVtYSdcbmltcG9ydCB0eXBlIHsgRm9ybUZpZWxkLCBKc29uU2NoZW1hIH0gZnJvbSAnLi4vc3JjL2pzb24tc2NoZW1hJ1xuXG4vKipcbiAqIFJvdW5kLXRyaXAgdGVzdHMgZm9yIEpTT04gU2NoZW1hIGNvbnZlcnNpb24uXG4gKlxuICogVGhlc2UgdGVzdHMgdmVyaWZ5IHRoYXQ6XG4gKiAtIERGRSBmaWVsZHMgY2FuIGJlIGNvbnZlcnRlZCB0byBKU09OIFNjaGVtYVxuICogLSBKU09OIFNjaGVtYSBjYW4gYmUgY29udmVydGVkIGJhY2sgdG8gREZFIGZpZWxkc1xuICogLSBSb3VuZC10cmlwIGNvbnZlcnNpb25zIHByZXNlcnZlIGVzc2VudGlhbCBpbmZvcm1hdGlvblxuICogLSBBbGwgZmllbGQgdHlwZXMgbWFwIGNvcnJlY3RseVxuICogLSBDb25zdHJhaW50cyBhbmQgb3B0aW9ucyBhcmUgcHJlc2VydmVkXG4gKi9cblxuLy8g4pSA4pSA4pSAIFRlc3QgSGVscGVycyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZnVuY3Rpb24gbWFrZUZpZWxkKG92ZXJyaWRlczogUGFydGlhbDxGb3JtRmllbGQ+ICYgeyBrZXk6IHN0cmluZyB9KTogRm9ybUZpZWxkIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogb3ZlcnJpZGVzLmlkID8/IGBmaWVsZF8ke292ZXJyaWRlcy5rZXl9YCxcbiAgICB2ZXJzaW9uSWQ6IG92ZXJyaWRlcy52ZXJzaW9uSWQgPz8gJ3YxJyxcbiAgICBrZXk6IG92ZXJyaWRlcy5rZXksXG4gICAgbGFiZWw6IG92ZXJyaWRlcy5sYWJlbCA/PyBvdmVycmlkZXMua2V5LFxuICAgIGRlc2NyaXB0aW9uOiBvdmVycmlkZXMuZGVzY3JpcHRpb24gPz8gbnVsbCxcbiAgICB0eXBlOiBvdmVycmlkZXMudHlwZSA/PyAnU0hPUlRfVEVYVCcsXG4gICAgcmVxdWlyZWQ6IG92ZXJyaWRlcy5yZXF1aXJlZCA/PyBmYWxzZSxcbiAgICBvcmRlcjogb3ZlcnJpZGVzLm9yZGVyID8/IDAsXG4gICAgY29uZmlnOiBvdmVycmlkZXMuY29uZmlnID8/IHt9LFxuICAgIHN0ZXBJZDogb3ZlcnJpZGVzLnN0ZXBJZCA/PyBudWxsLFxuICAgIHNlY3Rpb25JZDogb3ZlcnJpZGVzLnNlY3Rpb25JZCA/PyBudWxsLFxuICAgIHBhcmVudEZpZWxkSWQ6IG92ZXJyaWRlcy5wYXJlbnRGaWVsZElkID8/IG51bGwsXG4gICAgY29uZGl0aW9uczogb3ZlcnJpZGVzLmNvbmRpdGlvbnMgPz8gbnVsbCxcbiAgICBjaGlsZHJlbjogb3ZlcnJpZGVzLmNoaWxkcmVuLFxuICB9XG59XG5cbi8vIOKUgOKUgOKUgCB0b0pzb25TY2hlbWEgVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCd0b0pzb25TY2hlbWEnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdiYXNpYyBzdHJ1Y3R1cmUnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgdmFsaWQgSlNPTiBTY2hlbWEgb2JqZWN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS4kc2NoZW1hKS50b0JlKCdodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA3L3NjaGVtYSMnKVxuICAgICAgZXhwZWN0KHNjaGVtYS50eXBlKS50b0JlKCdvYmplY3QnKVxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3Qoc2NoZW1hLnJlcXVpcmVkKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSB0aXRsZSB3aGVuIHByb3ZpZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcywgJ1VzZXIgRm9ybScpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEudGl0bGUpLnRvQmUoJ1VzZXIgRm9ybScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgb21pdCB0aXRsZSB3aGVuIG5vdCBwcm92aWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEudGl0bGUpLnRvQmVVbmRlZmluZWQoKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2ZpZWxkIHR5cGUgbWFwcGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIG1hcCBTSE9SVF9URVhUIHRvIHN0cmluZycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLm5hbWUudHlwZSkudG9CZSgnc3RyaW5nJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBtYXAgTE9OR19URVhUIHRvIHN0cmluZycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdiaW8nLCB0eXBlOiAnTE9OR19URVhUJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5iaW8udHlwZSkudG9CZSgnc3RyaW5nJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBtYXAgTlVNQkVSIHRvIG51bWJlcicsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdhZ2UnLCB0eXBlOiAnTlVNQkVSJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5hZ2UudHlwZSkudG9CZSgnbnVtYmVyJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBtYXAgRU1BSUwgd2l0aCBmb3JtYXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLmVtYWlsLnR5cGUpLnRvQmUoJ3N0cmluZycpXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuZW1haWwuZm9ybWF0KS50b0JlKCdlbWFpbCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIFBIT05FIHdpdGggZm9ybWF0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3Bob25lJywgdHlwZTogJ1BIT05FJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5waG9uZS50eXBlKS50b0JlKCdzdHJpbmcnKVxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLnBob25lLmZvcm1hdCkudG9CZSgncGhvbmUnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBVUkwgd2l0aCB1cmkgZm9ybWF0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3dlYnNpdGUnLCB0eXBlOiAnVVJMJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy53ZWJzaXRlLnR5cGUpLnRvQmUoJ3N0cmluZycpXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMud2Vic2l0ZS5mb3JtYXQpLnRvQmUoJ3VyaScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIERBVEUgd2l0aCBkYXRlIGZvcm1hdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdiaXJ0aERhdGUnLCB0eXBlOiAnREFURScgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuYmlydGhEYXRlLnR5cGUpLnRvQmUoJ3N0cmluZycpXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuYmlydGhEYXRlLmZvcm1hdCkudG9CZSgnZGF0ZScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIFRJTUUgd2l0aCB0aW1lIGZvcm1hdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdtZWV0aW5nVGltZScsIHR5cGU6ICdUSU1FJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5tZWV0aW5nVGltZS50eXBlKS50b0JlKCdzdHJpbmcnKVxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLm1lZXRpbmdUaW1lLmZvcm1hdCkudG9CZSgndGltZScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIERBVEVfVElNRSB3aXRoIGRhdGUtdGltZSBmb3JtYXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnbWVldGluZ0RhdGVUaW1lJywgdHlwZTogJ0RBVEVfVElNRScgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMubWVldGluZ0RhdGVUaW1lLnR5cGUpLnRvQmUoJ3N0cmluZycpXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMubWVldGluZ0RhdGVUaW1lLmZvcm1hdCkudG9CZSgnZGF0ZS10aW1lJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBtYXAgREFURV9SQU5HRSB0byBvYmplY3QnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnZGF0ZVJhbmdlJywgdHlwZTogJ0RBVEVfUkFOR0UnIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLmRhdGVSYW5nZS50eXBlKS50b0JlKCdvYmplY3QnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBDSEVDS0JPWCB0byBib29sZWFuJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3N1YnNjcmliZScsIHR5cGU6ICdDSEVDS0JPWCcgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuc3Vic2NyaWJlLnR5cGUpLnRvQmUoJ2Jvb2xlYW4nKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBTRUxFQ1QgdG8gc3RyaW5nJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ2NvdW50cnknLCB0eXBlOiAnU0VMRUNUJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5jb3VudHJ5LnR5cGUpLnRvQmUoJ3N0cmluZycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIFJBRElPIHRvIHN0cmluZycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdnZW5kZXInLCB0eXBlOiAnUkFESU8nIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLmdlbmRlci50eXBlKS50b0JlKCdzdHJpbmcnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBNVUxUSV9TRUxFQ1QgdG8gYXJyYXknLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnaW50ZXJlc3RzJywgdHlwZTogJ01VTFRJX1NFTEVDVCcgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuaW50ZXJlc3RzLnR5cGUpLnRvQmUoJ2FycmF5JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBtYXAgUkFUSU5HIHRvIGludGVnZXInLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAncmF0aW5nJywgdHlwZTogJ1JBVElORycgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMucmF0aW5nLnR5cGUpLnRvQmUoJ2ludGVnZXInKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBTQ0FMRSB0byBpbnRlZ2VyJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3NjYWxlJywgdHlwZTogJ1NDQUxFJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5zY2FsZS50eXBlKS50b0JlKCdpbnRlZ2VyJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBtYXAgUEFTU1dPUkQgdG8gc3RyaW5nJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3Bhc3N3b3JkJywgdHlwZTogJ1BBU1NXT1JEJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5wYXNzd29yZC50eXBlKS50b0JlKCdzdHJpbmcnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBISURERU4gdG8gc3RyaW5nJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3Nlc3Npb25JZCcsIHR5cGU6ICdISURERU4nIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLnNlc3Npb25JZC50eXBlKS50b0JlKCdzdHJpbmcnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBGSUxFX1VQTE9BRCB3aXRoIHVyaSBmb3JtYXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnZG9jdW1lbnQnLCB0eXBlOiAnRklMRV9VUExPQUQnIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLmRvY3VtZW50LnR5cGUpLnRvQmUoJ3N0cmluZycpXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuZG9jdW1lbnQuZm9ybWF0KS50b0JlKCd1cmknKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBSSUNIX1RFWFQgdG8gc3RyaW5nJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ2NvbnRlbnQnLCB0eXBlOiAnUklDSF9URVhUJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5jb250ZW50LnR5cGUpLnRvQmUoJ3N0cmluZycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIFNJR05BVFVSRSB3aXRoIGRhdGEtdXJsIGZvcm1hdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICdzaWduYXR1cmUnLCB0eXBlOiAnU0lHTkFUVVJFJyB9KV1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5zaWduYXR1cmUudHlwZSkudG9CZSgnc3RyaW5nJylcbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5zaWduYXR1cmUuZm9ybWF0KS50b0JlKCdkYXRhLXVybCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFwIEFERFJFU1MgdG8gb2JqZWN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ2FkZHJlc3MnLCB0eXBlOiAnQUREUkVTUycgfSldXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuYWRkcmVzcy50eXBlKS50b0JlKCdvYmplY3QnKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2NvbnN0cmFpbnRzIG1hcHBpbmcnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIG1pbkxlbmd0aCBjb25zdHJhaW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ3VzZXJuYW1lJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgY29uZmlnOiB7IG1pbkxlbmd0aDogMyB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy51c2VybmFtZS5taW5MZW5ndGgpLnRvQmUoMylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIG1heExlbmd0aCBjb25zdHJhaW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ3VzZXJuYW1lJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgY29uZmlnOiB7IG1heExlbmd0aDogMjAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMudXNlcm5hbWUubWF4TGVuZ3RoKS50b0JlKDIwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgbWluIGNvbnN0cmFpbnQgYXMgbWluaW11bScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdhZ2UnLFxuICAgICAgICAgIHR5cGU6ICdOVU1CRVInLFxuICAgICAgICAgIGNvbmZpZzogeyBtaW46IDAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuYWdlLm1pbmltdW0pLnRvQmUoMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIG1heCBjb25zdHJhaW50IGFzIG1heGltdW0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnYWdlJyxcbiAgICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgICBjb25maWc6IHsgbWF4OiAxNTAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuYWdlLm1heGltdW0pLnRvQmUoMTUwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgcGF0dGVybiBjb25zdHJhaW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ3VzZXJuYW1lJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgY29uZmlnOiB7IHBhdHRlcm46ICdeW2EtejAtOV9dKyQnIH0sXG4gICAgICAgIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLnVzZXJuYW1lLnBhdHRlcm4pLnRvQmUoJ15bYS16MC05X10rJCcpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnb3B0aW9ucyBtYXBwaW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgbWFwIFNFTEVDVCBvcHRpb25zIHRvIGVudW0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnY291bnRyeScsXG4gICAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ1VTQScsIHZhbHVlOiAndXMnIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDYW5hZGEnLCB2YWx1ZTogJ2NhJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5jb3VudHJ5LmVudW0pLnRvRXF1YWwoWyd1cycsICdjYSddKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG1hcCBSQURJTyBvcHRpb25zIHRvIGVudW0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnZ2VuZGVyJyxcbiAgICAgICAgICB0eXBlOiAnUkFESU8nLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdNYWxlJywgdmFsdWU6ICdtYWxlJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnRmVtYWxlJywgdmFsdWU6ICdmZW1hbGUnIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLmdlbmRlci5lbnVtKS50b0VxdWFsKFsnbWFsZScsICdmZW1hbGUnXSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBtYXAgTVVMVElfU0VMRUNUIG9wdGlvbnMgdG8gYXJyYXkgaXRlbXMgZW51bScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdpbnRlcmVzdHMnLFxuICAgICAgICAgIHR5cGU6ICdNVUxUSV9TRUxFQ1QnLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdTcG9ydHMnLCB2YWx1ZTogJ3Nwb3J0cycgfSxcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ011c2ljJywgdmFsdWU6ICdtdXNpYycgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuaW50ZXJlc3RzLml0ZW1zLmVudW0pLnRvRXF1YWwoWydzcG9ydHMnLCAnbXVzaWMnXSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdyZXF1aXJlZCBmaWVsZHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBtYXJrIHJlcXVpcmVkIGZpZWxkcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUgfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2FnZScsIHR5cGU6ICdOVU1CRVInLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnJlcXVpcmVkKS50b0NvbnRhaW4oJ25hbWUnKVxuICAgICAgZXhwZWN0KHNjaGVtYS5yZXF1aXJlZCkubm90LnRvQ29udGFpbignYWdlJylcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdmaWVsZCBtZXRhZGF0YScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgZmllbGQgbGFiZWwgYXMgdGl0bGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCBsYWJlbDogJ0VtYWlsIEFkZHJlc3MnIH0pXVxuICAgICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKGZpZWxkcylcblxuICAgICAgZXhwZWN0KHNjaGVtYS5wcm9wZXJ0aWVzLmVtYWlsLnRpdGxlKS50b0JlKCdFbWFpbCBBZGRyZXNzJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIGZpZWxkIGRlc2NyaXB0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoe1xuICAgICAgICAgIGtleTogJ2VtYWlsJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgcHJpbWFyeSBlbWFpbCBhZGRyZXNzJyxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuZW1haWwuZGVzY3JpcHRpb24pLnRvQmUoJ1lvdXIgcHJpbWFyeSBlbWFpbCBhZGRyZXNzJylcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdleGNsdWRlZCBmaWVsZCB0eXBlcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGV4Y2x1ZGUgU0VDVElPTl9CUkVBSycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnc2VjdGlvbicsIHR5cGU6ICdTRUNUSU9OX0JSRUFLJyB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChzY2hlbWEucHJvcGVydGllcy5zZWN0aW9uKS50b0JlVW5kZWZpbmVkKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBleGNsdWRlIEZJRUxEX0dST1VQJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdncm91cCcsIHR5cGU6ICdGSUVMRF9HUk9VUCcgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc2NoZW1hLnByb3BlcnRpZXMuZ3JvdXApLnRvQmVVbmRlZmluZWQoKVxuICAgIH0pXG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgZnJvbUpzb25TY2hlbWEgVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdmcm9tSnNvblNjaGVtYScsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGNvbnZlcnNpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb252ZXJ0IGJhc2ljIEpTT04gU2NoZW1hIHRvIGZpZWxkcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgdGl0bGU6ICdOYW1lJyB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyduYW1lJ10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkcy5sZW5ndGgpLnRvQmUoMSlcbiAgICAgIGV4cGVjdChmaWVsZHNbMF0ua2V5KS50b0JlKCduYW1lJylcbiAgICAgIGV4cGVjdChmaWVsZHNbMF0ucmVxdWlyZWQpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzZXQgZmllbGQgb3JkZXIgc2VxdWVudGlhbGx5JywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBmaWVsZDE6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICBmaWVsZDI6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICBmaWVsZDM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGZpZWxkcy5mb3JFYWNoKChmaWVsZCwgaW5kZXgpID0+IHtcbiAgICAgICAgZXhwZWN0KGZpZWxkLm9yZGVyKS50b0JlKGluZGV4KVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd0eXBlIGluZmVyZW5jZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGluZmVyIFNIT1JUX1RFWFQgZm9yIGJhc2ljIHN0cmluZycsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGV4dDogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS50eXBlKS50b0JlKCdTSE9SVF9URVhUJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmZlciBMT05HX1RFWFQgZm9yIHN0cmluZyB3aXRoIG1heExlbmd0aCA+IDI1NScsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYmlvOiB7IHR5cGU6ICdzdHJpbmcnLCBtYXhMZW5ndGg6IDUwMCB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS50eXBlKS50b0JlKCdMT05HX1RFWFQnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluZmVyIEVNQUlMIGZyb20gZm9ybWF0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBlbWFpbDogeyB0eXBlOiAnc3RyaW5nJywgZm9ybWF0OiAnZW1haWwnIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLnR5cGUpLnRvQmUoJ0VNQUlMJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmZlciBVUkwgZnJvbSB1cmkgZm9ybWF0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB3ZWJzaXRlOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICd1cmknIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLnR5cGUpLnRvQmUoJ1VSTCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5mZXIgUEhPTkUgZnJvbSBwaG9uZSBmb3JtYXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzY2hlbWE6IEpzb25TY2hlbWEgPSB7XG4gICAgICAgICRzY2hlbWE6ICdodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA3L3NjaGVtYSMnLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHBob25lOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICdwaG9uZScgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0udHlwZSkudG9CZSgnUEhPTkUnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluZmVyIERBVEUgZnJvbSBkYXRlIGZvcm1hdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZGF0ZTogeyB0eXBlOiAnc3RyaW5nJywgZm9ybWF0OiAnZGF0ZScgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0udHlwZSkudG9CZSgnREFURScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5mZXIgVElNRSBmcm9tIHRpbWUgZm9ybWF0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB0aW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICd0aW1lJyB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS50eXBlKS50b0JlKCdUSU1FJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmZlciBEQVRFX1RJTUUgZnJvbSBkYXRlLXRpbWUgZm9ybWF0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBkYXRldGltZTogeyB0eXBlOiAnc3RyaW5nJywgZm9ybWF0OiAnZGF0ZS10aW1lJyB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS50eXBlKS50b0JlKCdEQVRFX1RJTUUnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluZmVyIFNJR05BVFVSRSBmcm9tIGRhdGEtdXJsIGZvcm1hdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgc2lnOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICdkYXRhLXVybCcgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0udHlwZSkudG9CZSgnU0lHTkFUVVJFJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmZlciBOVU1CRVIgZnJvbSBudW1iZXIgdHlwZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcHJpY2U6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0udHlwZSkudG9CZSgnTlVNQkVSJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmZlciBOVU1CRVIgZnJvbSBpbnRlZ2VyIHR5cGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzY2hlbWE6IEpzb25TY2hlbWEgPSB7XG4gICAgICAgICRzY2hlbWE6ICdodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA3L3NjaGVtYSMnLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGNvdW50OiB7IHR5cGU6ICdpbnRlZ2VyJyB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS50eXBlKS50b0JlKCdOVU1CRVInKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluZmVyIENIRUNLQk9YIGZyb20gYm9vbGVhbiB0eXBlJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhZ3JlZTogeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0udHlwZSkudG9CZSgnQ0hFQ0tCT1gnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluZmVyIFNFTEVDVCBmcm9tIGVudW0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBzY2hlbWE6IEpzb25TY2hlbWEgPSB7XG4gICAgICAgICRzY2hlbWE6ICdodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA3L3NjaGVtYSMnLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGNvdW50cnk6IHsgZW51bTogWyd1cycsICdjYSddIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLnR5cGUpLnRvQmUoJ1NFTEVDVCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5mZXIgTVVMVElfU0VMRUNUIGZyb20gYXJyYXkgd2l0aCBlbnVtIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBpbnRlcmVzdHM6IHsgdHlwZTogJ2FycmF5JywgaXRlbXM6IHsgZW51bTogWydzcG9ydHMnLCAnbXVzaWMnXSB9IH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLnR5cGUpLnRvQmUoJ01VTFRJX1NFTEVDVCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5mZXIgRklFTERfR1JPVVAgZnJvbSBvYmplY3QgdHlwZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWRkcmVzczogeyB0eXBlOiAnb2JqZWN0JyB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS50eXBlKS50b0JlKCdGSUVMRF9HUk9VUCcpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnY29uc3RyYWludHMgcHJlc2VydmF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgbWluTGVuZ3RoIGNvbnN0cmFpbnQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzY2hlbWE6IEpzb25TY2hlbWEgPSB7XG4gICAgICAgICRzY2hlbWE6ICdodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA3L3NjaGVtYSMnLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHVzZXJuYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBtaW5MZW5ndGg6IDMgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0uY29uZmlnLm1pbkxlbmd0aCkudG9CZSgzKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByZXNlcnZlIG1heExlbmd0aCBjb25zdHJhaW50JywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB1c2VybmFtZTogeyB0eXBlOiAnc3RyaW5nJywgbWF4TGVuZ3RoOiAyMCB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS5jb25maWcubWF4TGVuZ3RoKS50b0JlKDIwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByZXNlcnZlIG1pbiBjb25zdHJhaW50JywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhZ2U6IHsgdHlwZTogJ2ludGVnZXInLCBtaW5pbXVtOiAwIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmNvbmZpZy5taW4pLnRvQmUoMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcmVzZXJ2ZSBtYXggY29uc3RyYWludCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWdlOiB7IHR5cGU6ICdpbnRlZ2VyJywgbWF4aW11bTogMTUwIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmNvbmZpZy5tYXgpLnRvQmUoMTUwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHByZXNlcnZlIHBhdHRlcm4gY29uc3RyYWludCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdXNlcm5hbWU6IHsgdHlwZTogJ3N0cmluZycsIHBhdHRlcm46ICdeW2EtejAtOV9dKyQnIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmNvbmZpZy5wYXR0ZXJuKS50b0JlKCdeW2EtejAtOV9dKyQnKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ29wdGlvbnMgcHJlc2VydmF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY29udmVydCBlbnVtIHRvIFNFTEVDVCBvcHRpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2NoZW1hOiBKc29uU2NoZW1hID0ge1xuICAgICAgICAkc2NoZW1hOiAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNy9zY2hlbWEjJyxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjb3VudHJ5OiB7IGVudW06IFsndXMnLCAnY2EnLCAnbXgnXSB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS5jb25maWcub3B0aW9ucz8ubGVuZ3RoKS50b0JlKDMpXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmNvbmZpZy5vcHRpb25zPy5bMF0pLnRvRXF1YWwoeyBsYWJlbDogJ3VzJywgdmFsdWU6ICd1cycgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjb252ZXJ0IGFycmF5IGl0ZW1zIGVudW0gdG8gTVVMVElfU0VMRUNUIG9wdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzY2hlbWE6IEpzb25TY2hlbWEgPSB7XG4gICAgICAgICRzY2hlbWE6ICdodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA3L3NjaGVtYSMnLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGludGVyZXN0czogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyBlbnVtOiBbJ3Nwb3J0cycsICdtdXNpYycsICdyZWFkaW5nJ10gfSB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgICAgZXhwZWN0KGZpZWxkc1swXS5jb25maWcub3B0aW9ucz8ubGVuZ3RoKS50b0JlKDMpXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmNvbmZpZy5vcHRpb25zPy5bMF0pLnRvRXF1YWwoeyBsYWJlbDogJ3Nwb3J0cycsIHZhbHVlOiAnc3BvcnRzJyB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ21ldGFkYXRhIHByZXNlcnZhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHVzZSBKU09OIFNjaGVtYSB0aXRsZSBhcyBsYWJlbCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYTogSnNvblNjaGVtYSA9IHtcbiAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZW1haWw6IHsgdHlwZTogJ3N0cmluZycsIHRpdGxlOiAnRW1haWwgQWRkcmVzcycgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0ubGFiZWwpLnRvQmUoJ0VtYWlsIEFkZHJlc3MnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHVzZSBrZXkgYXMgZmFsbGJhY2sgbGFiZWwnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzY2hlbWE6IEpzb25TY2hlbWEgPSB7XG4gICAgICAgICRzY2hlbWE6ICdodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA3L3NjaGVtYSMnLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGVtYWlsOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmllbGRzID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgICBleHBlY3QoZmllbGRzWzBdLmxhYmVsKS50b0JlKCdlbWFpbCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgZGVzY3JpcHRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBzY2hlbWE6IEpzb25TY2hlbWEgPSB7XG4gICAgICAgICRzY2hlbWE6ICdodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA3L3NjaGVtYSMnLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGVtYWlsOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1lvdXIgZW1haWwgYWRkcmVzcycgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICAgIGV4cGVjdChmaWVsZHNbMF0uZGVzY3JpcHRpb24pLnRvQmUoJ1lvdXIgZW1haWwgYWRkcmVzcycpXG4gICAgfSlcbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBSb3VuZC1UcmlwIFRlc3RzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5kZXNjcmliZSgnUm91bmQtdHJpcCBjb252ZXJzaW9uJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHByZXNlcnZlIHJlcXVpcmVkIGZpZWxkcyBpbiByb3VuZC10cmlwJywgKCkgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsRmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcsIHR5cGU6ICdFTUFJTCcsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAncGhvbmUnLCB0eXBlOiAnUEhPTkUnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgXVxuXG4gICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKG9yaWdpbmFsRmllbGRzKVxuICAgIGNvbnN0IHJlY29uc3RydWN0ZWQgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZFswXS5yZXF1aXJlZCkudG9CZSh0cnVlKVxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkWzFdLnJlcXVpcmVkKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWRbMl0ucmVxdWlyZWQpLnRvQmUoZmFsc2UpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBwcmVzZXJ2ZSBmaWVsZCB0eXBlcyBpbiByb3VuZC10cmlwJywgKCkgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsRmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZW1haWwnLCB0eXBlOiAnRU1BSUwnIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAncGhvbmUnLCB0eXBlOiAnUEhPTkUnIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnd2Vic2l0ZScsIHR5cGU6ICdVUkwnIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZGF0ZScsIHR5cGU6ICdEQVRFJyB9KSxcbiAgICBdXG5cbiAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEob3JpZ2luYWxGaWVsZHMpXG4gICAgY29uc3QgcmVjb25zdHJ1Y3RlZCA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgIC8vIFR5cGVzIHNob3VsZCBtYXRjaCBvciBiZSBpbmZlcnJlZCBjb3JyZWN0bHlcbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZC5maW5kKGYgPT4gZi5rZXkgPT09ICdlbWFpbCcpPy50eXBlKS50b0JlKCdFTUFJTCcpXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWQuZmluZChmID0+IGYua2V5ID09PSAncGhvbmUnKT8udHlwZSkudG9CZSgnUEhPTkUnKVxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkLmZpbmQoZiA9PiBmLmtleSA9PT0gJ3dlYnNpdGUnKT8udHlwZSkudG9CZSgnVVJMJylcbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZC5maW5kKGYgPT4gZi5rZXkgPT09ICdkYXRlJyk/LnR5cGUpLnRvQmUoJ0RBVEUnKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcHJlc2VydmUgdGV4dCBjb25zdHJhaW50cyBpbiByb3VuZC10cmlwJywgKCkgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsRmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAndXNlcm5hbWUnLFxuICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgIGNvbmZpZzogeyBtaW5MZW5ndGg6IDMsIG1heExlbmd0aDogMjAsIHBhdHRlcm46ICdeW2EtejAtOV9dKyQnIH0sXG4gICAgICB9KSxcbiAgICBdXG5cbiAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEob3JpZ2luYWxGaWVsZHMpXG4gICAgY29uc3QgcmVjb25zdHJ1Y3RlZCA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkWzBdLmNvbmZpZy5taW5MZW5ndGgpLnRvQmUoMylcbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZFswXS5jb25maWcubWF4TGVuZ3RoKS50b0JlKDIwKVxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkWzBdLmNvbmZpZy5wYXR0ZXJuKS50b0JlKCdeW2EtejAtOV9dKyQnKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcHJlc2VydmUgbnVtYmVyIGNvbnN0cmFpbnRzIGluIHJvdW5kLXRyaXAnLCAoKSA9PiB7XG4gICAgY29uc3Qgb3JpZ2luYWxGaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdhZ2UnLFxuICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgY29uZmlnOiB7IG1pbjogMCwgbWF4OiAxNTAgfSxcbiAgICAgIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShvcmlnaW5hbEZpZWxkcylcbiAgICBjb25zdCByZWNvbnN0cnVjdGVkID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWRbMF0uY29uZmlnLm1pbikudG9CZSgwKVxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkWzBdLmNvbmZpZy5tYXgpLnRvQmUoMTUwKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcHJlc2VydmUgc2VsZWN0IG9wdGlvbnMgaW4gcm91bmQtdHJpcCcsICgpID0+IHtcbiAgICBjb25zdCBvcmlnaW5hbEZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2NvdW50cnknLFxuICAgICAgICB0eXBlOiAnU0VMRUNUJyxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBsYWJlbDogJ1VTQScsIHZhbHVlOiAndXMnIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2FuYWRhJywgdmFsdWU6ICdjYScgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuXG4gICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKG9yaWdpbmFsRmllbGRzKVxuICAgIGNvbnN0IHJlY29uc3RydWN0ZWQgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICBjb25zdCByZWNvbnN0cnVjdGVkT3B0aW9ucyA9IHJlY29uc3RydWN0ZWRbMF0uY29uZmlnLm9wdGlvbnNcbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZE9wdGlvbnM/Lmxlbmd0aCkudG9CZSgyKVxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkT3B0aW9ucz8uWzBdLnZhbHVlKS50b0JlKCd1cycpXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWRPcHRpb25zPy5bMV0udmFsdWUpLnRvQmUoJ2NhJylcbiAgfSlcblxuICBpdCgnc2hvdWxkIHByZXNlcnZlIG11bHRpLXNlbGVjdCBvcHRpb25zIGluIHJvdW5kLXRyaXAnLCAoKSA9PiB7XG4gICAgY29uc3Qgb3JpZ2luYWxGaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdpbnRlcmVzdHMnLFxuICAgICAgICB0eXBlOiAnTVVMVElfU0VMRUNUJyxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAgeyBsYWJlbDogJ1Nwb3J0cycsIHZhbHVlOiAnc3BvcnRzJyB9LFxuICAgICAgICAgICAgeyBsYWJlbDogJ011c2ljJywgdmFsdWU6ICdtdXNpYycgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdSZWFkaW5nJywgdmFsdWU6ICdyZWFkaW5nJyB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdXG5cbiAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEob3JpZ2luYWxGaWVsZHMpXG4gICAgY29uc3QgcmVjb25zdHJ1Y3RlZCA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgIGNvbnN0IHJlY29uc3RydWN0ZWRPcHRpb25zID0gcmVjb25zdHJ1Y3RlZFswXS5jb25maWcub3B0aW9uc1xuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkT3B0aW9ucz8ubGVuZ3RoKS50b0JlKDMpXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWRPcHRpb25zPy5tYXAobyA9PiBvLnZhbHVlKSkudG9FcXVhbChbJ3Nwb3J0cycsICdtdXNpYycsICdyZWFkaW5nJ10pXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBtYWludGFpbiBmaWVsZCBvcmRlciBpbiByb3VuZC10cmlwJywgKCkgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsRmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfYScsIG9yZGVyOiAwIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfYicsIG9yZGVyOiAxIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZmllbGRfYycsIG9yZGVyOiAyIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShvcmlnaW5hbEZpZWxkcylcbiAgICBjb25zdCByZWNvbnN0cnVjdGVkID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWRbMF0ua2V5KS50b0JlKCdmaWVsZF9hJylcbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZFsxXS5rZXkpLnRvQmUoJ2ZpZWxkX2InKVxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkWzJdLmtleSkudG9CZSgnZmllbGRfYycpXG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgQ29tcGxleCBGaWVsZCBUeXBlIFJvdW5kLVRyaXAgVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdDb21wbGV4IGZpZWxkIHR5cGUgcm91bmQtdHJpcHMnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgaGFuZGxlIGFsbCB0ZXh0IGZpZWxkIHZhcmlhbnRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsRmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJyB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2JpbycsIHR5cGU6ICdMT05HX1RFWFQnLCBjb25maWc6IHsgbWF4TGVuZ3RoOiA1MDAgfSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2VtYWlsJywgdHlwZTogJ0VNQUlMJyB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3Bob25lJywgdHlwZTogJ1BIT05FJyB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3dlYnNpdGUnLCB0eXBlOiAnVVJMJyB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3Bhc3N3b3JkJywgdHlwZTogJ1BBU1NXT1JEJyB9KSxcbiAgICBdXG5cbiAgICBjb25zdCBzY2hlbWEgPSB0b0pzb25TY2hlbWEob3JpZ2luYWxGaWVsZHMpXG4gICAgY29uc3QgcmVjb25zdHJ1Y3RlZCA9IGZyb21Kc29uU2NoZW1hKHNjaGVtYSlcblxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkLmxlbmd0aCkudG9CZSg2KVxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkLnNvbWUoZiA9PiBmLnR5cGUgPT09ICdFTUFJTCcpKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWQuc29tZShmID0+IGYudHlwZSA9PT0gJ1BIT05FJykpLnRvQmUodHJ1ZSlcbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZC5zb21lKGYgPT4gZi50eXBlID09PSAnVVJMJykpLnRvQmUodHJ1ZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhbmRsZSBhbGwgZGF0ZS90aW1lIGZpZWxkIHZhcmlhbnRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsRmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZGF0ZScsIHR5cGU6ICdEQVRFJyB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3RpbWUnLCB0eXBlOiAnVElNRScgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdkYXRldGltZScsIHR5cGU6ICdEQVRFX1RJTUUnIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnZGF0ZXJhbmdlJywgdHlwZTogJ0RBVEVfUkFOR0UnIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHRvSnNvblNjaGVtYShvcmlnaW5hbEZpZWxkcylcbiAgICBjb25zdCByZWNvbnN0cnVjdGVkID0gZnJvbUpzb25TY2hlbWEoc2NoZW1hKVxuXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWQuZmluZChmID0+IGYua2V5ID09PSAnZGF0ZScpPy50eXBlKS50b0JlKCdEQVRFJylcbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZC5maW5kKGYgPT4gZi5rZXkgPT09ICd0aW1lJyk/LnR5cGUpLnRvQmUoJ1RJTUUnKVxuICAgIGV4cGVjdChyZWNvbnN0cnVjdGVkLmZpbmQoZiA9PiBmLmtleSA9PT0gJ2RhdGV0aW1lJyk/LnR5cGUpLnRvQmUoJ0RBVEVfVElNRScpXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWQuZmluZChmID0+IGYua2V5ID09PSAnZGF0ZXJhbmdlJyk/LnR5cGUpLnRvQmUoJ0RBVEVfUkFOR0UnKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgaGFuZGxlIGFsbCBzZWxlY3Rpb24gZmllbGQgdmFyaWFudHMnLCAoKSA9PiB7XG4gICAgY29uc3Qgb3JpZ2luYWxGaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdzZWxlY3QnLFxuICAgICAgICB0eXBlOiAnU0VMRUNUJyxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgb3B0aW9uczogW3sgbGFiZWw6ICdPcHRpb24nLCB2YWx1ZTogJ29wdCcgfV0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ3JhZGlvJyxcbiAgICAgICAgdHlwZTogJ1JBRElPJyxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgb3B0aW9uczogW3sgbGFiZWw6ICdPcHRpb24nLCB2YWx1ZTogJ29wdCcgfV0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ211bHRpJyxcbiAgICAgICAgdHlwZTogJ01VTFRJX1NFTEVDVCcsXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgIG9wdGlvbnM6IFt7IGxhYmVsOiAnT3B0aW9uJywgdmFsdWU6ICdvcHQnIH1dLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuXG4gICAgY29uc3Qgc2NoZW1hID0gdG9Kc29uU2NoZW1hKG9yaWdpbmFsRmllbGRzKVxuICAgIGNvbnN0IHJlY29uc3RydWN0ZWQgPSBmcm9tSnNvblNjaGVtYShzY2hlbWEpXG5cbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZC5maW5kKGYgPT4gZi5rZXkgPT09ICdzZWxlY3QnKT8udHlwZSkudG9CZSgnU0VMRUNUJylcbiAgICBleHBlY3QocmVjb25zdHJ1Y3RlZC5maW5kKGYgPT4gZi5rZXkgPT09ICdyYWRpbycpPy50eXBlKS50b0JlKCdSQURJTycpXG4gICAgZXhwZWN0KHJlY29uc3RydWN0ZWQuZmluZChmID0+IGYua2V5ID09PSAnbXVsdGknKT8udHlwZSkudG9CZSgnTVVMVElfU0VMRUNUJylcbiAgfSlcbn0pXG4iXX0=