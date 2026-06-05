import { Command } from 'commander'
import chalk from 'chalk'
import { resolve } from 'node:path'
import {
  createMigrationPlan,
  detectMigrationProject,
  generateMigrationScaffold,
  getMigrationCheckStatus,
  hasFailingMigrationChecks,
  runMigrationDoctor,
  type MigrationCheck,
  type MigrationGenerationResult,
  type MigrationPlan,
  type SupportedMigrationAdapter,
} from '../migration-workflow'

function parseAdapterOption(value?: string): SupportedMigrationAdapter | undefined {
  if (!value) {
    return undefined
  }

  if (value === 'prisma' || value === 'drizzle') {
    return value
  }

  throw new Error(`Unsupported adapter "${value}". Use "prisma" or "drizzle".`)
}

function printChecks(checks: MigrationCheck[]): void {
  for (const check of checks) {
    const status = getMigrationCheckStatus(check)
    const icon = status === 'pass'
      ? chalk.green('✓')
      : status === 'warn'
        ? chalk.yellow('!')
        : chalk.red('✕')
    console.log(`  ${icon} ${check.label}: ${check.detail}`)
  }
}

function printPlan(report: MigrationPlan): void {
  console.log(chalk.blue(`Detected adapter: ${report.project.adapter}`))
  if (report.project.packageName) {
    console.log(chalk.gray(`Package: ${report.project.packageName}`))
  }
  if (report.project.evidence.length > 0) {
    console.log(chalk.gray(`Evidence: ${report.project.evidence.join(' | ')}`))
  }
  console.log()
  console.log(chalk.blue('Checks:'))
  printChecks(report.checks)
  console.log()
  console.log(chalk.blue('Next steps:'))
  for (const step of report.nextSteps) {
    console.log(`  - ${step}`)
  }
}

function printGenerationResult(result: MigrationGenerationResult): void {
  console.log(chalk.blue(`Generated migration scaffold for ${result.project.adapter}`))
  console.log()
  console.log(chalk.blue('Files:'))
  for (const file of result.files) {
    const icon = file.status === 'created' ? chalk.green('✓') : chalk.yellow('○')
    console.log(`  ${icon} ${file.path} — ${file.reason}`)
  }
  console.log()
  console.log(chalk.blue('Next steps:'))
  for (const step of result.nextSteps) {
    console.log(`  - ${step}`)
  }
}

function failWithError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Unknown migration error'
  console.error(chalk.red(message))
  process.exit(1)
}

const planCommand = new Command('plan')
  .description('Inspect the current project and suggest the next DFE migration steps')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-a, --adapter <adapter>', 'Target adapter: prisma or drizzle')
  .action(async (opts) => {
    try {
      const report = createMigrationPlan(
        resolve(opts.root),
        parseAdapterOption(opts.adapter),
      )
      printPlan(report)
    } catch (error) {
      failWithError(error)
    }
  })

const generateCommand = new Command('generate')
  .description('Generate adapter-aware DFE migration scaffold assets')
  .argument('[name]', 'Migration name', 'add_dfe_tables')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-a, --adapter <adapter>', 'Target adapter: prisma or drizzle')
  .option('-f, --force', 'Overwrite existing scaffold files')
  .action(async (name: string, opts) => {
    try {
      const result = generateMigrationScaffold(resolve(opts.root), name, {
        adapter: parseAdapterOption(opts.adapter),
        force: Boolean(opts.force),
      })
      printGenerationResult(result)
    } catch (error) {
      failWithError(error)
    }
  })

const doctorCommand = new Command('doctor')
  .description('Verify whether the project is ready to run its ORM-native migration flow')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-a, --adapter <adapter>', 'Target adapter: prisma or drizzle')
  .option('-d, --database-url <url>', 'Optional database URL for live PostgreSQL table and column verification')
  .action(async (opts) => {
    try {
      const report = await runMigrationDoctor(
        resolve(opts.root),
        parseAdapterOption(opts.adapter),
        { databaseUrl: opts.databaseUrl },
      )
      printPlan(report)
      if (hasFailingMigrationChecks(report.checks)) {
        process.exitCode = 1
      }
    } catch (error) {
      failWithError(error)
    }
  })

const statusCommand = new Command('status')
  .description('Alias for `dfe migrate plan`')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-a, --adapter <adapter>', 'Target adapter: prisma or drizzle')
  .action(async (opts) => {
    try {
      const project = detectMigrationProject(resolve(opts.root), parseAdapterOption(opts.adapter))
      printPlan(createMigrationPlan(project.rootDir, project.adapter))
    } catch (error) {
      failWithError(error)
    }
  })

export const migrateCommand = new Command('migrate')
  .description('Adapter-aware DFE migration scaffolding for Prisma and Drizzle')
  .addCommand(planCommand)
  .addCommand(generateCommand)
  .addCommand(doctorCommand)
  .addCommand(statusCommand)
