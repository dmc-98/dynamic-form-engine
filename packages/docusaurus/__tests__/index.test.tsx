import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DfeFormPage, createDfeDocusaurusPlugin, createDfeDocusaurusPreset } from '../src'

const sampleForm = {
  title: 'Employee Onboarding',
  description: 'Collect employee details',
  fields: [
    {
      id: 'field-full-name',
      versionId: 'version-1',
      key: 'full_name',
      label: 'Full Name',
      type: 'SHORT_TEXT' as const,
      required: true,
      order: 1,
      config: {},
    },
  ],
}

describe('@dmc--98/dfe-docusaurus', () => {
  it('registers DFE routes and global data through the plugin hook', async () => {
    const plugin = createDfeDocusaurusPlugin({}, {
      routeBasePath: '/forms',
      forms: [
        {
          id: 'employee-onboarding',
          path: '/examples/onboarding',
          title: 'Employee Onboarding',
          formConfig: sampleForm,
        },
      ],
    })
    const addRoute = vi.fn()
    const createData = vi.fn(async (fileName: string) => `/tmp/${fileName}`)
    const setGlobalData = vi.fn()

    await plugin.contentLoaded({
      actions: {
        addRoute,
        createData,
        setGlobalData,
      },
    })

    expect(plugin.getThemePath()).toContain('packages/docusaurus/')
    expect(plugin.getThemePath()).toMatch(/\/packages\/docusaurus\/(src|dist)$/)
    expect(createData).toHaveBeenCalledTimes(2)
    expect(addRoute).toHaveBeenCalledWith(expect.objectContaining({
      path: '/forms/examples/onboarding',
      component: '@theme/DfeFormPage',
      exact: true,
    }))
    expect(setGlobalData).toHaveBeenCalledWith({
      routeBasePath: '/forms',
      forms: [
        {
          id: 'employee-onboarding',
          title: 'Employee Onboarding',
          path: '/forms/examples/onboarding',
        },
      ],
    })
  })

  it('renders a live DFE form page from supplied config', () => {
    const markup = renderToStaticMarkup(
      <DfeFormPage
        formConfig={sampleForm}
        formMeta={{
          title: 'Employee Onboarding',
          description: 'Collect employee details',
        }}
      />,
    )

    expect(markup).toContain('Employee Onboarding')
    expect(markup).toContain('Full Name')
  })

  it('creates a preset tuple for Docusaurus config usage', () => {
    const preset = createDfeDocusaurusPreset({
      forms: [
        {
          id: 'employee-onboarding',
          formConfig: sampleForm,
        },
      ],
    })

    expect(Array.isArray(preset)).toBe(true)
    expect(String(preset[0])).toContain('packages/docusaurus/')
    expect(String(preset[0])).toMatch(/\/packages\/docusaurus\/(src|dist)\/index\.js$/)
    expect(preset[1]).toMatchObject({
      forms: [
        {
          id: 'employee-onboarding',
        },
      ],
    })
  })
})
