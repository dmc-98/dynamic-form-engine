#!/usr/bin/env node
/**
 * Lint the Claude Code plugin + marketplace manifests and bundled skills.
 *
 * Catches the gotchas that make a plugin silently fail to install or load:
 *  - plugin.json / marketplace.json must be valid JSON with required fields
 *  - plugin name must be lowercase kebab-case
 *  - version must be semver
 *  - every marketplace `source` path must resolve to a plugin with a plugin.json
 *  - every bundled SKILL.md must have `name` + a SINGLE-LINE `description`
 *    (a wrapped description makes Claude Code ignore the skill)
 *
 * Exit non-zero on any error so CI fails. Run: `node scripts/lint-plugin-manifests.mjs`
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = join(repoRoot, 'integrations', 'claude-code')

const errors = []
const warnings = []
const err = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+].+)?$/

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    err(`Invalid JSON: ${path} — ${e.message}`)
    return null
  }
}

/** Validate a SKILL.md: must have name + a single-line description in frontmatter. */
function lintSkill(skillMd) {
  const text = readFileSync(skillMd, 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) {
    err(`${skillMd}: missing YAML frontmatter (--- ... ---)`)
    return
  }
  const body = fm[1]
  const nameLine = body.match(/^name:\s*(.+)$/m)
  const descLine = body.match(/^description:\s*(.+)$/m)
  if (!nameLine || !nameLine[1].trim()) err(`${skillMd}: frontmatter missing 'name'`)
  if (!descLine || !descLine[1].trim()) {
    err(`${skillMd}: frontmatter missing 'description'`)
  } else {
    // Detect a wrapped (multi-line) description: a following line that is
    // indented continuation rather than a new 'key:' or end of frontmatter.
    const lines = body.split('\n')
    const idx = lines.findIndex((l) => /^description:/.test(l))
    const next = lines[idx + 1] ?? ''
    if (next && !/^[a-zA-Z_]+:/.test(next) && next.trim() !== '') {
      err(`${skillMd}: 'description' appears to wrap across multiple lines — Claude Code will ignore the skill. Keep it on one line.`)
    }
  }
}

function lintPlugin(pluginDir, declaredName) {
  const manifest = join(pluginDir, '.claude-plugin', 'plugin.json')
  if (!existsSync(manifest)) {
    err(`Plugin at ${pluginDir} is missing .claude-plugin/plugin.json`)
    return
  }
  const json = readJson(manifest)
  if (!json) return
  if (!json.name) err(`${manifest}: missing required 'name'`)
  else if (!NAME_RE.test(json.name)) err(`${manifest}: name "${json.name}" must be lowercase kebab-case`)
  if (json.version && !SEMVER_RE.test(json.version)) err(`${manifest}: version "${json.version}" is not semver`)
  if (!json.version) warn(`${manifest}: no 'version' — Claude Code will use the git SHA (fine for dev, set a version for releases)`)
  if (declaredName && json.name && declaredName !== json.name) {
    warn(`marketplace entry name "${declaredName}" != plugin.json name "${json.name}"`)
  }

  // Lint bundled skills.
  const skillsDir = join(pluginDir, 'skills')
  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir)) {
      const skillMd = join(skillsDir, entry, 'SKILL.md')
      if (existsSync(skillMd)) lintSkill(skillMd)
    }
  }
}

// ── Marketplace ──────────────────────────────────────────────────────────────
const marketplace = join(base, '.claude-plugin', 'marketplace.json')
if (!existsSync(marketplace)) {
  err(`Missing marketplace manifest: ${marketplace}`)
} else {
  const mkt = readJson(marketplace)
  if (mkt) {
    if (!mkt.name) err(`${marketplace}: missing 'name'`)
    else if (!NAME_RE.test(mkt.name)) err(`${marketplace}: name "${mkt.name}" must be lowercase kebab-case`)
    if (!Array.isArray(mkt.plugins) || mkt.plugins.length === 0) {
      err(`${marketplace}: 'plugins' must be a non-empty array`)
    } else {
      for (const p of mkt.plugins) {
        if (!p.name) err(`${marketplace}: a plugin entry is missing 'name'`)
        if (!p.source) { err(`${marketplace}: plugin "${p.name}" missing 'source'`); continue }
        // Only local (relative) sources are resolvable here; remote URLs are skipped.
        if (p.source.startsWith('.') || p.source.startsWith('/')) {
          const pluginDir = resolve(base, p.source)
          if (!existsSync(pluginDir) || !statSync(pluginDir).isDirectory()) {
            err(`${marketplace}: plugin "${p.name}" source "${p.source}" does not resolve to a directory`)
          } else {
            lintPlugin(pluginDir, p.name)
          }
        } else {
          warn(`${marketplace}: plugin "${p.name}" has a remote source "${p.source}" — not validated locally`)
        }
      }
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
for (const w of warnings) console.warn(`⚠️  ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`)
  console.error(`\nPlugin manifest lint: ${errors.length} error(s).`)
  process.exit(1)
}
console.log(`✓ Plugin manifest lint passed${warnings.length ? ` (${warnings.length} warning(s))` : ''}.`)
