import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FormField, StepNodeState } from '@dmc--98/dfe-core'
import {
  DfeMuiFormPreview,
  DfeMuiStepIndicator,
  DfeMuiThemeProvider,
  MuiFieldRenderer,
} from '../src/index.tsx'

const sampleField: FormField = {
  id: 'field-email',
  versionId: 'v1',
  key: 'email',
  label: 'Email',
  type: 'EMAIL',
  required: true,
  order: 1,
  config: { placeholder: 'ada@example.com' },
}

const stepStates: StepNodeState[] = [
  {
    step: {
      id: 'step-1',
      versionId: 'v1',
      title: 'Profile',
      order: 1,
      config: null,
      conditions: null,
    },
    fieldKeys: ['email'],
    isVisible: true,
    isComplete: false,
  },
]

describe('@dmc--98/dfe-ui-mui', () => {
  it('renders a themed field renderer', () => {
    const markup = renderToStaticMarkup(
      <MuiFieldRenderer
        field={sampleField}
        value="ada@example.com"
        onChange={() => undefined}
      />
    )

    expect(markup).toContain('data-dfe-mui-theme')
    expect(markup).toContain('placeholder="ada@example.com"')
    // Default look is now DFE "Graphite & Teal" (teal-700), not MUI blue.
    expect(markup).toContain('--dfe-color-primary:#0f766e')
  })

  it('restores the MUI-native palette when disableDfeTheme is set', () => {
    const markup = renderToStaticMarkup(
      <DfeMuiThemeProvider disableDfeTheme>
        <span>opt-out</span>
      </DfeMuiThemeProvider>
    )
    expect(markup).toContain('--dfe-color-primary:#1976d2')
  })

  it('renders a themed step indicator', () => {
    const markup = renderToStaticMarkup(
      <DfeMuiStepIndicator steps={stepStates} currentIndex={0} />
    )

    expect(markup).toContain('aria-label="Form steps"')
    expect(markup).toContain('Profile')
  })

  it('renders a themed form preview', () => {
    const markup = renderToStaticMarkup(
      <DfeMuiFormPreview
        fields={[sampleField]}
        values={{ email: 'ada@example.com' }}
      />
    )

    expect(markup).toContain('data-dfe-preview-field="email"')
    expect(markup).toContain('ada@example.com')
  })
})
