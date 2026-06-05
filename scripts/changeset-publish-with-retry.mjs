import { spawnSync } from 'node:child_process'

const maxAttempts = Number(process.env.DFE_PUBLISH_MAX_ATTEMPTS ?? 4)
const baseDelayMs = Number(process.env.DFE_PUBLISH_RETRY_DELAY_MS ?? 30000)

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function isRateLimitError(text) {
  return text.includes('E429') || text.includes('429 Too Many Requests') || text.toLowerCase().includes('rate limited')
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = spawnSync('changeset', ['publish'], {
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env: process.env,
  })

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status === 0) {
    process.exit(0)
  }

  const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const canRetry = attempt < maxAttempts && isRateLimitError(combinedOutput)

  if (!canRetry) {
    process.exit(result.status ?? 1)
  }

  const delayMs = baseDelayMs * 2 ** (attempt - 1)
  console.error(`Publish hit npm rate limiting. Retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 1}/${maxAttempts})...`)
  sleep(delayMs)
}

process.exit(1)
