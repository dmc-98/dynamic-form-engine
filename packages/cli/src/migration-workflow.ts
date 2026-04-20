import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { Client } from 'pg'
import { getDrizzleSchemaContent, getPrismaSchemaContent } from './migration-templates'
import { ORG_SCOPE } from './constants'

export type SupportedMigrationAdapter = 'prisma' | 'drizzle'

interface PackageManifest {
  name?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface BaseProjectState {
  rootDir: string
  packageName?: string
  packageJsonPath?: string
  scripts: Record<string, string>
}

export interface PrismaMigrationState extends BaseProjectState {
  adapter: 'prisma'
  schemaPath: string
  schemaExists: boolean
  dfeModelsInSchema: boolean
  fragmentPath: string
  fragmentExists: boolean
  prismaCliAvailable: boolean
  evidence: string[]
}

export interface DrizzleMigrationState extends BaseProjectState {
  adapter: 'drizzle'
  configPath?: string
  configExists: boolean
  schemaPath: string
  recommendedSchemaPath: string
  schemaExists: boolean
  schemaUsesDfeTables: boolean
  drizzleKitAvailable: boolean
  evidence: string[]
}

export type MigrationProjectState = PrismaMigrationState | DrizzleMigrationState

export type MigrationCheckStatus = 'pass' | 'warn' | 'fail'

export interface MigrationCheck {
  label: string
  ok: boolean
  detail: string
  status?: MigrationCheckStatus
}

export interface MigrationPlan {
  project: MigrationProjectState
  checks: MigrationCheck[]
  nextSteps: string[]
}

export interface MigrationGenerationFile {
  path: string
  status: 'created' | 'skipped'
  reason: string
}

export interface MigrationGenerationResult {
  project: MigrationProjectState
  files: MigrationGenerationFile[]
  nextSteps: string[]
}

interface MigrationDoctorOptions {
  databaseUrl?: string
  connect?: (databaseUrl: string) => Promise<DatabaseInspectionClient>
}

interface DatabaseInspectionClient {
  query<T>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>
  end(): Promise<void>
}

interface DatabaseInspectionResult {
  checks: MigrationCheck[]
  nextSteps: string[]
}

const DRIZZLE_CONFIG_CANDIDATES = [
  'drizzle.config.ts',
  'drizzle.config.js',
  'drizzle.config.mjs',
  'drizzle.config.cjs',
]

const DRIZZLE_SCHEMA_CANDIDATES = [
  'src/db/dfe-schema.ts',
  'src/db/schema.ts',
  'db/schema.ts',
  'drizzle/schema.ts',
]

const PRISMA_POSTGRES_COLUMNS: Record<string, string[]> = {
  dfe_forms: ['id', 'tenantId', 'slug', 'title', 'description', 'createdAt', 'updatedAt'],
  dfe_form_versions: ['id', 'formId', 'version', 'status', 'createdAt'],
  dfe_steps: ['id', 'versionId', 'title', 'description', 'order', 'conditions', 'config'],
  dfe_fields: [
    'id',
    'versionId',
    'stepId',
    'sectionId',
    'parentFieldId',
    'key',
    'label',
    'description',
    'type',
    'required',
    'order',
    'config',
    'conditions',
  ],
  dfe_field_options: ['id', 'fieldId', 'label', 'value', 'meta', 'order'],
  dfe_submissions: [
    'id',
    'tenantId',
    'formId',
    'versionId',
    'userId',
    'status',
    'currentStepId',
    'context',
    'experimentId',
    'variantId',
    'variantKey',
    'createdAt',
    'updatedAt',
  ],
  dfe_experiments: ['id', 'formId', 'tenantId', 'name', 'status', 'createdAt', 'updatedAt'],
  dfe_experiment_variants: ['id', 'experimentId', 'key', 'label', 'weight', 'overrides'],
  dfe_analytics_events: [
    'id',
    'tenantId',
    'formId',
    'submissionId',
    'event',
    'stepId',
    'fieldKey',
    'experimentId',
    'variantId',
    'variantKey',
    'metadata',
    'occurredAt',
  ],
}

const DRIZZLE_POSTGRES_COLUMNS: Record<string, string[]> = {
  dfe_forms: ['id', 'tenant_id', 'slug', 'title', 'description', 'created_at', 'updated_at'],
  dfe_form_versions: ['id', 'form_id', 'version', 'status', 'created_at'],
  dfe_steps: ['id', 'version_id', 'title', 'description', 'order', 'conditions', 'config'],
  dfe_fields: [
    'id',
    'version_id',
    'step_id',
    'section_id',
    'parent_field_id',
    'key',
    'label',
    'description',
    'type',
    'required',
    'order',
    'config',
    'conditions',
  ],
  dfe_field_options: ['id', 'field_id', 'label', 'value', 'meta', 'order'],
  dfe_submissions: [
    'id',
    'tenant_id',
    'form_id',
    'version_id',
    'user_id',
    'status',
    'current_step_id',
    'context',
    'experiment_id',
    'variant_id',
    'variant_key',
    'created_at',
    'updated_at',
  ],
  dfe_experiments: ['id', 'form_id', 'tenant_id', 'name', 'status', 'created_at', 'updated_at'],
  dfe_experiment_variants: ['id', 'experiment_id', 'key', 'label', 'weight', 'overrides'],
  dfe_analytics_events: [
    'id',
    'tenant_id',
    'form_id',
    'submission_id',
    'event',
    'step_id',
    'field_key',
    'experiment_id',
    'variant_id',
    'variant_key',
    'metadata',
    'occurred_at',
  ],
}

export function slugifyMigrationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'add_dfe_tables'
}

