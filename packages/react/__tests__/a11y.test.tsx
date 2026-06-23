// @vitest-environment jsdom
/**
 * Accessibility regression gate — axe-core against key DFE components.
 *
 * Renders via renderToStaticMarkup (no CSS / computed styles) so color-contrast
 * is disabled. Everything else is structural: label association, ARIA attributes,
 * duplicate ids, role integrity.
 *
 * Add new field types or states here whenever a new component ships.
 */
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import axe from 'axe-core'
import { describe, it, expect, afterEach } from 'vitest'
import type { FormField } from '@dmc--98/dfe-core'
import { DefaultFieldRenderer } from '../src/components/DfeFormRenderer'
import { DfeFormRenderer } from '../src/components/DfeFormRenderer'

// ── axe config ────────────────────────────────────────────────────────────────
// color-contrast requires computed CSS; disable it in the SSR/jsdom context.
const AXE_OPTIONS: axe.RunOptions = {
  rules: { 'color-contrast': { enabled: false } },
}

// ── helpers ───────────────────────────────────────────────────────────────────
let container: HTMLElement | null = null

afterEach(() => {
  if (container && document.body.contains(container)) {
    document.body.removeChild(container)
  }
  container = null
})

async function checkA11y(element: React.ReactElement): Promise<axe.AxeResults> {
  const html = renderToStaticMarkup(element)
  container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)
  return axe.run(container, AXE_OPTIONS)
}

function violations(results: axe.AxeResults) {
  // Return only critical + serious so warnings don't block CI.
  return results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
}

// ── fixtures ──────────────────────────────────────────────────────────────────
const shortTextField: FormField = {
  id: 'field-name', versionId: 'v1', key: 'full_name',
  label: 'Full Name', type: 'SHORT_TEXT', required: true, order: 1,
  config: { placeholder: 'Ada Lovelace' },
}

const emailField: FormField = {
  id: 'field-email', versionId: 'v1', key: 'email',
  label: 'Email Address', type: 'EMAIL', required: true, order: 2,
  config: {},
}

const numberField: FormField = {
  id: 'field-num', versionId: 'v1', key: 'age',
  label: 'Age', type: 'NUMBER', required: false, order: 3,
  config: { min: 0, max: 150 },
}

const selectField: FormField = {
  id: 'field-role', versionId: 'v1', key: 'role',
  label: 'Role', type: 'SINGLE_SELECT', required: false, order: 4,
  config: { mode: 'static', options: [{ label: 'Admin', value: 'admin' }, { label: 'Member', value: 'member' }] },
}

const multiSelectField: FormField = {
  id: 'field-skills', versionId: 'v1', key: 'skills',
  label: 'Skills', type: 'MULTI_SELECT', required: false, order: 5,
  config: { mode: 'static', options: [{ label: 'TypeScript', value: 'ts' }, { label: 'React', value: 'react' }] },
}

const textareaField: FormField = {
  id: 'field-bio', versionId: 'v1', key: 'bio',
  label: 'Bio', type: 'LONG_TEXT', required: false, order: 6,
  config: { placeholder: 'Tell us about yourself' },
}

const phoneField: FormField = {
  id: 'field-phone', versionId: 'v1', key: 'phone',
  label: 'Phone', type: 'PHONE', required: false, order: 7,
  config: {},
}

const dateField: FormField = {
  id: 'field-dob', versionId: 'v1', key: 'dob',
  label: 'Date of Birth', type: 'DATE', required: false, order: 8,
  config: {},
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('DfeFormRenderer a11y', () => {
  it('basic text + email + number form has no critical/serious violations', async () => {
    const results = await checkA11y(
      <DfeFormRenderer
        fields={[shortTextField, emailField, numberField]}
        values={{}}
        onFieldChange={() => undefined}
      />
    )
    const v = violations(results)
    if (v.length > 0) {
      // Surface actionable failure details
      const detail = v.map(r => `[${r.impact}] ${r.id}: ${r.description}\n  nodes: ${r.nodes.map(n => n.html).join(', ')}`).join('\n')
      expect.fail(`axe violations:\n${detail}`)
    }
  })

  it('form with errors still has no critical/serious a11y violations', async () => {
    const results = await checkA11y(
      <DfeFormRenderer
        fields={[shortTextField, emailField]}
        values={{}}
        onFieldChange={() => undefined}
        errors={{ full_name: 'Full name is required', email: 'Enter a valid email' }}
      />
    )
    const v = violations(results)
    if (v.length > 0) {
      const detail = v.map(r => `[${r.impact}] ${r.id}: ${r.description}\n  nodes: ${r.nodes.map(n => n.html).join(', ')}`).join('\n')
      expect.fail(`axe violations (error state):\n${detail}`)
    }
  })

  it('select + multi-select fields have no critical/serious violations', async () => {
    const results = await checkA11y(
      <DfeFormRenderer
        fields={[selectField, multiSelectField]}
        values={{ role: 'admin', skills: ['ts'] }}
        onFieldChange={() => undefined}
      />
    )
    const v = violations(results)
    if (v.length > 0) {
      const detail = v.map(r => `[${r.impact}] ${r.id}: ${r.description}\n  nodes: ${r.nodes.map(n => n.html).join(', ')}`).join('\n')
      expect.fail(`axe violations (select fields):\n${detail}`)
    }
  })

  it('textarea, phone, date fields have no critical/serious violations', async () => {
    const results = await checkA11y(
      <DfeFormRenderer
        fields={[textareaField, phoneField, dateField]}
        values={{}}
        onFieldChange={() => undefined}
      />
    )
    const v = violations(results)
    if (v.length > 0) {
      const detail = v.map(r => `[${r.impact}] ${r.id}: ${r.description}\n  nodes: ${r.nodes.map(n => n.html).join(', ')}`).join('\n')
      expect.fail(`axe violations (textarea/phone/date):\n${detail}`)
    }
  })
})

describe('DefaultFieldRenderer a11y', () => {
  it('renders a required SHORT_TEXT field with valid aria-required', async () => {
    const results = await checkA11y(
      <DefaultFieldRenderer
        field={shortTextField}
        value=""
        onChange={() => undefined}
        error={null}
      />
    )
    const v = violations(results)
    if (v.length > 0) {
      const detail = v.map(r => `[${r.impact}] ${r.id}: ${r.description}`).join('\n')
      expect.fail(`axe violations (DefaultFieldRenderer required):\n${detail}`)
    }
  })

  it('renders an error state with aria-invalid and no critical/serious violations', async () => {
    const results = await checkA11y(
      <DefaultFieldRenderer
        field={shortTextField}
        value=""
        onChange={() => undefined}
        error="This field is required"
      />
    )
    const v = violations(results)
    if (v.length > 0) {
      const detail = v.map(r => `[${r.impact}] ${r.id}: ${r.description}`).join('\n')
      expect.fail(`axe violations (DefaultFieldRenderer error state):\n${detail}`)
    }
    // Also verify aria-invalid is actually present in the markup
    const html = renderToStaticMarkup(
      <DefaultFieldRenderer
        field={shortTextField}
        value=""
        onChange={() => undefined}
        error="This field is required"
      />
    )
    expect(html).toContain('aria-invalid')
  })
})
