import { Command } from 'commander'
import chalk from 'chalk'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ORG_SCOPE } from '../constants'
import { getInitPackages } from '../scaffold-packages'

export const initCommand = new Command('init')
  .description('Initialize a new DFE project with recommended structure')
  .option('--prisma', 'Include Prisma adapter')
  .option('--drizzle', 'Include Drizzle adapter')
  .option('--express', 'Include Express route handlers')
  .option('-d, --dir <path>', 'Target directory', '.')
  .action(async (opts) => {
    const dir = resolve(opts.dir)
    console.log(chalk.blue('⚡ Initializing Dynamic Form Engine project...'))
    console.log()

    // Create directory structure
    const dirs = [
      'src',
      'src/forms',
    ]

    if (opts.express) {
      dirs.push('src/routes')
    }

    for (const d of dirs) {
      const fullPath = join(dir, d)
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true })
        console.log(chalk.green('  ✓'), `Created ${d}/`)
      }
    }

    // Generate package install instructions
    const packages = getInitPackages(opts)

    console.log()
    console.log(chalk.blue('📦 Install these packages:'))
    console.log()
    console.log(`  npm install ${packages.join(' ')}`)
    console.log()

    // Generate a sample form definition
    const sampleForm = `// src/forms/sample-form.ts
// Example form definition for the Dynamic Form Engine
import type { FormField, FormStep } from '${ORG_SCOPE}/dfe-core'

export const sampleFields: FormField[] = [
  {
    id: 'field_name',
    versionId: 'v1',
    key: 'name',
    label: 'Full Name',
    type: 'SHORT_TEXT',
    required: true,
    order: 1,
    stepId: 'step1',
    config: { placeholder: 'Enter your full name' },
  },
  {
    id: 'field_email',
    versionId: 'v1',
    key: 'email',
    label: 'Email Address',
    type: 'EMAIL',
    required: true,
    order: 2,
    stepId: 'step1',
    config: { placeholder: 'you@example.com' },
  },
  {
    id: 'field_role',
    versionId: 'v1',
    key: 'role',
    label: 'Role',
    type: 'SELECT',
    required: true,
    order: 3,
    stepId: 'step2',
    config: {
      mode: 'static',
      options: [
        { label: 'Engineer', value: 'engineer' },
        { label: 'Designer', value: 'designer' },
        { label: 'Manager', value: 'manager' },
      ],
    },
  },
]

export const sampleSteps: FormStep[] = [
  {
    id: 'step1',
    versionId: 'v1',
    title: 'Personal Info',
    order: 1,
  },
  {
    id: 'step2',
    versionId: 'v1',
    title: 'Role Selection',
    order: 2,
  },
]
`

    const formPath = join(dir, 'src/forms/sample-form.ts')
    if (!existsSync(formPath)) {
      writeFileSync(formPath, sampleForm)
      console.log(chalk.green('  ✓'), 'Created src/forms/sample-form.ts')
    }

    console.log()
    console.log(chalk.green('✅ DFE project initialized!'))
    console.log()
    console.log('Next steps:')
    console.log(`  1. Install packages: npm install ${packages.join(' ')}`)
    if (opts.prisma) {
      console.log('  2. Add Prisma schema: npx dfe add prisma-schema')
    }
    if (opts.drizzle) {
      console.log('  2. Add Drizzle schema: npx dfe add drizzle-schema')
    }
    if (opts.express) {
      console.log('  3. Add Express routes: npx dfe add be-utils')
    }
    console.log('  4. Add React hooks: npx dfe add fe-hooks')
    console.log()
  })
