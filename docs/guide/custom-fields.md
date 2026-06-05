# Custom Field Types

DFE ships with 21 built-in field types but you can add your own.

## Register a Schema Builder

Use `registerSchemaBuilder()` to add Zod validation for a custom type:

```ts
import { registerSchemaBuilder } from '@dmc--98/dfe-core'
import { z } from 'zod'

registerSchemaBuilder('COLOR_PICKER', (field) =>
  z.string().regex(/^#[0-9a-f]{6}$/i, 'Must be a hex color')
)

registerSchemaBuilder('CURRENCY', (field) =>
  z.number().min(0, 'Must be positive').multipleOf(0.01, 'Max 2 decimal places')
)

registerSchemaBuilder('JSON_EDITOR', (field) =>
  z.string().refine(
    (val) => { try { JSON.parse(val); return true } catch { return false } },
    'Must be valid JSON',
  )
)
```

## Use in Field Definitions

```ts
const fields = [
  {
    id: '1', versionId: 'v1', key: 'brand_color',
    label: 'Brand Color', type: 'COLOR_PICKER',
    required: true, order: 1, config: {},
  },
]

const engine = createFormEngine(fields)
engine.setFieldValue('brand_color', '#6366f1')
engine.validate() // success: true
```

## Render Custom Fields

When using `@dmc--98/dfe-react`, handle your custom type in the field renderer:

```tsx
<DfeFormRenderer
  fields={engine.visibleFields}
  values={engine.values}
  onFieldChange={engine.setFieldValue}
  renderField={({ field, value, onChange, error }) => {
    if (field.type === 'COLOR_PICKER') {
      return (
        <div>
          <label>{field.label}</label>
          <input
            type="color"
            value={(value as string) ?? '#000000'}
            onChange={e => onChange(e.target.value)}
          />
          {error && <span>{error}</span>}
        </div>
      )
    }
    // Fall back to default for built-in types
    return <DefaultFieldRenderer field={field} value={value} onChange={onChange} error={error} />
  }}
/>
```
