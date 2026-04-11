import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DfeFormRenderer } from '../../react/src/components.ts'
import { sampleFields, sampleStepStates } from '../../react/stories/fixtures.ts'
import {
  AntdFieldRenderer,
  DfeAntdFormPreview,
  DfeAntdStepIndicator,
} from '../src/index.tsx'

const meta = {
  title: 'UI Kits/Ant Design/Form Renderer',
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
      department: 'design',
      needs_equipment: false,
    },
    onFieldChange: () => undefined,
    renderField: AntdFieldRenderer,
  },
}

export const StepIndicator: Story = {
  render: () => (
    <DfeAntdStepIndicator
      steps={sampleStepStates}
      currentIndex={0}
    />
  ),
}

export const Preview: Story = {
  render: () => (
    <DfeAntdFormPreview
      fields={sampleFields}
      values={{
        first_name: 'Ada',
        bio: 'Analytical engine enthusiast.',
        department: 'design',
      }}
      steps={sampleStepStates}
    />
  ),
}
