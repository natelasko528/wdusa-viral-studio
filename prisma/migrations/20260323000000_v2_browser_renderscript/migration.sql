-- CreateEnum
CREATE TYPE "BrowserTaskType" AS ENUM ('create_template', 'clone_template', 'export_renderscript');

-- CreateEnum
CREATE TYPE "BrowserTaskStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- AlterTable
ALTER TABLE "VideoTemplate" ADD COLUMN "renderscriptSource" JSONB;

-- CreateTable
CREATE TABLE "BrowserTask" (
    "id" TEXT NOT NULL,
    "type" "BrowserTaskType" NOT NULL,
    "status" "BrowserTaskStatus" NOT NULL DEFAULT 'queued',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrowserTask_status_idx" ON "BrowserTask"("status");

-- CreateIndex
CREATE INDEX "BrowserTask_type_idx" ON "BrowserTask"("type");
