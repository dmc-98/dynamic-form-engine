# Quick Start

The fastest way to get a working form with DFE.

If you want the repo's most-supported production lane, see [Supported Stack](/guide/supported-stack) for the recommended React + Express + Prisma/Drizzle setup.

## 1. Install

```bash
npm install @dmc-98/dfe-core @dmc-98/dfe-react zod
```

## 2. Define Fields

```ts
// form-definition.ts
import type { FormField } from '@dmc-98/dfe-core'

export const fields: FormField[] = [
  {
    id: 'f1', versionId: 'v1', key: 'email',
    label: 'Email', type: 'EMAIL', required: true,
    order: 1, config: { placeholder: 'you@example.com' },
  },
  {
    id: 'f2', versionId: 'v1', key: 'subscribe',
    label: 'Subscribe to newsletter', type: 'CHECKBOX',
    required: false, order: 2, config: {},
  },
  {
    id: 'f3', versionId: 'v1', key: 'frequency',
    label: 'Email frequency', type: 'SELECT',
    required: true, order: 3,
    config: {
      mode: 'static',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
    },
    // Only show when "subscribe" is checked
    conditions: {
      action: 'SHOW',
      operator: 'and',
      rules: [{ fieldKey: 'subscribe', operator: 'eq', value: true }],
    },
  },
]
```

## 3. Render with React

```tsx
// SubscribeForm.tsx
import { useFormEngine } from '@dmc-98/dfe-react'
import { DfeFormRenderer } from '@dmc-98/dfe-react/components'
import { fields } from './form-definition'

export function SubscribeForm() {
  const engine = useFormEngine({ fields })

  const handleSubmit = () => {
    const { success, errors } = engine.validate()
    if (!success) return alert(JSON.stringify(errors))

    const data = engine.collectSubmissionValues()
    console.log('Submitting:', data)
    // POST to your API
  }

  return (
    <div>
      <h2>Subscribe</h2>
      <DfeFormRenderer
        fields={engine.visibleFields}
        values={engine.values}
        onFieldChange={engine.setFieldValue}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

That's it — conditional visibility, validation, and value collection in ~30 lines.

## 4. Add Your Own Components

The default renderer is unstyled. Pass `renderField` for full control:

```tsx
<DfeFormRenderer
  fields={engine.visibleFields}
  values={engine.values}
  onFieldChange={engine.setFieldValue}
  renderField={({ field, value, onChange, error }) => (
    <MyCustomInput
      label={field.label}
      value={value}
      onChange={onChange}
      error={error}
    />
  )}
/>
```

## Next: Multi-Step

Ready for more? See [Multi-Step Forms](/guide/multi-step) to add step navigation and backend persistence, or jump to [Supported Stack](/guide/supported-stack) if you want the strongest current frontend/backend package combination.
