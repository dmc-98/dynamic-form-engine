import type { WebhookConfig, WebhookEvent, FormRuntimeContext } from '@dmc--98/dfe-core'
import { createHmac } from 'crypto'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: number
  data: Record<string, unknown>
}

export interface WebhookResult {
  webhookId: string
  success: boolean
  statusCode?: number
  error?: string
  retryCount: number
}

/**
 * Sign a webhook payload with HMAC-SHA256
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Fire webhooks for a given event.
 * Returns results for each webhook with success/failure info.
 */
export async function fireWebhooks(
  webhooks: WebhookConfig[],
  event: WebhookEvent,
  data: Record<string, unknown>,
  fetchFn?: any,
): Promise<WebhookResult[]> {
  const fetch = fetchFn || (globalThis as any).fetch
  // Fail loudly if there is no usable fetch implementation rather than
  // silently throwing an opaque "fetchFn is not a function" later.
  if (typeof fetch !== 'function') {
    throw new Error(
      '[DFE] fireWebhooks requires a fetch implementation. Pass `fetchFn` explicitly or run on a runtime with global fetch.',
    )
  }
  // SSRF note: webhook.url is operator-configured, not end-user supplied. If you
  // ever expose webhook URL configuration to untrusted users, validate the host
  // (block private/link-local/metadata IP ranges) before calling fetch here.
  const REQUEST_TIMEOUT_MS = 10_000
  const results: WebhookResult[] = []
  const payload: WebhookPayload = { event, timestamp: Date.now(), data }
  const body = JSON.stringify(payload)

  for (const webhook of webhooks) {
    if (!webhook.events.includes(event)) continue

    let lastError: string | undefined
    let statusCode: number | undefined
    const maxRetries = webhook.retryCount ?? 3

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...webhook.headers,
        }
        if (webhook.secret) {
          headers['X-DFE-Signature'] = signWebhookPayload(body, webhook.secret)
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
        let res: { status: number; ok: boolean }
        try {
          res = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body,
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timeout)
        }
        statusCode = res.status
        if (res.ok) {
          results.push({ webhookId: webhook.id, success: true, statusCode, retryCount: attempt })
          lastError = undefined
          break
        }
        lastError = `HTTP ${res.status}`
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
      }
    }

    if (lastError) {
      results.push({ webhookId: webhook.id, success: false, statusCode, error: lastError, retryCount: maxRetries })
    }
  }

  return results
}
