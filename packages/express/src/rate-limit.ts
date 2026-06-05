import type { Request, Response, NextFunction } from 'express'

export interface RateLimitStoreResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export interface RateLimitStore {
  take(key: string, options: { now: number; windowMs: number; maxRequests: number }): Promise<RateLimitStoreResult> | RateLimitStoreResult
}

export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests per window */
  maxRequests: number
  /**
   * Function to extract a key from the request (default: req.ip).
   *
   * **Caveat:** `req.ip` is only trustworthy if Express `trust proxy` is
   * configured correctly for your deployment. With a misconfigured proxy
   * setting, clients can spoof their IP via `X-Forwarded-For`, letting them
   * evade or poison rate-limit buckets. Set `app.set('trust proxy', ...)` to
   * match your infrastructure, or supply a keyExtractor based on an
   * authenticated identity.
   */
  keyExtractor?: (req: Request) => string
  /** Callback when rate limit is reached */
  onLimitReached?: (req: Request, res: Response) => void
  /** HTTP status code to return when limit exceeded (default: 429) */
  statusCode?: number
  /** Message to return when limit exceeded */
  message?: string
  /**
   * Backing store used to track buckets.
   * Provide a durable implementation for distributed/serverless environments.
   */
  store?: RateLimitStore
  /**
   * Behavior when the store throws (e.g., a distributed store is unreachable).
   * Defaults to fail-open (the request is allowed and the error is logged) to
   * favor availability. Set `failClosed: true` to respond 503 on store errors
   * instead, favoring protection over availability.
   */
  failClosed?: boolean
}

interface TokenBucketState {
  tokens: number
  resetAt: number
}

export function createMemoryRateLimitStore(): RateLimitStore {
  const buckets = new Map<string, TokenBucketState>()
  // Throttle full-map pruning so we don't scan every bucket on every request.
  let lastPruneAt = 0
  const PRUNE_INTERVAL_MS = 60_000

  // The in-memory store would otherwise grow unbounded as new keys appear. We
  // lazily evict expired buckets (no background timer to keep this footprint-free
  // and serverless-friendly).
  function prune(now: number) {
    if (now - lastPruneAt < PRUNE_INTERVAL_MS) return
    lastPruneAt = now
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) {
        buckets.delete(key)
      }
    }
  }

  return {
    take(key, options) {
      const now = options.now
      prune(now)
      let bucket = buckets.get(key)

      if (!bucket || now > bucket.resetAt) {
        bucket = {
          tokens: options.maxRequests,
          resetAt: now + options.windowMs,
        }
        buckets.set(key, bucket)
      }

      if (bucket.tokens > 0) {
        bucket.tokens -= 1
        return {
          allowed: true,
          remaining: bucket.tokens,
          resetAt: bucket.resetAt,
        }
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.resetAt,
      }
    },
  }
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyExtractor = (req: Request) => req.ip ?? 'unknown',
    onLimitReached,
    statusCode = 429,
    message = 'Too many requests, please try again later',
    store = createMemoryRateLimitStore(),
    failClosed = false,
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyExtractor(req)
      const result = await store.take(key, {
        now: Date.now(),
        windowMs,
        maxRequests,
      })

      if (result.allowed) {
        next()
        return
      }

      res.setHeader('Retry-After', Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)))
      onLimitReached?.(req, res)
      res.status(statusCode).json({ error: message })
    } catch (error) {
      // Store error: log it, then either fail open (default, availability) or
      // fail closed (respond 503, protection) depending on configuration.
      console.error('[DFE] Rate limit store error:', error)
      if (failClosed) {
        res.status(503).json({ error: 'Rate limiting temporarily unavailable' })
        return
      }
      next()
    }
  }
}
