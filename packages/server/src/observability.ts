function randomHex(length: number) {
  let value = ''
  while (value.length < length) {
    value += Math.floor(Math.random() * 16).toString(16)
  }
  return value.slice(0, length)
}

export interface DfeSpanEvent {
  name: string
  timestamp: number
  attributes?: Record<string, unknown>
}

export interface DfeSpan {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  kind: 'internal' | 'server' | 'client'
  startTime: number
  endTime?: number
  attributes: Record<string, unknown>
  status: 'ok' | 'error'
  events: DfeSpanEvent[]
  children: DfeSpan[]
}

export interface DfeSpanExporter {
  export(spans: DfeSpan[]): void | Promise<void>
}

export interface DfeTracer {
  startSpan(name: string, attributes?: Record<string, unknown>, options?: {
    kind?: DfeSpan['kind']
    parentSpan?: DfeSpan
    traceId?: string
  }): DfeSpan
  addEvent(span: DfeSpan, name: string, attributes?: Record<string, unknown>): void
  setStatus(span: DfeSpan, status: DfeSpan['status']): void
  endSpan(span: DfeSpan): void
  withSpan<T>(name: string, attributes: Record<string, unknown> | undefined, run: (span: DfeSpan) => Promise<T> | T): Promise<T>
  getTraces(): DfeSpan[]
  clearTraces(): void
}

export function createInMemorySpanExporter() {
  const spans: DfeSpan[] = []

  return {
    export(batch: DfeSpan[]) {
      spans.push(...batch)
    },
    getFinishedSpans() {
      return spans
    },
    clear() {
      spans.length = 0
    },
  }
}

function parseTraceparent(value: unknown): { traceId?: string; parentSpanId?: string } {
  if (typeof value !== 'string') {
    return {}
  }

  const parts = value.trim().split('-')
  if (parts.length < 4) {
    return {}
  }

  return {
    traceId: parts[1],
    parentSpanId: parts[2],
  }
}

export function createOpenTelemetryTracer(options?: {
  serviceName?: string
  exporter?: DfeSpanExporter
}): DfeTracer {
  const traces: DfeSpan[] = []
  const spanStack: DfeSpan[] = []
  const exporter = options?.exporter
  const serviceName = options?.serviceName ?? 'dynamic-form-engine'

  return {
    startSpan(name, attributes, options) {
      const parentSpan = options?.parentSpan ?? spanStack[spanStack.length - 1]
      const span: DfeSpan = {
        traceId: options?.traceId ?? parentSpan?.traceId ?? randomHex(32),
        spanId: randomHex(16),
        parentSpanId: parentSpan?.spanId,
        name,
        kind: options?.kind ?? 'internal',
        startTime: Date.now(),
        attributes: {
          'service.name': serviceName,
          ...(attributes ?? {}),
        },
        status: 'ok',
        events: [],
        children: [],
      }

      if (parentSpan) {
        parentSpan.children.push(span)
      } else {
        traces.push(span)
      }

      spanStack.push(span)
      return span
    },

    addEvent(span, name, attributes) {
      span.events.push({
        name,
        timestamp: Date.now(),
        attributes,
      })
    },

    setStatus(span, status) {
      span.status = status
    },

    endSpan(span) {
      span.endTime = Date.now()

      const topIndex = spanStack.length - 1
      if (topIndex >= 0 && spanStack[topIndex] === span) {
        spanStack.pop()
      }

      exporter?.export([span])
    },

    async withSpan(name, attributes, run) {
      const span = this.startSpan(name, attributes)

      try {
        const result = await run(span)
        this.endSpan(span)
        return result
      } catch (error) {
        this.setStatus(span, 'error')
        this.addEvent(span, 'exception', {
          'exception.message': error instanceof Error ? error.message : String(error),
        })
        this.endSpan(span)
        throw error
      }
    },

    getTraces() {
      return traces
    },

    clearTraces() {
      traces.length = 0
      spanStack.length = 0
    },
  }
}

export function createTracer(options?: {
  serviceName?: string
  exporter?: DfeSpanExporter
}) {
  return createOpenTelemetryTracer(options)
}

export function createTracingMiddleware(tracer: DfeTracer) {
  return (req: any, res: any, next: any) => {
    const upstream = parseTraceparent(req.headers?.traceparent)
    const span = tracer.startSpan('http.request', {
      'http.method': req.method,
      'http.route': req.route?.path ?? req.path,
      'http.target': req.originalUrl ?? req.url,
      'http.user_agent': req.headers?.['user-agent'],
    }, {
      kind: 'server',
      traceId: upstream.traceId,
    })

    if (upstream.parentSpanId) {
      span.parentSpanId = upstream.parentSpanId
    }

    const originalJson = res.json
    if (originalJson) {
      res.json = function (data: unknown) {
        span.attributes['http.status_code'] = res.statusCode
        span.attributes['http.response_size'] = JSON.stringify(data).length
        return originalJson.call(this, data)
      }
    }

    const originalSend = res.send
    if (originalSend) {
      res.send = function (data: unknown) {
        span.attributes['http.status_code'] = res.statusCode
        if (typeof data === 'string') {
          span.attributes['http.response_size'] = data.length
        }
        return originalSend.call(this, data)
      }
    }

    if (res.on) {
      res.on('finish', () => {
        if (!span.endTime) {
          if (res.statusCode >= 500) {
            tracer.setStatus(span, 'error')
          }
          span.attributes['http.status_code'] = res.statusCode
          tracer.endSpan(span)
        }
      })
    }

    req.dfeSpan = span
    next()
  }
}
