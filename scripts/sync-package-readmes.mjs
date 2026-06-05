import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const packagesRoot = join(repoRoot, 'packages')
const docsPackagesRoot = join(repoRoot, 'docs', 'packages')

const repoUrl = resolveRepositoryUrl()
const docsUrl = `${repoUrl}/blob/main/docs`
const issuesUrl = `${repoUrl}/issues`

for (const dirent of readdirSorted(packagesRoot)) {
  const packageDir = join(packagesRoot, dirent)
  const manifestPath = join(packageDir, 'package.json')

  if (!existsSync(manifestPath)) {
    continue
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const docPath = join(docsPackagesRoot, `${dirent}.md`)
  const readmePath = join(packageDir, 'README.md')

  const content = existsSync(docPath)
    ? buildDocsBackedReadme(readFileSync(docPath, 'utf8'), dirent)
    : buildFallbackReadme(manifest, dirent)

  writeFileSync(readmePath, `${content.trim()}\n`)
}

function readdirSorted(dir) {
  return execSync(`find "${dir}" -mindepth 1 -maxdepth 1 -type d -exec basename {} \\; | sort`, {
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean)
}

function resolveRepositoryUrl() {
  try {
    const remote = execSync('git remote get-url origin', {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim()

    if (remote.startsWith('git@github.com:')) {
      return `https://github.com/${remote.slice('git@github.com:'.length).replace(/\.git$/, '')}`
    }

    if (remote.startsWith('https://github.com/')) {
      return remote.replace(/\.git$/, '')
    }
  } catch {}

  return 'https://github.com/dmc-98/dynamic-form-engine'
}

function buildDocsBackedReadme(docContent, packageDirName) {
  const transformed = docContent
    .replace(/\]\(\/packages\/([^)]+)\)/g, `](${docsUrl}/packages/$1.md)`)
    .replace(/\]\(\/guide\/([^)]+)\)/g, `](${docsUrl}/guide/$1.md)`)
    .replace(/\]\(\/api\/([^)]+)\)/g, `](${docsUrl}/api/$1.md)`)
    .replace(/\]\(\/\)/g, `](${docsUrl}/index.md)`)

  return `${transformed}

---

## Links

- Source: [packages/${packageDirName}](${repoUrl}/tree/main/packages/${packageDirName})
- Docs source: [docs/packages/${packageDirName}.md](${docsUrl}/packages/${packageDirName}.md)
- Issues: [${issuesUrl}](${issuesUrl})
`
}

function buildFallbackReadme(manifest, packageDirName) {
  const peerDependencies = Object.keys(manifest.peerDependencies ?? {})
  const relatedPackages = collectRelatedPackages(manifest)
  const installPackages = [manifest.name, ...peerDependencies].join(' ')

  const relatedSection = relatedPackages.length
    ? `## Related Packages

${relatedPackages.map(name => `- \`${name}\``).join('\n')}

`
    : ''

  const peerSection = peerDependencies.length
    ? `Peer dependencies:

${peerDependencies.map(name => `- \`${name}\``).join('\n')}

`
    : ''

  return `# ${manifest.name}

${manifest.description || 'Part of the Dynamic Form Engine monorepo.'}

## Install

\`\`\`bash
npm install ${installPackages}
\`\`\`

${peerSection}## Overview

This package is part of the Dynamic Form Engine monorepo and is published independently so you can adopt only the pieces you need.

${relatedSection}## Links

- Source: [packages/${packageDirName}](${repoUrl}/tree/main/packages/${packageDirName})
- Project README: [README.md](${repoUrl}#readme)
- Docs: [docs](${docsUrl}/index.md)
- Issues: [${issuesUrl}](${issuesUrl})

## License

MIT
`
}

function collectRelatedPackages(manifest) {
  const names = []

  for (const section of ['dependencies', 'peerDependencies', 'devDependencies']) {
    const deps = manifest[section] ?? {}
    for (const depName of Object.keys(deps)) {
      if (depName.startsWith('@dmc--98/')) {
        names.push(depName)
      }
    }
  }

  return [...new Set(names)].filter(name => name !== manifest.name).sort()
}
