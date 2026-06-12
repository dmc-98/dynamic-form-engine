/**
 * Formily comparison lane — same logical workload (visibility chains) and
 * measurement methodology (flushSync from a macrotask) as the other lanes,
 * expressed in Formily's native idiom: createForm + per-field reactions
 * driving field.visible from the predecessor's value.
 */
import React, { useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { createForm, onFieldValueChange } from '@formily/core'
import { FormProvider, Field, observer, useField } from '@formily/react'

declare global {
  interface Window {
    __BENCH_RESULTS?: unknown
    __BENCH_ERROR?: string
  }
}

const __params = new URLSearchParams(window.location.search)
const FIELD_COUNT = Number(__params.get('fields') ?? 100)
const CHAIN_DEPTH = Number(__params.get('depth') ?? 10)
const WARMUP_OPS = 30
const OPS = 250

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

// Plain controlled input — same renderer weight as the other lanes.
const BenchInput = observer((props: { value?: string; onChange?: (v: string) => void }) => {
  const field = useField()
  return (
    <label style={{ display: 'block' }}>
      {field.title as string}
      <input value={props.value ?? ''} onChange={(e) => props.onChange?.(e.target.value)} />
    </label>
  )
})

function makeForm() {
  return createForm({
    effects() {
      // Chain reactions: bench_i visible iff bench_{i-1} non-empty.
      for (let i = 0; i < FIELD_COUNT; i += 1) {
        if (i % CHAIN_DEPTH === 0) continue
        const prev = `bench_${i - 1}`
        const self = `bench_${i}`
        onFieldValueChange(prev, (field, form) => {
          form.setFieldState(self, (state) => {
            state.visible = Boolean(field.value)
          })
        })
      }
    },
  })
}

function BenchApp() {
  const form = useMemo(makeForm, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        for (let i = 0; i < WARMUP_OPS; i += 1) {
          flushSync(() => form.setValuesIn(`bench_${(i * 7) % FIELD_COUNT}`, `w${i}`))
        }
        const commit: number[] = []
        for (let op = 0; op < OPS; op += 1) {
          const idx = (op * 7) % FIELD_COUNT
          const value = op % 3 === 2 ? '' : `v${op}`
          const t0 = performance.now()
          flushSync(() => form.setValuesIn(`bench_${idx}`, value))
          commit.push(performance.now() - t0)
        }
        commit.sort((a, b) => a - b)
        const inputsRendered = document.querySelectorAll('input').length
        window.__BENCH_RESULTS = {
          scenario: `${FIELD_COUNT} fields / chain depth ${CHAIN_DEPTH} (formily reactions)`,
          inputsRendered,
          chainHeads: FIELD_COUNT / CHAIN_DEPTH,
          workloadValid: inputsRendered > FIELD_COUNT / CHAIN_DEPTH,
          domCommit: {
            ops: OPS,
            p50: percentile(commit, 50),
            p95: percentile(commit, 95),
            p99: percentile(commit, 99),
            max: commit[commit.length - 1],
            note: 'input → settled DOM (flushSync); formily reactive graph with per-field visibility reactions',
          },
        }
      } catch (error) {
        window.__BENCH_ERROR = (error as Error).message
      }
    }, 50)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fields = []
  for (let i = 0; i < FIELD_COUNT; i += 1) {
    fields.push(
      <Field
        key={i}
        name={`bench_${i}`}
        title={`Benchmark field ${i}`}
        initialValue=""
        component={[BenchInput]}
        visible={i % CHAIN_DEPTH === 0}
      />,
    )
  }

  return <FormProvider form={form}><form>{fields}</form></FormProvider>
}

createRoot(document.getElementById('root')!).render(<BenchApp />)
