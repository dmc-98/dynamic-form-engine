import { ORG_SCOPE } from './constants'

export function getPrismaSchemaContent(): string {
  return `// Dynamic Form Engine — Prisma Schema
// Merge this into your existing schema.prisma, then run your Prisma migration flow.

model DfeForm {
  id          String   @id @default(uuid())
  tenantId    String?
  slug        String
  title       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  versions        DfeFormVersion[]
  submissions     DfeSubmission[]
  analyticsEvents DfeAnalyticsEvent[]
  experiments     DfeExperiment[]

  @@unique([tenantId, slug])
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
  tenantId      String?
  formId        String
  versionId     String
  userId        String
  status        String   @default("IN_PROGRESS")
  currentStepId String?
  context       Json     @default("{}")
  experimentId  String?
  variantId     String?
  variantKey    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  form       DfeForm               @relation(fields: [formId], references: [id])
  experiment DfeExperiment?        @relation(fields: [experimentId], references: [id], onDelete: SetNull)
  variant    DfeExperimentVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@index([formId, userId])
  @@index([tenantId, createdAt])
  @@map("dfe_submissions")
}

model DfeExperiment {
  id        String   @id @default(uuid())
  formId    String
  tenantId  String?
  name      String
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  form            DfeForm                @relation(fields: [formId], references: [id], onDelete: Cascade)
  variants        DfeExperimentVariant[]
  submissions     DfeSubmission[]
  analyticsEvents DfeAnalyticsEvent[]

  @@index([formId, status])
  @@index([tenantId, status])
  @@map("dfe_experiments")
}

model DfeExperimentVariant {
  id            String @id @default(uuid())
  experimentId  String
  key           String
  label         String
  weight        Int    @default(1)
  overrides     Json?

  experiment     DfeExperiment      @relation(fields: [experimentId], references: [id], onDelete: Cascade)
  submissions    DfeSubmission[]
  analyticsEvents DfeAnalyticsEvent[]

  @@unique([experimentId, key])
  @@map("dfe_experiment_variants")
}

model DfeAnalyticsEvent {
  id           String   @id @default(uuid())
  tenantId     String?
  formId       String
  submissionId String?
  event        String
  stepId       String?
  fieldKey     String?
  experimentId String?
  variantId    String?
  variantKey   String?
  metadata     Json?
  occurredAt   DateTime @default(now())

  form       DfeForm               @relation(fields: [formId], references: [id], onDelete: Cascade)
  experiment DfeExperiment?        @relation(fields: [experimentId], references: [id], onDelete: SetNull)
  variant    DfeExperimentVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@index([tenantId, formId, occurredAt])
  @@index([submissionId, occurredAt])
  @@index([event, occurredAt])
  @@map("dfe_analytics_events")
}
`
}

export function getDrizzleSchemaContent(): string {
  return `// Dynamic Form Engine — Drizzle Schema
// Re-export these tables from the schema entrypoint that your drizzle config uses.

import {
  dfeForms, dfeFormVersions, dfeSteps, dfeFields,
  dfeFieldOptions, dfeSubmissions,
  dfeExperiments, dfeExperimentVariants, dfeAnalyticsEvents,
} from '${ORG_SCOPE}/dfe-drizzle/schema'

export {
  dfeForms, dfeFormVersions, dfeSteps, dfeFields,
  dfeFieldOptions, dfeSubmissions,
  dfeExperiments, dfeExperimentVariants, dfeAnalyticsEvents,
}
`
}
