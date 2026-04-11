import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const sampleFields = [
  {
    id: 'field-first-name',
    versionId: 'version-1',
    key: 'first_name',
    label: 'First Name',
    type: 'SHORT_TEXT',
    required: true,
    order: 1,
    stepId: 'step-personal',
    config: {},
  },
]

const sampleSteps = [
  {
    id: 'step-personal',
    versionId: 'version-1',
    title: 'Personal Information',
    order: 1,
  },
]

const sampleForm = {
  id: 'form-1',
  slug: 'employee-onboarding',
  title: 'Employee Onboarding',
  description: null,
  versionId: 'version-1',
  steps: sampleSteps,
  fields: sampleFields,
}

const mockDb = {
  async listForms() {
    return {
      items: [sampleForm],
      nextCursor: null,
    }
  },
  async getFormBySlug(slug) {
    return { ...sampleForm, slug }
  },
  async getFormById(id) {
    return { ...sampleForm, id }
  },
  async createSubmission({ formId, versionId, userId, context }) {
    return {
      id: 'submission-1',
      formId,
      versionId,
      userId,
      status: 'IN_PROGRESS',
      currentStepId: 'step-personal',
      context,
    }
  },
  async getSubmission(id) {
    return {
      id,
      formId: sampleForm.id,
      versionId: sampleForm.versionId,
      userId: 'user-1',
      status: 'IN_PROGRESS',
      currentStepId: 'step-personal',
      context: { userId: 'user-1' },
    }
  },
  async updateSubmissionStep() {
    return undefined
  },
  async completeSubmission() {
    return undefined
  },
  async updateSubmission() {
    return undefined
  },
  async fetchFieldOptions() {
    return {
      items: [],
      nextCursor: null,
    }
  },
}

async function importBuiltModule(packageName) {
  const entryPath = join(repoRoot, 'packages', packageName, 'dist', 'index.js')
  assert.ok(existsSync(entryPath), `Missing built entrypoint for packages/${packageName}: ${entryPath}`)
  return import(pathToFileURL(entryPath).href)
}

async function smokeFastify() {
  const { createDfePlugin } = await importBuiltModule('fastify')
  assert.equal(typeof createDfePlugin, 'function')

  const routes = []
  const fakeFastify = {
    get(path, handler) {
      routes.push({ method: 'GET', path, handler })
    },
    post(path, handler) {
      routes.push({ method: 'POST', path, handler })
    },
  }

  const plugin = createDfePlugin({ db: mockDb, skipAuth: true })
  await plugin(fakeFastify)

  const listFormsRoute = routes.find(route => route.method === 'GET' && route.path === '/dfe/forms')
  assert.ok(listFormsRoute, 'Fastify plugin did not register GET /dfe/forms')

  let payload
  await listFormsRoute.handler(
    { query: { pageSize: '5' } },
    { send(value) { payload = value } },
  )

  assert.equal(payload.items[0]?.id, sampleForm.id)
}

async function smokeHono() {
  const { createDfeApp } = await importBuiltModule('hono')
  assert.equal(typeof createDfeApp, 'function')

  const app = createDfeApp({
    db: mockDb,
    prefix: '/api/dfe',
    skipAuth: true,
  })

  const response = await app.request('http://localhost/api/dfe/forms?pageSize=5')
  assert.equal(response.status, 200)

  const payload = await response.json()
  assert.equal(payload.items[0]?.id, sampleForm.id)
}

async function smokeTrpc() {
  const { createDfeTrpcRouter } = await importBuiltModule('trpc')
  assert.equal(typeof createDfeTrpcRouter, 'function')

  const router = createDfeTrpcRouter({
    db: mockDb,
    skipAuth: true,
  })
  const caller = router.createCaller({})

  const forms = await caller.listForms({ pageSize: 5 })
  assert.equal(forms.items[0]?.id, sampleForm.id)

  const submission = await caller.createSubmission({
    formId: sampleForm.id,
    versionId: sampleForm.versionId,
  })
  assert.equal(submission.status, 'IN_PROGRESS')
}

async function smokeAngular() {
  const {
    DfeFormEngineService,
    DfeFormStepperService,
  } = await importBuiltModule('angular')

  const engineService = new DfeFormEngineService()
  engineService.init({ fields: sampleFields })

  assert.equal(engineService.getVisibleFields().length, 1)
  assert.equal(engineService.validate().success, false)

  const stepperService = new DfeFormStepperService()
  stepperService.init({
    steps: sampleSteps,
    engine: engineService.getEngine(),
  })

  assert.equal(stepperService.getCurrentIndex(), 0)
  assert.equal(stepperService.getVisibleSteps().length, 1)
}

