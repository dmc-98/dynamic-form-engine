import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DfeFormRenderer } from '../../react/src/components.ts'
import { sampleFields, sampleStepStates } from '../../react/stories/fixtures.ts'
import {
  DfeMuiFormPreview,
  DfeMuiStepIndicator,
  MuiFieldRenderer,
} from '../src/index.tsx'

const meta = {
  title: 'UI Kits/MUI/Form Renderer',
  component: DfeFormRenderer,
  tags: ['autodocs'],
} satisfies Meta<typeof DfeFormRenderer>

export default meta

type Story = StoryObj<typeof meta>

export const Renderer: Story = {
  args: {
    fields: sampleFields,
    values: {
      first_name: 'Ada',
      bio: 'Analytical engine enthusiast.',
      department: 'eng',
      needs_equipment: true,
      equipment_notes: 'Laptop and monitor',
    },
    onFieldChange: () => undefined,
    renderField: MuiFieldRenderer,
  },
}

export const StepIndicator: Story = {
  render: () => (
    <DfeMuiStepIndicator
      steps={sampleStepStates}
      currentIndex={1}
    />
  ),
}

export const Preview: Story = {
  render: () => (
    <DfeMuiFormPreview
      fields={sampleFields}
      values={{
        first_name: 'Ada',
        bio: 'Analytical engine enthusiast.',
        department: 'eng',
      }}
      steps={sampleStepStates}
    />
  ),
}
