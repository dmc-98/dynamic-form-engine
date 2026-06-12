/**
 * Maps the shared benchmark scenario to react-jsonschema-form's idiom:
 * the same "field N visible when field N-1 non-empty" chains expressed as
 * JSON Schema allOf/if/then dependencies — the standard rjsf approach to
 * conditional visibility. Comparison fairness notes:
 * - identical logical workload (same chains, same op sequence)
 * - rjsf re-validates with ajv on change because that's how rjsf works in
 *   production; we measure the framework as users experience it, not a
 *   crippled configuration.
 */
export interface RjsfScenario {
  fieldCount: number
  chainDepth: number
}

export function makeRjsfSchema({ fieldCount, chainDepth }: RjsfScenario): {
  schema: Record<string, unknown>
  conditionalCount: number
} {
  if (!Number.isInteger(fieldCount) || fieldCount < 1) throw new Error(`fieldCount must be a positive integer, got ${fieldCount}`)
  if (!Number.isInteger(chainDepth) || chainDepth < 1) throw new Error(`chainDepth must be a positive integer, got ${chainDepth}`)

  const baseProperties: Record<string, unknown> = {}
  const dependencies: Record<string, unknown> = {}
  let conditionalCount = 0

  for (let i = 0; i < fieldCount; i += 1) {
    const key = `bench_${i}`
    const isChainHead = i % chainDepth === 0
    if (isChainHead) {
      baseProperties[key] = { type: 'string', title: `Benchmark field ${i}` }
    }
    // Chain link: when bench_i is present in formData, bench_{i+1} appears —
    // rjsf's classic schema-dependencies idiom for conditional fields.
    const isLastInChain = (i + 1) % chainDepth === 0 || i + 1 >= fieldCount
    if (!isLastInChain) {
      dependencies[key] = {
        properties: { [`bench_${i + 1}`]: { type: 'string', title: `Benchmark field ${i + 1}` } },
      }
      conditionalCount += 1
    }
  }

  return {
    schema: { type: 'object', properties: baseProperties, dependencies },
    conditionalCount,
  }
}
