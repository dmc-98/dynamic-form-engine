import type { FormField } from '@dmc--98/dfe-core'

export interface BenchmarkScenario {
  /** Total number of fields in the generated form. */
  fieldCount: number
  /**
   * Length of each visibility chain. Field N in a chain is shown only when
   * field N-1 is non-empty, so a single keystroke at a chain head can
   * cascade visibility recomputation down the chain — the worst case for
   * dependency propagation.
   */
  chainDepth: number
}

/**
 * Deterministic worst-case form generator shared by every benchmark lane
 * (DFE engine, DFE React, and competitor adapters), so all engines are
 * measured against the same logical workload.
 */
export function makeBenchmarkForm({ fieldCount, chainDepth }: BenchmarkScenario): FormField[] {
  if (!Number.isInteger(fieldCount) || fieldCount < 1) throw new Error(`fieldCount must be a positive integer, got ${fieldCount}`)
  if (!Number.isInteger(chainDepth) || chainDepth < 1) throw new Error(`chainDepth must be a positive integer, got ${chainDepth}`)

  const fields: FormField[] = []
  for (let i = 0; i < fieldCount; i += 1) {
    const isChainHead = i % chainDepth === 0
    const field = {
      id: `bench_${i}`,
      key: `bench_${i}`,
      label: `Benchmark field ${i} *`,
      type: 'SHORT_TEXT',
      order: i,
      required: false,
      config: { placeholder: `value ${i}` },
    } as unknown as FormField
    if (!isChainHead) {
      ;(field as { conditions?: unknown }).conditions = {
        action: 'SHOW',
        operator: 'and',
        rules: [{ fieldKey: `bench_${i - 1}`, operator: 'not_empty', value: '' }],
      }
    }
    fields.push(field)
  }
  return fields
}
