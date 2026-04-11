import { describe, expect, it, vi } from 'vitest'
import { createRemoteSyncTransport, type EventSourceLike, type SyncTransportEvent } from '../src/sync'

class FakeEventSource implements EventSourceLike {
  listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>()

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
    this.listeners.get(type)?.delete(listener)
  }

  close(): void {
    this.listeners.clear()
  }

  emit(type: string, data: unknown) {
    const event = { data: JSON.stringify(data) } as MessageEvent<string>
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event)
    }
  }
}

describe('createRemoteSyncTransport', () => {
  it('joins, buffers the initial snapshot, and forwards streamed events', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/join')) {
        return new Response(JSON.stringify({
          latestSequence: 4,
          snapshot: {
            sessionId: 'session-1',
            actorId: 'actor-1',
            lamport: 0,
            values: { firstName: 'Ada' },
            fieldVersions: {},
            operations: [],
            participants: {},
            pendingMutations: [],
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url.includes('/snapshot') && init?.method === 'GET') {
        return new Response(JSON.stringify({
          snapshot: {
            sessionId: 'session-1',
            actorId: 'actor-1',
            lamport: 1,
            values: { firstName: 'Grace' },
            fieldVersions: {},
            operations: [],
            participants: {},
            pendingMutations: [],
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const source = new FakeEventSource()
    const transport = createRemoteSyncTransport({
      baseUrl: 'http://127.0.0.1:3002/api/dfe/collab/',
      fetchFn: fetchFn as typeof fetch,
      eventSourceFactory: () => source,
      headers: { 'x-user-id': 'demo-user' },
      query: { tenantId: 'demo-tenant', userId: 'demo-user' },
      formId: 'form-1',
      versionId: 'version-1',
      displayName: 'Owner',
    })

    await transport.connect({
      sessionId: 'session-1',
      actorId: 'actor-1',
    })

    const events: SyncTransportEvent[] = []
    transport.subscribe((event) => {
      events.push(event)
    })

    source.emit('message', {
      sequence: 5,
      event: {
        kind: 'operation',
        operation: {
          id: 'op-1',
          sessionId: 'session-1',
          actorId: 'actor-2',
          type: 'field:set',
          fieldKey: 'firstName',
          value: 'Grace',
          lamport: 1,
          clientTimestamp: 1,
        },
      },
    })

    await transport.publish({
      kind: 'snapshot_request',
      actorId: 'actor-1',
      requestedAt: Date.now(),
    })

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/session-1/join'),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(events[0]).toMatchObject({
      kind: 'snapshot',
      snapshot: expect.objectContaining({
        values: { firstName: 'Ada' },
      }),
    })
    expect(events[1]).toMatchObject({
      kind: 'operation',
      operation: expect.objectContaining({
        value: 'Grace',
      }),
    })
    expect(events[2]).toMatchObject({
      kind: 'snapshot',
      snapshot: expect.objectContaining({
        values: { firstName: 'Grace' },
      }),
    })
  })
})
