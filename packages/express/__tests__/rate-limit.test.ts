import { describe, expect, it, vi } from 'vitest'
import { createMemoryRateLimitStore, createRateLimiter, type RateLimitStore } from '../src/rate-limit'

describe('createMemoryRateLimitStore', () => {
  it('allows requests until the bucket is exhausted and then resets after the window', async () => {
    const store = createMemoryRateLimitStore()

    expect(store.take('client-1', {
      now: 0,
      windowMs: 1_000,
      maxRequests: 2,
    })).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 1_000,
    })

    expect(store.take('client-1', {
      now: 100,
      windowMs: 1_000,
      maxRequests: 2,
    })).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 1_000,
    })

    expect(store.take('client-1', {
      now: 200,
      windowMs: 1_000,
      maxRequests: 2,
    })).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: 1_000,
    })

    expect(store.take('client-1', {
      now: 1_500,
      windowMs: 1_000,
      maxRequests: 2,
    })).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 2_500,
    })
  })
})

describe('createRateLimiter', () => {
  it('uses the provided store and blocks requests when the store denies them', async () => {
    const store: RateLimitStore = {
      take: vi.fn()
        .mockResolvedValueOnce({ allowed: true, remaining: 0, resetAt: Date.now() + 1_000 })
        .mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 1_000 }),
    }
    const middleware = createRateLimiter({
      windowMs: 1_000,
      maxRequests: 1,
      store,
    })

    const req = { ip: '127.0.0.1' } as any
    const next = vi.fn()
    const res = {
      headers: {} as Record<string, string | number>,
      body: null as unknown,
      statusCode: 200,
      setHeader(key: string, value: string | number) {
        this.headers[key] = value
      },
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(payload: unknown) {
        this.body = payload
        return this
      },
    } as any

    await middleware(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)

    await middleware(req, res, next)

    expect(store.take).toHaveBeenCalledTimes(2)
    expect(res.statusCode).toBe(429)
    expect(res.body).toEqual({
      error: 'Too many requests, please try again later',
    })
    expect(res.headers['Retry-After']).toBeDefined()
  })

  it('falls through when the store throws so requests are not hard-failed', async () => {
    const store: RateLimitStore = {
      take: vi.fn().mockRejectedValue(new Error('store unavailable')),
    }
    const middleware = createRateLimiter({
      windowMs: 1_000,
      maxRequests: 1,
      store,
    })

    const req = { ip: '127.0.0.1' } as any
    const next = vi.fn()
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    await middleware(req, res, next)

    expect(store.take).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.setHeader).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('uses the default unknown key and invokes onLimitReached when blocked', async () => {
    const onLimitReached = vi.fn()
    const middleware = createRateLimiter({
      windowMs: 1_000,
      maxRequests: 1,
      onLimitReached,
    })

    const req = {} as any
    const next = vi.fn()
    const res = {
      headers: {} as Record<string, string | number>,
      body: null as unknown,
      statusCode: 200,
      setHeader(key: string, value: string | number) {
        this.headers[key] = value
      },
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(payload: unknown) {
        this.body = payload
        return this
      },
    } as any

    await middleware(req, res, next)
    await middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(onLimitReached).toHaveBeenCalledTimes(1)
    expect(onLimitReached).toHaveBeenCalledWith(req, res)
    expect(res.statusCode).toBe(429)
    expect(res.body).toEqual({
      error: 'Too many requests, please try again later',
    })
  })
})