export function detectMigrationProject(
  projectRoot: string,
  preferredAdapter?: SupportedMigrationAdapter,
): MigrationProjectState {
  const rootDir = resolve(projectRoot)
  const packageJsonPath = join(rootDir, 'package.json')
  const manifest = readJsonFile<PackageManifest>(packageJsonPath)
  const scripts = manifest?.scripts ?? {}
  const baseState = {
    rootDir,
    packageName: manifest?.name,
    packageJsonPath: existsSync(packageJsonPath) ? packageJsonPath : undefined,
    scripts,
  }

  const prismaState = inspectPrismaProject(baseState, manifest)
  const drizzleState = inspectDrizzleProject(baseState, manifest)

  if (preferredAdapter) {
    return preferredAdapter === 'prisma' ? prismaState : drizzleState
  }

  const prismaScore = scorePrismaProject(prismaState, manifest)
  const drizzleScore = scoreDrizzleProject(drizzleState, manifest)

  if (prismaScore === 0 && drizzleScore === 0) {
    throw new Error(
      'Could not detect a Prisma or Drizzle migration setup. Pass --adapter prisma or --adapter drizzle to scaffold explicitly.',
    )
  }

  if (prismaScore === drizzleScore) {
    throw new Error(
      'Detected both Prisma and Drizzle signals. Re-run with --adapter prisma or --adapter drizzle to choose one.',
    )
  }

  return prismaScore > drizzleScore ? prismaState : drizzleState
}

export function createMigrationPlan(
  projectRoot: string,
  preferredAdapter?: SupportedMigrationAdapter,
): MigrationPlan {
  const project = detectMigrationProject(projectRoot, preferredAdapter)
  const migrationName = 'add_dfe_tables'

  if (project.adapter === 'prisma') {
    const checks: MigrationCheck[] = [
      {
        label: 'Prisma schema',
        ok: project.schemaExists,
        detail: project.schemaExists
          ? `Found ${project.schemaPath}`
          : `Missing ${project.schemaPath}`,
      },
      {
        label: 'DFE Prisma models',
        ok: project.dfeModelsInSchema,
        detail: project.dfeModelsInSchema
          ? `DFE models are already present in ${project.schemaPath}`
          : project.fragmentExists
            ? `DFE schema fragment exists at ${project.fragmentPath}, but it is not merged into ${project.schemaPath} yet`
            : 'DFE Prisma models are not scaffolded yet',
      },
      {
        label: 'Prisma CLI',
        ok: project.prismaCliAvailable,
        detail: project.prismaCliAvailable
          ? 'Prisma CLI or migration script is available'
          : 'Install Prisma or add a db:migrate script before running migrations',
      },
    ]

    return {
      project,
      checks,
      nextSteps: getPrismaNextSteps(project, migrationName),
    }
  }

  const checks: MigrationCheck[] = [
    {
      label: 'Drizzle config',
      ok: project.configExists,
      detail: project.configExists
        ? `Found ${project.configPath}`
        : 'Missing drizzle.config.ts/js/mjs/cjs',
    },
    {
      label: 'DFE Drizzle schema',
      ok: project.schemaUsesDfeTables,
      detail: project.schemaUsesDfeTables
        ? `DFE tables are wired into ${project.schemaPath}`
        : project.schemaExists
          ? `Schema file exists at ${project.schemaPath}, but it does not expose DFE tables yet`
          : `Missing ${project.schemaPath}`,
    },
    {
      label: 'Drizzle kit',
      ok: project.drizzleKitAvailable,
      detail: project.drizzleKitAvailable
        ? 'Drizzle migration generation is available'
        : 'Install drizzle-kit or add a db:generate script before generating migrations',
    },
  ]

  return {
    project,
    checks,
    nextSteps: getDrizzleNextSteps(project, migrationName),
  }
}

