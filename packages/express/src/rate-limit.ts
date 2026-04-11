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
  /** Function to extract a key from the request (default: req.ip) */
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
}

interface TokenBucketState {
  tokens: number
  resetAt: number
}

export function createMemoryRateLimitStore(): RateLimitStore {
  const buckets = new Map<string, TokenBucketState>()

  return {
    take(key, options) {
      const now = options.now
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
    } catch (_error) {
      next()
    }
  }
}
