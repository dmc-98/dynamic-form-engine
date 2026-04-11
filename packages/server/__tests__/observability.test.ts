import { describe, expect, it, vi } from 'vitest'
import {
  createInMemorySpanExporter,
  createOpenTelemetryTracer,
  createTracer,
  createTracingMiddleware,
} from '../src/observability'

describe('createInMemorySpanExporter', () => {
  it('stores exported spans and can clear them', () => {
    const exporter = createInMemorySpanExporter()
    const spans = [
      {
        traceId: 'trace-1',
        spanId: 'span-1',
        name: 'http.request',
        kind: 'server' as const,
        startTime: 1,
        endTime: 2,
        attributes: {},
        status: 'ok' as const,
        events: [],
        children: [],
      },
    ]

    exporter.export(spans)
    expect(exporter.getFinishedSpans()).toEqual(spans)

    exporter.clear()
    expect(exporter.getFinishedSpans()).toEqual([])
  })
})

describe('createOpenTelemetryTracer', () => {
  it('records nested spans and exports them on completion', async () => {
    const exporter = createInMemorySpanExporter()
    const tracer = createOpenTelemetryTracer({
      serviceName: 'dfe-server-test',
      exporter,
    })

    const root = tracer.startSpan('root', { feature: 'observability' })
    const child = tracer.startSpan('child', { step: 'intro' }, { parentSpan: root })
    tracer.addEvent(child, 'db.query', { table: 'dfe_submissions' })
    tracer.endSpan(child)

    const aliasTracer = createTracer()
    const aliasSpan = aliasTracer.startSpan('alias-root')
    aliasTracer.endSpan(aliasSpan)
    expect(aliasTracer.getTraces()).toHaveLength(1)

    const result = await tracer.withSpan('wrapped', { feature: 'analytics' }, async (span) => {
      tracer.addEvent(span, 'cache.hit')
      return 'ok'
    })

    expect(result).toBe('ok')

    await expect(
      tracer.withSpan('wrapped-error', undefined, () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    tracer.endSpan(root)

    const traces = tracer.getTraces()
    expect(traces).toHaveLength(1)
    expect(traces[0].name).toBe('root')
    expect(traces[0].attributes['service.name']).toBe('dfe-server-test')
    expect(traces[0].children[0]).toMatchObject({
      name: 'child',
      parentSpanId: root.spanId,
      attributes: expect.objectContaining({
        step: 'intro',
      }),
    })
    expect(traces[0].children[0].events).toEqual([
      expect.objectContaining({
        name: 'db.query',
        attributes: { table: 'dfe_submissions' },
      }),
    ])

    const exportedNames = exporter.getFinishedSpans().map((span) => span.name)
    expect(exportedNames).toEqual(expect.arrayContaining([
      'child',
      'wrapped',
      'wrapped-error',
      'root',
    ]))

    const errorSpan = exporter.getFinishedSpans().find((span) => span.name === 'wrapped-error')
    expect(errorSpan).toMatchObject({
      status: 'error',
      events: [
        expect.objectContaining({
          name: 'exception',
          attributes: expect.objectContaining({
            'exception.message': 'boom',
          }),
        }),
      ],
    })

    tracer.clearTraces()
    expect(tracer.getTraces()).toEqual([])
  })
})

describe('createTracingMiddleware', () => {
  it('creates a server span from request metadata and traceparent headers', () => {
    const tracer = createOpenTelemetryTracer()
    let finishHandler: (() => void) | undefined
    const req: any = {
      method: 'POST',
      path: '/dfe/forms',
      originalUrl: '/dfe/forms?draft=0',
      route: { path: '/dfe/forms' },
      headers: {
        'user-agent': 'vitest',
        traceparent: '00-1234567890abcdef1234567890abcdef-1111111111111111-01',
      },
    }
    const res: any = {
      statusCode: 201,
      json(data: unknown) {
        return data
      },
      on(event: string, handler: () => void) {
        if (event === 'finish') {
          finishHandler = handler
        }
      },
    }
    const next = vi.fn()

    createTracingMiddleware(tracer)(req, res, next)
    res.json({ success: true, id: 'sub-1' })
    finishHandler?.()

    expect(next).toHaveBeenCalled()
    expect(req.dfeSpan).toBeDefined()
    expect(req.dfeSpan.traceId).toBe('1234567890abcdef1234567890abcdef')
    expect(req.dfeSpan.parentSpanId).toBe('1111111111111111')
    expect(req.dfeSpan.kind).toBe('server')
    expect(req.dfeSpan.attributes).toMatchObject({
      'http.method': 'POST',
      'http.route': '/dfe/forms',
      'http.target': '/dfe/forms?draft=0',
      'http.user_agent': 'vitest',
      'http.status_code': 201,
      'http.response_size': JSON.stringify({ success: true, id: 'sub-1' }).length,
    })
    expect(req.dfeSpan.endTime).toBeTypeOf('number')
  })

  it('marks the span as error when a request finishes with a 5xx response', () => {
    const tracer = createOpenTelemetryTracer()
    let finishHandler: (() => void) | undefined
    const req: any = {
      method: 'GET',
      path: '/dfe/analytics',
      url: '/dfe/analytics',
      headers: {},
    }
    const res: any = {
      statusCode: 503,
      send(data: unknown) {
        return data
      },
      on(event: string, handler: () => void) {
        if (event === 'finish') {
          finishHandler = handler
        }
      },
    }

    createTracingMiddleware(tracer)(req, res, vi.fn())
    res.send('service unavailable')
    finishHandler?.()

    expect(req.dfeSpan.status).toBe('error')
    expect(req.dfeSpan.attributes['http.status_code']).toBe(503)
    expect(req.dfeSpan.attributes['http.response_size']).toBe('service unavailable'.length)
  })
})
