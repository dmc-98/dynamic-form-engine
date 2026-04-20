# Core API Reference

## Factory Functions

### `createFormEngine(fields, hydrationData?)`

Creates a form engine instance.

**Parameters:**
- `fields: FormField[]` — field definitions (flat or nested tree)
- `hydrationData?: FormValues` — optional initial values

**Returns:** `FormEngine`

---

### `createFormStepper(steps, engine, initialIndex?)`

Creates a stepper for multi-step navigation.

**Parameters:**
- `steps: FormStep[]` — step definitions in order
- `engine: FormEngine` — a form engine instance
- `initialIndex?: number` — starting step index (default: 0)

**Returns:** `FormStepper`

---

## FormEngine Interface

```ts
interface FormEngine {
  graph: FormGraph
  setFieldValue(key: FieldKey, value: unknown): GraphPatch
  getValues(): FormValues
  getVisibleFields(): FormField[]
  getFieldState(key: FieldKey): FieldNodeState | undefined
  validate(): { success: boolean; errors: Record<string, string> }
  validateStep(stepId: string): { success: boolean; errors: Record<string, string> }
  collectSubmissionValues(): FormValues
}
```

### `engine.setFieldValue(key, value)`

Set a field's value and propagate changes through the DAG.

**Returns:** `GraphPatch` — describes what changed:
```ts
interface GraphPatch {
  updatedKeys: Set<FieldKey>
  visibilityChanges: Map<FieldKey, boolean>
  requiredChanges: Map<FieldKey, boolean>
}
```

### `engine.validate()`

Validates all visible, non-layout fields against their Zod schemas.

**Returns:** `{ success: boolean; errors: Record<string, string> }`

Hidden fields and layout fields (`SECTION_BREAK`, `FIELD_GROUP`) are excluded.

### `engine.collectSubmissionValues()`

Collects values from visible, non-layout fields only. Use this to build the submission payload.

---

## FormStepper Interface

```ts
interface FormStepper {
  stepGraph: StepGraph
  getCurrentStep(): StepNodeState | null
  getVisibleSteps(): StepNodeState[]
  getCurrentIndex(): number
  canGoBack(): boolean
  isLastStep(): boolean
  goNext(): StepNodeState | null
  goBack(): StepNodeState | null
  jumpTo(index: number): void
  markComplete(stepId: string): void
  getProgress(): { current: number; total: number; percent: number }
}
```

---

## Validation Functions

### `generateZodSchema(fields)`

Generate a `z.object()` schema from field definitions.

```ts
import { generateZodSchema } from '@dmc--98/dfe-core'
const schema = generateZodSchema(visibleFields)
const result = schema.safeParse(values)
```

### `generateStepZodSchema(stepFields)`

Same as `generateZodSchema` but named for clarity when validating a single step.

### `generateStrictSubmissionSchema(fields)`

Like `generateZodSchema` but calls `.strict()` — rejects unknown keys. Use for server-side validation.

### `registerSchemaBuilder(fieldType, builder)`

Register a custom Zod schema builder for a field type.

```ts
registerSchemaBuilder('COLOR', (field) => z.string().regex(/^#[0-9a-f]{6}$/i))
```

---

## Low-Level DAG Functions

### `buildFormGraph(fields, hydrationData?)`

Build the dependency graph from a flat field array.

**Returns:** `FormGraph`

### `handleFieldChange(graph, key, value)`

Update a field value and propagate through dependents via BFS.

**Returns:** `GraphPatch`

### `topologicalSort(fields)`

Kahn's algorithm topological sort. Throws on circular dependencies.

### `flattenFieldTree(fields)`

Flatten nested field trees (with `children`) into a flat array.

### `collectSubmissionValues(graph)`

Collect values from visible, non-layout nodes.
