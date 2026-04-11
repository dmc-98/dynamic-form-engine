import {
  createAesGcmFieldProtector,
  createInMemoryAuditLogStore,
  deriveProtectedFieldPolicies,
  mergeProtectedFieldPolicies,
  revealProtectedFieldValues,
  type FormVersionRecord,
  type ProtectedFieldPolicy,
} from '@dmc-98/dfe-server'
import type { FormRuntimeContext } from '@dmc-98/dfe-core'

const defaultRetentionDays = Number.parseInt(process.env.DFE_HIPAA_RETENTION_DAYS ?? '30', 10)

export const exampleHipaaAuditStore = createInMemoryAuditLogStore({
  retentionMs: defaultRetentionDays * 24 * 60 * 60 * 1000,
})

export const exampleHipaaValueProtector = createAesGcmFieldProtector({
  secret: process.env.DFE_HIPAA_SECRET ?? 'dfe-example-hipaa-secret',
  keyId: 'example-demo-key',
})

export const exampleHipaaFieldPolicies: ProtectedFieldPolicy[] = [
  {
    key: 'first_name',
    label: 'First Name',
    classification: 'pii',
    protectAtRest: true,
    allowAnalytics: false,
    redactInAuditLogs: true,
    retentionDays: defaultRetentionDays,
  },
  {
    key: 'last_name',
    label: 'Last Name',
    classification: 'pii',
    protectAtRest: true,
    allowAnalytics: false,
    redactInAuditLogs: true,
    retentionDays: defaultRetentionDays,
  },
  {
    key: 'email',
    label: 'Email Address',
    classification: 'pii',
    protectAtRest: true,
    allowAnalytics: false,
    redactInAuditLogs: true,
    retentionDays: defaultRetentionDays,
  },
  {
    key: 'phone',
    label: 'Phone Number',
    classification: 'pii',
    protectAtRest: true,
    allowAnalytics: false,
    redactInAuditLogs: true,
    retentionDays: defaultRetentionDays,
  },
]

export function getExampleHipaaFieldPolicies(form?: Pick<FormVersionRecord, 'fields'>): ProtectedFieldPolicy[] {
  return mergeProtectedFieldPolicies(
    exampleHipaaFieldPolicies,
    form ? deriveProtectedFieldPolicies(form.fields) : undefined,
  )
}

export async function revealExampleProtectedValues(
  context: FormRuntimeContext,
  form?: Pick<FormVersionRecord, 'fields'>,
) {
  return revealProtectedFieldValues(
    context,
    getExampleHipaaFieldPolicies(form),
    exampleHipaaValueProtector,
  )
}
