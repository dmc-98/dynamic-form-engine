-- Durable collaboration store support for the serverless collaboration example.

-- CreateTable
CREATE TABLE "dfe_collaboration_sessions" (
  "sessionId" TEXT NOT NULL,
  "tenantId" TEXT,
  "formId" TEXT,
  "versionId" TEXT,
  "submissionId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "lastSequence" INTEGER NOT NULL DEFAULT 0,
  "snapshot" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dfe_collaboration_sessions_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "dfe_collaboration_events" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "actorId" TEXT,
  "kind" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dfe_collaboration_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfe_collaboration_presence" (
  "sessionId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "color" TEXT,
  "activeFieldKey" TEXT,
  "state" TEXT NOT NULL,
  "metadata" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dfe_collaboration_presence_pkey" PRIMARY KEY ("sessionId", "actorId")
);

-- CreateIndex
CREATE INDEX "dfe_collaboration_sessions_tenantId_updatedAt_idx" ON "dfe_collaboration_sessions"("tenantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "dfe_collaboration_events_sessionId_sequence_key" ON "dfe_collaboration_events"("sessionId", "sequence");

-- CreateIndex
CREATE INDEX "dfe_collaboration_events_sessionId_createdAt_idx" ON "dfe_collaboration_events"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "dfe_collaboration_presence_sessionId_updatedAt_idx" ON "dfe_collaboration_presence"("sessionId", "updatedAt");

-- AddForeignKey
ALTER TABLE "dfe_collaboration_events"
  ADD CONSTRAINT "dfe_collaboration_events_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "dfe_collaboration_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfe_collaboration_presence"
  ADD CONSTRAINT "dfe_collaboration_presence_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "dfe_collaboration_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;
