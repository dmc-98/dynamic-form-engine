import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createMigrationPlan,
  detectMigrationProject,
  generateMigrationScaffold,
  getMigrationCheckStatus,
  runMigrationDoctor,
  slugifyMigrationName,
} from '../src/migration-workflow'

const tempDirs: string[] = []

function createTempProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'dfe-cli-migrate-'))
  tempDirs.push(dir)
  return dir
}

function writePackageJson(dir: string, content: Record<string, unknown>): void {
  writeFileSync(join(dir, 'package.json'), JSON.stringify(content, null, 2))
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) {
      rmSync(dir, { recursive: true, force: true })
    }
  }
})

describe('slugifyMigrationName', () => {
  it('normalizes migration names into CLI-safe ids', () => {
    expect(slugifyMigrationName(' Add DFE Tables ')).toBe('add_dfe_tables')
    expect(slugifyMigrationName('***')).toBe('add_dfe_tables')
  })
})

describe('detectMigrationProject', () => {
  it('detects Prisma projects from schema and dependencies', () => {
    const dir = createTempProject()
    mkdirSync(join(dir, 'prisma'), { recursive: true })
    writePackageJson(dir, {
      name: 'prisma-app',
      dependencies: {
        '@prisma/client': '^6.0.0',
        '@dmc--98/dfe-prisma': 'workspace:*',
      },
      devDependencies: {
        prisma: '^6.0.0',
      },
      scripts: {
        'db:migrate': 'prisma migrate dev --schema prisma/schema.prisma',
      },
    })
    writeFileSync(join(dir, 'prisma/schema.prisma'), 'model DfeForm {}\nmodel DfeFormVersion {}\nmodel DfeField {}\nmodel DfeSubmission {}\n')

    const project = detectMigrationProject(dir)

    expect(project.adapter).toBe('prisma')
    expect(project.evidence).toContain('Found prisma/schema.prisma')
  })

  it('detects Drizzle projects from config and dependencies', () => {
    const dir = createTempProject()
    mkdirSync(join(dir, 'src/db'), { recursive: true })
    writePackageJson(dir, {
      name: 'drizzle-app',
      dependencies: {
        'drizzle-orm': '^0.38.0',
        '@dmc--98/dfe-drizzle': 'workspace:*',
      },
      devDependencies: {
        'drizzle-kit': '^0.30.0',
      },
      scripts: {
        'db:generate': 'drizzle-kit generate',
      },
    })
    writeFileSync(join(dir, 'drizzle.config.ts'), 'export default {}')
    writeFileSync(join(dir, 'src/db/dfe-schema.ts'), "export { dfeForms } from '@dmc--98/dfe-drizzle/schema'\n")

    const project = detectMigrationProject(dir)

    expect(project.adapter).toBe('drizzle')
    expect(project.evidence).toContain('Found drizzle.config.ts')
  })
})

describe('generateMigrationScaffold', () => {
  it('creates a Prisma fragment when DFE models are not merged yet', () => {
    const dir = createTempProject()
    mkdirSync(join(dir, 'prisma'), { recursive: true })
    writePackageJson(dir, {
      name: 'prisma-app',
      dependencies: {
        '@prisma/client': '^6.0.0',
      },
      devDependencies: {
        prisma: '^6.0.0',
      },
    })
    writeFileSync(join(dir, 'prisma/schema.prisma'), 'generator client { provider = "prisma-client-js" }\n')

    const result = generateMigrationScaffold(dir, 'Add DFE Tables', { adapter: 'prisma' })

    expect(result.files).toEqual([
      {
        path: 'prisma/dfe-schema.prisma',
        reason: 'Scaffolded successfully',
        status: 'created',
      },
    ])
  })

  it('creates a Drizzle schema entrypoint when it is missing', () => {
    const dir = createTempProject()
    mkdirSync(join(dir, 'src/db'), { recursive: true })
    writePackageJson(dir, {
      name: 'drizzle-app',
      dependencies: {
        'drizzle-orm': '^0.38.0',
      },
      devDependencies: {
        'drizzle-kit': '^0.30.0',
      },
    })
    writeFileSync(join(dir, 'drizzle.config.ts'), 'export default {}')

    const result = generateMigrationScaffold(dir, 'add dfe tables', { adapter: 'drizzle' })

    expect(result.files).toEqual([
      {
        path: 'src/db/dfe-schema.ts',
        reason: 'Scaffolded successfully',
        status: 'created',
      },
    ])
  })
})

