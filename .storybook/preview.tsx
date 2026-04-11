import React from 'react'
import type { Preview } from '@storybook/react'
import { DfeThemeProvider } from '../packages/react/src/theme.ts'

const preview: Preview = {
  decorators: [
    Story => (
      <div
        style={{
          minHeight: '100vh',
          padding: '2rem',
          background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
        }}
      >
        <DfeThemeProvider>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <Story />
          </div>
        </DfeThemeProvider>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
    },
  },
}

export default preview