export function runMigrationDoctor(
  projectRoot: string,
  preferredAdapter?: SupportedMigrationAdapter,
  options: MigrationDoctorOptions = {},
): Promise<MigrationPlan> {
  return createMigrationDoctorReport(projectRoot, preferredAdapter, options)
}

export function generateMigrationScaffold(
  projectRoot: string,
  name: string,
  options: {
    adapter?: SupportedMigrationAdapter
    force?: boolean
  } = {},
): MigrationGenerationResult {
  const project = detectMigrationProject(projectRoot, options.adapter)
  const migrationName = slugifyMigrationName(name)

  if (project.adapter === 'prisma') {
    const files: MigrationGenerationFile[] = []

    if (project.dfeModelsInSchema) {
      files.push({
        path: project.schemaPath,
        status: 'skipped',
        reason: 'DFE Prisma models are already merged into the main schema',
      })
    } else {
      files.push(writeScaffoldFile(
        join(project.rootDir, project.fragmentPath),
        project.fragmentPath,
        getPrismaSchemaContent(),
        options.force,
      ))
    }

    const updatedProject = inspectPrismaProject(
      project,
      readJsonFile<PackageManifest>(project.packageJsonPath),
    )

    return {
      project: updatedProject,
      files,
      nextSteps: getPrismaNextSteps(updatedProject, migrationName),
    }
  }

  const files: MigrationGenerationFile[] = [
    writeScaffoldFile(
      join(project.rootDir, project.recommendedSchemaPath),
      project.recommendedSchemaPath,
      getDrizzleSchemaContent(),
      options.force,
    ),
  ]

  const updatedProject = inspectDrizzleProject(
    project,
    readJsonFile<PackageManifest>(project.packageJsonPath),
  )

  return {
    project: updatedProject,
    files,
    nextSteps: getDrizzleNextSteps(updatedProject, migrationName),
  }
}

function inspectPrismaProject(
  baseState: BaseProjectState,
  manifest?: PackageManifest,
): PrismaMigrationState {
  const schemaPath = 'prisma/schema.prisma'
  const fragmentPath = 'prisma/dfe-schema.prisma'
  const schemaContent = readTextFile(join(baseState.rootDir, schemaPath))

  return {
    ...baseState,
    adapter: 'prisma',
    schemaPath,
    schemaExists: schemaContent !== undefined,
    dfeModelsInSchema: hasDfePrismaModels(schemaContent),
    fragmentPath,
    fragmentExists: existsSync(join(baseState.rootDir, fragmentPath)),
    prismaCliAvailable:
      hasDependency(manifest, 'prisma')
      || hasScript(baseState.scripts, 'db:migrate')
      || hasScriptContaining(baseState.scripts, 'prisma migrate'),
    evidence: collectPrismaEvidence(baseState, manifest),
  }
}

function inspectDrizzleProject(
  baseState: BaseProjectState,
  manifest?: PackageManifest,
): DrizzleMigrationState {
  const configPath = findExistingRelativePath(baseState.rootDir, DRIZZLE_CONFIG_CANDIDATES)
  const existingSchemaPath = findExistingRelativePath(baseState.rootDir, DRIZZLE_SCHEMA_CANDIDATES)
  const schemaPath = existingSchemaPath ?? DRIZZLE_SCHEMA_CANDIDATES[0]
  const schemaContent = readTextFile(join(baseState.rootDir, schemaPath))
  const schemaUsesDfeTables = schemaContent?.includes(`${ORG_SCOPE}/dfe-drizzle/schema`) ?? false
  const recommendedSchemaPath = schemaUsesDfeTables || !existingSchemaPath
    ? schemaPath
    : DRIZZLE_SCHEMA_CANDIDATES[0]

  return {
    ...baseState,
    adapter: 'drizzle',
    configPath,
    configExists: Boolean(configPath),
    schemaPath,
    recommendedSchemaPath,
    schemaExists: schemaContent !== undefined,
    schemaUsesDfeTables,
    drizzleKitAvailable:
      hasDependency(manifest, 'drizzle-kit')
      || hasScriptContaining(baseState.scripts, 'drizzle-kit'),
    evidence: collectDrizzleEvidence(baseState, manifest, configPath, existingSchemaPath),
  }
}

