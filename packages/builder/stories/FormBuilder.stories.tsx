import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FormBuilder } from '../src/FormBuilder'
import { DfeFormBuilder } from '../src/components/DfeFormBuilder'
// Panel styling for the 3-panel API. (FormBuilder is self-contained and needs no import.)
import '../src/builder.css'

const meta: Meta = {
  title: 'Builder/FormBuilder',
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj

/** Self-contained drag-and-drop builder (Graphite & Teal, token-driven). */
export const DragAndDrop: Story = {
  render: () => <FormBuilder />,
}

/** Pre-populated so the canvas + selection ring + property editor are visible. */
export const WithFields: Story = {
  render: () => (
    <FormBuilder
      initialState={{
        fields: [
          { id: 'f1', key: 'full_name', label: 'Full name', type: 'SHORT_TEXT', required: true, order: 0 },
          { id: 'f2', key: 'email', label: 'Work email', type: 'EMAIL', required: true, order: 1 },
          { id: 'f3', key: 'plan', label: 'Plan', type: 'SELECT', required: false, order: 2 },
        ],
        selectedFieldId: 'f2',
      } as never}
    />
  ),
}

/** The 3-panel builder API (FieldPalette · FormCanvas · PropertyEditor + toolbar). */
export const PanelLayout: Story = {
  render: () => <DfeFormBuilder />,
}
