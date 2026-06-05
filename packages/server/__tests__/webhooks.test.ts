import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebhookConfig } from '@dmc--98/dfe-core'
import { fireWebhooks } from '../src/webhooks'

function webhook(overrides: Partial<WebhookConfig> = {}): WebhookConfig {
  return {
    id: 'wh-1',
    url: 'https://example.test/hook',
    events: ['submission.completed'],
    ...overrides,
  }
}

describe('fireWebhooks', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete (globalThis as any).fetch
  })

  it('invokes the resolved global fetch when no fetchFn is provided', async () => {
    const globalFetch = vi.fn().mockResolvedValue({ status: 200, ok: true })
    ;(globalThis as any).fetch = globalFetch

    const results = await fireWebhooks(
      [webhook()],
      'submission.completed',
      { foo: 'bar' },
    )

    expect(globalFetch).toHaveBeenCalledTimes(1)
    const [url, init] = globalFetch.mock.calls[0]
    expect(url).toBe('https://example.test/hook')
    expect(init.method).toBe('POST')
    expect(init.signal).toBeDefined()
    expect(results[0]).toMatchObject({ webhookId: 'wh-1', success: true, statusCode: 200 })
  })

  it('uses the provided fetchFn over the global', async () => {
    const globalFetch = vi.fn().mockResolvedValue({ status: 500, ok: false })
    ;(globalThis as any).fetch = globalFetch
    const customFetch = vi.fn().mockResolvedValue({ status: 200, ok: true })

    await fireWebhooks([webhook({ retryCount: 0 })], 'submission.completed', {}, customFetch)

    expect(customFetch).toHaveBeenCalledTimes(1)
    expect(globalFetch).not.toHaveBeenCalled()
  })

  it('throws a clear error when no fetch implementation is available', async () => {
    delete (globalThis as any).fetch

    await expect(
      fireWebhooks([webhook()], 'submission.completed', {}),
    ).rejects.toThrow(/requires a fetch implementation/)
  })
})
