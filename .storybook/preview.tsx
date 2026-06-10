import React from 'react'
import type { Preview } from '@storybook/react'

// Canonical design tokens + motion — the real system every surface consumes.
import '@dmc--98/dfe-tokens/tokens.css'
import '@dmc--98/dfe-tokens/motion.css'

const preview: Preview = {
  globalTypes: {
    dfeScheme: {
      name: 'Theme',
      description: 'DFE color scheme',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const scheme = (context.globals as { dfeScheme?: string }).dfeScheme ?? 'light'
      return (
        <div
          data-dfe-theme
          data-dfe-color-scheme={scheme}
          style={{
            minHeight: '100vh',
            padding: '2rem',
            background: 'var(--dfe-gradient-hero)',
            color: 'var(--dfe-color-text)',
            fontFamily: 'var(--dfe-font-sans)',
          }}
        >
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <Story />
          </div>
        </div>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
}

export default preview
