# Getting Started

If you want the most supported adoption path instead of mixing packages yourself, start with [Supported Stack](/guide/supported-stack).

## Installation

Install the packages you need:

::: code-group

```bash [npm]
# Core engine (required)
npm install @dmc-98/dfe-core zod

# React bindings
npm install @dmc-98/dfe-react

# Backend (pick your ORM)
npm install @dmc-98/dfe-server @dmc-98/dfe-express
npm install @dmc-98/dfe-prisma    # if using Prisma
npm install @dmc-98/dfe-drizzle   # if using Drizzle
```

```bash [pnpm]
pnpm add @dmc-98/dfe-core zod
pnpm add @dmc-98/dfe-react
pnpm add @dmc-98/dfe-server @dmc-98/dfe-express
pnpm add @dmc-98/dfe-prisma
```

```bash [yarn]
yarn add @dmc-98/dfe-core zod
yarn add @dmc-98/dfe-react
yarn add @dmc-98/dfe-server @dmc-98/dfe-express
yarn add @dmc-98/dfe-prisma
```

:::

Or use the CLI to scaffold everything:

```bash
npx dfe init --prisma --express
npx dfe add prisma-schema
npx dfe add be-utils
npx dfe add fe-hooks
npx dfe migrate plan --adapter prisma
npx dfe migrate generate --adapter prisma
npx dfe migrate doctor --adapter prisma --database-url "$DATABASE_URL"
npx prisma migrate dev --schema prisma/schema.prisma --name add_dfe_tables
```

Use `--adapter drizzle` instead if your project is using Drizzle. The migrate helper detects the project layout, scaffolds the DFE schema entrypoint it needs, points you back to the native ORM migration command, and can optionally verify the live PostgreSQL tables and columns through `DATABASE_URL`.

## Minimal Example (Core Only)

The engine works without any framework:

```ts
import { createFormEngine } from '@dmc-98/dfe-core'

const fields = [
  {
    id: '1', versionId: 'v1', key: 'name',
    label: 'Name', type: 'SHORT_TEXT',
    required: true, order: 1, config: {},
  },
  {
    id: '2', versionId: 'v1', key: 'role',
    label: 'Role', type: 'SELECT',
    required: true, order: 2,
    config: {
      mode: 'static',
      options: [
        { label: 'Engineer', value: 'engineer' },
        { label: 'Manager', value: 'manager' },
      ],
    },
  },
  {
    id: '3', versionId: 'v1', key: 'team_size',
    label: 'Team Size', type: 'NUMBER',
    required: false, order: 3,
    config: {},
    conditions: {
      action: 'SHOW',
      operator: 'and',
      rules: [{ fieldKey: 'role', operator: 'eq', value: 'manager' }],
    },
  },
]

const engine = createFormEngine(fields)

// Initially, "team_size" is hidden
console.log(engine.getVisibleFields().map(f => f.key))
// → ['name', 'role']

// Setting role to "manager" reveals team_size
engine.setFieldValue('role', 'manager')
console.log(engine.getVisibleFields().map(f => f.key))
// → ['name', 'role', 'team_size']

// Validate
engine.setFieldValue('name', 'Alice')
const result = engine.validate()
console.log(result.success) // true
```

## React Example

```tsx
import { useFormEngine } from '@dmc-98/dfe-react'

function MyForm({ fields }) {
  const { values, setFieldValue, visibleFields, validate } = useFormEngine({
    fields,
  })

  const handleSubmit = () => {
    const { success, errors } = validate()
    if (success) {
      console.log('Submit:', values)
    } else {
      console.log('Errors:', errors)
    }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit() }}>
      {visibleFields.map(field => (
        <div key={field.key}>
          <label>{field.label}</label>
          <input
            value={(values[field.key] as string) ?? ''}
            onChange={e => setFieldValue(field.key, e.target.value)}
          />
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Full-Stack Example

See the [Examples](/guide/examples) page for the canonical React + Express + Prisma example. It includes Prisma migrations, Docker assets, and Playwright browser verification via `pnpm test:e2e:example`.

## Next Steps

- [Choose Your Package](/guide/choose-your-package) — pick the right lane before mixing packages
- [Production Checklist](/guide/production-checklist) — sanity-check deployment, migrations, and release gates
- [Field Types](/guide/field-types) — all supported input types
- [DAG & Dependencies](/guide/dag) — how the dependency graph works
- [Conditional Logic](/guide/conditions) — SHOW, HIDE, REQUIRE, DISABLE
- [Multi-Step Forms](/guide/multi-step) — step navigation and API contracts
