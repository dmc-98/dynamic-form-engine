#!/usr/bin/env node
import assert from 'node:assert/strict'

const defaults = {
  owner: 'dmc-98',
  repo: 'dynamic-form-engine',
  description: 'Configuration-driven TypeScript form engine for multi-step workflow forms, DAG dependencies, React, serverless, Prisma, and Drizzle.',
  homepage: 'https://dmc-98.github.io/dynamic-form-engine/',
  topics: [
    'typescript',
    'react',
    'forms',
    'form-builder',
    'dynamic-forms',
    'json-forms',
    'workflow',
    'prisma',
    'drizzle',
    'serverless',
  ],
}

const args = parseArgs(process.argv.slice(2))
const owner = args.owner ?? defaults.owner
const repo = args.repo ?? defaults.repo
const dryRun = args.dryRun ?? false
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN

const repoPayload = {
  description: args.description ?? defaults.description,
  homepage: args.homepage ?? defaults.homepage,
  has_discussions: true,
}

const topicsPayload = {
  names: args.topics ?? defaults.topics,
}

if (dryRun) {
  console.log(JSON.stringify({ owner, repo, repoPayload, topicsPayload }, null, 2))
  process.exit(0)
}

assert.ok(
  token,
  'Set GITHUB_TOKEN or GH_TOKEN with repo administration access before running this command.',
)

await githubRequest(`/repos/${owner}/${repo}`, {
  method: 'PATCH',
  body: repoPayload,
})

await githubRequest(`/repos/${owner}/${repo}/topics`, {
  method: 'PUT',
  body: topicsPayload,
})

console.log(`Configured GitHub repo metadata for ${owner}/${repo}.`)

async function githubRequest(path, options) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(options.body),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitHub API ${options.method} ${path} failed with ${response.status}: ${body}`)
  }

  return response.json()
}

function parseArgs(argv) {
  const parsed = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--') {
      continue
    }

    if (arg === '--dry-run') {
      parsed.dryRun = true
      continue
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`)
    }

    const key = arg.slice(2)
    const value = argv[index + 1]

    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }

    index += 1

    if (key === 'topics') {
      parsed.topics = value.split(',').map(topic => topic.trim()).filter(Boolean)
      continue
    }

    parsed[key] = value
  }

  return parsed
}
