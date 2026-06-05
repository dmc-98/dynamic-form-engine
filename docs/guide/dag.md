# DAG & Dependencies

The Dynamic Form Engine uses a **Directed Acyclic Graph (DAG)** to model field dependencies. This is the key architectural decision that makes DFE efficient for large forms.

## How It Works

When you call `createFormEngine(fields)`, the engine:

1. **Flattens** nested field trees into a flat list
2. **Extracts** dependency edges from condition rules
3. **Topologically sorts** fields using Kahn's algorithm
4. **Compiles** conditions into closures
5. **Evaluates** initial visibility/required states

```
              ┌─────────┐
              │  role    │
              └────┬─────┘
                   │ depends on
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐    ┌─────▼──────┐
    │ team_size│    │ admin_panel│
    └──────────┘    └────────────┘
```

When `role` changes:

1. Engine finds all dependents of `role` via the adjacency list
2. BFS traverses the subgraph: `team_size`, `admin_panel`
3. Re-evaluates only those fields' conditions
4. Returns a `GraphPatch` with exactly which fields changed

## GraphPatch

Every call to `setFieldValue()` returns a `GraphPatch`:

```ts
interface GraphPatch {
  updatedKeys: Set<string>           // all fields that were touched
  visibilityChanges: Map<string, boolean>  // key → new visibility
  requiredChanges: Map<string, boolean>    // key → new required state
}
```

Use this to optimize UI re-renders — only update components for changed fields.

## Performance

| Approach | Cost per change |
|----------|----------------|
| Brute force (re-evaluate all) | O(n) |
| DFE DAG propagation | O(k) where k = dependents |

For a 200-field form where a change affects 3 fields, DFE does ~3 evaluations instead of ~200.

## Ghost Data Reset

When a field becomes hidden, its value is reset to the default. This prevents "ghost data" from being submitted — values that were entered when a field was visible but should be excluded now that it's hidden.

```ts
engine.setFieldValue('role', 'manager')
engine.setFieldValue('team_size', 15)

engine.setFieldValue('role', 'engineer')
// team_size is now hidden and reset to default (undefined)
console.log(engine.getValues().team_size) // undefined
```

## Circular Dependency Detection

The topological sort detects cycles at build time:

```ts
// This will throw: "Circular dependency detected"
const fields = [
  { key: 'a', conditions: { rules: [{ fieldKey: 'b', ... }] } },
  { key: 'b', conditions: { rules: [{ fieldKey: 'a', ... }] } },
]
createFormEngine(fields) // throws!
```
