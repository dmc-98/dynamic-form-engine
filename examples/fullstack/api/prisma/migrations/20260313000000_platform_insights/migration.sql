-- Multi-tenant, analytics, and experiment support for the fullstack example.

-- AlterTable
ALTER TABLE "dfe_forms" ADD COLUMN "tenantId" TEXT;

-- AlterTable
ALTER TABLE "dfe_submissions"
  ADD COLUMN "tenantId" TEXT,
  ADD COLUMN "experimentId" TEXT,
  ADD COLUMN "variantId" TEXT,
  ADD COLUMN "variantKey" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "dfe_forms_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "dfe_forms_tenantId_slug_key" ON "dfe_forms"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "dfe_forms_tenantId_updatedAt_idx" ON "dfe_forms"("tenantId", "updatedAt");

-- CreateTable
CREATE TABLE "dfe_experiments" (
  "id" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "tenantId" TEXT,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dfe_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfe_experiment_variants" (
  "id" TEXT NOT NULL,
  "experimentId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "weight" INTEGER NOT NULL DEFAULT 1,
  "overrides" JSONB,

  CONSTRAINT "dfe_experiment_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfe_analytics_events" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "formId" TEXT NOT NULL,
  "submissionId" TEXT,
  "event" TEXT NOT NULL,
  "stepId" TEXT,
  "fieldKey" TEXT,
  "experimentId" TEXT,
  "variantId" TEXT,
  "variantKey" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dfe_analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dfe_submissions_tenantId_createdAt_idx" ON "dfe_submissions"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "dfe_submissions_experimentId_variantId_idx" ON "dfe_submissions"("experimentId", "variantId");

-- CreateIndex
CREATE INDEX "dfe_experiments_formId_status_idx" ON "dfe_experiments"("formId", "status");

-- CreateIndex
CREATE INDEX "dfe_experiments_tenantId_status_idx" ON "dfe_experiments"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dfe_experiment_variants_experimentId_key_key" ON "dfe_experiment_variants"("experimentId", "key");

-- CreateIndex
CREATE INDEX "dfe_analytics_events_tenantId_formId_occurredAt_idx" ON "dfe_analytics_events"("tenantId", "formId", "occurredAt");

-- CreateIndex
CREATE INDEX "dfe_analytics_events_submissionId_occurredAt_idx" ON "dfe_analytics_events"("submissionId", "occurredAt");

-- CreateIndex
CREATE INDEX "dfe_analytics_events_event_occurredAt_idx" ON "dfe_analytics_events"("event", "occurredAt");

-- AddForeignKey
ALTER TABLE "dfe_experiments"
  ADD CONSTRAINT "dfe_experiments_formId_fkey"
  FOREIGN KEY ("formId") REFERENCES "dfe_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_experiment_variants"
  ADD CONSTRAINT "dfe_experiment_variants_experimentId_fkey"
  FOREIGN KEY ("experimentId") REFERENCES "dfe_experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_submissions"
  ADD CONSTRAINT "dfe_submissions_experimentId_fkey"
  FOREIGN KEY ("experimentId") REFERENCES "dfe_experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_submissions"
  ADD CONSTRAINT "dfe_submissions_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "dfe_experiment_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_analytics_events"
  ADD CONSTRAINT "dfe_analytics_events_formId_fkey"
  FOREIGN KEY ("formId") REFERENCES "dfe_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_analytics_events"
  ADD CONSTRAINT "dfe_analytics_events_experimentId_fkey"
  FOREIGN KEY ("experimentId") REFERENCES "dfe_experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_analytics_events"
  ADD CONSTRAINT "dfe_analytics_events_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "dfe_experiment_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
