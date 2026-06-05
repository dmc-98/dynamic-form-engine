import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FieldSuggestion, ValidationSuggestion } from '@dmc--98/dfe-core'
import { TEMPLATES } from '@dmc--98/dfe-core'
import { DfePlayground } from '../src'
import {
  appendFieldSuggestion,
  applyValidationSuggestion,
  canApplyValidationSuggestion,
  createTemplateConfig,
  parsePlaygroundConfig,
  stringifyPlaygroundConfig,
} from '../src/playground-utils'

describe('playground utils', () => {
  it('parses and stringifies template configs safely', () => {
    const config = createTemplateConfig(TEMPLATES[0]!)
    const jsonText = stringifyPlaygroundConfig(config)
    const parsed = parsePlaygroundConfig(jsonText)

    expect(parsed.parseError).toBeNull()
    expect(parsed.config?.fields).toHaveLength(TEMPLATES[0]!.fields.length)
    expect(parsed.config?.title).toBe(TEMPLATES[0]!.name)
  })

  it('applies actionable validation suggestions', () => {
    const suggestion: ValidationSuggestion = {
      fieldKey: 'email',
      fieldLabel: 'Email',
      rule: 'pattern:email',
      description: 'Use an email regex.',
      priority: 'high',
    }

    const config = createTemplateConfig(TEMPLATES[0]!)
    const nextConfig = applyValidationSuggestion(config, suggestion)
    const emailField = nextConfig.fields?.find((field) => field.key === 'email')

    expect(canApplyValidationSuggestion(suggestion)).toBe(true)
    expect((emailField?.config as { pattern?: string }).pattern).toBe('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')
  })

  it('adds suggested fields with generated config defaults', () => {
    const suggestion: FieldSuggestion = {
      key: 'preferred_contact',
      label: 'Preferred Contact Method',
      type: 'SELECT',
      description: 'How should we follow up?',
      required: false,
      reason: 'Helpful for contact routing.',
      category: 'contact',
    }

    const config = createTemplateConfig(TEMPLATES[0]!)
    const nextConfig = appendFieldSuggestion(config, suggestion)
    const field = nextConfig.fields?.find((candidate) => candidate.key === 'preferred_contact')
    const fieldConfig = field?.config as {
      mode?: string
      options?: Array<{ label: string; value: string }>
    }

    expect(field?.label).toBe('Preferred Contact Method')
    expect(fieldConfig.mode).toBe('static')
    expect(fieldConfig.options).toHaveLength(3)
  })

  it('renders the hardened playground surface with AI sections', () => {
    const markup = renderToStaticMarkup(
      <DfePlayground />,
    )

    expect(markup).toContain('DFE Playground')
    expect(markup).toContain('AI-Assisted Authoring')
    expect(markup).toContain('AI-Assisted Draft Fill')
  })
})
