# @dmc--98/dfe-core

The zero-dependency core engine. Everything else is built on top of this.

## Install

```bash
npm install @dmc--98/dfe-core zod
```

`zod` is a peer dependency — you must install it alongside.

## What's Inside

| Module | Description |
|--------|-------------|
| `createFormEngine()` | Factory that builds a DAG-backed form engine |
| `createFormStepper()` | Factory for multi-step navigation |
| `generateZodSchema()` | Dynamic Zod schema from field definitions |
| `registerSchemaBuilder()` | Add custom field type validation |
| `buildFormGraph()` | Low-level DAG construction |
| `handleFieldChange()` | Low-level change propagation |
| `buildStepGraph()` | Low-level step graph construction |
| All TypeScript types | `FormField`, `FormStep`, `StepApiContract`, etc. |

## Quick Usage

```ts
import { createFormEngine, createFormStepper } from '@dmc--98/dfe-core'

// Engine: field management + validation
const engine = createFormEngine(fields, initialData)
engine.setFieldValue('role', 'admin')
const { success, errors } = engine.validate()

// Stepper: multi-step navigation
const stepper = createFormStepper(steps, engine)
stepper.goNext()
```

## API

### `createFormEngine(fields, hydrationData?)`

Returns a `FormEngine` object with these methods:

| Method | Return | Description |
|--------|--------|-------------|
| `setFieldValue(key, value)` | `GraphPatch` | Set a value and propagate changes |
| `getValues()` | `FormValues` | Get all current values |
| `getVisibleFields()` | `FormField[]` | Get visible fields sorted by order |
| `getFieldState(key)` | `FieldNodeState \| undefined` | Get a single field's state |
| `validate()` | `{ success, errors }` | Validate all visible required fields |
| `validateStep(stepId)` | `{ success, errors }` | Validate one step's fields |
| `collectSubmissionValues()` | `FormValues` | Get values excluding hidden/layout |
| `graph` | `FormGraph` | The underlying dependency graph |

### `createFormStepper(steps, engine, initialIndex?)`

Returns a `FormStepper` object:

| Method | Return | Description |
|--------|--------|-------------|
| `getCurrentStep()` | `StepNodeState \| null` | Current step |
| `getVisibleSteps()` | `StepNodeState[]` | Steps not skipped |
| `getCurrentIndex()` | `number` | Zero-based index |
| `canGoBack()` | `boolean` | Whether back is possible |
| `isLastStep()` | `boolean` | Whether current is last |
| `goNext()` | `StepNodeState \| null` | Advance to next |
| `goBack()` | `StepNodeState \| null` | Go to previous |
| `jumpTo(index)` | `void` | Jump to specific step |
| `markComplete(stepId)` | `void` | Mark step as done |
| `getProgress()` | `{ current, total, percent }` | Progress info |

### `registerSchemaBuilder(fieldType, builder)`

Register a custom Zod schema for a field type:

```ts
registerSchemaBuilder('COLOR', (field) => z.string().regex(/^#[0-9a-f]{6}$/i))
```

### `generateZodSchema(fields)`

Generate a Zod object schema from an array of fields. Used internally by `validate()` but available for standalone use.


---

## Links

- Source: [packages/core](https://github.com/dmc-98/dynamic-form-engine/tree/main/packages/core)
- Docs source: [docs/packages/core.md](https://github.com/dmc-98/dynamic-form-engine/blob/main/docs/packages/core.md)
- Issues: [https://github.com/dmc-98/dynamic-form-engine/issues](https://github.com/dmc-98/dynamic-form-engine/issues)