function getPrismaNextSteps(project: PrismaMigrationState, migrationName: string): string[] {
  const steps: string[] = []

  if (!project.schemaExists) {
    steps.push('Create prisma/schema.prisma with your datasource and generator blocks.')
  }

  if (!project.dfeModelsInSchema) {
    if (!project.fragmentExists) {
      steps.push('Run `dfe migrate generate --adapter prisma` to scaffold prisma/dfe-schema.prisma.')
    }
    steps.push('Merge prisma/dfe-schema.prisma into prisma/schema.prisma before running Prisma migrations.')
  }

  if (!project.prismaCliAvailable) {
    steps.push('Install Prisma (`npm install -D prisma`) or add a `db:migrate` script to package.json.')
  }

  const migrateCommand = project.scripts['db:migrate']
    ? `pnpm db:migrate -- --name ${migrationName}`
    : `npx prisma migrate dev --schema ${project.schemaPath} --name ${migrationName}`

  if (project.schemaExists && project.prismaCliAvailable) {
    steps.push(
      project.dfeModelsInSchema
        ? `Run \`${migrateCommand}\` to create or apply the DFE table migration.`
        : `Run \`${migrateCommand}\` after the DFE models are present in prisma/schema.prisma.`,
    )
  }

  return steps
}

function getDrizzleNextSteps(project: DrizzleMigrationState, migrationName: string): string[] {
  const steps: string[] = []

  if (!project.schemaUsesDfeTables) {
    steps.push('Run `dfe migrate generate --adapter drizzle` to scaffold a DFE schema entrypoint.')
    steps.push(`Export the generated tables from ${project.recommendedSchemaPath} through the schema entrypoint referenced by drizzle.config.`)
  }

  if (!project.configExists) {
    steps.push('Create drizzle.config.ts and point its `schema` field at the file that exports your DFE tables.')
  }

  if (!project.drizzleKitAvailable) {
    steps.push('Install drizzle-kit or add a script that runs `drizzle-kit generate`.')
  }

  const generateCommand = findDrizzleGenerateCommand(project.scripts, migrationName)
  if (project.configExists && project.drizzleKitAvailable) {
    steps.push(
      project.schemaUsesDfeTables
        ? `Run \`${generateCommand}\` to generate the DFE migration files.`
        : `Run \`${generateCommand}\` after the schema entrypoint exposes the DFE tables.`,
    )
  }

  return steps
}

function findDrizzleGenerateCommand(scripts: Record<string, string>, migrationName: string): string {
  const scriptEntry = Object.entries(scripts).find(([, value]) => value.includes('drizzle-kit generate'))

  if (!scriptEntry) {
    return `npx drizzle-kit generate --name ${migrationName}`
  }

  return `pnpm ${scriptEntry[0]} -- --name ${migrationName}`
}

function writeScaffoldFile(
  fullPath: string,
  relativePath: string,
  content: string,
  force = false,
): MigrationGenerationFile {
  if (existsSync(fullPath) && !force) {
    return {
      path: relativePath,
      status: 'skipped',
      reason: 'File already exists',
    }
  }

  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, content)

  return {
    path: relativePath,
    status: 'created',
    reason: force ? 'Overwritten with --force' : 'Scaffolded successfully',
  }
}

function scorePrismaProject(state: PrismaMigrationState, manifest?: PackageManifest): number {
  let score = 0
  if (state.schemaExists) score += 4
  if (state.fragmentExists) score += 2
  if (state.dfeModelsInSchema) score += 3
  if (hasDependency(manifest, '@prisma/client')) score += 2
  if (hasDependency(manifest, '@dmc--98/dfe-prisma')) score += 1
  if (state.prismaCliAvailable) score += 1
  return score
}

function scoreDrizzleProject(state: DrizzleMigrationState, manifest?: PackageManifest): number {
  let score = 0
  if (state.configExists) score += 4
  if (state.schemaExists) score += 2
  if (state.schemaUsesDfeTables) score += 3
  if (hasDependency(manifest, 'drizzle-orm')) score += 2
  if (hasDependency(manifest, '@dmc--98/dfe-drizzle')) score += 1
  if (state.drizzleKitAvailable) score += 1
  return score
}

