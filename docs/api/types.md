# Type Reference

All types are exported from `@dmc-98/dfe-core`.

## Field Types

### `FieldType`

```ts
type FieldType =
  | 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMBER' | 'EMAIL' | 'PHONE'
  | 'DATE' | 'DATE_RANGE' | 'TIME' | 'DATE_TIME'
  | 'SELECT' | 'MULTI_SELECT' | 'RADIO' | 'CHECKBOX'
  | 'FILE_UPLOAD' | 'RATING' | 'SCALE'
  | 'URL' | 'PASSWORD' | 'HIDDEN'
  | 'SECTION_BREAK' | 'FIELD_GROUP'
```

### `FormField`

```ts
interface FormField {
  id: string
  versionId: string
  stepId?: string | null
  sectionId?: string | null
  parentFieldId?: string | null
  key: FieldKey
  label: string
  description?: string | null
  type: FieldType
  required: boolean
  order: number
  config: FieldConfig
  conditions?: FieldConditions | null
  children?: FormField[]
}
```

### `FormStep`

```ts
interface FormStep {
  id: string
  versionId: string
  title: string
  description?: string | null
  order: number
  conditions?: ConditionSkipRule | null
  config?: StepConfig | null
  fields?: FormField[]
}
```

## Conditions

### `FieldConditions`

```ts
interface FieldConditions {
  action: 'SHOW' | 'HIDE' | 'REQUIRE' | 'DISABLE'
  operator: 'and' | 'or'
  rules: ConditionRule[]
}
```

### `ConditionRule`

```ts
interface ConditionRule {
  fieldKey: FieldKey
  operator: ConditionOperator
  value?: unknown
}
```

### `ConditionOperator`

```ts
type ConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte'
  | 'lt' | 'lte'
  | 'contains' | 'not_contains'
  | 'empty' | 'not_empty'
  | 'in' | 'not_in'
```

## API Contracts

### `StepApiContract`

```ts
interface StepApiContract {
  resourceName: string
  endpoint: string
  method: 'PUT' | 'POST'
  fieldMapping: Record<string, string>
  responseToContext?: Record<string, string>
  contextToBody?: Record<string, string>
}
```

### `StepConfig`

```ts
interface StepConfig {
  apiContracts?: StepApiContract[]
  review?: ReviewConfig
}
```

## Graph Types

### `FormGraph`

```ts
interface FormGraph {
  nodes: Map<FieldKey, FieldNodeState>
  dependents: Map<FieldKey, Set<FieldKey>>
  topoOrder: FieldKey[]
  compiledConditions: Map<FieldKey, CompiledCondition>
}
```

### `FieldNodeState`

```ts
interface FieldNodeState {
  field: FormField
  value: unknown
  isVisible: boolean
  isRequired: boolean
  isDirty: boolean
  validationError?: string | null
}
```

### `GraphPatch`

```ts
interface GraphPatch {
  updatedKeys: Set<FieldKey>
  visibilityChanges: Map<FieldKey, boolean>
  requiredChanges: Map<FieldKey, boolean>
}
```

## Runtime Types

### `FormRuntimeContext`

```ts
interface FormRuntimeContext {
  userId: string
  [key: string]: unknown
}
```

### `StepSubmitPayload`

```ts
interface StepSubmitPayload {
  values: FormValues
  context: FormRuntimeContext
}
```

### `StepSubmitResponse`

```ts
interface StepSubmitResponse {
  success: boolean
  context: FormRuntimeContext
  errors?: Record<string, string>
}
```

### `OptionsPage`

```ts
interface OptionsPage {
  items: SelectOption[]
  nextCursor: string | null
  total?: number
}
```

### `SelectOption`

```ts
interface SelectOption {
  label: string
  value: string
  meta?: unknown
}
```
