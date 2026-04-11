# Conditional Logic

Fields can have conditions that control their visibility, required state, or disabled state based on other fields' values.

## Condition Structure

```ts
interface FieldConditions {
  action: 'SHOW' | 'HIDE' | 'REQUIRE' | 'DISABLE'
  operator: 'and' | 'or'
  rules: ConditionRule[]
}

interface ConditionRule {
  fieldKey: string            // the field to watch
  operator: ConditionOperator // comparison operator
  value?: unknown             // value to compare against
}
```

## Actions

| Action | Behavior |
|--------|----------|
| `SHOW` | Field is visible when condition matches |
| `HIDE` | Field is hidden when condition matches |
| `REQUIRE` | Field becomes required when condition matches |
| `DISABLE` | Field is disabled when condition matches |

## Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal to | `{ fieldKey: 'role', operator: 'eq', value: 'admin' }` |
| `neq` | Not equal to | `{ operator: 'neq', value: 'guest' }` |
| `gt` / `gte` | Greater than / or equal | `{ operator: 'gt', value: 18 }` |
| `lt` / `lte` | Less than / or equal | `{ operator: 'lte', value: 100 }` |
| `contains` | String contains | `{ operator: 'contains', value: '@company.com' }` |
| `not_contains` | String doesn't contain | — |
| `empty` | Value is empty/null/undefined | `{ operator: 'empty' }` |
| `not_empty` | Value is not empty | `{ operator: 'not_empty' }` |
| `in` | Value is in array | `{ operator: 'in', value: ['admin', 'manager'] }` |
| `not_in` | Value is not in array | — |

## Combinators

Use `operator: 'and'` or `operator: 'or'` to combine multiple rules:

```ts
// Show only when role is "manager" AND department is "engineering"
{
  action: 'SHOW',
  operator: 'and',
  rules: [
    { fieldKey: 'role', operator: 'eq', value: 'manager' },
    { fieldKey: 'department', operator: 'eq', value: 'engineering' },
  ],
}
```

```ts
// Require when country is "US" OR country is "CA"
{
  action: 'REQUIRE',
  operator: 'or',
  rules: [
    { fieldKey: 'country', operator: 'eq', value: 'US' },
    { fieldKey: 'country', operator: 'eq', value: 'CA' },
  ],
}
```

## Full Example

```ts
const fields = [
  {
    id: '1', key: 'employment_type', type: 'SELECT',
    config: {
      mode: 'static',
      options: [
        { label: 'Full-time', value: 'full_time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Intern', value: 'intern' },
      ],
    },
    // ... other required fields
  },
  {
    id: '2', key: 'contract_end_date', type: 'DATE',
    required: false,
    conditions: {
      action: 'SHOW',
      operator: 'and',
      rules: [
        { fieldKey: 'employment_type', operator: 'eq', value: 'contract' },
      ],
    },
    // ... other required fields
  },
  {
    id: '3', key: 'salary', type: 'NUMBER',
    required: false,
    conditions: {
      action: 'REQUIRE',
      operator: 'or',
      rules: [
        { fieldKey: 'employment_type', operator: 'eq', value: 'full_time' },
        { fieldKey: 'employment_type', operator: 'eq', value: 'contract' },
      ],
    },
    // ... other required fields
  },
]
```

In this example:
- `contract_end_date` only appears when employment type is "contract"
- `salary` becomes required for both "full_time" and "contract" employees
- Interns don't see contract end date and salary is optional for them
