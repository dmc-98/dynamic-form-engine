import { createDfeDocusaurusPlugin } from '@dmc-98/dfe-docusaurus'

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
  presets: [],
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
