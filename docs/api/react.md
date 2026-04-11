# React Hooks API Reference

## `useFormEngine(options)`

```ts
function useFormEngine(options: UseFormEngineOptions): UseFormEngineReturn
```

### Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `fields` | `FormField[]` | Yes | Field definitions |
| `initialValues` | `FormValues` | No | Pre-fill data |
| `onChange` | `(key, value, patch) => void` | No | Change callback |

### Return

| Property | Type | Description |
|----------|------|-------------|
| `engine` | `FormEngine` | Underlying engine instance |
| `values` | `FormValues` | Current form values (reactive) |
| `setFieldValue` | `(key, value) => GraphPatch` | Set a field value |
| `visibleFields` | `FormField[]` | Currently visible fields |
| `getFieldState` | `(key) => FieldNodeState` | Get field state |
| `validate` | `() => { success, errors }` | Validate all fields |
| `validateStep` | `(stepId) => { success, errors }` | Validate one step |
| `collectSubmissionValues` | `() => FormValues` | Get submission values |
| `reset` | `(fields?, values?) => void` | Reset the engine |

---

## `useFormStepper(options)`

```ts
function useFormStepper(options: UseFormStepperOptions): UseFormStepperReturn
```

### Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `steps` | `FormStep[]` | Yes | Step definitions |
| `engine` | `FormEngine` | Yes | From `useFormEngine().engine` |
| `initialIndex` | `number` | No | Starting step (default: 0) |

### Return

| Property | Type | Description |
|----------|------|-------------|
| `stepper` | `FormStepper` | Underlying stepper instance |
| `currentStep` | `StepNodeState \| null` | Current step state |
| `currentIndex` | `number` | Zero-based index |
| `visibleSteps` | `StepNodeState[]` | Non-skipped steps |
| `canGoBack` | `boolean` | Can navigate back |
| `isLastStep` | `boolean` | Current is last |
| `goNext` | `() => StepNodeState \| null` | Navigate forward |
| `goBack` | `() => StepNodeState \| null` | Navigate back |
| `jumpTo` | `(index) => void` | Jump to step |
| `markComplete` | `(stepId) => void` | Mark step done |
| `progress` | `{ current, total, percent }` | Progress info |

---

## `useFormRuntime(options)`

```ts
function useFormRuntime(options: UseFormRuntimeOptions): UseFormRuntimeReturn
```

### Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `baseUrl` | `string` | Yes | API base URL |
| `formId` | `string` | Yes | Form ID |
| `versionId` | `string` | Yes | Version ID |
| `fetchFn` | `typeof fetch` | No | Custom fetch |
| `headers` | `Record<string, string>` | No | Auth headers |

### Return

| Property | Type | Description |
|----------|------|-------------|
| `submissionId` | `string \| null` | Current submission ID |
| `context` | `FormRuntimeContext` | Runtime context |
| `isSubmitting` | `boolean` | Loading state |
| `error` | `string \| null` | Last error |
| `createSubmission` | `() => Promise<string>` | Start a submission |
| `submitStep` | `(stepId, values) => Promise<StepSubmitResponse>` | Submit a step |
| `completeSubmission` | `() => Promise<void>` | Finish the form |
| `reset` | `() => void` | Reset state |

---

## `useDynamicOptions(config)`

```ts
function useDynamicOptions(config: UseDynamicOptionsConfig): UseDynamicOptionsReturn
```

### Config

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `endpoint` | `string` | Yes | Options API endpoint |
| `pageSize` | `number` | No | Items per page (default: 20) |
| `search` | `string` | No | Initial search query |
| `dependsOnValue` | `unknown` | No | Parent field value |
| `dependsOnParam` | `string` | No | Query param name |
| `fetchFn` | `typeof fetch` | No | Custom fetch |
| `headers` | `Record<string, string>` | No | Headers |
| `enabled` | `boolean` | No | Enable/disable (default: true) |

### Return

| Property | Type | Description |
|----------|------|-------------|
| `options` | `SelectOption[]` | Loaded options |
| `isLoading` | `boolean` | Loading state |
| `hasMore` | `boolean` | More pages available |
| `loadMore` | `() => Promise<void>` | Load next page |
| `search` | `(query) => void` | Reset with search |
| `error` | `string \| null` | Error message |