describe('createMigrationPlan', () => {
  it('surfaces Prisma merge guidance when only the fragment exists', () => {
    const dir = createTempProject()
    mkdirSync(join(dir, 'prisma'), { recursive: true })
    writePackageJson(dir, {
      name: 'prisma-app',
      dependencies: {
        '@prisma/client': '^6.0.0',
      },
      devDependencies: {
        prisma: '^6.0.0',
      },
      scripts: {
        'db:migrate': 'prisma migrate dev --schema prisma/schema.prisma',
      },
    })
    writeFileSync(join(dir, 'prisma/schema.prisma'), 'generator client { provider = "prisma-client-js" }\n')
    writeFileSync(join(dir, 'prisma/dfe-schema.prisma'), 'model DfeForm {}\n')

    const plan = createMigrationPlan(dir, 'prisma')

    expect(plan.checks[1]?.ok).toBe(false)
    expect(plan.nextSteps.some(step => step.includes('Merge prisma/dfe-schema.prisma into prisma/schema.prisma'))).toBe(true)
  })
})

describe('runMigrationDoctor', () => {
  it('warns when live DB verification is skipped', async () => {
    const dir = createTempProject()
    mkdirSync(join(dir, 'prisma'), { recursive: true })
    writePackageJson(dir, {
      name: 'prisma-app',
      dependencies: {
        '@prisma/client': '^6.0.0',
      },
      devDependencies: {
        prisma: '^6.0.0',
      },
    })
    writeFileSync(join(dir, 'prisma/schema.prisma'), 'model DfeForm {}\nmodel DfeFormVersion {}\nmodel DfeField {}\nmodel DfeSubmission {}\n')

    const report = await runMigrationDoctor(dir, 'prisma')
    const liveDbCheck = report.checks.find(check => check.label === 'Live database verification')

    expect(liveDbCheck).toBeDefined()
    expect(getMigrationCheckStatus(liveDbCheck!)).toBe('warn')
    expect(liveDbCheck?.detail).toContain('Skipped live database verification')
  })

  it('passes live DB verification when the expected Prisma tables and columns exist', async () => {
    const dir = createTempProject()
    mkdirSync(join(dir, 'prisma'), { recursive: true })
    writePackageJson(dir, {
      name: 'prisma-app',
      dependencies: {
        '@prisma/client': '^6.0.0',
      },
      devDependencies: {
        prisma: '^6.0.0',
      },
    })
    writeFileSync(join(dir, 'prisma/schema.prisma'), 'model DfeForm {}\nmodel DfeFormVersion {}\nmodel DfeField {}\nmodel DfeSubmission {}\n')

    const report = await runMigrationDoctor(dir, 'prisma', {
      databaseUrl: 'postgresql://example.com/dfe',
      connect: async () => ({
        query: async (sql: string, values?: unknown[]) => {
          if (sql.includes('current_schema')) {
            return { rows: [{ schema_name: 'public' }] }
          }

          expect(values?.[0]).toBe('public')
          return {
            rows: [
              { table_name: 'dfe_forms', column_name: 'id' },
              { table_name: 'dfe_forms', column_name: 'tenantId' },
              { table_name: 'dfe_forms', column_name: 'slug' },
              { table_name: 'dfe_forms', column_name: 'title' },
              { table_name: 'dfe_forms', column_name: 'description' },
              { table_name: 'dfe_forms', column_name: 'createdAt' },
              { table_name: 'dfe_forms', column_name: 'updatedAt' },
              { table_name: 'dfe_form_versions', column_name: 'id' },
              { table_name: 'dfe_form_versions', column_name: 'formId' },
              { table_name: 'dfe_form_versions', column_name: 'version' },
              { table_name: 'dfe_form_versions', column_name: 'status' },
              { table_name: 'dfe_form_versions', column_name: 'createdAt' },
              { table_name: 'dfe_steps', column_name: 'id' },
              { table_name: 'dfe_steps', column_name: 'versionId' },
              { table_name: 'dfe_steps', column_name: 'title' },
              { table_name: 'dfe_steps', column_name: 'description' },
              { table_name: 'dfe_steps', column_name: 'order' },
              { table_name: 'dfe_steps', column_name: 'conditions' },
              { table_name: 'dfe_steps', column_name: 'config' },
              { table_name: 'dfe_fields', column_name: 'id' },
              { table_name: 'dfe_fields', column_name: 'versionId' },
              { table_name: 'dfe_fields', column_name: 'stepId' },
              { table_name: 'dfe_fields', column_name: 'sectionId' },
              { table_name: 'dfe_fields', column_name: 'parentFieldId' },
              { table_name: 'dfe_fields', column_name: 'key' },
              { table_name: 'dfe_fields', column_name: 'label' },
              { table_name: 'dfe_fields', column_name: 'description' },
              { table_name: 'dfe_fields', column_name: 'type' },
              { table_name: 'dfe_fields', column_name: 'required' },
              { table_name: 'dfe_fields', column_name: 'order' },
              { table_name: 'dfe_fields', column_name: 'config' },
              { table_name: 'dfe_fields', column_name: 'conditions' },
              { table_name: 'dfe_field_options', column_name: 'id' },
              { table_name: 'dfe_field_options', column_name: 'fieldId' },
              { table_name: 'dfe_field_options', column_name: 'label' },
              { table_name: 'dfe_field_options', column_name: 'value' },
              { table_name: 'dfe_field_options', column_name: 'meta' },
              { table_name: 'dfe_field_options', column_name: 'order' },
              { table_name: 'dfe_submissions', column_name: 'id' },
              { table_name: 'dfe_submissions', column_name: 'tenantId' },
              { table_name: 'dfe_submissions', column_name: 'formId' },
              { table_name: 'dfe_submissions', column_name: 'versionId' },
              { table_name: 'dfe_submissions', column_name: 'userId' },
              { table_name: 'dfe_submissions', column_name: 'status' },
              { table_name: 'dfe_submissions', column_name: 'currentStepId' },
              { table_name: 'dfe_submissions', column_name: 'context' },
              { table_name: 'dfe_submissions', column_name: 'experimentId' },
              { table_name: 'dfe_submissions', column_name: 'variantId' },
              { table_name: 'dfe_submissions', column_name: 'variantKey' },
              { table_name: 'dfe_submissions', column_name: 'createdAt' },
              { table_name: 'dfe_submissions', column_name: 'updatedAt' },
              { table_name: 'dfe_experiments', column_name: 'id' },
              { table_name: 'dfe_experiments', column_name: 'formId' },
              { table_name: 'dfe_experiments', column_name: 'tenantId' },
              { table_name: 'dfe_experiments', column_name: 'name' },
              { table_name: 'dfe_experiments', column_name: 'status' },
              { table_name: 'dfe_experiments', column_name: 'createdAt' },
              { table_name: 'dfe_experiments', column_name: 'updatedAt' },
              { table_name: 'dfe_experiment_variants', column_name: 'id' },
              { table_name: 'dfe_experiment_variants', column_name: 'experimentId' },
              { table_name: 'dfe_experiment_variants', column_name: 'key' },
              { table_name: 'dfe_experiment_variants', column_name: 'label' },
              { table_name: 'dfe_experiment_variants', column_name: 'weight' },
              { table_name: 'dfe_experiment_variants', column_name: 'overrides' },
              { table_name: 'dfe_analytics_events', column_name: 'id' },
              { table_name: 'dfe_analytics_events', column_name: 'tenantId' },
              { table_name: 'dfe_analytics_events', column_name: 'formId' },
              { table_name: 'dfe_analytics_events', column_name: 'submissionId' },
              { table_name: 'dfe_analytics_events', column_name: 'event' },
              { table_name: 'dfe_analytics_events', column_name: 'stepId' },
              { table_name: 'dfe_analytics_events', column_name: 'fieldKey' },
              { table_name: 'dfe_analytics_events', column_name: 'experimentId' },
              { table_name: 'dfe_analytics_events', column_name: 'variantId' },
              { table_name: 'dfe_analytics_events', column_name: 'variantKey' },
              { table_name: 'dfe_analytics_events', column_name: 'metadata' },
              { table_name: 'dfe_analytics_events', column_name: 'occurredAt' },
            ],
          }
        },
        end: async () => undefined,
      }),
    })

    expect(getMigrationCheckStatus(report.checks.at(-3)!)).toBe('pass')
    expect(getMigrationCheckStatus(report.checks.at(-2)!)).toBe('pass')
    expect(getMigrationCheckStatus(report.checks.at(-1)!)).toBe('pass')
  })

  it('fails when live DB verification finds missing tables', async () => {
    const dir = createTempProject()
    mkdirSync(join(dir, 'src/db'), { recursive: true })
    writePackageJson(dir, {
      name: 'drizzle-app',
      dependencies: {
        'drizzle-orm': '^0.38.0',
      },
      devDependencies: {
        'drizzle-kit': '^0.30.0',
      },
    })
    writeFileSync(join(dir, 'drizzle.config.ts'), 'export default {}')
    writeFileSync(join(dir, 'src/db/dfe-schema.ts'), "export { dfeForms } from '@dmc--98/dfe-drizzle/schema'\n")

    const report = await runMigrationDoctor(dir, 'drizzle', {
      databaseUrl: 'postgresql://example.com/dfe',
      connect: async () => ({
        query: async (sql: string) => {
          if (sql.includes('current_schema')) {
            return { rows: [{ schema_name: 'public' }] }
          }

          return {
            rows: [
              { table_name: 'dfe_forms', column_name: 'id' },
              { table_name: 'dfe_forms', column_name: 'slug' },
            ],
          }
        },
        end: async () => undefined,
      }),
    })

    const tablesCheck = report.checks.find(check => check.label === 'Live DFE tables')
    const columnsCheck = report.checks.find(check => check.label === 'Live DFE columns')

    expect(getMigrationCheckStatus(tablesCheck!)).toBe('fail')
    expect(tablesCheck?.detail).toContain('Missing tables')
    expect(getMigrationCheckStatus(columnsCheck!)).toBe('warn')
    expect(columnsCheck?.detail).toContain('Column verification is incomplete')
  })
})
