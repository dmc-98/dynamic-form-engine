import { createRequire } from 'node:module'
import { createDfeDocusaurusPlugin } from '@dmc--98/dfe-docusaurus'

const require = createRequire(import.meta.url)

const employeeOnboarding = {
  title: 'Employee Onboarding',
  description: 'A DFE form rendered inside Docusaurus.',
  fields: [
    {
      id: 'field-full-name',
      versionId: 'version-1',
      key: 'full_name',
      label: 'Full Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: {},
    },
  ],
}

export default {
  title: 'DFE Docs',
  url: 'https://example.com',
  baseUrl: '/',
  // Graphite & Teal theme — maps Infima vars onto the DFE design tokens.
  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
  },
  presets: [
    [
      'classic',
      {
        theme: {
          customCss: [require.resolve('@dmc--98/dfe-docusaurus/theme.css')],
        },
      },
    ],
  ],
  plugins: [
    [
      createDfeDocusaurusPlugin,
      {
        forms: [
          {
            id: 'employee-onboarding',
            path: '/examples/employee-onboarding',
            title: 'Employee Onboarding',
            formConfig: employeeOnboarding,
          },
        ],
      },
    ],
  ],
}
