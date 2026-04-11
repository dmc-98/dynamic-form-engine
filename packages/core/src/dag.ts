import type {
  FormField, FormGraph, FormValues, FieldKey,
  FieldNodeState, GraphPatch, CompiledCondition,
} from './types'
import { compileCondition, extractReferencedKeys, computeFieldState } from './condition-compiler'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Flatten a tree of fields (with children) into a flat array.
 * Preserves all fields including nested FIELD_GROUP children.
 */
export function flattenFieldTree(fields: FormField[]): FormField[] {
  const result: FormField[] = []
  function walk(nodes: FormField[]) {
    for (const f of nodes) {
      result.push(f)
      if (f.children?.length) walk(f.children)
    }
  }
  walk(fields)
  return result
}

/**
 * Get the default value for a field based on its type and config.
 */
export function getDefaultValue(field: FormField): unknown {
  const cfg = field.config as Record<string, unknown>
  if (cfg.defaultValue !== undefined) return cfg.defaultValue
  switch (field.type) {
    case 'CHECKBOX':     return false
    case 'MULTI_SELECT': return []
    case 'NUMBER':
    case 'RATING':
    case 'SCALE':        return null
    default:             return ''
  }
}

/**
 * Extract current values from all nodes in the graph.
 */
export function getCurrentValues(graph: FormGraph): FormValues {
  const values: FormValues = {}
  for (const [key, node] of graph.nodes) {
    values[key] = node.value
  }
  return values
}

// ─── Topological Sort (Kahn's Algorithm) ─────────────────────────────────────

/**
 * Topologically sort field keys using Kahn's algorithm.
 * Ensures every dependency is processed before its dependents.
 *
 * @throws Error if a circular dependency is detected
 */
export function topologicalSort(
  fieldKeys: FieldKey[],
  dependents: Map<FieldKey, Set<FieldKey>>,
): FieldKey[] {
  const inDegree = new Map<FieldKey, number>()
  for (const key of fieldKeys) inDegree.set(key, 0)

  for (const [, deps] of dependents) {
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1)
    }
  }

  // Initialize queue with zero-degree nodes, sorted once for deterministic output
  const queue: FieldKey[] = []
  for (const [key, degree] of inDegree) {
    if (degree === 0) queue.push(key)
  }
  queue.sort()

  const order: FieldKey[] = []
  let head = 0 // Use index-based dequeue to avoid O(n) shift()

  while (head < queue.length) {
    const key = queue[head++]
    order.push(key)
    const deps = dependents.get(key) ?? new Set()
    for (const dep of deps) {
      const newDegree = (inDegree.get(dep) ?? 0) - 1
      inDegree.set(dep, newDegree)
      if (newDegree === 0) queue.push(dep)
    }
    // No re-sort needed: order among peers at the same level doesn't affect correctness
  }

  if (order.length !== fieldKeys.length) {
    // Use Set for O(1) lookups instead of O(n) includes()
    const orderedSet = new Set(order)
    const missing = fieldKeys.filter(k => !orderedSet.has(k))
    throw new Error(
      `FormGraph: circular condition dependency detected in fields: ${missing.join(', ')}`,
    )
  }

  return order
}

// ─── Graph Construction ──────────────────────────────────────────────────────

/**
 * Build the form dependency graph from a flat field list.
 * Runs in O(V + E) where V = fields, E = condition references + parent-child edges.
 *
 * @param fields - Flat array of fields (call flattenFieldTree first if needed)
 * @param hydrationData - Pre-existing values to hydrate (e.g., from a saved draft)
 */
