# @dmc--98/dfe-react

React hooks and optional headless components for the Dynamic Form Engine, including the current browser-local sync/offline baseline used by the canonical example.

## Install

```bash
npm install @dmc--98/dfe-react @dmc--98/dfe-core react zod
```

## Hooks

### `useFormEngine(options)`

Wraps `createFormEngine()` with React state:

```tsx
import { useFormEngine } from '@dmc--98/dfe-react'

const { values, setFieldValue, visibleFields, validate, reset } = useFormEngine({
  fields,               // FormField[]
  initialValues,        // optional pre-fill data
  onChange: (key, value, patch) => {
    // React to field changes
  },
})
```

### `useFormStepper(options)`

Wraps `createFormStepper()` with React state:

```tsx
import { useFormStepper } from '@dmc--98/dfe-react'

const stepper = useFormStepper({
  steps,                // FormStep[]
  engine: engine.engine, // from useFormEngine
  initialIndex: 0,
})

stepper.goNext()
stepper.goBack()
stepper.jumpTo(2)
stepper.markComplete('step1')
```

### `useFormRuntime(options)`

Manages the submission lifecycle (create, step submit, complete):

```tsx
import { useFormRuntime } from '@dmc--98/dfe-react'

const runtime = useFormRuntime({
  baseUrl: '/api',
  formId: 'employee-onboarding',
  versionId: 'v1',
  headers: { Authorization: `Bearer ${token}` },
})

await runtime.createSubmission()
const result = await runtime.submitStep('step1', values)
await runtime.completeSubmission()
```

### `useOfflineFormRuntime(options)`

Adds IndexedDB-backed draft persistence and queued mutation replay on reconnect:

```tsx
import { useOfflineFormRuntime } from '@dmc--98/dfe-react'

const runtime = useOfflineFormRuntime({
  baseUrl: '/api',
  formId: 'employee-onboarding',
  versionId: 'v1',
  offlineEnabled: true,
})

if (runtime.isOffline) {
  console.log(`Pending actions: ${runtime.pendingActions}`)
}
```

### `useFormSync(options)`

Adds browser-local collaborative draft sync and participant awareness:

```tsx
import { useFormEngine, useFormSync } from '@dmc--98/dfe-react'

const engine = useFormEngine({ fields })
const sync = useFormSync({
  engine: engine.engine,
  sessionId: 'shared-session',
  actorId: 'user-123',
  displayName: 'Reviewer',
})

await sync.setFieldValue('first_name', 'Ada')
console.log(sync.participants)
```

### `useDynamicOptions(config)`

Loads options for dynamic SELECT fields with pagination and search:

```tsx
import { useDynamicOptions } from '@dmc--98/dfe-react'

const { options, isLoading, hasMore, loadMore, search } = useDynamicOptions({
  endpoint: '/api/dfe/fields/dept/options',
  pageSize: 20,
  dependsOnValue: selectedCountry,
  dependsOnParam: 'countryId',
})
```

## Default Components

Import from `@dmc--98/dfe-react/components`:

```tsx
import { DfeFormRenderer, DfeStepIndicator } from '@dmc--98/dfe-react/components'
```

### `<DfeFormRenderer />`

Renders visible fields using a field renderer function:

```tsx
<DfeFormRenderer
  fields={engine.visibleFields}
  values={engine.values}
  onFieldChange={engine.setFieldValue}
  errors={validationErrors}
  renderField={({ field, value, onChange, error }) => (
    <MyInput field={field} value={value} onChange={onChange} error={error} />
  )}
/>
```

Without `renderField`, it renders unstyled HTML inputs with `data-dfe-*` attributes for CSS targeting.

### `<DfeStepIndicator />`

Renders a step progress indicator:

```tsx
<DfeStepIndicator
  steps={stepper.visibleSteps}
  currentIndex={stepper.currentIndex}
  onStepClick={stepper.jumpTo}
/>
```

## Bring Your Own Components

DFE is headless by design. The hooks give you reactive data; you render however you want:

```tsx
function MyForm({ fields }) {
  const { values, setFieldValue, visibleFields, validate } = useFormEngine({ fields })

  return visibleFields.map(field => {
    switch (field.type) {
      case 'SHORT_TEXT': return <MyTextField key={field.key} ... />
      case 'SELECT': return <MySelect key={field.key} ... />
      case 'CHECKBOX': return <MyCheckbox key={field.key} ... />
      default: return <MyGenericInput key={field.key} ... />
    }
  })
}
```

## Theming

`@dmc--98/dfe-react` now ships a token-driven theme layer for the default components:

```tsx
import { DfeThemeProvider } from '@dmc--98/dfe-react/theme'

<DfeThemeProvider
  theme={{
    colors: {
      primary: '#1d4ed8',
      surfaceMuted: '#eff6ff',
    },
    spacing: {
      lg: '1.5rem',
    },
  }}
>
  <MyDynamicForm />
</DfeThemeProvider>
```

Available token groups:

- `colors`
- `spacing`
- `radius`
- `typography`
- `shadow`

The provider injects shared CSS-variable-backed base styles for:

- form fields and controls
- descriptions and validation errors
- step indicators
- form preview grids

## Sync Utilities

`@dmc--98/dfe-react` also exports:

- `createIndexedDbPersistenceAdapter()`
- `createMemoryPersistenceAdapter()`
- `createBroadcastChannelSyncTransport()`
- `buildSyncStorageKey()`

These power the current browser-local sync/offline baseline. The verified example lane uses IndexedDB plus a BroadcastChannel transport; server-backed remote collaboration is still a separate future hardening track rather than the current package default.
