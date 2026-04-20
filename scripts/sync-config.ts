#!/usr/bin/env tsx
/**
 * sync-config.ts
 *
 * Reads dfe.config.ts and propagates orgScope, githubOrg, etc.
 * across every package.json, VitePress config, README, and GitHub workflow.
 *
 * Usage:  pnpm run sync-config
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// --------------- load config ---------------
const ROOT = join(__dirname, '..')
// We eval the config inline to avoid needing a build step
const configSrc = readFileSync(join(ROOT, 'dfe.config.ts'), 'utf-8')
const match = configSrc.match(/orgScope:\s*'([^']+)'/)
const orgScope = match?.[1] ?? '@dmc--98'
const ghOrgMatch = configSrc.match(/githubOrg:\s*'([^']+)'/)
const githubOrg = ghOrgMatch?.[1] ?? 'snarjun98'
const ghRepoMatch = configSrc.match(/githubRepo:\s*'([^']+)'/)
const githubRepo = ghRepoMatch?.[1] ?? 'dynamic-form-engine'
const docsBaseMatch = configSrc.match(/docsBasePath:\s*'([^']+)'/)
const docsBasePath = docsBaseMatch?.[1] ?? '/dynamic-form-engine/'

console.log(`\n🔧 Syncing config across monorepo...`)
console.log(`   orgScope:     ${orgScope}`)
console.log(`   githubOrg:    ${githubOrg}`)
console.log(`   githubRepo:   ${githubRepo}`)
console.log(`   docsBasePath: ${docsBasePath}\n`)

// --------------- helpers ---------------
const IGNORE = new Set(['node_modules', '.git', 'dist', '.turbo', '.vitepress/cache', '.vitepress/dist'])

function walk(dir: string, cb: (path: string) => void) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, cb)
    else cb(full)
  }
}

let filesUpdated = 0

function replaceInFile(filePath: string, replacements: [RegExp, string][]) {
  let content = readFileSync(filePath, 'utf-8')
  let changed = false
  for (const [pattern, replacement] of replacements) {
    const next = content.replace(pattern, replacement)
    if (next !== content) {
      content = next
      changed = true
    }
  }
  if (changed) {
    writeFileSync(filePath, content, 'utf-8')
    filesUpdated++
    console.log(`  ✅ ${relative(ROOT, filePath)}`)
  }
}

// --------------- package.json files ---------------
console.log('📦 Updating package.json files...')
walk(ROOT, (fp) => {
  if (!fp.endsWith('package.json')) return
  // skip node_modules (already filtered) and lock file
  if (fp.includes('node_modules')) return

  replaceInFile(fp, [
    // Update scoped package names:  "@old-scope/dfe-*" → "@new-scope/dfe-*"
    [/"@[\w-]+\/(dfe[\w-]*)"/g, `"${orgScope}/$1"`],
    // Update GitHub URLs
    [/github\.com\/[\w-]+\/dynamic-form-engine/g, `github.com/${githubOrg}/${githubRepo}`],
  ])
})

// --------------- VitePress config ---------------
console.log('\n📝 Updating VitePress config...')
walk(join(ROOT, 'docs'), (fp) => {
  if (!fp.endsWith('.ts') && !fp.endsWith('.md')) return
  replaceInFile(fp, [
    [/"@[\w-]+\/(dfe[\w-]*)"/g, `"${orgScope}/$1"`],
    [/@[\w-]+\/(dfe[\w-]*)/g, `${orgScope}/$1`],
    [/github\.com\/[\w-]+\/dynamic-form-engine/g, `github.com/${githubOrg}/${githubRepo}`],
  ])
})

// --------------- Source files ---------------
console.log('\n📂 Updating source files...')
const srcExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs'])
walk(join(ROOT, 'packages'), (fp) => {
  const ext = fp.substring(fp.lastIndexOf('.'))
  if (!srcExtensions.has(ext)) return
  replaceInFile(fp, [
    [/"@[\w-]+\/(dfe[\w-]*)"/g, `"${orgScope}/$1"`],
    [/@[\w-]+\/(dfe[\w-]*)/g, `${orgScope}/$1`],
  ])
})

// --------------- Examples ---------------
console.log('\n🧪 Updating examples...')
walk(join(ROOT, 'examples'), (fp) => {
  replaceInFile(fp, [
    [/"@[\w-]+\/(dfe[\w-]*)"/g, `"${orgScope}/$1"`],
    [/@[\w-]+\/(dfe[\w-]*)/g, `${orgScope}/$1`],
    [/github\.com\/[\w-]+\/dynamic-form-engine/g, `github.com/${githubOrg}/${githubRepo}`],
  ])
})

// --------------- GitHub Actions ---------------
console.log('\n⚙️  Updating GitHub Actions...')
walk(join(ROOT, '.github'), (fp) => {
  if (!fp.endsWith('.yml') && !fp.endsWith('.yaml')) return
  replaceInFile(fp, [
    [/github\.com\/[\w-]+\/dynamic-form-engine/g, `github.com/${githubOrg}/${githubRepo}`],
  ])
})

// --------------- README ---------------
console.log('\n📖 Updating README...')
const readmePath = join(ROOT, 'README.md')
try {
  replaceInFile(readmePath, [
    [/@[\w-]+\/(dfe[\w-]*)/g, `${orgScope}/$1`],
    [/github\.com\/[\w-]+\/dynamic-form-engine/g, `github.com/${githubOrg}/${githubRepo}`],
  ])
} catch { /* README may not exist yet */ }

console.log(`\n✨ Done! Updated ${filesUpdated} file(s).\n`)
