import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateFormConfig, type ValidationIssue } from '../src/commands/validate'

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

let testDir: string
let testFileIndex = 0

beforeEach(() => {
  testDir = tmpdir()
})

afterEach(() => {
  // Cleanup is handled by temp file deletion in each test
})

function createTestFile(fileName: string, content: any): string {
  const filePath = join(testDir, `${fileName}_${testFileIndex++}.json`)
  writeFileSync(filePath, JSON.stringify(content, null, 2))
  return filePath
}

function cleanupFile(filePath: string) {
  try {
    unlinkSync(filePath)
  } catch {
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
  }
}

// ─── Basic Validation Tests ─────────────────────────────────────────────────

describe('validateFormConfig - Basic Validation', () => {
  it('should validate correct config as valid', () => {
    const config = createValidConfig()
    const filePath = createTestFile('valid', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(true)
      expect(result.issues.length).toBe(0)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should detect missing file', () => {
    const filePath = '/nonexistent/path/config.json'
    const result = validateFormConfig(filePath)

    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.severity === 'error')).toBe(true)
    expect(result.issues.some(i => i.message.includes('not found'))).toBe(true)
  })

  it('should detect invalid JSON', () => {
    const filePath = join(testDir, `invalid_json_${testFileIndex++}.json`)
    writeFileSync(filePath, '{ invalid json }')

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('Invalid JSON'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should require fields or steps at top level', () => {
    const config = { title: 'Empty form' }
    const filePath = createTestFile('no_fields', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i =>
        i.message.includes('fields') || i.message.includes('steps')
      )).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })
})

// ─── Field Validation Tests ─────────────────────────────────────────────────

describe('validateFormConfig - Field Validation', () => {
  it('should require field key', () => {
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
    }
    const filePath = createTestFile('missing_key', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('key'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should require field type', () => {
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
    }
    const filePath = createTestFile('missing_type', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('type'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should warn on missing field label', () => {
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
    }
    const filePath = createTestFile('missing_label', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.issues.some(i => i.severity === 'warning' && i.message.includes('label'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should detect duplicate field ids', () => {
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
    }
    const filePath = createTestFile('dup_id', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('Duplicate') && i.message.includes('id'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should detect duplicate field keys', () => {
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
    }
    const filePath = createTestFile('dup_key', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('Duplicate') && i.message.includes('key'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should detect self-referencing conditions', () => {
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
    }
    const filePath = createTestFile('self_ref', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('Self-referencing'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should detect missing parentFieldId reference', () => {
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
    }
    const filePath = createTestFile('bad_parent', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('parentFieldId'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })
})

// ─── Step Validation Tests ───────────────────────────────────────────────────

describe('validateFormConfig - Step Validation', () => {
  it('should require step id', () => {
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
    }
    const filePath = createTestFile('step_no_id', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('id') && i.message.includes('Step'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should warn on missing step title', () => {
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
    }
    const filePath = createTestFile('step_no_title', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.issues.some(i => i.severity === 'warning' && i.message.includes('title'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should detect duplicate step ids', () => {
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
    }
    const filePath = createTestFile('step_dup', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('Duplicate') && i.message.includes('step'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })
})

// ─── Cross-Reference Validation Tests ────────────────────────────────────────

describe('validateFormConfig - Cross-Reference Validation', () => {
  it('should validate step references in fields', () => {
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
    }
    const filePath = createTestFile('bad_stepid', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('stepId'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should allow valid step references', () => {
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
    }
    const filePath = createTestFile('good_stepid', config)

    try {
      const result = validateFormConfig(filePath)
      const stepIdErrors = result.issues.filter(i => i.message.includes('stepId'))
      expect(stepIdErrors.length).toBe(0)
    } finally {
      cleanupFile(filePath)
    }
  })
})

// ─── API Contract Validation Tests ──────────────────────────────────────────

describe('validateFormConfig - API Contract Validation', () => {
  it('should require endpoint in API contract', () => {
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
    }
    const filePath = createTestFile('api_no_endpoint', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('endpoint'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should warn on missing resourceName in API contract', () => {
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
    }
    const filePath = createTestFile('api_no_resource', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.issues.some(i => i.severity === 'warning' && i.message.includes('resourceName'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should validate API contract field mapping references', () => {
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
    }
    const filePath = createTestFile('api_bad_mapping', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.issues.some(i => i.message.includes('fieldMapping') && i.message.includes('unknown'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })
})

// ─── Branch Validation Tests ────────────────────────────────────────────────

describe('validateFormConfig - Branch Validation', () => {
  it('should detect invalid branch target', () => {
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
    }
    const filePath = createTestFile('bad_branch', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('targets unknown step'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should allow valid branch targets', () => {
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
    }
    const filePath = createTestFile('good_branch', config)

    try {
      const result = validateFormConfig(filePath)
      const branchErrors = result.issues.filter(i => i.message.includes('Branch'))
      expect(branchErrors.length).toBe(0)
    } finally {
      cleanupFile(filePath)
    }
  })
})

// ─── Circular Dependency Detection Tests ────────────────────────────────────

describe('validateFormConfig - Circular Dependencies', () => {
  it('should detect direct circular dependency', () => {
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
    }
    const filePath = createTestFile('circular', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('Circular'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should detect transitive circular dependencies', () => {
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
    }
    const filePath = createTestFile('transitive_circular', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.message.includes('Circular'))).toBe(true)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should allow non-circular dependencies', () => {
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
    }
    const filePath = createTestFile('linear_deps', config)

    try {
      const result = validateFormConfig(filePath)
      const circularIssues = result.issues.filter(i => i.message.includes('Circular'))
      expect(circularIssues.length).toBe(0)
    } finally {
      cleanupFile(filePath)
    }
  })
})

// ─── Complex Validation Tests ───────────────────────────────────────────────

describe('validateFormConfig - Complex Scenarios', () => {
  it('should validate comprehensive form config', () => {
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
    }
    const filePath = createTestFile('comprehensive', config)

    try {
      const result = validateFormConfig(filePath)
      // Should be valid
      expect(result.issues.filter(i => i.severity === 'error').length).toBe(0)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should report multiple validation issues', () => {
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
    }
    const filePath = createTestFile('multi_error', config)

    try {
      const result = validateFormConfig(filePath)
      expect(result.valid).toBe(false)
      expect(result.issues.length).toBeGreaterThan(2)
    } finally {
      cleanupFile(filePath)
    }
  })
})

// ─── Issue Severity Tests ───────────────────────────────────────────────────

describe('validateFormConfig - Issue Severity', () => {
  it('should differentiate between errors and warnings', () => {
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
    }
    const filePath = createTestFile('severity', config)

    try {
      const result = validateFormConfig(filePath)
      const warnings = result.issues.filter(i => i.severity === 'warning')
      const errors = result.issues.filter(i => i.severity === 'error')

      expect(warnings.length).toBeGreaterThan(0)
      expect(errors.length).toBe(0)
    } finally {
      cleanupFile(filePath)
    }
  })

  it('should mark missing required fields as errors', () => {
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
    }
    const filePath = createTestFile('error_severity', config)

    try {
      const result = validateFormConfig(filePath)
      const errors = result.issues.filter(i => i.severity === 'error')
      expect(errors.length).toBeGreaterThan(0)
      expect(result.valid).toBe(false)
    } finally {
      cleanupFile(filePath)
    }
  })
})
