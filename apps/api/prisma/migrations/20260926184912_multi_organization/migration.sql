-- Multi-organización (ADR 0005) y embeddings bge-m3 de 1024 dimensiones (ADR 0008).
-- Se aplica sobre una base de datos sin datos de negocio: las columnas organizationId son
-- obligatorias y el enum TicketCategory se reemplaza por la tabla Category.

-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('WEB', 'EMAIL', 'MOBILE', 'IMPORT');

-- CreateEnum
CREATE TYPE "TicketEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'PRIORITY_CHANGED', 'CATEGORY_CHANGED', 'AI_CLASSIFIED', 'COMMENTED', 'IMPORTED');

-- DropIndex
DROP INDEX "Ticket_status_idx";

-- AlterTable
ALTER TABLE "AiSuggestion" ADD COLUMN     "promptVersion" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "isInternal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "KnowledgeDocument" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "aiCategory",
DROP COLUMN "category",
ADD COLUMN     "aiCategoryId" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "embedding" vector(1024),
ADD COLUMN     "embeddingModel" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "importJobId" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "resolution" TEXT,
ADD COLUMN     "source" "TicketSource" NOT NULL DEFAULT 'WEB';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "TicketCategory";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "TicketEventType" NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "responseMinutes" INTEGER NOT NULL,
    "resolutionMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlaPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_organizationId_name_key" ON "Category"("organizationId", "name");

-- CreateIndex
CREATE INDEX "TicketEvent_ticketId_createdAt_idx" ON "TicketEvent"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SlaPolicy_organizationId_priority_key" ON "SlaPolicy"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_organizationId_idx" ON "KnowledgeDocument"("organizationId");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_status_idx" ON "Ticket"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_organizationId_externalSource_externalId_key" ON "Ticket"("organizationId", "externalSource", "externalId");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_aiCategoryId_fkey" FOREIGN KEY ("aiCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaPolicy" ADD CONSTRAINT "SlaPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Prisma no detecta cambios en columnas Unsupported("vector(n)"), así que el cambio de
-- dimensión de los fragmentos se escribe a mano. Sobre una tabla con vectores de 768
-- dimensiones fallaría: en ese caso hay que borrar los vectores y reindexar.
ALTER TABLE "DocumentChunk" ALTER COLUMN "embedding" TYPE vector(1024);
