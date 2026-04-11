import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FormField, StepNodeState } from '@dmc-98/dfe-core'
import {
  AntdFieldRenderer,
  DfeAntdFormPreview,
  DfeAntdStepIndicator,
} from '../src/index.tsx'

const sampleField: FormField = {
  id: 'field-role',
  versionId: 'v1',
  key: 'role',
  label: 'Role',
  type: 'SELECT',
  required: true,
  order: 1,
  config: {
    mode: 'static',
    options: [
      { label: 'Engineer', value: 'eng' },
      { label: 'Designer', value: 'design' },
    ],
  },
}

const stepStates: StepNodeState[] = [
  {
    step: {
      id: 'step-1',
      versionId: 'v1',
      title: 'Assignment',
      order: 1,
      config: null,
      conditions: null,
    },
    fieldKeys: ['role'],
    isVisible: true,
    isComplete: false,
  },
]

describe('@dmc-98/dfe-ui-antd', () => {
  it('renders a themed field renderer', () => {
    const markup = renderToStaticMarkup(
      <AntdFieldRenderer
        field={sampleField}
        value="eng"
        onChange={() => undefined}
      />
    )

    expect(markup).toContain('data-dfe-antd-theme')
    expect(markup).toContain('Engineer')
    expect(markup).toContain('--dfe-color-primary:#1677ff')
  })

  it('renders a themed step indicator', () => {
    const markup = renderToStaticMarkup(
      <DfeAntdStepIndicator steps={stepStates} currentIndex={0} />
    )

    expect(markup).toContain('Assignment')
    expect(markup).toContain('aria-label="Form steps"')
  })

  it('renders a themed form preview', () => {
    const markup = renderToStaticMarkup(
      <DfeAntdFormPreview
        fields={[sampleField]}
        values={{ role: 'eng' }}
      />
    )

    expect(markup).toContain('data-dfe-preview-field="role"')
    expect(markup).toContain('eng')
  })
})
