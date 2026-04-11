"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const constants_1 = require("../constants");
function getTemplates() {
    return {
        'prisma-schema': {
            description: 'Prisma schema for DFE tables',
            packages: ['${ORG_SCOPE}/dfe-prisma', '${ORG_SCOPE}/dfe-server'],
            files: [
                {
                    targetPath: 'prisma/dfe-schema.prisma',
                    content: getPrismaSchemaContent(),
                },
            ],
        },
        'drizzle-schema': {
            description: 'Drizzle ORM schema for DFE tables',
            packages: ['${ORG_SCOPE}/dfe-drizzle', '${ORG_SCOPE}/dfe-server'],
            files: [
                {
                    targetPath: 'src/db/dfe-schema.ts',
                    content: getDrizzleSchemaContent(),
                },
            ],
        },
        'be-utils': {
            description: 'Backend utilities (Express router setup + adapter wiring)',
            packages: ['${ORG_SCOPE}/dfe-server', '${ORG_SCOPE}/dfe-express'],
            files: [
                {
                    targetPath: 'src/routes/dfe.ts',
                    content: getExpressRouteContent(),
                },
            ],
        },
        'fe-hooks': {
            description: 'React hooks and optional default components',
            packages: ['${ORG_SCOPE}/dfe-react', '${ORG_SCOPE}/dfe-core'],
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
    };
}
// ─── Add Command ────────────────────────────────────────────────────────────
exports.addCommand = new commander_1.Command('add')
    .description('Add a DFE module to your project')
    .argument('<module>', 'Module to add: prisma-schema, drizzle-schema, be-utils, fe-hooks')
    .option('-p, --path <path>', 'Target directory for generated files', '.')
    .action(async (moduleName, opts) => {
    var _a;
    const templates = getTemplates();
    const template = templates[moduleName];
    if (!template) {
        console.error(chalk_1.default.red(`Unknown module: ${moduleName}`));
        console.error();
        console.error('Available modules:');
        for (const [name, t] of Object.entries(templates)) {
            console.error(`  ${chalk_1.default.cyan(name)} — ${t.description}`);
        }
        process.exit(1);
    }
    const targetDir = (0, node_path_1.resolve)(opts.path);
    console.log(chalk_1.default.blue(`⚡ Adding ${moduleName}...`));
    console.log();
    // Write template files
    for (const file of template.files) {
        const fullPath = (0, node_path_1.join)(targetDir, file.targetPath);
        const dir = (0, node_path_1.dirname)(fullPath);
        if (!(0, node_fs_1.existsSync)(dir)) {
            (0, node_fs_1.mkdirSync)(dir, { recursive: true });
        }
        if ((0, node_fs_1.existsSync)(fullPath)) {
            console.log(chalk_1.default.yellow('  ⚠'), `${file.targetPath} already exists, skipping`);
        }
        else {
            (0, node_fs_1.writeFileSync)(fullPath, file.content);
            console.log(chalk_1.default.green('  ✓'), `Created ${file.targetPath}`);
        }
    }
    // Print install instructions
    console.log();
    console.log(chalk_1.default.blue('📦 Install required packages:'));
    console.log();
    console.log(`  npm install ${template.packages.join(' ')}`);
    if ((_a = template.devPackages) === null || _a === void 0 ? void 0 : _a.length) {
        console.log(`  npm install -D ${template.devPackages.join(' ')}`);
    }
    console.log();
    console.log(chalk_1.default.green(`✅ ${moduleName} added successfully!`));
    console.log();
});
// ─── Template Content Functions ─────────────────────────────────────────────
function getPrismaSchemaContent() {
    return `// Dynamic Form Engine — Prisma Schema
// Merge this with your existing schema.prisma, then run:
// npx prisma migrate dev --name add-dfe-tables

model DfeForm {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  versions    DfeFormVersion[]
  submissions DfeSubmission[]

  @@map("dfe_forms")
}

model DfeFormVersion {
  id        String   @id @default(uuid())
  formId    String
  version   Int      @default(1)
  status    String   @default("DRAFT")
  createdAt DateTime @default(now())

  form   DfeForm     @relation(fields: [formId], references: [id], onDelete: Cascade)
  steps  DfeStep[]
  fields DfeField[]

  @@unique([formId, version])
  @@map("dfe_form_versions")
}

model DfeStep {
  id          String  @id @default(uuid())
  versionId   String
  title       String
  description String?
  order       Int     @default(0)
  conditions  Json?
  config      Json?

  version DfeFormVersion @relation(fields: [versionId], references: [id], onDelete: Cascade)
  fields  DfeField[]

  @@map("dfe_steps")
}

model DfeField {
  id            String  @id @default(uuid())
  versionId     String
  stepId        String?
  sectionId     String?
  parentFieldId String?
  key           String
  label         String
  description   String?
  type          String
  required      Boolean @default(false)
  order         Int     @default(0)
  config        Json    @default("{}")
  conditions    Json?

  version  DfeFormVersion @relation(fields: [versionId], references: [id], onDelete: Cascade)
  step     DfeStep?       @relation(fields: [stepId], references: [id])
  parent   DfeField?      @relation("FieldChildren", fields: [parentFieldId], references: [id])
  children DfeField[]     @relation("FieldChildren")
  options  DfeFieldOption[]

  @@unique([versionId, key])
  @@map("dfe_fields")
}

model DfeFieldOption {
  id      String @id @default(uuid())
  fieldId String
  label   String
  value   String
  meta    Json?
  order   Int    @default(0)

  field DfeField @relation(fields: [fieldId], references: [id], onDelete: Cascade)

  @@map("dfe_field_options")
}

model DfeSubmission {
  id            String   @id @default(uuid())
  formId        String
  versionId     String
  userId        String
  status        String   @default("IN_PROGRESS")
  currentStepId String?
  context       Json     @default("{}")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  form DfeForm @relation(fields: [formId], references: [id])

  @@index([formId, userId])
  @@map("dfe_submissions")
}
`;
}
function getDrizzleSchemaContent() {
    return `// Dynamic Form Engine — Drizzle Schema
// Import and use with your Drizzle migrations.

import {
  dfeForms, dfeFormVersions, dfeSteps, dfeFields,
  dfeFieldOptions, dfeSubmissions,
} from '${constants_1.ORG_SCOPE}/dfe-drizzle/schema'

// Re-export for your migration config
export {
  dfeForms, dfeFormVersions, dfeSteps, dfeFields,
  dfeFieldOptions, dfeSubmissions,
}
`;
}
function getExpressRouteContent() {
    return `// Dynamic Form Engine — Express Routes
// Mount this router in your Express app.

import { createDfeRouter } from '${constants_1.ORG_SCOPE}/dfe-express'
import type { DatabaseAdapter } from '${constants_1.ORG_SCOPE}/dfe-server'

/**
 * Create and configure the DFE Express router.
 *
 * @param db - Your DatabaseAdapter instance (PrismaDatabaseAdapter or DrizzleDatabaseAdapter)
 *
 * Usage in your app:
 * \`\`\`ts
 * import express from 'express'
 * import { PrismaDatabaseAdapter } from '${constants_1.ORG_SCOPE}/dfe-prisma'
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
`;
}
function getReactHooksContent() {
    return `// Dynamic Form Engine — React Hooks
// Pre-configured hooks for your application.

export {
  useFormEngine,
  useFormStepper,
  useFormRuntime,
  useDynamicOptions,
} from '${constants_1.ORG_SCOPE}/dfe-react'

export type {
  UseFormEngineOptions,
  UseFormStepperOptions,
  UseFormRuntimeOptions,
  UseDynamicOptionsConfig,
} from '${constants_1.ORG_SCOPE}/dfe-react'

// Tip: Import the default components if you want quick prototyping:
// import { DfeFormRenderer, DfeStepIndicator } from '${constants_1.ORG_SCOPE}/dfe-react/components'
`;
}
function getReactComponentContent() {
    return `// Dynamic Form Engine — Example Form Component
// A complete multi-step form using DFE hooks.

import React, { useEffect } from 'react'
import { useFormEngine, useFormStepper, useFormRuntime } from '${constants_1.ORG_SCOPE}/dfe-react'
import type { FormField, FormStep } from '${constants_1.ORG_SCOPE}/dfe-react'

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
`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWRkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHlDQUFtQztBQUNuQyxrREFBeUI7QUFDekIscUNBQTRFO0FBQzVFLHlDQUFrRDtBQUNsRCw0Q0FBd0M7QUFjeEMsU0FBUyxZQUFZO0lBQ25CLE9BQU87UUFDTCxlQUFlLEVBQUU7WUFDZixXQUFXLEVBQUUsOEJBQThCO1lBQzNDLFFBQVEsRUFBRSxDQUFDLHlCQUF5QixFQUFFLHlCQUF5QixDQUFDO1lBQ2hFLEtBQUssRUFBRTtnQkFDTDtvQkFDRSxVQUFVLEVBQUUsMEJBQTBCO29CQUN0QyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7aUJBQ2xDO2FBQ0Y7U0FDRjtRQUNELGdCQUFnQixFQUFFO1lBQ2hCLFdBQVcsRUFBRSxtQ0FBbUM7WUFDaEQsUUFBUSxFQUFFLENBQUMsMEJBQTBCLEVBQUUseUJBQXlCLENBQUM7WUFDakUsS0FBSyxFQUFFO2dCQUNMO29CQUNFLFVBQVUsRUFBRSxzQkFBc0I7b0JBQ2xDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRTtpQkFDbkM7YUFDRjtTQUNGO1FBQ0QsVUFBVSxFQUFFO1lBQ1YsV0FBVyxFQUFFLDJEQUEyRDtZQUN4RSxRQUFRLEVBQUUsQ0FBQyx5QkFBeUIsRUFBRSwwQkFBMEIsQ0FBQztZQUNqRSxLQUFLLEVBQUU7Z0JBQ0w7b0JBQ0UsVUFBVSxFQUFFLG1CQUFtQjtvQkFDL0IsT0FBTyxFQUFFLHNCQUFzQixFQUFFO2lCQUNsQzthQUNGO1NBQ0Y7UUFDRCxVQUFVLEVBQUU7WUFDVixXQUFXLEVBQUUsNkNBQTZDO1lBQzFELFFBQVEsRUFBRSxDQUFDLHdCQUF3QixFQUFFLHVCQUF1QixDQUFDO1lBQzdELEtBQUssRUFBRTtnQkFDTDtvQkFDRSxVQUFVLEVBQUUscUJBQXFCO29CQUNqQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUU7aUJBQ2hDO2dCQUNEO29CQUNFLFVBQVUsRUFBRSw0QkFBNEI7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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBaUZwRCxDQUFBO0FBQ0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tICdjb21tYW5kZXInXG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgeyB3cml0ZUZpbGVTeW5jLCBta2RpclN5bmMsIGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ25vZGU6ZnMnXG5pbXBvcnQgeyBqb2luLCByZXNvbHZlLCBkaXJuYW1lIH0gZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IHsgT1JHX1NDT1BFIH0gZnJvbSAnLi4vY29uc3RhbnRzJ1xuXG4vLyDilIDilIDilIAgVGVtcGxhdGUgUmVnaXN0cnkg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmludGVyZmFjZSBUZW1wbGF0ZSB7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgZmlsZXM6IEFycmF5PHtcbiAgICB0YXJnZXRQYXRoOiBzdHJpbmdcbiAgICBjb250ZW50OiBzdHJpbmdcbiAgfT5cbiAgcGFja2FnZXM6IHN0cmluZ1tdXG4gIGRldlBhY2thZ2VzPzogc3RyaW5nW11cbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGVzKCk6IFJlY29yZDxzdHJpbmcsIFRlbXBsYXRlPiB7XG4gIHJldHVybiB7XG4gICAgJ3ByaXNtYS1zY2hlbWEnOiB7XG4gICAgICBkZXNjcmlwdGlvbjogJ1ByaXNtYSBzY2hlbWEgZm9yIERGRSB0YWJsZXMnLFxuICAgICAgcGFja2FnZXM6IFsnJHtPUkdfU0NPUEV9L2RmZS1wcmlzbWEnLCAnJHtPUkdfU0NPUEV9L2RmZS1zZXJ2ZXInXSxcbiAgICAgIGZpbGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0YXJnZXRQYXRoOiAncHJpc21hL2RmZS1zY2hlbWEucHJpc21hJyxcbiAgICAgICAgICBjb250ZW50OiBnZXRQcmlzbWFTY2hlbWFDb250ZW50KCksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAgJ2RyaXp6bGUtc2NoZW1hJzoge1xuICAgICAgZGVzY3JpcHRpb246ICdEcml6emxlIE9STSBzY2hlbWEgZm9yIERGRSB0YWJsZXMnLFxuICAgICAgcGFja2FnZXM6IFsnJHtPUkdfU0NPUEV9L2RmZS1kcml6emxlJywgJyR7T1JHX1NDT1BFfS9kZmUtc2VydmVyJ10sXG4gICAgICBmaWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgdGFyZ2V0UGF0aDogJ3NyYy9kYi9kZmUtc2NoZW1hLnRzJyxcbiAgICAgICAgICBjb250ZW50OiBnZXREcml6emxlU2NoZW1hQ29udGVudCgpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgICdiZS11dGlscyc6IHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnQmFja2VuZCB1dGlsaXRpZXMgKEV4cHJlc3Mgcm91dGVyIHNldHVwICsgYWRhcHRlciB3aXJpbmcpJyxcbiAgICAgIHBhY2thZ2VzOiBbJyR7T1JHX1NDT1BFfS9kZmUtc2VydmVyJywgJyR7T1JHX1NDT1BFfS9kZmUtZXhwcmVzcyddLFxuICAgICAgZmlsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRhcmdldFBhdGg6ICdzcmMvcm91dGVzL2RmZS50cycsXG4gICAgICAgICAgY29udGVudDogZ2V0RXhwcmVzc1JvdXRlQ29udGVudCgpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgICdmZS1ob29rcyc6IHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVhY3QgaG9va3MgYW5kIG9wdGlvbmFsIGRlZmF1bHQgY29tcG9uZW50cycsXG4gICAgICBwYWNrYWdlczogWycke09SR19TQ09QRX0vZGZlLXJlYWN0JywgJyR7T1JHX1NDT1BFfS9kZmUtY29yZSddLFxuICAgICAgZmlsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRhcmdldFBhdGg6ICdzcmMvaG9va3MvdXNlRGZlLnRzJyxcbiAgICAgICAgICBjb250ZW50OiBnZXRSZWFjdEhvb2tzQ29udGVudCgpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdGFyZ2V0UGF0aDogJ3NyYy9jb21wb25lbnRzL0RmZUZvcm0udHN4JyxcbiAgICAgICAgICBjb250ZW50OiBnZXRSZWFjdENvbXBvbmVudENvbnRlbnQoKSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfVxufVxuXG4vLyDilIDilIDilIAgQWRkIENvbW1hbmQg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBjb25zdCBhZGRDb21tYW5kID0gbmV3IENvbW1hbmQoJ2FkZCcpXG4gIC5kZXNjcmlwdGlvbignQWRkIGEgREZFIG1vZHVsZSB0byB5b3VyIHByb2plY3QnKVxuICAuYXJndW1lbnQoJzxtb2R1bGU+JywgJ01vZHVsZSB0byBhZGQ6IHByaXNtYS1zY2hlbWEsIGRyaXp6bGUtc2NoZW1hLCBiZS11dGlscywgZmUtaG9va3MnKVxuICAub3B0aW9uKCctcCwgLS1wYXRoIDxwYXRoPicsICdUYXJnZXQgZGlyZWN0b3J5IGZvciBnZW5lcmF0ZWQgZmlsZXMnLCAnLicpXG4gIC5hY3Rpb24oYXN5bmMgKG1vZHVsZU5hbWU6IHN0cmluZywgb3B0cykgPT4ge1xuICAgIGNvbnN0IHRlbXBsYXRlcyA9IGdldFRlbXBsYXRlcygpXG4gICAgY29uc3QgdGVtcGxhdGUgPSB0ZW1wbGF0ZXNbbW9kdWxlTmFtZV1cblxuICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKGBVbmtub3duIG1vZHVsZTogJHttb2R1bGVOYW1lfWApKVxuICAgICAgY29uc29sZS5lcnJvcigpXG4gICAgICBjb25zb2xlLmVycm9yKCdBdmFpbGFibGUgbW9kdWxlczonKVxuICAgICAgZm9yIChjb25zdCBbbmFtZSwgdF0gb2YgT2JqZWN0LmVudHJpZXModGVtcGxhdGVzKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGAgICR7Y2hhbGsuY3lhbihuYW1lKX0g4oCUICR7dC5kZXNjcmlwdGlvbn1gKVxuICAgICAgfVxuICAgICAgcHJvY2Vzcy5leGl0KDEpXG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0RGlyID0gcmVzb2x2ZShvcHRzLnBhdGgpXG4gICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZShg4pqhIEFkZGluZyAke21vZHVsZU5hbWV9Li4uYCkpXG4gICAgY29uc29sZS5sb2coKVxuXG4gICAgLy8gV3JpdGUgdGVtcGxhdGUgZmlsZXNcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgdGVtcGxhdGUuZmlsZXMpIHtcbiAgICAgIGNvbnN0IGZ1bGxQYXRoID0gam9pbih0YXJnZXREaXIsIGZpbGUudGFyZ2V0UGF0aClcbiAgICAgIGNvbnN0IGRpciA9IGRpcm5hbWUoZnVsbFBhdGgpXG5cbiAgICAgIGlmICghZXhpc3RzU3luYyhkaXIpKSB7XG4gICAgICAgIG1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgICB9XG5cbiAgICAgIGlmIChleGlzdHNTeW5jKGZ1bGxQYXRoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay55ZWxsb3coJyAg4pqgJyksIGAke2ZpbGUudGFyZ2V0UGF0aH0gYWxyZWFkeSBleGlzdHMsIHNraXBwaW5nYClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdyaXRlRmlsZVN5bmMoZnVsbFBhdGgsIGZpbGUuY29udGVudClcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJyAg4pyTJyksIGBDcmVhdGVkICR7ZmlsZS50YXJnZXRQYXRofWApXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJpbnQgaW5zdGFsbCBpbnN0cnVjdGlvbnNcbiAgICBjb25zb2xlLmxvZygpXG4gICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZSgn8J+TpiBJbnN0YWxsIHJlcXVpcmVkIHBhY2thZ2VzOicpKVxuICAgIGNvbnNvbGUubG9nKClcbiAgICBjb25zb2xlLmxvZyhgICBucG0gaW5zdGFsbCAke3RlbXBsYXRlLnBhY2thZ2VzLmpvaW4oJyAnKX1gKVxuICAgIGlmICh0ZW1wbGF0ZS5kZXZQYWNrYWdlcz8ubGVuZ3RoKSB7XG4gICAgICBjb25zb2xlLmxvZyhgICBucG0gaW5zdGFsbCAtRCAke3RlbXBsYXRlLmRldlBhY2thZ2VzLmpvaW4oJyAnKX1gKVxuICAgIH1cbiAgICBjb25zb2xlLmxvZygpXG4gICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oYOKchSAke21vZHVsZU5hbWV9IGFkZGVkIHN1Y2Nlc3NmdWxseSFgKSlcbiAgICBjb25zb2xlLmxvZygpXG4gIH0pXG5cbi8vIOKUgOKUgOKUgCBUZW1wbGF0ZSBDb250ZW50IEZ1bmN0aW9ucyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZnVuY3Rpb24gZ2V0UHJpc21hU2NoZW1hQ29udGVudCgpOiBzdHJpbmcge1xuICByZXR1cm4gYC8vIER5bmFtaWMgRm9ybSBFbmdpbmUg4oCUIFByaXNtYSBTY2hlbWFcbi8vIE1lcmdlIHRoaXMgd2l0aCB5b3VyIGV4aXN0aW5nIHNjaGVtYS5wcmlzbWEsIHRoZW4gcnVuOlxuLy8gbnB4IHByaXNtYSBtaWdyYXRlIGRldiAtLW5hbWUgYWRkLWRmZS10YWJsZXNcblxubW9kZWwgRGZlRm9ybSB7XG4gIGlkICAgICAgICAgIFN0cmluZyAgIEBpZCBAZGVmYXVsdCh1dWlkKCkpXG4gIHNsdWcgICAgICAgIFN0cmluZyAgIEB1bmlxdWVcbiAgdGl0bGUgICAgICAgU3RyaW5nXG4gIGRlc2NyaXB0aW9uIFN0cmluZz9cbiAgY3JlYXRlZEF0ICAgRGF0ZVRpbWUgQGRlZmF1bHQobm93KCkpXG4gIHVwZGF0ZWRBdCAgIERhdGVUaW1lIEB1cGRhdGVkQXRcblxuICB2ZXJzaW9ucyAgICBEZmVGb3JtVmVyc2lvbltdXG4gIHN1Ym1pc3Npb25zIERmZVN1Ym1pc3Npb25bXVxuXG4gIEBAbWFwKFwiZGZlX2Zvcm1zXCIpXG59XG5cbm1vZGVsIERmZUZvcm1WZXJzaW9uIHtcbiAgaWQgICAgICAgIFN0cmluZyAgIEBpZCBAZGVmYXVsdCh1dWlkKCkpXG4gIGZvcm1JZCAgICBTdHJpbmdcbiAgdmVyc2lvbiAgIEludCAgICAgIEBkZWZhdWx0KDEpXG4gIHN0YXR1cyAgICBTdHJpbmcgICBAZGVmYXVsdChcIkRSQUZUXCIpXG4gIGNyZWF0ZWRBdCBEYXRlVGltZSBAZGVmYXVsdChub3coKSlcblxuICBmb3JtICAgRGZlRm9ybSAgICAgQHJlbGF0aW9uKGZpZWxkczogW2Zvcm1JZF0sIHJlZmVyZW5jZXM6IFtpZF0sIG9uRGVsZXRlOiBDYXNjYWRlKVxuICBzdGVwcyAgRGZlU3RlcFtdXG4gIGZpZWxkcyBEZmVGaWVsZFtdXG5cbiAgQEB1bmlxdWUoW2Zvcm1JZCwgdmVyc2lvbl0pXG4gIEBAbWFwKFwiZGZlX2Zvcm1fdmVyc2lvbnNcIilcbn1cblxubW9kZWwgRGZlU3RlcCB7XG4gIGlkICAgICAgICAgIFN0cmluZyAgQGlkIEBkZWZhdWx0KHV1aWQoKSlcbiAgdmVyc2lvbklkICAgU3RyaW5nXG4gIHRpdGxlICAgICAgIFN0cmluZ1xuICBkZXNjcmlwdGlvbiBTdHJpbmc/XG4gIG9yZGVyICAgICAgIEludCAgICAgQGRlZmF1bHQoMClcbiAgY29uZGl0aW9ucyAgSnNvbj9cbiAgY29uZmlnICAgICAgSnNvbj9cblxuICB2ZXJzaW9uIERmZUZvcm1WZXJzaW9uIEByZWxhdGlvbihmaWVsZHM6IFt2ZXJzaW9uSWRdLCByZWZlcmVuY2VzOiBbaWRdLCBvbkRlbGV0ZTogQ2FzY2FkZSlcbiAgZmllbGRzICBEZmVGaWVsZFtdXG5cbiAgQEBtYXAoXCJkZmVfc3RlcHNcIilcbn1cblxubW9kZWwgRGZlRmllbGQge1xuICBpZCAgICAgICAgICAgIFN0cmluZyAgQGlkIEBkZWZhdWx0KHV1aWQoKSlcbiAgdmVyc2lvbklkICAgICBTdHJpbmdcbiAgc3RlcElkICAgICAgICBTdHJpbmc/XG4gIHNlY3Rpb25JZCAgICAgU3RyaW5nP1xuICBwYXJlbnRGaWVsZElkIFN0cmluZz9cbiAga2V5ICAgICAgICAgICBTdHJpbmdcbiAgbGFiZWwgICAgICAgICBTdHJpbmdcbiAgZGVzY3JpcHRpb24gICBTdHJpbmc/XG4gIHR5cGUgICAgICAgICAgU3RyaW5nXG4gIHJlcXVpcmVkICAgICAgQm9vbGVhbiBAZGVmYXVsdChmYWxzZSlcbiAgb3JkZXIgICAgICAgICBJbnQgICAgIEBkZWZhdWx0KDApXG4gIGNvbmZpZyAgICAgICAgSnNvbiAgICBAZGVmYXVsdChcInt9XCIpXG4gIGNvbmRpdGlvbnMgICAgSnNvbj9cblxuICB2ZXJzaW9uICBEZmVGb3JtVmVyc2lvbiBAcmVsYXRpb24oZmllbGRzOiBbdmVyc2lvbklkXSwgcmVmZXJlbmNlczogW2lkXSwgb25EZWxldGU6IENhc2NhZGUpXG4gIHN0ZXAgICAgIERmZVN0ZXA/ICAgICAgIEByZWxhdGlvbihmaWVsZHM6IFtzdGVwSWRdLCByZWZlcmVuY2VzOiBbaWRdKVxuICBwYXJlbnQgICBEZmVGaWVsZD8gICAgICBAcmVsYXRpb24oXCJGaWVsZENoaWxkcmVuXCIsIGZpZWxkczogW3BhcmVudEZpZWxkSWRdLCByZWZlcmVuY2VzOiBbaWRdKVxuICBjaGlsZHJlbiBEZmVGaWVsZFtdICAgICBAcmVsYXRpb24oXCJGaWVsZENoaWxkcmVuXCIpXG4gIG9wdGlvbnMgIERmZUZpZWxkT3B0aW9uW11cblxuICBAQHVuaXF1ZShbdmVyc2lvbklkLCBrZXldKVxuICBAQG1hcChcImRmZV9maWVsZHNcIilcbn1cblxubW9kZWwgRGZlRmllbGRPcHRpb24ge1xuICBpZCAgICAgIFN0cmluZyBAaWQgQGRlZmF1bHQodXVpZCgpKVxuICBmaWVsZElkIFN0cmluZ1xuICBsYWJlbCAgIFN0cmluZ1xuICB2YWx1ZSAgIFN0cmluZ1xuICBtZXRhICAgIEpzb24/XG4gIG9yZGVyICAgSW50ICAgIEBkZWZhdWx0KDApXG5cbiAgZmllbGQgRGZlRmllbGQgQHJlbGF0aW9uKGZpZWxkczogW2ZpZWxkSWRdLCByZWZlcmVuY2VzOiBbaWRdLCBvbkRlbGV0ZTogQ2FzY2FkZSlcblxuICBAQG1hcChcImRmZV9maWVsZF9vcHRpb25zXCIpXG59XG5cbm1vZGVsIERmZVN1Ym1pc3Npb24ge1xuICBpZCAgICAgICAgICAgIFN0cmluZyAgIEBpZCBAZGVmYXVsdCh1dWlkKCkpXG4gIGZvcm1JZCAgICAgICAgU3RyaW5nXG4gIHZlcnNpb25JZCAgICAgU3RyaW5nXG4gIHVzZXJJZCAgICAgICAgU3RyaW5nXG4gIHN0YXR1cyAgICAgICAgU3RyaW5nICAgQGRlZmF1bHQoXCJJTl9QUk9HUkVTU1wiKVxuICBjdXJyZW50U3RlcElkIFN0cmluZz9cbiAgY29udGV4dCAgICAgICBKc29uICAgICBAZGVmYXVsdChcInt9XCIpXG4gIGNyZWF0ZWRBdCAgICAgRGF0ZVRpbWUgQGRlZmF1bHQobm93KCkpXG4gIHVwZGF0ZWRBdCAgICAgRGF0ZVRpbWUgQHVwZGF0ZWRBdFxuXG4gIGZvcm0gRGZlRm9ybSBAcmVsYXRpb24oZmllbGRzOiBbZm9ybUlkXSwgcmVmZXJlbmNlczogW2lkXSlcblxuICBAQGluZGV4KFtmb3JtSWQsIHVzZXJJZF0pXG4gIEBAbWFwKFwiZGZlX3N1Ym1pc3Npb25zXCIpXG59XG5gXG59XG5cbmZ1bmN0aW9uIGdldERyaXp6bGVTY2hlbWFDb250ZW50KCk6IHN0cmluZyB7XG4gIHJldHVybiBgLy8gRHluYW1pYyBGb3JtIEVuZ2luZSDigJQgRHJpenpsZSBTY2hlbWFcbi8vIEltcG9ydCBhbmQgdXNlIHdpdGggeW91ciBEcml6emxlIG1pZ3JhdGlvbnMuXG5cbmltcG9ydCB7XG4gIGRmZUZvcm1zLCBkZmVGb3JtVmVyc2lvbnMsIGRmZVN0ZXBzLCBkZmVGaWVsZHMsXG4gIGRmZUZpZWxkT3B0aW9ucywgZGZlU3VibWlzc2lvbnMsXG59IGZyb20gJyR7T1JHX1NDT1BFfS9kZmUtZHJpenpsZS9zY2hlbWEnXG5cbi8vIFJlLWV4cG9ydCBmb3IgeW91ciBtaWdyYXRpb24gY29uZmlnXG5leHBvcnQge1xuICBkZmVGb3JtcywgZGZlRm9ybVZlcnNpb25zLCBkZmVTdGVwcywgZGZlRmllbGRzLFxuICBkZmVGaWVsZE9wdGlvbnMsIGRmZVN1Ym1pc3Npb25zLFxufVxuYFxufVxuXG5mdW5jdGlvbiBnZXRFeHByZXNzUm91dGVDb250ZW50KCk6IHN0cmluZyB7XG4gIHJldHVybiBgLy8gRHluYW1pYyBGb3JtIEVuZ2luZSDigJQgRXhwcmVzcyBSb3V0ZXNcbi8vIE1vdW50IHRoaXMgcm91dGVyIGluIHlvdXIgRXhwcmVzcyBhcHAuXG5cbmltcG9ydCB7IGNyZWF0ZURmZVJvdXRlciB9IGZyb20gJyR7T1JHX1NDT1BFfS9kZmUtZXhwcmVzcydcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VBZGFwdGVyIH0gZnJvbSAnJHtPUkdfU0NPUEV9L2RmZS1zZXJ2ZXInXG5cbi8qKlxuICogQ3JlYXRlIGFuZCBjb25maWd1cmUgdGhlIERGRSBFeHByZXNzIHJvdXRlci5cbiAqXG4gKiBAcGFyYW0gZGIgLSBZb3VyIERhdGFiYXNlQWRhcHRlciBpbnN0YW5jZSAoUHJpc21hRGF0YWJhc2VBZGFwdGVyIG9yIERyaXp6bGVEYXRhYmFzZUFkYXB0ZXIpXG4gKlxuICogVXNhZ2UgaW4geW91ciBhcHA6XG4gKiBcXGBcXGBcXGB0c1xuICogaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcydcbiAqIGltcG9ydCB7IFByaXNtYURhdGFiYXNlQWRhcHRlciB9IGZyb20gJyR7T1JHX1NDT1BFfS9kZmUtcHJpc21hJ1xuICogaW1wb3J0IHsgY3JlYXRlRGZlUm91dGVzIH0gZnJvbSAnLi9yb3V0ZXMvZGZlJ1xuICpcbiAqIGNvbnN0IGFwcCA9IGV4cHJlc3MoKVxuICogY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpXG4gKiBjb25zdCBkYiA9IG5ldyBQcmlzbWFEYXRhYmFzZUFkYXB0ZXIocHJpc21hKVxuICpcbiAqIGFwcC51c2UoZXhwcmVzcy5qc29uKCkpXG4gKiBhcHAudXNlKCcvYXBpJywgY3JlYXRlRGZlUm91dGVzKGRiKSlcbiAqIFxcYFxcYFxcYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGZlUm91dGVzKGRiOiBEYXRhYmFzZUFkYXB0ZXIpIHtcbiAgcmV0dXJuIGNyZWF0ZURmZVJvdXRlcih7XG4gICAgZGIsXG4gICAgZ2V0VXNlcklkOiAocmVxKSA9PiB7XG4gICAgICAvLyBUT0RPOiBFeHRyYWN0IHVzZXIgSUQgZnJvbSB5b3VyIGF1dGggbWlkZGxld2FyZVxuICAgICAgcmV0dXJuIChyZXEgYXMgYW55KS51c2VyPy5pZCA/PyAnYW5vbnltb3VzJ1xuICAgIH0sXG4gICAgcHJlZml4OiAnL2RmZScsXG4gIH0pXG59XG5gXG59XG5cbmZ1bmN0aW9uIGdldFJlYWN0SG9va3NDb250ZW50KCk6IHN0cmluZyB7XG4gIHJldHVybiBgLy8gRHluYW1pYyBGb3JtIEVuZ2luZSDigJQgUmVhY3QgSG9va3Ncbi8vIFByZS1jb25maWd1cmVkIGhvb2tzIGZvciB5b3VyIGFwcGxpY2F0aW9uLlxuXG5leHBvcnQge1xuICB1c2VGb3JtRW5naW5lLFxuICB1c2VGb3JtU3RlcHBlcixcbiAgdXNlRm9ybVJ1bnRpbWUsXG4gIHVzZUR5bmFtaWNPcHRpb25zLFxufSBmcm9tICcke09SR19TQ09QRX0vZGZlLXJlYWN0J1xuXG5leHBvcnQgdHlwZSB7XG4gIFVzZUZvcm1FbmdpbmVPcHRpb25zLFxuICBVc2VGb3JtU3RlcHBlck9wdGlvbnMsXG4gIFVzZUZvcm1SdW50aW1lT3B0aW9ucyxcbiAgVXNlRHluYW1pY09wdGlvbnNDb25maWcsXG59IGZyb20gJyR7T1JHX1NDT1BFfS9kZmUtcmVhY3QnXG5cbi8vIFRpcDogSW1wb3J0IHRoZSBkZWZhdWx0IGNvbXBvbmVudHMgaWYgeW91IHdhbnQgcXVpY2sgcHJvdG90eXBpbmc6XG4vLyBpbXBvcnQgeyBEZmVGb3JtUmVuZGVyZXIsIERmZVN0ZXBJbmRpY2F0b3IgfSBmcm9tICcke09SR19TQ09QRX0vZGZlLXJlYWN0L2NvbXBvbmVudHMnXG5gXG59XG5cbmZ1bmN0aW9uIGdldFJlYWN0Q29tcG9uZW50Q29udGVudCgpOiBzdHJpbmcge1xuICByZXR1cm4gYC8vIER5bmFtaWMgRm9ybSBFbmdpbmUg4oCUIEV4YW1wbGUgRm9ybSBDb21wb25lbnRcbi8vIEEgY29tcGxldGUgbXVsdGktc3RlcCBmb3JtIHVzaW5nIERGRSBob29rcy5cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRm9ybUVuZ2luZSwgdXNlRm9ybVN0ZXBwZXIsIHVzZUZvcm1SdW50aW1lIH0gZnJvbSAnJHtPUkdfU0NPUEV9L2RmZS1yZWFjdCdcbmltcG9ydCB0eXBlIHsgRm9ybUZpZWxkLCBGb3JtU3RlcCB9IGZyb20gJyR7T1JHX1NDT1BFfS9kZmUtcmVhY3QnXG5cbmludGVyZmFjZSBEZmVGb3JtUHJvcHMge1xuICBmaWVsZHM6IEZvcm1GaWVsZFtdXG4gIHN0ZXBzOiBGb3JtU3RlcFtdXG4gIGZvcm1JZDogc3RyaW5nXG4gIHZlcnNpb25JZDogc3RyaW5nXG4gIGFwaUJhc2VVcmw6IHN0cmluZ1xuICBvbkNvbXBsZXRlPzogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gRGZlRm9ybSh7XG4gIGZpZWxkcywgc3RlcHMsIGZvcm1JZCwgdmVyc2lvbklkLCBhcGlCYXNlVXJsLCBvbkNvbXBsZXRlLFxufTogRGZlRm9ybVByb3BzKSB7XG4gIGNvbnN0IGVuZ2luZSA9IHVzZUZvcm1FbmdpbmUoeyBmaWVsZHMgfSlcbiAgY29uc3Qgc3RlcHBlciA9IHVzZUZvcm1TdGVwcGVyKHsgc3RlcHMsIGVuZ2luZTogZW5naW5lLmVuZ2luZSB9KVxuICBjb25zdCBydW50aW1lID0gdXNlRm9ybVJ1bnRpbWUoeyBiYXNlVXJsOiBhcGlCYXNlVXJsLCBmb3JtSWQsIHZlcnNpb25JZCB9KVxuXG4gIC8vIENyZWF0ZSBzdWJtaXNzaW9uIG9uIG1vdW50XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgcnVudGltZS5jcmVhdGVTdWJtaXNzaW9uKClcbiAgfSwgW10pXG5cbiAgY29uc3QgY3VycmVudEZpZWxkcyA9IGVuZ2luZS52aXNpYmxlRmllbGRzLmZpbHRlcihcbiAgICBmID0+IGYuc3RlcElkID09PSBzdGVwcGVyLmN1cnJlbnRTdGVwPy5zdGVwLmlkXG4gIClcblxuICBjb25zdCBoYW5kbGVOZXh0ID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHN0ZXBJZCA9IHN0ZXBwZXIuY3VycmVudFN0ZXA/LnN0ZXAuaWRcbiAgICBpZiAoIXN0ZXBJZCkgcmV0dXJuXG5cbiAgICAvLyBWYWxpZGF0ZSBjdXJyZW50IHN0ZXBcbiAgICBjb25zdCB2YWxpZGF0aW9uID0gZW5naW5lLnZhbGlkYXRlU3RlcChzdGVwSWQpXG4gICAgaWYgKCF2YWxpZGF0aW9uLnN1Y2Nlc3MpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1ZhbGlkYXRpb24gZXJyb3JzOicsIHZhbGlkYXRpb24uZXJyb3JzKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gU3VibWl0IHN0ZXAgdG8gYmFja2VuZFxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJ1bnRpbWUuc3VibWl0U3RlcChzdGVwSWQsIGVuZ2luZS52YWx1ZXMpXG4gICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICBzdGVwcGVyLm1hcmtDb21wbGV0ZShzdGVwSWQpXG5cbiAgICAgIGlmIChzdGVwcGVyLmlzTGFzdFN0ZXApIHtcbiAgICAgICAgYXdhaXQgcnVudGltZS5jb21wbGV0ZVN1Ym1pc3Npb24oKVxuICAgICAgICBvbkNvbXBsZXRlPy4oKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RlcHBlci5nb05leHQoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIDxoMj57c3RlcHBlci5jdXJyZW50U3RlcD8uc3RlcC50aXRsZX08L2gyPlxuICAgICAgPHA+U3RlcCB7c3RlcHBlci5wcm9ncmVzcy5jdXJyZW50fSBvZiB7c3RlcHBlci5wcm9ncmVzcy50b3RhbH08L3A+XG5cbiAgICAgIHtjdXJyZW50RmllbGRzLm1hcChmaWVsZCA9PiAoXG4gICAgICAgIDxkaXYga2V5PXtmaWVsZC5rZXl9IHN0eWxlPXt7IG1hcmdpbkJvdHRvbTogJzFyZW0nIH19PlxuICAgICAgICAgIDxsYWJlbD57ZmllbGQubGFiZWx9e2ZpZWxkLnJlcXVpcmVkICYmICcgKid9PC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgIHZhbHVlPXsoZW5naW5lLnZhbHVlc1tmaWVsZC5rZXldIGFzIHN0cmluZykgPz8gJyd9XG4gICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBlbmdpbmUuc2V0RmllbGRWYWx1ZShmaWVsZC5rZXksIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkpfVxuXG4gICAgICB7cnVudGltZS5lcnJvciAmJiA8cCBzdHlsZT17eyBjb2xvcjogJ3JlZCcgfX0+e3J1bnRpbWUuZXJyb3J9PC9wPn1cblxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGdhcDogJzFyZW0nLCBtYXJnaW5Ub3A6ICcycmVtJyB9fT5cbiAgICAgICAge3N0ZXBwZXIuY2FuR29CYWNrICYmIChcbiAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3N0ZXBwZXIuZ29CYWNrfT5CYWNrPC9idXR0b24+XG4gICAgICAgICl9XG4gICAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlTmV4dH0gZGlzYWJsZWQ9e3J1bnRpbWUuaXNTdWJtaXR0aW5nfT5cbiAgICAgICAgICB7c3RlcHBlci5pc0xhc3RTdGVwID8gJ1N1Ym1pdCcgOiAnTmV4dCd9XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIClcbn1cbmBcbn1cbiJdfQ==