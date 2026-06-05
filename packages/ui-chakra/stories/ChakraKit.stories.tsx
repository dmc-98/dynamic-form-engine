import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DfeFormRenderer } from '../../react/src/components.ts'
import { sampleFields, sampleStepStates } from '../../react/stories/fixtures.ts'
import {
  ChakraFieldRenderer,
  DfeChakraFormPreview,
  DfeChakraStepIndicator,
} from '../src/index.tsx'

const meta = {
  title: 'UI Kits/Chakra/Form Renderer',
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
      department: 'ops',
      needs_equipment: true,
      equipment_notes: 'Mechanical keyboard',
    },
    onFieldChange: () => undefined,
    renderField: ChakraFieldRenderer,
  },
}

export const StepIndicator: Story = {
  render: () => (
    <DfeChakraStepIndicator
      steps={sampleStepStates}
      currentIndex={1}
    />
  ),
}

export const Preview: Story = {
  render: () => (
    <DfeChakraFormPreview
      fields={sampleFields}
      values={{
        first_name: 'Ada',
        bio: 'Analytical engine enthusiast.',
        department: 'ops',
      }}
      steps={sampleStepStates}
    />
  ),
}
