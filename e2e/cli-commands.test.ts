import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateFormConfig } from '@dmc-98/dfe-cli/src/commands/validate'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getTemplate } from '@dmc-98/dfe-core'

describe('CLI Commands', () => {
  const tmpDir = join(__dirname, '.tmp-cli-test')

  beforeEach(() => {
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true })
    }
  })

  it('should validate a correct config file as valid with no errors', () => {
    const config = {
      fields: [
        {
          id: 'field-1',
          key: 'name',
          type: 'TEXT',
          label: 'Name',
          required: true,
        },
        {
          id: 'field-2',
          key: 'email',
          type: 'EMAIL',
          label: 'Email',
          required: true,
        },
      ],
    }

    const configPath = join(tmpDir, 'valid-config.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('should report error when both fields and steps are missing', () => {
    const config = {
      title: 'Empty Form',
    }

    const configPath = join(tmpDir, 'no-fields-steps.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues.some(issue =>
      issue.message.toLowerCase().includes('fields') ||
      issue.message.toLowerCase().includes('steps')
    )).toBe(true)
  })

  it('should report error for duplicate field IDs', () => {
    const config = {
      fields: [
        {
          id: 'field-1',
          key: 'name',
          type: 'TEXT',
          label: 'Name',
        },
        {
          id: 'field-1',
          key: 'email',
          type: 'EMAIL',
          label: 'Email',
        },
      ],
    }

    const configPath = join(tmpDir, 'duplicate-ids.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(false)
    expect(result.issues.some(issue =>
      issue.message.toLowerCase().includes('duplicate') ||
      issue.message.toLowerCase().includes('field-1')
    )).toBe(true)
  })

  it('should report error for duplicate field keys', () => {
    const config = {
      fields: [
        {
          id: 'field-1',
          key: 'username',
          type: 'TEXT',
          label: 'Username',
        },
        {
          id: 'field-2',
          key: 'username',
          type: 'TEXT',
          label: 'User Name',
        },
      ],
    }

    const configPath = join(tmpDir, 'duplicate-keys.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(false)
    expect(result.issues.some(issue =>
      issue.message.toLowerCase().includes('duplicate') ||
      issue.message.toLowerCase().includes('key')
    )).toBe(true)
  })

  it('should report error for self-referencing condition', () => {
    const config = {
      fields: [
        {
          id: 'field-1',
          key: 'field1',
          type: 'CHECKBOX',
          label: 'Agree',
          conditions: {
            rules: [
              {
                fieldKey: 'field1',
                operator: 'equals',
                value: true,
              },
            ],
          },
        },
      ],
    }

    const configPath = join(tmpDir, 'self-reference.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(false)
    expect(result.issues.some(issue =>
      issue.message.toLowerCase().includes('self') ||
      issue.message.toLowerCase().includes('reference')
    )).toBe(true)
  })

  it('should report error for non-existent file', () => {
    const nonExistentPath = join(tmpDir, 'does-not-exist.json')

    const result = validateFormConfig(nonExistentPath)

    expect(result.valid).toBe(false)
    expect(result.issues.some(issue =>
      issue.message.toLowerCase().includes('not found') ||
      issue.message.toLowerCase().includes('no such file')
    )).toBe(true)
  })

  it('should report error for invalid JSON syntax', () => {
    const configPath = join(tmpDir, 'invalid-json.json')
    writeFileSync(configPath, '{ invalid json content ]')

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(false)
    expect(result.issues.some(issue =>
      issue.message.toLowerCase().includes('json') ||
      issue.message.toLowerCase().includes('parse')
    )).toBe(true)
  })

  it('should report error when field references non-existent step', () => {
    const config = {
      fields: [
        {
          id: 'field-1',
          key: 'name',
          type: 'TEXT',
          label: 'Name',
          stepId: 'non-existent-step',
        },
      ],
      steps: [
        {
          id: 'step-1',
          title: 'Step 1',
          fields: ['field-1'],
        },
      ],
    }

    const configPath = join(tmpDir, 'invalid-step-ref.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(false)
    expect(result.issues.some(issue =>
      issue.message.toLowerCase().includes('step') ||
      issue.message.toLowerCase().includes('non-existent')
    )).toBe(true)
  })

  it('should validate exported template form as valid', () => {
    const template = getTemplate('contact-form')

    const config = {
      fields: template.fields,
    }

    const configPath = join(tmpDir, 'template-export.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(true)
  })

  it('should report error when API contract is missing required endpoint', () => {
    const config = {
      fields: [
        {
          id: 'field-1',
          key: 'name',
          type: 'TEXT',
          label: 'Name',
        },
      ],
      steps: [
        {
          id: 'step-1',
          title: 'Submit',
          config: {
            apiContracts: [
              {
                resourceName: 'user',
                endpoint: '',
                fieldMapping: {},
              },
            ],
          },
        },
      ],
    }

    const configPath = join(tmpDir, 'missing-endpoint.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const result = validateFormConfig(configPath)

    expect(result.valid).toBe(false)
    expect(result.issues.some(issue =>
      issue.message.toLowerCase().includes('endpoint') ||
      issue.message.toLowerCase().includes('required')
    )).toBe(true)
  })
})
