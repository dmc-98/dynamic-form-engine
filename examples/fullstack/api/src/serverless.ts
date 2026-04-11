import http from 'node:http'
import { Readable } from 'node:stream'
import { app } from './serverless-app'

function toRequest(req: http.IncomingMessage): Request {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        headers.append(key, entry)
      }
      continue
    }

    if (typeof value === 'string') {
      headers.set(key, value)
    }
  }

  const origin = `http://${headers.get('host') ?? '127.0.0.1'}`
  const url = new URL(req.url ?? '/', origin)
  const body = req.method === 'GET' || req.method === 'HEAD'
    ? undefined
    : (Readable.toWeb(req) as ReadableStream<Uint8Array>)

  return new Request(url, {
    method: req.method,
    headers,
    body,
    ...(body ? { duplex: 'half' as const } : {}),
  } as RequestInit)
}

async function writeResponse(
  response: Response,
  res: http.ServerResponse,
) {
  res.statusCode = response.status

  response.headers.forEach((value: string, key: string) => {
    res.setHeader(key, value)
  })

  if (!response.body) {
    res.end()
    return
  }

  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    res.write(Buffer.from(value))
  }

  res.end()
}

const port = Number.parseInt(process.env.PORT ?? '3002', 10)

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    const request = toRequest(req)
    const response = await app.fetch(request)
    await writeResponse(response, res)
  } catch (error) {
    res.statusCode = 500
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    }))
  }
})

server.listen(port, () => {
  console.log(`DFE Serverless Example running on http://127.0.0.1:${port}`)
  console.log(`   API routes: http://127.0.0.1:${port}/api/dfe/forms`)
})
