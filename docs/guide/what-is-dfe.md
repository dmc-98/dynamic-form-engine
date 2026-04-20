# What is DFE?

**Dynamic Form Engine** (DFE) is an open-source, configuration-driven form engine that lets you define complex, multi-step forms as data — and render them in any frontend framework.

## The Problem

Building dynamic forms typically involves:

- **Hardcoded conditional logic** scattered across components
- **Tightly coupled** form rendering and business rules
- **Re-implementing** the same patterns for each new form
- **No standard way** to persist multi-step form data across API calls
- **Framework lock-in** when using form libraries

## How DFE Solves This

DFE separates form *definition* from form *rendering*:

```
┌─────────────────────────────────────────────────┐
│  Form Definition (JSON/DB)                       │
│  Fields → Steps → Conditions → API Contracts     │
└───────────────────┬─────────────────────────────┘
                    │
          ┌─────────▼──────────┐
          │   @dmc--98/dfe-core │  ← Framework-agnostic
          │   DAG • Conditions   │
          │   Validation • Steps │
          └────┬────────────┬───┘
               │            │
    ┌──────────▼──┐  ┌──────▼────────┐
    │  dfe-react   │  │  dfe-server   │
    │  Hooks + UI  │  │  Adapters     │
    └──────────────┘  └───────────────┘
```

### Key Design Decisions

**DAG-based field dependencies** — Fields form a directed acyclic graph. When a value changes, only the affected subgraph re-evaluates. This is O(k) where k is the number of dependents, not O(n) where n is total fields.

**Compiled conditions** — Condition rules are compiled to JavaScript closures at graph build time, not re-parsed on every evaluation.

**Framework-agnostic core** — `createFormEngine()` returns a plain object with methods. No React, no Vue, no framework dependency. Bind it to any UI.

**Adapter pattern for backends** — Implement `DatabaseAdapter` for your ORM. First-class adapters for Prisma and Drizzle ship out of the box.

**API Contracts for persistence** — Each step can define API contracts that map form values to backend request bodies, with cross-step context propagation (e.g., pass a generated `employeeId` from step 1 to step 2 as a foreign key).

## Who Is It For?

- **Product teams** building internal tools, onboarding flows, or admin panels
- **SaaS developers** who need configurable forms per customer
- **Enterprise apps** with complex, multi-step workflows
- **Anyone** tired of re-building conditional form logic from scratch

## License

MIT — free for commercial use.
