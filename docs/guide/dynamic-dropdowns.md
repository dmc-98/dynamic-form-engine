# Dynamic Dropdowns

DFE supports API-backed SELECT fields with cursor-based pagination, search, and cascading filters.

## Server-Side Setup

Dynamic options are stored in the `DfeFieldOption` table and served via the `/api/dfe/fields/:fieldId/options` endpoint. This is handled automatically by `@dmc--98/dfe-express`.

## Field Configuration

```ts
{
  id: 'dept', key: 'department', type: 'SELECT',
  label: 'Department', required: true,
  config: {
    mode: 'dynamic',
    dataSource: {
      endpoint: '/api/dfe/fields/dept-field-id/options',
      cursorParam: 'cursor',
      pageSize: 20,
      searchParam: 'q',
      labelKey: 'label',
      valueKey: 'value',
    },
  },
}
```

## React Hook

Use `useDynamicOptions` for loading options:

```tsx
import { useDynamicOptions } from '@dmc--98/dfe-react'

function DepartmentSelect({ field, value, onChange }) {
  const { options, isLoading, hasMore, loadMore, search, error } = useDynamicOptions({
    endpoint: field.config.dataSource.endpoint,
    pageSize: field.config.dataSource.pageSize,
  })

  return (
    <div>
      <label>{field.label}</label>
      <input
        placeholder="Search departments..."
        onChange={e => search(e.target.value)}
      />
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hasMore && <button onClick={loadMore} disabled={isLoading}>Load more</button>}
      {error && <span>{error}</span>}
    </div>
  )
}
```

## Cascading (Dependent) Dropdowns

A field's options can depend on another field's value:

```ts
// Country field
{
  id: 'country', key: 'country', type: 'SELECT',
  config: {
    mode: 'dynamic',
    dataSource: {
      endpoint: '/api/dfe/fields/country-field/options',
      cursorParam: 'cursor', pageSize: 50,
      labelKey: 'label', valueKey: 'value',
    },
  },
}

// City field — depends on country
{
  id: 'city', key: 'city', type: 'SELECT',
  config: {
    mode: 'dynamic',
    dataSource: {
      endpoint: '/api/dfe/fields/city-field/options',
      cursorParam: 'cursor', pageSize: 50,
      labelKey: 'label', valueKey: 'value',
      dependsOnField: 'country',
      dependsOnParam: 'countryId',
    },
  },
}
```

With the React hook:

```tsx
const countryValue = engine.values.country

const cityOptions = useDynamicOptions({
  endpoint: '/api/dfe/fields/city-field/options',
  dependsOnValue: countryValue,
  dependsOnParam: 'countryId',
  enabled: !!countryValue, // only fetch when country is selected
})
```

When `countryValue` changes, the hook automatically resets and re-fetches options with the new filter parameter.
