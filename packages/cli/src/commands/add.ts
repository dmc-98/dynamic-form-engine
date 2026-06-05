import { Command } from 'commander'
import chalk from 'chalk'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { ORG_SCOPE } from '../constants'
import { getModulePackages } from '../scaffold-packages'
import { getDrizzleSchemaContent, getPrismaSchemaContent } from '../migration-templates'

// ─── Template Registry ──────────────────────────────────────────────────────

interface Template {
  description: string
  files: Array<{
    targetPath: string
    content: string
  }>
  packages: string[]
  devPackages?: string[]
}

function getTemplates(): Record<string, Template> {
  return {
    'prisma-schema': {
      description: 'Prisma schema for DFE tables',
      packages: getModulePackages('prisma-schema'),
      files: [
        {
          targetPath: 'prisma/dfe-schema.prisma',
          content: getPrismaSchemaContent(),
        },
      ],
    },
    'drizzle-schema': {
      description: 'Drizzle ORM schema for DFE tables',
      packages: getModulePackages('drizzle-schema'),
      files: [
        {
          targetPath: 'src/db/dfe-schema.ts',
          content: getDrizzleSchemaContent(),
        },
      ],
    },
    'be-utils': {
      description: 'Backend utilities (Express router setup + adapter wiring)',
      packages: getModulePackages('be-utils'),
      files: [
        {
          targetPath: 'src/routes/dfe.ts',
          content: getExpressRouteContent(),
        },
      ],
    },
    'fe-hooks': {
      description: 'React hooks and optional default components',
      packages: getModulePackages('fe-hooks'),
      files: [
        {
          targetPath: 'src/hooks/useDfe.ts',
          content: getReactHooksContent(),
        },
        {
          targetPath: 'src/components/DfeForm.tsx',
          content: getReactComponentContent(),
        },
      ],
    },
  }
}

// ─── Add Command ────────────────────────────────────────────────────────────

export const addCommand = new Command('add')
  .description('Add a DFE module to your project')
  .argument('<module>', 'Module to add: prisma-schema, drizzle-schema, be-utils, fe-hooks')
  .option('-p, --path <path>', 'Target directory for generated files', '.')
  .action(async (moduleName: string, opts) => {
    const templates = getTemplates()
    const template = templates[moduleName]

    if (!template) {
      console.error(chalk.red(`Unknown module: ${moduleName}`))
      console.error()
      console.error('Available modules:')
      for (const [name, t] of Object.entries(templates)) {
        console.error(`  ${chalk.cyan(name)} — ${t.description}`)
      }
      process.exit(1)
    }

    const targetDir = resolve(opts.path)
    console.log(chalk.blue(`⚡ Adding ${moduleName}...`))
    console.log()

    // Write template files
    for (const file of template.files) {
      const fullPath = join(targetDir, file.targetPath)
      const dir = dirname(fullPath)

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      if (existsSync(fullPath)) {
        console.log(chalk.yellow('  ⚠'), `${file.targetPath} already exists, skipping`)
      } else {
        writeFileSync(fullPath, file.content)
        console.log(chalk.green('  ✓'), `Created ${file.targetPath}`)
      }
    }

    // Print install instructions
    console.log()
    console.log(chalk.blue('📦 Install required packages:'))
    console.log()
    console.log(`  npm install ${template.packages.join(' ')}`)
    if (template.devPackages?.length) {
      console.log(`  npm install -D ${template.devPackages.join(' ')}`)
    }
    console.log()
    console.log(chalk.green(`✅ ${moduleName} added successfully!`))
    console.log()
  })

// ─── Template Content Functions ─────────────────────────────────────────────

