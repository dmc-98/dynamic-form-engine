/**
 * rjsf comparison lane — identical logical workload and measurement
 * methodology to dom-entry.tsx (flushSync: input → settled DOM), with the
 * scenario expressed in rjsf's native JSON Schema if/then idiom.
 */
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { makeRjsfSchema } from './rjsf-schema'

declare global {
  interface Window {
    __BENCH_RESULTS?: unknown
    __BENCH_ERROR?: string
  }
}

// Scenario via query string: ?fields=500&depth=25 (defaults 100/10)
const __params = new URLSearchParams(window.location.search)
const FIELD_COUNT = Number(__params.get('fields') ?? 100)
const CHAIN_DEPTH = Number(__params.get('depth') ?? 10)
const WARMUP_OPS = 30
const OPS = 250

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

const { schema } = makeRjsfSchema({ fieldCount: FIELD_COUNT, chainDepth: CHAIN_DEPTH })

function BenchApp() {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const dataRef = useRef(formData)
  dataRef.current = formData

  useEffect(() => {
    // flushSync is a no-op when called from the commit phase (useEffect);
    // drive the bench from a macrotask so commits are truly synchronous.
    const timer = setTimeout(() => {
    try {
      // Warmup
      for (let i = 0; i < WARMUP_OPS; i += 1) {
        const key = `bench_${(i * 7) % FIELD_COUNT}`
        flushSync(() => setFormData({ ...dataRef.current, [key]: `w${i}` }))
      }
      // Measured ops — same sequence as the DFE lane.
      const commit: number[] = []
      for (let op = 0; op < OPS; op += 1) {
        const key = `bench_${(op * 7) % FIELD_COUNT}`
        const value = op % 3 === 2 ? '' : `v${op}`
        const next = { ...dataRef.current }
        if (value === '') delete next[key]
        else next[key] = value
        const t0 = performance.now()
        flushSync(() => setFormData(next))
        commit.push(performance.now() - t0)
      }
      commit.sort((a, b) => a - b)
      // Workload validity probe: conditional fields must actually appear.
      const inputsRendered = document.querySelectorAll('input').length
      ;(window as any).__DBG = { dataKeys: Object.keys(dataRef.current).length, sample: Object.keys(dataRef.current).slice(0, 5) }
      window.__BENCH_RESULTS = {
        scenario: `${FIELD_COUNT} fields / chain depth ${CHAIN_DEPTH} (rjsf schema-dependencies)`,
        inputsRendered,
        chainHeads: FIELD_COUNT / CHAIN_DEPTH,
        workloadValid: inputsRendered > FIELD_COUNT / CHAIN_DEPTH,
        domCommit: {
          ops: OPS,
          p50: percentile(commit, 50),
          p95: percentile(commit, 95),
          p99: percentile(commit, 99),
          max: commit[commit.length - 1],
          note: 'input → settled DOM (flushSync), ajv8 validator — rjsf production configuration',
        },
      }
    } catch (error) {
      window.__BENCH_ERROR = (error as Error).message
    }
    }, 50)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Form
      schema={schema as never}
      validator={validator}
      formData={formData}
      // The bench driver owns formData; echoing rjsf's onChange back into
      // state lets its mount-time normalization (empty data) wipe every
      // programmatic update — the bug behind the first invalid runs.
      onChange={() => {}}
    />
  )
}

createRoot(document.getElementById('root')!).render(<BenchApp />)
