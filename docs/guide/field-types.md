# Field Types

DFE supports 21 built-in field types. Each type has a specific Zod validation schema and optional configuration.

## Text Fields

| Type | Description | Config |
|------|-------------|--------|
| `SHORT_TEXT` | Single-line text input | `minLength`, `maxLength`, `pattern`, `placeholder` |
| `LONG_TEXT` | Multi-line textarea | `minLength`, `maxLength`, `placeholder` |
| `EMAIL` | Email with format validation | `placeholder` |
| `PHONE` | Phone number | `placeholder` |
| `URL` | URL with format validation | `placeholder` |
| `PASSWORD` | Masked password input | `placeholder` |
| `HIDDEN` | Hidden field (not rendered) | `defaultValue` |

## Numeric Fields

| Type | Description | Config |
|------|-------------|--------|
| `NUMBER` | Numeric input | `min`, `max`, `step`, `format` (`integer`, `decimal`, `currency`, `percentage`), `prefix`, `suffix` |
| `RATING` | Star rating (1-N) | `max` (default: 5), `labels` |
| `SCALE` | Likert scale | `min`, `max`, `minLabel`, `maxLabel` |

## Date/Time Fields

| Type | Description | Config |
|------|-------------|--------|
| `DATE` | Date picker | — |
| `TIME` | Time picker | — |
| `DATE_TIME` | Date + time | — |
| `DATE_RANGE` | Start/end date pair | — |

## Selection Fields

| Type | Description | Config |
|------|-------------|--------|
| `SELECT` | Single-select dropdown | `mode` (`static` or `dynamic`), `options`, `dataSource`, `allowOther` |
| `MULTI_SELECT` | Multi-select | Same as SELECT |
| `RADIO` | Radio button group | Same as SELECT |
| `CHECKBOX` | Boolean checkbox | — |

### Static Options

```ts
{
  type: 'SELECT',
  config: {
    mode: 'static',
    options: [
      { label: 'Engineering', value: 'eng' },
      { label: 'Design', value: 'design' },
    ],
  },
}
```

### Dynamic Options (API-backed)

```ts
{
  type: 'SELECT',
  config: {
    mode: 'dynamic',
    dataSource: {
      endpoint: '/api/dfe/fields/dept-field/options',
      cursorParam: 'cursor',
      pageSize: 20,
      searchParam: 'q',
      labelKey: 'name',
      valueKey: 'id',
      // Cascading: re-fetch when "country" changes
      dependsOnField: 'country',
      dependsOnParam: 'countryId',
    },
  },
}
```

## File Upload

| Type | Description | Config |
|------|-------------|--------|
| `FILE_UPLOAD` | File upload (single or multi) | `maxSizeMB`, `allowedMimeTypes`, `maxFiles` |

## Layout Fields

| Type | Description | Config |
|------|-------------|--------|
| `SECTION_BREAK` | Visual separator/header | — |
| `FIELD_GROUP` | Collapsible group container | `collapsible`, `defaultExpanded` |

Layout fields are excluded from validation and submission values.

## Custom Field Types

Register custom Zod schemas for your own field types:

```ts
import { registerSchemaBuilder } from '@dmc--98/dfe-core'
import { z } from 'zod'

registerSchemaBuilder('COLOR_PICKER', (field) =>
  z.string().regex(/^#[0-9a-f]{6}$/i, 'Must be a valid hex color')
)
```
