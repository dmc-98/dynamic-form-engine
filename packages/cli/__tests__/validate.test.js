"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const validate_1 = require("../src/commands/validate");
/**
 * Tests for the CLI validate command.
 *
 * Validates DFE form configuration files for:
 * - Valid JSON structure
 * - Required fields (key, type)
 * - Duplicate IDs and keys
 * - Reference integrity
 * - Circular dependencies
 * - API contract validity
 * - Best practice violations
 */
// ─── Test Fixtures and Helpers ──────────────────────────────────────────────
let testDir;
let testFileIndex = 0;
(0, vitest_1.beforeEach)(() => {
    testDir = (0, node_os_1.tmpdir)();
});
(0, vitest_1.afterEach)(() => {
    // Cleanup is handled by temp file deletion in each test
});
function createTestFile(fileName, content) {
    const filePath = (0, node_path_1.join)(testDir, `${fileName}_${testFileIndex++}.json`);
    (0, node_fs_1.writeFileSync)(filePath, JSON.stringify(content, null, 2));
    return filePath;
}
function cleanupFile(filePath) {
    try {
        (0, node_fs_1.unlinkSync)(filePath);
    }
    catch (_a) {
        // File might not exist
    }
}
function createValidConfig() {
    return {
        fields: [
            {
                id: 'field_name',
                key: 'name',
                label: 'Full Name',
                type: 'SHORT_TEXT',
                required: true,
                order: 0,
                config: {},
            },
        ],
        steps: [
            {
                id: 'step1',
                title: 'Step 1',
                order: 0,
                config: null,
                conditions: null,
            },
        ],
    };
}
// ─── Basic Validation Tests ─────────────────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - Basic Validation', () => {
    (0, vitest_1.it)('should validate correct config as valid', () => {
        const config = createValidConfig();
        const filePath = createTestFile('valid', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.issues.length).toBe(0);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should detect missing file', () => {
        const filePath = '/nonexistent/path/config.json';
        const result = (0, validate_1.validateFormConfig)(filePath);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.issues.some(i => i.severity === 'error')).toBe(true);
        (0, vitest_1.expect)(result.issues.some(i => i.message.includes('not found'))).toBe(true);
    });
    (0, vitest_1.it)('should detect invalid JSON', () => {
        const filePath = (0, node_path_1.join)(testDir, `invalid_json_${testFileIndex++}.json`);
        (0, node_fs_1.writeFileSync)(filePath, '{ invalid json }');
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('Invalid JSON'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should require fields or steps at top level', () => {
        const config = { title: 'Empty form' };
        const filePath = createTestFile('no_fields', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('fields') || i.message.includes('steps'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
// ─── Field Validation Tests ─────────────────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - Field Validation', () => {
    (0, vitest_1.it)('should require field key', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    // Missing key
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                },
            ],
        };
        const filePath = createTestFile('missing_key', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('key'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should require field type', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'field1',
                    // Missing type
                    required: false,
                    order: 0,
                    config: {},
                },
            ],
        };
        const filePath = createTestFile('missing_type', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('type'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should warn on missing field label', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'field1',
                    type: 'SHORT_TEXT',
                    // Missing label
                    required: false,
                    order: 0,
                    config: {},
                },
            ],
        };
        const filePath = createTestFile('missing_label', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.issues.some(i => i.severity === 'warning' && i.message.includes('label'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should detect duplicate field ids', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'name',
                    label: 'Name',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                },
                {
                    id: 'field_1', // Duplicate
                    key: 'email',
                    label: 'Email',
                    type: 'EMAIL',
                    required: false,
                    order: 1,
                    config: {},
                },
            ],
        };
        const filePath = createTestFile('dup_id', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('Duplicate') && i.message.includes('id'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should detect duplicate field keys', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'email',
                    label: 'Email',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                },
                {
                    id: 'field_2',
                    key: 'email', // Duplicate
                    label: 'Email 2',
                    type: 'EMAIL',
                    required: false,
                    order: 1,
                    config: {},
                },
            ],
        };
        const filePath = createTestFile('dup_key', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('Duplicate') && i.message.includes('key'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should detect self-referencing conditions', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'field1',
                    label: 'Field 1',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'field1', operator: 'EQUALS', value: 'something' }, // Self-reference
                        ],
                    },
                },
            ],
        };
        const filePath = createTestFile('self_ref', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('Self-referencing'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should detect missing parentFieldId reference', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'field1',
                    label: 'Field 1',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                    parentFieldId: 'nonexistent_parent', // Non-existent reference
                },
            ],
        };
        const filePath = createTestFile('bad_parent', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('parentFieldId'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
// ─── Step Validation Tests ───────────────────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - Step Validation', () => {
    (0, vitest_1.it)('should require step id', () => {
        const config = {
            steps: [
                {
                    // Missing id
                    title: 'Step 1',
                    order: 0,
                    config: null,
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('step_no_id', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('id') && i.message.includes('Step'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should warn on missing step title', () => {
        const config = {
            steps: [
                {
                    id: 'step_1',
                    // Missing title
                    order: 0,
                    config: null,
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('step_no_title', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.issues.some(i => i.severity === 'warning' && i.message.includes('title'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should detect duplicate step ids', () => {
        const config = {
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    order: 0,
                    config: null,
                    conditions: null,
                },
                {
                    id: 'step_1', // Duplicate
                    title: 'Step 2',
                    order: 1,
                    config: null,
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('step_dup', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('Duplicate') && i.message.includes('step'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
// ─── Cross-Reference Validation Tests ────────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - Cross-Reference Validation', () => {
    (0, vitest_1.it)('should validate step references in fields', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'name',
                    label: 'Name',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                    stepId: 'nonexistent_step',
                },
            ],
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    order: 0,
                    config: null,
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('bad_stepid', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('stepId'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should allow valid step references', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'name',
                    label: 'Name',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                    stepId: 'step_1',
                },
            ],
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    order: 0,
                    config: null,
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('good_stepid', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            const stepIdErrors = result.issues.filter(i => i.message.includes('stepId'));
            (0, vitest_1.expect)(stepIdErrors.length).toBe(0);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
// ─── API Contract Validation Tests ──────────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - API Contract Validation', () => {
    (0, vitest_1.it)('should require endpoint in API contract', () => {
        const config = {
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    order: 0,
                    config: {
                        apiContracts: [
                            {
                                // Missing endpoint
                                resourceName: 'User',
                                method: 'PUT',
                                fieldMapping: {},
                            },
                        ],
                    },
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('api_no_endpoint', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('endpoint'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should warn on missing resourceName in API contract', () => {
        const config = {
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    order: 0,
                    config: {
                        apiContracts: [
                            {
                                endpoint: '/api/users/{id}',
                                // Missing resourceName
                                method: 'PUT',
                                fieldMapping: {},
                            },
                        ],
                    },
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('api_no_resource', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.issues.some(i => i.severity === 'warning' && i.message.includes('resourceName'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should validate API contract field mapping references', () => {
        const config = {
            fields: [
                {
                    id: 'field_name',
                    key: 'name',
                    label: 'Name',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                },
            ],
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    order: 0,
                    config: {
                        apiContracts: [
                            {
                                endpoint: '/api/users/{id}',
                                resourceName: 'User',
                                method: 'PUT',
                                fieldMapping: {
                                    nonexistentField: 'firstName', // Field doesn't exist
                                },
                            },
                        ],
                    },
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('api_bad_mapping', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('fieldMapping') && i.message.includes('unknown'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
// ─── Branch Validation Tests ────────────────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - Branch Validation', () => {
    (0, vitest_1.it)('should detect invalid branch target', () => {
        const config = {
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    order: 0,
                    config: null,
                    conditions: null,
                    branches: [
                        {
                            condition: 'type === "a"',
                            targetStepId: 'nonexistent_step', // Invalid target
                        },
                    ],
                },
                {
                    id: 'step_2',
                    title: 'Step 2',
                    order: 1,
                    config: null,
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('bad_branch', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('targets unknown step'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should allow valid branch targets', () => {
        const config = {
            steps: [
                {
                    id: 'step_1',
                    title: 'Step 1',
                    order: 0,
                    config: null,
                    conditions: null,
                    branches: [
                        {
                            condition: 'type === "a"',
                            targetStepId: 'step_2', // Valid target
                        },
                    ],
                },
                {
                    id: 'step_2',
                    title: 'Step 2',
                    order: 1,
                    config: null,
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('good_branch', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            const branchErrors = result.issues.filter(i => i.message.includes('Branch'));
            (0, vitest_1.expect)(branchErrors.length).toBe(0);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
// ─── Circular Dependency Detection Tests ────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - Circular Dependencies', () => {
    (0, vitest_1.it)('should detect direct circular dependency', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'field1',
                    label: 'Field 1',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'field2', operator: 'NOT_EMPTY', value: null },
                        ],
                    },
                },
                {
                    id: 'field_2',
                    key: 'field2',
                    label: 'Field 2',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 1,
                    config: {},
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'field1', operator: 'NOT_EMPTY', value: null }, // Circular
                        ],
                    },
                },
            ],
        };
        const filePath = createTestFile('circular', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('Circular'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should detect transitive circular dependencies', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'field1',
                    label: 'Field 1',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'field2', operator: 'NOT_EMPTY', value: null },
                        ],
                    },
                },
                {
                    id: 'field_2',
                    key: 'field2',
                    label: 'Field 2',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 1,
                    config: {},
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'field3', operator: 'NOT_EMPTY', value: null },
                        ],
                    },
                },
                {
                    id: 'field_3',
                    key: 'field3',
                    label: 'Field 3',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 2,
                    config: {},
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'field1', operator: 'NOT_EMPTY', value: null }, // Circular path
                        ],
                    },
                },
            ],
        };
        const filePath = createTestFile('transitive_circular', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.some(i => i.message.includes('Circular'))).toBe(true);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should allow non-circular dependencies', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'field1',
                    label: 'Field 1',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                },
                {
                    id: 'field_2',
                    key: 'field2',
                    label: 'Field 2',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 1,
                    config: {},
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'field1', operator: 'NOT_EMPTY', value: null }, // Valid dependency
                        ],
                    },
                },
                {
                    id: 'field_3',
                    key: 'field3',
                    label: 'Field 3',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 2,
                    config: {},
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'field2', operator: 'NOT_EMPTY', value: null }, // Valid dependency
                        ],
                    },
                },
            ],
        };
        const filePath = createTestFile('linear_deps', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            const circularIssues = result.issues.filter(i => i.message.includes('Circular'));
            (0, vitest_1.expect)(circularIssues.length).toBe(0);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
// ─── Complex Validation Tests ───────────────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - Complex Scenarios', () => {
    (0, vitest_1.it)('should validate comprehensive form config', () => {
        const config = {
            fields: [
                {
                    id: 'field_role',
                    key: 'role',
                    label: 'Role',
                    type: 'SELECT',
                    required: true,
                    order: 0,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Admin', value: 'admin' },
                            { label: 'User', value: 'user' },
                        ],
                    },
                    stepId: 'step_1',
                },
                {
                    id: 'field_permissions',
                    key: 'permissions',
                    label: 'Permissions',
                    type: 'MULTI_SELECT',
                    required: false,
                    order: 1,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Read', value: 'read' },
                            { label: 'Write', value: 'write' },
                        ],
                    },
                    stepId: 'step_2',
                    conditions: {
                        operator: 'AND',
                        rules: [
                            { fieldKey: 'role', operator: 'EQUALS', value: 'admin' },
                        ],
                    },
                },
            ],
            steps: [
                {
                    id: 'step_1',
                    title: 'Role Selection',
                    order: 0,
                    config: {
                        apiContracts: [
                            {
                                endpoint: '/api/roles',
                                resourceName: 'Role',
                                method: 'GET',
                                fieldMapping: {
                                    role: 'selectedRole',
                                },
                            },
                        ],
                    },
                    conditions: null,
                    branches: [
                        {
                            condition: 'role === "admin"',
                            targetStepId: 'step_2',
                        },
                    ],
                },
                {
                    id: 'step_2',
                    title: 'Permissions',
                    order: 1,
                    config: null,
                    conditions: null,
                },
            ],
        };
        const filePath = createTestFile('comprehensive', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            // Should be valid
            (0, vitest_1.expect)(result.issues.filter(i => i.severity === 'error').length).toBe(0);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should report multiple validation issues', () => {
        const config = {
            fields: [
                {
                    // Missing key and type
                    id: 'field_1',
                    required: false,
                    order: 0,
                    config: {},
                },
                {
                    id: 'field_1', // Duplicate ID
                    key: 'field2',
                    label: 'Field 2',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 1,
                    config: {},
                    stepId: 'nonexistent',
                },
            ],
        };
        const filePath = createTestFile('multi_error', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.issues.length).toBeGreaterThan(2);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
// ─── Issue Severity Tests ───────────────────────────────────────────────────
(0, vitest_1.describe)('validateFormConfig - Issue Severity', () => {
    (0, vitest_1.it)('should differentiate between errors and warnings', () => {
        const config = {
            fields: [
                {
                    id: 'field_1',
                    key: 'field1',
                    // Missing label (warning)
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                },
            ],
        };
        const filePath = createTestFile('severity', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            const warnings = result.issues.filter(i => i.severity === 'warning');
            const errors = result.issues.filter(i => i.severity === 'error');
            (0, vitest_1.expect)(warnings.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(errors.length).toBe(0);
        }
        finally {
            cleanupFile(filePath);
        }
    });
    (0, vitest_1.it)('should mark missing required fields as errors', () => {
        const config = {
            fields: [
                {
                    // Missing key (error)
                    id: 'field_1',
                    type: 'SHORT_TEXT',
                    required: false,
                    order: 0,
                    config: {},
                },
            ],
        };
        const filePath = createTestFile('error_severity', config);
        try {
            const result = (0, validate_1.validateFormConfig)(filePath);
            const errors = result.issues.filter(i => i.severity === 'error');
            (0, vitest_1.expect)(errors.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.valid).toBe(false);
        }
        finally {
            cleanupFile(filePath);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZhbGlkYXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBb0U7QUFDcEUscUNBQThEO0FBQzlELHFDQUFnQztBQUNoQyx5Q0FBZ0M7QUFDaEMsdURBQW1GO0FBRW5GOzs7Ozs7Ozs7OztHQVdHO0FBRUgsK0VBQStFO0FBRS9FLElBQUksT0FBZSxDQUFBO0FBQ25CLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQTtBQUVyQixJQUFBLG1CQUFVLEVBQUMsR0FBRyxFQUFFO0lBQ2QsT0FBTyxHQUFHLElBQUEsZ0JBQU0sR0FBRSxDQUFBO0FBQ3BCLENBQUMsQ0FBQyxDQUFBO0FBRUYsSUFBQSxrQkFBUyxFQUFDLEdBQUcsRUFBRTtJQUNiLHdEQUF3RDtBQUMxRCxDQUFDLENBQUMsQ0FBQTtBQUVGLFNBQVMsY0FBYyxDQUFDLFFBQWdCLEVBQUUsT0FBWTtJQUNwRCxNQUFNLFFBQVEsR0FBRyxJQUFBLGdCQUFJLEVBQUMsT0FBTyxFQUFFLEdBQUcsUUFBUSxJQUFJLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNyRSxJQUFBLHVCQUFhLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ3pELE9BQU8sUUFBUSxDQUFBO0FBQ2pCLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxRQUFnQjtJQUNuQyxJQUFJLENBQUM7UUFDSCxJQUFBLG9CQUFVLEVBQUMsUUFBUSxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUFDLFdBQU0sQ0FBQztRQUNQLHVCQUF1QjtJQUN6QixDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsaUJBQWlCO0lBQ3hCLE9BQU87UUFDTCxNQUFNLEVBQUU7WUFDTjtnQkFDRSxFQUFFLEVBQUUsWUFBWTtnQkFDaEIsR0FBRyxFQUFFLE1BQU07Z0JBQ1gsS0FBSyxF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QUUsQ0FBQztvQkFDUixNQUFNLEVBQUUsRUFBRTtpQkFDWDthQUNGO1NBQ0YsQ0FBQTtRQUNELE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUV6RCxJQUFJLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxJQUFBLDZCQUFrQixFQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQzNDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxPQUFPLENBQUMsQ0FBQTtZQUNoRSxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3hDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDbEMsQ0FBQztnQkFBUyxDQUFDO1lBQ1QsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3ZCLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QsIGJlZm9yZUVhY2gsIGFmdGVyRWFjaCB9IGZyb20gJ3ZpdGVzdCdcbmltcG9ydCB7IHdyaXRlRmlsZVN5bmMsIHVubGlua1N5bmMsIG1rZGlyU3luYyB9IGZyb20gJ25vZGU6ZnMnXG5pbXBvcnQgeyB0bXBkaXIgfSBmcm9tICdub2RlOm9zJ1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IHZhbGlkYXRlRm9ybUNvbmZpZywgdHlwZSBWYWxpZGF0aW9uSXNzdWUgfSBmcm9tICcuLi9zcmMvY29tbWFuZHMvdmFsaWRhdGUnXG5cbi8qKlxuICogVGVzdHMgZm9yIHRoZSBDTEkgdmFsaWRhdGUgY29tbWFuZC5cbiAqXG4gKiBWYWxpZGF0ZXMgREZFIGZvcm0gY29uZmlndXJhdGlvbiBmaWxlcyBmb3I6XG4gKiAtIFZhbGlkIEpTT04gc3RydWN0dXJlXG4gKiAtIFJlcXVpcmVkIGZpZWxkcyAoa2V5LCB0eXBlKVxuICogLSBEdXBsaWNhdGUgSURzIGFuZCBrZXlzXG4gKiAtIFJlZmVyZW5jZSBpbnRlZ3JpdHlcbiAqIC0gQ2lyY3VsYXIgZGVwZW5kZW5jaWVzXG4gKiAtIEFQSSBjb250cmFjdCB2YWxpZGl0eVxuICogLSBCZXN0IHByYWN0aWNlIHZpb2xhdGlvbnNcbiAqL1xuXG4vLyDilIDilIDilIAgVGVzdCBGaXh0dXJlcyBhbmQgSGVscGVycyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxubGV0IHRlc3REaXI6IHN0cmluZ1xubGV0IHRlc3RGaWxlSW5kZXggPSAwXG5cbmJlZm9yZUVhY2goKCkgPT4ge1xuICB0ZXN0RGlyID0gdG1wZGlyKClcbn0pXG5cbmFmdGVyRWFjaCgoKSA9PiB7XG4gIC8vIENsZWFudXAgaXMgaGFuZGxlZCBieSB0ZW1wIGZpbGUgZGVsZXRpb24gaW4gZWFjaCB0ZXN0XG59KVxuXG5mdW5jdGlvbiBjcmVhdGVUZXN0RmlsZShmaWxlTmFtZTogc3RyaW5nLCBjb250ZW50OiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBmaWxlUGF0aCA9IGpvaW4odGVzdERpciwgYCR7ZmlsZU5hbWV9XyR7dGVzdEZpbGVJbmRleCsrfS5qc29uYClcbiAgd3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoY29udGVudCwgbnVsbCwgMikpXG4gIHJldHVybiBmaWxlUGF0aFxufVxuXG5mdW5jdGlvbiBjbGVhbnVwRmlsZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgdW5saW5rU3luYyhmaWxlUGF0aClcbiAgfSBjYXRjaCB7XG4gICAgLy8gRmlsZSBtaWdodCBub3QgZXhpc3RcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVWYWxpZENvbmZpZygpIHtcbiAgcmV0dXJuIHtcbiAgICBmaWVsZHM6IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdmaWVsZF9uYW1lJyxcbiAgICAgICAga2V5OiAnbmFtZScsXG4gICAgICAgIGxhYmVsOiAnRnVsbCBOYW1lJyxcbiAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICB9LFxuICAgIF0sXG4gICAgc3RlcHM6IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdzdGVwMScsXG4gICAgICAgIHRpdGxlOiAnU3RlcCAxJyxcbiAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgIGNvbmZpZzogbnVsbCxcbiAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgIH0sXG4gICAgXSxcbiAgfVxufVxuXG4vLyDilIDilIDilIAgQmFzaWMgVmFsaWRhdGlvbiBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ3ZhbGlkYXRlRm9ybUNvbmZpZyAtIEJhc2ljIFZhbGlkYXRpb24nLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgdmFsaWRhdGUgY29ycmVjdCBjb25maWcgYXMgdmFsaWQnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0gY3JlYXRlVmFsaWRDb25maWcoKVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ3ZhbGlkJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLmxlbmd0aCkudG9CZSgwKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBkZXRlY3QgbWlzc2luZyBmaWxlJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gJy9ub25leGlzdGVudC9wYXRoL2NvbmZpZy5qc29uJ1xuICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcblxuICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpXG4gICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpID0+IGkuc2V2ZXJpdHkgPT09ICdlcnJvcicpKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpID0+IGkubWVzc2FnZS5pbmNsdWRlcygnbm90IGZvdW5kJykpKS50b0JlKHRydWUpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBkZXRlY3QgaW52YWxpZCBKU09OJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gam9pbih0ZXN0RGlyLCBgaW52YWxpZF9qc29uXyR7dGVzdEZpbGVJbmRleCsrfS5qc29uYClcbiAgICB3cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCAneyBpbnZhbGlkIGpzb24gfScpXG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGZpbGVQYXRoKVxuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PiBpLm1lc3NhZ2UuaW5jbHVkZXMoJ0ludmFsaWQgSlNPTicpKSkudG9CZSh0cnVlKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXF1aXJlIGZpZWxkcyBvciBzdGVwcyBhdCB0b3AgbGV2ZWwnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0geyB0aXRsZTogJ0VtcHR5IGZvcm0nIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdub19maWVsZHMnLCBjb25maWcpXG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGZpbGVQYXRoKVxuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PlxuICAgICAgICBpLm1lc3NhZ2UuaW5jbHVkZXMoJ2ZpZWxkcycpIHx8IGkubWVzc2FnZS5pbmNsdWRlcygnc3RlcHMnKVxuICAgICAgKSkudG9CZSh0cnVlKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgRmllbGQgVmFsaWRhdGlvbiBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ3ZhbGlkYXRlRm9ybUNvbmZpZyAtIEZpZWxkIFZhbGlkYXRpb24nLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgcmVxdWlyZSBmaWVsZCBrZXknLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzEnLFxuICAgICAgICAgIC8vIE1pc3Npbmcga2V5XG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjcmVhdGVUZXN0RmlsZSgnbWlzc2luZ19rZXknLCBjb25maWcpXG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGZpbGVQYXRoKVxuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PiBpLm1lc3NhZ2UuaW5jbHVkZXMoJ2tleScpKSkudG9CZSh0cnVlKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXF1aXJlIGZpZWxkIHR5cGUnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzEnLFxuICAgICAgICAgIGtleTogJ2ZpZWxkMScsXG4gICAgICAgICAgLy8gTWlzc2luZyB0eXBlXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdtaXNzaW5nX3R5cGUnLCBjb25maWcpXG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGZpbGVQYXRoKVxuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PiBpLm1lc3NhZ2UuaW5jbHVkZXMoJ3R5cGUnKSkpLnRvQmUodHJ1ZSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYW51cEZpbGUoZmlsZVBhdGgpXG4gICAgfVxuICB9KVxuXG4gIGl0KCdzaG91bGQgd2FybiBvbiBtaXNzaW5nIGZpZWxkIGxhYmVsJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF8xJyxcbiAgICAgICAgICBrZXk6ICdmaWVsZDEnLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyxcbiAgICAgICAgICAvLyBNaXNzaW5nIGxhYmVsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdtaXNzaW5nX2xhYmVsJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PiBpLnNldmVyaXR5ID09PSAnd2FybmluZycgJiYgaS5tZXNzYWdlLmluY2x1ZGVzKCdsYWJlbCcpKSkudG9CZSh0cnVlKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBkZXRlY3QgZHVwbGljYXRlIGZpZWxkIGlkcycsICgpID0+IHtcbiAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICBmaWVsZHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZmllbGRfMScsXG4gICAgICAgICAga2V5OiAnbmFtZScsXG4gICAgICAgICAgbGFiZWw6ICdOYW1lJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzEnLCAvLyBEdXBsaWNhdGVcbiAgICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgICAgbGFiZWw6ICdFbWFpbCcsXG4gICAgICAgICAgdHlwZTogJ0VNQUlMJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ2R1cF9pZCcsIGNvbmZpZylcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoZmlsZVBhdGgpXG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpID0+IGkubWVzc2FnZS5pbmNsdWRlcygnRHVwbGljYXRlJykgJiYgaS5tZXNzYWdlLmluY2x1ZGVzKCdpZCcpKSkudG9CZSh0cnVlKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBkZXRlY3QgZHVwbGljYXRlIGZpZWxkIGtleXMnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzEnLFxuICAgICAgICAgIGtleTogJ2VtYWlsJyxcbiAgICAgICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzInLFxuICAgICAgICAgIGtleTogJ2VtYWlsJywgLy8gRHVwbGljYXRlXG4gICAgICAgICAgbGFiZWw6ICdFbWFpbCAyJyxcbiAgICAgICAgICB0eXBlOiAnRU1BSUwnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjcmVhdGVUZXN0RmlsZSgnZHVwX2tleScsIGNvbmZpZylcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoZmlsZVBhdGgpXG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpID0+IGkubWVzc2FnZS5pbmNsdWRlcygnRHVwbGljYXRlJykgJiYgaS5tZXNzYWdlLmluY2x1ZGVzKCdrZXknKSkpLnRvQmUodHJ1ZSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYW51cEZpbGUoZmlsZVBhdGgpXG4gICAgfVxuICB9KVxuXG4gIGl0KCdzaG91bGQgZGV0ZWN0IHNlbGYtcmVmZXJlbmNpbmcgY29uZGl0aW9ucycsICgpID0+IHtcbiAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICBmaWVsZHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZmllbGRfMScsXG4gICAgICAgICAga2V5OiAnZmllbGQxJyxcbiAgICAgICAgICBsYWJlbDogJ0ZpZWxkIDEnLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgICBvcGVyYXRvcjogJ0FORCcsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICB7IGZpZWxkS2V5OiAnZmllbGQxJywgb3BlcmF0b3I6ICdFUVVBTFMnLCB2YWx1ZTogJ3NvbWV0aGluZycgfSwgLy8gU2VsZi1yZWZlcmVuY2VcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ3NlbGZfcmVmJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpXG4gICAgICBleHBlY3QocmVzdWx0Lmlzc3Vlcy5zb21lKGkgPT4gaS5tZXNzYWdlLmluY2x1ZGVzKCdTZWxmLXJlZmVyZW5jaW5nJykpKS50b0JlKHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcblxuICBpdCgnc2hvdWxkIGRldGVjdCBtaXNzaW5nIHBhcmVudEZpZWxkSWQgcmVmZXJlbmNlJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF8xJyxcbiAgICAgICAgICBrZXk6ICdmaWVsZDEnLFxuICAgICAgICAgIGxhYmVsOiAnRmllbGQgMScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6ICdub25leGlzdGVudF9wYXJlbnQnLCAvLyBOb24tZXhpc3RlbnQgcmVmZXJlbmNlXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdiYWRfcGFyZW50JywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpXG4gICAgICBleHBlY3QocmVzdWx0Lmlzc3Vlcy5zb21lKGkgPT4gaS5tZXNzYWdlLmluY2x1ZGVzKCdwYXJlbnRGaWVsZElkJykpKS50b0JlKHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBTdGVwIFZhbGlkYXRpb24gVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCd2YWxpZGF0ZUZvcm1Db25maWcgLSBTdGVwIFZhbGlkYXRpb24nLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgcmVxdWlyZSBzdGVwIGlkJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIHN0ZXBzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAvLyBNaXNzaW5nIGlkXG4gICAgICAgICAgdGl0bGU6ICdTdGVwIDEnLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjcmVhdGVUZXN0RmlsZSgnc3RlcF9ub19pZCcsIGNvbmZpZylcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoZmlsZVBhdGgpXG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpID0+IGkubWVzc2FnZS5pbmNsdWRlcygnaWQnKSAmJiBpLm1lc3NhZ2UuaW5jbHVkZXMoJ1N0ZXAnKSkpLnRvQmUodHJ1ZSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYW51cEZpbGUoZmlsZVBhdGgpXG4gICAgfVxuICB9KVxuXG4gIGl0KCdzaG91bGQgd2FybiBvbiBtaXNzaW5nIHN0ZXAgdGl0bGUnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgc3RlcHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnc3RlcF8xJyxcbiAgICAgICAgICAvLyBNaXNzaW5nIHRpdGxlXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgY29uZmlnOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdzdGVwX25vX3RpdGxlJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PiBpLnNldmVyaXR5ID09PSAnd2FybmluZycgJiYgaS5tZXNzYWdlLmluY2x1ZGVzKCd0aXRsZScpKSkudG9CZSh0cnVlKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBkZXRlY3QgZHVwbGljYXRlIHN0ZXAgaWRzJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIHN0ZXBzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfMScsXG4gICAgICAgICAgdGl0bGU6ICdTdGVwIDEnLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdzdGVwXzEnLCAvLyBEdXBsaWNhdGVcbiAgICAgICAgICB0aXRsZTogJ1N0ZXAgMicsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdzdGVwX2R1cCcsIGNvbmZpZylcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoZmlsZVBhdGgpXG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpID0+IGkubWVzc2FnZS5pbmNsdWRlcygnRHVwbGljYXRlJykgJiYgaS5tZXNzYWdlLmluY2x1ZGVzKCdzdGVwJykpKS50b0JlKHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBDcm9zcy1SZWZlcmVuY2UgVmFsaWRhdGlvbiBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ3ZhbGlkYXRlRm9ybUNvbmZpZyAtIENyb3NzLVJlZmVyZW5jZSBWYWxpZGF0aW9uJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHZhbGlkYXRlIHN0ZXAgcmVmZXJlbmNlcyBpbiBmaWVsZHMnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzEnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIGxhYmVsOiAnTmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogJ25vbmV4aXN0ZW50X3N0ZXAnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHN0ZXBzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfMScsXG4gICAgICAgICAgdGl0bGU6ICdTdGVwIDEnLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjcmVhdGVUZXN0RmlsZSgnYmFkX3N0ZXBpZCcsIGNvbmZpZylcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoZmlsZVBhdGgpXG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpID0+IGkubWVzc2FnZS5pbmNsdWRlcygnc3RlcElkJykpKS50b0JlKHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcblxuICBpdCgnc2hvdWxkIGFsbG93IHZhbGlkIHN0ZXAgcmVmZXJlbmNlcycsICgpID0+IHtcbiAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICBmaWVsZHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZmllbGRfMScsXG4gICAgICAgICAga2V5OiAnbmFtZScsXG4gICAgICAgICAgbGFiZWw6ICdOYW1lJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgICAgc3RlcElkOiAnc3RlcF8xJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBzdGVwczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdzdGVwXzEnLFxuICAgICAgICAgIHRpdGxlOiAnU3RlcCAxJyxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ2dvb2Rfc3RlcGlkJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGNvbnN0IHN0ZXBJZEVycm9ycyA9IHJlc3VsdC5pc3N1ZXMuZmlsdGVyKGkgPT4gaS5tZXNzYWdlLmluY2x1ZGVzKCdzdGVwSWQnKSlcbiAgICAgIGV4cGVjdChzdGVwSWRFcnJvcnMubGVuZ3RoKS50b0JlKDApXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBBUEkgQ29udHJhY3QgVmFsaWRhdGlvbiBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ3ZhbGlkYXRlRm9ybUNvbmZpZyAtIEFQSSBDb250cmFjdCBWYWxpZGF0aW9uJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHJlcXVpcmUgZW5kcG9pbnQgaW4gQVBJIGNvbnRyYWN0JywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIHN0ZXBzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfMScsXG4gICAgICAgICAgdGl0bGU6ICdTdGVwIDEnLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgYXBpQ29udHJhY3RzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAvLyBNaXNzaW5nIGVuZHBvaW50XG4gICAgICAgICAgICAgICAgcmVzb3VyY2VOYW1lOiAnVXNlcicsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICBmaWVsZE1hcHBpbmc6IHt9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdhcGlfbm9fZW5kcG9pbnQnLCBjb25maWcpXG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGZpbGVQYXRoKVxuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PiBpLm1lc3NhZ2UuaW5jbHVkZXMoJ2VuZHBvaW50JykpKS50b0JlKHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcblxuICBpdCgnc2hvdWxkIHdhcm4gb24gbWlzc2luZyByZXNvdXJjZU5hbWUgaW4gQVBJIGNvbnRyYWN0JywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIHN0ZXBzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfMScsXG4gICAgICAgICAgdGl0bGU6ICdTdGVwIDEnLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgYXBpQ29udHJhY3RzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlbmRwb2ludDogJy9hcGkvdXNlcnMve2lkfScsXG4gICAgICAgICAgICAgICAgLy8gTWlzc2luZyByZXNvdXJjZU5hbWVcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIGZpZWxkTWFwcGluZzoge30sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ2FwaV9ub19yZXNvdXJjZScsIGNvbmZpZylcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoZmlsZVBhdGgpXG4gICAgICBleHBlY3QocmVzdWx0Lmlzc3Vlcy5zb21lKGkgPT4gaS5zZXZlcml0eSA9PT0gJ3dhcm5pbmcnICYmIGkubWVzc2FnZS5pbmNsdWRlcygncmVzb3VyY2VOYW1lJykpKS50b0JlKHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcblxuICBpdCgnc2hvdWxkIHZhbGlkYXRlIEFQSSBjb250cmFjdCBmaWVsZCBtYXBwaW5nIHJlZmVyZW5jZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkX25hbWUnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIGxhYmVsOiAnTmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHN0ZXBzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfMScsXG4gICAgICAgICAgdGl0bGU6ICdTdGVwIDEnLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgYXBpQ29udHJhY3RzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlbmRwb2ludDogJy9hcGkvdXNlcnMve2lkfScsXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VOYW1lOiAnVXNlcicsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICBmaWVsZE1hcHBpbmc6IHtcbiAgICAgICAgICAgICAgICAgIG5vbmV4aXN0ZW50RmllbGQ6ICdmaXJzdE5hbWUnLCAvLyBGaWVsZCBkb2Vzbid0IGV4aXN0XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjcmVhdGVUZXN0RmlsZSgnYXBpX2JhZF9tYXBwaW5nJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PiBpLm1lc3NhZ2UuaW5jbHVkZXMoJ2ZpZWxkTWFwcGluZycpICYmIGkubWVzc2FnZS5pbmNsdWRlcygndW5rbm93bicpKSkudG9CZSh0cnVlKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgQnJhbmNoIFZhbGlkYXRpb24gVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCd2YWxpZGF0ZUZvcm1Db25maWcgLSBCcmFuY2ggVmFsaWRhdGlvbicsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBkZXRlY3QgaW52YWxpZCBicmFuY2ggdGFyZ2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIHN0ZXBzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfMScsXG4gICAgICAgICAgdGl0bGU6ICdTdGVwIDEnLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIGJyYW5jaGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNvbmRpdGlvbjogJ3R5cGUgPT09IFwiYVwiJyxcbiAgICAgICAgICAgICAgdGFyZ2V0U3RlcElkOiAnbm9uZXhpc3RlbnRfc3RlcCcsIC8vIEludmFsaWQgdGFyZ2V0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfMicsXG4gICAgICAgICAgdGl0bGU6ICdTdGVwIDInLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjcmVhdGVUZXN0RmlsZSgnYmFkX2JyYW5jaCcsIGNvbmZpZylcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoZmlsZVBhdGgpXG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuc29tZShpID0+IGkubWVzc2FnZS5pbmNsdWRlcygndGFyZ2V0cyB1bmtub3duIHN0ZXAnKSkpLnRvQmUodHJ1ZSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYW51cEZpbGUoZmlsZVBhdGgpXG4gICAgfVxuICB9KVxuXG4gIGl0KCdzaG91bGQgYWxsb3cgdmFsaWQgYnJhbmNoIHRhcmdldHMnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgc3RlcHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnc3RlcF8xJyxcbiAgICAgICAgICB0aXRsZTogJ1N0ZXAgMScsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgY29uZmlnOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgICAgYnJhbmNoZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29uZGl0aW9uOiAndHlwZSA9PT0gXCJhXCInLFxuICAgICAgICAgICAgICB0YXJnZXRTdGVwSWQ6ICdzdGVwXzInLCAvLyBWYWxpZCB0YXJnZXRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnc3RlcF8yJyxcbiAgICAgICAgICB0aXRsZTogJ1N0ZXAgMicsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdnb29kX2JyYW5jaCcsIGNvbmZpZylcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZvcm1Db25maWcoZmlsZVBhdGgpXG4gICAgICBjb25zdCBicmFuY2hFcnJvcnMgPSByZXN1bHQuaXNzdWVzLmZpbHRlcihpID0+IGkubWVzc2FnZS5pbmNsdWRlcygnQnJhbmNoJykpXG4gICAgICBleHBlY3QoYnJhbmNoRXJyb3JzLmxlbmd0aCkudG9CZSgwKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgQ2lyY3VsYXIgRGVwZW5kZW5jeSBEZXRlY3Rpb24gVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCd2YWxpZGF0ZUZvcm1Db25maWcgLSBDaXJjdWxhciBEZXBlbmRlbmNpZXMnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgZGV0ZWN0IGRpcmVjdCBjaXJjdWxhciBkZXBlbmRlbmN5JywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF8xJyxcbiAgICAgICAgICBrZXk6ICdmaWVsZDEnLFxuICAgICAgICAgIGxhYmVsOiAnRmllbGQgMScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgIG9wZXJhdG9yOiAnQU5EJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgIHsgZmllbGRLZXk6ICdmaWVsZDInLCBvcGVyYXRvcjogJ05PVF9FTVBUWScsIHZhbHVlOiBudWxsIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzInLFxuICAgICAgICAgIGtleTogJ2ZpZWxkMicsXG4gICAgICAgICAgbGFiZWw6ICdGaWVsZCAyJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgb3BlcmF0b3I6ICdBTkQnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgeyBmaWVsZEtleTogJ2ZpZWxkMScsIG9wZXJhdG9yOiAnTk9UX0VNUFRZJywgdmFsdWU6IG51bGwgfSwgLy8gQ2lyY3VsYXJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ2NpcmN1bGFyJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpXG4gICAgICBleHBlY3QocmVzdWx0Lmlzc3Vlcy5zb21lKGkgPT4gaS5tZXNzYWdlLmluY2x1ZGVzKCdDaXJjdWxhcicpKSkudG9CZSh0cnVlKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBkZXRlY3QgdHJhbnNpdGl2ZSBjaXJjdWxhciBkZXBlbmRlbmNpZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzEnLFxuICAgICAgICAgIGtleTogJ2ZpZWxkMScsXG4gICAgICAgICAgbGFiZWw6ICdGaWVsZCAxJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgb3BlcmF0b3I6ICdBTkQnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgeyBmaWVsZEtleTogJ2ZpZWxkMicsIG9wZXJhdG9yOiAnTk9UX0VNUFRZJywgdmFsdWU6IG51bGwgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZmllbGRfMicsXG4gICAgICAgICAga2V5OiAnZmllbGQyJyxcbiAgICAgICAgICBsYWJlbDogJ0ZpZWxkIDInLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgICBvcGVyYXRvcjogJ0FORCcsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICB7IGZpZWxkS2V5OiAnZmllbGQzJywgb3BlcmF0b3I6ICdOT1RfRU1QVFknLCB2YWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF8zJyxcbiAgICAgICAgICBrZXk6ICdmaWVsZDMnLFxuICAgICAgICAgIGxhYmVsOiAnRmllbGQgMycsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMixcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgIG9wZXJhdG9yOiAnQU5EJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgIHsgZmllbGRLZXk6ICdmaWVsZDEnLCBvcGVyYXRvcjogJ05PVF9FTVBUWScsIHZhbHVlOiBudWxsIH0sIC8vIENpcmN1bGFyIHBhdGhcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ3RyYW5zaXRpdmVfY2lyY3VsYXInLCBjb25maWcpXG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGZpbGVQYXRoKVxuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLnNvbWUoaSA9PiBpLm1lc3NhZ2UuaW5jbHVkZXMoJ0NpcmN1bGFyJykpKS50b0JlKHRydWUpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcblxuICBpdCgnc2hvdWxkIGFsbG93IG5vbi1jaXJjdWxhciBkZXBlbmRlbmNpZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgZmllbGRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzEnLFxuICAgICAgICAgIGtleTogJ2ZpZWxkMScsXG4gICAgICAgICAgbGFiZWw6ICdGaWVsZCAxJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkXzInLFxuICAgICAgICAgIGtleTogJ2ZpZWxkMicsXG4gICAgICAgICAgbGFiZWw6ICdGaWVsZCAyJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgb3BlcmF0b3I6ICdBTkQnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgeyBmaWVsZEtleTogJ2ZpZWxkMScsIG9wZXJhdG9yOiAnTk9UX0VNUFRZJywgdmFsdWU6IG51bGwgfSwgLy8gVmFsaWQgZGVwZW5kZW5jeVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF8zJyxcbiAgICAgICAgICBrZXk6ICdmaWVsZDMnLFxuICAgICAgICAgIGxhYmVsOiAnRmllbGQgMycsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMixcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgIG9wZXJhdG9yOiAnQU5EJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgIHsgZmllbGRLZXk6ICdmaWVsZDInLCBvcGVyYXRvcjogJ05PVF9FTVBUWScsIHZhbHVlOiBudWxsIH0sIC8vIFZhbGlkIGRlcGVuZGVuY3lcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ2xpbmVhcl9kZXBzJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGNvbnN0IGNpcmN1bGFySXNzdWVzID0gcmVzdWx0Lmlzc3Vlcy5maWx0ZXIoaSA9PiBpLm1lc3NhZ2UuaW5jbHVkZXMoJ0NpcmN1bGFyJykpXG4gICAgICBleHBlY3QoY2lyY3VsYXJJc3N1ZXMubGVuZ3RoKS50b0JlKDApXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBDb21wbGV4IFZhbGlkYXRpb24gVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCd2YWxpZGF0ZUZvcm1Db25maWcgLSBDb21wbGV4IFNjZW5hcmlvcycsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBjb21wcmVoZW5zaXZlIGZvcm0gY29uZmlnJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF9yb2xlJyxcbiAgICAgICAgICBrZXk6ICdyb2xlJyxcbiAgICAgICAgICBsYWJlbDogJ1JvbGUnLFxuICAgICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdBZG1pbicsIHZhbHVlOiAnYWRtaW4nIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdVc2VyJywgdmFsdWU6ICd1c2VyJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN0ZXBJZDogJ3N0ZXBfMScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkX3Blcm1pc3Npb25zJyxcbiAgICAgICAgICBrZXk6ICdwZXJtaXNzaW9ucycsXG4gICAgICAgICAgbGFiZWw6ICdQZXJtaXNzaW9ucycsXG4gICAgICAgICAgdHlwZTogJ01VTFRJX1NFTEVDVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdSZWFkJywgdmFsdWU6ICdyZWFkJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnV3JpdGUnLCB2YWx1ZTogJ3dyaXRlJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN0ZXBJZDogJ3N0ZXBfMicsXG4gICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgb3BlcmF0b3I6ICdBTkQnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgeyBmaWVsZEtleTogJ3JvbGUnLCBvcGVyYXRvcjogJ0VRVUFMUycsIHZhbHVlOiAnYWRtaW4nIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgc3RlcHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnc3RlcF8xJyxcbiAgICAgICAgICB0aXRsZTogJ1JvbGUgU2VsZWN0aW9uJyxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIGFwaUNvbnRyYWN0czogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZW5kcG9pbnQ6ICcvYXBpL3JvbGVzJyxcbiAgICAgICAgICAgICAgICByZXNvdXJjZU5hbWU6ICdSb2xlJyxcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIGZpZWxkTWFwcGluZzoge1xuICAgICAgICAgICAgICAgICAgcm9sZTogJ3NlbGVjdGVkUm9sZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIGJyYW5jaGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNvbmRpdGlvbjogJ3JvbGUgPT09IFwiYWRtaW5cIicsXG4gICAgICAgICAgICAgIHRhcmdldFN0ZXBJZDogJ3N0ZXBfMicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfMicsXG4gICAgICAgICAgdGl0bGU6ICdQZXJtaXNzaW9ucycsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1cbiAgICBjb25zdCBmaWxlUGF0aCA9IGNyZWF0ZVRlc3RGaWxlKCdjb21wcmVoZW5zaXZlJywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIC8vIFNob3VsZCBiZSB2YWxpZFxuICAgICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMuZmlsdGVyKGkgPT4gaS5zZXZlcml0eSA9PT0gJ2Vycm9yJykubGVuZ3RoKS50b0JlKDApXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcblxuICBpdCgnc2hvdWxkIHJlcG9ydCBtdWx0aXBsZSB2YWxpZGF0aW9uIGlzc3VlcycsICgpID0+IHtcbiAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICBmaWVsZHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIC8vIE1pc3Npbmcga2V5IGFuZCB0eXBlXG4gICAgICAgICAgaWQ6ICdmaWVsZF8xJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZmllbGRfMScsIC8vIER1cGxpY2F0ZSBJRFxuICAgICAgICAgIGtleTogJ2ZpZWxkMicsXG4gICAgICAgICAgbGFiZWw6ICdGaWVsZCAyJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgICAgc3RlcElkOiAnbm9uZXhpc3RlbnQnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjcmVhdGVUZXN0RmlsZSgnbXVsdGlfZXJyb3InLCBjb25maWcpXG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGZpbGVQYXRoKVxuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNzdWVzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDIpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBJc3N1ZSBTZXZlcml0eSBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ3ZhbGlkYXRlRm9ybUNvbmZpZyAtIElzc3VlIFNldmVyaXR5JywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIGRpZmZlcmVudGlhdGUgYmV0d2VlbiBlcnJvcnMgYW5kIHdhcm5pbmdzJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF8xJyxcbiAgICAgICAgICBrZXk6ICdmaWVsZDEnLFxuICAgICAgICAgIC8vIE1pc3NpbmcgbGFiZWwgKHdhcm5pbmcpXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBjcmVhdGVUZXN0RmlsZSgnc2V2ZXJpdHknLCBjb25maWcpXG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGb3JtQ29uZmlnKGZpbGVQYXRoKVxuICAgICAgY29uc3Qgd2FybmluZ3MgPSByZXN1bHQuaXNzdWVzLmZpbHRlcihpID0+IGkuc2V2ZXJpdHkgPT09ICd3YXJuaW5nJylcbiAgICAgIGNvbnN0IGVycm9ycyA9IHJlc3VsdC5pc3N1ZXMuZmlsdGVyKGkgPT4gaS5zZXZlcml0eSA9PT0gJ2Vycm9yJylcblxuICAgICAgZXhwZWN0KHdhcm5pbmdzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgICBleHBlY3QoZXJyb3JzLmxlbmd0aCkudG9CZSgwKVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhbnVwRmlsZShmaWxlUGF0aClcbiAgICB9XG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBtYXJrIG1pc3NpbmcgcmVxdWlyZWQgZmllbGRzIGFzIGVycm9ycycsICgpID0+IHtcbiAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICBmaWVsZHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIC8vIE1pc3Npbmcga2V5IChlcnJvcilcbiAgICAgICAgICBpZDogJ2ZpZWxkXzEnLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfVxuICAgIGNvbnN0IGZpbGVQYXRoID0gY3JlYXRlVGVzdEZpbGUoJ2Vycm9yX3NldmVyaXR5JywgY29uZmlnKVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRm9ybUNvbmZpZyhmaWxlUGF0aClcbiAgICAgIGNvbnN0IGVycm9ycyA9IHJlc3VsdC5pc3N1ZXMuZmlsdGVyKGkgPT4gaS5zZXZlcml0eSA9PT0gJ2Vycm9yJylcbiAgICAgIGV4cGVjdChlcnJvcnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcbiAgICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFudXBGaWxlKGZpbGVQYXRoKVxuICAgIH1cbiAgfSlcbn0pXG4iXX0=