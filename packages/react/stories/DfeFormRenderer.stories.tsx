import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DfeFormRenderer } from '../src/components.ts'
import { sampleFields } from './fixtures'

const meta = {
  title: 'React/DfeFormRenderer',
  component: DfeFormRenderer,
  tags: ['autodocs'],
} satisfies Meta<typeof DfeFormRenderer>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultState: Story = {
  args: {
    fields: sampleFields,
    values: {
      first_name: 'Ada',
      bio: 'Inventing analytical engines and debugging impossible programs.',
      department: 'eng',
      needs_equipment: true,
      equipment_notes: 'Laptop and external monitor',
    },
    onFieldChange: () => undefined,
    errors: {},
  },
}

export const ValidationState: Story = {
  args: {
    fields: sampleFields,
    values: {
      first_name: '',
      department: '',
      needs_equipment: false,
    },
    onFieldChange: () => undefined,
    errors: {
      first_name: 'First name is required',
      department: 'Choose a department',
    },
  },
}
