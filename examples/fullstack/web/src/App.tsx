import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildSyncStorageKey,
  createIndexedDbPersistenceAdapter,
  createMemoryPersistenceAdapter,
  createRemoteSyncTransport,
  useFormEngine,
  useFormStepper,
  useFormSync,
  useOfflineFormRuntime,
} from '@dmc-98/dfe-react'
import { DfeThemeProvider, dfeDefaultTheme } from '@dmc-98/dfe-react/theme'
import { DfeFormRenderer, DfeStepIndicator } from '@dmc-98/dfe-react/components'
import type { BrowserPersistenceAdapter, FormField, FormStep, SyncPresence } from '@dmc-98/dfe-react'
import { ExampleFieldRenderer } from './ExampleFieldRenderer'
import { PlaygroundExample } from './PlaygroundExample'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? 'demo-tenant'
const USER_ID = import.meta.env.VITE_USER_ID ?? 'demo-user'
const SYNC_MODE = import.meta.env.VITE_SYNC_MODE ?? 'local'
const PARTICIPANT_COLORS = ['#2563eb', '#f97316', '#059669', '#7c3aed', '#dc2626', '#0891b2']

interface FormData {
  id: string
  slug: string
  title: string
  description: string | null
  versionId: string
  steps: FormStep[]
  fields: FormField[]
}

interface CollaborationInfo {
  sessionId: string
  actorId: string
  displayName: string
  color: string
  shareUrl: string
}

type CompletionState = 'submitted' | 'queued' | null

