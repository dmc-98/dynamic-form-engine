/**
 * TDD tests for the AI validation spine (validate.ts).
 *
 * Covers:
 *   - validateAiOutput: structural validation of raw LLM JSON
 *   - normalizeAiOutput: type-alias mapping + DFE FormField construction
 *   - AI_TYPE_TO_DFE_TYPE: completeness of the alias map
 */

import { describe, it, expect } from 'vitest'
import { validateAiOutput, normalizeAiOutput, AI_TYPE_TO_DFE_TYPE } from '../src/validate.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_RAW = {
  title: 'Contact Form',
  description: 'Collect visitor details',
  steps: [{ id: 'main', title: 'Contact', fieldKeys: ['name', 'email'] }],
  fields: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
  ],
}

const WITH_SELECT = {
  title: 'Survey',
  description: '',
  steps: [],
  fields: [
    {
      key: 'color',
      label: 'Favorite Color',
      type: 'select',
      required: false,
      options: [
        { value: 'red', label: 'Red' },
        { value: 'blue', label: 'Blue' },
      ],
    },
  ],
}

// ─── validateAiOutput ─────────────────────────────────────────────────────────

describe('validateAiOutput', () => {
  it('returns ok:true for a well-formed AI response', () => {
    const { ok, issues } = validateAiOutput(VALID_RAW)
    expect(ok).toBe(true)
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
  })

  it('returns ok:false when output is not an object', () => {
    // @ts-expect-error — intentionally wrong type for testing
    const { ok } = validateAiOutput('not an object')
    expect(ok).toBe(false)
  })

  it('returns ok:false when fields is missing', () => {
    const { ok, issues } = validateAiOutput({ title: 'Form' } as never)
    expect(ok).toBe(false)
    expect(issues.some(i => i.path === 'fields')).toBe(true)
  })

  it('returns ok:false for a field with no key', () => {
    const raw = {
      ...VALID_RAW,
      fields: [{ label: 'Name', type: 'text', required: false }],
    }
    const { ok, issues } = validateAiOutput(raw as never)
    expect(ok).toBe(false)
    expect(issues.some(i => i.path === 'fields[0].key')).toBe(true)
  })

  it('returns ok:false for a field with an unknown type', () => {
    const raw = {
      ...VALID_RAW,
      fields: [{ key: 'q', label: 'Q', type: 'color_picker', required: false }],
    }
    const { ok, issues } = validateAiOutput(raw as never)
    expect(ok).toBe(false)
    expect(issues.some(i => i.path === 'fields[0].type' && i.message.includes('color_picker'))).toBe(true)
  })

  it('returns ok:false for duplicate field keys', () => {
    const raw = {
      ...VALID_RAW,
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: false },
        { key: 'name', label: 'Name 2', type: 'text', required: false },
      ],
    }
    const { ok, issues } = validateAiOutput(raw as never)
    expect(ok).toBe(false)
    expect(issues.some(i => i.message.includes('Duplicate field key'))).toBe(true)
  })

  it('returns ok:false when a step references a non-existent field key', () => {
    const raw = {
      ...VALID_RAW,
      steps: [{ id: 'main', title: 'Main', fieldKeys: ['name', 'nonexistent'] }],
    }
    const { ok, issues } = validateAiOutput(raw as never)
    expect(ok).toBe(false)
    expect(issues.some(i => i.message.includes('nonexistent'))).toBe(true)
  })

  it('warns (severity:warning) when title is missing — does not block ok', () => {
    const raw = { ...VALID_RAW, title: undefined }
    const { ok, issues } = validateAiOutput(raw as never)
    // Title warning should not fail ok if no errors
    const titleIssue = issues.find(i => i.path === 'title')
    expect(titleIssue?.severity).toBe('warning')
    expect(ok).toBe(true)
  })

  it('warns when a select/radio field has no options', () => {
    const raw = {
      ...VALID_RAW,
      fields: [{ key: 'size', label: 'Size', type: 'select', required: false, options: [] }],
    }
    const { issues } = validateAiOutput(raw as never)
    expect(issues.some(i => i.path === 'fields[0].options' && i.severity === 'warning')).toBe(true)
  })

  it('accepts canonical uppercase type values (pass-through)', () => {
    const raw = {
      ...VALID_RAW,
      fields: [{ key: 'name', label: 'Name', type: 'SHORT_TEXT', required: false }],
      steps: [],
    }
    const { ok } = validateAiOutput(raw as never)
    expect(ok).toBe(true)
  })

  it('returns error-level issue for field key with invalid characters', () => {
    const raw = {
      ...VALID_RAW,
      fields: [{ key: '123bad-key!', label: 'Bad', type: 'text', required: false }],
      steps: [],
    }
    const { ok } = validateAiOutput(raw as never)
    expect(ok).toBe(false)
  })

  it('provides path information for every issue', () => {
    const raw = {
      title: 'Form',
      fields: [
        { label: 'No Key', type: 'unknown_type', required: false },
      ],
    }
    const { issues } = validateAiOutput(raw as never)
    for (const issue of issues) {
      expect(typeof issue.path).toBe('string')
      expect(typeof issue.message).toBe('string')
      expect(['error', 'warning']).toContain(issue.severity)
    }
  })
})

