import type {
  FieldComplianceConfig,
  FieldDataClassification,
  FormField,
  FormRuntimeContext,
  FormValues,
} from '@dmc--98/dfe-core'
import type { ServerFormAnalyticsEvent } from './adapters'
import { generateId } from './uuid'

export interface ProtectedFieldPolicy {
  key: string
  label?: string
  classification: FieldDataClassification
  protectAtRest: boolean
  allowAnalytics: boolean
  redactInAuditLogs: boolean
  retentionDays?: number
}

export interface ComplianceAnalyticsOptions {
  protectedFieldEventMode?: 'drop' | 'redact'
  redactMetadata?: boolean
}

export interface AuditLogEntry {
  id: string
  action: string
  actorId?: string | null
  tenantId?: string | null
  targetType: string
  targetId?: string | null
  outcome: 'success' | 'failure'
  occurredAt: number
  metadata?: Record<string, unknown>
}

export interface AuditLogQuery {
  tenantId?: string | null
  actorId?: string | null
  action?: string
  from?: number
  to?: number
  limit?: number
}

export interface AuditLogStore {
  write(entry: AuditLogEntry): void | Promise<void>
  list(query?: AuditLogQuery): AuditLogEntry[] | Promise<AuditLogEntry[]>
  pruneExpired?(now?: number): number | Promise<number>
  clear?(): void | Promise<void>
}

export interface EncryptedFieldValue {
  __dfeEncrypted: true
  alg: 'AES-GCM'
  keyId?: string
  iv: string
  ciphertext: string
}

export interface ProtectedFieldVaultEntry {
  fieldKey: string
  label?: string
  classification: FieldDataClassification
  value: EncryptedFieldValue
  storedAt: number
}

export interface ProtectedFieldVault {
  version: 1
  fields: Record<string, ProtectedFieldVaultEntry>
}

export interface RedactedProtectedFieldVault {
  version: 1
  redacted: true
  fieldCount: number
  fields: Array<{
    fieldKey: string
    label?: string
    classification: FieldDataClassification
    storedAt: number
  }>
}

export interface FieldValueProtector {
  encrypt(
    value: unknown,
    metadata?: { fieldKey: string; classification: FieldDataClassification },
  ): Promise<EncryptedFieldValue>
  decrypt(
    value: EncryptedFieldValue,
    metadata?: { fieldKey?: string; classification?: FieldDataClassification },
  ): Promise<unknown>
  isEncryptedValue(value: unknown): value is EncryptedFieldValue
}

interface WebCryptoLike {
  subtle: {
    digest(algorithm: string, data: ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer>
    importKey(
      format: string,
      keyData: ArrayBuffer | ArrayBufferView,
      algorithm: Record<string, unknown>,
      extractable: boolean,
      keyUsages: string[],
    ): Promise<unknown>
    encrypt(
      algorithm: Record<string, unknown>,
      key: unknown,
      data: ArrayBuffer | ArrayBufferView,
    ): Promise<ArrayBuffer>
    decrypt(
      algorithm: Record<string, unknown>,
      key: unknown,
      data: ArrayBuffer | ArrayBufferView,
    ): Promise<ArrayBuffer>
  }
  getRandomValues<T extends ArrayBufferView>(array: T): T
}

const SENSITIVE_CLASSIFICATIONS = new Set<FieldDataClassification>([
  'pii',
  'phi',
  'financial',
  'credential',
  'restricted',
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toComplianceConfig(field: FormField): FieldComplianceConfig | undefined {
  const config = field.config as Record<string, unknown>
  return isPlainObject(config.compliance) ? config.compliance as FieldComplianceConfig : undefined
}

function getClassification(field: FormField): FieldDataClassification | undefined {
  const config = field.config as Record<string, unknown>
  return (config.dataClassification as FieldDataClassification | undefined)
    ?? toComplianceConfig(field)?.classification
}

export function deriveProtectedFieldPolicies(fields: FormField[]): ProtectedFieldPolicy[] {
  return fields.flatMap((field) => {
    const compliance = toComplianceConfig(field)
    const classification = getClassification(field)
    const isSensitive = compliance?.protected === true
      || (classification !== undefined && SENSITIVE_CLASSIFICATIONS.has(classification))

    if (!isSensitive && !compliance?.encryptAtRest && compliance?.allowAnalytics !== false) {
      return []
    }

    return [{
      key: field.key,
      label: field.label,
      classification: classification ?? 'restricted',
      protectAtRest: compliance?.encryptAtRest ?? isSensitive,
      allowAnalytics: compliance?.allowAnalytics ?? !isSensitive,
      redactInAuditLogs: compliance?.redactInAuditLogs ?? isSensitive,
      retentionDays: compliance?.retentionDays,
    }]
  })
}

export function mergeProtectedFieldPolicies(
  ...policySets: Array<ProtectedFieldPolicy[] | undefined>
): ProtectedFieldPolicy[] {
  const merged = new Map<string, ProtectedFieldPolicy>()

  for (const policySet of policySets) {
    for (const policy of policySet ?? []) {
      merged.set(policy.key, policy)
    }
  }

  return Array.from(merged.values())
}

function getPolicyMap(policies: ProtectedFieldPolicy[]) {
  return new Map(policies.map((policy) => [policy.key, policy]))
}

function base64Encode(value: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value).toString('base64')
  }

  const runtime = globalThis as { btoa?: (value: string) => string }
  if (!runtime.btoa) {
    throw new Error('No base64 encoder is available in this runtime')
  }

  let binary = ''
  for (const byte of value) {
    binary += String.fromCharCode(byte)
  }

  return runtime.btoa(binary)
}

function base64Decode(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'))
  }

