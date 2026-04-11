import { describe, expect, it } from 'vitest'
import {
  createAesGcmFieldProtector,
  createAnalyticsStore,
  createInMemoryAuditLogStore,
  deriveProtectedFieldPolicies,
  redactProtectedFieldVault,
  revealProtectedFieldValues,
  sanitizeAnalyticsEventForCompliance,
  storeProtectedValuesInContext,
} from '../src'
import type { ProtectedFieldPolicy } from '../src'

const protectedPolicies: ProtectedFieldPolicy[] = [
  {
    key: 'email',
    label: 'Email Address',
    classification: 'pii',
    protectAtRest: true,
    allowAnalytics: false,
    redactInAuditLogs: true,
    retentionDays: 30,
  },
]

describe('deriveProtectedFieldPolicies', () => {
  it('derives protected-field policies from form config metadata', () => {
    const policies = deriveProtectedFieldPolicies([
      {
        id: 'field-1',
        versionId: 'version-1',
        key: 'email',
        label: 'Email Address',
        type: 'EMAIL',
        required: true,
        order: 1,
        config: {
          placeholder: 'you@example.com',
          dataClassification: 'pii',
          compliance: {
            protected: true,
            encryptAtRest: true,
            allowAnalytics: false,
            redactInAuditLogs: true,
            retentionDays: 30,
          },
        },
      },
      {
        id: 'field-2',
        versionId: 'version-1',
        key: 'department',
        label: 'Department',
        type: 'SELECT',
        required: false,
        order: 2,
        config: {
          mode: 'static',
          options: [],
        },
      },
    ] as any)

    expect(policies).toEqual([
      expect.objectContaining({
        key: 'email',
        classification: 'pii',
        protectAtRest: true,
        allowAnalytics: false,
      }),
    ])
  })
})

describe('protected field vault helpers', () => {
  it('stores encrypted protected values and can reveal them later', async () => {
    const protector = createAesGcmFieldProtector({ secret: 'unit-test-secret' })
    const context = await storeProtectedValuesInContext(
      { userId: 'user-1' },
      { email: 'ada@example.com', department: 'eng' },
      protectedPolicies,
      protector,
    )

    expect((context.dfe as any).protectedFields.fields.email.value).toMatchObject({
      __dfeEncrypted: true,
      alg: 'AES-GCM',
    })

    const redacted = redactProtectedFieldVault(context)
    expect((redacted.dfe as any).protectedFields).toMatchObject({
      redacted: true,
      fieldCount: 1,
    })

    await expect(revealProtectedFieldValues(context, protectedPolicies, protector)).resolves.toEqual({
      email: 'ada@example.com',
    })
  })
})

describe('analytics sanitization', () => {
  it('drops protected field analytics by default and supports store-level compliance filtering', () => {
    const dropped = sanitizeAnalyticsEventForCompliance({
      formId: 'form-1',
      submissionId: 'sub-1',
      event: 'field_error',
      fieldKey: 'email',
      metadata: { error: 'Email is required' },
      timestamp: 1,
    }, protectedPolicies)

    expect(dropped).toBeNull()

    const store = createAnalyticsStore({
      compliance: {
        fieldPolicies: protectedPolicies,
      },
    })

    store.track({
      formId: 'form-1',
      submissionId: 'sub-1',
      event: 'field_error',
      fieldKey: 'email',
      metadata: { error: 'Email is required' },
      timestamp: 1,
    })
    store.track({
      formId: 'form-1',
      submissionId: 'sub-1',
      event: 'form_started',
      timestamp: 2,
    })

    expect(store.getEvents('form-1')).toEqual([
      expect.objectContaining({
        event: 'form_started',
      }),
    ])
  })
})

describe('createInMemoryAuditLogStore', () => {
  it('lists and prunes retained entries', () => {
    const store = createInMemoryAuditLogStore({ retentionMs: 100 })
    const now = Date.now()

    store.write({
      id: 'audit-old',
      action: 'submission.read',
      actorId: 'user-1',
      tenantId: 'tenant-1',
      targetType: 'submission',
      targetId: 'sub-1',
      outcome: 'success',
      occurredAt: now - 50,
    })
    store.write({
      id: 'audit-new',
      action: 'submission.export',
      actorId: 'user-1',
      tenantId: 'tenant-1',
      targetType: 'submission',
      targetId: 'sub-1',
      outcome: 'success',
      occurredAt: now - 10,
    })

    expect(store.pruneExpired?.(now + 60)).toBe(1)
    expect(store.list({ tenantId: 'tenant-1' })).toEqual([
      expect.objectContaining({
        id: 'audit-new',
        action: 'submission.export',
      }),
    ])
  })
})