function collectPrismaEvidence(
  baseState: BaseProjectState,
  manifest?: PackageManifest,
): string[] {
  const evidence: string[] = []

  if (existsSync(join(baseState.rootDir, 'prisma/schema.prisma'))) {
    evidence.push('Found prisma/schema.prisma')
  }
  if (existsSync(join(baseState.rootDir, 'prisma/dfe-schema.prisma'))) {
    evidence.push('Found prisma/dfe-schema.prisma')
  }
  if (hasDependency(manifest, '@prisma/client')) {
    evidence.push('package.json depends on @prisma/client')
  }
  if (hasDependency(manifest, '@dmc--98/dfe-prisma')) {
    evidence.push('package.json depends on @dmc--98/dfe-prisma')
  }
  if (hasScriptContaining(baseState.scripts, 'prisma migrate')) {
    evidence.push('package.json includes a Prisma migration script')
  }

  return evidence
}

function collectDrizzleEvidence(
  baseState: BaseProjectState,
  manifest: PackageManifest | undefined,
  configPath?: string,
  schemaPath?: string,
): string[] {
  const evidence: string[] = []

  if (configPath) {
    evidence.push(`Found ${configPath}`)
  }
  if (schemaPath) {
    evidence.push(`Found ${schemaPath}`)
  }
  if (hasDependency(manifest, 'drizzle-orm')) {
    evidence.push('package.json depends on drizzle-orm')
  }
  if (hasDependency(manifest, '@dmc--98/dfe-drizzle')) {
    evidence.push('package.json depends on @dmc--98/dfe-drizzle')
  }
  if (hasScriptContaining(baseState.scripts, 'drizzle-kit')) {
    evidence.push('package.json includes a drizzle-kit script')
  }

  return evidence
}

function hasDfePrismaModels(content?: string): boolean {
  if (!content) {
    return false
  }

  return [
    'model DfeForm',
    'model DfeFormVersion',
    'model DfeField',
    'model DfeSubmission',
    'model DfeExperiment',
    'model DfeExperimentVariant',
    'model DfeAnalyticsEvent',
  ].every(marker => content.includes(marker))
}

