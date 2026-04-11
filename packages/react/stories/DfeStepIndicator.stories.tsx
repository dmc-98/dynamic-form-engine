import type { Meta, StoryObj } from '@storybook/react'
import { DfeStepIndicator } from '../src/components.ts'
import { sampleStepStates } from './fixtures'

const meta = {
  title: 'React/DfeStepIndicator',
  component: DfeStepIndicator,
  tags: ['autodocs'],
} satisfies Meta<typeof DfeStepIndicator>

export default meta

type Story = StoryObj<typeof meta>

export const Progress: Story = {
  args: {
    steps: sampleStepStates,
    currentIndex: 1,
  },
}

export const Clickable: Story = {
  args: {
    steps: sampleStepStates,
    currentIndex: 1,
    onStepClick: () => undefined,
  },
}