  const runtime = globalThis as { atob?: (value: string) => string }
  if (!runtime.atob) {
    throw new Error('No base64 decoder is available in this runtime')
  }

  const binary = runtime.atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function resolveWebCrypto(): Promise<WebCryptoLike> {
  const runtime = globalThis as unknown as { crypto?: WebCryptoLike }
  if (runtime.crypto?.subtle) {
    return runtime.crypto
  }

  throw new Error('A Web Crypto compatible runtime is required for protected field encryption')
}

export function createAesGcmFieldProtector(options: {
  secret: string
  keyId?: string
}): FieldValueProtector {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let keyPromise: Promise<unknown> | undefined

  async function getKey() {
    if (!keyPromise) {
      keyPromise = (async () => {
        const crypto = await resolveWebCrypto()
        const secretHash = await crypto.subtle.digest('SHA-256', encoder.encode(options.secret))
        return crypto.subtle.importKey(
          'raw',
          secretHash,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt'],
        )
      })()
    }

    return keyPromise
  }

  return {
    async encrypt(value) {
      const crypto = await resolveWebCrypto()
      const key = await getKey()
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(JSON.stringify(value)),
      )

      return {
        __dfeEncrypted: true,
        alg: 'AES-GCM',
        keyId: options.keyId,
        iv: base64Encode(iv),
        ciphertext: base64Encode(new Uint8Array(ciphertext)),
      }
    },

    async decrypt(value) {
      const crypto = await resolveWebCrypto()
      const key = await getKey()
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64Decode(value.iv) },
        key,
        base64Decode(value.ciphertext),
      )

      return JSON.parse(decoder.decode(plaintext))
    },

    isEncryptedValue(value: unknown): value is EncryptedFieldValue {
      return isEncryptedFieldValue(value)
    },
  }
}

export function isEncryptedFieldValue(value: unknown): value is EncryptedFieldValue {
  return isPlainObject(value)
    && value.__dfeEncrypted === true
    && value.alg === 'AES-GCM'
    && typeof value.iv === 'string'
    && typeof value.ciphertext === 'string'
}

export async function buildProtectedFieldVault(
  values: FormValues,
  policies: ProtectedFieldPolicy[],
  protector: FieldValueProtector,
): Promise<ProtectedFieldVault | null> {
  const fields: Record<string, ProtectedFieldVaultEntry> = {}
  const policyMap = getPolicyMap(policies)

  for (const [fieldKey, rawValue] of Object.entries(values)) {
    if (rawValue === undefined) {
      continue
    }

    const policy = policyMap.get(fieldKey)
    if (!policy?.protectAtRest) {
      continue
    }

    fields[fieldKey] = {
      fieldKey,
      label: policy.label,
      classification: policy.classification,
      value: await protector.encrypt(rawValue, {
        fieldKey,
        classification: policy.classification,
      }),
      storedAt: Date.now(),
    }
  }

  if (Object.keys(fields).length === 0) {
    return null
  }

  return {
    version: 1,
    fields,
  }
}

export function getProtectedFieldVault(
  context: FormRuntimeContext,
): ProtectedFieldVault | null {
  const dfe = isPlainObject(context.dfe) ? context.dfe : undefined
  const candidate = dfe?.protectedFields

  if (!isPlainObject(candidate) || candidate.version !== 1 || !isPlainObject(candidate.fields)) {
    return null
  }

  const fields: Record<string, ProtectedFieldVaultEntry> = {}
  for (const [fieldKey, value] of Object.entries(candidate.fields)) {
    if (!isPlainObject(value) || !isEncryptedFieldValue(value.value)) {
      continue
    }

    fields[fieldKey] = {
      fieldKey,
      label: typeof value.label === 'string' ? value.label : undefined,
      classification: (value.classification as FieldDataClassification | undefined) ?? 'restricted',
      value: value.value,
      storedAt: typeof value.storedAt === 'number' ? value.storedAt : Date.now(),
    }
  }

  return {
    version: 1,
    fields,
  }
}

export function storeProtectedFieldVault(
  context: FormRuntimeContext,
  vault: ProtectedFieldVault | null,
): FormRuntimeContext {
  if (!vault) {
    return context
  }

  const dfe = isPlainObject(context.dfe) ? { ...context.dfe } : {}
  const existingVault = getProtectedFieldVault(context)
  dfe.protectedFields = {
    version: 1,
    fields: {
      ...(existingVault?.fields ?? {}),
      ...vault.fields,
    },
  }

  return {
    ...context,
    dfe,
  }
}