export function buildFormGraph(
  fields: FormField[],
  hydrationData?: FormValues,
): FormGraph {
  const nodes = new Map<FieldKey, FieldNodeState>()
  const dependents = new Map<FieldKey, Set<FieldKey>>()
  const compiledConditions = new Map<FieldKey, CompiledCondition>()

  // Step 1: Initialize nodes
  for (const field of fields) {
    nodes.set(field.key, {
      field,
      value: hydrationData?.[field.key] ?? getDefaultValue(field),
      isVisible: true,
      isRequired: field.required,
      isDirty: hydrationData?.[field.key] !== undefined,
      validationError: null,
    })
    dependents.set(field.key, new Set())
  }

  // Step 2: Build adjacency list
  for (const field of fields) {
    // Condition-based dependencies
    if (field.conditions) {
      const refKeys = extractReferencedKeys(field.conditions)
      for (const refKey of refKeys) {
        if (dependents.has(refKey)) {
          dependents.get(refKey)!.add(field.key)
        }
      }
      compiledConditions.set(field.key, compileCondition(field.conditions))
    }

    // Parent→child inheritance edges
    if (field.parentFieldId) {
      const parentField = fields.find(f => f.id === field.parentFieldId)
      if (parentField && dependents.has(parentField.key)) {
        dependents.get(parentField.key)!.add(field.key)
      }
    }
  }

  // Step 3: Topological sort
  const allKeys = fields.map(f => f.key)
  const topoOrder = topologicalSort(allKeys, dependents)

  // Build fieldId → fieldKey lookup for O(1) parent resolution
  const fieldIdToKey = new Map<string, FieldKey>()
  for (const field of fields) {
    fieldIdToKey.set(field.id, field.key)
  }

  const graph: FormGraph = { nodes, dependents, topoOrder, compiledConditions, fieldIdToKey }

  // Step 4: Initial evaluation pass
  const initialValues: FormValues = {}
  for (const [k, n] of nodes) {
    initialValues[k] = n.value
  }

  for (const key of topoOrder) {
    const node = nodes.get(key)!
    const parentKey = node.field.parentFieldId
      ? fieldIdToKey.get(node.field.parentFieldId) ?? null
      : null
    const parentVisible = parentKey ? (nodes.get(parentKey)?.isVisible ?? true) : true

    const { isVisible, isRequired } = computeFieldState(
      node.field.conditions,
      node.field.required,
      initialValues,
      parentVisible,
    )
    node.isVisible = isVisible
    node.isRequired = isRequired
  }

  return graph
}

// ─── Change Propagation ──────────────────────────────────────────────────────

/**
 * Update a field value and propagate changes through the dependency graph.
 * Only traverses the affected subgraph — O(k) where k = affected nodes, not O(n).
 *
 * @returns A GraphPatch describing what changed
 */
export function handleFieldChange(
  graph: FormGraph,
  changedKey: FieldKey,
  newValue: unknown,
): GraphPatch {
  const patch: GraphPatch = {
    updatedKeys: new Set(),
    visibilityChanges: new Map(),
    requiredChanges: new Map(),
  }

  const changedNode = graph.nodes.get(changedKey)
  if (!changedNode) return patch

  // Step 1: Update changed node
  changedNode.value = newValue
  changedNode.isDirty = true
  patch.updatedKeys.add(changedKey)

  // Step 2: BFS to find affected subgraph
  const affected = new Set<FieldKey>()
  const queue: FieldKey[] = [changedKey]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const dep of graph.dependents.get(current) ?? new Set()) {
      if (!affected.has(dep)) {
        affected.add(dep)
        queue.push(dep)
      }
    }
  }

  if (affected.size === 0) return patch

  // Step 3: Re-evaluate affected nodes in topological order
  const currentValues = getCurrentValues(graph)

  for (const key of graph.topoOrder) {
    if (!affected.has(key)) continue

    const node = graph.nodes.get(key)!
    const parentKey = node.field.parentFieldId
      ? graph.fieldIdToKey.get(node.field.parentFieldId) ?? null
      : null
    const parentVisible = parentKey ? (graph.nodes.get(parentKey)?.isVisible ?? true) : true

    const prevVisible = node.isVisible
    const prevRequired = node.isRequired

    const { isVisible, isRequired } = computeFieldState(
      node.field.conditions,
      node.field.required,
      currentValues,
      parentVisible,
    )

    node.isVisible = isVisible
    node.isRequired = isRequired
    patch.updatedKeys.add(key)

    if (prevVisible !== isVisible) {
      patch.visibilityChanges.set(key, isVisible)
      // Reset value when field becomes hidden (prevents ghost data)
      if (!isVisible) {
        node.value = getDefaultValue(node.field)
        currentValues[key] = node.value
        node.isDirty = false
      }
    }

    if (prevRequired !== isRequired) {
      patch.requiredChanges.set(key, isRequired)
    }
  }

  return patch
}

/**
 * Collect all visible field values for form submission.
 * Hidden fields and layout fields (SECTION_BREAK, FIELD_GROUP) are excluded.
 */
export function collectSubmissionValues(graph: FormGraph): FormValues {
  const values: FormValues = {}
  const layoutTypes = new Set<string>(['SECTION_BREAK', 'FIELD_GROUP'])

  for (const [key, node] of graph.nodes) {
    if (!node.isVisible) continue
    if (layoutTypes.has(node.field.type)) continue
    values[key] = node.value
  }
  return values
}
