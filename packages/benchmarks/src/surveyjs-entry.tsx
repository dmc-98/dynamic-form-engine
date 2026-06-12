/**
 * SurveyJS comparison lane — same workload via survey-core's native idiom:
 * text questions with visibleIf expressions ("{bench_N} notempty"), rendered
 * by survey-react-ui, values driven through Model.setValue inside flushSync.
 */
import React, { useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'

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

function makeModel(): Model {
  const elements = []
  for (let i = 0; i < FIELD_COUNT; i += 1) {
    const q: Record<string, unknown> = { type: 'text', name: `bench_${i}`, title: `Benchmark field ${i}` }
    if (i % CHAIN_DEPTH !== 0) q.visibleIf = `{bench_${i - 1}} notempty`
    elements.push(q)
  }
  const model = new Model({ showQuestionNumbers: 'off', questionsOnPageMode: 'singlePage', elements })
  model.showNavigationButtons = false
  return model
}

function BenchApp() {
  const model = useMemo(makeModel, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        for (let i = 0; i < WARMUP_OPS; i += 1) {
          flushSync(() => { model.data = { ...model.data, [`bench_${(i * 7) % FIELD_COUNT}`]: `w${i}` } })
        }
        // survey-react-ui defers rendering past the synchronous commit
        // (confirmed: inputs 10 -> 71 only after the next frame), so two
        // measurements: CPU-side model commit, and value -> DOM-settled via
        // MutationObserver (timeout-raced: ops on hidden fields may not
        // mutate the visible DOM at all).
        const root = document.getElementById('root')!
        const domSettle = () =>
          Promise.race([
            new Promise<boolean>((resolve) => {
              const mo = new MutationObserver(() => { mo.disconnect(); resolve(true) })
              mo.observe(root, { childList: true, subtree: true, attributes: true, characterData: true })
            }),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 120)),
          ])
        const commit: number[] = []
        const settled: number[] = []
        for (let op = 0; op < OPS; op += 1) {
          const idx = (op * 7) % FIELD_COUNT
          const value = op % 3 === 2 ? undefined : `v${op}`
          const next = { ...model.data } as Record<string, unknown>
          if (value === undefined) delete next[`bench_${idx}`]
          else next[`bench_${idx}`] = value
          const t0 = performance.now()
          const settlePromise = domSettle()
          flushSync(() => { model.data = next })
          commit.push(performance.now() - t0)
          const mutated = await settlePromise
          if (mutated) settled.push(performance.now() - t0)
        }
        commit.sort((a, b) => a - b)
        settled.sort((a, b) => a - b)
        // Explicit probe: fill bench_0, check immediately AND after paint.
        flushSync(() => { model.data = { ...model.data, bench_0: 'probe' } })
        const inputsImmediate = document.querySelectorAll('input').length
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
        const inputsRendered = document.querySelectorAll('input').length
        ;(window as any).__DBG2 = { inputsImmediate, inputsAfterPaint: inputsRendered }
        ;(window as any).__DBG = {
          probeAfterFill: { q1Visible: model.getQuestionByName('bench_1')?.isVisible, inputs: document.querySelectorAll('input').length },
          q1Visible: model.getQuestionByName('bench_1')?.isVisible,
          bench0Value: model.getValue('bench_0'),
          state: model.state,
          renderedQuestions: document.querySelectorAll('[data-name]').length
        }
        window.__BENCH_RESULTS = {
          scenario: `${FIELD_COUNT} fields / chain depth ${CHAIN_DEPTH} (survey-core visibleIf)`,
          inputsRendered,
          chainHeads: FIELD_COUNT / CHAIN_DEPTH,
          workloadValid: inputsRendered > FIELD_COUNT / CHAIN_DEPTH,
          modelCommit: {
            ops: OPS,
            p50: percentile(commit, 50),
            p95: percentile(commit, 95),
            p99: percentile(commit, 99),
            max: commit[commit.length - 1],
            note: 'CPU-side: value set + survey-core condition evaluation (render NOT included — survey-react-ui defers it)',
          },
          domSettled: settled.length
            ? {
                ops: settled.length,
                p50: percentile(settled, 50),
                p95: percentile(settled, 95),
                p99: percentile(settled, 99),
                max: settled[settled.length - 1],
                note: 'value → first DOM mutation (MutationObserver). Includes SurveyJS deferred-render frame; headless vsync ~30Hz inflates absolute values vs a 60Hz desktop.',
              }
            : null,
        }
      } catch (error) {
        window.__BENCH_ERROR = (error as Error).message
      }
    }, 200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Survey model={model} />
}

createRoot(document.getElementById('root')!).render(<BenchApp />)