export async function storeProtectedValuesInContext(
  context: FormRuntimeContext,
  values: FormValues,
  policies: ProtectedFieldPolicy[],
  protector: FieldValueProtector,
): Promise<FormRuntimeContext> {
  const vault = await buildProtectedFieldVault(values, policies, protector)
  return storeProtectedFieldVault(context, vault)
}

export async function revealProtectedFieldValues(
  context: FormRuntimeContext,
  policies: ProtectedFieldPolicy[],
  protector: FieldValueProtector,
): Promise<FormValues> {
  const vault = getProtectedFieldVault(context)
  if (!vault) {
    return {}
  }

  const values: FormValues = {}
  const policyMap = getPolicyMap(policies)

  for (const [fieldKey, entry] of Object.entries(vault.fields)) {
    const policy = policyMap.get(fieldKey)
    values[fieldKey] = await protector.decrypt(entry.value, {
      fieldKey,
      classification: policy?.classification ?? entry.classification,
    })
  }

  return values
}

export function redactProtectedFieldVault(
  context: FormRuntimeContext,
): FormRuntimeContext {
  const vault = getProtectedFieldVault(context)
  if (!vault) {
    return context
  }

  const dfe = isPlainObject(context.dfe) ? { ...context.dfe } : {}
  const redactedVault: RedactedProtectedFieldVault = {
    version: 1,
    redacted: true,
    fieldCount: Object.keys(vault.fields).length,
    fields: Object.values(vault.fields).map((entry) => ({
      fieldKey: entry.fieldKey,
      label: entry.label,
      classification: entry.classification,
      storedAt: entry.storedAt,
    })),
  }

  dfe.protectedFields = redactedVault
  return {
    ...context,
    dfe,
  }
}

export function sanitizeAnalyticsEventForCompliance(
  event: ServerFormAnalyticsEvent,
  policies: ProtectedFieldPolicy[],
  options?: ComplianceAnalyticsOptions,
): ServerFormAnalyticsEvent | null {
  if (event.event !== 'field_error' || !event.fieldKey) {
    return event
  }

  const policy = getPolicyMap(policies).get(event.fieldKey)
  if (!policy) {
    return event
  }

  if (!policy.allowAnalytics && (options?.protectedFieldEventMode ?? 'drop') === 'drop') {
    return null
  }

  if (!policy.allowAnalytics || options?.redactMetadata !== false) {
    return {
      ...event,
      fieldKey: `protected:${policy.classification}`,
      metadata: {
        ...(isPlainObject(event.metadata) ? event.metadata : {}),
        fieldLabel: 'Protected field',
        error: 'Protected field validation error',
        classification: policy.classification,
      },
    }
  }

  return event
}

export function sanitizeAnalyticsEventsForCompliance(
  events: ServerFormAnalyticsEvent[],
  policies: ProtectedFieldPolicy[],
  options?: ComplianceAnalyticsOptions,
): ServerFormAnalyticsEvent[] {
  return events.flatMap((event) => {
    const sanitized = sanitizeAnalyticsEventForCompliance(event, policies, options)
    return sanitized ? [sanitized] : []
  })
}

export function createAuditLogEntry(input: Omit<AuditLogEntry, 'id' | 'occurredAt'> & {
  id?: string
  occurredAt?: number
}): AuditLogEntry {
  return {
    id: input.id ?? generateId(),
    occurredAt: input.occurredAt ?? Date.now(),
    ...input,
  }
}

export function createInMemoryAuditLogStore(options?: {
  retentionMs?: number
}): AuditLogStore & {
  getEntries(): AuditLogEntry[]
} {
  const entries: AuditLogEntry[] = []

  function prune(now = Date.now()) {
    if (!options?.retentionMs) {
      return 0
    }

    const cutoff = now - options.retentionMs
    const before = entries.length
    for (let index = entries.length - 1; index >= 0; index--) {
      if (entries[index].occurredAt < cutoff) {
        entries.splice(index, 1)
      }
    }

    return before - entries.length
  }

  return {
    write(entry) {
      prune()
      entries.push(entry)
    },

    list(query) {
      prune()
      let results = [...entries]
        .sort((a, b) => b.occurredAt - a.occurredAt)

      if (query?.tenantId !== undefined) {
        results = results.filter((entry) => (entry.tenantId ?? null) === query.tenantId)
      }

      if (query?.actorId !== undefined) {
        results = results.filter((entry) => (entry.actorId ?? null) === query.actorId)
      }

      if (query?.action) {
        results = results.filter((entry) => entry.action === query.action)
      }

      if (query?.from) {
        results = results.filter((entry) => entry.occurredAt >= query.from!)
      }

      if (query?.to) {
        results = results.filter((entry) => entry.occurredAt <= query.to!)
      }

      if (query?.limit) {
        results = results.slice(0, query.limit)
      }

      return results
    },

    pruneExpired(now) {
      return prune(now)
    },

    clear() {
      entries.length = 0
    },

    getEntries() {
      prune()
      return [...entries]
    },
  }
}
