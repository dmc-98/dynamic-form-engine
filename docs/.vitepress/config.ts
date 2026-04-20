import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Dynamic Form Engine',
  description: 'Configuration-driven forms with DAG-based dependencies, conditional logic, and multi-step workflows',

  base: '/dynamic-form-engine/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/dynamic-form-engine/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Dynamic Form Engine' }],
    ['meta', { property: 'og:description', content: 'Build complex, multi-step forms with zero UI lock-in' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Packages', link: '/packages/core' },
      { text: 'API', link: '/api/core' },
      { text: 'Examples', link: '/guide/examples' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/snarjun98/dynamic-form-engine/blob/main/CHANGELOG.md' },
          { text: 'Contributing', link: 'https://github.com/snarjun98/dynamic-form-engine/blob/main/CONTRIBUTING.md' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is DFE?', link: '/guide/what-is-dfe' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Supported Stack', link: '/guide/supported-stack' },
            { text: 'Choose Your Package', link: '/guide/choose-your-package' },
            { text: 'Comparison', link: '/guide/comparison' },
            { text: 'Acknowledgements', link: '/guide/acknowledgements' },
            { text: 'Production Checklist', link: '/guide/production-checklist' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Field Types', link: '/guide/field-types' },
            { text: 'DAG & Dependencies', link: '/guide/dag' },
            { text: 'Conditional Logic', link: '/guide/conditions' },
            { text: 'Validation', link: '/guide/validation' },
            { text: 'Multi-Step Forms', link: '/guide/multi-step' },
            { text: 'API Contracts', link: '/guide/api-contracts' },
          ],
        },
        {
          text: 'Recipes',
          items: [
            { text: 'Examples', link: '/guide/examples' },
            { text: 'Custom Field Types', link: '/guide/custom-fields' },
            { text: 'Dynamic Dropdowns', link: '/guide/dynamic-dropdowns' },
          ],
        },
      ],
      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: '@dmc--98/dfe-core', link: '/packages/core' },
            { text: '@dmc--98/dfe-server', link: '/packages/server' },
            { text: '@dmc--98/dfe-express', link: '/packages/express' },
            { text: '@dmc--98/dfe-prisma', link: '/packages/prisma' },
            { text: '@dmc--98/dfe-drizzle', link: '/packages/drizzle' },
            { text: '@dmc--98/dfe-react', link: '/packages/react' },
            { text: '@dmc--98/dfe-playground', link: '/packages/playground' },
            { text: '@dmc--98/dfe-cli', link: '/packages/cli' },
            { text: '@dmc--98/dfe-graphql', link: '/packages/graphql' },
            { text: '@dmc--98/dfe-docusaurus', link: '/packages/docusaurus' },
            { text: '@dmc--98/dfe-ui-mui', link: '/packages/ui-mui' },
            { text: '@dmc--98/dfe-ui-antd', link: '/packages/ui-antd' },
            { text: '@dmc--98/dfe-ui-chakra', link: '/packages/ui-chakra' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core', link: '/api/core' },
            { text: 'Server', link: '/api/server' },
            { text: 'React Hooks', link: '/api/react' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/snarjun98/dynamic-form-engine' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present snarjun98',
    },

    editLink: {
      pattern: 'https://github.com/snarjun98/dynamic-form-engine/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },
  },
})