function getExpressRouteContent(): string {
  return `// Dynamic Form Engine — Express Routes
// Mount this router in your Express app.

import { createDfeRouter } from '${ORG_SCOPE}/dfe-express'
import type { DatabaseAdapter } from '${ORG_SCOPE}/dfe-server'

/**
 * Create and configure the DFE Express router.
 *
 * @param db - Your DatabaseAdapter instance (PrismaDatabaseAdapter or DrizzleDatabaseAdapter)
 *
 * Usage in your app:
 * \`\`\`ts
 * import express from 'express'
 * import { PrismaDatabaseAdapter } from '${ORG_SCOPE}/dfe-prisma'
 * import { createDfeRoutes } from './routes/dfe'
 *
 * const app = express()
 * const prisma = new PrismaClient()
 * const db = new PrismaDatabaseAdapter(prisma)
 *
 * app.use(express.json())
 * app.use('/api', createDfeRoutes(db))
 * \`\`\`
 */
export function createDfeRoutes(db: DatabaseAdapter) {
  return createDfeRouter({
    db,
    getUserId: (req) => {
      // TODO: Extract user ID from your auth middleware
      return (req as any).user?.id ?? 'anonymous'
    },
    prefix: '/dfe',
  })
}
`
}

function getReactHooksContent(): string {
  return `// Dynamic Form Engine — React Hooks
// Pre-configured hooks for your application.

export {
  useFormEngine,
  useFormStepper,
  useFormRuntime,
  useDynamicOptions,
} from '${ORG_SCOPE}/dfe-react'

export type {
  UseFormEngineOptions,
  UseFormStepperOptions,
  UseFormRuntimeOptions,
  UseDynamicOptionsConfig,
} from '${ORG_SCOPE}/dfe-react'

// Tip: Import the default components if you want quick prototyping:
// import { DfeFormRenderer, DfeStepIndicator } from '${ORG_SCOPE}/dfe-react/components'
`
}

function getReactComponentContent(): string {
  return `// Dynamic Form Engine — Example Form Component
// A complete multi-step form using DFE hooks.

import React, { useEffect } from 'react'
import { useFormEngine, useFormStepper, useFormRuntime } from '${ORG_SCOPE}/dfe-react'
import type { FormField, FormStep } from '${ORG_SCOPE}/dfe-react'

interface DfeFormProps {
  fields: FormField[]
  steps: FormStep[]
  formId: string
  versionId: string
  apiBaseUrl: string
  onComplete?: () => void
}

export function DfeForm({
  fields, steps, formId, versionId, apiBaseUrl, onComplete,
}: DfeFormProps) {
  const engine = useFormEngine({ fields })
  const stepper = useFormStepper({ steps, engine: engine.engine })
  const runtime = useFormRuntime({ baseUrl: apiBaseUrl, formId, versionId })

  // Create submission on mount
  useEffect(() => {
    runtime.createSubmission()
  }, [])

  const currentFields = engine.visibleFields.filter(
    f => f.stepId === stepper.currentStep?.step.id
  )

  const handleNext = async () => {
    const stepId = stepper.currentStep?.step.id
    if (!stepId) return

    // Validate current step
    const validation = engine.validateStep(stepId)
    if (!validation.success) {
      console.error('Validation errors:', validation.errors)
      return
    }

    // Submit step to backend
    const result = await runtime.submitStep(stepId, engine.values)
    if (result.success) {
      stepper.markComplete(stepId)

      if (stepper.isLastStep) {
        await runtime.completeSubmission()
        onComplete?.()
      } else {
        stepper.goNext()
      }
    }
  }

  return (
    <div>
      <h2>{stepper.currentStep?.step.title}</h2>
      <p>Step {stepper.progress.current} of {stepper.progress.total}</p>

      {currentFields.map(field => (
        <div key={field.key} style={{ marginBottom: '1rem' }}>
          <label>{field.label}{field.required && ' *'}</label>
          <input
            type="text"
            value={(engine.values[field.key] as string) ?? ''}
            onChange={e => engine.setFieldValue(field.key, e.target.value)}
          />
        </div>
      ))}

      {runtime.error && <p style={{ color: 'red' }}>{runtime.error}</p>}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        {stepper.canGoBack && (
          <button onClick={stepper.goBack}>Back</button>
        )}
        <button onClick={handleNext} disabled={runtime.isSubmitting}>
          {stepper.isLastStep ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  )
}
`
}
