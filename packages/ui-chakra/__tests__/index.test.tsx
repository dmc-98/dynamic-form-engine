import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FormField, StepNodeState } from '@dmc-98/dfe-core'
import {
  ChakraFieldRenderer,
  DfeChakraFormPreview,
  DfeChakraStepIndicator,
} from '../src/index.tsx'

const sampleField: FormField = {
  id: 'field-notes',
  versionId: 'v1',
  key: 'notes',
  label: 'Notes',
  type: 'LONG_TEXT',
  required: false,
  order: 1,
  config: { placeholder: 'Add context for your reviewer' },
}

const stepStates: StepNodeState[] = [
  {
    step: {
      id: 'step-1',
      versionId: 'v1',
      title: 'Review',
      order: 1,
      config: null,
      conditions: null,
    },
    fieldKeys: ['notes'],
    isVisible: true,
    isComplete: false,
  },
]

describe('@dmc-98/dfe-ui-chakra', () => {
  it('renders a themed field renderer', () => {
    const markup = renderToStaticMarkup(
      <ChakraFieldRenderer
        field={sampleField}
        value="Ship it."
        onChange={() => undefined}
      />
    )

    expect(markup).toContain('data-dfe-chakra-theme')
    expect(markup).toContain('textarea')
    expect(markup).toContain('--dfe-color-primary:#3182ce')
  })

  it('renders a themed step indicator', () => {
    const markup = renderToStaticMarkup(
      <DfeChakraStepIndicator steps={stepStates} currentIndex={0} />
    )

    expect(markup).toContain('Review')
    expect(markup).toContain('aria-label="Form steps"')
  })

  it('renders a themed form preview', () => {
    const markup = renderToStaticMarkup(
      <DfeChakraFormPreview
        fields={[sampleField]}
        values={{ notes: 'Ship it.' }}
      />
    )

    expect(markup).toContain('data-dfe-preview-field="notes"')
    expect(markup).toContain('Ship it.')
  })
})
