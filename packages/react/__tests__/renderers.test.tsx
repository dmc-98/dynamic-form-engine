import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FormField } from '@dmc--98/dfe-core'
import { DefaultFieldRenderer } from '../src/components/DfeFormRenderer'
import { DfeResponsiveLayout } from '../src/components/DfeResponsiveLayout'
import {
  createFieldRenderModel,
  getAddressValue,
  getDateRangeValue,
  getStringArrayValue,
  type FieldRendererProps,
} from '../src/renderers'

const textField: FormField = {
  id: 'field-name',
  versionId: 'v1',
  key: 'full_name',
  label: 'Full Name',
  type: 'SHORT_TEXT',
  required: true,
  order: 1,
  description: 'Use your legal name.',
  config: { placeholder: 'Ada Lovelace' },
}

describe('renderers', () => {
  it('creates a shared render model with a11y metadata', () => {
    const model = createFieldRenderModel({
      field: textField,
      value: '',
      onChange: () => undefined,
      error: 'Name is required',
    })

    expect(model.id).toBe('dfe-field-full_name')
    expect(model.labelId).toBe('dfe-field-full_name-label')
    expect(model.descriptionId).toBe('dfe-field-full_name-desc')
    expect(model.errorId).toBe('dfe-field-full_name-error')
    expect(model.describedBy).toContain(model.descriptionId as string)
    expect(model.describedBy).toContain(model.errorId as string)
    expect(model.controlProps['aria-invalid']).toBe(true)
  })

  it('normalizes grouped field values for shared UI kits', () => {
    expect(getStringArrayValue(['eng', 'design'])).toEqual(['eng', 'design'])
    expect(getStringArrayValue('eng')).toEqual(['eng'])
    expect(getDateRangeValue({ from: '2026-03-10' })).toEqual({
      from: '2026-03-10',
      to: '',
    })
    expect(getAddressValue({ city: 'Bengaluru', zip: 560001 })).toEqual({
      street: '',
      city: 'Bengaluru',
      state: '',
      zip: '',
      country: '',
    })
  })

  it('renders complex fields through the default shared contract', () => {
    const addressMarkup = renderToStaticMarkup(
      <DefaultFieldRenderer
        field={{
          id: 'field-address',
          versionId: 'v1',
          key: 'address',
          label: 'Address',
          type: 'ADDRESS',
          required: false,
          order: 2,
          config: {},
        }}
        value={{ city: 'London' }}
        onChange={() => undefined}
      />
    )

    const multiSelectMarkup = renderToStaticMarkup(
      <DefaultFieldRenderer
        field={{
          id: 'field-skills',
          versionId: 'v1',
          key: 'skills',
          label: 'Skills',
          type: 'MULTI_SELECT',
          required: false,
          order: 3,
          config: {
            mode: 'static',
            options: [
              { label: 'TypeScript', value: 'ts' },
              { label: 'React', value: 'react' },
            ],
          },
        }}
        value={['ts']}
        onChange={() => undefined}
      />
    )

    expect(addressMarkup).toContain('placeholder="City"')
    expect(addressMarkup).toContain('value="London"')
    expect(multiSelectMarkup).toContain('multiple=""')
    expect(multiSelectMarkup).toContain('TypeScript')
  })

  it('uses the same renderer component contract inside the responsive layout', () => {
    const fieldRenderer = ({ field }: FieldRendererProps) => (
      <div data-custom-renderer={field.key}>{field.label}</div>
    )

    const markup = renderToStaticMarkup(
      <DfeResponsiveLayout
        fields={[textField]}
        values={{ full_name: 'Ada' }}
        onFieldChange={vi.fn()}
        renderField={fieldRenderer}
      />
    )

    expect(markup).toContain('data-custom-renderer="full_name"')
    expect(markup).toContain('data-dfe-responsive-grid')
  })
})
