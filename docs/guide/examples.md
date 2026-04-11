# Examples

## Fullstack Example (Express + Prisma + React)

The repository includes a canonical example at `examples/fullstack/`.

As of March 12, 2026, this example is runnable from a clean checkout for local development and is now browser-verified. It includes Prisma schema and migrations, Dockerfiles, root build/typecheck coverage, and Playwright E2E wired into CI.

### Architecture

```
┌──────────────┐     ┌───────────────┐     ┌───────────────┐
│  React App   │────▶│  Express API  │────▶│  PostgreSQL   │
│  (dfe-react) │     │ (dfe-express) │     │  (dfe-prisma) │
└──────────────┘     └───────────────┘     └───────────────┘
```

### Current Status

- React and Express example source code exists and compiles from the root workspace.
- Prisma schema, initial migration, and seed data for the Employee Onboarding flow are included.
- Dockerfiles and `docker-compose.yml` are included for local PostgreSQL + app bring-up.
- Playwright browser E2E covers the happy-path onboarding flow and verifies persisted completion state.
- CI boots Postgres and runs the example browser flow as a dedicated smoke job.
- The same web app also exposes a browser-verified `/playground` route for config authoring and review-first AI draft fill.

If you want the strongest path today, start with [Supported Stack](/guide/supported-stack) and use this folder as the canonical browser-verified example stack.

### Playground Route

The example web app also includes a dedicated Playground route:

```bash
pnpm --dir examples/fullstack/api dev
pnpm --dir examples/fullstack/web dev
```

Then open `http://localhost:5173/playground`.

To verify it in browser automation:

```bash
pnpm test:e2e:playground
```

### What the Reference Includes

The seed script creates an **Employee Onboarding** form with:

- **Step 1: Personal Info** — first name, last name, email, phone
- **Step 2: Job Details** — department (SELECT), role, start date, equipment checkbox with conditional notes textarea
- **Step 3: Review & Submit** — summary step

Key features demonstrated:
- Conditional field visibility (equipment notes appear only when checkbox is checked)
- Per-step validation
- API contracts that create Employee and JobAssignment records
- Context propagation (employeeId from step 1 used as FK in step 2)

## Minimal Examples

### Conditional Visibility

```ts
import { createFormEngine } from '@dmc-98/dfe-core'

const engine = createFormEngine([
  { id: '1', key: 'has_pet', type: 'CHECKBOX', label: 'Do you have a pet?',
    required: false, order: 1, versionId: 'v1', config: {} },
  { id: '2', key: 'pet_name', type: 'SHORT_TEXT', label: 'Pet name',
    required: true, order: 2, versionId: 'v1', config: {},
    conditions: {
      action: 'SHOW', operator: 'and',
      rules: [{ fieldKey: 'has_pet', operator: 'eq', value: true }],
    },
  },
])

engine.setFieldValue('has_pet', true)
// pet_name is now visible and required
```

### Dynamic Required State

```ts
const fields = [
  { id: '1', key: 'country', type: 'SELECT', label: 'Country',
    required: true, order: 1, versionId: 'v1',
    config: { mode: 'static', options: [
      { label: 'US', value: 'US' },
      { label: 'UK', value: 'UK' },
    ]}},
  { id: '2', key: 'state', type: 'SHORT_TEXT', label: 'State',
    required: false, order: 2, versionId: 'v1', config: {},
    conditions: {
      action: 'REQUIRE', operator: 'and',
      rules: [{ fieldKey: 'country', operator: 'eq', value: 'US' }],
    },
  },
]

const engine = createFormEngine(fields)
engine.setFieldValue('country', 'US')
// "state" is now required
engine.validate() // fails if state is empty
```

### Custom Field Type

```ts
import { createFormEngine, registerSchemaBuilder } from '@dmc-98/dfe-core'
import { z } from 'zod'

registerSchemaBuilder('IP_ADDRESS', () =>
  z.string().regex(
    /^(\d{1,3}\.){3}\d{1,3}$/,
    'Must be a valid IPv4 address'
  )
)

const engine = createFormEngine([
  { id: '1', key: 'server_ip', type: 'IP_ADDRESS', label: 'Server IP',
    required: true, order: 1, versionId: 'v1', config: {} },
])

engine.setFieldValue('server_ip', '192.168.1.1')
engine.validate() // success: true
```
