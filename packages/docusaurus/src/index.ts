import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FormField, FormStep } from '@dmc--98/dfe-core'

export interface DfeDocusaurusFormConfig {
  title?: string
  description?: string
  fields: FormField[]
  steps?: FormStep[]
}

export interface DfeDocusaurusFormRoute {
  id: string
  title?: string
  path?: string
  description?: string
  formConfig: DfeDocusaurusFormConfig
}

export interface DfeDocusaurusPluginOptions {
  routeBasePath?: string
  forms?: DfeDocusaurusFormRoute[]
}

export interface DocusaurusPluginActions {
  addRoute(route: Record<string, unknown>): void
  createData(fileName: string, data: string): Promise<string> | string
  setGlobalData?(data: Record<string, unknown>): void
}

function normalizeRoutePath(routeBasePath: string, routePath: string | undefined, fallbackId: string) {
  const cleanedBase = routeBasePath.startsWith('/') ? routeBasePath : `/${routeBasePath}`
  const trimmedBase = cleanedBase.replace(/\/$/, '')
  const cleanedPath = (routePath ?? fallbackId).replace(/^\/+/, '')
  return `${trimmedBase}/${cleanedPath}`.replace(/\/+/g, '/')
}

export function createDfeDocusaurusPlugin(_context: unknown, options: DfeDocusaurusPluginOptions = {}) {
  const routeBasePath = options.routeBasePath ?? '/dfe'
  const forms = options.forms ?? []

  return {
    name: 'dfe-docusaurus-plugin',
    getThemePath() {
      return dirname(fileURLToPath(new URL('./DfeFormPage.js', import.meta.url)))
    },
    async contentLoaded({ actions }: { actions: DocusaurusPluginActions }) {
      const manifest = []

      for (const form of forms) {
        const pagePath = normalizeRoutePath(routeBasePath, form.path, form.id)
        const formConfigPath = await actions.createData(
          `${form.id}.form-config.json`,
          JSON.stringify(form.formConfig, null, 2),
        )
        const formMetaPath = await actions.createData(
          `${form.id}.form-meta.json`,
          JSON.stringify({
            id: form.id,
            title: form.title ?? form.formConfig.title ?? form.id,
            description: form.description ?? form.formConfig.description ?? null,
            path: pagePath,
          }, null, 2),
        )

        actions.addRoute({
          path: pagePath,
          component: '@theme/DfeFormPage',
          exact: true,
          modules: {
            formConfig: formConfigPath,
            formMeta: formMetaPath,
          },
        })

        manifest.push({
          id: form.id,
          title: form.title ?? form.formConfig.title ?? form.id,
          path: pagePath,
        })
      }

      actions.setGlobalData?.({
        routeBasePath,
        forms: manifest,
      })
    },
  }
}

export function createDfeDocusaurusPreset(options: DfeDocusaurusPluginOptions = {}) {
  return [
    join(dirname(fileURLToPath(import.meta.url)), 'index.js'),
    options,
  ] as const
}

export { DfeFormPage } from './DfeFormPage'