function createBrowserId(prefix: string): string {
  const cryptoApi = globalThis as typeof globalThis & {
    crypto?: { randomUUID?: () => string }
  }
  const value = typeof cryptoApi.crypto?.randomUUID === 'function'
    ? cryptoApi.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${value}`
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function getParticipantColor(seed: string): string {
  return PARTICIPANT_COLORS[hashString(seed) % PARTICIPANT_COLORS.length]
}

function getCollaborationInfo(formId: string): CollaborationInfo {
  if (typeof window === 'undefined') {
    return {
      sessionId: `${formId}:${USER_ID}`,
      actorId: `${USER_ID}:server`,
      displayName: USER_ID,
      color: getParticipantColor(USER_ID),
      shareUrl: '',
    }
  }

  const url = new URL(window.location.href)
  const storageKey = `dfe-example:session:${TENANT_ID}:${formId}:${USER_ID}`
  const storedSessionId = window.localStorage.getItem(storageKey)
  const sessionId = url.searchParams.get('session') ?? storedSessionId ?? createBrowserId(`session-${formId}`)
  const displayName = url.searchParams.get('name') ?? USER_ID

  if (!url.searchParams.get('session')) {
    url.searchParams.set('session', sessionId)
    window.history.replaceState({}, '', url)
  }

  window.localStorage.setItem(storageKey, sessionId)

  const actorStorageKey = `dfe-example:actor:${sessionId}`
  const actorId = window.sessionStorage.getItem(actorStorageKey) ?? `${displayName}:${createBrowserId('actor')}`
  window.sessionStorage.setItem(actorStorageKey, actorId)

  return {
    sessionId,
    actorId,
    displayName,
    color: getParticipantColor(actorId),
    shareUrl: url.toString(),
  }
}

function formatRelativeSyncTime(timestamp?: number): string {
  if (!timestamp) {
    return 'Waiting for first sync'
  }

  const delta = Math.max(0, Date.now() - timestamp)
  if (delta < 5_000) return 'Synced just now'
  if (delta < 60_000) return `Synced ${Math.floor(delta / 1_000)}s ago`
  return `Synced ${Math.floor(delta / 60_000)}m ago`
}

function createPersistenceAdapter(): BrowserPersistenceAdapter {
  if (typeof indexedDB === 'undefined') {
    return createMemoryPersistenceAdapter()
  }

  return createIndexedDbPersistenceAdapter({
    databaseName: 'dfe-example-sync',
    storeName: 'drafts',
  })
}

function FullstackExampleApp() {
  const [formData, setFormData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    fetch(`${API_URL}/dfe/forms/employee-onboarding`, {
      headers: {
        'x-tenant-id': TENANT_ID,
        'x-user-id': USER_ID,
      },
    })
      .then(async (response) => response.json())
      .then((data) => {
        setFormData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load form:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div style={styles.container}><p>Loading form...</p></div>
  }

  if (!formData) {
    return <div style={styles.container}><p>Form not found.</p></div>
  }

  return (
    <DfeThemeProvider
      theme={{
        colors: {
          primary: '#1d4ed8',
          primaryHover: '#1e40af',
          focus: 'rgba(29, 78, 216, 0.22)',
          surfaceMuted: '#eff6ff',
        },
        typography: {
          fontFamily: dfeDefaultTheme.typography.fontFamily,
        },
      }}
    >
      <DynamicForm
        key={`${formData.versionId}:${runKey}`}
        formData={formData}
        onRestart={() => setRunKey((current) => current + 1)}
      />
    </DfeThemeProvider>
  )
}

function App() {
  const routePath = typeof window === 'undefined' ? '/' : window.location.pathname

  if (routePath.startsWith('/playground')) {
    return <PlaygroundExample />
  }

  return <FullstackExampleApp />
}

function DynamicForm({
  formData,
  onRestart,
}: {
  formData: FormData
  onRestart: () => void
}) {
  const persistence = useMemo(createPersistenceAdapter, [])
  const collaboration = useMemo(
    () => getCollaborationInfo(formData.id),
    [formData.id],
  )
  const runtimeStorageKey = useMemo(
    () => buildSyncStorageKey('dfe-example-runtime', `${TENANT_ID}:${formData.id}:${formData.versionId}:${collaboration.sessionId}`),
    [collaboration.sessionId, formData.id, formData.versionId],
  )
  const syncStoragePrefix = useMemo(
    () => `dfe-example-sync:${TENANT_ID}:${formData.id}:${formData.versionId}`,
    [formData.id, formData.versionId],
  )
  const syncStorageKey = useMemo(
    () => buildSyncStorageKey(syncStoragePrefix, collaboration.sessionId),
    [collaboration.sessionId, syncStoragePrefix],
  )
  const syncTransport = useMemo(() => {
    if (SYNC_MODE !== 'remote') {
      return undefined
    }

    return createRemoteSyncTransport({
      baseUrl: `${API_URL}/dfe/collab/`,
      headers: {
        'x-tenant-id': TENANT_ID,
        'x-user-id': USER_ID,
      },
      query: {
        tenantId: TENANT_ID,
        userId: USER_ID,
      },
      formId: formData.id,
      versionId: formData.versionId,
      displayName: collaboration.displayName,
      color: collaboration.color,
    })
  }, [collaboration.color, collaboration.displayName, formData.id, formData.versionId])

  const engine = useFormEngine({
    fields: formData.fields,
  })
  const stepper = useFormStepper({
    steps: formData.steps,
    engine: engine.engine,
  })
  const sync = useFormSync({
    engine: engine.engine,
    sessionId: collaboration.sessionId,
    actorId: collaboration.actorId,
    displayName: collaboration.displayName,
    color: collaboration.color,
    transport: syncTransport,
    persistence,
    storageKeyPrefix: syncStoragePrefix,
  })
  const runtime = useOfflineFormRuntime({
    baseUrl: API_URL,
    formId: formData.id,
    versionId: formData.versionId,
    headers: {
      'x-tenant-id': TENANT_ID,
      'x-user-id': USER_ID,
    },
    persistence,
    storageKey: runtimeStorageKey,
    offlineEnabled: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [completionState, setCompletionState] = useState<CompletionState>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const submissionStartedRef = useRef(false)

  const currentStep = stepper.stepper.getCurrentStep()
  const currentIndex = stepper.stepper.getCurrentIndex()
  const visibleSteps = stepper.stepper.getVisibleSteps()
  const canGoBack = stepper.stepper.canGoBack()
  const isLastStep = stepper.stepper.isLastStep()
  const currentStepId = currentStep?.step.id
  const stepFields = engine.engine
    .getVisibleFields()
    .filter((field) => field.stepId === currentStepId)
  const dfeContext = (runtime.context as Record<string, unknown>).dfe as Record<string, unknown> | undefined
  const variantKey = typeof dfeContext?.variantKey === 'string' ? dfeContext.variantKey : null
  const variantOverrides = dfeContext?.variantOverrides as Record<string, unknown> | undefined
  const variantEyebrow = typeof variantOverrides?.eyebrow === 'string' ? variantOverrides.eyebrow : null
  const variantHeadline = typeof variantOverrides?.headline === 'string' ? variantOverrides.headline : null
  const variantBody = typeof variantOverrides?.body === 'string' ? variantOverrides.body : null
  const visibleParticipants = sync.participants.filter((participant) => participant.state !== 'offline')
  const isReady = runtime.isHydrated && sync.isHydrated

  useEffect(() => {
    if (!isReady || runtime.submissionId || submissionStartedRef.current) {
      return
    }

    submissionStartedRef.current = true
    runtime.createSubmission().catch((error) => {
      console.error('Failed to create submission:', error)
    })
  }, [isReady, runtime.createSubmission, runtime.submissionId])

  useEffect(() => {
    if (
      completionState === 'queued'
      && runtime.isHydrated
      && runtime.pendingActions === 0
      && runtime.syncState === 'online'
      && !runtime.error
    ) {
      setCompletionState('submitted')
    }
  }, [completionState, runtime.error, runtime.isHydrated, runtime.pendingActions, runtime.syncState])

  useEffect(() => {
    if (copiedShareLink) {
      const timer = window.setTimeout(() => setCopiedShareLink(false), 1_500)
      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [copiedShareLink])

  const handleCopyShareLink = async () => {
    if (!collaboration.shareUrl || !navigator.clipboard) {
      return
    }

    await navigator.clipboard.writeText(collaboration.shareUrl)
    setCopiedShareLink(true)
  }

  const handleStartOver = async () => {
    await Promise.all([
      runtime.reset(),
      persistence.delete(syncStorageKey),
    ])
    submissionStartedRef.current = false
    onRestart()
  }

  const handleNext = async () => {
    if (!currentStepId) {
      return
    }

    const validation = engine.engine.validateStep(currentStepId)
    if (!validation.success) {
      setErrors(validation.errors)
      return
    }

    setErrors({})

    const result = await runtime.submitStep(currentStepId, sync.values)
    if (!result.success) {
      setErrors(result.errors ?? {})
      return
    }

    stepper.markComplete(currentStepId)

    if (!isLastStep) {
      stepper.goNext()
      return
    }

    const shouldQueueCompletion = runtime.isOffline || runtime.syncState === 'offline'
    await runtime.completeSubmission()
    setCompletionState(shouldQueueCompletion ? 'queued' : 'submitted')
  }

  if (completionState === 'submitted') {
    return (
      <div style={styles.container}>
        <section style={styles.completionCard}>
          <h1>Thank You!</h1>
          <p>Your onboarding form has been submitted successfully.</p>
          <p style={styles.completionMeta}>
            Submission {runtime.submissionId ?? 'synced'} for collaboration session <code>{collaboration.sessionId}</code>.
          </p>
          <button onClick={() => void handleStartOver()} style={styles.button}>
            Start Over
          </button>
        </section>
      </div>
    )
  }

  if (completionState === 'queued') {
    return (
      <div style={styles.container}>
        <section data-testid="completion-queued" style={styles.completionCard}>
          <h1>Saved Offline</h1>
          <p>Your submission is queued locally and will sync automatically when the network returns.</p>
          <p style={styles.completionMeta}>
            Pending actions: {runtime.pendingActions}. {formatRelativeSyncTime(sync.lastSyncedAt)}
          </p>
          <div style={styles.nav}>
            <button onClick={() => void runtime.flushPendingActions()} style={styles.button}>
              Retry Sync
            </button>
            <button onClick={() => setCompletionState(null)} style={styles.buttonSecondary}>
              Return To Form
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div style={styles.container}>
        <section style={styles.completionCard}>
          <h1>Preparing Collaborative Draft</h1>
          <p>Loading the local draft, collaboration session, and offline queue before the form becomes editable.</p>
        </section>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{formData.title}</h1>
          {formData.description && <p style={styles.description}>{formData.description}</p>}
        </div>

        <section style={styles.sessionCard}>
          <div style={styles.sessionMeta}>Collaboration Session</div>
          <div data-testid="collaboration-session" style={styles.sessionValue}>
            {collaboration.sessionId}
          </div>
          <div style={styles.shareRow}>
            <code style={styles.shareUrl}>{collaboration.shareUrl}</code>
            <button onClick={() => void handleCopyShareLink()} style={styles.buttonSecondary}>
              {copiedShareLink ? 'Copied' : 'Copy Link'}
            </button>
          </div>
        </section>
      </header>

      <section style={styles.statusGrid}>
        <article data-testid="sync-status-card" style={styles.statusCard}>
          <span style={styles.statusLabel}>Connection</span>
          <strong style={styles.statusValue}>
            {runtime.syncState === 'offline' ? 'Offline mode' : 'Live sync'}
          </strong>
          <span style={styles.statusCaption}>
            {runtime.pendingActions > 0
              ? `${runtime.pendingActions} action${runtime.pendingActions === 1 ? '' : 's'} pending`
              : formatRelativeSyncTime(sync.lastSyncedAt)}
          </span>
        </article>

        <article style={styles.statusCard}>
          <span style={styles.statusLabel}>Collaborators</span>
          <strong style={styles.statusValue}>{visibleParticipants.length}</strong>
          <span style={styles.statusCaption}>
            {visibleParticipants.length > 1 ? 'Multiple editors are active now' : 'You are editing solo right now'}
          </span>
        </article>

        <article style={styles.statusCard}>
          <span style={styles.statusLabel}>Draft</span>
          <strong style={styles.statusValue}>
            {runtime.submissionId ?? 'Preparing session'}
          </strong>
          <span style={styles.statusCaption}>
            {isReady ? 'Local draft storage is ready' : 'Loading local draft storage'}
          </span>
        </article>
      </section>

      <section style={styles.participantSection}>
        <div style={styles.participantHeader}>
          <h2 style={styles.participantTitle}>Who is here</h2>
          {runtime.pendingActions > 0 && (
            <button onClick={() => void runtime.flushPendingActions()} style={styles.buttonSecondary}>
              Flush Pending Changes
            </button>
          )}
        </div>
        <div style={styles.participantList}>
          {visibleParticipants.map((participant) => (
            <ParticipantChip key={participant.actorId} participant={participant} currentActorId={collaboration.actorId} />
          ))}
        </div>
      </section>

      {variantKey && (
        <section data-testid="experiment-banner" style={styles.experimentBanner}>
          <div style={styles.experimentMeta}>
            {variantEyebrow ?? 'Experiment variant'}
            <span style={styles.experimentChip}>{variantKey}</span>
          </div>
          <strong style={styles.experimentHeadline}>
            {variantHeadline ?? 'Your onboarding experience is being tailored'}
          </strong>
          <p style={styles.experimentBody}>
            {variantBody ?? 'We are using this session to measure which onboarding copy helps teams finish faster.'}
          </p>
        </section>
      )}

      <DfeStepIndicator
        steps={visibleSteps}
        currentIndex={currentIndex}
        onStepClick={stepper.jumpTo}
      />

      <div style={styles.stepContent}>
        <h2>{currentStep?.step.title}</h2>

        <DfeFormRenderer
          fields={stepFields}
          values={sync.values}
          onFieldChange={(key, value) => {
            void sync.setFieldValue(key, value)
          }}
          errors={errors}
          renderField={(props) => (
            <ExampleFieldRenderer
              {...props}
              apiBaseUrl={API_URL}
              values={sync.values}
            />
          )}
        />

        {runtime.error && <p style={styles.error}>{runtime.error}</p>}

        <div style={styles.nav}>
          {canGoBack && (
            <button onClick={stepper.goBack} style={styles.buttonSecondary}>
              Back
            </button>
          )}
          <button
            onClick={() => void handleNext()}
            disabled={runtime.isSubmitting || !isReady}
            style={styles.button}
          >
            {runtime.isSubmitting
              ? 'Submitting...'
              : isLastStep
                ? runtime.isOffline
                  ? 'Queue Submission'
                  : 'Submit'
                : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ParticipantChip({
  participant,
  currentActorId,
}: {
  participant: SyncPresence
  currentActorId: string
}) {
  return (
    <div data-testid="participant-chip" style={styles.participantChip}>
      <span
        aria-hidden="true"
        style={{
          ...styles.participantDot,
          background: participant.color ?? '#2563eb',
        }}
      />
      <div>
        <div style={styles.participantName}>
          {participant.displayName}
          {participant.actorId === currentActorId ? ' (You)' : ''}
        </div>
        <div style={styles.participantMeta}>
          {participant.activeFieldKey
            ? `Editing ${participant.activeFieldKey}`
            : participant.state === 'idle'
              ? 'Idle'
              : 'Viewing form'}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 840,
    margin: '2rem auto',
    padding: '0 1rem 3rem',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'grid',
    gap: '1.25rem',
    alignItems: 'start',
    marginBottom: '1.5rem',
  },
  title: { marginBottom: '0.5rem' },
  description: { color: '#475569', marginBottom: 0 },
  sessionCard: {
    padding: '1rem 1.1rem',
    borderRadius: 16,
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
  },
  sessionMeta: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748b',
    marginBottom: '0.35rem',
  },
  sessionValue: {
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '0.6rem',
  },
  shareRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    alignItems: 'center',
  },
  shareUrl: {
    flex: '1 1 360px',
    display: 'block',
    padding: '0.55rem 0.7rem',
    borderRadius: 10,
    background: '#e2e8f0',
    color: '#0f172a',
    fontSize: '0.85rem',
    overflowX: 'auto',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1.25rem',
  },
  statusCard: {
    padding: '1rem 1.1rem',
    borderRadius: 16,
    border: '1px solid #dbeafe',
    background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
    boxShadow: '0 10px 24px rgba(37, 99, 235, 0.08)',
  },
  statusLabel: {
    display: 'block',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748b',
    marginBottom: '0.4rem',
  },
  statusValue: {
    display: 'block',
    color: '#0f172a',
    marginBottom: '0.2rem',
  },
  statusCaption: {
    color: '#475569',
    fontSize: '0.92rem',
  },
  participantSection: {
    marginBottom: '1.5rem',
    padding: '1rem 1.1rem',
    borderRadius: 16,
    background: '#fff7ed',
    border: '1px solid #fdba74',
  },
  participantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '0.85rem',
  },
  participantTitle: {
    margin: 0,
    fontSize: '1rem',
    color: '#9a3412',
  },
  participantList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  participantChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 0.85rem',
    borderRadius: 999,
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #fed7aa',
  },
  participantDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    flexShrink: 0,
  },
  participantName: {
    fontWeight: 700,
    color: '#431407',
  },
  participantMeta: {
    fontSize: '0.85rem',
    color: '#9a3412',
  },
  experimentBanner: {
    marginBottom: '1.5rem',
    padding: '1rem 1.25rem',
    borderRadius: 16,
    background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
    border: '1px solid #bfdbfe',
    boxShadow: '0 10px 30px rgba(37, 99, 235, 0.08)',
  },
  experimentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#1d4ed8',
    marginBottom: '0.45rem',
  },
  experimentChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.15rem 0.55rem',
    borderRadius: 999,
    background: '#dbeafe',
    color: '#1e3a8a',
  },
  experimentHeadline: {
    display: 'block',
    fontSize: '1rem',
    color: '#0f172a',
    marginBottom: '0.35rem',
  },
  experimentBody: {
    margin: 0,
    color: '#334155',
  },
  stepContent: { marginTop: '2rem' },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '2rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 700,
  },
  buttonSecondary: {
    padding: '0.75rem 1.5rem',
    background: '#e2e8f0',
    color: '#0f172a',
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  error: { color: '#b91c1c', marginTop: '1rem' },
  completionCard: {
    padding: '1.5rem',
    borderRadius: 20,
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
  },
  completionMeta: {
    color: '#475569',
  },
}

export default App