// ─── normalizeAiOutput ────────────────────────────────────────────────────────

describe('normalizeAiOutput', () => {
  it('maps lowercase AI type aliases to DFE FieldType values', () => {
    const { fields } = normalizeAiOutput({
      title: 'Form',
      description: '',
      steps: [],
      fields: [
        { key: 'q', label: 'Q', type: 'text', required: false },
        { key: 'em', label: 'E', type: 'email', required: false },
        { key: 'nu', label: 'N', type: 'number', required: false },
      ],
    })
    expect(fields[0].type).toBe('SHORT_TEXT')
    expect(fields[1].type).toBe('EMAIL')
    expect(fields[2].type).toBe('NUMBER')
  })

  it('assigns sequential order values starting from 0', () => {
    const { fields } = normalizeAiOutput(VALID_RAW)
    expect(fields[0].order).toBe(0)
    expect(fields[1].order).toBe(1)
  })

  it('generates stable ids using idPrefix', () => {
    const { fields } = normalizeAiOutput(VALID_RAW, { idPrefix: 'test' })
    expect(fields[0].id).toContain('test')
    expect(fields[0].id).toContain('name')
    expect(fields[1].id).toContain('email')
  })

  it('stamps the provided versionId on all fields and steps', () => {
    const { fields, steps } = normalizeAiOutput(VALID_RAW, { versionId: 'draft-42' })
    for (const f of fields) expect(f.versionId).toBe('draft-42')
    for (const s of steps) expect(s.versionId).toBe('draft-42')
  })

  it('defaults to versionId "ai-draft-v1"', () => {
    const { fields } = normalizeAiOutput(VALID_RAW)
    expect(fields[0].versionId).toBe('ai-draft-v1')
  })

  it('sets required correctly from AI output', () => {
    const { fields } = normalizeAiOutput(VALID_RAW)
    expect(fields[0].required).toBe(true)   // name
    expect(fields[1].required).toBe(true)   // email
  })

  it('copies label from AI field', () => {
    const { fields } = normalizeAiOutput(VALID_RAW)
    expect(fields[0].label).toBe('Full Name')
  })

  it('maps helpText to description', () => {
    const raw = {
      ...VALID_RAW,
      fields: [{ key: 'q', label: 'Q', type: 'text', required: false, helpText: 'Enter text here' }],
    }
    const { fields } = normalizeAiOutput(raw)
    expect(fields[0].description).toBe('Enter text here')
  })

  it('builds select config with options array', () => {
    const { fields } = normalizeAiOutput(WITH_SELECT)
    expect(fields[0].config).toMatchObject({
      mode: 'static',
      options: [
        { value: 'red', label: 'Red' },
        { value: 'blue', label: 'Blue' },
      ],
    })
  })

  it('normalizes steps with id and order', () => {
    const { steps } = normalizeAiOutput(VALID_RAW)
    expect(steps).toHaveLength(1)
    expect(steps[0].id).toBe('main')
    expect(steps[0].order).toBe(0)
    expect(steps[0].title).toBe('Contact')
  })

  it('handles empty fields array without throwing', () => {
    const { fields } = normalizeAiOutput({ title: 'Empty', description: '', steps: [], fields: [] })
    expect(fields).toEqual([])
  })

  it('preserves governance metadata (aiGenerated, aiPromptHash) from AI output', () => {
    const raw = {
      title: 'Form',
      description: '',
      steps: [],
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          required: false,
          metadata: { aiGenerated: true, aiPromptHash: 'abc123ef' },
        },
      ],
    }
    const { fields } = normalizeAiOutput(raw)
    const meta = (fields[0] as unknown as Record<string, Record<string, unknown>>).metadata
    expect(meta?.aiGenerated).toBe(true)
    expect(meta?.aiPromptHash).toBe('abc123ef')
  })

  it('falls back to SHORT_TEXT for unrecognized type aliases', () => {
    const raw = {
      title: 'Form',
      description: '',
      steps: [],
      fields: [{ key: 'q', label: 'Q', type: 'unknown_future_type', required: false }],
    }
    const { fields } = normalizeAiOutput(raw)
    expect(fields[0].type).toBe('SHORT_TEXT')
  })
})

// ─── AI_TYPE_TO_DFE_TYPE completeness ────────────────────────────────────────

describe('AI_TYPE_TO_DFE_TYPE', () => {
  const AI_ALIASES = ['text', 'textarea', 'email', 'phone', 'number', 'url',
    'date', 'select', 'radio', 'checkbox', 'file', 'rating']

  it('covers all type aliases used in the system prompt', () => {
    for (const alias of AI_ALIASES) {
      expect(AI_TYPE_TO_DFE_TYPE).toHaveProperty(alias)
      expect(typeof AI_TYPE_TO_DFE_TYPE[alias]).toBe('string')
    }
  })

  it('maps every alias to a non-empty DFE type string', () => {
    for (const [alias, dfeType] of Object.entries(AI_TYPE_TO_DFE_TYPE)) {
      expect(dfeType.length, `alias "${alias}" maps to empty string`).toBeGreaterThan(0)
    }
  })
})