async function smokeVanilla() {
  const {
    DfeFormController,
    DfeStepController,
  } = await importBuiltModule('vanilla')

  const formController = new DfeFormController({ fields: sampleFields })
  assert.equal(formController.getFields().length, 1)

  formController.setFieldValue('first_name', 'Ada')
  assert.equal(formController.getValues().first_name, 'Ada')

  const stepController = new DfeStepController({
    steps: sampleSteps,
    engine: formController.getEngine(),
  })
  assert.equal(stepController.getProgress().total, 1)
}

async function smokeVue() {
  const { useFormEngine } = await importBuiltModule('vue')
  assert.equal(typeof useFormEngine, 'function')

  const form = useFormEngine({ fields: sampleFields })
  form.setFieldValue('first_name', 'Grace')

  assert.equal(form.visibleFields.value.length, 1)
  assert.equal(form.values.value.first_name, 'Grace')
}

async function smokeSvelte() {
  const {
    createFormEngineStore,
    createFormStepperStore,
  } = await importBuiltModule('svelte')
  assert.equal(typeof createFormEngineStore, 'function')
  assert.equal(typeof createFormStepperStore, 'function')

  const engineStores = createFormEngineStore(sampleFields)
  let currentValues
  const unsubscribeValues = engineStores.values.subscribe(value => {
    currentValues = value
  })
  engineStores.setFieldValue('first_name', 'Katherine')
  assert.equal(currentValues.first_name, 'Katherine')
  unsubscribeValues()

  const stepperStores = createFormStepperStore(sampleSteps, engineStores.engine)
  let progress
  const unsubscribeProgress = stepperStores.progress.subscribe(value => {
    progress = value
  })
  assert.equal(progress.total, 1)
  unsubscribeProgress()
}

async function smokeSolid() {
  const {
    createFormEngine,
    createFormStepper,
  } = await importBuiltModule('solid')
  assert.equal(typeof createFormEngine, 'function')
  assert.equal(typeof createFormStepper, 'function')
}

async function smokeGraphql() {
  const { createDfeGraphqlApi } = await importBuiltModule('graphql')
  assert.equal(typeof createDfeGraphqlApi, 'function')

  const api = createDfeGraphqlApi({
    db: mockDb,
    skipAuth: true,
  })

  const result = await api.execute({
    source: `
      query {
        listForms {
          items {
            id
            slug
          }
          nextCursor
        }
      }
    `,
  })

  assert.equal(result.errors, undefined)
  assert.equal(result.data.listForms.items[0]?.id, sampleForm.id)
}

async function smokeDocusaurus() {
  const {
    DfeFormPage,
    createDfeDocusaurusPlugin,
    createDfeDocusaurusPreset,
  } = await importBuiltModule('docusaurus')

  assert.equal(typeof createDfeDocusaurusPlugin, 'function')
  assert.equal(typeof createDfeDocusaurusPreset, 'function')
  assert.equal(typeof DfeFormPage, 'function')

  const plugin = createDfeDocusaurusPlugin({}, {
    forms: [
      {
        id: 'employee-onboarding',
        title: 'Employee Onboarding',
        formConfig: {
          title: 'Employee Onboarding',
          fields: sampleFields,
          steps: sampleSteps,
        },
      },
    ],
  })

  let route
  await plugin.contentLoaded({
    actions: {
      addRoute(value) {
        route = value
      },
      createData(fileName) {
        return `/tmp/${fileName}`
      },
    },
  })

  assert.equal(route.path, '/dfe/employee-onboarding')

  const preset = createDfeDocusaurusPreset({
    forms: [
      {
        id: 'employee-onboarding',
        formConfig: {
          fields: sampleFields,
        },
      },
    ],
  })

  assert.ok(Array.isArray(preset))
}

const checks = [
  ['fastify', smokeFastify],
  ['hono', smokeHono],
  ['trpc', smokeTrpc],
  ['angular', smokeAngular],
  ['vanilla', smokeVanilla],
  ['vue', smokeVue],
  ['svelte', smokeSvelte],
  ['solid', smokeSolid],
  ['graphql', smokeGraphql],
  ['docusaurus', smokeDocusaurus],
]

for (const [label, check] of checks) {
  await check()
  console.log(`Wrapper smoke passed: ${label}`)
}

console.log('Wrapper package smoke checks passed.')