function readJsonFile<T>(path?: string): T | undefined {
  if (!path || !existsSync(path)) {
    return undefined
  }

  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

function readTextFile(path: string): string | undefined {
  if (!existsSync(path)) {
    return undefined
  }

  return readFileSync(path, 'utf-8')
}

function findExistingRelativePath(rootDir: string, candidates: string[]): string | undefined {
  return candidates.find(candidate => existsSync(join(rootDir, candidate)))
}

function hasDependency(manifest: PackageManifest | undefined, dependencyName: string): boolean {
  return Boolean(
    manifest?.dependencies?.[dependencyName]
    || manifest?.devDependencies?.[dependencyName],
  )
}

function hasScript(scripts: Record<string, string>, name: string): boolean {
  return Boolean(scripts[name])
}

function hasScriptContaining(scripts: Record<string, string>, text: string): boolean {
  return Object.values(scripts).some(value => value.includes(text))
}

export function getMigrationCheckStatus(check: MigrationCheck): MigrationCheckStatus {
  return check.status ?? (check.ok ? 'pass' : 'fail')
}

export function hasFailingMigrationChecks(checks: MigrationCheck[]): boolean {
  return checks.some(check => getMigrationCheckStatus(check) === 'fail')
}

async function createMigrationDoctorReport(
  projectRoot: string,
  preferredAdapter?: SupportedMigrationAdapter,
  options: MigrationDoctorOptions = {},
): Promise<MigrationPlan> {
  const plan = createMigrationPlan(projectRoot, preferredAdapter)
  const inspection = await inspectLiveDatabase(plan.project, options)

  return {
    ...plan,
    checks: [...plan.checks, ...inspection.checks],
    nextSteps: mergeNextSteps(plan.nextSteps, inspection.nextSteps),
  }
}

async function inspectLiveDatabase(
  project: MigrationProjectState,
  options: MigrationDoctorOptions,
): Promise<DatabaseInspectionResult> {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL

  if (!databaseUrl) {
    return {
      checks: [
        createCheck(
          'Live database verification',
          'warn',
          'Skipped live database verification. Pass --database-url or set DATABASE_URL to inspect the migrated tables.',
        ),
      ],
      nextSteps: [
        `Optional: re-run \`dfe migrate doctor --adapter ${project.adapter} --database-url "$DATABASE_URL"\` to verify the live DFE tables and columns.`,
      ],
    }
  }

  if (!isPostgresDatabaseUrl(databaseUrl)) {
    return {
      checks: [
        createCheck(
          'Live database verification',
          'warn',
          'Skipped live database verification because DB-connected doctor checks currently support PostgreSQL URLs only.',
        ),
      ],
      nextSteps: [],
    }
  }

  const connect = options.connect ?? connectToPostgresDatabase
  let client: DatabaseInspectionClient | undefined

  try {
    client = await connect(databaseUrl)
    const schemaName = await getCurrentPostgresSchema(client)
    const expectedSchema = project.adapter === 'prisma'
      ? PRISMA_POSTGRES_COLUMNS
      : DRIZZLE_POSTGRES_COLUMNS
    const tableNames = Object.keys(expectedSchema)
    const columnRows = await client.query<{ table_name: string; column_name: string }>(
      `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = ANY($2::text[])
        ORDER BY table_name, ordinal_position
      `,
      [schemaName, tableNames],
    )

    const discoveredColumns = new Map<string, Set<string>>()

    for (const row of columnRows.rows) {
      const tableColumns = discoveredColumns.get(row.table_name) ?? new Set<string>()
      tableColumns.add(row.column_name)
      discoveredColumns.set(row.table_name, tableColumns)
    }

    const missingTables = tableNames.filter(tableName => !discoveredColumns.has(tableName))
    const missingColumns: string[] = []

    for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
      const existingColumns = discoveredColumns.get(tableName)
      if (!existingColumns) {
        continue
      }

      for (const columnName of expectedColumns) {
        if (!existingColumns.has(columnName)) {
          missingColumns.push(`${tableName}.${columnName}`)
        }
      }
    }

    const columnStatus = missingTables.length > 0
      ? 'warn'
      : missingColumns.length === 0
        ? 'pass'
        : 'fail'
    const columnDetail = missingTables.length > 0
      ? `Column verification is incomplete because these tables are missing from schema ${schemaName}: ${missingTables.join(', ')}`
      : missingColumns.length === 0
        ? `All expected ${project.adapter} columns are present in schema ${schemaName}.`
        : `Missing columns in schema ${schemaName}: ${missingColumns.join(', ')}`

    const checks: MigrationCheck[] = [
      createCheck(
        'Live database connection',
        'pass',
        `Connected to PostgreSQL and inspected schema ${schemaName}.`,
      ),
      createCheck(
        'Live DFE tables',
        missingTables.length === 0 ? 'pass' : 'fail',
        missingTables.length === 0
          ? `All expected DFE tables are present in schema ${schemaName}.`
          : `Missing tables in schema ${schemaName}: ${missingTables.join(', ')}`,
      ),
      createCheck(
        'Live DFE columns',
        columnStatus,
        columnDetail,
      ),
    ]

    return {
      checks,
      nextSteps: missingTables.length > 0 || missingColumns.length > 0
        ? [
            `Run your ${project.adapter === 'prisma' ? 'Prisma' : 'Drizzle'} migration command, then re-run \`dfe migrate doctor --adapter ${project.adapter} --database-url "$DATABASE_URL"\`.`,
          ]
        : [],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error'

    return {
      checks: [
        createCheck(
          'Live database verification',
          'fail',
          `Could not inspect the PostgreSQL database: ${message}`,
        ),
      ],
      nextSteps: [
        'Confirm that the database is reachable at DATABASE_URL and the target schema is available, then re-run `dfe migrate doctor`.',
      ],
    }
  } finally {
    await client?.end().catch(() => undefined)
  }
}

async function connectToPostgresDatabase(databaseUrl: string): Promise<DatabaseInspectionClient> {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5_000,
  })

  await client.connect()
  return client
}

async function getCurrentPostgresSchema(client: DatabaseInspectionClient): Promise<string> {
  const result = await client.query<{ schema_name: string }>(
    'SELECT current_schema() AS schema_name',
  )

  return result.rows[0]?.schema_name ?? 'public'
}

function isPostgresDatabaseUrl(databaseUrl: string): boolean {
  return databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')
}

function createCheck(
  label: string,
  status: MigrationCheckStatus,
  detail: string,
): MigrationCheck {
  return {
    label,
    detail,
    ok: status !== 'fail',
    status,
  }
}

function mergeNextSteps(current: string[], additional: string[]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const step of [...current, ...additional]) {
    if (!seen.has(step)) {
      seen.add(step)
      merged.push(step)
    }
  }

  return merged
}
