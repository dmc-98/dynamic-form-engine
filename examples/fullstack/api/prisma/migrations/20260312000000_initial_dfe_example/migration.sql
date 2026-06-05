-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "dfe_forms" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dfe_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfe_form_versions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dfe_form_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfe_steps" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "config" JSONB,

    CONSTRAINT "dfe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfe_fields" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "stepId" TEXT,
    "sectionId" TEXT,
    "parentFieldId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "conditions" JSONB,

    CONSTRAINT "dfe_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfe_field_options" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "meta" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dfe_field_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfe_submissions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStepId" TEXT,
    "context" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dfe_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dfe_forms_slug_key" ON "dfe_forms"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "dfe_form_versions_formId_version_key" ON "dfe_form_versions"("formId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "dfe_fields_versionId_key_key" ON "dfe_fields"("versionId", "key");

-- CreateIndex
CREATE INDEX "dfe_submissions_formId_userId_idx" ON "dfe_submissions"("formId", "userId");

-- AddForeignKey
ALTER TABLE "dfe_form_versions" ADD CONSTRAINT "dfe_form_versions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "dfe_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_steps" ADD CONSTRAINT "dfe_steps_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "dfe_form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_fields" ADD CONSTRAINT "dfe_fields_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "dfe_form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_fields" ADD CONSTRAINT "dfe_fields_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "dfe_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_fields" ADD CONSTRAINT "dfe_fields_parentFieldId_fkey" FOREIGN KEY ("parentFieldId") REFERENCES "dfe_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_field_options" ADD CONSTRAINT "dfe_field_options_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "dfe_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_submissions" ADD CONSTRAINT "dfe_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "dfe_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
