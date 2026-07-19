/**
 * TDD tests for the `validate_form_schema` MCP tool handler.
 *
 * No AiProvider needed — this tool wraps pure validation logic.
 */

import { describe, it, expect } from 'vitest'
import { handleValidateSchema, VALIDATE_SCHEMA_TOOL } from '../src/tools/validate-schema.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validRawOutput(overrides?: Record<string, unknown>): string {
  return JSON.stringify({
    title: 'Contact Form',
    description: 'Collects name and email.',
    steps: [{ id: 'main', title: 'Contact', fieldKeys: ['name', 'email'] }],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
    ],
    ...overrides,
  })
}

// ─── Tool metadata ────────────────────────────────────────────────────────────

describe('VALIDATE_SCHEMA_TOOL metadata', () => {
  it('has the expected name', () => {
    expect(VALIDATE_SCHEMA_TOOL.name).toBe('validate_form_schema')
  })

  it('lists rawAiOutput as the only required property', () => {
    expect(VALIDATE_SCHEMA_TOOL.inputSchema.required).toEqual(['rawAiOutput'])
  })
})

// ─── Handler — valid input ────────────────────────────────────────────────────

describe('handleValidateSchema — valid input', () => {
  it('returns ok:true for valid output', async () => {
    const result = await handleValidateSchema({ rawAiOutput: validRawOutput() })
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.ok).toBe(true)
  })

  it('returns an issues array', async () => {
    const result = await handleValidateSchema({ rawAiOutput: validRawOutput() })
    const parsed = JSON.parse(result.content[0].text)
    expect(Array.isArray(parsed.issues)).toBe(true)
  })

  it('does not set isError on the MCP result for valid input', async () => {
    const result = await handleValidateSchema({ rawAiOutput: validRawOutput() })
    expect(result.isError).toBeFalsy()
  })

  it('includes normalizedFields when normalize:true and input is valid', async () => {
    const result = await handleValidateSchema({
      rawAiOutput: validRawOutput(),
      normalize: true,
    })
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.ok).toBe(true)
    expect(Array.isArray(parsed.normalizedFields)).toBe(true)
    expect(parsed.normalizedFields.length).toBeGreaterThan(0)
  })

  it('normalizedFields have DFE FieldType values (uppercase)', async () => {
    const result = await handleValidateSchema({
      rawAiOutput: validRawOutput(),
      normalize: true,
    })
    const parsed = JSON.parse(result.content[0].text)
    // 'text' → 'SHORT_TEXT', 'email' → 'EMAIL'
    const types: string[] = parsed.normalizedFields.map((f: { type: string }) => f.type)
    expect(types).toContain('SHORT_TEXT')
    expect(types).toContain('EMAIL')
  })
})

// ─── Handler — invalid input ──────────────────────────────────────────────────

describe('handleValidateSchema — validation errors', () => {
  it('catches duplicate field keys', async () => {
    const raw = JSON.stringify({
      title: 'Form',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: false },
        { key: 'name', label: 'Also Name', type: 'text', required: false },
      ],
    })
    const result = await handleValidateSchema({ rawAiOutput: raw })
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.ok).toBe(false)
    const messages = parsed.issues.map((i: { message: string }) => i.message).join(' ')
    expect(messages.toLowerCase()).toContain('duplicate')
  })

  it('catches unknown field types', async () => {
    const raw = JSON.stringify({
      title: 'Form',
      fields: [{ key: 'x', label: 'X', type: 'unknown_type', required: false }],
    })
    const result = await handleValidateSchema({ rawAiOutput: raw })
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.ok).toBe(false)
    const messages = parsed.issues.map((i: { message: string }) => i.message).join(' ')
    expect(messages.toLowerCase()).toMatch(/unknown|unsupported|type/)
  })

  it('skips normalization when errors present', async () => {
    const raw = JSON.stringify({
      fields: [
        { key: 'dupe', label: 'A', type: 'text', required: false },
        { key: 'dupe', label: 'B', type: 'text', required: false },
      ],
    })
    const result = await handleValidateSchema({ rawAiOutput: raw, normalize: true })
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.normalizeSkipped).toBeDefined()
    expect(parsed.normalizedFields).toBeUndefined()
  })
})

// ─── Handler — malformed input ────────────────────────────────────────────────

describe('handleValidateSchema — malformed rawAiOutput', () => {
  it('returns isError:true for invalid JSON string', async () => {
    const result = await handleValidateSchema({ rawAiOutput: '{ not valid json' })
    expect(result.isError).toBe(true)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.ok).toBe(false)
    expect(parsed.issues[0].message).toContain('not valid JSON')
  })

  it('handles empty fields array gracefully', async () => {
    const raw = JSON.stringify({ title: 'Empty Form', fields: [] })
    const result = await handleValidateSchema({ rawAiOutput: raw })
    const parsed = JSON.parse(result.content[0].text)
    // No structural errors for an empty-but-valid schema
    const errors = parsed.issues.filter((i: { severity: string }) => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })
})
