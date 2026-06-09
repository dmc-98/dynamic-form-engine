import type { FormStep, StepBranch } from './types'

// ─── Flow Model ───────────────────────────────────────────────────────────────
// A pure, renderer-agnostic graph model of a multi-step form's flow: nodes are
// steps, edges are either the natural sequential progression or conditional
// branches. The visual flow builder (and any diagram renderer) is a thin view
// over this verified data — keeping the logic testable without a DOM.

export interface FlowNode {
  id: string
  title: string
  order: number
  /** True when the step has skip conditions (can be bypassed). */
  skippable: boolean
  /** True when the step is a review/summary step. */
  isReview: boolean
}

export type FlowEdgeKind = 'sequential' | 'branch'

export interface FlowEdge {
  from: string
  to: string
  kind: FlowEdgeKind
  /** Human-readable condition label for branch edges. */
  label?: string
  /** True when a branch targets a step id that doesn't exist. */
  dangling?: boolean
}

export interface FlowModel {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

/** Render a FieldConditions object into a short "key op value" label. */
function labelForBranch(branch: StepBranch): string {
  const rule = branch.condition?.rules?.[0]
  if (!rule) return 'when condition met'
  return `${rule.fieldKey} ${rule.operator} ${String(rule.value)}`
}

/**
 * Build a flow model (nodes + edges) from a form's steps.
 *
 * Edges:
 * - `sequential`: each step → the next step by order (the default path).
 * - `branch`: each declared `StepBranch` → its target (labelled by condition;
 *   flagged `dangling` if the target step id doesn't exist).
 *
 * @example
 * ```ts
 * const { nodes, edges } = buildFlowModel(form.steps)
 * ```
 */
export function buildFlowModel(steps: FormStep[]): FlowModel {
  // Sort by order; break ties on id so adjacency is deterministic.
  const ordered = [...steps].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  const ids = new Set(ordered.map(s => s.id))

  const nodes: FlowNode[] = ordered.map(s => ({
    id: s.id,
    title: s.title,
    order: s.order,
    skippable: s.conditions != null,
    isReview: s.config?.review != null,
  }))

  const edges: FlowEdge[] = []

  // Sequential progression.
  for (let i = 0; i < ordered.length - 1; i++) {
    edges.push({ from: ordered[i].id, to: ordered[i + 1].id, kind: 'sequential' })
  }

  // Conditional branches.
  for (const step of ordered) {
    for (const branch of step.branches ?? []) {
      edges.push({
        from: step.id,
        to: branch.targetStepId,
        kind: 'branch',
        label: labelForBranch(branch),
        dangling: !ids.has(branch.targetStepId),
      })
    }
  }

  return { nodes, edges }
}
