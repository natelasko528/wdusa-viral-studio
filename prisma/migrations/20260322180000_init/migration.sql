-- CreateEnum
CREATE TYPE "SourceSite" AS ENUM ('nate_landing', 'corporate');

-- CreateEnum
CREATE TYPE "RenderJobStatus" AS ENUM ('queued', 'rendering', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "ScheduledPostStatus" AS ENUM ('pending', 'scheduled', 'failed');

-- CreateTable
CREATE TABLE "SourcePage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceSite" "SourceSite" NOT NULL,
    "title" TEXT,
    "rawText" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourcePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbFact" (
    "id" TEXT NOT NULL,
    "sourcePageId" TEXT,
    "sourceSite" "SourceSite" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "campaignProfiles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KbFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creatomateTemplateId" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL DEFAULT '9:16',
    "defaultModifications" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenderJob" (
    "id" TEXT NOT NULL,
    "status" "RenderJobStatus" NOT NULL DEFAULT 'queued',
    "creatomateRenderId" TEXT,
    "outputUrl" TEXT,
    "error" TEXT,
    "inputSnapshot" JSONB NOT NULL,
    "campaignProfile" TEXT NOT NULL,
    "videoTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "renderJobId" TEXT NOT NULL,
    "ghlPostId" TEXT,
    "accountIds" JSONB NOT NULL,
    "scheduleDate" TIMESTAMP(3) NOT NULL,
    "caption" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "postType" TEXT NOT NULL,
    "status" "ScheduledPostStatus" NOT NULL DEFAULT 'pending',
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KbFact" ADD CONSTRAINT "KbFact_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "SourcePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenderJob" ADD CONSTRAINT "RenderJob_videoTemplateId_fkey" FOREIGN KEY ("videoTemplateId") REFERENCES "VideoTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_renderJobId_fkey" FOREIGN KEY ("renderJobId") REFERENCES "RenderJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "KbFact_sourceSite_idx" ON "KbFact"("sourceSite");

-- CreateIndex
CREATE INDEX "KbFact_category_idx" ON "KbFact"("category");
