// ─── Vendored playground helpers ─────────────────────────────────────────────
// Local copies of two helpers that exist in the DFE packages' source but are not
// in the currently-PUBLISHED npm versions the landing installs at deploy time
// (`buildFlowModel` from @dmc--98/dfe-core, `createPaymentStepHandler` from
// @dmc--98/dfe-server). Vendoring them keeps the deployed landing build
// independent of the package publish cadence. When the packages are published
// with these APIs, replace these imports with the real package exports.
//
// These are faithful, self-contained copies — no behavior change.

import type { FormStep, StepBranch } from '@dmc--98/dfe-core'

// ── buildFlowModel (mirror of @dmc--98/dfe-core/src/flow-model.ts) ───────────

export interface FlowNode { id: string; title: string; order: number; skippable: boolean; isReview: boolean }
export type FlowEdgeKind = 'sequential' | 'branch'
export interface FlowEdge { from: string; to: string; kind: FlowEdgeKind; label?: string; dangling?: boolean }
export interface FlowModel { nodes: FlowNode[]; edges: FlowEdge[] }

function labelForBranch(branch: StepBranch): string {
  const rule = branch.condition?.rules?.[0]
  if (!rule) return 'when condition met'
  return `${rule.fieldKey} ${rule.operator} ${String(rule.value)}`
}

export function buildFlowModel(steps: FormStep[]): FlowModel {
  const ordered = [...steps].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  const ids = new Set(ordered.map((s) => s.id))

  const nodes: FlowNode[] = ordered.map((s) => ({
    id: s.id,
    title: s.title,
    order: s.order,
    skippable: s.conditions != null,
    isReview: s.config?.review != null,
  }))

  const edges: FlowEdge[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    edges.push({ from: ordered[i].id, to: ordered[i + 1].id, kind: 'sequential' })
  }
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

// ── createPaymentStepHandler (mirror of @dmc--98/dfe-server/src/payment.ts) ──

export interface PaymentIntentResult { id: string; clientSecret: string; amount: number; currency: string; status: string }
export interface PaymentClient {
  createPaymentIntent(params: { amount: number; currency: string; metadata?: Record<string, string> }): Promise<PaymentIntentResult>
  retrievePaymentIntent(id: string): Promise<PaymentIntentResult>
}
export interface VerifyOptions { expectAmount?: number; expectCurrency?: string }
export interface VerifyResult { paid: boolean; status: string; reason?: string }

export function createPaymentStepHandler(opts: { client: PaymentClient }) {
  const { client } = opts
  return {
    async createIntent(input: { amount: number; currency?: string; metadata?: Record<string, string> }) {
      if (!(input.amount > 0) || !Number.isInteger(input.amount)) {
        throw new Error('Payment amount must be a positive integer (smallest currency unit).')
      }
      return client.createPaymentIntent({ amount: input.amount, currency: input.currency ?? 'usd', metadata: input.metadata })
    },
    async verify(paymentIntentId: string, options: VerifyOptions = {}): Promise<VerifyResult> {
      let intent: PaymentIntentResult
      try {
        intent = await client.retrievePaymentIntent(paymentIntentId)
      } catch (e) {
        return { paid: false, status: 'error', reason: `Provider error: ${e instanceof Error ? e.message : String(e)}` }
      }
      if (intent.status !== 'succeeded') return { paid: false, status: intent.status, reason: `Intent status is "${intent.status}"` }
      if (options.expectAmount !== undefined && intent.amount !== options.expectAmount) {
        return { paid: false, status: intent.status, reason: `Amount mismatch: expected ${options.expectAmount}, got ${intent.amount}` }
      }
      if (options.expectCurrency !== undefined && intent.currency.toLowerCase() !== options.expectCurrency.toLowerCase()) {
        return { paid: false, status: intent.status, reason: `Currency mismatch: expected ${options.expectCurrency}, got ${intent.currency}` }
      }
      return { paid: true, status: intent.status }
    },
  }
}
